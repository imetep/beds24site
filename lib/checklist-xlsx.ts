/**
 * lib/checklist-xlsx.ts
 *
 * Parser di file xlsx caricati dall'admin → ChecklistMaster.
 *
 * Convenzioni accettate:
 *   - Il primo foglio che contiene le colonne canoniche viene scelto.
 *   - Le colonne canoniche sono cercate per nome (case-insensitive, accenti
 *     normalizzati). L'ordine può variare ma le 11 intestazioni sono attese.
 *   - Le righe sopra l'header sono ignorate (titolo, descrizione, righe vuote).
 *   - Una riga è considerata voce valida se ha ID e Attività non vuoti.
 *
 * Schema colonne attese (header):
 *   ID | Ambiente | Attività | Dettaglio operativo | Frequenza | Priorità |
 *   Stato | Foto richiesta | Controllo finale | Note ditta |
 *   Segnalazione / manutenzione
 *
 * Output: { master: ChecklistMaster, errors: string[], warnings: string[] }
 *   - errors: bloccanti (file non importato)
 *   - warnings: non bloccanti (es. valori normalizzati a default)
 */

import * as XLSX from 'xlsx';
import {
  type ChecklistMaster,
  type ChecklistVoce,
  type Frequenza,
  type Priorita,
  type StatoDefault,
  FREQUENZE,
  PRIORITA,
} from './checklist-types';
import type { Ruolo } from './operatori-types';

// ─── Header normalization ───────────────────────────────────────────────────

/**
 * Mappa di alias → chiave canonica. Chiave = stringa normalizzata
 * (lowercase, no accenti, no spazi/punteggiatura).
 */
const HEADER_ALIASES: Record<string, keyof CanonicalRow> = {
  // ID
  'id':          'id',
  'codice':      'id',

  // Ambiente
  'ambiente':    'ambiente',
  'area':        'ambiente',
  'zona':        'ambiente',

  // Attività
  'attivita':    'attivita',
  'attivit':     'attivita',
  'titolo':      'attivita',
  'voce':        'attivita',

  // Dettaglio
  'dettaglio':           'dettaglio',
  'dettagliooperativo':  'dettaglio',
  'descrizione':         'dettaglio',

  // Frequenza
  'frequenza':   'frequenza',

  // Priorità
  'priorita':    'priorita',

  // Stato
  'stato':       'stato',
  'statoiniziale': 'stato',
  'statodefault':  'stato',

  // Foto richiesta
  'fotorichiesta': 'fotoRichiesta',
  'foto':          'fotoRichiesta',

  // Controllo finale
  'controllofinale':  'controlloFinale',
  'controllo':         'controlloFinale',
  'critico':           'controlloFinale',

  // Note ditta
  'noteditta':   'noteDitta',
  'note':        'noteDitta',
  'notepulizia': 'noteDitta',

  // Segnalazione (ignorato nel master)
  'segnalazione':           'segnalazione',
  'segnalazionemanutenzione': 'segnalazione',
};

interface CanonicalRow {
  id?:               string;
  ambiente?:         string;
  attivita?:         string;
  dettaglio?:        string;
  frequenza?:        string;
  priorita?:         string;
  stato?:            string;
  fotoRichiesta?:    string;
  controlloFinale?:  string;
  noteDitta?:        string;
  segnalazione?:     string;
}

function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining marks
    .replace(/[^a-z0-9]/g, '');
}

// ─── Value normalization ────────────────────────────────────────────────────

function normalizeBool(v: unknown): boolean {
  if (v === true)  return true;
  if (v === false) return false;
  if (typeof v === 'number') return v !== 0;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'si' || s === 'sì' || s === 's' || s === 'yes' || s === 'y' ||
         s === 'true' || s === 'vero' || s === '1';
}

function normalizeFrequenza(v: unknown): { value: Frequenza; warning?: string } {
  if (v == null) return { value: 'Ogni turnover', warning: 'frequenza vuota → "Ogni turnover"' };
  const raw = String(v).trim();
  for (const f of FREQUENZE) {
    if (raw.toLowerCase() === f.toLowerCase()) return { value: f };
  }
  // alias comuni
  const lc = raw.toLowerCase();
  if (lc.includes('turn'))     return { value: 'Ogni turnover' };
  if (lc.includes('settima'))  return { value: 'Settimanale' };
  if (lc.includes('mensil'))   return { value: 'Mensile' };
  if (lc.includes('stagion'))  return { value: 'Stagionale' };
  if (lc.includes('richiest')) return { value: 'A richiesta' };
  return { value: 'Ogni turnover', warning: `frequenza non riconosciuta: "${raw}" → "Ogni turnover"` };
}

function normalizePriorita(v: unknown): { value: Priorita; warning?: string } {
  if (v == null) return { value: 'Media', warning: 'priorità vuota → "Media"' };
  const raw = String(v).trim();
  for (const p of PRIORITA) {
    if (raw.toLowerCase() === p.toLowerCase()) return { value: p };
  }
  return { value: 'Media', warning: `priorità non riconosciuta: "${raw}" → "Media"` };
}

function normalizeStatoDefault(v: unknown): StatoDefault {
  if (v == null) return 'Da fare';
  const lc = String(v).trim().toLowerCase();
  if (lc.includes('non applicabile') || lc === 'na' || lc === 'n/a') return 'Non applicabile';
  return 'Da fare';
}

// ─── Parser principale ──────────────────────────────────────────────────────

export interface ParseResult {
  master:    ChecklistMaster | null;
  errors:    string[];
  warnings:  string[];
}

/**
 * Parsa un buffer xlsx e produce una ChecklistMaster.
 *
 * @param buffer  contenuto binario del file xlsx (ArrayBuffer o Buffer)
 * @param ruolo   ruolo a cui assegnare la master
 * @param fileName nome del file caricato (per audit)
 */
export function parseChecklistXlsx(
  buffer:   ArrayBuffer | Uint8Array | Buffer,
  ruolo:    Ruolo,
  fileName?: string,
): ParseResult {
  const errors:   string[] = [];
  const warnings: string[] = [];

  // 1) Apri workbook
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'array' });
  } catch (e) {
    errors.push(`Impossibile leggere il file xlsx: ${(e as Error).message}`);
    return { master: null, errors, warnings };
  }

  // 2) Trova il foglio + riga header
  const found = findChecklistSheet(wb);
  if (!found) {
    errors.push(
      'Nessun foglio contiene le colonne canoniche attese ' +
      '(ID, Ambiente, Attività, Dettaglio, Frequenza, Priorità, Stato, Foto richiesta, Controllo finale).',
    );
    return { master: null, errors, warnings };
  }
  const { sheetName, headerRow, headerMap, rows } = found;

  if (sheetName !== wb.SheetNames[0]) {
    warnings.push(`Foglio scelto: "${sheetName}" (non il primo).`);
  }

  // 3) Verifica colonne minime
  const required: (keyof CanonicalRow)[] = ['id', 'ambiente', 'attivita', 'dettaglio', 'frequenza', 'priorita'];
  const missing = required.filter(k => !(k in headerMap));
  if (missing.length > 0) {
    errors.push(`Colonne obbligatorie mancanti nell'header: ${missing.join(', ')}`);
    return { master: null, errors, warnings };
  }

  // 4) Parsa righe voci
  const voci: ChecklistVoce[] = [];
  const idsVisti = new Set<string>();

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const get = (k: keyof CanonicalRow): unknown => {
      const colIdx = headerMap[k];
      if (colIdx === undefined) return undefined;
      return row[colIdx];
    };

    const idRaw = get('id');
    const attivitaRaw = get('attivita');
    if (idRaw == null || String(idRaw).trim() === '') continue;
    if (attivitaRaw == null || String(attivitaRaw).trim() === '') continue;

    const id = String(idRaw).trim();

    if (idsVisti.has(id)) {
      errors.push(`ID duplicato alla riga ${i + 1}: "${id}"`);
      continue;
    }
    idsVisti.add(id);

    const freq = normalizeFrequenza(get('frequenza'));
    if (freq.warning) warnings.push(`Riga ${i + 1} (${id}): ${freq.warning}`);

    const prio = normalizePriorita(get('priorita'));
    if (prio.warning) warnings.push(`Riga ${i + 1} (${id}): ${prio.warning}`);

    const noteRaw = get('noteDitta');
    const noteStr = noteRaw == null ? '' : String(noteRaw).trim();

    voci.push({
      id,
      ambiente:        String(get('ambiente') ?? '').trim(),
      attivita:        String(attivitaRaw).trim(),
      dettaglio:       String(get('dettaglio') ?? '').trim(),
      frequenza:       freq.value,
      priorita:        prio.value,
      statoDefault:    normalizeStatoDefault(get('stato')),
      fotoRichiesta:   normalizeBool(get('fotoRichiesta')),
      controlloFinale: normalizeBool(get('controlloFinale')),
      noteDitta:       noteStr || undefined,
    });
  }

  if (voci.length === 0) {
    errors.push('Nessuna voce valida trovata nel foglio.');
    return { master: null, errors, warnings };
  }

  // 5) Build master
  const master: ChecklistMaster = {
    ruolo,
    voci,
    importedFrom: fileName,
    importedAt:   Date.now(),
  };

  return { master, errors, warnings };
}

// ─── Sheet scanner ──────────────────────────────────────────────────────────

interface FoundSheet {
  sheetName: string;
  headerRow: number;
  headerMap: Partial<Record<keyof CanonicalRow, number>>;
  rows:      unknown[][];
}

function findChecklistSheet(wb: XLSX.WorkBook): FoundSheet | null {
  for (const sheetName of wb.SheetNames) {
    const sh = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sh, {
      header: 1,
      defval: '',
      blankrows: false,
    });
    // Cerca una riga che sembri un header (almeno id+attivita+dettaglio)
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i];
      if (!row) continue;
      const headerMap: Partial<Record<keyof CanonicalRow, number>> = {};
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (typeof cell !== 'string') continue;
        const norm = normalizeHeader(cell);
        if (!norm) continue;
        const canonical = HEADER_ALIASES[norm];
        if (canonical && headerMap[canonical] === undefined) {
          headerMap[canonical] = c;
        }
      }
      if ('id' in headerMap && 'attivita' in headerMap && 'dettaglio' in headerMap) {
        return { sheetName, headerRow: i, headerMap, rows };
      }
    }
  }
  return null;
}
