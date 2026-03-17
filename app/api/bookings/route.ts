import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const missing = ['roomId', 'checkIn', 'checkOut', 'numAdult', 'guestFirstName', 'guestName', 'guestEmail']
    .filter(f => !body[f] && body[f] !== 0);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Campi obbligatori mancanti: ${missing.join(', ')}` }, { status: 400 });
  }

  // Beds24 V2: departure = checkOut diretto (Beds24 gestisce internamente)
  const departure = body.checkOut;

  const beds24Payload: Record<string, any> = {
    roomId:    Number(body.roomId),
    arrival:   body.checkIn,
    departure,
    numAdult:  Number(body.numAdult),
    numChild:  Number(body.numChild ?? 0),
    firstName: body.guestFirstName?.trim(),
    lastName:  body.guestName?.trim(),
    email:     body.guestEmail?.trim(),
  };

  if (body.guestPhone)       beds24Payload.phone       = body.guestPhone.trim();
  if (body.guestCountry)     beds24Payload.country     = body.guestCountry.trim();
  if (body.guestComments)    beds24Payload.notes       = body.guestComments.trim();
  if (body.guestArrivalTime) beds24Payload.arrivalTime = body.guestArrivalTime.trim();
  if (body.offerId)          beds24Payload.offerId     = Number(body.offerId);
  if (body.voucherCode)      beds24Payload.voucher     = body.voucherCode.trim();

  console.log('[API /bookings] Payload completo:', JSON.stringify(beds24Payload));
  console.log('[API /bookings] voucherCode originale:', body.voucherCode);

  try {
    const token = await getToken();

    // Step 1 — Crea il booking
    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify([beds24Payload]),
      cache: 'no-store',
    });

    const rawText = await res.text();
    console.log('[API /bookings] Status:', res.status, 'Response:', rawText.slice(0, 300));

    if (!res.ok) {
      let errMsg = `Beds24 HTTP ${res.status}`;
      try { errMsg = JSON.parse(rawText)?.error ?? errMsg; } catch {}
      throw new Error(errMsg);
    }

    const data = JSON.parse(rawText);
    // Beds24 V2 risponde con array: [{ success, new: { id } }]
    const bookId = data?.[0]?.new?.id ?? data?.data?.[0]?.id ?? data?.bookId ?? data?.id;
    console.log('[bookings] bookId estratto:', bookId);

    if (!bookId) throw new Error('bookId non ricevuto da Beds24');

    // Step 2 — Leggi la fattura reale per ottenere il prezzo scontato (voucher applicato)
    let invoiceAmount: number | null = null;
    try {
      // Attendi che Beds24 calcoli il prezzo con il voucher
      await new Promise(r => setTimeout(r, 2000));
      const getRes = await fetch(`${BASE_URL}/bookings?bookingId=${bookId}`, {
        headers: { token },
        cache: 'no-store',
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        const bk = getData?.data?.[0];
        console.log('[bookings] TUTTI I CAMPI BK:', JSON.stringify(Object.keys(bk ?? {})));
        console.log('[bookings] price/voucher/discount:', bk?.price, bk?.voucher, bk?.voucherDiscount, bk?.priceOverride, bk?.totalPrice, bk?.roomPrice, bk?.offerPrice);

        // price = prezzo totale dal booking (include sconto voucher)
        const price = bk?.price;
        if (price !== null && price !== undefined && Number(price) > 0) {
          invoiceAmount = Number(price);
          console.log('[bookings] Prezzo reale:', invoiceAmount);
        }
      }
    } catch (invErr: any) {
      console.warn('[bookings] GET booking fallito:', invErr.message);
    }

    return NextResponse.json({
      ok: true,
      bookId: Number(bookId),
      invoiceAmount, // null se voucher non usato o invoice non disponibile
    });

  } catch (err: any) {
    console.error('[API /bookings] Error:', err.message);
    return NextResponse.json({ error: err.message ?? 'Errore prenotazione' }, { status: 500 });
  }
}
