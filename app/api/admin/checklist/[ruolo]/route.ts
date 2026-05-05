/**
 * /api/admin/checklist/[ruolo]
 *
 * GET → restituisce la ChecklistMaster completa (tutte le voci) per un ruolo.
 *       Usata da AdminStrutture per mostrare le voci selezionabili come N/A
 *       per casa.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChecklistMaster } from '@/lib/checklist-kv';
import { RUOLI, type Ruolo } from '@/lib/operatori-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

interface RouteContext {
  params: Promise<{ ruolo: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { ruolo } = await ctx.params;
  if (!(RUOLI as readonly string[]).includes(ruolo)) {
    return NextResponse.json({ error: 'ruolo non valido' }, { status: 400 });
  }
  const master = await getChecklistMaster(ruolo as Ruolo);
  if (!master) {
    return NextResponse.json({ error: 'master non caricata per questo ruolo' }, { status: 404 });
  }
  return NextResponse.json({ master });
}
