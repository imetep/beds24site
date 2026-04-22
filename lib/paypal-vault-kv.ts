/**
 * lib/paypal-vault-kv.ts
 *
 * Storage Upstash KV dei PayPal vault token creati per:
 *  - Rimborsabile (50% residuo da addebitare a checkIn − 48h)
 *  - Flessibile    (100% da addebitare a checkIn − 24h, cioè alla
 *                    scadenza della cancellazione gratuita)
 *
 * Schema chiavi:
 *  - paypal:vault:<bookingId>  JSON con VaultRecord (vedi sotto)
 *  - paypal:vault-due          ZSET indicizzato per chargeAt (epoch ms)
 *                              → usato dal cron /api/paypal-vault-process
 *                              per scandire efficientemente i vault scaduti.
 *  - paypal:vault-lock         SET NX EX 600 durante l'esecuzione del cron
 *                              per evitare sovrapposizioni.
 *
 * Usa REST Upstash (non SDK) coerentemente con lib/beds24-token.ts e
 * app/api/property-config/route.ts.
 */

export type VaultPolicy = 'flex' | 'rimborsabile-residuo';
export type VaultStatus =
  | 'pending'      // in attesa del cron
  | 'processing'   // cron ha preso in carico
  | 'captured'     // addebitato con successo
  | 'failed'       // 3 retry esauriti, richiede intervento admin
  | 'cancelled';   // booking cancellato prima della scadenza

export interface VaultRecord {
  bookingId:      number;
  vaultId:        string;            // PayPal payment-token (permanent)
  customerId:     string | null;     // PayPal customer id (opzionale)
  amount:         number;            // € da addebitare a chargeAt
  currency:       string;            // 'EUR'
  policy:         VaultPolicy;
  createdAt:      string;            // ISO8601 UTC
  chargeAt:       string;            // ISO8601 UTC — quando cron addebita
  status:         VaultStatus;
  retryCount:     number;
  lastAttemptAt:  string | null;
  lastError:      string | null;
  captureId:      string | null;     // PayPal capture id al successo
  capturedAmount: number | null;
}

const KV_KEY     = (bookingId: number | string) => `paypal:vault:${bookingId}`;
const KV_DUE_SET = 'paypal:vault-due';
const KV_LOCK    = 'paypal:vault-lock';

// ─── Helpers REST Upstash ────────────────────────────────────────────────────

function kvCreds(): { url: string; token: string } | null {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function kvGet(key: string): Promise<string | null> {
  const c = kvCreds();
  if (!c) return null;
  try {
    const res = await fetch(`${c.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${c.token}` },
      cache:   'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ?? null;
  } catch (e) {
    console.warn('[paypal-vault-kv] GET error:', e);
    return null;
  }
}

async function kvPipeline(commands: (string | number)[][]): Promise<any[] | null> {
  const c = kvCreds();
  if (!c) return null;
  try {
    const res = await fetch(`${c.url}/pipeline`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(commands),
      cache:   'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('[paypal-vault-kv] pipeline HTTP error:', res.status, text.slice(0, 200));
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn('[paypal-vault-kv] pipeline exception:', e);
    return null;
  }
}

// ─── API pubblica ────────────────────────────────────────────────────────────

/**
 * Crea o sovrascrive un record vault. Inserisce anche in ZSET se status=pending,
 * rimuove dal ZSET altrimenti (captured/failed/cancelled).
 */
export async function setVault(rec: VaultRecord): Promise<void> {
  const json = JSON.stringify(rec);
  const key  = KV_KEY(rec.bookingId);
  const score = Date.parse(rec.chargeAt);

  const cmds: (string | number)[][] = [
    ['SET', key, json],
  ];
  if (rec.status === 'pending') {
    cmds.push(['ZADD', KV_DUE_SET, score, String(rec.bookingId)]);
  } else {
    cmds.push(['ZREM', KV_DUE_SET, String(rec.bookingId)]);
  }
  await kvPipeline(cmds);
}

export async function getVault(bookingId: number): Promise<VaultRecord | null> {
  const raw = await kvGet(KV_KEY(bookingId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VaultRecord;
  } catch {
    return null;
  }
}

/**
 * Aggiorna parzialmente un record vault. Rilegge dallo store, applica patch,
 * riscrive. Aggiorna anche lo ZSET se cambia status.
 */
export async function updateVault(
  bookingId: number,
  patch: Partial<VaultRecord>,
): Promise<VaultRecord | null> {
  const current = await getVault(bookingId);
  if (!current) return null;
  const next: VaultRecord = { ...current, ...patch };
  await setVault(next);
  return next;
}

/**
 * Elimina un vault record e rimuove dallo ZSET.
 * Chiamato quando il booking viene cancellato prima della scadenza.
 */
export async function deleteVault(bookingId: number): Promise<void> {
  await kvPipeline([
    ['DEL', KV_KEY(bookingId)],
    ['ZREM', KV_DUE_SET, String(rec(bookingId))],
  ]);
}

function rec(bookingId: number): string { return String(bookingId); }

/**
 * Restituisce i bookingId con chargeAt <= nowEpochMs (da addebitare ora).
 * Il cron li scarica uno per uno via getVault() e li processa.
 */
export async function listDueBookingIds(nowEpochMs: number): Promise<number[]> {
  const c = kvCreds();
  if (!c) return [];
  try {
    // ZRANGEBYSCORE key 0 now  (min=0, max=now)
    const res = await fetch(
      `${c.url}/zrangebyscore/${encodeURIComponent(KV_DUE_SET)}/0/${nowEpochMs}`,
      { headers: { Authorization: `Bearer ${c.token}` }, cache: 'no-store' },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const arr  = Array.isArray(data.result) ? data.result : [];
    return arr.map((x: string) => Number(x)).filter((n: number) => Number.isFinite(n));
  } catch (e) {
    console.warn('[paypal-vault-kv] listDue error:', e);
    return [];
  }
}

/**
 * Acquisisce il lock del cron. Ritorna true se acquisito, false se già locked.
 * TTL 10 min (abbondante per processare anche 100+ vault).
 */
export async function acquireLock(ttlSeconds = 600): Promise<boolean> {
  const c = kvCreds();
  if (!c) return true; // niente KV in dev locale → no lock = ok
  try {
    // SET key value NX EX ttl
    const res = await fetch(`${c.url}/set/${encodeURIComponent(KV_LOCK)}/${Date.now()}?NX=true&EX=${ttlSeconds}`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${c.token}` },
      cache:   'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.result === 'OK';
  } catch {
    return false;
  }
}

export async function releaseLock(): Promise<void> {
  const c = kvCreds();
  if (!c) return;
  try {
    await fetch(`${c.url}/del/${encodeURIComponent(KV_LOCK)}`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${c.token}` },
      cache:   'no-store',
    });
  } catch {}
}
