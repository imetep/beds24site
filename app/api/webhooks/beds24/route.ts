import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { redisDel } from '@/app/api/offers/route';

/**
 * POST /api/webhooks/beds24
 *
 * Riceve il Booking Webhook di Beds24 (Settings → Properties → Access → Booking Webhook).
 * Viene chiamato ogni volta che una prenotazione viene creata o modificata.
 *
 * Payload reale inviato da Beds24:
 * {
 *   "timeStamp": "2026-03-27T11:30:48.789Z",
 *   "booking": {
 *     "id": 123,
 *     "roomId": 107773,
 *     "propertyId": 46487,
 *     "status": "confirmed",
 *     "arrival": "2026-04-13",
 *     "departure": "2026-04-20",
 *     ...
 *   }
 * }
 *
 * Azione: invalida la cache Redis delle offerte e la cache ISR
 * della disponibilità per la stanza coinvolta.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Beds24 Webhook] Payload ricevuto:', JSON.stringify(body).slice(0, 300));

    // ── Estrai roomId dal payload reale Beds24 ────────────────────────────────
    // Il Booking Webhook annida i dati dentro "booking"
    const roomId   = body?.booking?.roomId   ?? body?.roomId;
    const propId   = body?.booking?.propertyId ?? body?.propId;
    const status   = body?.booking?.status;
    const bookId   = body?.booking?.id;

    console.log('[Beds24 Webhook]', { roomId, propId, status, bookId });

    if (!roomId) {
      console.warn('[Beds24 Webhook] roomId mancante nel payload — nessuna azione');
      // Beds24 si aspetta 200-299 altrimenti riprova per 30 minuti
      return NextResponse.json({ ok: true, skipped: true, reason: 'no roomId' });
    }

    const roomIdStr = String(roomId);

    // ── 1. Invalida cache ISR disponibilità per questa room ───────────────────
    try {
      revalidateTag(`availability:${roomIdStr}`, 'pages');
      console.log(`[Beds24 Webhook] revalidateTag availability:${roomIdStr}`);
    } catch (e) {
      // revalidateTag può lanciare fuori dal contesto Next.js — ignora silente
      console.warn('[Beds24 Webhook] revalidateTag non disponibile:', e);
    }

    // ── 2. Elimina offerte in cache Redis per questa room ─────────────────────
    // Il pattern *roomId* trova sia chiavi singole (offers:107773:...)
    // che chiavi multi-room (offers:107773,107799,...:...)
    await redisDel(`offers:*${roomIdStr}*`);
    console.log(`[Beds24 Webhook] ✅ Cache invalidata per roomId: ${roomIdStr} (bookId: ${bookId}, status: ${status})`);

    // Beds24 si aspetta HTTP 200-299, altrimenti riprova per 30 minuti
    return NextResponse.json({ ok: true, roomId: roomIdStr, propId, bookId, status });

  } catch (err: any) {
    console.error('[Beds24 Webhook] Errore:', err.message);
    // Restituiamo 200 comunque — se restituiamo 500 Beds24 riprova in loop
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}
