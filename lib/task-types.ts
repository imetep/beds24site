/**
 * lib/task-types.ts
 *
 * Modello unificato Task. Ogni "cosa da fare" da parte di un operatore è un
 * Task con un discriminator tipo. La checklist (se applicabile) è incorporata
 * dentro il task come istanza con snapshot delle voci master.
 *
 * Tipi:
 *   - turnover     : pulizia post-checkout (auto-generato dalla partenza Beds24)
 *   - periodica    : intervento ricorrente (mensile/stagionale)
 *   - manutenzione : intervento creato dall'admin da una segnalazione triagiata
 *   - accoglienza  : check-in di un arrivo (auto-generato dall'arrivo Beds24)
 *   - adhoc        : task generico creato dall'admin (consegna chiavi, controllo
 *                    irrigazione una tantum, ecc.)
 *
 * Stati (decisione 14: doppia chiusura):
 *   da-assegnare → assegnato → in-corso → lavoro-terminato → completato
 *
 * "lavoro-terminato" è premuto dall'operatore. "completato" è confermato
 * dall'admin dopo aver visto la notifica Telegram.
 */

import type { ChecklistIstanza } from './checklist-types';
import type { Ruolo } from './operatori-types';

export const TIPI_TASK = ['turnover', 'periodica', 'manutenzione', 'accoglienza', 'adhoc'] as const;
export type TipoTask = typeof TIPI_TASK[number];

export const STATI_TASK = [
  'da-assegnare',
  'assegnato',
  'in-corso',
  'lavoro-terminato',
  'completato',
  'annullato',
] as const;
export type StatoTask = typeof STATI_TASK[number];

// ─── Task ────────────────────────────────────────────────────────────────────

export interface Task {
  id:               string;        // uuid
  tipo:             TipoTask;
  ruoloRichiesto:   Ruolo;          // chi può prenderlo (admin assegna a un op con quel ruolo)

  casaId:           string;         // riferimento a Casa
  data:             string;         // YYYY-MM-DD - data di lavorazione
  ora?:             string;         // HH:mm - solo per accoglienza (orario arrivo)

  // Beds24 link (presente per turnover e accoglienza)
  beds24BookId?:           number;
  beds24BookIdProssimo?:   number;  // turnover: prenotazione successiva (per biancheria)

  // Titolo/descrizione (auto-compilati per turnover/accoglienza, manuali per adhoc)
  titolo:           string;
  descrizione?:     string;

  // Assegnazione
  operatoreId?:     string;
  assegnatoAt?:     number;
  assegnatoBy?:     string;         // 'admin' o operatoreId che si è auto-assegnato

  // Stato
  stato:            StatoTask;
  apertoAt?:        number;          // primo accesso dell'operatore
  lavoroTerminatoAt?: number;        // pressione "Lavoro terminato"
  completatoAt?:    number;          // pressione "Casa pronta" admin
  annullatoAt?:     number;
  annullatoMotivo?: string;

  // Checklist (snapshot + stati). Assente per adhoc senza checklist.
  checklist?:       ChecklistIstanza;

  // Segnalazioni create durante questo task
  segnalazioniIds:  string[];

  // Note libere
  noteOperatore?:   string;
  noteAdmin?:       string;

  // Audit
  createdAt:        number;
  updatedAt:        number;
  createdBy:        'admin' | 'system';   // system = auto-generato da Beds24 sync
}

// ─── Helpers stato ───────────────────────────────────────────────────────────

export function isTaskAperto(t: Task): boolean {
  return t.stato === 'da-assegnare'
      || t.stato === 'assegnato'
      || t.stato === 'in-corso'
      || t.stato === 'lavoro-terminato';
}

export function isTaskChiuso(t: Task): boolean {
  return t.stato === 'completato' || t.stato === 'annullato';
}

/** Stato "operativo" lato operatore: cosa vede in dashboard. */
export function isTaskInCaricoAOperatore(t: Task, operatoreId: string): boolean {
  return t.operatoreId === operatoreId
      && (t.stato === 'assegnato' || t.stato === 'in-corso' || t.stato === 'lavoro-terminato');
}

// ─── Filtri admin ────────────────────────────────────────────────────────────

export interface TaskFilter {
  data?:           string;          // YYYY-MM-DD esatto
  dataFrom?:       string;          // YYYY-MM-DD inclusivo
  dataTo?:         string;          // YYYY-MM-DD inclusivo
  ruolo?:          Ruolo;
  tipo?:           TipoTask;
  stato?:          StatoTask | StatoTask[];
  operatoreId?:    string;
  casaId?:         string;
  daAssegnare?:    boolean;          // shortcut per stato='da-assegnare'
}
