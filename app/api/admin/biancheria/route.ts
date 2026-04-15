import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { getBedConfig, calcLinenSetsFromBedStates, calcDefaultBedStates, ApartmentBedConfig } from '@/lib/bedConfig';

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;
const BASE_URL    = 'https://beds24.com/api/v2';
const REDIS_TTL   = 60 * 60 * 24 * 60; // 60 giorni

// Mappa roomId → nome (include tutte le strutture, con e senza bedConfig)
const ROOM_NAMES: Record<number, string> = {
  107773: 'Stark',          107799: 'Idared',
  107846: 'Delicious',      107847: 'Fuji',
  107848: 'PinkLady',       107849: 'Renetta',
  107851: 'Smith',          198030: 'Annurca',
  432215: 'Kissabel',       507514: 'Sergente',
  108607: 'Gala',           108612: 'Rubens',
  108613: 'Braeburn',       109685: 'Cherry',
  113528: 'Mulberry',       112982: 'Ciclamino',
  113880: 'Fiordaliso',     113881: 'Lavanda',
  113882: 'Narciso',        113883: 'Orchidea',
  113884: 'Primula',        113885: 'Mughetto',
  113887: 'Viola',          179295: 'Peonia',
  411401: 'Villa Patrizia',
};

type BedState = 'off' | 'A' | 'B';

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session');
  return !!cookie && cookie.value === process.env.ADMIN_PASSWORD;
}

// ── Redis ─────────────────────────────────────────────────────────────────────

async function redisPipeline(commands: string[][]): Promise<(string | null)[]> {
  if (commands.length === 0) return [];
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  });
  if (!res.ok) return commands.map(() => null);
  const results = await res.json();
  return results.map((r: any) => r.result ?? null);
}

async function redisSet(key: string, value: string, ttl: number): Promise<void> {
  await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['SET', key, value, 'EX', ttl]]),
  });
}

// ── Default bedStates ─────────────────────────────────────────────────────────
// Delegato a calcDefaultBedStates in bedConfig.ts (guest-count aware)

// ── Beds24 fetch ──────────────────────────────────────────────────────────────

interface B24Booking {
  id:        number;
  roomId:    number;
  status:    string;
  arrival:   string;
  departure: string;
  numAdult:  number;
  numChild:  number;
  firstName: string;
  lastName:  string;
}

const VALID_STATUSES = new Set(['new', 'confirmed']);

async function fetchBookingsInRange(
  token: string,
  from: string,
  to: string,
): Promise<B24Booking[]> {
  const all: B24Booking[] = [];
  let page = 1;
  while (true) {
    const r = await fetch(`${BASE_URL}/bookings?page=${page}`, {
      headers: { token },
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`Beds24 ${r.status}`);
    const d = await r.json();
    const rows: B24Booking[] = d.data ?? [];
    all.push(
      ...rows.filter(b =>
        b.arrival >= from &&
        b.arrival <= to &&
        VALID_STATUSES.has(b.status),
      ),
    );
    const hasNext = d.pages?.nextPageExists === true;
    if (!hasNext) break;
    // Se tutti i record della pagina hanno arrival > to, inutile continuare
    if (rows.every(b => b.arrival > to)) break;
    page++;
  }
  return all;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const today      = new Date().toISOString().slice(0, 10);
  const default14  = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const from = searchParams.get('from') ?? today;
  const to   = searchParams.get('to')   ?? default14;

  try {
    const token    = await getToken();
    const bookings = await fetchBookingsInRange(token, from, to);
    bookings.sort((a, b) => a.arrival.localeCompare(b.arrival));

    // Batch-read Redis per tutte le prenotazioni
    const keys = bookings.map(b => `beds:v6:${b.id}`);
    const redisResults = await redisPipeline(keys.map(k => ['GET', k]));

    const items = bookings.map((bk, i) => {
      const raw = redisResults[i];
      let bedStates: Record<string, BedState> = {};
      let cribs  = 0;
      let source: 'guest' | 'admin' | 'default' = 'default';

      if (raw) {
        try {
          const stored = JSON.parse(raw);
          if (stored.bedStates && Object.keys(stored.bedStates).length > 0) {
            const currentNumGuests = bk.numAdult + bk.numChild;
            const cachedNumGuests  = stored.numGuests ?? 0;
            const guestsChanged    = cachedNumGuests > 0 && currentNumGuests !== cachedNumGuests;

            if (guestsChanged) {
              // Numero ospiti cambiato → ricalcola default, non usare il salvato
              console.log(`[biancheria/GET] numGuests cambiato: ${cachedNumGuests} → ${currentNumGuests} (bookId=${bk.id})`);
              source = 'default';
            } else {
              bedStates = stored.bedStates;
              cribs     = stored.cribs ?? 0;
              source    = stored.adminOverride ? 'admin' : 'guest';
            }
          }
        } catch { /* JSON malformato → default */ }
      }

      const config = getBedConfig(bk.roomId);

      if (!config) {
        return {
          bookId:    bk.id,
          roomId:    bk.roomId,
          roomName:  ROOM_NAMES[bk.roomId] ?? `Room ${bk.roomId}`,
          arrival:   bk.arrival,
          departure: bk.departure,
          guestName: `${bk.firstName} ${bk.lastName}`.trim(),
          numAdult:  bk.numAdult,
          numChild:  bk.numChild,
          source,
          hasConfig: false,
          linen:     null,
          bedStates: {},
          cribs:     0,
          config:    null,
        };
      }

      if (source === 'default') {
        bedStates = calcDefaultBedStates(config, bk.numAdult + bk.numChild);
      }

      const linen = calcLinenSetsFromBedStates(bk.roomId, bedStates, cribs);
      // Gli asciugamani vanno per ospite reale, non per posto letto
      linen.persone = bk.numAdult + bk.numChild;

      return {
        bookId:    bk.id,
        roomId:    bk.roomId,
        roomName:  config.name,
        arrival:   bk.arrival,
        departure: bk.departure,
        guestName: `${bk.firstName} ${bk.lastName}`.trim(),
        numAdult:  bk.numAdult,
        numChild:  bk.numChild,
        source,
        hasConfig: true,
        linen,
        bedStates,
        cribs,
        config,
      };
    });

    // Totali aggregati
    const withConfig = items.filter(i => i.hasConfig && i.linen);
    const totals = {
      lenzMatrimoniali: withConfig.reduce((s, i) => s + (i.linen?.lenzMatrimoniali ?? 0), 0),
      lenzSingoli:      withConfig.reduce((s, i) => s + (i.linen?.lenzSingoli      ?? 0), 0),
      federe:           withConfig.reduce((s, i) => s + (i.linen?.federe           ?? 0), 0),
      persone:          withConfig.reduce((s, i) => s + (i.linen?.persone          ?? 0), 0),
      culle:            withConfig.reduce((s, i) => s + (i.linen?.culle            ?? 0), 0),
    };

    return NextResponse.json({ items, totals, from, to });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST (override admin) ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  let body: { bookId: number; roomId: number; bedStates: Record<string, BedState>; cribs: number; numGuests: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body non valido' }, { status: 400 }); }

  const { bookId, roomId, bedStates, cribs } = body;
  const redisKey = `beds:v6:${bookId}`;
  const cribsClamped = Math.min(Math.max(Math.round(cribs ?? 0), 0), 2);

  await redisSet(
    redisKey,
    JSON.stringify({
      roomId,
      numGuests:     body.numGuests ?? 0,
      bedStates,
      cribs:         cribsClamped,
      savedAt:       new Date().toISOString(),
      adminOverride: true,
    }),
    REDIS_TTL,
  );

  const config = getBedConfig(roomId);
  let linen = config ? calcLinenSetsFromBedStates(roomId, bedStates, cribsClamped) : null;
  // Nota: persone (asciugamani) non viene sovrascritta qui perché il POST
  // non ha accesso a numAdult/numChild — il frontend aggiorna il display
  // dalla risposta, ma per asciugamani usa già il valore corretto nel totale.

  return NextResponse.json({ ok: true, linen });
}
