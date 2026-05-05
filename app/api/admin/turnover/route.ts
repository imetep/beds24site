/**
 * /api/admin/turnover
 *
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&stato=...&operatoreId=...
 *   → lista task turnover (solo tipo='turnover') filtrati.
 *
 * Default (senza from/to): turnover dei prossimi 14 giorni.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listTasks } from '@/lib/task-kv';
import { listOperatori } from '@/lib/operatori-kv';
import { listCase } from '@/lib/case-kv';
import { STATI_TASK, type StatoTask } from '@/lib/task-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

function todayYMD(): string { return new Date().toISOString().slice(0, 10); }
function plusDaysYMD(d: number): string {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const from = sp.get('from') ?? todayYMD();
  const to   = sp.get('to')   ?? plusDaysYMD(14);
  const statoParam = sp.get('stato');
  const operatoreId = sp.get('operatoreId') ?? undefined;

  let stato: StatoTask | StatoTask[] | undefined = undefined;
  if (statoParam) {
    const stati = statoParam.split(',').filter(s => (STATI_TASK as readonly string[]).includes(s));
    stato = stati.length === 1 ? stati[0] as StatoTask : (stati as StatoTask[]);
  }

  // Listing per range data
  const tasksRaw = await listTasks({
    dataFrom:    from,
    dataTo:      to,
    tipo:        'turnover',
    stato,
    operatoreId,
  });

  // Arricchisco con info casa e operatore (per UI)
  const [allOps, allCase] = await Promise.all([listOperatori(), listCase(true)]);
  const opMap   = new Map(allOps.map(o => [o.id, { id: o.id, displayName: o.displayName, ruoli: o.ruoli }]));
  const casaMap = new Map(allCase.map(c => [c.id, { id: c.id, nome: c.nome, beds24RoomId: c.beds24RoomId }]));

  const enriched = tasksRaw.map(t => ({
    ...t,
    casa:      casaMap.get(t.casaId)        ?? null,
    operatore: t.operatoreId ? (opMap.get(t.operatoreId) ?? null) : null,
  }));

  // Sort: data asc, poi stato (da-assegnare prima)
  const statoOrder: Record<StatoTask, number> = {
    'da-assegnare':     0,
    'assegnato':        1,
    'in-corso':         2,
    'lavoro-terminato': 3,
    'completato':       4,
    'annullato':        5,
  };
  enriched.sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return statoOrder[a.stato] - statoOrder[b.stato];
  });

  return NextResponse.json({ tasks: enriched, from, to });
}
