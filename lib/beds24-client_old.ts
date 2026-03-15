/**
 * lib/beds24-client.ts
 *
 * Client Beds24 API V2 per LivingApple.
 *
 * Architettura:
 *   - Auth layer:    token OAuth con refresh schedulato ogni 24h
 *   - Cache layer:   in-memory cache per /properties (TTL ∞) e /calendar (TTL 6h)
 *                    invalidabile via webhook per singola room
 *   - Request layer: wrapper tipizzato per ogni endpoint
 *
 * Rate limit Beds24 V2: 100 crediti ogni 5 minuti (account-wide)
 * Token scadenza: 86400 secondi (24h)
 */

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface Beds24Room {
  id: number;
  name: string;
  maxPeople: number;
  numBathrooms?: number;
  numBedrooms?: number;
  roomSize?: number;
  description?: string;
}

export interface Beds24Property {
  id: number;
  name: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  checkInFrom?: string;   // es. "15:00"
  checkOutUntil?: string; // es. "10:00"
  rooms: Beds24Room[];
}

export interface Beds24CalendarDay {
  date: string;        // YYYY-MM-DD
  price1?: number;     // prezzo offerta 1
  price2?: number;     // prezzo offerta 2
  minStay?: number;
  maxStay?: number;
  availability?: number;
  closed?: boolean;
}

export interface Beds24UpsellItem {
  id: number;
  name: string;
  description?: string;
  type: 'optional' | 'optional_qty' | 'obligatory' | 'obligatory_pct' | 'refundable';
  price?: number;
}

export interface Beds24Offer {
  offerId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  numNights: number;
  numAdult: number;
  numChild: number;
  price: number;
  currency: string;
  upsellItems?: Beds24UpsellItem[];
  available: boolean;
}

export interface Beds24BookingPayload {
  roomId: number;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  numAdult: number;
  numChild: number;
  offerId?: number;
  voucherCode?: string;
  guestFirstName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestAddress?: string;
  guestCity?: string;
  guestCountry?: string;
  guestComments?: string;
  guestArrivalTime?: string;
  guestCustomQ1?: string;
  guestCustomQ2?: string;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  cachedAt: number; // timestamp ms
  ttlMs: number;    // -1 = infinito
}

const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.ttlMs === -1) return entry.data;
  if (Date.now() - entry.cachedAt < entry.ttlMs) return entry.data;
  cache.delete(key);
  return null;
}

function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, cachedAt: Date.now(), ttlMs });
}

function cacheInvalidate(key: string): void {
  cache.delete(key);
}

// TTL costanti
const TTL_PROPERTIES = -1;          // indefinito — cambia raramente
const TTL_CALENDAR = 6 * 60 * 60 * 1000; // 6 ore in ms

// ─── Auth ────────────────────────────────────────────────────────────────────

interface TokenState {
  token: string;
  refreshToken: string;
  expiresAt: number; // timestamp ms
}

let tokenState: TokenState | null = null;

const BASE_URL = 'https://beds24.com/api/v2';

/**
 * Inizializza il client con il refresh token salvato nelle env.
 * Da chiamare all'avvio del server (es. in route handler o middleware).
 * Il refresh token viene ottenuto UNA VOLTA dal pannello Beds24
 * (Settings → Marketplace → API → Generate invite code → setup).
 */
async function initToken(): Promise<void> {
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('BEDS24_REFRESH_TOKEN non impostato nelle variabili d\'ambiente');
  }

  const res = await fetch(`${BASE_URL}/authentication/token`, {
    headers: { refreshToken },
  });

  if (!res.ok) {
    throw new Error(`Beds24 auth error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  tokenState = {
    token: data.token,
    refreshToken: data.refreshToken ?? refreshToken,
    expiresAt: Date.now() + (data.expiresIn ?? 86400) * 1000,
  };
}

/**
 * Restituisce un token valido, rinnovandolo automaticamente se scaduto.
 */
async function getToken(): Promise<string> {
  // Rinnova se mancano meno di 30 minuti alla scadenza
  const BUFFER_MS = 30 * 60 * 1000;
  if (!tokenState || Date.now() > tokenState.expiresAt - BUFFER_MS) {
    await initToken();
  }
  return tokenState!.token;
}

// ─── Request helper ──────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      token,
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Beds24 API error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

// ─── Metodi pubblici ─────────────────────────────────────────────────────────

/**
 * Recupera tutte le proprietà con le relative rooms.
 * Cachato indefinitamente — i nomi degli appartamenti non cambiano.
 * Invalidare manualmente solo se si aggiunge/rimuove una proprietà.
 */
export async function getProperties(): Promise<Beds24Property[]> {
  const cacheKey = 'properties:all';
  const cached = cacheGet<Beds24Property[]>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<{ properties: Beds24Property[] }>(
    '/properties?includeAllRooms=true'
  );

  cacheSet(cacheKey, data.properties, TTL_PROPERTIES);
  return data.properties;
}

/**
 * Recupera prezzi e disponibilità giornalieri per una room.
 * Cachato 6h — invalidato via webhook quando Beds24 notifica un cambiamento.
 */
export async function getRoomCalendar(
  roomId: number,
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<Beds24CalendarDay[]> {
  const cacheKey = `calendar:${roomId}:${startDate}:${endDate}`;
  const cached = cacheGet<Beds24CalendarDay[]>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<{ calendar: Beds24CalendarDay[] }>(
    `/inventory/rooms/calendar?roomId=${roomId}&startDate=${startDate}&endDate=${endDate}`
  );

  cacheSet(cacheKey, data.calendar, TTL_CALENDAR);
  return data.calendar;
}

/**
 * Ottiene il prezzo finale reale per date + occupancy specifiche.
 * NON cachato — chiamata real-time solo al momento della conferma (step 6).
 */
export async function getRoomOffer(params: {
  roomId: number;
  checkIn: string;
  checkOut: string;
  numAdult: number;
  numChild: number;
  voucherCode?: string;
}): Promise<Beds24Offer | null> {
  const query = new URLSearchParams({
    roomId: String(params.roomId),
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    numAdult: String(params.numAdult),
    numChild: String(params.numChild),
    ...(params.voucherCode ? { voucherCode: params.voucherCode } : {}),
  });

  const data = await apiFetch<{ offers: Beds24Offer[] }>(
    `/inventory/rooms/offers?${query}`
  );

  return data.offers?.[0] ?? null;
}

/**
 * Crea una prenotazione su Beds24.
 * Chiamata real-time solo alla conferma finale.
 */
export async function createBooking(
  payload: Beds24BookingPayload
): Promise<{ bookId: string }> {
  return apiFetch<{ bookId: string }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Invalida la cache del calendario per una room specifica.
 * Chiamato dall'endpoint webhook quando Beds24 notifica un cambiamento.
 */
export function invalidateRoomCache(roomId: number): void {
  // Rimuove tutte le entry di cache che riguardano questa room
  for (const key of cache.keys()) {
    if (key.startsWith(`calendar:${roomId}:`)) {
      cacheInvalidate(key);
    }
  }
}

/**
 * Invalida tutta la cache (utile per debug o manutenzione).
 */
export function invalidateAllCache(): void {
  cache.clear();
}
