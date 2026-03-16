import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const arrival      = searchParams.get('arrival')     ?? '';
  const departure    = searchParams.get('departure')   ?? '';
  const numAdults    = searchParams.get('numAdults')   ?? '1';
  const numChildren  = searchParams.get('numChildren') ?? '0';
  const roomIdSingle = searchParams.get('roomId');
  const roomIdsMulti = searchParams.get('roomIds');

  if (!arrival || !departure) {
    return NextResponse.json(
      { success: false, error: 'Parametri obbligatori mancanti: arrival, departure' },
      { status: 400 }
    );
  }

  const roomIds: string[] = roomIdSingle
    ? [roomIdSingle]
    : (roomIdsMulti ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  if (roomIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Specificare almeno un roomId o roomIds' },
      { status: 400 }
    );
  }

  try {
    const token = await getToken();

    const qs = new URLSearchParams();
    roomIds.forEach((id) => qs.append('roomId', id));
    qs.set('arrival', arrival);
    qs.set('departure', departure);
    qs.set('numAdults', numAdults);
    if (Number(numChildren) > 0) qs.set('numChildren', numChildren);

    const res = await fetch(`${BASE_URL}/inventory/rooms/offers?${qs}`, {
      headers: { token, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `Beds24 HTTP ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });

  } catch (err: any) {
    console.error('[API /offers]', err.message);
    return NextResponse.json(
      { success: false, error: err.message ?? 'Errore recupero offerte' },
      { status: 500 }
    );
  }
}
