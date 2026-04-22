import { NextRequest, NextResponse } from 'next/server';
import { getPaypalAccessToken } from '@/lib/paypal';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

// ── POST /api/paypal-order ────────────────────────────────────────────────────
// Crea un ordine PayPal con intent CAPTURE (popup one-shot via SDK v6).
// Usato per Non Rimborsabile (100%) e Rimborsabile (50% upfront — il 50%
// residuo viene incassato manualmente al check-in, fuori da questo flow).
// Il flusso Flessibile usa invece /api/paypal-setup-token (vault).
//
// Body: { amount: number, bookingId: number, description?: string }
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

  const amountStr = Number(amount).toFixed(2);

  console.log('[paypal-order] Creo ordine:', { amount: amountStr, bookingId });

  try {
    const accessToken = await getPaypalAccessToken();

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(bookingId),
          description:  String(description).slice(0, 127),
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
        'Authorization':     `Bearer ${accessToken}`,
        'Content-Type':      'application/json',
        'PayPal-Request-Id': `livingapple-${bookingId}-${Date.now()}`,
      },
      body:  JSON.stringify(payload),
      cache: 'no-store',
    });

    const rawText = await res.text();
    console.log('[paypal-order] PayPal status:', res.status, rawText.slice(0, 300));

    if (!res.ok) {
      throw new Error(`PayPal /v2/checkout/orders fallita (${res.status}): ${rawText.slice(0, 200)}`);
    }

    const data    = JSON.parse(rawText);
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
