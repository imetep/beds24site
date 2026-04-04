import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

// GET /api/test-portal-booking?bookId=XXXXX
// Solo per debug — da rimuovere prima di andare in produzione
export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) {
    return NextResponse.json({ error: 'Parametro bookId mancante' }, { status: 400 });
  }

  try {
    const token = await getToken();

    // ── 1. Dati prenotazione ──────────────────────────────────────────────────
    const bkRes  = await fetch(`${BASE_URL}/bookings?id=${bookId}`, {
      headers: { token },
      cache: 'no-store',
    });
    const bkRaw  = await bkRes.json();
    const bk     = bkRaw?.data?.[0] ?? null;

    // ── 2. Invoice ────────────────────────────────────────────────────────────
    const invRes  = await fetch(`${BASE_URL}/bookings/invoices?bookingId=${bookId}`, {
      headers: { token },
      cache: 'no-store',
    });
    const invRaw  = await invRes.json();

    // ── 3. Riepilogo campi chiave (per leggibilità rapida) ────────────────────
    const summary = bk ? {
      id:             bk.id          ?? bk.bookId       ?? '—',
      status:         bk.status                         ?? '—',
      roomId:         bk.roomId                         ?? '—',
      unitId:         bk.unitId                         ?? '—',
      roomName:       bk.roomName    ?? bk.unitName     ?? '—',
      arrival:        bk.arrival     ?? bk.checkIn      ?? '—',
      departure:      bk.departure   ?? bk.checkOut     ?? '—',
      firstName:      bk.firstName                      ?? '—',
      lastName:       bk.lastName                       ?? '—',
      email:          bk.email                          ?? '—',
      numAdult:       bk.numAdult    ?? bk.adults       ?? '—',
      numChild:       bk.numChild    ?? bk.children     ?? '—',
      // Campi prezzo — vogliamo capire quale è il totale affidabile
      price:          bk.price                          ?? '—',
      deposit:        bk.deposit                        ?? '—',
      depositAmount:  bk.depositAmount                  ?? '—',
      securityDeposit:bk.securityDeposit                ?? '—',
      balance:        bk.balance                        ?? '—',
      // Canale di provenienza
      referer:        bk.referer                        ?? '—',
      source:         bk.source                         ?? '—',
      channel:        bk.channel                        ?? '—',
      apiSource:      bk.apiSource                      ?? '—',
    } : null;

    // Riepilogo invoice items
    const invoiceItems: any[] = invRaw?.data?.[0]?.invoiceItems ?? [];
    const invoiceSummary = {
      httpStatus:   invRes.status,
      totalItems:   invoiceItems.length,
      charges:      invoiceItems.filter((i: any) => i.type === 'charge'),
      payments:     invoiceItems.filter((i: any) => i.type === 'payment'),
      other:        invoiceItems.filter((i: any) => i.type !== 'charge' && i.type !== 'payment'),
      totalCharged: invoiceItems
        .filter((i: any) => i.type === 'charge')
        .reduce((s: number, i: any) => s + Number(i.lineTotal ?? i.amount ?? 0), 0),
      totalPaid: invoiceItems
        .filter((i: any) => i.type === 'payment')
        .reduce((s: number, i: any) => s + Number(i.lineTotal ?? i.amount ?? 0), 0),
    };

    return NextResponse.json({
      bookId,
      // Riepilogo rapido — leggi questo per primo
      SUMMARY: summary,
      INVOICE_SUMMARY: invoiceSummary,
      // Raw completo — per non perdere nulla
      RAW_BOOKING:  bk,
      RAW_INVOICE:  invRaw,
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Errore server' }, { status: 500 });
  }
}
