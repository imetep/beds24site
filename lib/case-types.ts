/**
 * lib/case-types.ts
 *
 * Modello dati anagrafica "Casa". Mapping 1:1 con una Beds24 room.
 *
 * Contiene:
 *   - identificativi (id interno + beds24RoomId)
 *   - dati di accesso (indirizzo, keybox, note)
 *   - foto (URL Cloudinary)
 *   - dotazioni tecniche key/value (caldaia, contatori, Wi-Fi, ecc.)
 *   - voci N/A per ruolo (es. Casa senza piscina → escluse voci P047/M031/M032)
 *
 * Lo storico interventi NON è nel record Casa: è derivato a runtime via
 * query sui task completati per quella casa.
 */

import type { Ruolo } from './operatori-types';

// ─── Dotazione tecnica (key/value) ──────────────────────────────────────────

export interface DotazioneTecnica {
  chiave:  string;     // es. "Caldaia", "Wi-Fi password", "Contatore acqua"
  valore:  string;     // testo libero
}

// ─── Voce N/A per ruolo ─────────────────────────────────────────────────────

/**
 * Riferimento a una voce checklist marcata "non applicabile" per questa casa.
 * voceId è l'ID univoco della voce nel master xlsx (es. "P047", "M031").
 */
export interface VoceNonApplicabile {
  ruolo:   Ruolo;
  voceId:  string;
  motivo?: string;     // opzionale (es. "no piscina")
}

// ─── Casa ────────────────────────────────────────────────────────────────────

export interface Casa {
  id:              string;       // uuid interno
  nome:            string;       // "Bilo Mare", "Trilo Sole"
  beds24RoomId:    number;       // mapping 1:1 con Beds24

  indirizzo?:      string;
  note?:           string;       // accesso, parcheggio, citofono, regole
  keybox?:         string;       // posizione + codice (es. "Cancello sx, codice 4729")

  fotoUrls:        string[];     // URL Cloudinary (admin carica via widget o incolla)

  dotazioni:       DotazioneTecnica[];
  vociNonApplicabili: VoceNonApplicabile[];

  archiviata:      boolean;      // soft-delete: nascosta dal listing ma conservata per storico
  createdAt:       number;
  updatedAt:       number;
}

// ─── Helpers di filtro voci N/A ──────────────────────────────────────────────

/**
 * Restituisce true se la voce con quel id è marcata N/A per quella casa
 * sul ruolo specifico. Usato dal generatore di istanze checklist turnover
 * per saltare le voci escluse.
 */
export function isVoceNonApplicabile(
  casa:   Casa,
  ruolo:  Ruolo,
  voceId: string,
): boolean {
  return casa.vociNonApplicabili.some(v => v.ruolo === ruolo && v.voceId === voceId);
}
