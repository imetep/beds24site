/**
 * /api/op/login
 *
 * Login operatore via username + password (canale di default, sempre disponibile).
 * Per OTP via Telegram → vedi /api/op/otp e /api/op/otp-verify.
 *
 *   POST   { username, password }  → 200 + Set-Cookie session
 *                                    400 input invalido
 *                                    401 credenziali errate / operatore disattivato
 *   DELETE → 200 + clear cookie
 *
 * Risposta successo: { operatore: { id, username, displayName, ruoli, hasTelegram } }
 * Niente passwordHash mai esposto.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOperatoreByUsername,
  createSession,
  deleteSession,
} from '@/lib/operatori-kv';
import {
  verifyPassword,
  generateSessionToken,
} from '@/lib/operatori-auth';
import {
  buildSessionCookie,
  buildClearSessionCookie,
} from '@/lib/op-session';
import { SESSION_COOKIE_NAME } from '@/lib/operatori-types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    return NextResponse.json({ error: 'Username e password richiesti' }, { status: 400 });
  }

  const op = await getOperatoreByUsername(username);
  if (!op) {
    return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
  }
  if (!op.attivo) {
    return NextResponse.json({ error: 'Operatore disattivato' }, { status: 401 });
  }

  const ok = await verifyPassword(password, {
    hash:       op.passwordHash,
    salt:       op.passwordSalt,
    iterations: op.passwordIterations,
  });
  if (!ok) {
    return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
  }

  const token = generateSessionToken();
  await createSession(token, op.id);

  const res = NextResponse.json({
    operatore: {
      id:           op.id,
      username:     op.username,
      displayName:  op.displayName,
      ruoli:        op.ruoli,
      hasTelegram:  !!op.chatIdTelegram,
    },
  });
  res.headers.set('Set-Cookie', buildSessionCookie(token));
  return res;
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) await deleteSession(token);

  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', buildClearSessionCookie());
  return res;
}
