import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }, cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()).result ?? null;
}

async function verifyGuestSession(req: NextRequest): Promise<{ bookId: string } | null> {
  const token = req.cookies.get('guest_session')?.value;
  if (!token) return null;
  const raw = await redisGet(`guest-session:${token}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = await verifyGuestSession(req);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  let body: {
    bookId: string;
    types: string[];
    dates: { checkIn: string; checkOut: string } | null;
    guests: { numAdult: number; numChild: number } | null;
    apartment: string | null;
    notes: string;
    locale: string;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body non valido' }, { status: 400 }); }

  if (body.bookId !== session.bookId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const apiKey    = process.env.BREVO_API_KEY;
  const hostEmail = process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com';
  const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';

  const lines: string[] = [
    `✏️ RICHIESTA MODIFICA PRENOTAZIONE`,
    `Prenotazione: #${body.bookId}`,
    ``,
    `Modifiche richieste:`,
  ];

  if (body.types.includes('dates') && body.dates) {
    lines.push(`📅 Date: ${body.dates.checkIn} → ${body.dates.checkOut}`);
  }
  if (body.types.includes('guests') && body.guests) {
    lines.push(`👥 Ospiti: ${body.guests.numAdult} adulti · ${body.guests.numChild} bambini`);
  }
  if (body.types.includes('apartment') && body.apartment) {
    lines.push(`🏠 Appartamento desiderato: ${body.apartment}`);
  }
  if (body.notes?.trim()) {
    lines.push(``, `Note aggiuntive: ${body.notes.trim()}`);
  }
  lines.push(``, `Gestisci da: ${baseUrl}/admin/checkin`);

  if (apiKey) {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender:      { name: 'LivingApple', email: hostEmail },
        to:          [{ email: hostEmail }],
        subject:     `✏️ Richiesta modifica — #${body.bookId}`,
        textContent: lines.join('\n'),
      }),
    }).catch(e => console.error('[change-request] Brevo error:', e));
  }

  // Appende al thread messaggi Redis se esiste un checkin
  const checkinRaw = await redisGet(`checkin:${body.bookId}`);
  if (checkinRaw) {
    try {
      const d = JSON.parse(checkinRaw);
      if (!d.messages) d.messages = [];
      const summary = lines.filter(l => l.startsWith('📅') || l.startsWith('👥') || l.startsWith('🏠')).join(' | ');
      d.messages.push({ from: 'guest', text: `[Richiesta modifica] ${summary}`, time: new Date().toISOString(), read: false });
      await fetch(`${REDIS_URL}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([['SET', `checkin:${body.bookId}`, JSON.stringify(d)]]),
      });
    } catch { /* non critico */ }
  }

  return NextResponse.json({ ok: true });
}
