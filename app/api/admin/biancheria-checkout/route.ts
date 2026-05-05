/**
 * /api/admin/biancheria-checkout
 *
 * Variante "check-out oriented" della biancheria: per ogni PARTENZA nel range,
 * trova il PROSSIMO arrivo sulla stessa casa e calcola la biancheria che la
 * pulizia deve preparare al momento del turnover.
 *
 * Decisione 17 opzione 3: la pagina mostra il calcolo della biancheria del
 * prossimo check-in agganciato alla data della partenza precedente, così la
 * pulizia che esce sa cosa lasciare pronto.
 *
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   → items: lista per data partenza con prossimo arrivo + linen.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import {
  getBedConfig,
  calcLinenSetsFromBedStates,
  calcDefaultBedStates,
} from '@/lib/bedConfig';

export const runtime = 'nodejs';
export const maxDuration = 60;

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;
const BASE_URL    = 'https://beds24.com/api/v2';

// Mappa roomId → nome (allineata a /api/admin/biancheria)
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

// ─── Redis pipeline (riusa pattern di /api/admin/biancheria) ────────────────

async function redisPipeline(commands: string[][]): Promise<(string | null)[]> {
  if (commands.length === 0) return [];
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(commands),
    cache:   'no-store',
  });
  if (!res.ok) return commands.map(() => null);
  const results = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return results.map((r: any) => r.result ?? null);
}

// ─── Beds24 fetch ───────────────────────────────────────────────────────────

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

async function fetchAllBookings(token: string, fromDate: string, lookaheadEnd: string): Promise<B24Booking[]> {
  const all: B24Booking[] = [];
  let page = 1;
  while (true) {
    const r = await fetch(`${BASE_URL}/bookings?page=${page}`, {
      headers: { token },
      cache:   'no-store',
    });
    if (!r.ok) throw new Error(`Beds24 ${r.status}`);
    const d = await r.json();
    const rows: B24Booking[] = d.data ?? [];
    // Voglio sia partenze che arrivi nel periodo, quindi filtro solo per status valido
    // e taglio per arrival ≤ lookaheadEnd e departure ≥ fromDate (qualunque overlap)
    all.push(
      ...rows.filter(b =>
        VALID_STATUSES.has(b.status) &&
        b.departure >= fromDate &&
        b.arrival   <= lookaheadEnd
      ),
    );
    const hasNext = d.pages?.nextPageExists === true;
    if (!hasNext) break;
    if (rows.every(b => b.arrival > lookaheadEnd)) break;
    page++;
  }
  return all;
}

// ─── Helper: calcola biancheria per una booking (riusa override Redis) ─────

interface BookingWithLinen {
  bookId:    number;
  roomId:    number;
  roomName:  string;
  arrival:   string;
  departure: string;
  guestName: string;
  numAdult:  number;
  numChild:  number;
  source:    'guest' | 'admin' | 'default';
  hasConfig: boolean;
  linen:     {
    lenzMatrimoniali: number;
    lenzSingoli:      number;
    federe:           number;
    persone:          number;
    culle:            number;
    scendibagno?:     number;
  } | null;
  bedStates: Record<string, BedState>;
  cribs:     number;
}

function buildBookingWithLinen(
  bk:       B24Booking,
  redisRaw: string | null,
): BookingWithLinen {
  let bedStates: Record<string, BedState> = {};
  let cribs  = 0;
  let source: 'guest' | 'admin' | 'default' = 'default';

  if (redisRaw) {
    try {
      const stored = JSON.parse(redisRaw);
      if (stored.bedStates && Object.keys(stored.bedStates).length > 0) {
        const currentNumGuests = bk.numAdult + bk.numChild;
        const cachedNumGuests  = stored.numGuests ?? 0;
        const guestsChanged    = cachedNumGuests > 0 && currentNumGuests !== cachedNumGuests;
        if (!guestsChanged) {
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
    };
  }

  if (source === 'default') {
    bedStates = calcDefaultBedStates(config, bk.numAdult + bk.numChild);
  }

  const linen = calcLinenSetsFromBedStates(bk.roomId, bedStates, cribs);
  // Asciugamani per ospite reale, non per posto letto
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
  };
}

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const default14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const from = sp.get('from') ?? today;
  const to   = sp.get('to')   ?? default14;

  // Per trovare il "prossimo arrivo" dopo la partenza più lontana del range,
  // serve guardare anche oltre 'to'. Aggiungo 90gg di lookahead.
  const lookaheadEnd = new Date(new Date(to).getTime() + 90 * 86400000).toISOString().slice(0, 10);

  try {
    const token = await getToken();
    const allBookings = await fetchAllBookings(token, from, lookaheadEnd);

    // Indice per roomId, ordinato per arrival
    const byRoom = new Map<number, B24Booking[]>();
    for (const bk of allBookings) {
      const arr = byRoom.get(bk.roomId) ?? [];
      arr.push(bk);
      byRoom.set(bk.roomId, arr);
    }
    for (const [, arr] of byRoom) {
      arr.sort((a, b) => a.arrival.localeCompare(b.arrival));
    }

    // Partenze nel range (booking che esce tra from e to)
    const departures = allBookings
      .filter(b => b.departure >= from && b.departure <= to)
      .sort((a, b) => a.departure.localeCompare(b.departure));

    // Per ogni partenza, trova il prossimo arrivo sulla stessa room
    interface CheckoutItem {
      departure:        B24Booking;
      nextArrival:      BookingWithLinen | null;
      gapDays:          number | null;       // giorni tra departure e prossimo arrival
    }

    // Pre-fetch override Redis per le bookings che ci servono (next arrivals)
    const nextArrivalsRaw: Array<{ departure: B24Booking; next: B24Booking | null }> = [];
    for (const dep of departures) {
      const onSameRoom = byRoom.get(dep.roomId) ?? [];
      const next = onSameRoom.find(b => b.arrival >= dep.departure && b.id !== dep.id) ?? null;
      nextArrivalsRaw.push({ departure: dep, next });
    }

    // Carica override Redis solo per i next (non per le departures)
    const nextBookIds = nextArrivalsRaw
      .map(x => x.next?.id)
      .filter((x): x is number => typeof x === 'number');
    const uniqIds = Array.from(new Set(nextBookIds));
    const redisResults = await redisPipeline(
      uniqIds.map(id => ['GET', `beds:v6:${id}`]),
    );
    const overrideById = new Map<number, string | null>();
    uniqIds.forEach((id, i) => overrideById.set(id, redisResults[i]));

    const items: CheckoutItem[] = nextArrivalsRaw.map(({ departure, next }) => {
      let nextArrival: BookingWithLinen | null = null;
      let gapDays: number | null = null;

      if (next) {
        const raw = overrideById.get(next.id) ?? null;
        nextArrival = buildBookingWithLinen(next, raw);
        gapDays = Math.round(
          (new Date(next.arrival).getTime() - new Date(departure.departure).getTime()) / 86400000,
        );
      }

      return { departure, nextArrival, gapDays };
    });

    // Totali aggregati su SOLO le partenze che hanno un prossimo arrivo (= biancheria da preparare)
    const withLinen = items.filter(i => i.nextArrival?.linen);
    const totals = {
      lenzMatrimoniali: withLinen.reduce((s, i) => s + (i.nextArrival!.linen!.lenzMatrimoniali ?? 0), 0),
      lenzSingoli:      withLinen.reduce((s, i) => s + (i.nextArrival!.linen!.lenzSingoli      ?? 0), 0),
      federe:           withLinen.reduce((s, i) => s + (i.nextArrival!.linen!.federe           ?? 0), 0),
      persone:          withLinen.reduce((s, i) => s + (i.nextArrival!.linen!.persone          ?? 0), 0),
      culle:            withLinen.reduce((s, i) => s + (i.nextArrival!.linen!.culle            ?? 0), 0),
    };

    return NextResponse.json({
      items: items.map(i => ({
        departure: {
          bookId:    i.departure.id,
          roomId:    i.departure.roomId,
          roomName:  ROOM_NAMES[i.departure.roomId] ?? `Room ${i.departure.roomId}`,
          arrival:   i.departure.arrival,
          departure: i.departure.departure,
          guestName: `${i.departure.firstName} ${i.departure.lastName}`.trim(),
          numAdult:  i.departure.numAdult,
          numChild:  i.departure.numChild,
        },
        nextArrival: i.nextArrival,
        gapDays:     i.gapDays,
      })),
      totals,
      from,
      to,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
