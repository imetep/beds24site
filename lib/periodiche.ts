/**
 * lib/periodiche.ts
 *
 * Logica di alto livello per le scadenze periodiche.
 *
 * Genera la lista runtime delle scadenze (casa × voce-master-periodica)
 * combinando:
 *   - master checklist caricate (filtrando voci con frequenza ≠ 'Ogni turnover')
 *   - case attive non archiviate
 *   - voci NA per casa (escluse)
 *   - ultime esecuzioni registrate
 *   - task pendenti (tipo='periodica' non chiusi) — già schedulati
 */

import type { ScadenzaPeriodica } from './periodiche-types';
import { calcolaProssimaScadenza } from './periodiche-types';
import { listCase } from './case-kv';
import { getAllChecklistMasters } from './checklist-kv';
import { listAllUltimeEsecuzioni } from './periodiche-kv';
import { listOpenTasks } from './task-kv';
import { isVoceNonApplicabile } from './case-types';
import { RUOLI, type Ruolo } from './operatori-types';

/**
 * Costruisce la lista di tutte le scadenze periodiche correnti.
 * Le scadenze sono ordinate per prossimaScadenzaAt asc (le scadute prima).
 */
export async function calculateScadenze(): Promise<ScadenzaPeriodica[]> {
  const [masters, allCase, ultimeEsecuzioni, openTasks] = await Promise.all([
    getAllChecklistMasters(),
    listCase(false),                 // solo case non archiviate
    listAllUltimeEsecuzioni(),
    listOpenTasks(),
  ]);

  // Indice ultime esecuzioni per chiave composta
  const lastByKey = new Map<string, number>();
  const lastTaskByKey = new Map<string, string>();
  for (const u of ultimeEsecuzioni) {
    const k = `${u.casaId}:${u.ruolo}:${u.voceId}`;
    lastByKey.set(k, u.ultimaAt);
    lastTaskByKey.set(k, u.taskId);
  }

  // Indice task periodici aperti per chiave composta (casa+ruolo+voce)
  // Il task periodico ha checklist con snapshots[].id; usiamo il primo snapshot
  // come voceId di riferimento (un task periodico è single-voce)
  const pendingByKey = new Map<string, { id: string; data: string }>();
  for (const t of openTasks) {
    if (t.tipo !== 'periodica') continue;
    if (!t.checklist || t.checklist.snapshots.length === 0) continue;
    const ruolo = t.checklist.ruolo;
    // Per ora usiamo solo la PRIMA voce come riferimento.
    // Se in futuro un task copre più voci, serve un campo dedicato.
    const voceId = t.checklist.snapshots[0].id;
    const k = `${t.casaId}:${ruolo}:${voceId}`;
    pendingByKey.set(k, { id: t.id, data: t.data });
  }

  const out: ScadenzaPeriodica[] = [];

  for (const casa of allCase) {
    for (const ruolo of RUOLI) {
      const master = masters[ruolo];
      if (!master) continue;

      for (const voce of master.voci) {
        // Solo voci periodiche
        if (voce.frequenza === 'Ogni turnover') continue;
        // Filtra voci NA della casa
        if (isVoceNonApplicabile(casa, ruolo as Ruolo, voce.id)) continue;

        const k = `${casa.id}:${ruolo}:${voce.id}`;
        const ultimaAt = lastByKey.get(k);
        const prossimaAt = calcolaProssimaScadenza(ultimaAt, voce.frequenza);
        const giorniAllaScadenza = Math.round((prossimaAt - Date.now()) / 86400000);

        const pending = pendingByKey.get(k);

        out.push({
          casaId:               casa.id,
          casaNome:             casa.nome,
          ruolo:                ruolo as Ruolo,
          voceId:               voce.id,
          voceAmbiente:         voce.ambiente,
          voceAttivita:         voce.attivita,
          voceDettaglio:        voce.dettaglio,
          frequenza:            voce.frequenza,
          ultimaEsecuzioneAt:   ultimaAt,
          prossimaScadenzaAt:   prossimaAt,
          giorniAllaScadenza,
          isOverdue:            giorniAllaScadenza < 0,
          taskPendenteId:       pending?.id,
          taskPendenteData:     pending?.data,
        });
      }
    }
  }

  // Ordine: prima le scadute (overdue prima), poi per giorni alla scadenza asc.
  // Le "A richiesta" (giorniAllaScadenza spesso = 0 senza esecuzione) finiscono in fondo.
  out.sort((a, b) => {
    if (a.frequenza === 'A richiesta' && b.frequenza !== 'A richiesta') return 1;
    if (b.frequenza === 'A richiesta' && a.frequenza !== 'A richiesta') return -1;
    return a.prossimaScadenzaAt - b.prossimaScadenzaAt;
  });

  return out;
}
