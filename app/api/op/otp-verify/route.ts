/**
 * /api/op/otp-verify
 *
 * Verifica un OTP precedentemente richiesto via /api/op/otp e, se valido,
 * crea una sessione operatore (set cookie HttpOnly).
 *
 * POST { username, codice }
 *   → 200 + Set-Cookie session
 *   → 401 codice errato / scaduto / non richiesto / username sbagliato
 *   → 429 troppi tentativi (3 max)
 *
 * L'OTP è single-use: viene cancellato dopo verifica positiva o esauriti
 * i tentativi (anti-bruteforce).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOperatoreByUsername,
  getOtp,
  saveOtp,
  deleteOtp,
  createSession,
} from '@/lib/operatori-kv';
import {
  generateSessionToken,
  constantTimeStringEqual,
} from '@/lib/operatori-auth';
import { buildSessionCookie } from '@/lib/op-session';
import { OTP_MAX_TRIES } from '@/lib/operatori-types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { username?: unknown; codice?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const codice   = typeof body.codice   === 'string' ? body.codice.trim() : '';
  if (!username || !codice) {
    return NextResponse.json({ error: 'Username e codice richiesti' }, { status: 400 });
  }

  const op = await getOperatoreByUsername(username);
  if (!op || !op.attivo) {
    // Anti-enumeration: 401 generico
    return NextResponse.json({ error: 'Codice non valido' }, { status: 401 });
  }

  const otp = await getOtp(op.id);
  if (!otp) {
    return NextResponse.json({ error: 'Codice non valido o scaduto' }, { status: 401 });
  }

  if (Date.now() > otp.expiresAt) {
    await deleteOtp(op.id);
    return NextResponse.json({ error: 'Codice scaduto, richiedine uno nuovo' }, { status: 401 });
  }

  if (otp.tentativi >= OTP_MAX_TRIES) {
    await deleteOtp(op.id);
    return NextResponse.json({
      error: 'Troppi tentativi falliti, richiedi un nuovo codice',
    }, { status: 429 });
  }

  if (!constantTimeStringEqual(otp.codice, codice)) {
    otp.tentativi += 1;
    if (otp.tentativi >= OTP_MAX_TRIES) {
      await deleteOtp(op.id);
    } else {
      await saveOtp(op.id, otp);
    }
    return NextResponse.json({
      error: 'Codice errato',
      tentativiRimasti: Math.max(0, OTP_MAX_TRIES - otp.tentativi),
    }, { status: 401 });
  }

  // Successo — single use
  await deleteOtp(op.id);

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
