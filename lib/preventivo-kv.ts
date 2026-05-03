/**
 * lib/preventivo-kv.ts
 *
 * Operazioni CRUD su Upstash Redis per Preventivi e lock bonifico.
 *
 * Chiavi:
 *   preventivo:{id}                                  → JSON Preventivo, TTL 48h
 *                                                       (rimosso TTL quando status='converted')
 *   preventivo-lock:{roomId}:{arrival}:{departure}   → JSON PreventivoLock, TTL 20 min
 *
 * Listing via SCAN (non KEYS) per essere production-safe anche con migliaia di chiavi.
 */

import { Redis } from '@upstash/redis';
import {
  PREVENTIVO_TTL_SEC,
  LOCK_BONIFICO_TTL_SEC,
  type Preventivo,
  type PreventivoLock,
} from './preventivo-types';

// ─── Client singleton ────────────────────────────────────────────────────────

let _client: Redis | null = null;

function client(): Redis {
  if (_client) return _client;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('[preventivo-kv] KV_REST_API_URL / KV_REST_API_TOKEN mancanti');
  }
  _client = new Redis({ url, token });
  return _client;
}

// ─── Preventivo CRUD ─────────────────────────────────────────────────────────

const PREVENTIVO_PREFIX = 'preventivo:';

function preventivoKey(id: string): string {
  return `${PREVENTIVO_PREFIX}${id}`;
}

/**
 * Salva un preventivo. TTL 48h se status='active', persistente se 'converted'.
 * Per altri stati (expired/cancelled) mantiene TTL 48h dal createdAt residuo.
 */
export async function savePreventivo(p: Preventivo): Promise<void> {
  const key = preventivoKey(p.id);
  if (p.status === 'converted') {
    // persistente: il preventivo convertito è uno storico utile
    await client().set(key, JSON.stringify(p));
  } else {
    // TTL residuo dal createdAt originale
    const remainingSec = Math.max(60, Math.floor((p.expiresAt - Date.now()) / 1000));
    await client().set(key, JSON.stringify(p), { ex: remainingSec });
  }
}

export async function getPreventivo(id: string): Promise<Preventivo | null> {
  const raw = await client().get<string | Preventivo>(preventivoKey(id));
  if (!raw) return null;
  if (typeof raw === 'object') return raw as Preventivo;
  try {
    return JSON.parse(raw) as Preventivo;
  } catch {
    return null;
  }
}

export async function deletePreventivo(id: string): Promise<void> {
  await client().del(preventivoKey(id));
}

/**
 * Lista tutti i preventivi via SCAN. Per admin panel.
 * Ordinati per createdAt desc (più recenti prima).
 */
export async function listPreventivi(): Promise<Preventivo[]> {
  const keys = await scanKeys(`${PREVENTIVO_PREFIX}*`);
  if (keys.length === 0) return [];
  const values = await client().mget<(string | Preventivo | null)[]>(...keys);
  const results: Preventivo[] = [];
  for (const v of values) {
    if (!v) continue;
    if (typeof v === 'object') {
      results.push(v as Preventivo);
    } else {
      try {
        results.push(JSON.parse(v) as Preventivo);
      } catch {
        // skip invalid
      }
    }
  }
  results.sort((a, b) => b.createdAt - a.createdAt);
  return results;
}

// ─── Lock bonifico ───────────────────────────────────────────────────────────

const LOCK_PREFIX = 'preventivo-lock:';

function lockKey(roomId: number, arrival: string, departure: string): string {
  return `${LOCK_PREFIX}${roomId}:${arrival}:${departure}`;
}

/**
 * Crea un lock bonifico con TTL 20 min. Sovrascrive un eventuale lock esistente
 * sulla stessa tripla (roomId,arrival,departure) — non dovrebbe mai accadere
 * perché /api/availability sottrae i lock attivi.
 */
export async function saveLock(lock: PreventivoLock): Promise<void> {
  await client().set(
    lockKey(lock.roomId, lock.arrival, lock.departure),
    JSON.stringify(lock),
    { ex: LOCK_BONIFICO_TTL_SEC }
  );
}

export async function getLock(
  roomId: number,
  arrival: string,
  departure: string
): Promise<PreventivoLock | null> {
  const raw = await client().get<string | PreventivoLock>(lockKey(roomId, arrival, departure));
  if (!raw) return null;
  if (typeof raw === 'object') return raw as PreventivoLock;
  try {
    return JSON.parse(raw) as PreventivoLock;
  } catch {
    return null;
  }
}

export async function deleteLock(
  roomId: number,
  arrival: string,
  departure: string
): Promise<void> {
  await client().del(lockKey(roomId, arrival, departure));
}

/**
 * TTL residuo (in secondi) di un lock. -1 se non esiste o scaduto.
 * Usato dall'admin per mostrare countdown.
 */
export async function getLockTtl(
  roomId: number,
  arrival: string,
  departure: string
): Promise<number> {
  const ttl = await client().ttl(lockKey(roomId, arrival, departure));
  return ttl > 0 ? ttl : -1;
}

/**
 * Lista tutti i lock attivi per una specifica camera. Usato da /api/availability
 * per sottrarre i range bloccati dalle date disponibili.
 */
export async function listLocksForRoom(roomId: number): Promise<PreventivoLock[]> {
  const keys = await scanKeys(`${LOCK_PREFIX}${roomId}:*`);
  return readLocks(keys);
}

/** Lista tutti i lock attivi (qualsiasi camera). Usato in admin. */
export async function listAllLocks(): Promise<PreventivoLock[]> {
  const keys = await scanKeys(`${LOCK_PREFIX}*`);
  return readLocks(keys);
}

async function readLocks(keys: string[]): Promise<PreventivoLock[]> {
  if (keys.length === 0) return [];
  const values = await client().mget<(string | PreventivoLock | null)[]>(...keys);
  const out: PreventivoLock[] = [];
  for (const v of values) {
    if (!v) continue;
    if (typeof v === 'object') out.push(v as PreventivoLock);
    else {
      try { out.push(JSON.parse(v) as PreventivoLock); } catch {}
    }
  }
  return out;
}

// ─── SCAN helper ─────────────────────────────────────────────────────────────

/**
 * Itera SCAN finché cursor non è 0. Restituisce tutte le chiavi che matchano.
 * Sicuro in produzione (a differenza di KEYS).
 */
async function scanKeys(pattern: string): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | number = 0;
  do {
    const [next, batch] = await client().scan(cursor, { match: pattern, count: 200 });
    out.push(...batch);
    cursor = next;
  } while (String(cursor) !== '0');
  return out;
}
