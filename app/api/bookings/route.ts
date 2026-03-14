import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/beds24-client';
import type { Beds24BookingPayload } from '@/lib/beds24-client';

/**
 * POST /api/bookings
 *
 * Body: Beds24BookingPayload (JSON)
 * Proxy server-side per Beds24 POST /bookings.
 * Validazione base lato server prima di inviare a Beds24.
 */
export async function POST(req: NextRequest) {
  let body: Partial<Beds24BookingPayload>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  // Validazione campi obbligatori
  const required: (keyof Beds24BookingPayload)[] = [
    'roomId', 'checkIn', 'checkOut',
    'numAdult', 'guestFirstName', 'guestName', 'guestEmail',
  ];
  for (const field of required) {
    if (!body[field] && body[field] !== 0) {
      return NextResponse.json(
        { error: `Campo obbligatorio mancante: ${field}` },
        { status: 400 }
      );
    }
  }

  try {
    const result = await createBooking(body as Beds24BookingPayload);
    return NextResponse.json({ ok: true, bookId: result.bookId });
  } catch (err: any) {
    console.error('[API /bookings] Error:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore creazione prenotazione' },
      { status: 500 }
    );
  }
}
