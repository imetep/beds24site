/**
 * lib/op-session.ts
 *
 * Helper server-side per estrarre l'operatore loggato dalla sessione cookie.
 * Usato dalle route /api/op/* e dalle pagine /op/* per gating.
 *
 * Cookie: SESSION_COOKIE_NAME ("op_session"), HttpOnly + Secure (in prod)
 *
 * Distinto dal sistema admin che usa una password singola condivisa
 * (vedi /api/admin/login) — gli operatori hanno sessioni individuali.
 */

import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SEC,
  type Operatore,
  type Ruolo,
} from './operatori-types';
import { getOperatore, getSessionOperatoreId } from './operatori-kv';

/**
 * Restituisce l'operatore loggato leggendo il cookie sessione, o null se
 * non loggato / sessione invalida / operatore non più esistente / non attivo.
 */
export async function getCurrentOperatore(): Promise<Operatore | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const operatoreId = await getSessionOperatoreId(token);
  if (!operatoreId) return null;

  const op = await getOperatore(operatoreId);
  if (!op || !op.attivo) return null;
  return op;
}

/**
 * Variante che lancia eccezione se non autenticato. Usata nelle route API
 * per fail-fast con 401.
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Operatore non autenticato') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Operatore non autorizzato per questa azione') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function requireOperatore(): Promise<Operatore> {
  const op = await getCurrentOperatore();
  if (!op) throw new UnauthorizedError();
  return op;
}

/**
 * Richiede che l'operatore loggato abbia almeno UNO dei ruoli specificati.
 * Lancia ForbiddenError se autenticato ma con ruoli sbagliati,
 * UnauthorizedError se non loggato.
 */
export async function requireRuolo(...ruoliRichiesti: Ruolo[]): Promise<Operatore> {
  const op = await requireOperatore();
  const ok = op.ruoli.some(r => ruoliRichiesti.includes(r));
  if (!ok) throw new ForbiddenError(`Ruolo richiesto: ${ruoliRichiesti.join(' / ')}`);
  return op;
}

// ─── Cookie set/clear helpers ────────────────────────────────────────────────

/**
 * Costruisce la stringa di Set-Cookie per la sessione operatore.
 * Da usare nella response headers delle route /api/op/login e /api/op/otp-verify.
 */
export function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SEC}`,
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

/** Costruisce la stringa di Set-Cookie per cancellare la sessione (logout). */
export function buildClearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}
