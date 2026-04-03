import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

// GET /api/checkin/status?bookId=X
// Pubblica — usata dalla pagina ospite per vedere status + thread
export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json({ error: 'bookId mancante' }, { status: 400 });
  }

  const raw = await redisGet(`checkin:${bookId}`);
  if (!raw) {
    return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
  }

  const data = JSON.parse(raw);

  // Restituisce solo i campi necessari all'ospite — non espone i dati sensibili
  return NextResponse.json({
    ok: true,
    bookId:    data.bookId,
    roomName:  data.roomName,
    checkIn:   data.checkIn,
    checkOut:  data.checkOut,
    status:    data.status,
    rejectReason: data.rejectReason ?? null,
    guestName: `${data.capogruppo?.firstName ?? ''} ${data.capogruppo?.lastName ?? ''}`.trim(),
    messages:  (data.messages ?? []).map((m: any) => ({
      from: m.from,
      text: m.text,
      time: m.time,
    })),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt ?? null,
  });
}
