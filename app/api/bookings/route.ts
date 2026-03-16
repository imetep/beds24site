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

  // Beds24 V2: departure = ultima notte (checkOut - 1 giorno)
  const checkOutDate = new Date(body.checkOut + 'T00:00:00');
  checkOutDate.setDate(checkOutDate.getDate() - 1);
  const departure = checkOutDate.toISOString().split('T')[0];

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
  if (body.voucherCode)      beds24Payload.voucherCode = body.voucherCode.trim();

  console.log('[API /bookings] Payload:', JSON.stringify(beds24Payload));

  try {
    const token = await getToken();

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
    // Beds24 V2 risponde con array: [{success, new: {id}}]
    const bookId = data?.[0]?.new?.id ?? data?.data?.[0]?.id ?? data?.bookId ?? data?.id;
    console.log('[bookings] bookId estratto:', bookId, 'da:', JSON.stringify(data).slice(0,200));
    return NextResponse.json({ ok: true, bookId: Number(bookId) });

  } catch (err: any) {
    console.error('[API /bookings] Error:', err.message);
    return NextResponse.json({ error: err.message ?? 'Errore prenotazione' }, { status: 500 });
  }
}
