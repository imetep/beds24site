/**
 * lib/beds24-token.ts
 *
 * Gestione token Beds24 API V2.
 * - Locale:  salva lo stato completo su .beds24-token (sopravvive ai riavvii)
 * - Vercel:  salva lo stato completo su Upstash Redis (condiviso tra istanze serverless)
 *
 * ARCHITETTURA:
 *   memoria → Redis (stato completo) → disco → chiamata Beds24
 *
 * Redis salva il TokenState intero (token + expiresAt + refreshToken) così ogni
 * istanza serverless trova l'access token già pronto e non ri-chiama Beds24
 * ad ogni cold start, evitando sprechi di crediti API.
 */

import fs from 'fs';
import path from 'path';

const BASE_URL   = 'https://beds24.com/api/v2';
const TOKEN_FILE = path.join(process.cwd(), '.beds24-token');

// Chiavi Redis
const REDIS_STATE_KEY = 'beds24:tokenState';   // stato completo (token + expiresAt + refreshToken)
const REDIS_RT_KEY    = 'beds24:refreshToken';  // solo refreshToken (compatibilità)

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
    if (!res.ok) return null;
    const data = await res.json();
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
    // ✅ FIX: Upstash pipeline — POST /pipeline con array di array
    // Documentazione: https://upstash.com/docs/redis/features/restapi
    const body = JSON.stringify([['SET', key, value]]);
    const res  = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('[beds24-token] Redis SET HTTP error:', res.status, text.slice(0, 100));
    } else {
      console.log('[beds24-token] ✅ Redis SET ok:', key.split(':')[1]);
    }
  } catch (e) {
    console.warn('[beds24-token] Redis SET exception:', e);
  }
}

/** Carica lo stato completo da Redis (token + expiresAt + refreshToken) */
async function redisGetState(): Promise<TokenState | null> {
  const raw = await redisGet(REDIS_STATE_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as TokenState;
    if (s.token && s.refreshToken && s.expiresAt) return s;
  } catch {}
  return null;
}

/** Salva lo stato completo su Redis (e il solo refreshToken per compatibilità) */
async function redisSetState(s: TokenState): Promise<void> {
  await redisSet(REDIS_STATE_KEY, JSON.stringify(s));
  await redisSet(REDIS_RT_KEY,    s.refreshToken);
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
  const TTL = 5 * 60 * 1000; // 5 min di margine prima della scadenza

  // 1. Cache in memoria (più veloce, zero rete)
  if (state && now < state.expiresAt - TTL) {
    return state.token;
  }

  // 2. Cache su Redis — stato completo (condiviso tra istanze Vercel)
  //    ✅ Questa è la chiave: se un'istanza ha già rinnovato il token,
  //       tutte le altre lo trovano qui senza ri-chiamare Beds24
  const redisState = await redisGetState();
  if (redisState && now < redisState.expiresAt - TTL) {
    state = redisState;
    console.log('[beds24-token] ✅ Token da Redis (stato completo). Scade tra', Math.round((redisState.expiresAt - now) / 60000), 'min');
    return state.token;
  }

  // 3. Cache su disco (solo locale — Vercel non persiste il filesystem)
  const disk = loadFromDisk();
  if (disk && now < disk.expiresAt - TTL) {
    state = disk;
    console.log('[beds24-token] Token da disco locale');
    return state.token;
  }

  // 4. Determina refresh token: Redis → disco → .env.local
  let refreshToken: string | null = null;

  if (redisState?.refreshToken) {
    refreshToken = redisState.refreshToken;
    console.log('[beds24-token] RefreshToken da Redis');
  } else if (disk?.refreshToken) {
    refreshToken = disk.refreshToken;
    console.log('[beds24-token] RefreshToken da disco');
  } else {
    refreshToken = process.env.BEDS24_REFRESH_TOKEN ?? null;
    console.log('[beds24-token] RefreshToken da .env');
  }

  // Fallback estremo: prova a leggere il solo refreshToken (chiave legacy)
  if (!refreshToken) {
    refreshToken = await redisGet(REDIS_RT_KEY);
    if (refreshToken) console.log('[beds24-token] RefreshToken da Redis (chiave legacy)');
  }

  if (!refreshToken) {
    throw new Error('[beds24-token] Nessun refresh token disponibile');
  }

  // 5. Chiama Beds24 per rinnovare l'access token
  console.log('[beds24-token] Rinnovo token di accesso da Beds24...');

  const res = await fetch(`${BASE_URL}/authentication/token`, {
    headers: { refreshToken },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[beds24-token] Auth error:', res.status, body);

    // Se il token da Redis/disco è scaduto o invalido, riprova con .env
    const envToken = process.env.BEDS24_REFRESH_TOKEN;
    if (envToken && refreshToken !== envToken) {
      console.log('[beds24-token] Retry con refreshToken da .env...');
      // Pulisce Redis e disco, poi riprova
      await redisSetState({ token: '', refreshToken: envToken, expiresAt: 0 });
      try { fs.unlinkSync(TOKEN_FILE); } catch {}
      state = null;
      return getToken();
    }

    throw new Error(`[beds24-token] Auth error ${res.status}: ${body}`);
  }

  const data = await res.json();

  // NOTA: in Beds24 API V2 il refreshToken NON ruota — è sempre lo stesso.
  // Usiamo quello ricevuto, ma se Beds24 non lo restituisce, manteniamo quello originale.
  const newRefreshToken = data.refreshToken ?? refreshToken;

  state = {
    token:        data.token,
    refreshToken: newRefreshToken,
    expiresAt:    now + (data.expiresIn ?? 3600) * 1000,
  };

  // 6. Salva lo stato completo su Redis E su disco
  await redisSetState(state);
  saveToDisk(state);

  console.log('[beds24-token] ✅ Token rinnovato. ExpiresIn:', data.expiresIn ?? 3600, 's');

  return state.token;
}
