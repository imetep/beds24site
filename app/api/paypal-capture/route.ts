import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const BEDS24_BASE = 'https://beds24.com/api/v2';

// ── Ottieni access token PayPal ───────────────────────────────────────────────
async function getPaypalAccessToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET non configurati');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body:  'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth fallita (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── Aggiorna booking Beds24: status confirmed + registra pagamento ─────────────
async function confirmBookingInBeds24(bookingId: number, amount: number): Promise<void> {
  const token = await getToken();

  // Beds24 V2: PUT /bookings — aggiorna status e aggiunge pagamento in un'unica chiamata
  // Chiamata 1: aggiorna lo status a confirmed
  const statusPayload = [{ id: bookingId, status: 'confirmed' }];
  console.log('[paypal-capture] Beds24 status update:', JSON.stringify(statusPayload));

  const res1 = await fetch(`${BEDS24_BASE}/bookings`, {
    method:  'POST',
    headers: { token, 'Content-Type': 'application/json' },
    body:    JSON.stringify(statusPayload),
    cache:   'no-store',
  });
  const raw1 = await res1.text();
  console.log('[paypal-capture] Beds24 status PUT:', res1.status, raw1.slice(0, 200));

  // Chiamata 2: registra il pagamento in invoicePayments
  const paymentPayload = [{
    id: bookingId,
    invoicePayments: [{
      description: 'PayPal',
      amount:      amount,
    }],
  }];
  console.log('[paypal-capture] Beds24 payment update:', JSON.stringify(paymentPayload));

  const res2 = await fetch(`${BEDS24_BASE}/bookings`, {
    method:  'POST',
    headers: { token, 'Content-Type': 'application/json' },
    body:    JSON.stringify(paymentPayload),
    cache:   'no-store',
  });
  const raw2 = await res2.text();
  console.log('[paypal-capture] Beds24 payment PUT:', res2.status, raw2.slice(0, 200));

  if (!res1.ok || !res2.ok) {
    console.error('[paypal-capture] Beds24 update parzialmente fallita — verificare manualmente');
  }
}

// ── POST /api/paypal-capture ──────────────────────────────────────────────────
// Body: { orderID: string, bookingId: number, amount: number }
// Risposta: { ok: true, captureID: string, status: string }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { orderID, bookingId, amount } = body;

  if (!orderID || !bookingId) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti: orderID, bookingId' },
      { status: 400 }
    );
  }

  console.log('[paypal-capture] Cattura ordine:', { orderID, bookingId, amount });

  try {
    const accessToken = await getPaypalAccessToken();

    // ── 1. Cattura il pagamento PayPal ────────────────────────────────────────
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body:  '{}',
      cache: 'no-store',
    });

    const rawText = await res.text();
    console.log('[paypal-capture] PayPal status:', res.status, rawText.slice(0, 400));

    if (!res.ok) {
      throw new Error(`PayPal capture fallita (${res.status}): ${rawText.slice(0, 200)}`);
    }

    const data = JSON.parse(rawText);

    const captureUnit   = data.purchase_units?.[0]?.payments?.captures?.[0];
    const captureID     = captureUnit?.id;
    const captureStatus = captureUnit?.status;
    // Usa l'importo reale catturato da PayPal (più affidabile del parametro ricevuto)
    const capturedAmount = Number(captureUnit?.amount?.value ?? amount ?? 0);

    console.log('[paypal-capture] captureID:', captureID, 'status:', captureStatus, 'amount:', capturedAmount);

    if (captureStatus !== 'COMPLETED') {
      throw new Error(`Pagamento PayPal non completato. Status: ${captureStatus ?? 'sconosciuto'}`);
    }

    // ── 2. Aggiorna Beds24: confirmed + registra pagamento ────────────────────
    await confirmBookingInBeds24(Number(bookingId), capturedAmount);

    return NextResponse.json({
      ok:        true,
      captureID,
      status:    captureStatus,
      bookingId: Number(bookingId),
      amount:    capturedAmount,
    });

  } catch (err: any) {
    console.error('[paypal-capture] Errore:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore cattura PayPal' },
      { status: 500 }
    );
  }
}
