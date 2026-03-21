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
  expiresAt: number;
}

// Cache in memoria
let cached: AccessToken | null = null;

export async function getToken(): Promise<string> {
  const now = Date.now();

  // Usa il token in memoria se ancora valido (con 2 minuti di margine)
  if (cached && now < cached.expiresAt - 2 * 60 * 1000) {
    return cached.token;
  }

  // Legge il Refresh Token dall'env
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('[beds24-token] BEDS24_REFRESH_TOKEN non configurato');
  }

  // DEBUG — prime 6 lettere del token usato (rimuovere dopo il fix)
  console.log('[beds24-token] Usando refreshToken che inizia con:', refreshToken.slice(0, 6));
  console.log('[beds24-token] Lunghezza refreshToken:', refreshToken.length);

  const res = await fetch(`${BASE_URL}/authentication/token`, {
    method: 'GET',
    headers: { refreshToken },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[beds24-token] Auth error:', res.status, body);
    throw new Error(`[beds24-token] Auth error ${res.status}: ${body}`);
  }

  const data = await res.json();

  cached = {
    token: data.token,
    expiresAt: now + (data.expiresIn ?? 3600) * 1000,
  };

  console.log(`[beds24-token] ✅ Token rinnovato. Scade tra ${data.expiresIn ?? 3600}s`);

  return cached.token;
}
