/**
 * /api/admin/turnover/sync
 *
 * POST [?days=30&details=1] → sincronizza i turnover dalle partenze Beds24
 *                              (idempotente).
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 *
 * Risposta:
 *   {
 *     creati, esistenti, senzaCasa, senzaMaster, caseArchiviate,
 *     totaleProcessate,
 *     bookingDettagli?: [...]   // se ?details=1
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncTurnover } from '@/lib/turnover-sync';

export const runtime = 'nodejs';
export const maxDuration = 60;     // sync può richiedere alcuni secondi su Beds24

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = req.nextUrl;
  const daysParam = url.searchParams.get('days');
  const days = daysParam ? Math.max(1, Math.min(180, parseInt(daysParam, 10))) : 30;
  const details = url.searchParams.get('details') === '1';

  try {
    const result = await syncTurnover(days, details);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
