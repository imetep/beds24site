/**
 * /api/admin/turnover/[id]/assign
 *
 *   POST   { operatoreId } → assegna o riassegna l'operatore.
 *                            Cambia stato a 'assegnato' se era 'da-assegnare'.
 *                            Mantiene lo stato se già 'in-corso' o avanti (riassegna).
 *   DELETE                  → rimuove l'assegnazione, stato → 'da-assegnare'.
 *
 * Verifica:
 *   - operatore esiste, attivo, ha il ruolo richiesto dal task.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 *
 * TODO: dopo Fase 6 inviare notifica Telegram all'operatore se ha chatId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTask, saveTask } from '@/lib/task-kv';
import { getOperatore } from '@/lib/operatori-kv';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── POST assign ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;

  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let body: { operatoreId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }
  const operatoreId = typeof body.operatoreId === 'string' ? body.operatoreId : '';
  if (!operatoreId) {
    return NextResponse.json({ error: 'operatoreId richiesto' }, { status: 400 });
  }

  const op = await getOperatore(operatoreId);
  if (!op) return NextResponse.json({ error: 'operatore non trovato' }, { status: 404 });
  if (!op.attivo) return NextResponse.json({ error: 'operatore disattivato' }, { status: 400 });
  if (!op.ruoli.includes(task.ruoloRichiesto)) {
    return NextResponse.json({
      error: `operatore non ha il ruolo richiesto "${task.ruoloRichiesto}"`,
    }, { status: 400 });
  }

  task.operatoreId = operatoreId;
  task.assegnatoAt = Date.now();
  task.assegnatoBy = 'admin';
  // Stato: se da-assegnare → assegnato. Se già in-corso o avanzato, mantieni.
  if (task.stato === 'da-assegnare') task.stato = 'assegnato';
  task.updatedAt = Date.now();

  await saveTask(task);
  return NextResponse.json({ task });
}

// ─── DELETE unassign ─────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;

  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });

  task.operatoreId = undefined;
  task.assegnatoAt = undefined;
  task.assegnatoBy = undefined;
  // Solo se non già lavoro-terminato/completato — se lo è, rifiutiamo
  if (task.stato === 'lavoro-terminato' || task.stato === 'completato') {
    return NextResponse.json({
      error: `non si può rimuovere l'assegnazione di un task già "${task.stato}"`,
    }, { status: 400 });
  }
  task.stato = 'da-assegnare';
  task.updatedAt = Date.now();
  await saveTask(task);
  return NextResponse.json({ task });
}
