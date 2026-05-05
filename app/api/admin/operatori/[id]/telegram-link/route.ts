/**
 * /api/admin/operatori/[id]/telegram-link
 *
 * POST → genera un nuovo registrationToken per l'operatore e restituisce il
 *        deeplink t.me/<bot>?start=<token> da condividere con l'operatore.
 *        Il token ha TTL 7 giorni. Genera ne uno nuovo invalida implicitamente
 *        i precedenti? NO: i token sono indipendenti, ma quello vecchio scade
 *        comunque dopo 7gg o al primo uso (single-use via consumeRegistrationToken).
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 *
 * Risposta: { deeplink, expiresAt }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOperatore, saveRegistrationToken } from '@/lib/operatori-kv';
import { generateRegistrationToken } from '@/lib/operatori-auth';
import { buildRegistrationDeeplink } from '@/lib/telegram';
import { REGISTRATION_TTL_SEC } from '@/lib/operatori-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;

  const op = await getOperatore(id);
  if (!op) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const token = generateRegistrationToken();
  await saveRegistrationToken(token, op.id);

  let deeplink: string;
  try {
    deeplink = buildRegistrationDeeplink(token);
  } catch (e) {
    // TELEGRAM_BOT_USERNAME mancante
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({
    deeplink,
    expiresAt: Date.now() + REGISTRATION_TTL_SEC * 1000,
  });
}
