import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;

async function redisSet(key: string, value: string, ttlSeconds?: number) {
  const cmd = ttlSeconds
    ? [['SET', key, value, 'EX', String(ttlSeconds)]]
    : [['SET', key, value]];

  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(cmd),
    cache:   'no-store',
  });
  if (!res.ok) {
    const t = await res.text();
    console.error('[checkin/submit] Redis SET error:', res.status, t);
  }
}

async function sendEmails(data: any) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) { console.warn('[checkin/submit] RESEND_API_KEY mancante'); return; }

  const hostEmail  = process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com';
  const guestEmail = data.capogruppo?.email;
  const c          = data.capogruppo;
  const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';

  // ── Email all'host ────────────────────────────────────────────────────────
  const capoLine = `${c.lastName} ${c.firstName} — nato il ${c.birthDate} a ${c.birthPlace} (${c.citizenship}) — ${c.gender} — ${c.docType} n° ${c.docNumber} rilasciato a ${c.docIssuePlace}`;
  const altriLines = (data.altri ?? []).map((a: any, i: number) =>
    `Ospite ${i + 2} (${a.guestType}): ${a.lastName} ${a.firstName} — nato il ${a.birthDate} a ${a.birthPlace} (${a.citizenship}) — ${a.gender}`
  ).join('\n');
  const docsLines = (data.docs ?? []).map((d: any) => `• ${d.label}: ${d.publicId}`).join('\n');

  const hostBody = `
Nuova richiesta di self check-in

Prenotazione: #${data.bookId}
Struttura: ${data.roomName}
Check-in: ${data.checkIn} — Check-out: ${data.checkOut}
Email ospite: ${guestEmail ?? 'non fornita'}

CAPOGRUPPO
${capoLine}
${data.altri?.length ? `\nALTRI OSPITI\n${altriLines}` : ''}

DOCUMENTI (Cloudinary — cartella privata)
${docsLines || 'nessuno'}

FIRMA: ${data.signature}
Consenso TULPS: ${data.consentTulps ? 'SÌ' : 'NO'}
Consenso GDPR: ${data.consentGdpr ? 'SÌ' : 'NO'}
Ora invio: ${new Date().toLocaleString('it-IT')}

---
Pannello admin: ${baseUrl}/admin/checkin
  `.trim();

  // ── Email all'ospite ──────────────────────────────────────────────────────
  const guestBody = `
Gentile ${c.firstName} ${c.lastName},

la tua richiesta di self check-in è stata ricevuta correttamente.

Prenotazione: #${data.bookId}
Struttura: ${data.roomName}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}

Cosa succede adesso:
Il gestore verificherà i documenti e ti invierà una email di approvazione entro 24 ore. 
Controlla anche la cartella spam.

Per qualsiasi domanda puoi contattarci via WhatsApp al +39 328 313 1500 
o per email a contattolivingapple@gmail.com

LivingApple — Scauri (LT)
${baseUrl}
  `.trim();

  // Invia in parallelo
  await Promise.allSettled([
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'checkin@livingapple.it',
        to:      [hostEmail],
        subject: `[Check-in] #${data.bookId} — ${c.lastName} ${c.firstName}`,
        text:    hostBody,
      }),
    }),
    guestEmail && fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'checkin@livingapple.it',
        to:      [guestEmail],
        subject: `Check-in confermato — Prenotazione #${data.bookId} — LivingApple`,
        text:    guestBody,
      }),
    }),
  ].filter(Boolean));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookId, roomName, checkIn, checkOut,
      capogruppo, altri, docs, signature, consentTulps, consentGdpr,
    } = body;

    if (!bookId || !capogruppo?.lastName || !signature || !consentTulps || !consentGdpr) {
      return NextResponse.json({ error: 'Dati obbligatori mancanti' }, { status: 400 });
    }

    const checkinData = {
      bookId, roomName, checkIn, checkOut,
      capogruppo, altri: altri ?? [],
      docs: docs ?? [],
      signature, consentTulps, consentGdpr,
      status:    'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Salva su Redis — TTL 90 giorni
    await redisSet(`checkin:${bookId}`, JSON.stringify(checkinData), 90 * 24 * 3600);

    // Invia entrambe le email
    await sendEmails(checkinData);

    return NextResponse.json({ ok: true, bookId });

  } catch (err: any) {
    console.error('[checkin/submit]', err);
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}
