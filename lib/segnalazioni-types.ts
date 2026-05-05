/**
 * lib/segnalazioni-types.ts
 *
 * Modello segnalazione (problema/anomalia riportata da un operatore durante
 * un task). Va in Inbox admin per triage manuale (decisione 6) e genera
 * notifica Telegram immediata all'admin (decisione 7).
 *
 * Flusso (decisione 6 - Triage admin):
 *   operatore crea segnalazione (con descrizione + gravità + opzionalmente
 *   collegata a voce checklist)
 *   → record con stato='aperta'
 *   → notifica Telegram all'admin
 *   → admin la vede in /admin/segnalazioni, decide:
 *       (a) crea task manutenzione → stato='task-creato' + taskManutenzioneId
 *       (b) risolve direttamente → stato='risolta'
 *       (c) ignora → stato='ignorata'
 *       (d) lascia in triage → stato='in-triage' (per dopo)
 */

import type { Ruolo } from './operatori-types';

export const GRAVITA = ['Critica', 'Alta', 'Media', 'Bassa'] as const;
export type Gravita = typeof GRAVITA[number];

export const STATI_SEGNALAZIONE = [
  'aperta',
  'in-triage',
  'task-creato',
  'risolta',
  'ignorata',
] as const;
export type StatoSegnalazione = typeof STATI_SEGNALAZIONE[number];

// ─── Segnalazione ────────────────────────────────────────────────────────────

export interface Segnalazione {
  id:                 string;             // uuid
  taskId:             string;             // task da cui è partita
  voceId?:            string;             // ID voce checklist (se collegata a una specifica)

  casaId:             string;
  segnalataDa:        string;             // operatoreId
  segnalataDaRuolo:   Ruolo;

  descrizione:        string;
  gravita:            Gravita;

  stato:              StatoSegnalazione;
  taskManutenzioneId?: string;             // task generato dall'admin per risolvere

  notaAdmin?:         string;
  azioneEffettuata?:  string;              // testo: "sostituito faretto bagno"

  createdAt:          number;
  updatedAt:          number;
  risoltaAt?:         number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isSegnalazioneAperta(s: Segnalazione): boolean {
  return s.stato === 'aperta' || s.stato === 'in-triage';
}

export function isSegnalazioneCriticaOAlta(s: Segnalazione): boolean {
  return s.gravita === 'Critica' || s.gravita === 'Alta';
}

// ─── Filtro listing admin ────────────────────────────────────────────────────

export interface SegnalazioneFilter {
  stato?:        StatoSegnalazione | StatoSegnalazione[];
  gravita?:      Gravita | Gravita[];
  casaId?:       string;
  segnalataDa?:  string;
  dataFrom?:     string;        // YYYY-MM-DD
  dataTo?:       string;
}
