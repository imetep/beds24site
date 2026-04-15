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

async function verifyGuestSession(req: NextRequest): Promise<{ bookId: string; email: string } | null> {
  const token = req.cookies.get('guest_session')?.value;
  if (!token) return null;
  const raw = await redisGet(`guest-session:${token}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = await verifyGuestSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { bookId } = session;

  try {
    const b24Token = await getToken();

    // ── Dati prenotazione ────────────────────────────────────────────────────
    const bkRes = await fetch(`${BASE_URL}/bookings?id=${encodeURIComponent(bookId)}`, {
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

    const channel  = (bk.channel ?? '').toLowerCase(); // 'airbnb' | 'booking' | 'direct' | ...
    const isAirbnb = channel === 'airbnb';

    // ── Invoice ──────────────────────────────────────────────────────────────
    let totalCharged = 0;
    let totalPaid    = 0;
    let chargeItems: { description: string; amount: number }[] = [];

    try {
      const invRes = await fetch(`${BASE_URL}/bookings/invoices?bookingId=${bookId}`, {
        headers: { token: b24Token },
        cache:   'no-store',
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        const items: any[] = invData?.data?.[0]?.invoiceItems ?? [];

        chargeItems = items
          .filter((i: any) => i.type === 'charge' && i.description)
          .map((i: any) => ({
            description: i.description,
            amount:      Number(i.lineTotal ?? i.amount ?? 0),
          }));

        if (isAirbnb) {
          // Airbnb: l'invoice contiene il payout netto all'host (dopo commissione).
          // L'ospite conosce il prezzo lordo che ha pagato su Airbnb → bk.price.
          // Non mostriamo nessun "pagato" perché Airbnb incassa per conto host.
          totalCharged = Number(bk.price) || 0;
          totalPaid    = 0;
        } else {
          // Diretta e Booking.com: invoice è la fonte affidabile.
          totalCharged = items
            .filter((i: any) => i.type === 'charge')
            .reduce((s: number, i: any) => s + Number(i.lineTotal ?? i.amount ?? 0), 0);

          // I lineTotal dei payment arrivano NEGATIVI da Beds24 (es. -411.60)
          totalPaid = Math.abs(
            items
              .filter((i: any) => i.type === 'payment')
              .reduce((s: number, i: any) => s + Number(i.lineTotal ?? i.amount ?? 0), 0)
          );

          // Fallback se invoice vuota
          if (totalCharged === 0 && Number(bk.price) > 0) {
            totalCharged = Number(bk.price);
          }
        }
      }
    } catch { /* invoice non critica */ }

    const balanceDue = Math.max(0, totalCharged - totalPaid);

    // ── Room info da PROPERTIES config ────────────────────────────────────────
    const propRoom     = PROPERTIES.flatMap(p => p.rooms).find(
      r => r.roomId === bk.roomId || r.roomId === bk.unitId
    );
    const property     = PROPERTIES.find(p => p.rooms.some(r => r.roomId === propRoom?.roomId));
    const roomName     = propRoom?.name  ?? bk.roomName ?? bk.unitName ?? 'N/D';
    const roomSlug     = propRoom?.slug  ?? '';
    const propertyName = property?.name  ?? '';
    const depositAmount = propRoom?.securityDeposit ?? null;

    // ── Dati Redis (checkin + deposito) ───────────────────────────────────────
    const redisRaw  = await redisGet(`checkin:${bookId}`);
    const redisData = redisRaw ? JSON.parse(redisRaw) : null;

    let depositRedis = redisData?.deposit ?? null;
    if (!depositRedis) {
      const pdRaw = await redisGet(`portal-deposit:${bookId}`);
      depositRedis = pdRaw ? JSON.parse(pdRaw) : null;
    }

    const checkinActive = !!redisData?.status;
    const checkinData   = checkinActive ? {
      status:       redisData.status,
      rejectReason: redisData.rejectReason ?? null,
      messages:     (redisData.messages ?? []).map((m: any) => ({
        from: m.from,
        text: m.text,
        time: m.time,
      })),
    } : null;

    return NextResponse.json({
      ok: true,
      booking: {
        bookId,
        roomId:       bk.roomId ?? bk.unitId,
        roomName,
        roomSlug,
        propertyName,
        checkIn:      bk.arrival,
        checkOut:     bk.departure,
        numAdult:     bk.numAdult ?? bk.adults ?? 0,
        numChild:     bk.numChild ?? bk.children ?? 0,
        guestName:    `${bk.firstName ?? ''} ${bk.lastName ?? ''}`.trim(),
        status:       bk.status,
        channel,
        isAirbnb,
        totalCharged,
        totalPaid,
        balanceDue,
        depositAmount,
        invoiceItems: chargeItems,
      },
      checkin: checkinData,
      deposit: depositRedis,
    });

  } catch (err: any) {
    console.error('[portal/booking]', err);
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}
