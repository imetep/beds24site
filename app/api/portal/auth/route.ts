import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL    = 'https://beds24.com/api/v2';
const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

async function redisPipeline(commands: unknown[][]) {
  await fetch(`${REDIS_URL}/pipeline`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(commands),
    cache:   'no-store',
  });
}

// Converte "DD/MM/YYYY" → "YYYY-MM-DD" per confronto con Beds24
function parseArrival(input: string): string | null {
  const match = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

// POST /api/portal/auth
// Body: { bookId, arrival }  (arrival = "DD/MM/YYYY")
// Anti-brute force: max 5 tentativi per bookId in 5 minuti
export async function POST(req: NextRequest) {
  try {
    const { bookId, arrival } = await req.json();

    if (!bookId || !arrival) {
      return NextResponse.json({ error: 'bookId e data di arrivo obbligatori' }, { status: 400 });
    }

    const arrivalISO = parseArrival(arrival);
    if (!arrivalISO) {
      return NextResponse.json({ error: 'Formato data non valido. Usa GG/MM/AAAA.' }, { status: 400 });
    }

    const bruteKey = `portal-brute:${String(bookId).trim()}`;

    // ── Check brute force ────────────────────────────────────────────────────
    const attemptsRaw = await redisGet(bruteKey);
    const attempts    = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;
    if (attempts >= 5) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova tra qualche minuto.' },
        { status: 429 }
      );
    }

    // ── Verifica prenotazione su Beds24 ──────────────────────────────────────
    const token  = await getToken();
    const b24Res = await fetch(`${BASE_URL}/bookings?id=${encodeURIComponent(String(bookId).trim())}`, {
      headers: { token },
      cache:   'no-store',
    });

    if (!b24Res.ok) {
      await redisPipeline([['INCR', bruteKey], ['EXPIRE', bruteKey, 300]]);
      return NextResponse.json(
        { error: 'Prenotazione non trovata o data non corretta' },
        { status: 401 }
      );
    }

    const b24Data    = await b24Res.json();
    const bk         = b24Data?.data?.[0];
    const returnedId = bk?.id ?? bk?.bookId;

    if (!bk || String(returnedId) !== String(bookId).trim()) {
      await redisPipeline([['INCR', bruteKey], ['EXPIRE', bruteKey, 300]]);
      return NextResponse.json(
        { error: 'Prenotazione non trovata o data non corretta' },
        { status: 401 }
      );
    }

    // ── Verifica data di arrivo ───────────────────────────────────────────────
    const arrivalOnFile = (bk.arrival ?? '').trim(); // formato YYYY-MM-DD da Beds24

    if (arrivalISO !== arrivalOnFile) {
      await redisPipeline([['INCR', bruteKey], ['EXPIRE', bruteKey, 300]]);
      return NextResponse.json(
        { error: 'Prenotazione non trovata o data non corretta' },
        { status: 401 }
      );
    }

    // ── Login corretto: crea sessione Redis TTL 24h ──────────────────────────
    const sessionToken = crypto.randomUUID();
    const sessionData  = JSON.stringify({
      bookId:    String(returnedId),
      createdAt: new Date().toISOString(),
    });

    await redisPipeline([
      ['SET', `guest-session:${sessionToken}`, sessionData, 'EX', 86400],
      ['DEL', bruteKey],
    ]);

    const resp = NextResponse.json({ ok: true });
    resp.cookies.set('guest_session', sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   86400,
      path:     '/',
    });
    return resp;

  } catch (err: any) {
    console.error('[portal/auth]', err);
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}

// DELETE /api/portal/auth — logout
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('guest_session')?.value;
  if (token) {
    await redisPipeline([['DEL', `guest-session:${token}`]]);
  }
  const resp = NextResponse.json({ ok: true });
  resp.cookies.delete('guest_session');
  return resp;
}
