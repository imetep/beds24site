import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://beds24.com/api/v2';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('BEDS24_REFRESH_TOKEN non configurato');

  const res = await fetch(`${BASE_URL}/authentication/token`, {
    headers: { refreshToken },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Auth ${res.status}: ${await res.text()}`);
  const data = await res.json();
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + (data.expiresIn ?? 86400) * 1000,
  };
  return cachedToken.token;
}

/**
 * GET /api/availability
 *
 * Usa /inventory/rooms/availability di Beds24 V2.
 * Risposta Beds24: { data: [{ roomId, availability: { "YYYY-MM-DD": true/false } }] }
 *   true  = disponibile per check-in
 *   false = non disponibile (occupato o bloccato)
 *
 * Params:
 *   roomId    singolo roomId
 *   roomIds   roomId separati da virgola
 *   startDate YYYY-MM-DD (default: oggi)
 *   endDate   YYYY-MM-DD (default: oggi + 365)
 *
 * Risposta normalizzata verso i componenti:
 * { data: [{ roomId, availability: { "YYYY-MM-DD": true/false } }] }
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
  const endDate   = searchParams.get('endDate')
    ?? new Date(today.getTime() + 365 * 86400000).toISOString().split('T')[0];

  try {
    const token = await getToken();

    // Beds24 accetta roomId ripetuto per più rooms
    const qs = new URLSearchParams();
    roomIds.forEach(id => qs.append('roomId', id));
    qs.set('startDate', startDate);
    qs.set('endDate', endDate);

    const url = `${BASE_URL}/inventory/rooms/availability?${qs}`;
    console.log('[availability] →', url);

    const res = await fetch(url, {
      headers: { token },
      next: { revalidate: 6 * 60 * 60 }, // cache 6h, invalidata dal webhook
    });

    const rawText = await res.text();
    console.log('[availability] status:', res.status);
    console.log('[availability] response:', rawText.slice(0, 600));

    if (!res.ok) throw new Error(`Beds24 HTTP ${res.status}: ${rawText.slice(0, 200)}`);

    const data = JSON.parse(rawText);
    return NextResponse.json(data);

  } catch (err: any) {
    console.error('[availability] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
