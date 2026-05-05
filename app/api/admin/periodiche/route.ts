/**
 * /api/admin/periodiche
 *
 *   GET   → lista delle scadenze periodiche correnti, ordinate per
 *           prossima scadenza (overdue prima).
 *
 *   POST  { casaId, ruolo, voceId, data, operatoreId? }
 *         → schedula un task tipo='periodica' per quella scadenza.
 *           Il task contiene 1 sola voce snapshot (la voce della scadenza).
 *           Quando l'admin chiude il task → trigger aggiornamento
 *           ultimaEsecuzione (vedi /api/admin/turnover/[id]/complete).
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateScadenze } from '@/lib/periodiche';
import { saveTask } from '@/lib/task-kv';
import { getCasa } from '@/lib/case-kv';
import { getChecklistMaster } from '@/lib/checklist-kv';
import { getOperatore } from '@/lib/operatori-kv';
import { RUOLI, RUOLO_LABEL, type Ruolo } from '@/lib/operatori-types';
import type { Task } from '@/lib/task-types';
import type { ChecklistIstanza, VoceSnapshot } from '@/lib/checklist-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const scadenze = await calculateScadenze();
    return NextResponse.json({ scadenze });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ─── POST schedula ───────────────────────────────────────────────────────────

interface ScheduleBody {
  casaId?:       unknown;
  ruolo?:        unknown;
  voceId?:       unknown;
  data?:         unknown;       // YYYY-MM-DD
  operatoreId?:  unknown;       // opzionale: assegna direttamente
  noteAdmin?:    unknown;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: ScheduleBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 }); }

  const casaId = typeof body.casaId === 'string' ? body.casaId : '';
  const ruolo  = typeof body.ruolo === 'string' && (RUOLI as readonly string[]).includes(body.ruolo)
                 ? body.ruolo as Ruolo : null;
  const voceId = typeof body.voceId === 'string' ? body.voceId : '';
  const data   = typeof body.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data)
                 ? body.data : new Date().toISOString().slice(0, 10);
  const operatoreId = typeof body.operatoreId === 'string' && body.operatoreId
                      ? body.operatoreId : '';
  const noteAdmin   = typeof body.noteAdmin === 'string' ? body.noteAdmin.trim() : '';

  if (!casaId || !ruolo || !voceId) {
    return NextResponse.json({ error: 'casaId, ruolo, voceId richiesti' }, { status: 400 });
  }

  const casa = await getCasa(casaId);
  if (!casa) return NextResponse.json({ error: 'casa non trovata' }, { status: 404 });

  const master = await getChecklistMaster(ruolo);
  if (!master) {
    return NextResponse.json({ error: `master ${RUOLO_LABEL[ruolo]} non caricata` }, { status: 400 });
  }

  const voce = master.voci.find(v => v.id === voceId);
  if (!voce) {
    return NextResponse.json({ error: `voce ${voceId} non presente nella master ${ruolo}` }, { status: 404 });
  }

  // Verifica operatore se specificato
  if (operatoreId) {
    const op = await getOperatore(operatoreId);
    if (!op || !op.attivo) return NextResponse.json({ error: 'operatore non valido' }, { status: 400 });
    if (!op.ruoli.includes(ruolo)) {
      return NextResponse.json({ error: `operatore non ha ruolo ${RUOLO_LABEL[ruolo]}` }, { status: 400 });
    }
  }

  // Snapshot single-voce
  const snapshot: VoceSnapshot = {
    id:               voce.id,
    ambiente:         voce.ambiente,
    attivita:         voce.attivita,
    dettaglio:        voce.dettaglio,
    frequenza:        voce.frequenza,
    priorita:         voce.priorita,
    fotoRichiesta:    voce.fotoRichiesta,
    controlloFinale:  voce.controlloFinale,
  };
  const checklist: ChecklistIstanza = {
    ruolo,
    snapshots: [snapshot],
    stati:     [{ voceId: voce.id, spuntata: false }],
  };

  const now = Date.now();
  const task: Task = {
    id:               crypto.randomUUID(),
    tipo:             'periodica',
    ruoloRichiesto:   ruolo,
    casaId,
    data,
    titolo:           `${voce.attivita} — ${casa.nome}`,
    descrizione:      `${voce.frequenza} · ${voce.dettaglio}${noteAdmin ? `\n\nNote admin: ${noteAdmin}` : ''}`,
    stato:            operatoreId ? 'assegnato' : 'da-assegnare',
    operatoreId:      operatoreId || undefined,
    assegnatoAt:      operatoreId ? now : undefined,
    assegnatoBy:      operatoreId ? 'admin' : undefined,
    checklist,
    segnalazioniIds:  [],
    noteAdmin:        noteAdmin || undefined,
    createdAt:        now,
    updatedAt:        now,
    createdBy:        'admin',
  };

  await saveTask(task);
  return NextResponse.json({ task }, { status: 201 });
}
