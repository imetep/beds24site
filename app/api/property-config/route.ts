import { NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';
const CACHE_TTL = 60 * 60; // 1 ora in secondi

// ─── Redis helpers (stesso pattern di app/api/offers/route.ts) ────────────────

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
    const body = JSON.stringify([['SET', key, value, 'EX', ttlSeconds]]);
    const res  = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('[property-config] Redis SET error:', res.status, text.slice(0, 100));
    }
  } catch (e) {
    console.warn('[property-config] Redis SET exception:', e);
  }
}

// ─── Tipi restituiti al client ────────────────────────────────────────────────

export type DepositScheme = {
  fixedAmount: number;
  variableAmount: { type: string; percentageValue: number };
};

export type PaymentCollection = {
  depositNonPayment: string | null;
  depositPayment1:   DepositScheme | null;
  depositPayment2:   DepositScheme | null;
};

export type OfferConfig = {
  offerId:     number;
  offerName:   string;
  /**
   * bookingType dell'offerta. Valori noti usati in produzione:
   * - 'confirmedWithDepositCollection1' → addebita depositPayment1 (oggi 100%)
   * - 'confirmedWithDepositCollection2' → addebita depositPayment2 (oggi 50%)
   * - 'confirmedWithCreditCard'         → carta salvata, 0 ora (flex)
   * - 'autoConfirmed'                   → nessun pagamento
   * - 'default'                         → usa il default della property
   */
  bookingType: string;
};

export type RoomConfig = {
  roomId: number;
  offers: OfferConfig[];
};

export type PropertyConfig = {
  propertyId:         number;
  name:               string;
  bookingTypeDefault: string | null;
  paymentCollection:  PaymentCollection;
  rooms:              RoomConfig[];
};

export type PropertyConfigResponse = {
  properties: PropertyConfig[];
  cachedAt:   number;
};

/**
 * GET /api/property-config
 *
 * Fetcha da Beds24 la configurazione completa delle offerte per tutte le
 * property dell'account: paymentCollection (schemi di deposito) +
 * offers[].bookingType per ogni room.
 *
 * Serve al wizard per decidere dinamicamente:
 * - se un'offerta è "flex" (bookingType === 'confirmedWithCreditCard')
 * - quale % addebitare a Stripe (100/50/0) in base al bookingType
 *
 * Cache Redis 1 ora con chiave globale 'property-config:all'.
 * Non invalidata dal webhook (il Booking Webhook di Beds24 si attiva solo
 * su create/modify booking, non su edit delle offerte). Se l'host cambia
 * una percentuale di deposito, propaga entro 1h.
 */
export async function GET() {
  const cacheKey = 'property-config:all';
  const isDev    = process.env.NODE_ENV === 'development';

  if (!isDev) {
    const cached = await redisGet(cacheKey);
    if (cached) {
      console.log('[property-config] cache HIT');
      return NextResponse.json(JSON.parse(cached), {
        headers: { 'X-Cache': 'HIT' },
      });
    }
    console.log('[property-config] cache MISS');
  }

  try {
    const token = await getToken();
    const qs = new URLSearchParams({
      includeAllRooms: 'true',
      includeOffers:   'true',
    });
    const res = await fetch(`${BASE_URL}/properties?${qs}`, {
      headers: { token },
      cache:   'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Beds24 HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();

    // ── Estrai solo i campi che ci servono ───────────────────────────────────
    const properties: PropertyConfig[] = (data.data ?? []).map((p: any) => ({
      propertyId:         Number(p.id),
      name:               String(p.name ?? ''),
      bookingTypeDefault: p.bookingRules?.bookingType ?? null,
      paymentCollection: {
        depositNonPayment: p.paymentCollection?.depositNonPayment ?? null,
        depositPayment1:   p.paymentCollection?.depositPayment1   ?? null,
        depositPayment2:   p.paymentCollection?.depositPayment2   ?? null,
      },
      rooms: Array.isArray(p.roomTypes)
        ? p.roomTypes.map((r: any) => ({
            roomId: Number(r.id),
            // Solo offerte "reali": name non vuoto. Saltiamo slot vuoti (offerId 7-16
            // con name: '' e bookingType: 'default')
            offers: Array.isArray(r.offers)
              ? r.offers
                  .filter((o: any) => o.name && String(o.name).trim() !== '')
                  .map((o: any) => ({
                    offerId:     Number(o.offerId),
                    offerName:   String(o.name),
                    bookingType: String(o.bookingType ?? 'default'),
                  }))
              : [],
          }))
        : [],
    }));

    const payload: PropertyConfigResponse = {
      properties,
      cachedAt: Date.now(),
    };

    if (!isDev) {
      await redisSet(cacheKey, JSON.stringify(payload), CACHE_TTL);
    }

    return NextResponse.json(payload, {
      headers: { 'X-Cache': 'MISS' },
    });

  } catch (err: any) {
    console.error('[property-config]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore recupero configurazione' },
      { status: 500 },
    );
  }
}
