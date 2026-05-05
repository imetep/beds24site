/**
 * lib/checklist-types.ts
 *
 * Modello dati delle checklist "master" (definizioni importate dai file xlsx
 * caricati dall'admin) e delle istanze compilate (turnover, interventi, ecc.).
 *
 * Una ChecklistMaster esiste per ogni Ruolo. Quando l'admin ricarica un file
 * xlsx per un ruolo, la master viene SOSTITUITA. Le istanze già compilate
 * congelano una copia delle voci al momento della creazione: non sono
 * impattate dal re-import.
 */

import type { Ruolo } from './operatori-types';

// ─── Enum ────────────────────────────────────────────────────────────────────

export const FREQUENZE = ['Ogni turnover', 'Settimanale', 'Mensile', 'Stagionale', 'A richiesta'] as const;
export type Frequenza = typeof FREQUENZE[number];

export const PRIORITA = ['Critica', 'Alta', 'Media', 'Bassa'] as const;
export type Priorita = typeof PRIORITA[number];

export const STATI_DEFAULT = ['Da fare', 'Non applicabile'] as const;
export type StatoDefault = typeof STATI_DEFAULT[number];

// ─── ChecklistVoce ───────────────────────────────────────────────────────────

/**
 * Singola voce della checklist master. L'ID è il fulcro: sostituire una voce
 * con stesso ID = update; nuovo ID = nuova voce; rimosso = voce deprecata.
 *
 * Le istanze (turnover compilato) salvano una copia "snapshot" di queste voci
 * al momento della creazione, congelando il testo storico.
 */
export interface ChecklistVoce {
  id:               string;       // es. "P001", "M001", "G001", "R001" — univoco nel ruolo
  ambiente:         string;       // es. "Cucina", "Bagno", "Esterni"
  attivita:         string;       // titolo breve della voce
  dettaglio:        string;       // descrizione operativa estesa
  frequenza:        Frequenza;
  priorita:         Priorita;
  statoDefault:     StatoDefault;
  fotoRichiesta:    boolean;      // reminder testuale (foto fuori app, su Telegram)
  controlloFinale:  boolean;      // se true, voce bloccante per "Casa pronta"
  noteDitta?:       string;       // note operative (importate dalla colonna 11 dell'xlsx)
}

// ─── ChecklistMaster ────────────────────────────────────────────────────────

export interface ChecklistMaster {
  ruolo:           Ruolo;
  voci:            ChecklistVoce[];
  importedFrom?:   string;       // nome del file xlsx caricato (per debug/audit)
  importedAt:      number;       // epoch ms
}

// ─── Istanza checklist (turnover/intervento compilato) ──────────────────────

/**
 * Stato di una singola voce in un'istanza. Decisione 12: spuntata sì/no +
 * flag segnalazione separato (con riferimento opzionale a un id Segnalazione).
 */
export interface VoceIstanza {
  voceId:           string;       // riferimento a ChecklistVoce.id
  spuntata:         boolean;
  segnalazioneId?:  string;       // se la pulizia ha aperto una segnalazione su questa voce
  spuntataAt?:      number;       // epoch ms quando è stata spuntata
  noteOperatore?:   string;       // note libere dell'operatore su questa voce
}

/**
 * Snapshot della voce master congelato al momento della creazione dell'istanza.
 * Usato per render: il testo della voce non cambia anche se la master viene
 * ricaricata dopo.
 */
export interface VoceSnapshot {
  id:               string;
  ambiente:         string;
  attivita:         string;
  dettaglio:        string;
  frequenza:        Frequenza;
  priorita:         Priorita;
  fotoRichiesta:    boolean;
  controlloFinale:  boolean;
}

/**
 * Istanza compilabile: la struttura accoppiata snapshot+stato che l'operatore
 * vede e modifica. Salvata dentro il record Task corrispondente.
 */
export interface ChecklistIstanza {
  ruolo:       Ruolo;
  snapshots:   VoceSnapshot[];   // snapshot delle voci al momento della creazione
  stati:       VoceIstanza[];    // stato corrente (uno per snapshot.id)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Calcola % completamento (voci spuntate / totale, escluse N/A se filtrate altrove). */
export function calcolaCompletamento(istanza: ChecklistIstanza): number {
  if (istanza.snapshots.length === 0) return 0;
  const spuntate = istanza.stati.filter(s => s.spuntata).length;
  return Math.round((spuntate / istanza.snapshots.length) * 100);
}

/** Voci che hanno una segnalazione aperta (per filtri admin/operatore). */
export function vociConSegnalazione(istanza: ChecklistIstanza): VoceIstanza[] {
  return istanza.stati.filter(s => s.segnalazioneId);
}

/**
 * Voci ancora aperte (non spuntate) e con priorità Critica/Alta + controlloFinale=true.
 * Sono quelle che bloccherebbero il "Casa pronta" nel modello Excel originale,
 * anche se la decisione 14 prevede doppia chiusura manuale dell'admin.
 */
export function vociBloccantiPerCasaPronta(istanza: ChecklistIstanza): VoceIstanza[] {
  const snapById = new Map(istanza.snapshots.map(s => [s.id, s]));
  return istanza.stati.filter(s => {
    if (s.spuntata) return false;
    const snap = snapById.get(s.voceId);
    if (!snap) return false;
    if (!snap.controlloFinale) return false;
    return snap.priorita === 'Critica' || snap.priorita === 'Alta';
  });
}
