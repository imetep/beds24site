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

import { getToken } from './beds24-token';
import { listCase, getCasaByRoomId } from './case-kv';
import { getChecklistMaster } from './checklist-kv';
import { getTurnoverTaskByBookId, saveTask } from './task-kv';
import { isVoceNonApplicabile } from './case-types';
import type { Task } from './task-types';
import type { ChecklistIstanza, VoceSnapshot } from './checklist-types';

const BASE_URL       = 'https://beds24.com/api/v2';
const VALID_STATUSES = new Set(['new', 'confirmed']);

interface B24Booking {
  id:         number;
  roomId:     number;
  status:     string;
  arrival:    string;
  departure:  string;
  numAdult:   number;
  numChild:   number;
  firstName:  string;
  lastName:   string;
}

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
      b.departure >= fromDate &&
      b.departure <= toDate &&
      VALID_STATUSES.has(b.status)
    );
    all.push(...filtered);
    const hasNext = d.pages?.nextPageExists === true;
    if (!hasNext || rows.every(b => b.departure < fromDate)) break;
    page++;
  }
  return all;
}

// ─── Build checklist istanza dallo snapshot master ──────────────────────────

function buildChecklistIstanzaPulizie(
  master: NonNullable<Awaited<ReturnType<typeof getChecklistMaster>>>,
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
    ruolo:     'pulizie',
    snapshots,
    stati:     snapshots.map(s => ({ voceId: s.id, spuntata: false })),
  };
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  creati:           number;
  esistenti:        number;
  senzaCasa:        number;       // partenze su roomId non in anagrafica
  senzaMaster:      number;       // pulizie master non caricata
  caseArchiviate:   number;
  totaleProcessate: number;
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

  const token = await getToken();
  const bookings = await fetchBookings(token, today, maxDate);

  // Pre-cache: master pulizie + tutte le case (1 query)
  const masterPulizie = await getChecklistMaster('pulizie');
  const allCase = await listCase(true /* include archiviate per check più chiaro */);
  const caseByRoomId = new Map<number, typeof allCase[number]>();
  for (const c of allCase) caseByRoomId.set(c.beds24RoomId, c);

  const result: SyncResult = {
    creati:           0,
    esistenti:        0,
    senzaCasa:        0,
    senzaMaster:      0,
    caseArchiviate:   0,
    totaleProcessate: bookings.length,
  };
  const dettagli: NonNullable<SyncResult['bookingDettagli']> = [];

  for (const b of bookings) {
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

    // Idempotenza
    const existing = await getTurnoverTaskByBookId(b.id);
    if (existing) {
      result.esistenti++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'esistente' });
      continue;
    }

    // Master pulizie disponibile?
    if (!masterPulizie) {
      result.senzaMaster++;
      if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'master-pulizie-mancante' });
      continue;
    }

    // Voci N/A per questa casa+ruolo pulizie
    const vociFiltrate = new Set<string>();
    for (const voce of masterPulizie.voci) {
      if (isVoceNonApplicabile(casa, 'pulizie', voce.id)) vociFiltrate.add(voce.id);
    }

    const checklist = buildChecklistIstanzaPulizie(masterPulizie, vociFiltrate);

    const ospite = `${b.firstName} ${b.lastName}`.trim();
    const now = Date.now();
    const task: Task = {
      id:               crypto.randomUUID(),
      tipo:             'turnover',
      ruoloRichiesto:   'pulizie',
      casaId:           casa.id,
      data:             b.departure,
      beds24BookId:     b.id,
      titolo:           `Turnover ${casa.nome} (${b.departure})`,
      descrizione:      `Partenza prenotazione #${b.id}${ospite ? ` — ${ospite}` : ''}`,
      stato:            'da-assegnare',
      checklist,
      segnalazioniIds:  [],
      createdAt:        now,
      updatedAt:        now,
      createdBy:        'system',
    };

    await saveTask(task);
    result.creati++;
    if (includeDetails) dettagli.push({ bookId: b.id, roomId: b.roomId, departure: b.departure, outcome: 'creato' });
  }

  if (includeDetails) result.bookingDettagli = dettagli;
  return result;
}
