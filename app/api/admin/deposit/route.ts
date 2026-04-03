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

// POST /api/admin/deposit
// Body: { bookId, amount }
// Crea una Stripe Checkout Session con capture_method: manual (pre-autorizzazione)
// Restituisce { url } da mandare all'ospite
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { bookId, amount } = await req.json();
  if (!bookId || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'bookId e amount obbligatori' }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'STRIPE_SECRET_KEY mancante' }, { status: 500 });

  const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';
  const unitAmount = Math.round(Number(amount) * 100); // Stripe vuole centesimi

  // Costruisce il body in application/x-www-form-urlencoded (Stripe non accetta JSON)
  const params = new URLSearchParams({
    'mode':                              'payment',
    'payment_method_types[]':           'card',
    'payment_intent_data[capture_method]': 'manual',
    'line_items[0][quantity]':           '1',
    'line_items[0][price_data][currency]':              'eur',
    'line_items[0][price_data][unit_amount]':           String(unitAmount),
    'line_items[0][price_data][product_data][name]':   `Deposito cauzionale — Prenotazione #${bookId}`,
    'success_url': `${baseUrl}/admin/checkin?deposit=success&bookId=${bookId}`,
    'cancel_url':  `${baseUrl}/admin/checkin?deposit=cancel&bookId=${bookId}`,
    'metadata[bookId]': String(bookId),
    'metadata[type]':   'deposit',
  });

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${stripeKey}`,
        'Content-Type':   'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const stripeData = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('[admin/deposit] Stripe error:', stripeData);
      return NextResponse.json({ error: stripeData?.error?.message ?? 'Errore Stripe' }, { status: 500 });
    }

    const sessionUrl = stripeData.url;
    const sessionId  = stripeData.id;

    if (!sessionUrl) {
      return NextResponse.json({ error: 'Stripe non ha restituito un URL' }, { status: 500 });
    }

    // Salva info deposito su Redis nella chiave checkin:{bookId}
    const raw = await redisGet(`checkin:${bookId}`);
    if (raw) {
      const data = JSON.parse(raw);
      data.deposit = {
        sessionId,
        url:    sessionUrl,
        amount: Number(amount),
        status: 'pending',       // pending → authorized → captured / cancelled
        createdAt: new Date().toISOString(),
      };
      await redisSet(`checkin:${bookId}`, JSON.stringify(data));
    }

    return NextResponse.json({ ok: true, url: sessionUrl, sessionId });

  } catch (err: any) {
    console.error('[admin/deposit]', err);
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}

// PATCH /api/admin/deposit
// Body: { bookId } — invia email all'ospite con link deposito + aggiunge messaggio nel thread
export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { bookId } = await req.json();
  if (!bookId) return NextResponse.json({ error: 'bookId mancante' }, { status: 400 });

  const raw = await redisGet(`checkin:${bookId}`);
  if (!raw) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

  const data    = JSON.parse(raw);
  const deposit = data.deposit;
  if (!deposit?.url) return NextResponse.json({ error: 'Nessun link deposito generato' }, { status: 400 });

  const guestEmail = data.capogruppo?.email;
  const guestName  = `${data.capogruppo?.firstName ?? ''} ${data.capogruppo?.lastName ?? ''}`.trim();
  const hostEmail  = process.env.HOST_EMAIL ?? 'contattolivingapple@gmail.com';
  const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';
  const apiKey     = process.env.BREVO_API_KEY;

  if (!guestEmail) return NextResponse.json({ error: 'Email ospite non trovata' }, { status: 400 });
  if (!apiKey)     return NextResponse.json({ error: 'BREVO_API_KEY mancante' }, { status: 500 });

  const emailBody = `
Gentile ${guestName},

per completare la tua richiesta di self check-in è necessario autorizzare un deposito cauzionale di € ${deposit.amount}.

Il deposito è una pre-autorizzazione: la cifra viene temporaneamente bloccata sulla tua carta ma non addebitata. Verrà svincolata al termine del soggiorno se non ci sono danni.

LINK PER IL DEPOSITO:
${deposit.url}

Il pagamento è gestito tramite Stripe, il sistema di pagamento online più diffuso in Europa, utilizzato da milioni di aziende in tutto il mondo. I tuoi dati della carta non vengono mai condivisi con noi — transitano esclusivamente attraverso i server sicuri di Stripe (certificazione PCI DSS Level 1).

Dopo aver completato il pagamento ti invieremo la conferma di approvazione del check-in.

Per qualsiasi domanda: WhatsApp +39 328 313 1500 o ${hostEmail}

Puoi seguire lo stato della tua richiesta qui:
${baseUrl}/it/self-checkin/wizard/status?bookId=${bookId}

LivingApple — Scauri (LT)
${baseUrl}
  `.trim();

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:      { name: 'LivingApple', email: hostEmail },
      to:          [{ email: guestEmail }],
      subject:     `Deposito cauzionale richiesto — Prenotazione #${bookId} — LivingApple`,
      textContent: emailBody,
    }),
  });

  if (!brevoRes.ok) {
    const err = await brevoRes.text();
    console.error('[admin/deposit PATCH] Brevo error:', err);
    return NextResponse.json({ error: 'Errore invio email' }, { status: 500 });
  }

  // Aggiunge messaggio nel thread Redis
  if (!data.messages) data.messages = [];
  data.messages.push({
    from: 'host',
    text: `Ti abbiamo inviato via email il link per il deposito cauzionale di € ${deposit.amount}. Controlla la tua casella (anche spam). Il pagamento è gestito tramite Stripe in modalità sicura.`,
    time: new Date().toISOString(),
    read: true,
  });
  data.deposit.emailSentAt = new Date().toISOString();
  data.updatedAt           = new Date().toISOString();
  await redisSet(`checkin:${bookId}`, JSON.stringify(data));

  return NextResponse.json({ ok: true, messages: data.messages });
}

// GET /api/admin/deposit?bookId=X
// Legge lo stato del deposito da Redis
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) return NextResponse.json({ error: 'bookId mancante' }, { status: 400 });

  const raw = await redisGet(`checkin:${bookId}`);
  if (!raw) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

  const data = JSON.parse(raw);
  return NextResponse.json({ ok: true, deposit: data.deposit ?? null });
}
