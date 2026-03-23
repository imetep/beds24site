import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { redisDel } from '@/app/api/offers/route';

// Beds24 invia questo payload quando cambia inventario:
// { roomId: "123456", propId: "12345", ownerId: "1234", action: "SYNC_ROOM" }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, propId, action } = body;

    console.log('[Beds24 Webhook]', { roomId, propId, action });

    if (!roomId || !action) {
      return NextResponse.json({ error: 'Missing roomId or action' }, { status: 400 });
    }

    if (action === 'SYNC_ROOM') {
      // 1. Invalida cache ISR disponibilità per questa room
      revalidateTag(`availability:${roomId}`, 'pages');
      // 2. Elimina offerte in cache Redis per questa room
      await redisDel(`offers:*${roomId}*`);
      console.log(`[Beds24 Webhook] Cache invalidated for roomId: ${roomId}`);

    } else if (action === 'SYNC_ALL') {
      // Invalida tutto
      revalidateTag('availability', 'pages');
      await redisDel('offers:*');
      console.log('[Beds24 Webhook] Full cache invalidated');
    }

    // Beds24 si aspetta HTTP 200-299, altrimenti riprova per 30 minuti
    return NextResponse.json({ ok: true, roomId, action });

  } catch (err: any) {
    console.error('[Beds24 Webhook] Error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}
