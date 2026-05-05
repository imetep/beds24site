/**
 * /api/op/turnover/[id]/segnalazione
 *
 * POST { voceId?, descrizione, gravita } → crea una segnalazione collegata
 *   al task. Va in Inbox admin (decisione 6) + notifica Telegram all'admin
 *   (decisione 7), con priorità ASAP per Critica/Alta.
 *
 *   Risposta: { segnalazione, task }
 *
 * Auth: cookie op_session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTask, saveTask } from '@/lib/task-kv';
import { getCasa } from '@/lib/case-kv';
import { saveSegnalazione } from '@/lib/segnalazioni-kv';
import { GRAVITA, type Gravita, type Segnalazione } from '@/lib/segnalazioni-types';
import {
  requireOperatore, UnauthorizedError, ForbiddenError,
} from '@/lib/op-session';
import { sendToAdmin } from '@/lib/telegram';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface CreateBody {
  voceId?:      unknown;
  descrizione?: unknown;
  gravita?:     unknown;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  let op;
  try { op = await requireOperatore(); }
  catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw e;
  }
  const { id: taskId } = await ctx.params;

  const task = await getTask(taskId);
  if (!task) return NextResponse.json({ error: 'task non trovato' }, { status: 404 });
  if (task.operatoreId !== op.id) {
    return NextResponse.json({ error: new ForbiddenError().message }, { status: 403 });
  }

  let body: CreateBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 }); }

  const descrizione = typeof body.descrizione === 'string' ? body.descrizione.trim() : '';
  if (!descrizione) {
    return NextResponse.json({ error: 'descrizione richiesta' }, { status: 400 });
  }

  const gravita = typeof body.gravita === 'string'
                  && (GRAVITA as readonly string[]).includes(body.gravita)
                  ? body.gravita as Gravita
                  : 'Media';

  const voceId = typeof body.voceId === 'string' && body.voceId.trim() ? body.voceId.trim() : undefined;

  const now = Date.now();
  const seg: Segnalazione = {
    id:                crypto.randomUUID(),
    taskId,
    voceId,
    casaId:            task.casaId,
    segnalataDa:       op.id,
    segnalataDaRuolo:  task.ruoloRichiesto,
    descrizione,
    gravita,
    stato:             'aperta',
    createdAt:         now,
    updatedAt:         now,
  };

  await saveSegnalazione(seg);

  // Aggiorna task: aggiunge id segnalazione + se voceId, marca segnalazioneId sulla voce
  task.segnalazioniIds = [...(task.segnalazioniIds ?? []), seg.id];
  if (voceId && task.checklist) {
    const stato = task.checklist.stati.find(s => s.voceId === voceId);
    if (stato) stato.segnalazioneId = seg.id;
  }
  task.updatedAt = Date.now();
  await saveTask(task);

  // Notifica admin Telegram (decisione 7: ASAP per Critica/Alta)
  try {
    const casa = await getCasa(task.casaId);
    const tag = (gravita === 'Critica' || gravita === 'Alta') ? `[${gravita.toUpperCase()}]` : `[${gravita}]`;
    const lines = [
      `${tag} Nuova segnalazione`,
      `Da: ${op.displayName}`,
      casa ? `Casa: ${casa.nome}` : null,
      voceId ? `Voce: ${voceId}` : null,
      '',
      descrizione,
      '',
      `Gestisci: /admin/segnalazioni`,
    ].filter(Boolean) as string[];

    await sendToAdmin(lines.join('\n'), {
      // Critiche/Alte: notifica con suono. Medie/Basse: silent.
      disableNotification: gravita !== 'Critica' && gravita !== 'Alta',
    });
  } catch (err) {
    console.error('[op/turnover/segnalazione] notifica admin fallita:', err);
  }

  return NextResponse.json({ segnalazione: seg, task }, { status: 201 });
}
