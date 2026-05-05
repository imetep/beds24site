/**
 * /api/admin/segnalazioni/[id]/crea-task
 *
 * POST { ruolo: 'manutentore' | 'giardiniere', data: 'YYYY-MM-DD',
 *        operatoreId?: string, conChecklist?: boolean, descrizione?: string }
 *   → crea un Task di tipo 'manutenzione' collegato alla segnalazione e
 *     aggiorna la segnalazione (stato='task-creato', taskManutenzioneId).
 *
 *   Se conChecklist=true e la master del ruolo è caricata, snapshotta le voci
 *   "Ogni turnover" come per i turnover. Default false (task-fix puntuale).
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSegnalazione, saveSegnalazione } from '@/lib/segnalazioni-kv';
import { saveTask } from '@/lib/task-kv';
import { getOperatore } from '@/lib/operatori-kv';
import { getCasa } from '@/lib/case-kv';
import { getChecklistMaster } from '@/lib/checklist-kv';
import { isVoceNonApplicabile } from '@/lib/case-types';
import type { Task } from '@/lib/task-types';
import type { ChecklistIstanza, VoceSnapshot } from '@/lib/checklist-types';
import type { Ruolo } from '@/lib/operatori-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface CreateBody {
  ruolo?:        unknown;       // 'manutentore' | 'giardiniere'
  data?:         unknown;       // YYYY-MM-DD
  operatoreId?:  unknown;
  conChecklist?: unknown;
  descrizione?:  unknown;
}

const RUOLI_AMMESSI: Ruolo[] = ['manutentore', 'giardiniere'];

export async function POST(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const seg = await getSegnalazione(id);
  if (!seg) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let body: CreateBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 }); }

  const ruolo = typeof body.ruolo === 'string' && RUOLI_AMMESSI.includes(body.ruolo as Ruolo)
                ? body.ruolo as Ruolo : 'manutentore';
  const data  = typeof body.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data)
                ? body.data : new Date().toISOString().slice(0, 10);
  const operatoreId  = typeof body.operatoreId === 'string' ? body.operatoreId : '';
  const conChecklist = body.conChecklist === true;
  const descrAdmin   = typeof body.descrizione === 'string' ? body.descrizione.trim() : '';

  // Verifica operatore
  if (operatoreId) {
    const op = await getOperatore(operatoreId);
    if (!op) return NextResponse.json({ error: 'operatore non trovato' }, { status: 404 });
    if (!op.attivo) return NextResponse.json({ error: 'operatore disattivato' }, { status: 400 });
    if (!op.ruoli.includes(ruolo)) {
      return NextResponse.json({ error: `operatore non ha il ruolo ${ruolo}` }, { status: 400 });
    }
  }

  const casa = await getCasa(seg.casaId);

  // Costruzione checklist opzionale
  let checklist: ChecklistIstanza | undefined;
  if (conChecklist) {
    const master = await getChecklistMaster(ruolo);
    if (!master) {
      return NextResponse.json({
        error: `master "${ruolo}" non caricata. Carica prima la checklist da /admin/checklist o crea il task senza checklist.`,
      }, { status: 400 });
    }
    const snapshots: VoceSnapshot[] = [];
    for (const v of master.voci) {
      if (v.frequenza !== 'Ogni turnover') continue;
      if (casa && isVoceNonApplicabile(casa, ruolo, v.id)) continue;
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
    checklist = {
      ruolo,
      snapshots,
      stati:  snapshots.map(s => ({ voceId: s.id, spuntata: false })),
    };
  }

  const titoloBase = casa ? `Intervento ${ruolo} ${casa.nome}` : `Intervento ${ruolo}`;
  const descrFinale = [
    `Segnalazione: ${seg.descrizione}`,
    descrAdmin ? `Note admin: ${descrAdmin}` : null,
  ].filter(Boolean).join('\n');

  const now = Date.now();
  const task: Task = {
    id:              crypto.randomUUID(),
    tipo:            'manutenzione',
    ruoloRichiesto:  ruolo,
    casaId:          seg.casaId,
    data,
    titolo:          titoloBase,
    descrizione:     descrFinale,
    stato:           operatoreId ? 'assegnato' : 'da-assegnare',
    operatoreId:     operatoreId || undefined,
    assegnatoAt:     operatoreId ? now : undefined,
    assegnatoBy:     operatoreId ? 'admin' : undefined,
    checklist,
    segnalazioniIds: [seg.id],
    createdAt:       now,
    updatedAt:       now,
    createdBy:       'admin',
  };

  await saveTask(task);

  // Aggiorna segnalazione
  seg.stato              = 'task-creato';
  seg.taskManutenzioneId = task.id;
  seg.updatedAt          = Date.now();
  await saveSegnalazione(seg);

  return NextResponse.json({ task, segnalazione: seg }, { status: 201 });
}
