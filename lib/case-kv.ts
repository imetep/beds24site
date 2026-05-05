/**
 * lib/case-kv.ts
 *
 * CRUD anagrafica Case su Upstash Redis.
 *
 * Chiavi:
 *   casa:{id}                    → JSON Casa (persistente)
 *   casa-by-room:{beds24RoomId}  → casaId (indice univoco)
 *   case:list                    → SET di casaId (per listing admin)
 *
 * Note: archiviata=true non rimuove la casa né il suo indice. Le case
 * archiviate sono filtrate dal listing admin di default ma conservate
 * per lo storico interventi e i task chiusi.
 */

import { Redis } from '@upstash/redis';
import type { Casa } from './case-types';

let _client: Redis | null = null;

function client(): Redis {
  if (_client) return _client;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('[case-kv] KV_REST_API_URL / KV_REST_API_TOKEN mancanti');
  }
  _client = new Redis({ url, token });
  return _client;
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return null;
}

// ─── Chiavi ──────────────────────────────────────────────────────────────────

const CASA_PREFIX     = 'casa:';
const CASA_BY_ROOM    = 'casa-by-room:';
const CASE_LIST_KEY   = 'case:list';

function casaKey(id: string): string             { return `${CASA_PREFIX}${id}`; }
function byRoomKey(roomId: number): string       { return `${CASA_BY_ROOM}${roomId}`; }

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Crea o aggiorna una Casa. Mantiene l'indice by-room atomicamente.
 * Lancia eccezione se beds24RoomId è già usato da un'altra casa.
 */
export async function saveCasa(casa: Casa): Promise<void> {
  const c = client();
  const old = await getCasa(casa.id);

  // Verifica univocità beds24RoomId
  const existingId = await c.get<string>(byRoomKey(casa.beds24RoomId));
  if (existingId && existingId !== casa.id) {
    throw new Error(`Beds24 roomId ${casa.beds24RoomId} è già associato a un'altra casa`);
  }

  const pipe = c.pipeline();
  pipe.set(casaKey(casa.id), JSON.stringify(casa));
  pipe.sadd(CASE_LIST_KEY, casa.id);

  // beds24RoomId changed → cleanup vecchio indice
  if (old && old.beds24RoomId !== casa.beds24RoomId) {
    pipe.del(byRoomKey(old.beds24RoomId));
  }
  pipe.set(byRoomKey(casa.beds24RoomId), casa.id);

  await pipe.exec();
}

export async function getCasa(id: string): Promise<Casa | null> {
  return parseJson<Casa>(await client().get(casaKey(id)));
}

export async function getCasaByRoomId(beds24RoomId: number): Promise<Casa | null> {
  const id = await client().get<string>(byRoomKey(beds24RoomId));
  if (!id) return null;
  return getCasa(id);
}

/**
 * Lista tutte le case, ordinate alfabeticamente per nome.
 * @param includeArchived  se false (default), filtra le archiviate.
 */
export async function listCase(includeArchived = false): Promise<Casa[]> {
  const ids = await client().smembers(CASE_LIST_KEY);
  if (ids.length === 0) return [];
  const keys = ids.map(casaKey);
  const values = await client().mget<(string | Casa | null)[]>(...keys);
  const out: Casa[] = [];
  for (const v of values) {
    const parsed = parseJson<Casa>(v);
    if (!parsed) continue;
    if (!includeArchived && parsed.archiviata) continue;
    out.push(parsed);
  }
  out.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  return out;
}

/** Soft-delete: archivia ma conserva. */
export async function archiveCasa(id: string): Promise<void> {
  const casa = await getCasa(id);
  if (!casa) return;
  casa.archiviata = true;
  casa.updatedAt = Date.now();
  await client().set(casaKey(id), JSON.stringify(casa));
}

export async function unarchiveCasa(id: string): Promise<void> {
  const casa = await getCasa(id);
  if (!casa) return;
  casa.archiviata = false;
  casa.updatedAt = Date.now();
  await client().set(casaKey(id), JSON.stringify(casa));
}

/** Hard-delete con cleanup indici. Da usare solo se la casa non ha mai avuto task. */
export async function deleteCasa(id: string): Promise<void> {
  const casa = await getCasa(id);
  if (!casa) return;
  const pipe = client().pipeline();
  pipe.del(casaKey(id));
  pipe.del(byRoomKey(casa.beds24RoomId));
  pipe.srem(CASE_LIST_KEY, id);
  await pipe.exec();
}
