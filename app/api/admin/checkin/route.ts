import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

async function redisSet(key: string, value: string) {
  await fetch(`${REDIS_URL}/pipeline`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify([['SET', key, value]]),
    cache:   'no-store',
  });
}

async function redisScan(pattern: string): Promise<string[]> {
  const res = await fetch(`${REDIS_URL}/scan/0/match/${pattern}/count/100`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  // Upstash scan restituisce [cursor, [keys]]
  return data.result?.[1] ?? [];
}

// GET /api/admin/checkin          → lista tutte le richieste
// GET /api/admin/checkin?id=12345 → dettaglio singola
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    const raw = await redisGet(`checkin:${id}`);
    if (!raw) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
    return NextResponse.json({ ok: true, data: JSON.parse(raw) });
  }

  // Lista tutte le chiavi checkin:*
  const keys = await redisScan('checkin:*');
  const items = await Promise.all(
    keys.map(async k => {
      const raw = await redisGet(k);
      if (!raw) return null;
      try {
        const d = JSON.parse(raw);
        return {
          bookId:    d.bookId,
          roomName:  d.roomName,
          checkIn:   d.checkIn,
          checkOut:  d.checkOut,
          guestName: `${d.capogruppo?.lastName} ${d.capogruppo?.firstName}`,
          email:     d.capogruppo?.email,
          status:    d.status,
          createdAt: d.createdAt,
        };
      } catch { return null; }
    })
  );

  const sorted = items
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ ok: true, items: sorted });
}

// POST /api/admin/checkin — approva o rifiuta
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { bookId, action, reason } = await req.json();
  if (!bookId || !['approve', 'reject', 'reset'].includes(action)) {
    return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });
  }

  const raw = await redisGet(`checkin:${bookId}`);
  if (!raw) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

  const data = JSON.parse(raw);

  if (action === 'reset') {
    data.status    = 'PENDING';
    data.updatedAt = new Date().toISOString();
    delete data.rejectReason;
    await redisSet(`checkin:${bookId}`, JSON.stringify(data));
    return NextResponse.json({ ok: true, status: 'PENDING' });
  }
  data.status    = action === 'approve' ? 'APPROVED' : 'REJECTED';
  data.updatedAt = new Date().toISOString();
  if (reason) data.rejectReason = reason;

  await redisSet(`checkin:${bookId}`, JSON.stringify(data));

  // Invia email all'ospite
  await sendStatusEmail(data, action, reason);

  return NextResponse.json({ ok: true, status: data.status });
}

async function sendStatusEmail(data: any, action: string, reason?: string) {
  const resendKey  = process.env.RESEND_API_KEY;
  const guestEmail = data.capogruppo?.email;
  const fromAddress = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
  if (!resendKey || !guestEmail) return;

  const c       = data.capogruppo;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';

  const approvedBody = `
Gentile ${c.firstName} ${c.lastName},

la tua richiesta di self check-in è stata APPROVATA.

Prenotazione: #${data.bookId}
Struttura: ${data.roomName}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}

Al momento del tuo arrivo effettueremo una breve videochiamata di verifica come previsto dalla normativa (art. 109 TULPS).

Per qualsiasi domanda: WhatsApp +39 328 313 1500 o contattolivingapple@gmail.com

LivingApple — Scauri (LT)
${baseUrl}
  `.trim();

  const rejectedBody = `
Gentile ${c.firstName} ${c.lastName},

purtroppo la tua richiesta di self check-in non è stata approvata.

${reason ? `Motivo: ${reason}\n` : ''}
Ti chiediamo di contattarci al più presto per risolvere la situazione:
WhatsApp: +39 328 313 1500
Email: contattolivingapple@gmail.com

LivingApple — Scauri (LT)
${baseUrl}
  `.trim();

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    fromAddress,
      to:      [guestEmail],
      subject: action === 'approve'
        ? `Check-in approvato — Prenotazione #${data.bookId} — LivingApple`
        : `Check-in — azione richiesta — Prenotazione #${data.bookId}`,
      text: action === 'approve' ? approvedBody : rejectedBody,
    }),
  });
}
