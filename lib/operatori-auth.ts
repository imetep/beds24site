/**
 * lib/operatori-auth.ts
 *
 * Primitive di autenticazione (lato server) per operatori:
 *   - hashing password PBKDF2-SHA256 (via Web Crypto, runtime-agnostic)
 *   - generazione OTP 6 cifre
 *   - generazione token sessione e registrazione (random 64/32 char hex)
 *   - confronto in tempo costante per evitare timing attacks
 *
 * Web Crypto è disponibile sia in Edge che in Node.js >= 18 runtime: niente
 * dipendenze native (bcrypt) che non girerebbero su Vercel Edge.
 */

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH       = 'SHA-256';
const PBKDF2_KEY_BYTES  = 32;
const SALT_BYTES        = 16;

// ─── Random helpers ──────────────────────────────────────────────────────────

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

function base64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ─── Password hashing ────────────────────────────────────────────────────────

export interface HashedPassword {
  hash:       string;   // base64
  salt:       string;   // base64
  iterations: number;
}

/**
 * Hasha una password con PBKDF2-SHA256 + salt random 16 bytes.
 * Output: { hash, salt, iterations } da memorizzare nel record Operatore.
 */
export async function hashPassword(plaintext: string): Promise<HashedPassword> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await pbkdf2(plaintext, salt, PBKDF2_ITERATIONS);
  return {
    hash:       bytesToBase64(hash),
    salt:       bytesToBase64(salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Verifica una password contro un hash memorizzato. Confronto in tempo
 * costante per evitare timing attacks.
 */
export async function verifyPassword(
  plaintext:  string,
  hashed:     HashedPassword,
): Promise<boolean> {
  const salt = base64ToBytes(hashed.salt);
  const expected = base64ToBytes(hashed.hash);
  const computed = await pbkdf2(plaintext, salt, hashed.iterations);
  return constantTimeEqual(expected, computed);
}

async function pbkdf2(
  plaintext:  string,
  salt:       Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(plaintext),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: PBKDF2_HASH },
    key,
    PBKDF2_KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

// ─── Constant-time compare ──────────────────────────────────────────────────

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Confronto in tempo costante per stringhe (es. token sessione, secret webhook).
 * Restituisce false anche per lunghezze diverse, sempre in tempo proporzionale
 * alla lunghezza maggiore.
 */
export function constantTimeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // ancora un confronto fittizio per uniformare il tempo
    let diff = 0;
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Token generators ───────────────────────────────────────────────────────

/** 64 char hex (32 bytes) — usato per cookie sessione. */
export function generateSessionToken(): string {
  return bytesToHex(randomBytes(32));
}

/** 32 char hex (16 bytes) — usato per deeplink registrazione Telegram. */
export function generateRegistrationToken(): string {
  return bytesToHex(randomBytes(16));
}

/** OTP 6 cifre, padding zero a sinistra. Distribuzione uniforme su 0–999_999. */
export function generateOtpCode(): string {
  // 24 bit di entropia da Web Crypto, mod 1_000_000.
  const a = randomBytes(4);
  const n = ((a[0] << 24) | (a[1] << 16) | (a[2] << 8) | a[3]) >>> 0;
  return String(n % 1_000_000).padStart(6, '0');
}
