import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { getPaypalAccessToken } from '@/lib/paypal';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const BEDS24_BASE = 'https://beds24.com/api/v2';

// POST /api/paypal-capture
// Cattura l'ordine creato da /api/paypal-order e aggiorna Beds24 (status
// 'new' + invoice items con charge + payment). Nessun vault. Usato da
// Non Rimborsabile (100%) e Rimborsabile (50% upfront — il 50% residuo
// è incassato manualmente al check-in).
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const {
    orderID, bookingId, amount, accommodation, touristTax, discountAmount,
    voucherCode, extras,
  } = body;

  console.log('[paypal-capture] Body:', JSON.stringify({
    accommodation, touristTax, discountAmount, voucherCode,
    extrasCount: Array.isArray(extras) ? extras.length : 0,
  }));

  if (!orderID || !bookingId) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti: orderID, bookingId' }, { status: 400 });
  }

  try {
    const accessToken = await getPaypalAccessToken();

    // 1. Cattura PayPal
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    const rawText = await res.text();
    console.log('[paypal-capture] PayPal status:', res.status, rawText.slice(0, 400));
    if (!res.ok) throw new Error(`PayPal capture fallita (${res.status}): ${rawText.slice(0, 200)}`);

    const data          = JSON.parse(rawText);
    const captureUnit   = data.purchase_units?.[0]?.payments?.captures?.[0];
    const captureID     = captureUnit?.id;
    const captureStatus = captureUnit?.status;
    const capturedAmount = Number(captureUnit?.amount?.value ?? amount ?? 0);

    console.log('[paypal-capture] captureID:', captureID, 'status:', captureStatus, 'amount:', capturedAmount);
    if (captureStatus !== 'COMPLETED') {
      throw new Error(`Pagamento PayPal non completato. Status: ${captureStatus ?? 'sconosciuto'}`);
    }

    const token = await getToken();

    // 2. Aggiorna status a new
    const res1 = await fetch(`${BEDS24_BASE}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: Number(bookingId), status: 'new' }]),
      cache: 'no-store',
    });
    const raw1 = await res1.text();
    console.log('[paypal-capture] Beds24 status POST:', res1.status, raw1.slice(0, 200));

    // 3. Aggiunge charges + payment
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
      type: 'payment',
      description: 'PayPal',
      amount: capturedAmount,
      qty: 1,
    });

    const res2 = await fetch(`${BEDS24_BASE}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: Number(bookingId), invoiceItems }]),
      cache: 'no-store',
    });
    const raw2 = await res2.text();
    console.log('[paypal-capture] Beds24 invoice POST:', res2.status, raw2.slice(0, 300));

    if (!res1.ok || !res2.ok) {
      console.error('[paypal-capture] Beds24 update parzialmente fallita — verificare manualmente');
    }

    return NextResponse.json({
      ok:        true,
      captureID,
      status:    captureStatus,
      bookingId: Number(bookingId),
      amount:    capturedAmount,
    });

  } catch (err: any) {
    console.error('[paypal-capture] Errore:', err.message);
    return NextResponse.json({ error: err.message ?? 'Errore cattura PayPal' }, { status: 500 });
  }
}
