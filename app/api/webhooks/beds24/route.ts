import { NextRequest, NextResponse } from 'next/server';
import { invalidateRoomCache, invalidateAllCache } from '@/lib/beds24-client';

// Beds24 sends this payload when inventory changes:
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
      // Invalidate cache only for this specific room
      invalidateRoomCache(roomId);
      console.log(`[Beds24 Webhook] Cache invalidated for roomId: ${roomId}`);
    } else if (action === 'SYNC_ALL') {
      // Full invalidation
      invalidateAllCache();
      console.log('[Beds24 Webhook] Full cache invalidated');
    }

    // Beds24 expects HTTP 200-299, otherwise retries for 30 minutes
    return NextResponse.json({ ok: true, roomId, action });

  } catch (err: any) {
    console.error('[Beds24 Webhook] Error:', err.message);
    // Still return 200 to avoid Beds24 retry storm
    return NextResponse.json({ ok: false, error: err.message }, { status: 200 });
  }
}
