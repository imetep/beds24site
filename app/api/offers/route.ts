import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://beds24.com/api/v2';

// Cache token in-memory (questo modulo vive lato server)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('BEDS24_REFRESH_TOKEN non configurato');

  const res = await fetch(`${BASE_URL}/authentication/token`, {
    headers: { refreshToken },
  });
  if (!res.ok) throw new Error(`Beds24 auth error: ${res.status}`);
  const data = await res.json();
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + (data.expiresIn ?? 86400) * 1000,
  };
  return cachedToken.token;
}

/**
 * GET /api/offers
 *
 * Query params:
 *   roomId      singolo roomId  (modalità tariffa su room preselezionata)
 *   roomIds     roomId separati da virgola  (modalità lista rooms)
 *   arrival     YYYY-MM-DD  *obbligatorio
 *   departure   YYYY-MM-DD  *obbligatorio
 *   numAdults   integer (default 1)
 *   numChildren integer (default 0)
 *
 * Risposta Beds24 V2:
 * {
 *   data: [{
 *     roomId, propertyId,
 *     offers: [{ offerId, offerName, price, unitsAvailable }]
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const arrival     = searchParams.get('arrival')     ?? '';
  const departure   = searchParams.get('departure')   ?? '';
  const numAdults   = searchParams.get('numAdults')   ?? '1';
  const numChildren = searchParams.get('numChildren') ?? '0';
  const roomIdSingle = searchParams.get('roomId');
  const roomIdsMulti = searchParams.get('roomIds');

  if (!arrival || !departure) {
    return NextResponse.json(
      { success: false, error: 'Parametri obbligatori mancanti: arrival, departure' },
      { status: 400 }
    );
  }

  // Lista roomId da interrogare
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

    // Beds24 accetta roomId ripetuto nella query string per più rooms
    const qs = new URLSearchParams();
    roomIds.forEach((id) => qs.append('roomId', id));
    qs.set('arrival', arrival);
    qs.set('departure', departure);
    qs.set('numAdults', numAdults);
    if (Number(numChildren) > 0) qs.set('numChildren', numChildren);

    const res = await fetch(`${BASE_URL}/inventory/rooms/offers?${qs}`, {
      headers: { token, 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `Beds24 HTTP ${res.status}`);
    }

    const data = await res.json();
    // Passa la risposta Beds24 as-is al client
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
