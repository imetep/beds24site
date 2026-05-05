/**
 * lib/turnover-sync.ts
 *
 * Sincronizzazione turnover: legge le partenze da Beds24 nei prossimi N giorni
 * e crea (idempotente) un Task di tipo 'turnover' per ogni partenza che ha
 * una Casa censita in anagrafica e non archiviata.
 *
 * Idempotenza: l'indice turnover-by-book:{bookId} → taskId garantisce
 * che la stessa prenotazione non generi più Task. Se il task esiste già
 * (anche in stato avanzato), lo si lascia inalterato.
 *
 * La checklist viene "snapshottata" dalla ChecklistMaster del ruolo 'pulizie'
 * al momento della creazione, escludendo le voci marcate N/A nella casa.
 *
 * Restituisce statistica { creati, esistenti, salt: senzaCasa, senzaMaster }.
 */

import { Redis } from '@upstash/redis';
import { getToken } from './beds24-token';
import { listCase } from './case-kv';
import { getChecklistMaster } from './checklist-kv';
import { getTurnoverTaskByBookId, saveTask } from './task-kv';
import { isVoceNonApplicabile } from './case-types';
import {
  getBedConfig,
  calcLinenSetsFromBedStates,
  calcDefaultBedStates,
} from './bedConfig';
import type { Task } from './task-types';
import type { ChecklistIstanza, VoceSnapshot } from './checklist-types';

const BASE_URL       = 'https://beds24.com/api/v2';
const VALID_STATUSES = new Set(['new', 'confirmed']);

interface B24Booking {
  id:             number;
  roomId:         number;
  status:         string;
  arrival:        string;
  departure:      string;
  numAdult:       number;
  numChild:       number;
  firstName:      string;
  lastName:       string;
  arrivalTime?:   string;     // HH:MM (orario check-in)
  departureTime?: string;     // HH:MM (orario check-out, può non essere settato)
}

/**
 * Fetch bookings con range esteso: prendiamo tutto ciò che potrebbe servire
 * sia come "partenza nel range" sia come "prossimo arrivo della stessa room".
 */
async function fetchBookings(token: string, fromDate: string, toDate: string): Promise<B24Booking[]> {
  const all: B24Booking[] = [];
  let page = 1;
  while (true) {
    const r = await fetch(`${BASE_URL}/bookings?page=${page}`, {
      headers: { token },
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`Beds24 ${r.status}: ${await r.text()}`);
    const d = await r.json();
    const rows: B24Booking[] = d.data ?? [];
    const filtered = rows.filter(b =>
      VALID_STATUSES.has(b.status) &&
      b.departure >= fromDate &&
      b.arrival   <= toDate
    );
    all.push(...filtered);
    const hasNext = d.pages?.nextPageExists === true;
    if (!hasNext) break;
    if (rows.every(b => b.arrival > toDate)) break;
    page++;
  }
  return all;
}

// ─── Calcolo biancheria per una booking (riusa bedConfig + override Redis) ──

let _kv: Redis | null = null;
function kv(): Redis {
  if (_kv) return _kv;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('[turnover-sync] KV mancante');
  _kv = new Redis({ url, token });
  return _kv;
}

type BedStateMap = Record<string, 'off' | 'A' | 'B'>;

interface BiancheriaCalcResult {
  linen: {
    lenzMatrimoniali: number;
    lenzSingoli:      number;
    federe:           number;
    persone:          number;
    scendibagno?:     number;
    culle:            number;
  } | null;
  source:    'guest' | 'admin' | 'default';
  hasConfig: boolean;
}

async function calcBiancheriaForBooking(b: B24Booking): Promise<BiancheriaCalcResult> {
  let bedStates: BedStateMap = {};
  let cribs = 0;
  let source: 'guest' | 'admin' | 'default' = 'default';

  // Override Redis (beds:v6:{bookId}) — popolato da admin/biancheria o guest portal
  try {
    const raw = await kv().get<string | { bedStates?: BedStateMap; cribs?: number; numGuests?: number; adminOverride?: boolean }>(
      `beds:v6:${b.id}`,
    );
    if (raw) {
      const stored = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (stored?.bedStates && Object.keys(stored.bedStates).length > 0) {
        const guests = b.numAdult + b.numChild;
        const cached = stored.numGuests ?? 0;
        if (!cached || cached === guests) {
          bedStates = stored.bedStates;
          cribs = stored.cribs ?? 0;
          source = stored.adminOverride ? 'admin' : 'guest';
        }
      }
    }
  } catch { /* swallow → fallback default */ }

  const config = getBedConfig(b.roomId);
  if (!config) return { linen: null, source, hasConfig: false };

  if (source === 'default') {
    bedStates = calcDefaultBedStates(config, b.numAdult + b.numChild);
  }

  const linen = calcLinenSetsFromBedStates(b.roomId, bedStates, cribs);
  linen.persone = b.numAdult + b.numChild;

  return { linen, source, hasConfig: true };
}

// ─── Build checklist istanza dallo snapshot master ──────────────────────────

function buildChecklistIstanza(
  ruolo:        'pulizie' | 'manutentore',
  master:       NonNullable<Awaited<ReturnType<typeof getChecklistMaster>>>,
  vociFiltrate: Set<string>,
): ChecklistIstanza {
  const snapshots: VoceSnapshot[] = [];
  for (const v of master.voci) {
    if (vociFiltrate.has(v.id)) continue;
    // Escludi anche le voci non "Ogni turnover" — le periodiche/stagionali sono task separati (decisione 15)
    if (v.frequenza !== 'Ogni turnover') continue;
    snapshots.push({
      id:               v.id,
      ambiente:         v.ambiente,
      attivita:         v.attivita,
      dettaglio:        v.dettaglio,
      frequenza:        v.frequenza,
      priorita:         v.priorita,
      fotoRichiesta:    v.fotoRichiesta,
      controlloFinale:  v.controlloFinale,
    });
  }
  return {
    ruolo,
    snapshots,
    stati:     snapshots.map(s => ({ voceId: s.id, spuntata: false })),
  };
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  creati:           number;       // numero TOTALE di task creati (somma pulizie + manutentore)
  esistenti:        number;       // numero TOTALE di task già presenti
  senzaCasa:        number;       // partenze su roomId non in anagrafica
  senzaMaster:      number;       // master pulizie non caricata (non si genera nemmeno il pulizie)
  senzaMasterMan:   number;       // master manutentore non caricata (skip solo manutentore)
  caseArchiviate:   number;
  totaleProcessate: number;       // numero di partenze Beds24 processate
  bookingDettagli?: Array<{ bookId: number; roomId: number; departure: string; outcome: string }>;
}

/**
 * Sincronizza turnover da Beds24 per le partenze tra oggi e oggi+daysAhead.
 *
 * @param daysAhead      finestra di lookahead (default 30 giorni)
 * @param includeDetails se true, restituisce array dettagliato dei bookings processati
 */
export async function syncTurnover(
  daysAhead = 30,
  includeDetails = false,
): Promise<SyncResult> {
  const today = new Date().toISOString().slice(0, 10);
  const max = new Date();
  max.setDate(max.getDate() + daysAhead);
  const maxDate = max.toISOString().slice(0, 10);
  // Lookahead esteso 90gg per trovare prossimi arrivi anche oltre il range
  const lookaheadEnd = new Date(max.getTime() + 90 * 86400000).toISOString().slice(0, 10);

  const token = await getToken();
  const allBookings = await fetchBookings(token, today, lookaheadEnd);

  // Indice per roomId, ordinato per arrival (per find next arrival O(log n))
  const byRoom = new Map<number, B24Booking[]>();
  for (const bk of allBookings) {
    const arr = byRoom.get(bk.roomId) ?? [];
    arr.push(bk);
    byRoom.set(bk.roomId, arr);
  }
  for (const [, arr] of byRoom) {
    arr.sort((a, b) => a.arrival.localeCompare(b.arrival));
  }

  // Partenze nel range richiesto
  const departures = allBookings
    .filter(b => b.departure >= today && b.departure <= maxDate)
    .sort((a, b) => a.departure.localeCompare(b.departure));

  // Pre-cache: master pulizie + manutentore + tutte le case
  const [masterPulizie, masterManutentore, allCase] = await Promise.all([
    getChecklistMaster('pulizie'),
    getChecklistMaster('manutentore'),
    listCase(true),
  ]);
  const caseByRoomId = new Map<number, typeof allCase[number]>();
  for (const c of allCase) caseByRoomId.set(c.beds24RoomId, c);

  const result: SyncResult = {
    creati:           0,
    esistenti:        0,
    senzaCasa:        0,
    senzaMaster:      0,
    senzaMasterMan:   0,
    caseArchiviate:   0,
    totaleProcessate: departures.length,
  };
  const dettagli: NonNullable<SyncResult['bookingDettagli']> = [];

  for (const b of departures) {
    const casa = caseByRoomId.get(b.roomId);
    if (!casa) {
      result.senzaCasa++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'casa-non-censita' });
      continue;
    }
    if (casa.archiviata) {
      result.caseArchiviate++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'casa-archiviata' });
      continue;
    }

    const ospite = `${b.firstName} ${b.lastName}`.trim();
    const now = Date.now();

    // Trova prossimo arrivo sulla stessa room (arrival ≥ b.departure, escludo se stesso)
    const sameRoom = byRoom.get(b.roomId) ?? [];
    const next = sameRoom.find(x => x.arrival >= b.departure && x.id !== b.id);

    // Per task pulizie: calcola biancheria del prossimo arrivo (se esiste)
    let biancheriaProssimoSnap: Task['biancheriaProssimo'] | undefined;
    let prossimoArrivoSnap: Task['prossimoArrivo'] | undefined;
    let oraArrivoProssimoSnap: string | undefined;
    if (next) {
      prossimoArrivoSnap = {
        date:      next.arrival,
        bookId:    next.id,
        guestName: `${next.firstName} ${next.lastName}`.trim(),
        numAdult:  next.numAdult,
        numChild:  next.numChild,
      };
      oraArrivoProssimoSnap = next.arrivalTime || undefined;
      const calc = await calcBiancheriaForBooking(next);
      if (calc.linen) {
        biancheriaProssimoSnap = {
          lenzMatrimoniali: calc.linen.lenzMatrimoniali,
          lenzSingoli:      calc.linen.lenzSingoli,
          federe:           calc.linen.federe,
          persone:          calc.linen.persone,
          scendibagno:      calc.linen.scendibagno,
          culle:            calc.linen.culle,
          source:           calc.source,
          hasConfig:        calc.hasConfig,
        };
      } else if (!calc.hasConfig) {
        biancheriaProssimoSnap = {
          lenzMatrimoniali: 0, lenzSingoli: 0, federe: 0, persone: 0, scendibagno: 0, culle: 0,
          source:    calc.source,
          hasConfig: false,
        };
      }
    }

    const oraPartenzaOspiteSnap = b.departureTime || undefined;

    // ── Task PULIZIE ────────────────────────────────────────────────────────
    const existingPulizie = await getTurnoverTaskByBookId('pulizie', b.id);
    if (existingPulizie) {
      result.esistenti++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'pulizie-esistente' });
    } else if (!masterPulizie) {
      result.senzaMaster++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'master-pulizie-mancante' });
    } else {
      const vociFiltratePul = new Set<string>();
      for (const voce of masterPulizie.voci) {
        if (isVoceNonApplicabile(casa, 'pulizie', voce.id)) vociFiltratePul.add(voce.id);
      }
      const taskPul: Task = {
        id:                  crypto.randomUUID(),
        tipo:                'turnover',
        ruoloRichiesto:      'pulizie',
        casaId:              casa.id,
        data:                b.departure,
        beds24BookId:        b.id,
        beds24BookIdProssimo: next?.id,
        oraPartenzaOspite:   oraPartenzaOspiteSnap,
        oraArrivoProssimo:   oraArrivoProssimoSnap,
        prossimoArrivo:      prossimoArrivoSnap,
        biancheriaProssimo:  biancheriaProssimoSnap,
        titolo:              `Pulizia turnover ${casa.nome} (${b.departure})`,
        descrizione:         `Partenza prenotazione #${b.id}${ospite ? ` — ${ospite}` : ''}`,
        stato:               'da-assegnare',
        checklist:           buildChecklistIstanza('pulizie', masterPulizie, vociFiltratePul),
        segnalazioniIds:     [],
        createdAt:           now,
        updatedAt:           now,
        createdBy:           'system',
      };
      await saveTask(taskPul);
      result.creati++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'pulizie-creato' });
    }

    // ── Task MANUTENTORE ───────────────────────────────────────────────────
    const existingMan = await getTurnoverTaskByBookId('manutentore', b.id);
    if (existingMan) {
      result.esistenti++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'manutentore-esistente' });
    } else if (!masterManutentore) {
      result.senzaMasterMan++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'master-manutentore-mancante' });
    } else {
      const vociFiltrateMan = new Set<string>();
      for (const voce of masterManutentore.voci) {
        if (isVoceNonApplicabile(casa, 'manutentore', voce.id)) vociFiltrateMan.add(voce.id);
      }
      const taskMan: Task = {
        id:                  crypto.randomUUID(),
        tipo:                'turnover',
        ruoloRichiesto:      'manutentore',
        casaId:              casa.id,
        data:                b.departure,
        beds24BookId:        b.id,
        oraPartenzaOspite:   oraPartenzaOspiteSnap,
        oraArrivoProssimo:   oraArrivoProssimoSnap,
        prossimoArrivo:      prossimoArrivoSnap,
        // biancheriaProssimo NON serve al manutentore (no preparazione lavori biancheria)
        titolo:              `Controllo manutentore ${casa.nome} (${b.departure})`,
        descrizione:         `Partenza prenotazione #${b.id}${ospite ? ` — ${ospite}` : ''} — controllo tecnico routine`,
        stato:               'da-assegnare',
        checklist:           buildChecklistIstanza('manutentore', masterManutentore, vociFiltrateMan),
        segnalazioniIds:     [],
        createdAt:           now,
        updatedAt:           now,
        createdBy:           'system',
      };
      await saveTask(taskMan);
      result.creati++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'manutentore-creato' });
    }
  }

  if (includeDetails) result.bookingDettagli = dettagli;
  return result;
}
