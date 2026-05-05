// scripts/migra-turnover-manutentore.mjs
//
// Migrazione one-shot: rinomina indici turnover-by-book:{bookId} →
// turnover-by-book:pulizie:{bookId} e crea task manutentore per ogni
// turnover-pulizie esistente che non ne ha già uno.
//
// Idempotente: se la migrazione è già stata fatta, niente succede.
//
// Uso: node scripts/migra-turnover-manutentore.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) {
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1]] = v;
  }
}
const redis = new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN });

// ─── Helpers ────────────────────────────────────────────────────────────────

async function scanAll(pattern) {
  const out = [];
  let cursor = 0;
  do {
    const [next, batch] = await redis.scan(cursor, { match: pattern, count: 200 });
    out.push(...batch);
    cursor = next;
  } while (String(cursor) !== '0');
  return out;
}

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return null; }
}

// ─── 1) Rinomina indici turnover-by-book:{bookId} → turnover-by-book:pulizie:{bookId} ──

console.log('STEP 1: rinomina indici turnover-by-book vecchi → :pulizie:');
const allKeys = await scanAll('turnover-by-book:*');
let rinominati = 0, giàNuovi = 0;

for (const key of allKeys) {
  // schema vecchio: turnover-by-book:NUMBER (no ruolo)
  // schema nuovo:  turnover-by-book:RUOLO:NUMBER
  const rest = key.slice('turnover-by-book:'.length);
  if (/^\d+$/.test(rest)) {
    // Vecchio schema: rinomina
    const taskId = await redis.get(key);
    if (taskId) {
      const newKey = `turnover-by-book:pulizie:${rest}`;
      await redis.set(newKey, taskId);
      await redis.del(key);
      rinominati++;
      console.log(`  ✓ ${key} → ${newKey}`);
    }
  } else {
    giàNuovi++;
  }
}
console.log(`  Totale: ${rinominati} rinominati, ${giàNuovi} già nel nuovo schema.\n`);

// ─── 2) Carica master manutentore ─────────────────────────────────────────

console.log('STEP 2: carica master manutentore');
const masterRaw = await redis.get('checklist-master:manutentore');
const master = parseJson(masterRaw);
if (!master || !Array.isArray(master.voci) || master.voci.length === 0) {
  console.log('  ⚠ Master manutentore NON caricata. Carica /admin/checklist e rilancia lo script.');
  process.exit(0);
}
console.log(`  ✓ master manutentore: ${master.voci.length} voci\n`);

// ─── 3) Per ogni turnover-pulizie, crea il manutentore se manca ──────────

console.log('STEP 3: creazione task manutentore per turnover-pulizie esistenti');

const pulizieKeys = await scanAll('turnover-by-book:pulizie:*');
console.log(`  ${pulizieKeys.length} turnover pulizie esistenti`);

// Pre-cache case
const caseIds = await redis.smembers('case:list');
const caseRaw = caseIds.length > 0 ? await redis.mget(...caseIds.map(id => `casa:${id}`)) : [];
const caseById = new Map();
const caseByRoomId = new Map();
for (const v of caseRaw) {
  const c = parseJson(v);
  if (!c) continue;
  caseById.set(c.id, c);
  caseByRoomId.set(c.beds24RoomId, c);
}

let creati = 0, skipEsistenti = 0, skipSenzaCasa = 0;

for (const pulKey of pulizieKeys) {
  const bookId = Number(pulKey.split(':').pop());
  if (!Number.isFinite(bookId)) continue;

  // Già esiste task manutentore?
  const manKey = `turnover-by-book:manutentore:${bookId}`;
  const existsMan = await redis.get(manKey);
  if (existsMan) { skipEsistenti++; continue; }

  // Recupera task pulizie per dati
  const pulTaskId = await redis.get(pulKey);
  if (!pulTaskId) continue;
  const pulTaskRaw = await redis.get(`task:${pulTaskId}`);
  const pulTask = parseJson(pulTaskRaw);
  if (!pulTask) continue;

  const casa = caseById.get(pulTask.casaId);
  if (!casa) { skipSenzaCasa++; continue; }

  // Costruisci checklist manutentore filtrando voci NA della casa
  const vociNAids = new Set(
    (casa.vociNonApplicabili ?? [])
      .filter(v => v.ruolo === 'manutentore')
      .map(v => v.voceId),
  );
  const snapshots = [];
  for (const v of master.voci) {
    if (vociNAids.has(v.id)) continue;
    if (v.frequenza !== 'Ogni turnover') continue;
    snapshots.push({
      id:              v.id,
      ambiente:        v.ambiente,
      attivita:        v.attivita,
      dettaglio:       v.dettaglio,
      frequenza:       v.frequenza,
      priorita:        v.priorita,
      fotoRichiesta:   v.fotoRichiesta,
      controlloFinale: v.controlloFinale,
    });
  }

  const id = randomUUID();
  const now = Date.now();

  const manTask = {
    id,
    tipo:            'turnover',
    ruoloRichiesto:  'manutentore',
    casaId:          casa.id,
    data:            pulTask.data,
    beds24BookId:    bookId,
    titolo:          `Controllo manutentore ${casa.nome} (${pulTask.data})`,
    descrizione:     pulTask.descrizione ? `${pulTask.descrizione} — controllo tecnico routine` : 'Controllo tecnico routine',
    stato:           'da-assegnare',
    checklist: {
      ruolo:     'manutentore',
      snapshots,
      stati:     snapshots.map(s => ({ voceId: s.id, spuntata: false })),
    },
    segnalazioniIds: [],
    createdAt:       now,
    updatedAt:       now,
    createdBy:       'system',
  };

  // Salva con tutti gli indici
  await redis.set(`task:${id}`, JSON.stringify(manTask));
  await redis.sadd(`tasks:by-data:${pulTask.data}`, id);
  await redis.sadd(`tasks:by-casa:${casa.id}`, id);
  await redis.sadd('tasks:non-assegnati', id);
  await redis.sadd('tasks:open', id);
  await redis.set(manKey, id);

  creati++;
  console.log(`  ✓ ${casa.nome.padEnd(18)} (book ${bookId}, ${pulTask.data}) → manutentore task ${id}`);
}

console.log(`\nTotale: ${creati} creati, ${skipEsistenti} esistenti, ${skipSenzaCasa} senza casa.`);
