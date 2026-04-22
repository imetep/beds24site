import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentToken, chargeVault } from '@/lib/paypal';
import { setVault } from '@/lib/paypal-vault-kv';
import { getToken } from '@/lib/beds24-token';

const BEDS24_BASE = 'https://beds24.com/api/v2';

/**
 * POST /api/paypal-confirm-vault-and-charge
 *
 * Variante di /api/paypal-confirm-vault per la tariffa **Rimborsabile**:
 * in un colpo solo (a) converte il setup-token in payment-token permanente,
 * (b) addebita subito l'upfront (tipicamente 50%), (c) salva il vault su
 * KV per il cron che addebiterà il residuo 48h prima del check-in.
 *
 * Perché non riusare `/api/paypal-capture` con `saveVault=true`?
 * Perché PayPal con `store_in_vault: ON_SUCCESS` popola `vault.id` in
 * modo asincrono (1-10s, a volte mai in sandbox). Il flow setup-token
 * → payment-token → vault_id è invece sincrono al 100%.
 *
 * Body:
 *   {
 *     bookingId, setupTokenId,
 *     upfrontAmount,          // 50% o altro importo da addebitare ora
 *     residualAmount,          // 50% o altro da addebitare al cron
 *     residualChargeAt,        // ISO8601 UTC (checkIn-48h)
 *     residualPolicy,          // 'rimborsabile-residuo'
 *     accommodation, touristTax, discountAmount, voucherCode, extras,
 *   }
 *
 * Output 200: { ok, bookingId, captureId, capturedAmount, vaultId, residualChargeAt }
 */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const {
    bookingId, setupTokenId,
    upfrontAmount, residualAmount, residualChargeAt, residualPolicy,
    accommodation, touristTax, discountAmount, voucherCode, extras,
  } = body;

  if (!bookingId || !setupTokenId || !upfrontAmount || !residualAmount || !residualChargeAt) {
    return NextResponse.json({
      error: 'Campi obbligatori: bookingId, setupTokenId, upfrontAmount, residualAmount, residualChargeAt',
    }, { status: 400 });
  }
  if (residualPolicy !== 'rimborsabile-residuo') {
    return NextResponse.json({ error: `residualPolicy non valida: ${residualPolicy}` }, { status: 400 });
  }

  try {
    // 1. setup-token → payment-token permanente (sincrono, nessun async)
    const { vaultId, customerId } = await confirmPaymentToken(setupTokenId);
    console.log('[confirm-vault-and-charge] vault ok:', { bookingId, vaultId });

    // 2. Charge immediato upfront via vault_id (merchant-initiated)
    const charge = await chargeVault({
      vaultId,
      amount:      Number(upfrontAmount),
      currency:    'EUR',
      bookingId:   Number(bookingId),
      description: 'LivingApple · acconto soggiorno',
      idempotencyKey: `livingapple-upfront-${bookingId}-${Date.now()}`,
    });
    console.log('[confirm-vault-and-charge] upfront capture ok:', charge);

    // 3. Salva vault per il cron (residuo)
    await setVault({
      bookingId:      Number(bookingId),
      vaultId,
      customerId,
      amount:         Number(residualAmount),
      currency:       'EUR',
      policy:         'rimborsabile-residuo',
      createdAt:      new Date().toISOString(),
      chargeAt:       residualChargeAt,
      status:         'pending',
      retryCount:     0,
      lastAttemptAt:  null,
      lastError:      null,
      captureId:      null,
      capturedAmount: null,
    });

    // 4. Beds24: status=new + invoice (charges + payment upfront)
    const token = await getToken();

    await fetch(`${BEDS24_BASE}/bookings`, {
      method:  'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body:    JSON.stringify([{ id: Number(bookingId), status: 'new' }]),
      cache:   'no-store',
    });

    const invoiceItems: any[] = [];
    if (accommodation && Number(accommodation) > 0) {
      invoiceItems.push({
        type: 'charge',
        description: voucherCode ? `Soggiorno (voucher: ${voucherCode})` : 'Soggiorno',
        amount: Number(accommodation),
        qty: 1,
      });
    }
    if (discountAmount && Number(discountAmount) > 0) {
      invoiceItems.push({
        type: 'charge',
        description: `Sconto voucher${voucherCode ? ` (${voucherCode})` : ''}`,
        amount: -Number(discountAmount),
        qty: 1,
      });
    }
    if (touristTax && Number(touristTax) > 0) {
      invoiceItems.push({
        type: 'charge',
        description: 'Imposta di soggiorno',
        amount: Number(touristTax),
        qty: 1,
      });
    }
    if (Array.isArray(extras)) {
      for (const ex of extras) {
        const price = Number(ex?.price);
        const qty   = Number(ex?.quantity);
        const desc  = typeof ex?.description === 'string' ? ex.description : '';
        if (desc && price > 0 && qty > 0) {
          invoiceItems.push({ type: 'charge', description: desc, amount: price, qty });
        }
      }
    }
    invoiceItems.push({
      type:        'payment',
      description: 'PayPal (acconto)',
      amount:      charge.capturedAmount,
      qty:         1,
    });

    await fetch(`${BEDS24_BASE}/bookings`, {
      method:  'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body:    JSON.stringify([{ id: Number(bookingId), invoiceItems }]),
      cache:   'no-store',
    });

    return NextResponse.json({
      ok:               true,
      bookingId:        Number(bookingId),
      captureId:        charge.captureId,
      capturedAmount:   charge.capturedAmount,
      vaultId,
      residualChargeAt,
    });

  } catch (err: any) {
    console.error('[confirm-vault-and-charge]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore conferma+addebito Rimborsabile' },
      { status: 500 },
    );
  }
}
