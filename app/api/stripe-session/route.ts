import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

// Offerte 1-2: addebito immediato | Offerte 3-6: salva carta
const IMMEDIATE_CHARGE_OFFERS = [1, 2];

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { bookingId, amount, offerId, locale = 'it', description = 'Soggiorno LivingApple' } = body;
  console.log('[stripe-session] Ricevuto:', { bookingId, amount, offerId });

  if (!bookingId || amount === undefined || amount === null) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti: bookingId, amount' },
      { status: 400 }
    );
  }

  const capture    = IMMEDIATE_CHARGE_OFFERS.includes(Number(offerId));
  const unitAmount = Math.round(Number(amount) * 100);
  const origin     = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? `https://${req.headers.get('host')}`;
  const successUrl = `${origin}/${locale}/prenota/successo?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = `${origin}/${locale}/prenota?cancelled=1`;

  const stripePayload = [{
    action:     'createStripeSession',
    bookingId:  Number(bookingId),
    line_items: [{
      price_data: {
        currency:     'eur',
        product_data: { name: description },
        unit_amount:  unitAmount,
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    capture,
  }];

  console.log('[API /stripe-session] offerId:', offerId, '→ capture:', capture);

  try {
    const token = await getToken();

    const res = await fetch(`${BASE_URL}/channels/stripe`, {
      method:  'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body:    JSON.stringify(stripePayload),
      cache:   'no-store',
    });

    const rawText = await res.text();
    console.log('[API /stripe-session] Status:', res.status, 'Response:', rawText.slice(0, 500));

    if (!res.ok) {
      let errMsg = `Beds24 /channels/stripe HTTP ${res.status}`;
      try { errMsg = JSON.parse(rawText)?.error ?? errMsg; } catch {}
      throw new Error(errMsg);
    }

    const data = JSON.parse(rawText);
    const sessionUrl =
      data?.[0]?.new?.stripeSession?.url ??
      data?.[0]?.url                     ??
      data?.[0]?.checkoutUrl             ??
      data?.data?.[0]?.url               ??
      data?.url                          ??
      null;
    console.log('[stripe-session] sessionUrl trovata:', sessionUrl?.slice(0, 60));

    if (!sessionUrl) {
      throw new Error('Stripe session URL non ricevuta. Risposta: ' + rawText.slice(0, 200));
    }

    return NextResponse.json({ ok: true, url: sessionUrl, capture });

  } catch (err: any) {
    console.error('[API /stripe-session] Error:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore creazione sessione Stripe' },
      { status: 500 }
    );
  }
}
