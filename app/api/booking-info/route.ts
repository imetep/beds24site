import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { PROPERTIES } from '@/config/properties';

const BASE_URL = 'https://beds24.com/api/v2';

export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) {
    return NextResponse.json({ error: 'bookId mancante' }, { status: 400 });
  }

  try {
    const token = await getToken();
    const url = `${BASE_URL}/bookings?id=${bookId}&includeInvoice=true`;
    console.log('[booking-info] URL chiamata:', url);
    const res = await fetch(url, {
      headers: { token },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Beds24 HTTP ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const bk = data?.data?.[0];
    console.log('[booking-info] Tutti i campi Beds24:', JSON.stringify(Object.keys(bk ?? {})));
    console.log('[booking-info] Campi prezzo:', JSON.stringify({ price: bk?.price, deposit: bk?.deposit, tax: bk?.tax }));
    console.log('[booking-info] rateDescription:', bk?.rateDescription);
    console.log('[booking-info] roomId/unitId/roomName/unitName:', bk?.roomId, bk?.unitId, bk?.roomName, bk?.unitName);
    console.log('[booking-info] Invoice:', JSON.stringify(bk?.invoice ?? bk?.invoiceItems ?? 'nessuna'));

    if (!bk) {
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    // Verifica che Beds24 abbia restituito la prenotazione corretta
    const returnedId = bk.id ?? bk.bookId;
    if (String(returnedId) !== String(bookId)) {
      console.log(`[booking-info] Beds24 ha restituito bookId ${returnedId} invece di ${bookId} — prenotazione non trovata`);
      return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 });
    }

    // Prova a leggere il prezzo dalle invoice
    let invoicePrice = 0;
    try {
      const invRes = await fetch(`${BASE_URL}/bookings/invoices?bookingId=${bookId}`, {
        headers: { token },
        cache: 'no-store',
      });
      console.log('[booking-info] /invoices status:', invRes.status);
      if (invRes.ok) {
        const invData = await invRes.json();
        console.log('[booking-info] Invoice raw:', JSON.stringify(invData).slice(0, 500));
        // Beds24 V2 charges: cerca totalCharges o somma charges
        const inv = invData?.data?.[0];
        const items = inv?.invoiceItems ?? [];
        if (Array.isArray(items) && items.length > 0) {
          // Somma solo i charge (type=charge), escludi payments
          invoicePrice = items
            .filter((i: any) => i.type === 'charge')
            .reduce((s: number, i: any) => s + Number(i.lineTotal ?? i.amount ?? 0), 0);
        }
        console.log('[booking-info] invoicePrice calcolato:', invoicePrice);
      } else {
        const errText = await invRes.text();
        console.log('[booking-info] /invoices errore:', invRes.status, errText.slice(0, 200));
      }
    } catch (invErr: any) { console.log('[booking-info] Invoice ERROR:', invErr.message); }

    const finalPrice = Number(bk.price) > 0 ? Number(bk.price) : invoicePrice;

    // Prova 1: campi diretti Beds24
    const depositRaw = bk.deposit ?? bk.securityDeposit ?? bk.depositAmount ?? null;
    let depositAmount: number | null = depositRaw !== null && Number(depositRaw) > 0 ? Number(depositRaw) : null;

    // Prova 2: se non trovato, chiama /offers e cerca CUSTOMSTAYFEE
    console.log("[booking-info] deposit check:", { depositAmount, roomId: bk.roomId, unitId: bk.unitId, arrival: bk.arrival, departure: bk.departure });
    if (!depositAmount && bk.roomId && bk.arrival && bk.departure) {
      try {
        // Usa sempre roomId per le offerte (unitId è il numero unità interna)
        const rid = bk.roomId;
        const qs = new URLSearchParams({
          roomId:     String(rid),
          arrival:    bk.arrival,
          departure:  bk.departure,
          numAdults:  String(bk.numAdult ?? 1),
        });
        console.log('[booking-info] offers call roomId:', rid);
        const offersRes = await fetch(
          `${BASE_URL}/inventory/rooms/offers?${qs}`,
          { headers: { token }, cache: 'no-store' }
        );
        console.log('[booking-info] offers status:', offersRes.status);
        if (offersRes.ok) {
          const offersData = await offersRes.json();
          console.log('[booking-info] offers raw:', JSON.stringify(offersData).slice(0, 600));
          const roomOffers = offersData?.data ?? [];
          for (const room of (Array.isArray(roomOffers) ? roomOffers : [])) {
            for (const offer of (room.offers ?? [])) {
              const desc = offer.offerDescription ?? offer.description ?? '';
              const m = desc.match(/CUSTOMSTAYFEE\s+(\d+)\s+SECURITYDEPOSIT/);
              if (m) { depositAmount = Number(m[1]); break; }
            }
            if (depositAmount) break;
          }
          console.log('[booking-info] depositAmount da CUSTOMSTAYFEE:', depositAmount);
        } else {
          const errTxt = await offersRes.text();
          console.log('[booking-info] offers errore:', offersRes.status, errTxt.slice(0,200));
        }
      } catch (depErr: any) { console.log('[booking-info] offers ERROR:', depErr.message); }
    }

    // Prova 3: fallback su PROPERTIES config — prova roomId e unitId
    if (!depositAmount) {
      const room = PROPERTIES.flatMap(p => p.rooms).find(
        r => r.roomId === bk.roomId || r.roomId === bk.unitId
      );
      if (room?.securityDeposit) {
        depositAmount = room.securityDeposit;
        console.log('[booking-info] depositAmount da PROPERTIES:', depositAmount, 'room:', room.name);
      }
    }

    // Ricava roomName da PROPERTIES usando roomId
    const propRoom = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === bk.roomId);
    const roomName = propRoom?.name ?? bk.roomName ?? bk.unitName ?? '';

    return NextResponse.json({
      ok: true,
      booking: {
        bookId:        bk.id ?? bk.bookId,
        roomId:        bk.roomId,
        checkIn:       bk.arrival,
        checkOut:      bk.departure,
        numAdult:      bk.numAdult ?? bk.adults ?? 0,
        numChild:      bk.numChild ?? bk.children ?? 0,
        guestName:     `${bk.firstName ?? ''} ${bk.lastName ?? ''}`.trim(),
        guestEmail:    bk.email ?? '',
        price:         finalPrice,
        status:        bk.status,
        offerId:       bk.offerId,
        roomName,
        depositAmount,
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}
