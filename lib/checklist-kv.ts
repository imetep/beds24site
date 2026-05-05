/**
 * lib/checklist-kv.ts
 *
 * Storage delle ChecklistMaster (definizioni importate da xlsx) su Upstash Redis.
 *
 * Chiavi:
 *   checklist-master:{ruolo}   → JSON ChecklistMaster (sostituita ad ogni upload)
 *
 * Le ISTANZE compilate (turnover/intervento) sono salvate dentro il record
 * Task corrispondente, non qui — vedi lib/task-kv.ts.
 */

import { Redis } from '@upstash/redis';
import type { ChecklistMaster } from './checklist-types';
import { RUOLI, type Ruolo } from './operatori-types';

let _client: Redis | null = null;

function client(): Redis {
  if (_client) return _client;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('[checklist-kv] KV_REST_API_URL / KV_REST_API_TOKEN mancanti');
  }
  _client = new Redis({ url, token });
  return _client;
}

const MASTER_PREFIX = 'checklist-master:';

function masterKey(ruolo: Ruolo): string {
  return `${MASTER_PREFIX}${ruolo}`;
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return null;
}

/**
 * Salva (sostituisce completamente) la master per un ruolo.
 * Le istanze esistenti (turnover compilati) non sono toccate: hanno il loro
 * snapshot delle voci, congelato al momento della creazione.
 */
export async function saveChecklistMaster(master: ChecklistMaster): Promise<void> {
  await client().set(masterKey(master.ruolo), JSON.stringify(master));
}

export async function getChecklistMaster(ruolo: Ruolo): Promise<ChecklistMaster | null> {
  return parseJson<ChecklistMaster>(await client().get(masterKey(ruolo)));
}

/**
 * Restituisce la master per ogni ruolo (null se non ancora caricata).
 * Usato dalla pagina admin /admin/checklist per mostrare lo stato dei 4 ruoli.
 */
export async function getAllChecklistMasters(): Promise<Record<Ruolo, ChecklistMaster | null>> {
  const keys = RUOLI.map(masterKey);
  const values = await client().mget<(string | ChecklistMaster | null)[]>(...keys);
  const out: Record<Ruolo, ChecklistMaster | null> = {
    pulizie: null, manutentore: null, giardiniere: null, receptionist: null,
  };
  RUOLI.forEach((r, i) => {
    out[r] = parseJson<ChecklistMaster>(values[i]);
  });
  return out;
}

export async function deleteChecklistMaster(ruolo: Ruolo): Promise<void> {
  await client().del(masterKey(ruolo));
}
