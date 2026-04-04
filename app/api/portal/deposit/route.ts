import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { PROPERTIES } from '@/config/properties';

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

async function verifyGuestSession(req: NextRequest): Promise<{ bookId: string; email: string } | null> {
  const token = req.cookies.get('guest_session')?.value;
  if (!token) return null;
  const raw = await redisGet(`guest-session:${token}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// POST /api/portal/deposit
// Body: { bookId, locale? }
// Ospite avvia Stripe Checkout Session autonomamente (pre-autorizzazione)
// L'importo viene letto da PROPERTIES config (lato server — non manipolabile)
export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const session = await verifyGuestSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  try {
    const body   = await req.json();
    const bookId = session.bookId;  // usa sempre il bookId dalla sessione, non dal body
    const locale = body.locale ?? 'it';

    // ── Recupera roomId da Beds24 ────────────────────────────────────────────
    const b24Token = await getToken();
    const bkRes    = await fetch(`${BASE_URL}/bookings?id=${encodeURIComponent(bookId)}`, {
      headers: { token: b24Token },
      cache:   'no-store',
    });

    if (!bkRes.ok) {
      return NextResponse.json({ error: `Beds24 HTTP ${bkRes.status}` }, { status: 502 });
    }

    const bkData = await bkRes.json();
    const bk     = bkData?.data?.[0];

    if (!bk || String(bk.id ?? bk.bookId) !== String(bookId)) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    // ── Importo deposito da PROPERTIES config ────────────────────────────────
    const propRoom = PROPERTIES.flatMap(p => p.rooms).find(
      r => r.roomId === bk.roomId || r.roomId === bk.unitId
    );

    if (!propRoom?.securityDeposit) {
      return NextResponse.json({ error: 'Importo deposito non configurato per questa struttura' }, { status: 400 });
    }

    const amount     = propRoom.securityDeposit;
    const unitAmount = Math.round(amount * 100); // Stripe usa centesimi

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY mancante' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://livingapple.it';

    // ── Stripe Checkout Session (capture_method: manual = pre-autorizzazione) ─
    const params = new URLSearchParams({
      'mode':                                               'payment',
      'payment_method_types[]':                            'card',
      'payment_intent_data[capture_method]':               'manual',
      'line_items[0][quantity]':                           '1',
      'line_items[0][price_data][currency]':               'eur',
      'line_items[0][price_data][unit_amount]':            String(unitAmount),
      'line_items[0][price_data][product_data][name]':     `Deposito cauzionale — ${propRoom.name} — Prenotazione #${bookId}`,
      'line_items[0][price_data][product_data][description]': 'Pre-autorizzazione. La cifra viene bloccata sulla carta ma non addebitata. Sarà svincolata al termine del soggiorno.',
      'success_url': `${baseUrl}/${locale}/guest/portal?deposit=success&bookId=${bookId}`,
      'cancel_url':  `${baseUrl}/${locale}/guest/portal?deposit=cancel&bookId=${bookId}`,
      'metadata[bookId]':   String(bookId),
      'metadata[type]':     'guest_deposit',
      'metadata[roomName]': propRoom.name,
    });

    const stripeRes  = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const stripeData = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('[portal/deposit] Stripe error:', stripeData);
      return NextResponse.json({ error: stripeData?.error?.message ?? 'Errore Stripe' }, { status: 500 });
    }

    const sessionUrl = stripeData.url;
    const sessionId  = stripeData.id;

    if (!sessionUrl) {
      return NextResponse.json({ error: 'Stripe non ha restituito un URL' }, { status: 500 });
    }

    // ── Salva info deposito su Redis ──────────────────────────────────────────
    // Prima prova a salvare dentro checkin:{bookId} (se esiste)
    // Altrimenti usa portal-deposit:{bookId} come chiave separata
    const depositInfo = {
      sessionId,
      url:       sessionUrl,
      amount,
      status:    'pending',
      source:    'guest',   // distingue dal deposito generato dall'admin
      createdAt: new Date().toISOString(),
    };

    const checkinRaw = await redisGet(`checkin:${bookId}`);
    if (checkinRaw) {
      const checkinData = JSON.parse(checkinRaw);
      checkinData.deposit  = depositInfo;
      checkinData.updatedAt = new Date().toISOString();
      await redisPipeline([['SET', `checkin:${bookId}`, JSON.stringify(checkinData)]]);
    } else {
      // Nessun checkin attivo: salva in chiave dedicata
      await redisPipeline([
        ['SET', `portal-deposit:${bookId}`, JSON.stringify(depositInfo), 'EX', 60 * 60 * 24 * 90], // 90 giorni
      ]);
    }

    return NextResponse.json({ ok: true, url: sessionUrl, amount });

  } catch (err: any) {
    console.error('[portal/deposit]', err);
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}
