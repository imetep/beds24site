/**
 * lib/accoglienza-sync.ts
 *
 * Analogo a turnover-sync ma per gli ARRIVI. Crea task tipo='accoglienza'
 * con ruolo='receptionist' per ogni nuovo check-in nei prossimi N giorni.
 *
 * Idempotente via indice accoglienza-by-book:{bookId}.
 *
 * Differenze rispetto a turnover:
 *   - data del task = arrival (non departure)
 *   - ora del task = orario arrivo se disponibile (per ora vuoto, Beds24
 *     non lo espone in modo standard)
 *   - checklist = master receptionist (se caricata) filtrata per voci NA
 *
 * Decisione 17: la receptionist vede inoltre il calendario completo
 * (arrivi+partenze+ospiti già in casa), ma quello è esposto da una vista
 * separata; qui creiamo solo i task accoglienza assegnabili.
 */

import { getToken } from './beds24-token';
import { listCase } from './case-kv';
import { getChecklistMaster } from './checklist-kv';
import { getAccoglienzaTaskByBookId, saveTask } from './task-kv';
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
  arrivalTime?: string;
}

async function fetchArrivals(token: string, fromDate: string, toDate: string): Promise<B24Booking[]> {
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
      b.arrival >= fromDate &&
      b.arrival <= toDate &&
      VALID_STATUSES.has(b.status)
    );
    all.push(...filtered);
    const hasNext = d.pages?.nextPageExists === true;
    if (!hasNext || rows.every(b => b.arrival < fromDate)) break;
    page++;
  }
  return all;
}

function buildChecklistIstanzaReceptionist(
  master: NonNullable<Awaited<ReturnType<typeof getChecklistMaster>>>,
  vociFiltrate: Set<string>,
): ChecklistIstanza {
  const snapshots: VoceSnapshot[] = [];
  for (const v of master.voci) {
    if (vociFiltrate.has(v.id)) continue;
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
    ruolo:     'receptionist',
    snapshots,
    stati:     snapshots.map(s => ({ voceId: s.id, spuntata: false })),
  };
}

export interface AccoglienzaSyncResult {
  creati:           number;
  esistenti:        number;
  senzaCasa:        number;
  caseArchiviate:   number;
  totaleProcessate: number;
  hasMaster:        boolean;     // se la master receptionist è caricata
}

export async function syncAccoglienza(daysAhead = 14): Promise<AccoglienzaSyncResult> {
  const today = new Date().toISOString().slice(0, 10);
  const max = new Date();
  max.setDate(max.getDate() + daysAhead);
  const maxDate = max.toISOString().slice(0, 10);

  const token = await getToken();
  const bookings = await fetchArrivals(token, today, maxDate);

  const master = await getChecklistMaster('receptionist');
  const allCase = await listCase(true);
  const caseByRoomId = new Map<number, typeof allCase[number]>();
  for (const c of allCase) caseByRoomId.set(c.beds24RoomId, c);

  const result: AccoglienzaSyncResult = {
    creati:           0,
    esistenti:        0,
    senzaCasa:        0,
    caseArchiviate:   0,
    totaleProcessate: bookings.length,
    hasMaster:        !!master,
  };

  for (const b of bookings) {
    const casa = caseByRoomId.get(b.roomId);
    if (!casa) { result.senzaCasa++; continue; }
    if (casa.archiviata) { result.caseArchiviate++; continue; }

    const existing = await getAccoglienzaTaskByBookId(b.id);
    if (existing) { result.esistenti++; continue; }

    let checklist: ChecklistIstanza | undefined;
    if (master) {
      const vociFiltrate = new Set<string>();
      for (const voce of master.voci) {
        if (isVoceNonApplicabile(casa, 'receptionist', voce.id)) vociFiltrate.add(voce.id);
      }
      checklist = buildChecklistIstanzaReceptionist(master, vociFiltrate);
    }

    const ospite = `${b.firstName} ${b.lastName}`.trim();
    const adulti = b.numAdult;
    const bambini = b.numChild;
    const ospitiStr = `${adulti} adult${adulti === 1 ? 'o' : 'i'}${bambini > 0 ? ` + ${bambini} bambin${bambini === 1 ? 'o' : 'i'}` : ''}`;

    const now = Date.now();
    const task: Task = {
      id:               crypto.randomUUID(),
      tipo:             'accoglienza',
      ruoloRichiesto:   'receptionist',
      casaId:           casa.id,
      data:             b.arrival,
      ora:              b.arrivalTime || undefined,
      beds24BookId:     b.id,
      titolo:           `Accoglienza ${casa.nome} (${b.arrival})`,
      descrizione:      `Arrivo prenotazione #${b.id}${ospite ? ` — ${ospite}` : ''} · ${ospitiStr} · permanenza fino al ${b.departure}`,
      stato:            'da-assegnare',
      checklist,
      segnalazioniIds:  [],
      createdAt:        now,
      updatedAt:        now,
      createdBy:        'system',
    };

    await saveTask(task);
    result.creati++;
  }

  return result;
}
