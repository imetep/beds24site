/**
 * lib/periodiche-types.ts
 *
 * Modello "interventi periodici": voci checklist con frequenza diversa da
 * "Ogni turnover" (Settimanale, Mensile, Stagionale, A richiesta) che
 * NON sono auto-generate dal sync turnover ma vengono schedulate
 * dall'admin via il calendario delle scadenze (decisione 15 opzione 3).
 *
 * Modello "scadenza virtuale": ogni record è la coppia (casa, ruolo, voceId).
 * Conserviamo solo l'ultimaEsecuzione (timestamp del completamento del
 * task periodico precedente). La prossimaScadenza è calcolata a runtime:
 *   prossimaScadenza = ultimaEsecuzione + intervallo(frequenza)
 *   se mai eseguita → prossimaScadenza = oggi (= già scaduta)
 *
 * Intervalli (giorni):
 *   Settimanale = 7
 *   Mensile     = 30
 *   Stagionale  = 90
 *   A richiesta = ∞ (no scadenza, schedulata solo manualmente)
 */

import type { Frequenza } from './checklist-types';
import type { Ruolo } from './operatori-types';

export interface UltimaEsecuzione {
  casaId:        string;
  ruolo:         Ruolo;
  voceId:        string;
  ultimaAt:      number;        // epoch ms
  taskId:        string;        // riferimento al task periodico chiuso
}

export interface ScadenzaPeriodica {
  // identità
  casaId:           string;
  casaNome:         string;
  ruolo:            Ruolo;
  voceId:           string;
  voceAmbiente:     string;
  voceAttivita:     string;
  voceDettaglio:    string;
  frequenza:        Frequenza;

  // calcoli
  ultimaEsecuzioneAt?:  number;
  prossimaScadenzaAt:   number;        // sempre calcolata
  giorniAllaScadenza:   number;        // negativo = già scaduta
  isOverdue:            boolean;

  // task pendente associato (se admin ha già schedulato)
  taskPendenteId?:      string;
  taskPendenteData?:    string;
}

export const FREQUENZA_GIORNI: Record<Frequenza, number | null> = {
  'Ogni turnover': null,    // gestita dal sync, non come scadenza periodica
  'Settimanale':   7,
  'Mensile':       30,
  'Stagionale':    90,
  'A richiesta':   null,    // schedulata solo manualmente, no auto-prossima
};

/**
 * Restituisce la prossima scadenza per una coppia (ultimaEsecuzione, frequenza).
 * Se mai eseguita o frequenza "A richiesta" senza ultimaEsecuzione,
 * restituisce timestamp di oggi (= già scaduta, va schedulata).
 */
export function calcolaProssimaScadenza(
  ultimaAt:   number | undefined,
  frequenza:  Frequenza,
): number {
  if (frequenza === 'Ogni turnover') {
    return Date.now();        // mai dovrebbe finire qui, è gestita dal sync
  }
  if (frequenza === 'A richiesta') {
    return ultimaAt ?? Date.now();
  }
  const giorni = FREQUENZA_GIORNI[frequenza];
  if (!giorni) return Date.now();
  if (!ultimaAt) return Date.now();   // mai eseguita = scaduta ora
  return ultimaAt + giorni * 24 * 60 * 60 * 1000;
}
