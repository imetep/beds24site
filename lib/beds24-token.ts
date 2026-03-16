/**
 * lib/beds24-token.ts
 *
 * Gestione token Beds24 con persistenza su file .beds24-token
 * Necessario perché:
 * 1. Beds24 ruota il refresh token ad ogni utilizzo
 * 2. Next.js in dev perde la memoria ad ogni hot-reload
 */

import fs from 'fs';
import path from 'path';

const BASE_URL   = 'https://beds24.com/api/v2';
const TOKEN_FILE = path.join(process.cwd(), '.beds24-token');

interface TokenState {
  token:        string;
  refreshToken: string;
  expiresAt:    number;
}

// Cache in memoria per la sessione corrente
let state: TokenState | null = null;

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

export async function getToken(): Promise<string> {
  // 1. Prova cache in memoria
  if (state && Date.now() < state.expiresAt - 5 * 60 * 1000) {
    return state.token;
  }

  // 2. Prova cache su disco (sopravvive ai riavvii di Next.js)
  const disk = loadFromDisk();
  if (disk && Date.now() < disk.expiresAt - 5 * 60 * 1000) {
    state = disk;
    return state.token;
  }

  // 3. Rinnova il token
  // Usa refresh token da disco se disponibile, altrimenti da env
  const refreshToken = disk?.refreshToken ?? process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('BEDS24_REFRESH_TOKEN non configurato');

  console.log('[beds24-token] Rinnovo token con refresh:', refreshToken.slice(0, 15) + '...');

  const res = await fetch(`${BASE_URL}/authentication/token`, {
    headers: { refreshToken },
    cache:   'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[beds24-token] Auth error:', res.status, body);

    // Se il token da disco è fallito, proviamo con quello da .env.local
    if (disk?.refreshToken && disk.refreshToken !== process.env.BEDS24_REFRESH_TOKEN) {
      console.log('[beds24-token] Retry con token da .env.local...');
      // Cancella il file e riprova con env
      try { fs.unlinkSync(TOKEN_FILE); } catch {}
      state = null;
      return getToken();
    }

    throw new Error(`Beds24 auth error: ${res.status}`);
  }

  const data = await res.json();

  state = {
    token:        data.token,
    refreshToken: data.refreshToken ?? refreshToken, // salva il token ruotato
    expiresAt:    Date.now() + (data.expiresIn ?? 86400) * 1000,
  };

  // Salva su disco — sopravvive ai riavvii
  saveToDisk(state);

  console.log('[beds24-token] ✅ Token rinnovato. Nuovo refresh:', state.refreshToken.slice(0, 15) + '...');

  return state.token;
}
