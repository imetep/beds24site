/**
 * lib/operatori-kv.ts
 *
 * CRUD operatori + storage sessioni/OTP/registrationToken/chatId mapping
 * su Upstash Redis.
 *
 * Chiavi:
 *   operatore:{id}                  → JSON Operatore (persistente)
 *   operatore-by-username:{u}       → operatoreId (indice univoco)
 *   operatore-by-chatid:{chatId}    → operatoreId (popolato dopo registrazione bot)
 *   operatori:list                  → SET di operatoreId (per listing admin)
 *
 *   op-session:{token}              → operatoreId, TTL 90 giorni
 *   op-otp:{operatoreId}            → JSON OtpRequest, TTL 5 min
 *   op-otp-cooldown:{operatoreId}   → "1", TTL 60 sec (anti-spam)
 *   op-registration:{token}         → operatoreId, TTL 7 giorni
 */

import { Redis } from '@upstash/redis';
import {
  type Operatore,
  type OtpRequest,
  SESSION_TTL_SEC,
  OTP_TTL_SEC,
  OTP_COOLDOWN_SEC,
  REGISTRATION_TTL_SEC,
} from './operatori-types';

// ─── Client singleton ────────────────────────────────────────────────────────

let _client: Redis | null = null;

function client(): Redis {
  if (_client) return _client;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('[operatori-kv] KV_REST_API_URL / KV_REST_API_TOKEN mancanti');
  }
  _client = new Redis({ url, token });
  return _client;
}

// ─── Helpers parse ───────────────────────────────────────────────────────────

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return null;
}

// ─── Operatore CRUD ──────────────────────────────────────────────────────────

const OP_PREFIX           = 'operatore:';
const OP_BY_USERNAME      = 'operatore-by-username:';
const OP_BY_CHATID        = 'operatore-by-chatid:';
const OP_LIST_KEY         = 'operatori:list';

function opKey(id: string): string             { return `${OP_PREFIX}${id}`; }
function byUsernameKey(u: string): string      { return `${OP_BY_USERNAME}${u}`; }
function byChatIdKey(chatId: number): string   { return `${OP_BY_CHATID}${chatId}`; }

/**
 * Crea o aggiorna un operatore. Mantiene gli indici by-username e by-chatid.
 * NB: assume che il caller abbia già verificato univocità username (vedi getOperatoreByUsername).
 */
export async function saveOperatore(op: Operatore): Promise<void> {
  const c = client();
  // Leggi vecchio per capire se username/chatId è cambiato
  const old = await getOperatore(op.id);
  const pipe = c.pipeline();
  pipe.set(opKey(op.id), JSON.stringify(op));
  pipe.sadd(OP_LIST_KEY, op.id);

  // username changed → cleanup vecchio indice
  if (old && old.username !== op.username) {
    pipe.del(byUsernameKey(old.username));
  }
  pipe.set(byUsernameKey(op.username), op.id);

  // chatId changed → cleanup vecchio indice
  if (old?.chatIdTelegram && old.chatIdTelegram !== op.chatIdTelegram) {
    pipe.del(byChatIdKey(old.chatIdTelegram));
  }
  if (op.chatIdTelegram) {
    pipe.set(byChatIdKey(op.chatIdTelegram), op.id);
  }
  await pipe.exec();
}

export async function getOperatore(id: string): Promise<Operatore | null> {
  return parseJson<Operatore>(await client().get(opKey(id)));
}

export async function getOperatoreByUsername(username: string): Promise<Operatore | null> {
  const id = await client().get<string>(byUsernameKey(username));
  if (!id) return null;
  return getOperatore(id);
}

export async function getOperatoreByChatId(chatId: number): Promise<Operatore | null> {
  const id = await client().get<string>(byChatIdKey(chatId));
  if (!id) return null;
  return getOperatore(id);
}

export async function listOperatori(): Promise<Operatore[]> {
  const ids = await client().smembers(OP_LIST_KEY);
  if (ids.length === 0) return [];
  const keys = ids.map(opKey);
  const values = await client().mget<(string | Operatore | null)[]>(...keys);
  const out: Operatore[] = [];
  for (const v of values) {
    const parsed = parseJson<Operatore>(v);
    if (parsed) out.push(parsed);
  }
  out.sort((a, b) => a.displayName.localeCompare(b.displayName, 'it'));
  return out;
}

export async function deleteOperatore(id: string): Promise<void> {
  const op = await getOperatore(id);
  if (!op) return;
  const pipe = client().pipeline();
  pipe.del(opKey(id));
  pipe.del(byUsernameKey(op.username));
  if (op.chatIdTelegram) pipe.del(byChatIdKey(op.chatIdTelegram));
  pipe.srem(OP_LIST_KEY, id);
  await pipe.exec();
}

// ─── Sessioni operatore ─────────────────────────────────────────────────────

const OP_SESSION_PREFIX = 'op-session:';

function sessionKey(token: string): string { return `${OP_SESSION_PREFIX}${token}`; }

export async function createSession(token: string, operatoreId: string): Promise<void> {
  await client().set(sessionKey(token), operatoreId, { ex: SESSION_TTL_SEC });
}

export async function getSessionOperatoreId(token: string): Promise<string | null> {
  return client().get<string>(sessionKey(token));
}

export async function deleteSession(token: string): Promise<void> {
  await client().del(sessionKey(token));
}

// ─── OTP via Telegram ───────────────────────────────────────────────────────

const OP_OTP_PREFIX      = 'op-otp:';
const OP_OTP_COOLDOWN    = 'op-otp-cooldown:';

function otpKey(operatoreId: string): string      { return `${OP_OTP_PREFIX}${operatoreId}`; }
function otpCooldownKey(operatoreId: string): string { return `${OP_OTP_COOLDOWN}${operatoreId}`; }

/**
 * Salva una OTP request con TTL 5 minuti.
 */
export async function saveOtp(operatoreId: string, otp: OtpRequest): Promise<void> {
  await client().set(otpKey(operatoreId), JSON.stringify(otp), { ex: OTP_TTL_SEC });
}

export async function getOtp(operatoreId: string): Promise<OtpRequest | null> {
  return parseJson<OtpRequest>(await client().get(otpKey(operatoreId)));
}

export async function deleteOtp(operatoreId: string): Promise<void> {
  await client().del(otpKey(operatoreId));
}

/**
 * Verifica se l'operatore è in cooldown anti-spam (1 OTP al minuto).
 * Imposta il flag se non c'è.
 */
export async function isOtpCooldownActive(operatoreId: string): Promise<boolean> {
  const v = await client().get<string>(otpCooldownKey(operatoreId));
  return v !== null;
}

export async function setOtpCooldown(operatoreId: string): Promise<void> {
  await client().set(otpCooldownKey(operatoreId), '1', { ex: OTP_COOLDOWN_SEC });
}

// ─── Registration token (deeplink Telegram) ─────────────────────────────────

const OP_REG_PREFIX = 'op-registration:';

function regKey(token: string): string { return `${OP_REG_PREFIX}${token}`; }

/**
 * Salva un token di registrazione che lega un deeplink al specifico operatore.
 * TTL 7 giorni.
 */
export async function saveRegistrationToken(token: string, operatoreId: string): Promise<void> {
  await client().set(regKey(token), operatoreId, { ex: REGISTRATION_TTL_SEC });
}

export async function consumeRegistrationToken(token: string): Promise<string | null> {
  const c = client();
  const operatoreId = await c.get<string>(regKey(token));
  if (!operatoreId) return null;
  await c.del(regKey(token));
  return operatoreId;
}
