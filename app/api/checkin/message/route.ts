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

async function redisSet(key: string, value: string) {
  await fetch(`${REDIS_URL}/pipeline`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify([['SET', key, value]]),
    cache:   'no-store',
  });
}

async function sendBrevo(to: string, subject: string, text: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:      { name: 'LivingApple', email: process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com' },
      to:          [{ email: to }],
      subject,
      textContent: text,
    }),
  });
}

// POST /api/checkin/message
// Body: { bookId, message }
// Ospite invia un messaggio nel thread — nessuna autenticazione richiesta,
// ma il bookId deve esistere su Redis (prova che l'ospite ha fatto il check-in)
export async function POST(req: NextRequest) {
  try {
    const { bookId, message } = await req.json();

    if (!bookId || !message?.trim()) {
      return NextResponse.json({ error: 'bookId e message obbligatori' }, { status: 400 });
    }

    const raw = await redisGet(`checkin:${bookId}`);
    if (!raw) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    const data = JSON.parse(raw);
    if (!data.messages) data.messages = [];

    const newMsg = {
      from: 'guest',
      text: message.trim(),
      time: new Date().toISOString(),
      read: false,
    };
    data.messages.push(newMsg);
    data.updatedAt = new Date().toISOString();

    await redisSet(`checkin:${bookId}`, JSON.stringify(data));

    // Notifica email all'host
    const hostEmail  = process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com';
    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';
    const guestName  = `${data.capogruppo?.firstName ?? ''} ${data.capogruppo?.lastName ?? ''}`.trim();

    await sendBrevo(
      hostEmail,
      `[Messaggio ospite] #${bookId} — ${guestName}`,
      `Nuovo messaggio da ${guestName} (prenotazione #${bookId}):\n\n"${message.trim()}"\n\nRispondi dal pannello admin:\n${baseUrl}/admin/checkin`,
    );

    return NextResponse.json({ ok: true, messages: data.messages });

  } catch (err: any) {
    console.error('[checkin/message]', err);
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}
