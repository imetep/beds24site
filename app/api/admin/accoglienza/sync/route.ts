/**
 * /api/admin/accoglienza/sync
 *
 * POST [?days=14] → sincronizza task accoglienza dagli arrivi Beds24.
 *                    Idempotente.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAccoglienza } from '@/lib/accoglienza-sync';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const daysParam = req.nextUrl.searchParams.get('days');
  const days = daysParam ? Math.max(1, Math.min(60, parseInt(daysParam, 10))) : 14;
  try {
    const result = await syncAccoglienza(days);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
