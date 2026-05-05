/**
 * /api/admin/operatori/[id]/reset-password
 *
 * POST { newPassword } → admin imposta una nuova password per un operatore.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 * Min 6 caratteri.
 *
 * NB: le sessioni esistenti restano valide fino alla loro scadenza (90gg).
 * Per invalidarle subito si potrebbe scansionare op-session:* ma è costoso
 * — preferiamo lasciare che scadano naturalmente. L'operatore continuerà a
 * usare l'app finché il cookie non scade, ma per nuovi login userà la nuova
 * password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOperatore, saveOperatore } from '@/lib/operatori-kv';
import { hashPassword } from '@/lib/operatori-auth';

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

  let body: { newPassword?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password minima 6 caratteri' }, { status: 400 });
  }

  const hashed = await hashPassword(newPassword);
  op.passwordHash       = hashed.hash;
  op.passwordSalt       = hashed.salt;
  op.passwordIterations = hashed.iterations;
  op.updatedAt = Date.now();
  await saveOperatore(op);

  return NextResponse.json({ ok: true });
}
