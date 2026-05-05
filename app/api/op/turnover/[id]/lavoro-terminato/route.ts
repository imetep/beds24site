/**
 * /api/op/turnover/[id]/lavoro-terminato
 *
 * POST → operatore preme "Lavoro terminato" (decisione 14: doppia chiusura).
 *        Cambia stato a 'lavoro-terminato' e invia notifica Telegram all'admin.
 *        L'admin completerà manualmente da /admin/turnover.
 *
 * Auth: cookie op_session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTask, saveTask } from '@/lib/task-kv';
import { getCasa } from '@/lib/case-kv';
import { listSegnalazioniByTask } from '@/lib/segnalazioni-kv';
import {
  requireOperatore, UnauthorizedError, ForbiddenError,
} from '@/lib/op-session';
import { sendToAdmin } from '@/lib/telegram';
import { calcolaCompletamento } from '@/lib/checklist-types';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, ctx: RouteContext) {
  let op;
  try { op = await requireOperatore(); }
  catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw e;
  }
  const { id } = await ctx.params;

  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (task.operatoreId !== op.id) {
    return NextResponse.json({ error: new ForbiddenError().message }, { status: 403 });
  }
  if (task.stato === 'completato' || task.stato === 'annullato') {
    return NextResponse.json({ error: `task già "${task.stato}"` }, { status: 400 });
  }
  if (task.stato === 'lavoro-terminato') {
    return NextResponse.json({ task, note: 'già marcato come terminato' });
  }

  task.stato = 'lavoro-terminato';
  task.lavoroTerminatoAt = Date.now();
  task.updatedAt = Date.now();
  await saveTask(task);

  // Notifica admin Telegram (best-effort; non bloccare la risposta in caso di errore)
  try {
    const casa = await getCasa(task.casaId);
    const segnalazioni = await listSegnalazioniByTask(task.id);
    const apertaCount = segnalazioni.filter(s => s.stato === 'aperta' || s.stato === 'in-triage').length;
    const completamento = task.checklist ? calcolaCompletamento(task.checklist) : null;

    const lines = [
      `Lavoro TERMINATO da ${op.displayName}`,
      `Task: ${task.titolo}`,
      casa ? `Casa: ${casa.nome} (${casa.beds24RoomId})` : null,
      `Data: ${task.data}`,
      completamento != null ? `Checklist completata: ${completamento}%` : null,
      apertaCount > 0 ? `Segnalazioni aperte: ${apertaCount}` : null,
      '',
      'Vai su /admin per confermare "Casa pronta" o gestire le segnalazioni.',
    ].filter(Boolean) as string[];

    await sendToAdmin(lines.join('\n'));
  } catch (err) {
    console.error('[op/turnover/lavoro-terminato] notifica admin fallita:', err);
  }

  return NextResponse.json({ task });
}
