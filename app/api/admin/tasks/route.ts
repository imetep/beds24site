/**
 * /api/admin/tasks
 *
 * Listing generico di task con filtri. Usato dal pannello smistamento per
 * cambiare tra turnover/accoglienza/manutenzione/tutti.
 *
 * GET ?from&to&tipo&stato&operatoreId&ruolo
 *   - from/to (default: oggi → +14g)
 *   - tipo: turnover|accoglienza|manutenzione|periodica|adhoc
 *   - stato: comma-separated, default tutti
 *   - operatoreId: filtra
 *   - ruolo: filtra per ruoloRichiesto
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listTasks } from '@/lib/task-kv';
import { listOperatori } from '@/lib/operatori-kv';
import { listCase } from '@/lib/case-kv';
import { STATI_TASK, TIPI_TASK, type StatoTask, type TipoTask } from '@/lib/task-types';
import { RUOLI, type Ruolo } from '@/lib/operatori-types';

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

  const tipoParam = sp.get('tipo');
  const tipo: TipoTask | undefined = tipoParam && (TIPI_TASK as readonly string[]).includes(tipoParam)
    ? tipoParam as TipoTask : undefined;

  const ruoloParam = sp.get('ruolo');
  const ruolo: Ruolo | undefined = ruoloParam && (RUOLI as readonly string[]).includes(ruoloParam)
    ? ruoloParam as Ruolo : undefined;

  const operatoreId = sp.get('operatoreId') ?? undefined;
  const statoParam = sp.get('stato');
  let stato: StatoTask | StatoTask[] | undefined = undefined;
  if (statoParam) {
    const stati = statoParam.split(',').filter(s => (STATI_TASK as readonly string[]).includes(s));
    stato = stati.length === 1 ? stati[0] as StatoTask : stati as StatoTask[];
  }

  const tasks = await listTasks({ dataFrom: from, dataTo: to, tipo, ruolo, stato, operatoreId });

  const [allOps, allCase] = await Promise.all([listOperatori(), listCase(true)]);
  const opMap   = new Map(allOps.map(o => [o.id, { id: o.id, displayName: o.displayName, ruoli: o.ruoli }]));
  const casaMap = new Map(allCase.map(c => [c.id, { id: c.id, nome: c.nome, beds24RoomId: c.beds24RoomId }]));

  const enriched = tasks.map(t => ({
    ...t,
    casa:      casaMap.get(t.casaId) ?? null,
    operatore: t.operatoreId ? (opMap.get(t.operatoreId) ?? null) : null,
  }));

  enriched.sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    if (a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo);
    return 0;
  });

  return NextResponse.json({ tasks: enriched, from, to });
}
