/**
 * /api/op/turnover
 *
 * GET → lista i task assegnati all'operatore loggato (visibilità minima:
 *       solo i suoi, decisione 4).
 *
 *       Query params:
 *         ?from=YYYY-MM-DD&to=YYYY-MM-DD  (default: oggi → +14g)
 *         ?stati=assegnato,in-corso       (default: aperti)
 *         ?tipo=turnover|...              (default: tutti i tipi)
 *
 * Auth: cookie op_session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listTasksByOperator } from '@/lib/task-kv';
import { listCase } from '@/lib/case-kv';
import { requireOperatore, UnauthorizedError } from '@/lib/op-session';
import { isTaskAperto, type StatoTask, type TipoTask } from '@/lib/task-types';
import { TIPI_TASK, STATI_TASK } from '@/lib/task-types';

export const runtime = 'nodejs';

function todayYMD(): string { return new Date().toISOString().slice(0, 10); }
function plusDaysYMD(d: number): string {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  let op;
  try { op = await requireOperatore(); }
  catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    throw e;
  }

  const sp = req.nextUrl.searchParams;
  const from = sp.get('from') ?? todayYMD();
  const to   = sp.get('to')   ?? plusDaysYMD(14);
  const tipoParam = sp.get('tipo');
  const statiParam = sp.get('stati');

  const tipoFilter: TipoTask | null =
    tipoParam && (TIPI_TASK as readonly string[]).includes(tipoParam)
      ? (tipoParam as TipoTask) : null;

  const statiFilter: StatoTask[] | null = statiParam
    ? statiParam.split(',').filter(s => (STATI_TASK as readonly string[]).includes(s)) as StatoTask[]
    : null;

  const allMine = await listTasksByOperator(op.id);
  let filtered = allMine.filter(t =>
    t.data >= from && t.data <= to &&
    (tipoFilter ? t.tipo === tipoFilter : true) &&
    (statiFilter ? statiFilter.includes(t.stato) : isTaskAperto(t)),
  );

  // Arricchisco con casa
  const allCase = await listCase(true);
  const casaMap = new Map(allCase.map(c => [c.id, c]));
  const enriched = filtered.map(t => ({
    ...t,
    casa: casaMap.get(t.casaId) ?? null,
  }));

  // Sort: data asc, poi tipo
  enriched.sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.tipo.localeCompare(b.tipo);
  });

  return NextResponse.json({ tasks: enriched, from, to });
}
