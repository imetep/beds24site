import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

// ── Ottieni access token PayPal (client credentials) ──────────────────────────
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

// ── POST /api/paypal-order ────────────────────────────────────────────────────
// Body: { amount: number, bookingId: number, description: string }
// Risposta: { orderID: string }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { amount, bookingId, description = 'Soggiorno LivingApple' } = body;

  if (!amount || !bookingId) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti: amount, bookingId' },
      { status: 400 }
    );
  }

  // Importo in centesimi → PayPal vuole stringa con 2 decimali (es. "350.00")
  const amountStr = Number(amount).toFixed(2);

  console.log('[paypal-order] Creo ordine PayPal:', { amount: amountStr, bookingId, description });

  try {
    const accessToken = await getPaypalAccessToken();

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(bookingId),
          description:  description.slice(0, 127), // max 127 chars per PayPal
          amount: {
            currency_code: 'EUR',
            value:         amountStr,
          },
        },
      ],
      application_context: {
        brand_name:          'LivingApple',
        landing_page:        'NO_PREFERENCE',
        shipping_preference: 'NO_SHIPPING',
        user_action:         'PAY_NOW',
      },
    };

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
        'PayPal-Request-Id': `livingapple-${bookingId}-${Date.now()}`, // idempotency key
      },
      body:  JSON.stringify(payload),
      cache: 'no-store',
    });

    const rawText = await res.text();
    console.log('[paypal-order] PayPal status:', res.status, rawText.slice(0, 300));

    if (!res.ok) {
      throw new Error(`PayPal /v2/checkout/orders fallita (${res.status}): ${rawText.slice(0, 200)}`);
    }

    const data = JSON.parse(rawText);
    const orderID = data.id;

    if (!orderID) {
      throw new Error('PayPal non ha restituito un order ID. Risposta: ' + rawText.slice(0, 200));
    }

    console.log('[paypal-order] Order creato:', orderID);
    return NextResponse.json({ ok: true, orderID });

  } catch (err: any) {
    console.error('[paypal-order] Errore:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore creazione ordine PayPal' },
      { status: 500 }
    );
  }
}
