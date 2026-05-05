/**
 * lib/task-kv.ts
 *
 * CRUD Task su Upstash Redis con indici per query frequenti.
 *
 * Chiavi:
 *   task:{id}                       → JSON Task (persistente)
 *   tasks:by-data:{YYYY-MM-DD}      → SET di task id (per giorno)
 *   tasks:by-operator:{operatoreId} → SET di task id (per operatore - tutti)
 *   tasks:by-casa:{casaId}          → SET di task id (per casa - storico)
 *   tasks:non-assegnati             → SET globale di task con stato='da-assegnare'
 *   tasks:open                      → SET globale dei task aperti (da-assegnare/assegnato/in-corso/lavoro-terminato)
 *
 * Filtri composti: si lavora in memoria dopo aver pescato dall'indice
 * più selettivo (di solito by-data o by-operator).
 */

import { Redis } from '@upstash/redis';
import {
  type Task,
  type TaskFilter,
  isTaskAperto,
} from './task-types';

let _client: Redis | null = null;

function client(): Redis {
  if (_client) return _client;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('[task-kv] KV_REST_API_URL / KV_REST_API_TOKEN mancanti');
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

const TASK_PREFIX        = 'task:';
const TASKS_BY_DATA      = 'tasks:by-data:';
const TASKS_BY_OPERATOR  = 'tasks:by-operator:';
const TASKS_BY_CASA      = 'tasks:by-casa:';
const TASKS_UNASSIGNED   = 'tasks:non-assegnati';
const TASKS_OPEN         = 'tasks:open';

function taskKey(id: string): string             { return `${TASK_PREFIX}${id}`; }
function byDataKey(date: string): string         { return `${TASKS_BY_DATA}${date}`; }
function byOperatorKey(opId: string): string     { return `${TASKS_BY_OPERATOR}${opId}`; }
function byCasaKey(casaId: string): string       { return `${TASKS_BY_CASA}${casaId}`; }

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Salva (crea o aggiorna) un task con cleanup atomico degli indici se cambiati.
 *
 * Indici aggiornati:
 *   - by-data: rimosso vecchia data, aggiunto nuova data se diversa
 *   - by-operator: rimosso vecchio op, aggiunto nuovo op
 *   - by-casa: invariato (la casa di un task non dovrebbe cambiare)
 *   - non-assegnati: aggiunto/rimosso in base allo stato
 *   - open: aggiunto/rimosso in base allo stato
 */
export async function saveTask(task: Task): Promise<void> {
  const c = client();
  const old = await getTask(task.id);

  const pipe = c.pipeline();
  pipe.set(taskKey(task.id), JSON.stringify(task));

  // by-data: cleanup se cambiata
  if (old && old.data !== task.data) {
    pipe.srem(byDataKey(old.data), task.id);
  }
  pipe.sadd(byDataKey(task.data), task.id);

  // by-operator: cleanup se cambiato
  if (old?.operatoreId && old.operatoreId !== task.operatoreId) {
    pipe.srem(byOperatorKey(old.operatoreId), task.id);
  }
  if (task.operatoreId) {
    pipe.sadd(byOperatorKey(task.operatoreId), task.id);
  }

  // by-casa: aggiungi sempre (idempotente). Cleanup solo se cambia (raro).
  if (old && old.casaId !== task.casaId) {
    pipe.srem(byCasaKey(old.casaId), task.id);
  }
  pipe.sadd(byCasaKey(task.casaId), task.id);

  // non-assegnati
  if (task.stato === 'da-assegnare') pipe.sadd(TASKS_UNASSIGNED, task.id);
  else                                pipe.srem(TASKS_UNASSIGNED, task.id);

  // open
  if (isTaskAperto(task)) pipe.sadd(TASKS_OPEN, task.id);
  else                    pipe.srem(TASKS_OPEN, task.id);

  await pipe.exec();
}

export async function getTask(id: string): Promise<Task | null> {
  return parseJson<Task>(await client().get(taskKey(id)));
}

export async function deleteTask(id: string): Promise<void> {
  const t = await getTask(id);
  if (!t) return;
  const pipe = client().pipeline();
  pipe.del(taskKey(id));
  pipe.srem(byDataKey(t.data), id);
  if (t.operatoreId) pipe.srem(byOperatorKey(t.operatoreId), id);
  pipe.srem(byCasaKey(t.casaId), id);
  pipe.srem(TASKS_UNASSIGNED, id);
  pipe.srem(TASKS_OPEN, id);
  await pipe.exec();
}

// ─── Listing helpers (lookup per ids) ───────────────────────────────────────

async function getTasksByIds(ids: string[]): Promise<Task[]> {
  if (ids.length === 0) return [];
  const keys = ids.map(taskKey);
  const values = await client().mget<(string | Task | null)[]>(...keys);
  const out: Task[] = [];
  for (const v of values) {
    const parsed = parseJson<Task>(v);
    if (parsed) out.push(parsed);
  }
  return out;
}

// ─── Listing API ────────────────────────────────────────────────────────────

/** Tutti i task di un giorno YYYY-MM-DD. */
export async function listTasksByDate(date: string): Promise<Task[]> {
  const ids = await client().smembers(byDataKey(date));
  return getTasksByIds(ids);
}

/** Tutti i task di un operatore (qualsiasi data/stato). */
export async function listTasksByOperator(operatoreId: string): Promise<Task[]> {
  const ids = await client().smembers(byOperatorKey(operatoreId));
  return getTasksByIds(ids);
}

/** Tutti i task di una casa (storico completo). */
export async function listTasksByCasa(casaId: string): Promise<Task[]> {
  const ids = await client().smembers(byCasaKey(casaId));
  return getTasksByIds(ids);
}

/** Task con stato='da-assegnare' (per pannello smistamento admin). */
export async function listUnassignedTasks(): Promise<Task[]> {
  const ids = await client().smembers(TASKS_UNASSIGNED);
  return getTasksByIds(ids);
}

/** Task aperti (qualsiasi stato non chiuso). */
export async function listOpenTasks(): Promise<Task[]> {
  const ids = await client().smembers(TASKS_OPEN);
  return getTasksByIds(ids);
}

/**
 * Listing con filtro generico. Usa l'indice più selettivo disponibile:
 *   - data esatta → by-data
 *   - operatoreId → by-operator
 *   - casaId      → by-casa
 *   - daAssegnare → tasks:non-assegnati
 *   - default     → tasks:open (più i chiusi se richiesto)
 *
 * Poi filtra in memoria sugli altri criteri.
 */
export async function listTasks(filter: TaskFilter = {}): Promise<Task[]> {
  let candidates: Task[];

  if (filter.daAssegnare) {
    candidates = await listUnassignedTasks();
  } else if (filter.data) {
    candidates = await listTasksByDate(filter.data);
  } else if (filter.operatoreId) {
    candidates = await listTasksByOperator(filter.operatoreId);
  } else if (filter.casaId) {
    candidates = await listTasksByCasa(filter.casaId);
  } else if (filter.dataFrom && filter.dataTo) {
    // Iter sui giorni del range. Per range stretti (1-2 settimane) è efficiente.
    const dates = enumerateDates(filter.dataFrom, filter.dataTo);
    const seen = new Set<string>();
    candidates = [];
    for (const d of dates) {
      const tasks = await listTasksByDate(d);
      for (const t of tasks) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        candidates.push(t);
      }
    }
  } else {
    candidates = await listOpenTasks();
  }

  return candidates.filter(t => matchesFilter(t, filter));
}

function matchesFilter(t: Task, f: TaskFilter): boolean {
  if (f.ruolo && t.ruoloRichiesto !== f.ruolo) return false;
  if (f.tipo  && t.tipo !== f.tipo)            return false;
  if (f.casaId && t.casaId !== f.casaId)       return false;
  if (f.operatoreId && t.operatoreId !== f.operatoreId) return false;

  if (f.stato) {
    const stati = Array.isArray(f.stato) ? f.stato : [f.stato];
    if (!stati.includes(t.stato)) return false;
  }

  if (f.data && t.data !== f.data) return false;
  if (f.dataFrom && t.data < f.dataFrom) return false;
  if (f.dataTo   && t.data > f.dataTo)   return false;

  return true;
}

// ─── Date utils ─────────────────────────────────────────────────────────────

function enumerateDates(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
