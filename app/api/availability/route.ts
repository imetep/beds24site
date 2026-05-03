import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { listLocksForRoom } from '@/lib/preventivo-kv';
import type { PreventivoLock } from '@/lib/preventivo-types';

const BASE_URL = 'https://beds24.com/api/v2';

/**
 * GET /api/availability
 *
 * Usa /inventory/rooms/availability di Beds24 V2.
 * Cache: ISR Next.js 30 minuti in produzione, no-store in sviluppo.
 * Invalidazione: webhook Beds24 → revalidateTag('availability:{roomId}')
 *
 * Sovrappone i preventivo-lock attivi (TTL 20 min, KV) per evitare doppie
 * prenotazioni mentre un cliente sta facendo il bonifico. La sottrazione
 * lock è sempre fresh (Upstash KV), anche se la risposta Beds24 è in cache.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const roomIdSingle = searchParams.get('roomId');
  const roomIdsMulti = searchParams.get('roomIds');
  const roomIds: string[] = roomIdSingle
    ? [roomIdSingle]
    : (roomIdsMulti ?? '').split(',').map(s => s.trim()).filter(Boolean);

  if (roomIds.length === 0) {
    return NextResponse.json({ error: 'Specificare roomId o roomIds' }, { status: 400 });
  }

  const today = new Date();
  const startDate = searchParams.get('startDate') ?? today.toISOString().split('T')[0];
  const endDate = searchParams.get('endDate')
    ?? new Date(today.getTime() + 365 * 86400000).toISOString().split('T')[0];

  try {
    const token = await getToken();

    const qs = new URLSearchParams();
    roomIds.forEach(id => qs.append('roomId', id));
    qs.set('startDate', startDate);
    qs.set('endDate', endDate);

    const url = `${BASE_URL}/inventory/rooms/availability?${qs}`;
    console.log('[availability] →', url);

    const isDev = process.env.NODE_ENV === 'development';
    const cacheTags = ['availability', ...roomIds.map(id => `availability:${id}`)];

    // 1. Fetch Beds24 (può essere cached via ISR)
    const res = await fetch(url, {
      headers: { token },
      ...(isDev
        ? { cache: 'no-store' as RequestCache }
        : { next: { revalidate: 1800, tags: cacheTags } }
      ),
    });

    const rawText = await res.text();
    console.log('[availability] status:', res.status);

    if (!res.ok) throw new Error(`Beds24 HTTP ${res.status}: ${rawText.slice(0, 200)}`);

    const data = JSON.parse(rawText);

    // 2. Fetch lock preventivi attivi (sempre fresh, no-cache)
    const allLocks: PreventivoLock[] = (
      await Promise.all(roomIds.map(id => listLocksForRoom(Number(id))))
    ).flat();

    // 3. Sottrai i lock dalla risposta (mark dates as occupied)
    if (allLocks.length > 0) {
      console.log('[availability] applying', allLocks.length, 'lock(s)');
      applyLocksToAvailability(data, allLocks);
    }

    return NextResponse.json(data);

  } catch (err: any) {
    console.error('[availability] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Mutates `data.data[].availability` settando false per ogni data nel range
 * [arrival, departure) dei lock. Beds24 V2 format: availability è un oggetto
 * { "YYYY-MM-DD": boolean } (true=disponibile).
 */
function applyLocksToAvailability(data: any, locks: PreventivoLock[]): void {
  if (!Array.isArray(data?.data)) return;

  // Raggruppa lock per roomId
  const byRoom = new Map<number, PreventivoLock[]>();
  for (const lock of locks) {
    const arr = byRoom.get(lock.roomId) ?? [];
    arr.push(lock);
    byRoom.set(lock.roomId, arr);
  }

  for (const room of data.data) {
    const roomId = Number(room?.roomId);
    const roomLocks = byRoom.get(roomId);
    if (!roomLocks || !room.availability || typeof room.availability !== 'object') continue;

    for (const lock of roomLocks) {
      // Itera giorno per giorno da arrival (incluso) a departure (escluso)
      const startMs = new Date(lock.arrival + 'T00:00:00').getTime();
      const endMs = new Date(lock.departure + 'T00:00:00').getTime();
      for (let ms = startMs; ms < endMs; ms += 86_400_000) {
        const ymd = new Date(ms).toISOString().split('T')[0];
        if (Object.prototype.hasOwnProperty.call(room.availability, ymd)) {
          room.availability[ymd] = false;
        }
      }
    }
  }
}
