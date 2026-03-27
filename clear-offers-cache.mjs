/**
 * clear-offers-cache.mjs
 * Cancella tutte le chiavi "offers:*" da Upstash Redis.
 * Esegui con: node clear-offers-cache.mjs
 */

const REDIS_URL   = 'https://beloved-duckling-79542.upstash.io';
const REDIS_TOKEN = 'gQAAAAAAATa2AAIncDE4MDA3NWQyMWYyZGU0NTEwOTA0Y2M2ZDUzMGFmM2E4NHAxNzk1NDI';

const headers = { Authorization: `Bearer ${REDIS_TOKEN}` };

async function run() {
  console.log('🔍 Scansione chiavi offers:* su Redis...');

  // SCAN per trovare tutte le chiavi offers:*
  const scanRes = await fetch(
    `${REDIS_URL}/scan/0/match/${encodeURIComponent('offers:*')}/count/100`,
    { headers }
  );
  const scanData = await scanRes.json();
  const keys = scanData.result?.[1] ?? [];

  if (keys.length === 0) {
    console.log('✅ Nessuna chiave offers:* trovata su Redis. Cache già pulita.');
    return;
  }

  console.log(`🗑️  Trovate ${keys.length} chiavi da eliminare:`);
  keys.forEach(k => console.log('   -', k));

  // Elimina ogni chiave
  for (const key of keys) {
    const delRes = await fetch(
      `${REDIS_URL}/del/${encodeURIComponent(key)}`,
      { method: 'POST', headers }
    );
    const delData = await delRes.json();
    const ok = delData.result === 1;
    console.log(`   ${ok ? '✅' : '❌'} DEL ${key}`);
  }

  console.log('\n✅ Cache offers svuotata. La prossima richiesta andrà live su Beds24.');
}

run().catch(err => {
  console.error('❌ Errore:', err.message);
  process.exit(1);
});
