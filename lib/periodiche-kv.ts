/**
 * lib/periodiche-kv.ts
 *
 * Storage Redis dell'ultima esecuzione delle voci periodiche per
 * (casa, ruolo, voceId). Aggiornato automaticamente quando un task
 * tipo='periodica' viene completato dall'admin.
 *
 * Chiavi:
 *   periodica:last:{casaId}:{ruolo}:{voceId} → JSON UltimaEsecuzione
 *   periodiche:scadenze-ids                  → SET di "{casaId}:{ruolo}:{voceId}"
 *
 * Il SET serve per scan O(N) efficiente al render della pagina periodiche.
 *
 * NOTA: la "scadenza virtuale" non è memorizzata; viene calcolata a runtime
 * come ultimaEsecuzione + intervallo(frequenza). Vedi lib/periodiche-types.ts.
 */

import { Redis } from '@upstash/redis';
import type { UltimaEsecuzione } from './periodiche-types';
import type { Ruolo } from './operatori-types';

let _client: Redis | null = null;
function client(): Redis {
  if (_client) return _client;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('[periodiche-kv] KV credentials mancanti');
  _client = new Redis({ url, token });
  return _client;
}

const LAST_PREFIX = 'periodica:last:';
const SET_KEY     = 'periodiche:scadenze-ids';

function lastKey(casaId: string, ruolo: Ruolo, voceId: string): string {
  return `${LAST_PREFIX}${casaId}:${ruolo}:${voceId}`;
}

function compositeId(casaId: string, ruolo: Ruolo, voceId: string): string {
  return `${casaId}:${ruolo}:${voceId}`;
}

function parseCompositeId(s: string): { casaId: string; ruolo: Ruolo; voceId: string } | null {
  const parts = s.split(':');
  if (parts.length < 3) return null;
  // casaId è uuid (5 segments separati da -); ruolo è 1 parola; voceId resto
  // L'uuid contiene "-" non ":", quindi i parts[0] è uuid intero, parts[1] è ruolo, resto è voceId
  return {
    casaId:  parts[0],
    ruolo:   parts[1] as Ruolo,
    voceId:  parts.slice(2).join(':'),
  };
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return null;
}

// ─── Get / Set ──────────────────────────────────────────────────────────────

export async function getUltimaEsecuzione(
  casaId: string, ruolo: Ruolo, voceId: string,
): Promise<UltimaEsecuzione | null> {
  return parseJson<UltimaEsecuzione>(await client().get(lastKey(casaId, ruolo, voceId)));
}

export async function setUltimaEsecuzione(record: UltimaEsecuzione): Promise<void> {
  const c = client();
  const k = lastKey(record.casaId, record.ruolo, record.voceId);
  const pipe = c.pipeline();
  pipe.set(k, JSON.stringify(record));
  pipe.sadd(SET_KEY, compositeId(record.casaId, record.ruolo, record.voceId));
  await pipe.exec();
}

/**
 * Restituisce TUTTE le ultime esecuzioni registrate. Usato da
 * lib/periodiche.ts per costruire la vista scadenze.
 */
export async function listAllUltimeEsecuzioni(): Promise<UltimaEsecuzione[]> {
  const c = client();
  const ids = await c.smembers(SET_KEY);
  if (ids.length === 0) return [];
  const keys = ids
    .map(parseCompositeId)
    .filter((x): x is NonNullable<ReturnType<typeof parseCompositeId>> => x !== null)
    .map(x => lastKey(x.casaId, x.ruolo, x.voceId));
  if (keys.length === 0) return [];
  const values = await c.mget<(string | UltimaEsecuzione | null)[]>(...keys);
  const out: UltimaEsecuzione[] = [];
  for (const v of values) {
    const parsed = parseJson<UltimaEsecuzione>(v);
    if (parsed) out.push(parsed);
  }
  return out;
}

/**
 * Cleanup: cancella record di ultime esecuzioni per case archiviate o
 * voci non più presenti nelle master. Da chiamare manualmente se necessario.
 */
export async function deleteUltimaEsecuzione(
  casaId: string, ruolo: Ruolo, voceId: string,
): Promise<void> {
  const c = client();
  const pipe = c.pipeline();
  pipe.del(lastKey(casaId, ruolo, voceId));
  pipe.srem(SET_KEY, compositeId(casaId, ruolo, voceId));
  await pipe.exec();
}
