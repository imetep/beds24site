/**
 * lib/segnalazioni-kv.ts
 *
 * CRUD Segnalazioni su Upstash Redis.
 *
 * Chiavi:
 *   segnalazione:{id}                → JSON Segnalazione
 *   segnalazioni:open                → SET di id aperti (aperta + in-triage)
 *   segnalazioni:by-task:{taskId}    → SET (per recuperare segnalazioni del task)
 *   segnalazioni:by-casa:{casaId}    → SET (storico per casa)
 */

import { Redis } from '@upstash/redis';
import {
  type Segnalazione,
  type SegnalazioneFilter,
  isSegnalazioneAperta,
} from './segnalazioni-types';

let _client: Redis | null = null;

function client(): Redis {
  if (_client) return _client;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('[segnalazioni-kv] KV_REST_API_URL / KV_REST_API_TOKEN mancanti');
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

const SEG_PREFIX     = 'segnalazione:';
const SEG_OPEN       = 'segnalazioni:open';
const SEG_BY_TASK    = 'segnalazioni:by-task:';
const SEG_BY_CASA    = 'segnalazioni:by-casa:';

function segKey(id: string): string             { return `${SEG_PREFIX}${id}`; }
function byTaskKey(taskId: string): string      { return `${SEG_BY_TASK}${taskId}`; }
function byCasaKey(casaId: string): string      { return `${SEG_BY_CASA}${casaId}`; }

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function saveSegnalazione(s: Segnalazione): Promise<void> {
  const c = client();
  const pipe = c.pipeline();
  pipe.set(segKey(s.id), JSON.stringify(s));
  pipe.sadd(byTaskKey(s.taskId), s.id);
  pipe.sadd(byCasaKey(s.casaId), s.id);
  if (isSegnalazioneAperta(s)) pipe.sadd(SEG_OPEN, s.id);
  else                          pipe.srem(SEG_OPEN, s.id);
  await pipe.exec();
}

export async function getSegnalazione(id: string): Promise<Segnalazione | null> {
  return parseJson<Segnalazione>(await client().get(segKey(id)));
}

export async function deleteSegnalazione(id: string): Promise<void> {
  const s = await getSegnalazione(id);
  if (!s) return;
  const pipe = client().pipeline();
  pipe.del(segKey(id));
  pipe.srem(byTaskKey(s.taskId), id);
  pipe.srem(byCasaKey(s.casaId), id);
  pipe.srem(SEG_OPEN, id);
  await pipe.exec();
}

// ─── Listing ─────────────────────────────────────────────────────────────────

async function getSegnalazioniByIds(ids: string[]): Promise<Segnalazione[]> {
  if (ids.length === 0) return [];
  const keys = ids.map(segKey);
  const values = await client().mget<(string | Segnalazione | null)[]>(...keys);
  const out: Segnalazione[] = [];
  for (const v of values) {
    const parsed = parseJson<Segnalazione>(v);
    if (parsed) out.push(parsed);
  }
  return out;
}

export async function listSegnalazioniAperte(): Promise<Segnalazione[]> {
  const ids = await client().smembers(SEG_OPEN);
  const segs = await getSegnalazioniByIds(ids);
  // più recenti prima, e dentro stessa data: critiche/alte prima
  const order: Record<string, number> = { Critica: 0, Alta: 1, Media: 2, Bassa: 3 };
  segs.sort((a, b) => {
    if (a.gravita !== b.gravita) return (order[a.gravita] ?? 9) - (order[b.gravita] ?? 9);
    return b.createdAt - a.createdAt;
  });
  return segs;
}

export async function listSegnalazioniByTask(taskId: string): Promise<Segnalazione[]> {
  const ids = await client().smembers(byTaskKey(taskId));
  return getSegnalazioniByIds(ids);
}

export async function listSegnalazioniByCasa(casaId: string): Promise<Segnalazione[]> {
  const ids = await client().smembers(byCasaKey(casaId));
  const segs = await getSegnalazioniByIds(ids);
  segs.sort((a, b) => b.createdAt - a.createdAt);
  return segs;
}

/**
 * Listing con filtro generico. Default: aperte (inbox).
 * Se filter.dataFrom/dataTo sono passati, applica filtro temporale post-fetch.
 */
export async function listSegnalazioni(filter: SegnalazioneFilter = {}): Promise<Segnalazione[]> {
  let candidates: Segnalazione[];

  if (filter.casaId) {
    candidates = await listSegnalazioniByCasa(filter.casaId);
  } else {
    candidates = await listSegnalazioniAperte();
  }

  return candidates.filter(s => matchesFilter(s, filter));
}

function matchesFilter(s: Segnalazione, f: SegnalazioneFilter): boolean {
  if (f.stato) {
    const stati = Array.isArray(f.stato) ? f.stato : [f.stato];
    if (!stati.includes(s.stato)) return false;
  }
  if (f.gravita) {
    const grv = Array.isArray(f.gravita) ? f.gravita : [f.gravita];
    if (!grv.includes(s.gravita)) return false;
  }
  if (f.casaId && s.casaId !== f.casaId) return false;
  if (f.segnalataDa && s.segnalataDa !== f.segnalataDa) return false;
  if (f.dataFrom) {
    const fromMs = new Date(f.dataFrom + 'T00:00:00Z').getTime();
    if (s.createdAt < fromMs) return false;
  }
  if (f.dataTo) {
    const toMs = new Date(f.dataTo + 'T23:59:59Z').getTime();
    if (s.createdAt > toMs) return false;
  }
  return true;
}
