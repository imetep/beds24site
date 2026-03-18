import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const BEDS24_BASE = 'https://beds24.com/api/v2';

async function getPaypalAccessToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET non configurati');
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`PayPal auth fallita (${res.status}): ${text.slice(0, 200)}`); }
  return (await res.json()).access_token;
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { orderID, bookingId, amount, accommodation, touristTax, discountAmount, voucherCode } = body;

  console.log('[paypal-capture] Body ricevuto:', JSON.stringify({ accommodation, touristTax, discountAmount, voucherCode }));

  if (!orderID || !bookingId) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti: orderID, bookingId' }, { status: 400 });
  }

  console.log('[paypal-capture] Cattura ordine:', { orderID, bookingId, amount });

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

    const data         = JSON.parse(rawText);
    const captureUnit  = data.purchase_units?.[0]?.payments?.captures?.[0];
    const captureID    = captureUnit?.id;
    const captureStatus = captureUnit?.status;
    const capturedAmount = Number(captureUnit?.amount?.value ?? amount ?? 0);

    console.log('[paypal-capture] captureID:', captureID, 'status:', captureStatus, 'amount:', capturedAmount);
    if (captureStatus !== 'COMPLETED') throw new Error(`Pagamento PayPal non completato. Status: ${captureStatus ?? 'sconosciuto'}`);

    const token = await getToken();

    // 2. Aggiorna status a confirmed
    const statusPayload = [{ id: Number(bookingId), status: 'confirmed' }];
    console.log('[paypal-capture] Beds24 status update:', JSON.stringify(statusPayload));
    const res1 = await fetch(`${BEDS24_BASE}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify(statusPayload),
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

    invoiceItems.push({
      type: 'payment',
      description: 'PayPal',
      amount: capturedAmount,
      qty: 1,
    });

    const invoicePayload = [{ id: Number(bookingId), invoiceItems }];
    console.log('[paypal-capture] Beds24 invoice payload:', JSON.stringify(invoicePayload));
    const res2 = await fetch(`${BEDS24_BASE}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload),
      cache: 'no-store',
    });
    const raw2 = await res2.text();
    console.log('[paypal-capture] Beds24 invoice POST:', res2.status, raw2.slice(0, 300));

    if (!res1.ok || !res2.ok) {
      console.error('[paypal-capture] Beds24 update parzialmente fallita — verificare manualmente');
    }

    return NextResponse.json({ ok: true, captureID, status: captureStatus, bookingId: Number(bookingId), amount: capturedAmount });

  } catch (err: any) {
    console.error('[paypal-capture] Errore:', err.message);
    return NextResponse.json({ error: err.message ?? 'Errore cattura PayPal' }, { status: 500 });
  }
}
