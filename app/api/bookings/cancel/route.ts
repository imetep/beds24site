import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

/**
 * POST /api/bookings/cancel
 * Cancella un booking pendente se l'utente torna indietro dal riepilogo.
 * Body: { bookingId: number }
 */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const { bookingId } = body;
  if (!bookingId) return NextResponse.json({ error: 'bookingId mancante' }, { status: 400 });

  try {
    const token = await getToken();

    // Beds24 V2: per cancellare un booking si aggiorna lo status a "cancelled"
    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: Number(bookingId), status: 'cancelled' }]),
      cache: 'no-store',
    });

    const raw = await res.text();
    console.log('[cancel booking]', bookingId, 'status:', res.status, raw.slice(0, 200));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[cancel booking] Error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
