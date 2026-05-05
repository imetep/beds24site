/**
 * /api/op/turnover/[id]
 *
 * GET   → singolo task con dettaglio casa, voci checklist e stati.
 *         Solo se assegnato all'operatore loggato.
 *
 * PATCH { vociUpdate?: [{ voceId, spuntata, noteOperatore? }, ...],
 *         noteOperatore?: string }
 *      → aggiorna stati voci checklist e/o note operatore.
 *        Transizione automatica: se l'op tocca per la prima volta,
 *        stato passa da 'assegnato' a 'in-corso'.
 *
 * Auth: cookie op_session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTask, saveTask } from '@/lib/task-kv';
import { getCasa } from '@/lib/case-kv';
import { requireOperatore, UnauthorizedError, ForbiddenError } from '@/lib/op-session';
import { listSegnalazioniByTask } from '@/lib/segnalazioni-kv';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function loadOwnedTask(id: string, operatoreId: string) {
  const task = await getTask(id);
  if (!task) return null;
  if (task.operatoreId !== operatoreId) throw new ForbiddenError('Task non assegnato a te');
  return task;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, ctx: RouteContext) {
  let op;
  try { op = await requireOperatore(); }
  catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw e;
  }
  const { id } = await ctx.params;

  let task;
  try {
    task = await loadOwnedTask(id, op.id);
  } catch (e) {
    if (e instanceof ForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const casa = await getCasa(task.casaId);
  const segnalazioni = await listSegnalazioniByTask(task.id);

  return NextResponse.json({ task, casa, segnalazioni });
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

interface PatchBody {
  vociUpdate?:    Array<{ voceId: string; spuntata?: boolean; noteOperatore?: string }>;
  noteOperatore?: string;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  let op;
  try { op = await requireOperatore(); }
  catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw e;
  }
  const { id } = await ctx.params;

  let task;
  try {
    task = await loadOwnedTask(id, op.id);
  } catch (e) {
    if (e instanceof ForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (task.stato === 'completato' || task.stato === 'annullato') {
    return NextResponse.json({ error: `task in stato "${task.stato}", non modificabile` }, { status: 400 });
  }

  let body: PatchBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 }); }

  // Aggiorna voci checklist
  if (Array.isArray(body.vociUpdate) && task.checklist) {
    const statiByVoceId = new Map(task.checklist.stati.map(s => [s.voceId, s]));
    for (const u of body.vociUpdate) {
      if (typeof u !== 'object' || u === null || typeof u.voceId !== 'string') continue;
      const stato = statiByVoceId.get(u.voceId);
      if (!stato) continue;
      if (typeof u.spuntata === 'boolean') {
        stato.spuntata = u.spuntata;
        stato.spuntataAt = u.spuntata ? Date.now() : undefined;
      }
      if (typeof u.noteOperatore === 'string') {
        const trim = u.noteOperatore.trim();
        stato.noteOperatore = trim || undefined;
      }
    }
  }

  if (typeof body.noteOperatore === 'string') {
    const trim = body.noteOperatore.trim();
    task.noteOperatore = trim || undefined;
  }

  // Transizione automatica assegnato → in-corso al primo tocco
  if (task.stato === 'assegnato') {
    task.stato = 'in-corso';
    task.apertoAt = Date.now();
  }
  task.updatedAt = Date.now();

  await saveTask(task);
  return NextResponse.json({ task });
}
