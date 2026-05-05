/**
 * /api/admin/strutture/[id]/storico
 *
 * GET → storico task chiusi (completato + annullato) per la casa,
 *       arricchiti con info operatore. Ordinati per data desc (recenti
 *       prima). Limit 50.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listTasksByCasa } from '@/lib/task-kv';
import { listOperatori } from '@/lib/operatori-kv';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;

  const tasksRaw = await listTasksByCasa(id);
  const closed = tasksRaw.filter(t => t.stato === 'completato' || t.stato === 'annullato');

  // Arricchisci con operatore
  const allOps = await listOperatori();
  const opMap = new Map(allOps.map(o => [o.id, { id: o.id, displayName: o.displayName }]));

  const enriched = closed.map(t => ({
    id:               t.id,
    tipo:             t.tipo,
    ruoloRichiesto:   t.ruoloRichiesto,
    titolo:           t.titolo,
    data:             t.data,
    stato:            t.stato,
    completatoAt:     t.completatoAt ?? null,
    annullatoAt:      t.annullatoAt ?? null,
    operatore:        t.operatoreId ? opMap.get(t.operatoreId) ?? null : null,
    segnalazioniIds:  t.segnalazioniIds ?? [],
    noteOperatore:    t.noteOperatore ?? null,
    noteAdmin:        t.noteAdmin ?? null,
  }));

  // Ordine: data desc, poi completatoAt desc come tiebreaker
  enriched.sort((a, b) => {
    if (a.data !== b.data) return b.data.localeCompare(a.data);
    return (b.completatoAt ?? 0) - (a.completatoAt ?? 0);
  });

  return NextResponse.json({ tasks: enriched.slice(0, 50), totale: enriched.length });
}
