import { NextRequest, NextResponse } from 'next/server';
import { getBedConfig, calcLinenSetsFromBedStates } from '@/lib/bedConfig';
import { getToken } from '@/lib/beds24-token';

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;
const REDIS_TTL   = 60 * 60 * 24 * 60;

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }, cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()).result ?? null;
}

async function redisSet(key: string, value: string, ttl: number): Promise<void> {
  await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['SET', key, value, 'EX', ttl]]),
  });
}

async function verifyGuestSession(req: NextRequest): Promise<{ bookId: string } | null> {
  const token = req.cookies.get('guest_session')?.value;
  if (!token) return null;
  const raw = await redisGet(`guest-session:${token}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: NextRequest) {
  // Accesso admin diretto tramite adminBookId (bypass sessione ospite)
  const adminBookId = req.nextUrl.searchParams.get('adminBookId');
  let bookId: string;
  if (adminBookId) {
    // Verifica cookie admin
    const adminCookie = req.cookies.get('admin_session')?.value;
    if (!adminCookie) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    bookId = adminBookId;
  } else {
    const session = await verifyGuestSession(req);
    if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    bookId = session.bookId;
  }
  const redisKey = `beds:v6:${bookId}`;
  const raw = await redisGet(redisKey);
  let stored: { roomId: number; bedStates: Record<string, 'off'|'A'|'B'>; roomTouched: Record<string, boolean>; cribs: number } | null = null;
  if (raw) { try { stored = JSON.parse(raw); } catch { /* */ } }
  let roomId = stored?.roomId ?? 0;
  if (!roomId) {
    try {
      const b24Token = await getToken();
      const res = await fetch(`https://beds24.com/api/v2/bookings?id=${encodeURIComponent(bookId)}`, {
        headers: { token: b24Token }, cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const bk = data?.data?.[0];
        roomId = bk?.roomId ?? bk?.unitId ?? 0;
        if (roomId) await redisSet(redisKey, JSON.stringify({ roomId, bedStates: {}, roomTouched: {}, cribs: 0 }), REDIS_TTL);
      }
    } catch { /* */ }
  }
  if (!roomId) return NextResponse.json({ config: null, bedStates: {}, roomTouched: {}, cribs: 0 });
  const config = getBedConfig(roomId);
  if (!config)  return NextResponse.json({ config: null, bedStates: {}, roomTouched: {}, cribs: 0 });
  const bedStates = stored?.bedStates ?? {};
  const cribs     = stored?.cribs ?? 0;
  const linen     = calcLinenSetsFromBedStates(roomId, bedStates, cribs);
  return NextResponse.json({ config, bedStates, roomTouched: stored?.roomTouched ?? {}, cribs, linen });
}

export async function POST(req: NextRequest) {
  const session = await verifyGuestSession(req);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  const { bookId } = session;
  const redisKey = `beds:v6:${bookId}`;
  let body: { bedStates?: Record<string, 'off'|'A'|'B'>; roomTouched?: Record<string, boolean>; cribs?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Body non valido' }, { status: 400 }); }
  const raw = await redisGet(redisKey);
  let stored: { roomId: number; savedAt?: string } | null = null;
  if (raw) { try { stored = JSON.parse(raw); } catch { /* */ } }

  const roomId      = stored?.roomId ?? 0;
  const isModifica  = !!stored?.savedAt; // già salvato in precedenza = modifica
  const bedStates   = body.bedStates   ?? {};
  const roomTouched = body.roomTouched ?? {};
  const cribs       = Math.min(Math.max(Math.round(body.cribs ?? 0), 0), 2);

  await redisSet(redisKey, JSON.stringify({ roomId, bedStates, roomTouched, cribs, savedAt: new Date().toISOString() }), REDIS_TTL);

  let linen = { lenzMatrimoniali: 0, lenzSingoli: 0, federe: 0, persone: 0, culle: cribs };
  if (roomId) {
    const config = getBedConfig(roomId);
    if (config) linen = calcLinenSetsFromBedStates(roomId, bedStates, cribs);
  }

  // ── Email notifica Brevo ────────────────────────────────────────────────────
  const apiKey   = process.env.BREVO_API_KEY;
  const hostEmail = process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com';
  if (apiKey) {
    const tipoAzione = isModifica ? '🔄 MODIFICA configurazione letti' : '🛏 NUOVA configurazione letti';
    const linenText  =
      `Lenzuola matrimoniali: ${linen.lenzMatrimoniali}\n` +
      `Lenzuola singole: ${linen.lenzSingoli}\n` +
      `Federe: ${linen.federe}\n` +
      `Asciugamani (persone): ${linen.persone}\n` +
      `Culle: ${linen.culle}`;
    const emailBody =
      `${tipoAzione}\n` +
      `Prenotazione: #${bookId}\n\n` +
      `BIANCHERIA CALCOLATA:\n${linenText}\n\n` +
      `Gestisci da: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://livingapple.it'}/admin/checkin`;

    fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        sender:      { name: 'LivingApple', email: hostEmail },
        to:          [{ email: hostEmail }],
        subject:     `${tipoAzione} — #${bookId}`,
        textContent: emailBody,
      }),
    }).catch(e => console.error('[beds/POST] Brevo error:', e));
  }

  return NextResponse.json({ ok: true, linen, cribs });
}
