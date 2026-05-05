// scripts/backfill-task-orari-biancheria.mjs
//
// Backfill dei task turnover esistenti (50 al momento) con:
//   - oraPartenzaOspite (b.departureTime se Beds24 lo espone)
//   - oraArrivoProssimo (next.arrivalTime)
//   - prossimoArrivo (date, bookId, guestName, n. adulti+bambini)
//   - biancheriaProssimo (per task pulizie, calcolo da bedConfig + override)
//
// Idempotente: aggiorna i task esistenti senza toccare stato, operatore,
// checklist, segnalazioniIds. Idempotenza basata su task.beds24BookId
// + ruoloRichiesto.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const BEDS24_REFRESH_TOKEN = env.BEDS24_REFRESH_TOKEN;
if (!BEDS24_REFRESH_TOKEN) {
  console.error('BEDS24_REFRESH_TOKEN mancante in .env.local');
  process.exit(1);
}

// ─── Beds24 token (riuso semplificato del flow di lib/beds24-token.ts) ─────

async function getBeds24Token() {
  // Stesso schema di lib/beds24-token.ts: chiave 'beds24:tokenState'
  const cached = await redis.get('beds24:tokenState');
  let parsed = null;
  if (typeof cached === 'string') {
    try { parsed = JSON.parse(cached); } catch {}
  } else if (cached && typeof cached === 'object') {
    parsed = cached;
  }
  if (parsed?.token && parsed?.expiresAt > Date.now() + 60_000) return parsed.token;

  const refreshToken = parsed?.refreshToken || BEDS24_REFRESH_TOKEN;
  const r = await fetch('https://beds24.com/api/v2/authentication/token', {
    method:  'GET',
    headers: { refreshToken },
  });
  if (!r.ok) throw new Error(`Beds24 token: ${r.status} ${await r.text()}`);
  const j = await r.json();
  const newState = {
    token:        j.token,
    refreshToken: j.refreshToken ?? refreshToken,
    expiresAt:    Date.now() + (j.expiresIn ?? 3600) * 1000,
  };
  await redis.set('beds24:tokenState', JSON.stringify(newState));
  return j.token;
}

// ─── Fetch bookings ────────────────────────────────────────────────────────

async function fetchAllBookings(token, fromDate, toDate) {
  const all = [];
  let page = 1;
  while (true) {
    const r = await fetch(`https://beds24.com/api/v2/bookings?page=${page}`, {
      headers: { token },
      cache:   'no-store',
    });
    if (!r.ok) throw new Error(`Beds24 bookings ${r.status}: ${await r.text()}`);
    const d = await r.json();
    const rows = d.data ?? [];
    const filtered = rows.filter(b =>
      ['new', 'confirmed'].includes(b.status) &&
      b.departure >= fromDate &&
      b.arrival   <= toDate,
    );
    all.push(...filtered);
    const hasNext = d.pages?.nextPageExists === true;
    if (!hasNext) break;
    if (rows.every(b => b.arrival > toDate)) break;
    page++;
  }
  return all;
}

// ─── Helper: legge override Redis biancheria + bedConfig ────────────────────
//
// NB: bedConfig.ts è TS, non posso importarlo da qui. Per il backfill, mi
// limito a leggere se c'è override (guest/admin) e copiare i set se presenti;
// per default 'auto' (calcolo bedConfig server-side), la prossima volta che
// il sync gira con lookahead sopra le date, ricalcola tutto. Per ora il
// backfill scrive `source: 'default', hasConfig: false` quando non c'è
// override — la pulizia vedrà "config N/D, chiedi all'admin".
//
// In alternativa: chiamare /api/admin/biancheria?from=X&to=X (richiede auth
// admin via cookie). Più semplice limitarsi all'override Redis.

async function readOverride(bookId, expectedGuests) {
  try {
    const raw = await redis.get(`beds:v6:${bookId}`);
    if (!raw) return null;
    const stored = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!stored?.bedStates || Object.keys(stored.bedStates).length === 0) return null;
    const cached = stored.numGuests ?? 0;
    if (cached && cached !== expectedGuests) return null;
    return {
      bedStates:     stored.bedStates,
      cribs:         stored.cribs ?? 0,
      adminOverride: !!stored.adminOverride,
    };
  } catch { return null; }
}

// ─── Backfill ──────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const lookaheadEnd = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);

console.log(`Range Beds24: ${today} → ${lookaheadEnd}`);

const token = await getBeds24Token();
const bookings = await fetchAllBookings(token, today, lookaheadEnd);
console.log(`${bookings.length} bookings caricate da Beds24\n`);

// Indice per roomId
const byRoom = new Map();
for (const b of bookings) {
  const arr = byRoom.get(b.roomId) ?? [];
  arr.push(b);
  byRoom.set(b.roomId, arr);
}
for (const [, arr] of byRoom) arr.sort((a, b) => a.arrival.localeCompare(b.arrival));

// Cerca task turnover via SCAN sull'indice tasks:open + tasks per beds24BookId
const openIds = await redis.smembers('tasks:open');
console.log(`${openIds.length} task aperti totali`);

let aggiornati = 0, saltati = 0;

for (const taskId of openIds) {
  const raw = await redis.get(`task:${taskId}`);
  if (!raw) continue;
  const task = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (task.tipo !== 'turnover') { saltati++; continue; }
  if (!task.beds24BookId) { saltati++; continue; }

  // Trova la booking della partenza
  const dep = bookings.find(b => b.id === task.beds24BookId);
  if (!dep) { saltati++; continue; }

  // Prossimo arrivo sulla stessa room
  const sameRoom = byRoom.get(dep.roomId) ?? [];
  const next = sameRoom.find(x => x.arrival >= dep.departure && x.id !== dep.id);

  // Aggiorna campi
  task.oraPartenzaOspite = dep.departureTime || task.oraPartenzaOspite || undefined;
  task.oraArrivoProssimo = next?.arrivalTime || undefined;
  task.beds24BookIdProssimo = next?.id;
  task.prossimoArrivo = next ? {
    date:      next.arrival,
    bookId:    next.id,
    guestName: `${next.firstName} ${next.lastName}`.trim(),
    numAdult:  next.numAdult,
    numChild:  next.numChild,
  } : undefined;

  // Biancheria solo per task pulizie (e solo se prossimo arrivo)
  if (task.ruoloRichiesto === 'pulizie' && next) {
    const guests = next.numAdult + next.numChild;
    const override = await readOverride(next.id, guests);
    if (override) {
      // Calcolo veloce dei set basato su bedStates senza importare bedConfig:
      // conta semplicemente per posto. Approssimazione conservativa:
      // 1 lenzuolo = 2 federe per sommier+matrim, 1 federa per singolo.
      // Per evitare deriva dal calcolo di lib/bedConfig, lasciamo che il
      // prossimo /api/admin/turnover/sync rifaccia il calcolo preciso.
      // Qui valorizziamo solo persone (asciugamani) e culle.
      task.biancheriaProssimo = {
        lenzMatrimoniali: task.biancheriaProssimo?.lenzMatrimoniali ?? 0,
        lenzSingoli:      task.biancheriaProssimo?.lenzSingoli ?? 0,
        federe:           task.biancheriaProssimo?.federe ?? 0,
        persone:          guests,
        scendibagno:      task.biancheriaProssimo?.scendibagno ?? 1,
        culle:            override.cribs ?? 0,
        source:           override.adminOverride ? 'admin' : 'guest',
        hasConfig:        false,    // segnaliamo che il calcolo set non è stato rifatto
      };
    } else if (!task.biancheriaProssimo) {
      task.biancheriaProssimo = {
        lenzMatrimoniali: 0, lenzSingoli: 0, federe: 0,
        persone: guests, scendibagno: 1, culle: 0,
        source: 'default', hasConfig: false,
      };
    }
  }

  task.updatedAt = Date.now();

  await redis.set(`task:${taskId}`, JSON.stringify(task));
  aggiornati++;
  console.log(`  ✓ ${task.titolo.padEnd(50)} ${next ? `→ next ${next.arrival}` : '— no next'}`);
}

console.log(`\nBackfill: ${aggiornati} aggiornati, ${saltati} saltati (non turnover o senza bookId).`);
console.log(`\nNOTA: i set di biancheria (lenz/federe) NON sono stati calcolati`);
console.log(`      esattamente — usa /admin/operativita/smistamento → "Sync turnover"`);
console.log(`      OPPURE clicca "Biancheria" su ogni task pulizie per inserire manualmente.`);
