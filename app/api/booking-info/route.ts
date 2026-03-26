import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) {
    return NextResponse.json({ error: 'bookId mancante' }, { status: 400 });
  }

  try {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/bookings?bookingId=${bookId}&includeInvoice=true`, {
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
    console.log('[booking-info] Invoice:', JSON.stringify(bk?.invoice ?? bk?.invoiceItems ?? 'nessuna'));

    if (!bk) {
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

    return NextResponse.json({
      ok: true,
      booking: {
        bookId:      bk.id ?? bk.bookId,
        roomId:      bk.roomId,
        checkIn:     bk.arrival,
        checkOut:    bk.departure,
        numAdult:    bk.numAdult ?? bk.adults ?? 0,
        numChild:    bk.numChild ?? bk.children ?? 0,
        guestName:   `${bk.firstName ?? ''} ${bk.lastName ?? ''}`.trim(),
        guestEmail:  bk.email ?? '',
        price:       finalPrice,
        status:      bk.status,
        offerId:     bk.offerId,
        roomName:    bk.roomName ?? bk.unitName ?? '',
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}
