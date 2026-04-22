import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentToken } from '@/lib/paypal';
import { setVault, type VaultPolicy } from '@/lib/paypal-vault-kv';
import { getToken } from '@/lib/beds24-token';

const BEDS24_BASE = 'https://beds24.com/api/v2';

/**
 * POST /api/paypal-confirm-vault
 *
 * Chiamato dalla pagina /[locale]/paypal-return quando PayPal ha redirezionato
 * l'utente indietro dopo l'approvazione vault.
 *
 * Flusso:
 *   1. Converte il setup-token in payment-token permanente (vault_id)
 *   2. Salva il record vault su Upstash KV (status 'pending', chargeAt calcolato)
 *   3. Aggiorna Beds24: status → 'new' + invoice items (type 'charge' only)
 *
 * Body:
 *   {
 *     bookingId:       number
 *     setupTokenId:    string
 *     policy:          'flex'            // unico caso supportato
 *     chargeAt:        string ISO8601    // quando il cron deve addebitare
 *     totalAmount:     number            // € da addebitare a chargeAt
 *     accommodation:   number            // per invoice items type 'charge'
 *     touristTax:      number
 *     discountAmount:  number
 *     voucherCode:     string | null
 *     extras:          Array<{ description, price, quantity }>
 *   }
 */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const {
    bookingId, setupTokenId, policy, chargeAt, totalAmount,
    accommodation, touristTax, discountAmount, voucherCode, extras,
  } = body;

  if (!bookingId || !setupTokenId || !policy || !chargeAt || !totalAmount) {
    return NextResponse.json(
      { error: 'Campi obbligatori: bookingId, setupTokenId, policy, chargeAt, totalAmount' },
      { status: 400 },
    );
  }

  // Validazione policy (solo 'flex' al momento)
  if (policy !== 'flex') {
    return NextResponse.json({ error: `policy non valida: ${policy}` }, { status: 400 });
  }

  // Validazione chargeAt: non nel passato remoto (tolleranza 5 min)
  const chargeAtMs = Date.parse(chargeAt);
  if (!Number.isFinite(chargeAtMs)) {
    return NextResponse.json({ error: 'chargeAt non valida (atteso ISO8601)' }, { status: 400 });
  }

  try {
    // 1. Converti setup-token → payment-token permanente
    const { vaultId, customerId } = await confirmPaymentToken(setupTokenId);
    console.log('[paypal-confirm-vault] vault ok:', { bookingId, vaultId });

    // 2. Salva su KV
    await setVault({
      bookingId:      Number(bookingId),
      vaultId,
      customerId,
      amount:         Number(totalAmount),
      currency:       'EUR',
      policy:         policy as VaultPolicy,
      createdAt:      new Date().toISOString(),
      chargeAt,
      status:         'pending',
      retryCount:     0,
      lastAttemptAt:  null,
      lastError:      null,
      captureId:      null,
      capturedAmount: null,
    });

    // 3. Beds24: status → 'new' + invoice items (solo charge, no payment)
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
        type:        'charge',
        description: voucherCode ? `Soggiorno (voucher: ${voucherCode})` : 'Soggiorno',
        amount:      Number(accommodation),
        qty:         1,
      });
    }
    if (discountAmount && Number(discountAmount) > 0) {
      invoiceItems.push({
        type:        'charge',
        description: `Sconto voucher${voucherCode ? ` (${voucherCode})` : ''}`,
        amount:      -Number(discountAmount),
        qty:         1,
      });
    }
    if (touristTax && Number(touristTax) > 0) {
      invoiceItems.push({
        type:        'charge',
        description: 'Imposta di soggiorno',
        amount:      Number(touristTax),
        qty:         1,
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

    if (invoiceItems.length > 0) {
      await fetch(`${BEDS24_BASE}/bookings`, {
        method:  'POST',
        headers: { token, 'Content-Type': 'application/json' },
        body:    JSON.stringify([{ id: Number(bookingId), invoiceItems }]),
        cache:   'no-store',
      });
    }

    return NextResponse.json({ ok: true, bookingId: Number(bookingId), vaultId, chargeAt });

  } catch (err: any) {
    console.error('[paypal-confirm-vault]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore conferma vault' },
      { status: 500 },
    );
  }
}
