/**
 * /api/admin/turnover/[id]/biancheria
 *
 * PATCH { lenzMatrimoniali, lenzSingoli, federe, persone, scendibagno,
 *         culle } → aggiorna manualmente i set biancheria del task
 *                   pulizie. Sovrascrive il calcolo automatico.
 *
 * DELETE → ripristina il calcolo automatico cancellando l'override:
 *          NO. Per ora la PATCH semplicemente sovrascrive; per
 *          ripristinare il default basta riscrivere coi valori
 *          calcolati dal sync (riprovare /api/admin/turnover/sync).
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTask, saveTask } from '@/lib/task-kv';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  lenzMatrimoniali?: unknown;
  lenzSingoli?:      unknown;
  federe?:           unknown;
  persone?:          unknown;
  scendibagno?:      unknown;
  culle?:            unknown;
}

function nonNeg(v: unknown, fallback = 0): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.max(0, Math.round(v));
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;

  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (task.tipo !== 'turnover' || task.ruoloRichiesto !== 'pulizie') {
    return NextResponse.json({
      error: 'biancheria modificabile solo su task turnover ruolo pulizie',
    }, { status: 400 });
  }

  let body: PatchBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 }); }

  const current = task.biancheriaProssimo ?? {
    lenzMatrimoniali: 0, lenzSingoli: 0, federe: 0, persone: 0,
    scendibagno: 0, culle: 0,
    source: 'admin' as const,
    hasConfig: true,
  };

  task.biancheriaProssimo = {
    lenzMatrimoniali: nonNeg(body.lenzMatrimoniali, current.lenzMatrimoniali),
    lenzSingoli:      nonNeg(body.lenzSingoli,      current.lenzSingoli),
    federe:           nonNeg(body.federe,           current.federe),
    persone:          nonNeg(body.persone,          current.persone),
    scendibagno:      nonNeg(body.scendibagno,      current.scendibagno ?? 1),
    culle:            nonNeg(body.culle,            current.culle),
    source:           'admin',
    hasConfig:        true,
  };
  task.updatedAt = Date.now();

  await saveTask(task);
  return NextResponse.json({ task });
}
