import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://beds24.com/api/v2';

// Token cache locale (stesso pattern di /api/offers)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('BEDS24_REFRESH_TOKEN non configurato');
  const res = await fetch(`${BASE_URL}/authentication/token`, {
    headers: { refreshToken },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Auth ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.token, expiresAt: Date.now() + (data.expiresIn ?? 86400) * 1000 };
  return cachedToken.token;
}

/**
 * POST /api/bookings
 *
 * Beds24 API V2 — POST /bookings
 * Documentazione: https://beds24.com/api/v2#/bookings/post_bookings
 *
 * Campi Beds24 V2 (diversi da V1):
 *   roomId        → roomId          (uguale)
 *   checkIn       → arrival         (YYYY-MM-DD)
 *   checkOut      → departure       (YYYY-MM-DD — ultima notte, NON il giorno checkout)
 *   numAdult      → numAdult        (uguale in V2)
 *   numChild      → numChild        (uguale)
 *   offerId       → offerId         (uguale)
 *   guestFirstName→ firstName       (V2 usa camelCase senza "guest")
 *   guestName     → lastName
 *   guestEmail    → email
 *   guestPhone    → phone
 *   guestCountry  → country
 *   guestComments → notes
 *   guestArrivalTime → arrivalTime
 *   voucherCode   → voucherCode     (uguale)
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  // Validazione campi obbligatori (nomi frontend)
  const missing = ['roomId', 'checkIn', 'checkOut', 'numAdult', 'guestFirstName', 'guestName', 'guestEmail']
    .filter(f => !body[f] && body[f] !== 0);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Campi obbligatori mancanti: ${missing.join(', ')}` }, { status: 400 });
  }

  // Calcola departure = checkOut - 1 giorno (Beds24 V2: "last night to be booked")
  const checkOutDate = new Date(body.checkOut + 'T00:00:00');
  checkOutDate.setDate(checkOutDate.getDate() - 1);
  const departure = checkOutDate.toISOString().split('T')[0];

  // Traduce i campi frontend → Beds24 V2
  const beds24Payload: Record<string, any> = {
    roomId:      Number(body.roomId),
    arrival:     body.checkIn,
    departure,                        // ultima notte, non il giorno di checkout
    numAdult:    Number(body.numAdult),
    numChild:    Number(body.numChild ?? 0),
    firstName:   body.guestFirstName?.trim(),
    lastName:    body.guestName?.trim(),
    email:       body.guestEmail?.trim(),
  };

  // Campi opzionali
  if (body.guestPhone)       beds24Payload.phone       = body.guestPhone.trim();
  if (body.guestCountry)     beds24Payload.country     = body.guestCountry.trim();
  if (body.guestComments)    beds24Payload.notes       = body.guestComments.trim();
  if (body.guestArrivalTime) beds24Payload.arrivalTime = body.guestArrivalTime.trim();
  if (body.offerId)          beds24Payload.offerId     = Number(body.offerId);
  if (body.voucherCode)      beds24Payload.voucherCode = body.voucherCode.trim();

  console.log('[API /bookings] Payload a Beds24:', JSON.stringify(beds24Payload));

  try {
    const token = await getToken();

    // Beds24 V2 accetta array di bookings
    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify([beds24Payload]),  // V2 accetta array
      cache: 'no-store',
    });

    const rawText = await res.text();
    console.log('[API /bookings] Beds24 status:', res.status, 'response:', rawText.slice(0, 300));

    if (!res.ok) {
      let errMsg = `Beds24 HTTP ${res.status}`;
      try { errMsg = JSON.parse(rawText)?.error ?? errMsg; } catch {}
      throw new Error(errMsg);
    }

    const data = JSON.parse(rawText);

    // Beds24 V2 risponde: { data: [{ id: bookId, ... }] }
    const bookId = data?.data?.[0]?.id ?? data?.bookId ?? data?.id ?? 'OK';
    return NextResponse.json({ ok: true, bookId: String(bookId) });

  } catch (err: any) {
    console.error('[API /bookings] Error:', err.message);
    return NextResponse.json({ error: err.message ?? 'Errore prenotazione' }, { status: 500 });
  }
}
