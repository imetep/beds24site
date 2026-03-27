import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';
const OFFERS_TTL = 60 * 60 * 2; // 2 ore in secondi

// ─── Redis helpers (stesso pattern di beds24-token.ts) ────────────────────────

async function redisGet(key: string): Promise<string | null> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  try {
    // ✅ FIX: Upstash pipeline — unico formato corretto per SET con TTL.
    // Il vecchio POST /set/{key} con body [value,'EX',ttl] salvava l'array
    // come valore grezzo: ogni cache HIT restituiva dati corrotti (array
    // invece dell'oggetto offers) → zero tariffe mostrate all'utente.
    const body = JSON.stringify([['SET', key, value, 'EX', ttlSeconds]]);
    const res  = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('[offers] Redis SET error:', res.status, text.slice(0, 100));
    }
  } catch (e) {
    console.warn('[offers] Redis SET exception:', e);
  }
}

export async function redisDel(pattern: string): Promise<void> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  try {
    // Upstash REST: scansiona le chiavi con il pattern e le elimina
    const scanRes = await fetch(`${url}/scan/0/match/${encodeURIComponent(pattern)}/count/100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const scanData = await scanRes.json();
    const keys: string[] = scanData.result?.[1] ?? [];
    for (const k of keys) {
      await fetch(`${url}/del/${encodeURIComponent(k)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    }
  } catch {
    // Silente
  }
}

/**
 * GET /api/offers
 *
 * Proxy Beds24 /inventory/rooms/offers con cache Redis 2 ore.
 * Chiave: offers:{roomIds}:{arrival}:{departure}:{numAdults}:{numChildren}
 * Invalidazione: webhook Beds24 → redisDel('offers:{roomId}:*')
 */
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
    : (roomIdsMulti ?? '').split(',').map(s => s.trim()).filter(Boolean);

  if (roomIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Specificare almeno un roomId o roomIds' },
      { status: 400 }
    );
  }

  // Chiave Redis — unica per ogni combinazione di parametri
  const cacheKey = `offers:${roomIds.join(',')}:${arrival}:${departure}:${numAdults}:${numChildren}`;

  // In sviluppo saltiamo la cache Redis per vedere sempre dati freschi
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    const cached = await redisGet(cacheKey);
    if (cached) {
      console.log('[offers] cache HIT →', cacheKey);
      return NextResponse.json(JSON.parse(cached), {
        headers: { 'X-Cache': 'HIT' },
      });
    }
    console.log('[offers] cache MISS →', cacheKey);
  }

  try {
    const token = await getToken();

    const qs = new URLSearchParams();
    roomIds.forEach(id => qs.append('roomId', id));
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

    // Salva in Redis solo in produzione
    if (!isDev) {
      await redisSet(cacheKey, JSON.stringify(data), OFFERS_TTL);
    }

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });

  } catch (err: any) {
    console.error('[API /offers]', err.message);
    return NextResponse.json(
      { success: false, error: err.message ?? 'Errore recupero offerte' },
      { status: 500 }
    );
  }
}
