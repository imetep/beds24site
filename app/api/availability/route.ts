import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

/**
 * GET /api/availability
 *
 * Usa /inventory/rooms/availability di Beds24 V2.
 * Cache: ISR Next.js 30 minuti in produzione, no-store in sviluppo.
 * Invalidazione: webhook Beds24 → revalidateTag('availability:{roomId}')
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
    return NextResponse.json(data);

  } catch (err: any) {
    console.error('[availability] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
