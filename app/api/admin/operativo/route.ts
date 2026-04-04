import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

// ── Mappa roomId → caratteristiche (da caratteristiche_pulizie.xlsx) ──────────
const ROOMS: Record<number, { name: string; property: string; mqInterni: number; mqEsterni: number }> = {
  // Livingapple — propId 46487
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
  // Livingapple beach — propId 46871
  108607: { name: 'Gala',           property: 'Livingapple beach',   mqInterni: 68,  mqEsterni: 0  },
  108612: { name: 'Rubens',         property: 'Livingapple beach',   mqInterni: 68,  mqEsterni: 0  },
  108613: { name: 'Braeburn',       property: 'Livingapple beach',   mqInterni: 75,  mqEsterni: 0  },
  // Cherry House — propId 47410
  109685: { name: 'Cherry',         property: 'Cherry House',        mqInterni: 40,  mqEsterni: 12 },
  113528: { name: 'Mulberry',       property: 'Cherry House',        mqInterni: 65,  mqEsterni: 4  },
  // Il Mare In Giardino — propId 48556
  112982: { name: 'Ciclamino',      property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 10 },
  113880: { name: 'Fiordaliso',     property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 6  },
  113881: { name: 'Lavanda',        property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 8  },
  113882: { name: 'Narciso',        property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 10 },
  113883: { name: 'Orchidea',       property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 8  },
  113884: { name: 'Primula',        property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 10 },
  113885: { name: 'Mughetto',       property: 'Il Mare In Giardino', mqInterni: 25,  mqEsterni: 80 },
  113887: { name: 'Viola',          property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 10 },
  179295: { name: 'Peonia',         property: 'Il Mare In Giardino', mqInterni: 70,  mqEsterni: 0  },
  // Villa Patrizia — propId 190754
  411401: { name: 'Villa Patrizia', property: 'Villa Patrizia',      mqInterni: 140, mqEsterni: 30 },
};

const MIN_NOTTI = 7;
const BASE_URL  = 'https://beds24.com/api/v2';

// Solo questi status sono prenotazioni reali ai fini operativi
const VALID_STATUSES = new Set(['new', 'confirmed']);

// ── Auth ──────────────────────────────────────────────────────────────────────
function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session');
  return !!cookie && cookie.value === process.env.ADMIN_PASSWORD;
}

// ── Tipi ──────────────────────────────────────────────────────────────────────
interface B24Booking {
  id:         number;
  roomId:     number;
  propertyId: number;
  status:     string;
  arrival:    string;
  departure:  string;
  numAdult:   number;
  numChild:   number;
  firstName:  string;
  lastName:   string;
}

// ── Fetch con paginazione ─────────────────────────────────────────────────────
async function fetchAllBookings(token: string, today: string, maxDateStr: string): Promise<B24Booking[]> {
  const all: B24Booking[] = [];
  let page = 1;

  while (true) {
    const r = await fetch(`${BASE_URL}/bookings?page=${page}`, {
      headers: { token },
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`Beds24 ${r.status}: ${await r.text()}`);
    const d = await r.json();
    const rows: B24Booking[] = d.data ?? [];

    // Filtra: partenza futura nei prossimi 12 mesi + escludi status non operativi
    const filtered = rows.filter(b =>
      b.departure >= today &&
      b.arrival <= maxDateStr &&
      VALID_STATUSES.has(b.status)
    );
    all.push(...filtered);

    const hasNext = d.pages?.nextPageExists === true;
    // Stop se non c'è pagina successiva o tutte le prenotazioni sono nel passato
    if (!hasNext || rows.every(b => b.departure < today)) break;
    page++;
  }

  return all;
}

// ── Buchi (<7 notti libere tra prenotazioni) ──────────────────────────────────
function calcolaBuchi(bookings: B24Booking[], today: string) {
  const byRoom: Record<number, B24Booking[]> = {};
  for (const b of bookings) {
    if (!byRoom[b.roomId]) byRoom[b.roomId] = [];
    byRoom[b.roomId].push(b);
  }

  const buchi: object[] = [];

  for (const [roomIdStr, prenotazioni] of Object.entries(byRoom)) {
    const roomId = Number(roomIdStr);
    const sorted = [...prenotazioni].sort((a, b) => a.arrival.localeCompare(b.arrival));

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      if (next.arrival < today) continue;
      const gap = Math.round(
        (new Date(next.arrival).getTime() - new Date(curr.departure).getTime()) / 86400000
      );
      if (gap > 0 && gap < MIN_NOTTI) {
        const room = ROOMS[roomId];
        buchi.push({
          roomId,
          roomName:  room?.name     ?? `Room ${roomId}`,
          property:  room?.property ?? 'Sconosciuta',
          liberaDal: curr.departure,
          liberaAl:  next.arrival,
          notti:     gap,
        });
      }
    }
  }

  return buchi.sort((a: any, b: any) => a.liberaDal.localeCompare(b.liberaDal));
}

// ── Pulizie (giorni con partenze) ─────────────────────────────────────────────
function calcolaPulizie(bookings: B24Booking[], today: string) {
  const byDate: Record<string, { departures: B24Booking[]; arrivals: B24Booking[] }> = {};

  for (const b of bookings) {
    if (b.departure >= today) {
      if (!byDate[b.departure]) byDate[b.departure] = { departures: [], arrivals: [] };
      byDate[b.departure].departures.push(b);
    }
    if (b.arrival >= today) {
      if (!byDate[b.arrival]) byDate[b.arrival] = { departures: [], arrivals: [] };
      byDate[b.arrival].arrivals.push(b);
    }
  }

  const pulizie: object[] = [];

  for (const [date, { departures, arrivals }] of Object.entries(byDate)) {
    if (departures.length === 0) continue;

    const mqTotale = departures.reduce((sum, b) => {
      const r = ROOMS[b.roomId];
      return sum + (r ? r.mqInterni + r.mqEsterni : 0);
    }, 0);

    let score = 0;
    if (mqTotale >= 400)             score += 3;
    else if (mqTotale >= 250)        score += 2;
    else if (mqTotale >= 100)        score += 1;
    if (departures.length >= 3)      score += 2;
    else if (departures.length >= 2) score += 1;
    if (arrivals.length >= 3)        score += 1;

    const rischio =
      score >= 4 ? 'CRITICO' :
      score >= 3 ? 'ALTO'    :
      score >= 1 ? 'MEDIO'   : 'BASSO';

    pulizie.push({
      date,
      departures: departures.map(b => ({
        roomId:   b.roomId,
        roomName: ROOMS[b.roomId]?.name     ?? `Room ${b.roomId}`,
        property: ROOMS[b.roomId]?.property ?? 'Sconosciuta',
        mq:       (ROOMS[b.roomId]?.mqInterni ?? 0) + (ROOMS[b.roomId]?.mqEsterni ?? 0),
      })),
      arrivals: arrivals.map(b => ({
        roomId:   b.roomId,
        roomName: ROOMS[b.roomId]?.name     ?? `Room ${b.roomId}`,
        property: ROOMS[b.roomId]?.property ?? 'Sconosciuta',
      })),
      mqTotale,
      rischio,
    });
  }

  return pulizie.sort((a: any, b: any) => a.date.localeCompare(b.date));
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const token = await getToken();

    const today = new Date().toISOString().slice(0, 10);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 12);
    const maxDateStr = maxDate.toISOString().slice(0, 10);

    const bookings = await fetchAllBookings(token, today, maxDateStr);

    return NextResponse.json({
      buchi:              calcolaBuchi(bookings, today),
      pulizie:            calcolaPulizie(bookings, today),
      totalePrenotazioni: bookings.length,
      lastUpdated:        new Date().toISOString(),
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
