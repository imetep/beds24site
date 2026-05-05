// scripts/seed-strutture.mjs
//
// Seed dell'anagrafica Strutture (lib/case-kv.ts) a partire dalla mappa
// hardcoded ROOMS già esistente in app/api/admin/operativo/route.ts.
//
// Uso: node scripts/seed-strutture.mjs
// Idempotente: se una casa con beds24RoomId esiste già, skippa.
//
// Legge KV_REST_API_URL e KV_REST_API_TOKEN da .env.local.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';

// ─── Carica .env.local ──────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envText = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) {
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1]] = v;
  }
}

const url = env.KV_REST_API_URL;
const token = env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN mancanti in .env.local');
  process.exit(1);
}
const redis = new Redis({ url, token });

// ─── Mappa ROOMS (copiata da app/api/admin/operativo/route.ts) ──────────────

const ROOMS = {
  107773: { name: 'Stark',          property: 'Livingapple',         mqInterni: 160, mqEsterni: 30 },
  107799: { name: 'Idared',         property: 'Livingapple',         mqInterni: 80,  mqEsterni: 9  },
  107846: { name: 'Delicious',      property: 'Livingapple',         mqInterni: 80,  mqEsterni: 9  },
  107847: { name: 'Fuji',           property: 'Livingapple',         mqInterni: 110, mqEsterni: 18 },
  107848: { name: 'PinkLady',       property: 'Livingapple',         mqInterni: 160, mqEsterni: 30 },
  107849: { name: 'Renetta',        property: 'Livingapple',         mqInterni: 140, mqEsterni: 9  },
  107851: { name: 'Smith',          property: 'Livingapple',         mqInterni: 110, mqEsterni: 18 },
  198030: { name: 'Annurca',        property: 'Livingapple',         mqInterni: 40,  mqEsterni: 0  },
  432215: { name: 'Kissabel',       property: 'Livingapple',         mqInterni: 240, mqEsterni: 12 },
  507514: { name: 'Sergente',       property: 'Livingapple',         mqInterni: 240, mqEsterni: 12 },
  108607: { name: 'Gala',           property: 'Livingapple beach',   mqInterni: 68,  mqEsterni: 0  },
  108612: { name: 'Rubens',         property: 'Livingapple beach',   mqInterni: 68,  mqEsterni: 0  },
  108613: { name: 'Braeburn',       property: 'Livingapple beach',   mqInterni: 75,  mqEsterni: 0  },
  109685: { name: 'Cherry',         property: 'Cherry House',        mqInterni: 40,  mqEsterni: 12 },
  113528: { name: 'Mulberry',       property: 'Cherry House',        mqInterni: 65,  mqEsterni: 4  },
  112982: { name: 'Ciclamino',      property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 10 },
  113880: { name: 'Fiordaliso',     property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 6  },
  113881: { name: 'Lavanda',        property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 8  },
  113882: { name: 'Narciso',        property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 10 },
  113883: { name: 'Orchidea',       property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 8  },
  113884: { name: 'Primula',        property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 10 },
  113885: { name: 'Mughetto',       property: 'Il Mare In Giardino', mqInterni: 25,  mqEsterni: 80 },
  113887: { name: 'Viola',          property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 10 },
  179295: { name: 'Peonia',         property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 0  },
  411401: { name: 'Villa Patrizia', property: 'Villa Patrizia',      mqInterni: 140, mqEsterni: 30 },
};

// ─── Seed ────────────────────────────────────────────────────────────────────

const CASA_PREFIX   = 'casa:';
const CASA_BY_ROOM  = 'casa-by-room:';
const CASE_LIST_KEY = 'case:list';

let creati = 0, esistenti = 0;
const created = [];

for (const [roomIdStr, room] of Object.entries(ROOMS)) {
  const roomId = Number(roomIdStr);

  // Idempotenza
  const existingId = await redis.get(`${CASA_BY_ROOM}${roomId}`);
  if (existingId) {
    esistenti++;
    console.log(`SKIP  ${room.name.padEnd(18)} (room ${roomId}) già presente: ${existingId}`);
    continue;
  }

  const id = randomUUID();
  const now = Date.now();

  const dotazioni = [
    { chiave: 'Proprietà',    valore: room.property },
    { chiave: 'Mq interni',   valore: String(room.mqInterni) },
    { chiave: 'Mq esterni',   valore: String(room.mqEsterni) },
  ];

  const casa = {
    id,
    nome:               room.name,
    beds24RoomId:       roomId,
    note:               `Proprietà: ${room.property}`,
    fotoUrls:           [],
    dotazioni,
    vociNonApplicabili: [],
    archiviata:         false,
    createdAt:          now,
    updatedAt:          now,
  };

  await redis.set(`${CASA_PREFIX}${id}`, JSON.stringify(casa));
  await redis.set(`${CASA_BY_ROOM}${roomId}`, id);
  await redis.sadd(CASE_LIST_KEY, id);

  creati++;
  created.push(`${room.name} (${roomId})`);
  console.log(`CREATA ${room.name.padEnd(18)} (room ${roomId}) → ${id}`);
}

console.log('\n──────────────────────────────────────────');
console.log(`Totale: ${creati} create, ${esistenti} esistenti, ${Object.keys(ROOMS).length} processate.`);
if (created.length > 0) {
  console.log('\nCase create:');
  for (const c of created) console.log('  • ' + c);
}
