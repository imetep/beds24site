/**
 * lib/beds24-token.ts
 *
 * Gestione token di accesso Beds24 API V2.
 *
 * - Il REFRESH TOKEN è fisso in .env.local / Vercel env → non cambia mai
 * - Il TOKEN DI ACCESSO dura 1 ora (expiresIn: 3600)
 * - Viene rinnovato automaticamente quando scade
 * - Niente file su disco → funziona identico in locale e su Vercel
 */

const BASE_URL = 'https://beds24.com/api/v2';

interface AccessToken {
  token: string;
  expiresAt: number; // timestamp ms
}

// Cache in memoria — dura finché il processo Node è vivo
let cached: AccessToken | null = null;

export async function getToken(): Promise<string> {
  const now = Date.now();

  // Usa il token in memoria se ancora valido (con 2 minuti di margine)
  if (cached && now < cached.expiresAt - 2 * 60 * 1000) {
    return cached.token;
  }

  // Legge il Refresh Token dall'env — sempre lo stesso, non cambia mai
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('[beds24-token] BEDS24_REFRESH_TOKEN non configurato in .env.local');
  }

  console.log('[beds24-token] Rinnovo token di accesso...');

  const res = await fetch(`${BASE_URL}/authentication/token`, {
    method: 'GET',
    headers: { refreshToken },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[beds24-token] Auth error ${res.status}: ${body}`);
  }

  const data = await res.json();

  // Salva in memoria
  cached = {
    token: data.token,
    expiresAt: now + (data.expiresIn ?? 3600) * 1000,
  };

  console.log(`[beds24-token] ✅ Token rinnovato. Scade tra ${data.expiresIn ?? 3600}s`);

  return cached.token;
}
