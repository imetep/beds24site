/**
 * lib/beds24-token.ts
 *
 * Gestione token Beds24 API V2.
 * - Locale: salva su .beds24-token (sopravvive ai riavvii)
 * - Vercel: salva su Upstash Redis (condiviso tra istanze serverless)
 */

import fs from 'fs';
import path from 'path';

const BASE_URL   = 'https://beds24.com/api/v2';
const TOKEN_FILE = path.join(process.cwd(), '.beds24-token');
const REDIS_KEY  = 'beds24:refreshToken';

interface TokenState {
  token:        string;
  refreshToken: string;
  expiresAt:    number;
}

let state: TokenState | null = null;

// ─── Redis (Upstash) ─────────────────────────────────────────────────────────

async function redisGet(key: string): Promise<string | null> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json();
    // data.result può essere stringa diretta o JSON {"value":"..."}
    if (!data.result) return null;
    if (typeof data.result === 'string') {
      try {
        const parsed = JSON.parse(data.result);
        return parsed.value ?? data.result;
      } catch {
        return data.result;
      }
    }
    return String(data.result);
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: string): Promise<void> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  try {
    // Usa formato array Upstash: ["SET", "key", "value"]
    const body = JSON.stringify(['SET', key, value]);
    await fetch(`${url}/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
  } catch (e) {
    console.warn('[beds24-token] Redis set error:', e);
  }
}

// ─── Disco (locale) ──────────────────────────────────────────────────────────

function loadFromDisk(): TokenState | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      if (data.expiresAt && data.token && data.refreshToken) return data;
    }
  } catch {}
  return null;
}

function saveToDisk(s: TokenState) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(s), 'utf-8');
  } catch (e) {
    console.warn('[beds24-token] Impossibile salvare su disco:', e);
  }
}

// ─── getToken ────────────────────────────────────────────────────────────────

export async function getToken(): Promise<string> {
  const now = Date.now();

  // 1. Cache in memoria
  if (state && now < state.expiresAt - 5 * 60 * 1000) {
    return state.token;
  }

  // 2. Cache su disco (locale)
  const disk = loadFromDisk();
  if (disk && now < disk.expiresAt - 5 * 60 * 1000) {
    state = disk;
    return state.token;
  }

  // 3. Determina refresh token: Redis → disco → .env.local
  let refreshToken: string | null = null;

  const fromRedis = await redisGet(REDIS_KEY);
  if (fromRedis) {
    refreshToken = fromRedis;
    console.log('[beds24-token] Usando refreshToken da Redis:', refreshToken.slice(0, 6) + '...');
  } else if (disk?.refreshToken) {
    refreshToken = disk.refreshToken;
    console.log('[beds24-token] Usando refreshToken da disco');
  } else {
    refreshToken = process.env.BEDS24_REFRESH_TOKEN ?? null;
    console.log('[beds24-token] Usando refreshToken da .env.local');
  }

  if (!refreshToken) {
    throw new Error('[beds24-token] Nessun refresh token disponibile');
  }

  // 4. Chiama Beds24
  console.log('[beds24-token] Rinnovo token di accesso...');

  const res = await fetch(`${BASE_URL}/authentication/token`, {
    headers: { refreshToken },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[beds24-token] Auth error:', res.status, body);

    // Se token da Redis/disco fallisce, riprova con .env.local
    const envToken = process.env.BEDS24_REFRESH_TOKEN;
    if (envToken && refreshToken !== envToken) {
      console.log('[beds24-token] Retry con token da .env.local...');
      await redisSet(REDIS_KEY, envToken);
      try { fs.unlinkSync(TOKEN_FILE); } catch {}
      state = null;
      return getToken();
    }

    throw new Error(`[beds24-token] Auth error ${res.status}: ${body}`);
  }

  const data = await res.json();

  // 5. Salva il nuovo refresh token su Redis e disco
  const newRefreshToken = data.refreshToken ?? refreshToken;

  state = {
    token:        data.token,
    refreshToken: newRefreshToken,
    expiresAt:    now + (data.expiresIn ?? 3600) * 1000,
  };

  await redisSet(REDIS_KEY, newRefreshToken);
  saveToDisk(state);

  console.log('[beds24-token] ✅ Token rinnovato. ExpiresIn:', data.expiresIn ?? 3600, 's');

  return state.token;
}
