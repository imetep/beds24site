#!/usr/bin/env node
/**
 * TEST OPERATIVO — verifica nuovo token con linked properties
 * node --env-file=.env.local test-beds24-operativo.mjs
 */
import fs from 'fs';

const BASE_URL   = 'https://beds24.com/api/v2';
const TOKEN_FILE = process.cwd() + '/.beds24-token';

// Prima cancella token vecchio da Redis e disco per forzare rinnovo
async function clearOldToken() {
  const url = process.env.KV_REST_API_URL;
  const tok = process.env.KV_REST_API_TOKEN;
  if (url && tok) {
    await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['DEL', 'beds24:tokenState'], ['DEL', 'beds24:refreshToken']]),
    });
    console.log('🗑  Token vecchio rimosso da Redis');
  }
  if (fs.existsSync(TOKEN_FILE)) { fs.unlinkSync(TOKEN_FILE); console.log('🗑  Token vecchio rimosso da disco'); }
}

async function getNewToken() {
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('BEDS24_REFRESH_TOKEN non trovato in .env.local');
  console.log('🔑  Rinnovo token con nuovo refresh token...');
  const r = await fetch(`${BASE_URL}/authentication/token`, { headers: { refreshToken } });
  const d = await r.json();
  if (!d.token) throw new Error('Auth fallita: ' + JSON.stringify(d));
  // Salva su Redis e disco
  const url = process.env.KV_REST_API_URL;
  const tok = process.env.KV_REST_API_TOKEN;
  const state = JSON.stringify({ token: d.token, refreshToken, expiresAt: Date.now() + (d.expiresIn ?? 3600) * 1000 });
  if (url && tok) {
    await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['SET', 'beds24:tokenState', state]]),
    });
  }
  fs.writeFileSync(TOKEN_FILE, state);
  console.log('✅  Nuovo token ottenuto e salvato');
  return d.token;
}

await clearOldToken();
const token = await getNewToken();

// Test 1: GET /properties
console.log('\n📋 GET /properties:');
const rp = await fetch(`${BASE_URL}/properties`, { headers: { token } });
const dp = await rp.json();
(dp.data ?? []).forEach(p => console.log(`  id:${p.id} name:${p.name}`));

// Test 2: GET /bookings senza filtri
console.log('\n📋 GET /bookings (page 1, no filters):');
const rb = await fetch(`${BASE_URL}/bookings?page=1`, { headers: { token } });
const db = await rb.json();
const b = db.data ?? [];
const propIds = [...new Set(b.map(x => x.propertyId))].sort();
console.log(`  count: ${b.length} | propertyId: ${propIds.join(', ')}`);
console.log(`  (attesi tra i propId: 47410 e 48556)`);

// Test 3: GET /accounts
console.log('\n📋 GET /accounts:');
const ra = await fetch(`${BASE_URL}/accounts`, { headers: { token } });
const da = await ra.json();
(da.data ?? []).forEach(a => console.log(`  id:${a.id} username:${a.username}`));

console.log('\n✅ Fine test\n');
