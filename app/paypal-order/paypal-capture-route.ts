import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

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

// ── POST /api/paypal-capture ──────────────────────────────────────────────────
// Body: { orderID: string, bookingId: number }
// Risposta: { ok: true, captureID: string, status: string }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { orderID, bookingId } = body;

  if (!orderID || !bookingId) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti: orderID, bookingId' },
      { status: 400 }
    );
  }

  console.log('[paypal-capture] Cattura ordine:', { orderID, bookingId });

  try {
    const accessToken = await getPaypalAccessToken();

    // Cattura il pagamento
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body:  '{}', // body vuoto richiesto da PayPal per la capture
      cache: 'no-store',
    });

    const rawText = await res.text();
    console.log('[paypal-capture] PayPal status:', res.status, rawText.slice(0, 400));

    if (!res.ok) {
      throw new Error(`PayPal capture fallita (${res.status}): ${rawText.slice(0, 200)}`);
    }

    const data = JSON.parse(rawText);

    // Verifica che la capture sia COMPLETED
    const captureUnit   = data.purchase_units?.[0]?.payments?.captures?.[0];
    const captureID     = captureUnit?.id;
    const captureStatus = captureUnit?.status; // COMPLETED | PENDING | DECLINED

    console.log('[paypal-capture] captureID:', captureID, 'status:', captureStatus);

    if (captureStatus !== 'COMPLETED') {
      throw new Error(`Pagamento PayPal non completato. Status: ${captureStatus ?? 'sconosciuto'}`);
    }

    // ── Nota: qui potresti aggiungere una chiamata Beds24 per registrare il pagamento
    // Es: PUT /bookings/{bookingId} per aggiornare lo stato a "confirmed"
    // Per ora la prenotazione è già stata creata in Beds24 — il proprietario la vedrà.
    // TODO: aggiungere registrazione pagamento in Beds24 quando disponibile nell'API V2.

    return NextResponse.json({
      ok:        true,
      captureID,
      status:    captureStatus,
      bookingId: Number(bookingId),
    });

  } catch (err: any) {
    console.error('[paypal-capture] Errore:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore cattura PayPal' },
      { status: 500 }
    );
  }
}
