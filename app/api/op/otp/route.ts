/**
 * /api/op/otp
 *
 * Richiesta OTP via Telegram (canale alternativo a username/password).
 *
 * POST { username } → 200 se OTP inviato (codice consegnato in chat Telegram)
 *                     401 se username non trovato / operatore disattivato
 *                     400 se l'operatore non ha registrato Telegram
 *                     429 se cooldown attivo (60s tra una richiesta e l'altra)
 *
 * L'OTP è 6 cifre, valido 5 minuti, max 3 tentativi (gestiti in /otp-verify).
 *
 * Anti-enumeration: per non rivelare se uno username esiste, restituiamo
 * comunque 200 anche se non esiste (OTP non viene davvero generato). Per
 * "Telegram non registrato" siamo invece espliciti perché il messaggio
 * d'errore aiuta l'operatore a capire che deve registrarsi.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOperatoreByUsername,
  saveOtp,
  isOtpCooldownActive,
  setOtpCooldown,
} from '@/lib/operatori-kv';
import { generateOtpCode } from '@/lib/operatori-auth';
import { sendMessage } from '@/lib/telegram';
import {
  OTP_TTL_SEC,
  OTP_COOLDOWN_SEC,
  type OtpRequest,
} from '@/lib/operatori-types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { username?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!username) {
    return NextResponse.json({ error: 'Username richiesto' }, { status: 400 });
  }

  const op = await getOperatoreByUsername(username);

  // Anti-enumeration: rispondi 200 anche se non esiste (OTP non generato)
  if (!op || !op.attivo) {
    return NextResponse.json({ ok: true, sent: false });
  }

  if (!op.chatIdTelegram) {
    return NextResponse.json({
      error: 'Telegram non registrato per questo operatore. Chiedi all\'admin il link di registrazione, oppure usa username + password.',
    }, { status: 400 });
  }

  if (await isOtpCooldownActive(op.id)) {
    return NextResponse.json({
      error: `Aspetta ${OTP_COOLDOWN_SEC}s prima di richiedere un nuovo codice.`,
    }, { status: 429 });
  }

  const codice = generateOtpCode();
  const now = Date.now();
  const otp: OtpRequest = {
    operatoreId: op.id,
    codice,
    tentativi:   0,
    createdAt:   now,
    expiresAt:   now + OTP_TTL_SEC * 1000,
  };
  await saveOtp(op.id, otp);
  await setOtpCooldown(op.id);

  try {
    // Plain text per evitare l'escape complesso di MarkdownV2 (-, ., ! richiedono backslash)
    await sendMessage(op.chatIdTelegram,
      `Codice di accesso LivingApple Operatori: ${codice}\n\n` +
      `Valido ${Math.floor(OTP_TTL_SEC / 60)} minuti. Non condividerlo con nessuno.`,
    );
  } catch (e) {
    console.error('[op/otp] Telegram sendMessage fallito:', e);
    return NextResponse.json({
      error: 'Impossibile inviare il codice via Telegram. Riprova o usa username/password.',
    }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sent: true, expiresInSec: OTP_TTL_SEC });
}
