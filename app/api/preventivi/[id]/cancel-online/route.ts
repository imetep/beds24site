/**
 * POST /api/preventivi/[id]/cancel-online
 *
 * Cliente ha abbandonato il pagamento online (PayPal onCancel/onError o
 * Stripe redirect a cancel URL). Cancella la booking Beds24 pending
 * (status='request' → 'cancelled') e rimuove bookingId dal preventivo.
 * Lo stato del preventivo resta 'active' così il cliente può riprovare.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { getPreventivo, savePreventivo } from '@/lib/preventivo-kv';

const BEDS24_BASE = 'https://beds24.com/api/v2';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const p = await getPreventivo(id);
  if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Già converted: nessun rollback (la booking è già confermata e pagata)
  if (p.status === 'converted') {
    return NextResponse.json({ ok: true, mode: 'noop_converted' });
  }

  const bookId = p.bookingId;
  if (!bookId) {
    // Nessuna booking pending da cancellare
    return NextResponse.json({ ok: true, mode: 'noop_no_booking' });
  }

  // Cancella booking Beds24 (status → 'cancelled')
  try {
    const token = await getToken();
    const res = await fetch(`${BEDS24_BASE}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: Number(bookId), status: 'cancelled' }]),
      cache: 'no-store',
    });
    const raw = await res.text();
    console.log('[cancel-online]', bookId, 'status:', res.status, raw.slice(0, 200));
    if (!res.ok) {
      // Non bloccante: anche se Beds24 fallisce, rimuoviamo bookingId dal
      // preventivo così il cliente può riprovare (admin verificherà
      // manualmente se la booking pending è ancora viva su Beds24)
      console.warn('[cancel-online] Beds24 cancel failed but proceeding');
    }
  } catch (e: any) {
    console.warn('[cancel-online] Beds24 exception (non-blocking):', e?.message ?? e);
  }

  // Rimuovi bookingId dal preventivo (status resta 'active')
  await savePreventivo({ ...p, bookingId: undefined });

  return NextResponse.json({ ok: true, mode: 'cancelled', bookId });
}
