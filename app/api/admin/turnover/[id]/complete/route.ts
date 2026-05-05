/**
 * /api/admin/turnover/[id]/complete
 *
 *   POST → admin chiude il task (doppia chiusura, decisione 14):
 *           accetta solo task in stato 'lavoro-terminato' (premuto dall'op)
 *           e li porta a 'completato'.
 *           In casi eccezionali admin può forzare anche da 'in-corso' o
 *           'assegnato' passando { force: true }.
 *
 *   DELETE → riapre un task completato (back to 'lavoro-terminato' se aveva
 *            quel passaggio, altrimenti a 'assegnato').
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTask, saveTask } from '@/lib/task-kv';
import { setUltimaEsecuzione } from '@/lib/periodiche-kv';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;

  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let force = false;
  let noteAdmin: string | undefined;
  try {
    const body = await req.json();
    if (body && typeof body === 'object') {
      force = (body as { force?: unknown }).force === true;
      const n = (body as { noteAdmin?: unknown }).noteAdmin;
      if (typeof n === 'string') noteAdmin = n;
    }
  } catch { /* body opzionale */ }

  if (task.stato === 'completato') {
    return NextResponse.json({ task, note: 'già completato' });
  }
  if (task.stato === 'annullato') {
    return NextResponse.json({ error: 'task annullato, non chiudibile' }, { status: 400 });
  }
  if (task.stato !== 'lavoro-terminato' && !force) {
    return NextResponse.json({
      error: `il task è ancora "${task.stato}". L'operatore deve premere "Lavoro terminato" prima della conferma admin. Usa { force: true } per forzare.`,
    }, { status: 400 });
  }

  task.stato = 'completato';
  task.completatoAt = Date.now();
  task.updatedAt    = Date.now();
  if (noteAdmin) task.noteAdmin = noteAdmin;

  await saveTask(task);

  // Hook periodiche: se task.tipo === 'periodica', registra l'esecuzione
  // della voce per il calcolo della prossima scadenza.
  if (task.tipo === 'periodica' && task.checklist && task.checklist.snapshots.length > 0) {
    try {
      for (const snap of task.checklist.snapshots) {
        await setUltimaEsecuzione({
          casaId:    task.casaId,
          ruolo:     task.checklist.ruolo,
          voceId:    snap.id,
          ultimaAt:  task.completatoAt,
          taskId:    task.id,
        });
      }
    } catch (err) {
      console.error('[admin/turnover/complete] update ultimaEsecuzione fallito:', err);
    }
  }

  return NextResponse.json({ task });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;

  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (task.stato !== 'completato') {
    return NextResponse.json({ error: `task non è completato (stato: ${task.stato})` }, { status: 400 });
  }

  task.stato = task.lavoroTerminatoAt ? 'lavoro-terminato' : (task.operatoreId ? 'assegnato' : 'da-assegnare');
  task.completatoAt = undefined;
  task.updatedAt = Date.now();
  await saveTask(task);
  return NextResponse.json({ task });
}
