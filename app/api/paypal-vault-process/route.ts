import { NextRequest, NextResponse } from 'next/server';
import { chargeVault } from '@/lib/paypal';
import {
  getVault, updateVault, listDueBookingIds,
  acquireLock, releaseLock,
} from '@/lib/paypal-vault-kv';
import { getToken } from '@/lib/beds24-token';

const BEDS24_BASE = 'https://beds24.com/api/v2';
const MAX_RETRIES = 3;

/**
 * GET /api/paypal-vault-process
 *
 * Cron endpoint — chiamato ogni 30 min da Vercel Cron (vercel.json).
 * Scansiona lo ZSET paypal:vault-due per bookingId con chargeAt <= now e,
 * per ciascuno, addebita il vault_id.
 *
 * Autenticazione:
 *   - Vercel Cron → header x-vercel-cron-signature (trusted su Vercel)
 *   - Trigger manuale → Authorization: Bearer <PAYPAL_CRON_SECRET>
 *
 * Policy:
 *   - Lock paypal:vault-lock TTL 10min impedisce esecuzioni sovrapposte
 *   - Su ogni vault pending: status → processing → {captured|pending(retry)|failed}
 *   - Max 3 retry; dopo, status 'failed' (intervento admin manuale da Beds24)
 *
 * Query:
 *   ?dryRun=1   → non addebita, log soltanto (debugging)
 *
 * Response:
 *   { processed, succeeded, failed, skipped, dryRun }
 */
export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const cronSig = req.headers.get('x-vercel-cron-signature');
  const auth    = req.headers.get('authorization');
  const secret  = process.env.PAYPAL_CRON_SECRET;

  const isVercelCron = Boolean(cronSig);
  const isBearerOk   = Boolean(secret) && auth === `Bearer ${secret}`;

  if (!isVercelCron && !isBearerOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';

  // ── Lock ─────────────────────────────────────────────────────────────────
  const gotLock = await acquireLock(600);
  if (!gotLock) {
    return NextResponse.json({ skipped: true, reason: 'locked' });
  }

  let processed = 0, succeeded = 0, failed = 0, skipped = 0;

  try {
    const now = Date.now();
    const dueIds = await listDueBookingIds(now);
    console.log('[paypal-vault-process] due bookings:', dueIds.length, 'at', new Date(now).toISOString());

    for (const bookingId of dueIds) {
      const vault = await getVault(bookingId);
      if (!vault) { skipped++; continue; }
      if (vault.status !== 'pending') { skipped++; continue; }
      if (vault.retryCount >= MAX_RETRIES) { skipped++; continue; }

      processed++;

      if (dryRun) {
        console.log('[paypal-vault-process] DRY RUN would charge:', { bookingId, amount: vault.amount, policy: vault.policy });
        continue;
      }

      // Segna processing per evitare double pickup
      await updateVault(bookingId, {
        status:        'processing',
        lastAttemptAt: new Date().toISOString(),
      });

      try {
        const idempotencyKey = `livingapple-vault-${bookingId}-${vault.retryCount}`;
        const result = await chargeVault({
          vaultId:     vault.vaultId,
          amount:      vault.amount,
          currency:    vault.currency || 'EUR',
          bookingId,
          description: vault.policy === 'flex'
            ? 'Soggiorno LivingApple (saldo)'
            : 'Residuo soggiorno LivingApple',
          idempotencyKey,
        });

        // Beds24: aggiunge invoice item type 'payment'
        try {
          const token = await getToken();
          await fetch(`${BEDS24_BASE}/bookings`, {
            method:  'POST',
            headers: { token, 'Content-Type': 'application/json' },
            body:    JSON.stringify([{
              id: Number(bookingId),
              invoiceItems: [{
                type:        'payment',
                description: `PayPal (addebito automatico ${vault.policy === 'flex' ? 'saldo' : 'residuo'})`,
                amount:      result.capturedAmount,
                qty:         1,
              }],
            }]),
            cache: 'no-store',
          });
        } catch (b24Err: any) {
          // Non blocchiamo: il pagamento è andato, l'invoice item si può aggiungere a mano
          console.error('[paypal-vault-process] Beds24 invoice update failed (non-blocking):', b24Err.message);
        }

        await updateVault(bookingId, {
          status:         'captured',
          captureId:      result.captureId,
          capturedAmount: result.capturedAmount,
        });
        succeeded++;
        console.log('[paypal-vault-process] ✅ charged', bookingId, '€', result.capturedAmount);

      } catch (chargeErr: any) {
        const nextRetry = vault.retryCount + 1;
        const isFinal   = nextRetry >= MAX_RETRIES;
        await updateVault(bookingId, {
          status:     isFinal ? 'failed' : 'pending',
          retryCount: nextRetry,
          lastError:  String(chargeErr.message ?? chargeErr).slice(0, 500),
        });
        failed++;
        console.error('[paypal-vault-process] ❌ charge failed', bookingId, 'retry', nextRetry, '/', MAX_RETRIES, '-', chargeErr.message);

        if (isFinal) {
          // TODO Fase 3: email admin via servizio SMTP/SendGrid
          console.error('[paypal-vault-process] 🚨 FINAL FAILURE, admin intervention required:', bookingId);
        }
      }
    }

    return NextResponse.json({ processed, succeeded, failed, skipped, dryRun });

  } catch (err: any) {
    console.error('[paypal-vault-process] fatal:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore cron', processed, succeeded, failed, skipped },
      { status: 500 },
    );
  } finally {
    await releaseLock();
  }
}
