import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;

// Mappa roomId → nome (identica a operativo e biancheria)
const ROOM_NAMES: Record<number, string> = {
  107773: 'Stark',     107799: 'Idared',    107846: 'Delicious',
  107847: 'Fuji',      107848: 'PinkLady',  107849: 'Renetta',
  107851: 'Smith',     198030: 'Annurca',   432215: 'Kissabel',
  507514: 'Sergente',  108607: 'Gala',      108612: 'Rubens',
  108613: 'Braeburn',  109685: 'Cherry',    113528: 'Mulberry',
  112982: 'Ciclamino', 113880: 'Fiordaliso',113881: 'Lavanda',
  113882: 'Narciso',   113883: 'Orchidea',  113884: 'Primula',
  113885: 'Mughetto',  113887: 'Viola',     179295: 'Peonia',
  411401: 'Villa Patrizia',
};

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
  return data.result?.[1] ?? [];
}

async function sendBrevo(to: string, subject: string, text: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) { console.warn('[admin/checkin] BREVO_API_KEY mancante'); return; }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:      { name: 'LivingApple', email: process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com' },
      to:          [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[admin/checkin] Brevo error:', res.status, err);
  }
}

// ── Sincronizza roomName, checkIn, checkOut, ospiti con Beds24 ────────────────
// Gestisce anche prenotazioni cancellate: aggiunge il flag cancelled al record Redis
const VALID_STATUSES = new Set(['new', 'confirmed', 'request']);

async function syncBookingData(bookId: string, data: any): Promise<any> {
  try {
    const token = await getToken();
    const res = await fetch(`https://beds24.com/api/v2/bookings?id=${encodeURIComponent(bookId)}`, {
      headers: { token }, cache: 'no-store',
    });
    if (!res.ok) return data;
    const json = await res.json();
    const bk = json?.data?.[0];

    // Prenotazione non trovata o cancellata
    if (!bk || !VALID_STATUSES.has(bk.status)) {
      if (!data.cancelled) {
        console.log(`[admin/checkin] bookId=${bookId} cancellata (status=${bk?.status ?? 'not found'})`);
        data.cancelled = true;
        data.cancelledAt = new Date().toISOString();
        await redisSet(`checkin:${bookId}`, JSON.stringify(data));
      }
      return data;
    }

    // Rimozione flag cancelled se la prenotazione è tornata valida
    if (data.cancelled) {
      data.cancelled = false;
      delete data.cancelledAt;
    }

    const currentRoomId: number = bk.roomId ?? bk.unitId ?? 0;
    const currentRoomName = currentRoomId ? (ROOM_NAMES[currentRoomId] ?? `Room ${currentRoomId}`) : data.roomName;
    const currentCheckIn  = bk.arrival   ?? data.checkIn;
    const currentCheckOut = bk.departure ?? data.checkOut;
    const currentNumAdult = bk.numAdult  ?? data.numAdult;
    const currentNumChild = bk.numChild  ?? data.numChild;

    const changed =
      data.cancelled === false ||
      data.roomName !== currentRoomName ||
      data.checkIn  !== currentCheckIn  ||
      data.checkOut !== currentCheckOut ||
      data.numAdult !== currentNumAdult ||
      data.numChild !== currentNumChild;

    if (changed) {
      console.log(`[admin/checkin] sync bookId=${bookId}: room=${currentRoomName}, in=${currentCheckIn}, out=${currentCheckOut}, adulti=${currentNumAdult}, bambini=${currentNumChild}`);
      data.roomName = currentRoomName;
      data.checkIn  = currentCheckIn;
      data.checkOut = currentCheckOut;
      data.numAdult = currentNumAdult;
      data.numChild = currentNumChild;
      await redisSet(`checkin:${bookId}`, JSON.stringify(data));
    }
  } catch (e) {
    console.error('[admin/checkin] syncBookingData error:', e);
  }
  return data;
}

// ─── GET ─────────────────────────────────────────────────────────────────────
// GET /api/admin/checkin          → lista tutte le richieste
// GET /api/admin/checkin?id=12345 → dettaglio singola
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    const raw = await redisGet(`checkin:${id}`);
    if (!raw) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
    let data = JSON.parse(raw);
    // Sincronizza sempre il roomName con Beds24 sul dettaglio
    data = await syncBookingData(id, data);
    return NextResponse.json({ ok: true, data });
  }

  const keys = await redisScan('checkin:*');
  const items = await Promise.all(
    keys.map(async k => {
      const raw = await redisGet(k);
      if (!raw) return null;
      try {
        const bookId = k.replace('checkin:', '');
        let d = JSON.parse(raw);
        // Sincronizza sempre con Beds24 anche nella lista
        d = await syncBookingData(bookId, d);
        const messages: any[] = d.messages ?? [];
        const unreadGuest = messages.filter(m => m.from === 'guest' && !m.read).length;
        return {
          bookId:      d.bookId,
          roomName:    d.roomName,
          checkIn:     d.checkIn,
          checkOut:    d.checkOut,
          guestName:   `${d.capogruppo?.lastName} ${d.capogruppo?.firstName}`,
          email:       d.capogruppo?.email,
          status:      d.status,
          createdAt:   d.createdAt,
          numAdult:    d.numAdult ?? 0,
          numChild:    d.numChild ?? 0,
          cancelled:   d.cancelled ?? false,
          unreadGuest,
        };
      } catch { return null; }
    })
  );

  const sorted = items
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ ok: true, items: sorted });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// action: 'approve' | 'reject' | 'reset' | 'reply'
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { bookId, action, reason, message } = await req.json();
  if (!bookId || !['approve', 'reject', 'reset', 'reply'].includes(action)) {
    return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });
  }

  const raw = await redisGet(`checkin:${bookId}`);
  if (!raw) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

  const data = JSON.parse(raw);
  if (!data.messages) data.messages = [];

  // ── Reset ──────────────────────────────────────────────────────────────────
  if (action === 'reset') {
    data.status    = 'PENDING';
    data.updatedAt = new Date().toISOString();
    delete data.rejectReason;
    await redisSet(`checkin:${bookId}`, JSON.stringify(data));
    return NextResponse.json({ ok: true, status: 'PENDING' });
  }

  // ── Risposta host nel thread ───────────────────────────────────────────────
  if (action === 'reply') {
    if (!message?.trim()) return NextResponse.json({ error: 'Messaggio vuoto' }, { status: 400 });

    const newMsg = {
      from: 'host',
      text: message.trim(),
      time: new Date().toISOString(),
      read: true,
    };
    data.messages.push(newMsg);
    data.updatedAt = new Date().toISOString();
    await redisSet(`checkin:${bookId}`, JSON.stringify(data));

    // Email all'ospite
    const guestEmail = data.capogruppo?.email;
    const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';
    if (guestEmail) {
      await sendBrevo(
        guestEmail,
        `Risposta LivingApple — Prenotazione #${bookId}`,
        `Gentile ${data.capogruppo.firstName},\n\nhai ricevuto un messaggio da LivingApple riguardo alla tua prenotazione #${bookId}.\n\n"${message.trim()}"\n\nPuoi rispondere qui:\n${baseUrl}/it/self-checkin/wizard/status?bookId=${bookId}\n\nLivingApple — Scauri (LT)`,
      );
    }

    return NextResponse.json({ ok: true, messages: data.messages });
  }

  // ── Approva / Rifiuta ──────────────────────────────────────────────────────
  data.status    = action === 'approve' ? 'APPROVED' : 'REJECTED';
  data.updatedAt = new Date().toISOString();
  if (reason) data.rejectReason = reason;

  await redisSet(`checkin:${bookId}`, JSON.stringify(data));

  // Email all'ospite
  const guestEmail = data.capogruppo?.email;
  const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';
  const c          = data.capogruppo;

  if (guestEmail) {
    const approvedBody = `
Gentile ${c.firstName} ${c.lastName},

la tua richiesta di self check-in è stata APPROVATA.

Prenotazione: #${data.bookId}
Struttura: ${data.roomName}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}

Al momento del tuo arrivo effettueremo una breve videochiamata di verifica come previsto dalla normativa (art. 109 TULPS).

Per qualsiasi domanda: WhatsApp +39 328 313 1500 o ${process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com'}

LivingApple — Scauri (LT)
${baseUrl}
    `.trim();

    const rejectedBody = `
Gentile ${c.firstName} ${c.lastName},

purtroppo la tua richiesta di self check-in non è stata approvata.
${reason ? `\nMotivo: ${reason}\n` : ''}
Ti chiediamo di contattarci al più presto:
WhatsApp: +39 328 313 1500
Email: ${process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com'}

Puoi anche scriverci direttamente qui:
${baseUrl}/it/self-checkin/wizard/status?bookId=${bookId}

LivingApple — Scauri (LT)
${baseUrl}
    `.trim();

    await sendBrevo(
      guestEmail,
      action === 'approve'
        ? `Check-in approvato — Prenotazione #${data.bookId} — LivingApple`
        : `Check-in — azione richiesta — Prenotazione #${data.bookId}`,
      action === 'approve' ? approvedBody : rejectedBody,
    );
  }

  return NextResponse.json({ ok: true, status: data.status });
}

// DELETE /api/admin/checkin?id=12345 — elimina record check-in da Redis
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 });

  const res = await fetch(`${REDIS_URL}/del/checkin:${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Errore eliminazione Redis' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
