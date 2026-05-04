import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { isFlexBookingType } from '@/lib/offer-deposit';

const BASE_URL = 'https://beds24.com/api/v2';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const {
    bookingId,
    amount,
    total,
    offerId,
    bookingType,
    locale = 'it',
    description = 'Soggiorno LivingApple',
    successUrl: successUrlOverride,
    cancelUrl: cancelUrlOverride,
  } = body;
  console.log('[stripe-session] Ricevuto:', { bookingId, amount, total, offerId, bookingType });

  if (!bookingId || amount === undefined || amount === null) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti: bookingId, amount' },
      { status: 400 }
    );
  }

  // capture = false per offerte flex (bookingType === 'confirmedWithCreditCard'):
  // la carta viene solo salvata, nessun addebito immediato.
  // Per tutti gli altri bookingType addebitiamo subito l'importo ricevuto.
  const capture = !isFlexBookingType(bookingType);

  // line_item unit_amount:
  // - se capture=true  → addebitiamo `amount` (importo già calcolato dal client
  //                      in base al bookingType: 100% o 50% del totale)
  // - se capture=false → Stripe Checkout richiede comunque un unit_amount > 0
  //                      per creare la sessione, anche se non verrà addebitata.
  //                      Usiamo `total` (fallback ad `amount` se non fornito)
  //                      così l'utente vede l'importo corretto della prenotazione
  //                      nella pagina Stripe prima di inserire la carta.
  const displayAmount = capture ? Number(amount) : Number(total ?? amount);
  const unitAmount    = Math.round(displayAmount * 100);
  const origin     = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? `https://${req.headers.get('host')}`;

  // Default URLs per il wizard /prenota. Override opzionale via body
  // (usato dal flusso /preventivo/[id]/paga per redirect alla view preventivo).
  const successUrl = typeof successUrlOverride === 'string' && successUrlOverride.length > 0
    ? successUrlOverride
    : `${origin}/${locale}/prenota/successo?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`;
  // bookingId incluso nella cancelUrl → Wizard.tsx lo legge e cancella il booking
  const cancelUrl = typeof cancelUrlOverride === 'string' && cancelUrlOverride.length > 0
    ? cancelUrlOverride
    : `${origin}/${locale}/prenota?cancelled=1&bookingId=${bookingId}`;

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

  console.log('[API /stripe-session] bookingType:', bookingType, '→ capture:', capture, '· unit_amount(EUR):', displayAmount);

  try {
    const token = await getToken();

    // ── Step 1: Crea sessione Stripe tramite Beds24 ──────────────────────────
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

    // ── Step 2: Reset status → "request" ────────────────────────────────────────
    // ⚠️  Beds24 /channels/stripe setta automaticamente il booking a "confirmed"
    //     nel momento in cui crea la sessione Stripe, ancora prima che l'utente paghi.
    //     Lo riportiamo subito a "new" così che:
    //     - se l'utente paga → /api/stripe-confirm lo porta a "confirmed"
    //     - se l'utente abbandona → Wizard.tsx intercetta ?cancelled=1 e lo cancella
    //     Questo reset è sicuro: avviene prima che l'utente veda la pagina Stripe,
    //     quindi il webhook Stripe non può ancora essere arrivato a Beds24.
    try {
      const resetRes = await fetch(`${BASE_URL}/bookings`, {
        method:  'POST',
        headers: { token, 'Content-Type': 'application/json' },
        body:    JSON.stringify([{ id: Number(bookingId), status: 'request' }]),
        cache:   'no-store',
      });
      const resetRaw = await resetRes.text();
      console.log('[stripe-session] Reset status → new:', resetRes.status, resetRaw.slice(0, 100));
    } catch (resetErr: any) {
      // Non blocchiamo il flusso — l'utente ha già la session URL
      console.warn('[stripe-session] Reset status fallito (non bloccante):', resetErr.message);
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
