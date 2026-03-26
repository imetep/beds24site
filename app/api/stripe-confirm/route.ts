import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BEDS24_BASE = 'https://beds24.com/api/v2';

/**
 * POST /api/stripe-confirm
 *
 * Chiamato da SuccessContent.tsx quando l'utente atterra sulla pagina di successo.
 *
 * NON chiama Stripe API direttamente: l'integrazione Stripe è gestita da Beds24
 * tramite il suo canale (/channels/stripe). Beds24 riceve il webhook Stripe
 * autonomamente e aggiorna lo status del booking.
 *
 * Il nostro compito qui è solo:
 * 1. Aggiungere le invoiceItems dettagliate su Beds24 (soggiorno, imposta, pagamento)
 *    così che appaiano nella prenotazione (inclusi bambini 0-2 nelle note)
 * 2. Forzare status → confirmed come safety net
 *    (nel caso Beds24 non abbia ancora ricevuto il webhook)
 *
 * Body: {
 *   bookingId:      number
 *   capture:        boolean  — true = pagamento immediato (offerte 1-2), false = carta salvata
 *   accommodation:  number
 *   touristTax:     number
 *   discountAmount: number
 *   voucherCode:    string | null
 * }
 */
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const {
    bookingId, capture,
    accommodation, touristTax, discountAmount, voucherCode,
  } = body;

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId obbligatorio' }, { status: 400 });
  }

  try {
    const token = await getToken();

    // ── 1. Forza status → confirmed (safety net) ────────────────────────────
    // Beds24 dovrebbe già aver confermato via webhook Stripe,
    // ma lo forziamo comunque nel caso il webhook non fosse ancora arrivato.
    const statusRes = await fetch(`${BEDS24_BASE}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: Number(bookingId), status: 'confirmed' }]),
      cache: 'no-store',
    });
    const statusRaw = await statusRes.text();
    console.log('[stripe-confirm] Beds24 status → confirmed:', statusRes.status, statusRaw.slice(0, 150));

    // ── 2. Aggiunge invoiceItems (solo per pagamento immediato) ─────────────
    // Per carta salvata (capture=false, offerte 3-6) non c'è ancora
    // un pagamento da registrare — verrà addebitato in seguito.
    if (capture) {
      const invoiceItems: any[] = [];

      if (accommodation && Number(accommodation) > 0) {
        invoiceItems.push({
          type:        'charge',
          description: voucherCode ? `Soggiorno (voucher: ${voucherCode})` : 'Soggiorno',
          amount:      Number(accommodation),
          qty:         1,
        });
      }

      if (discountAmount && Number(discountAmount) > 0) {
        invoiceItems.push({
          type:        'charge',
          description: `Sconto voucher${voucherCode ? ` (${voucherCode})` : ''}`,
          amount:      -Number(discountAmount),
          qty:         1,
        });
      }

      if (touristTax && Number(touristTax) > 0) {
        invoiceItems.push({
          type:        'charge',
          description: 'Imposta di soggiorno',
          amount:      Number(touristTax),
          qty:         1,
        });
      }

      // Nota: non aggiungiamo la riga "payment Stripe" perché Beds24
      // la registra autonomamente quando riceve il webhook da Stripe.
      // Aggiungendola noi avremmo un doppio pagamento nella fattura.

      if (invoiceItems.length > 0) {
        const invoiceRes = await fetch(`${BEDS24_BASE}/bookings`, {
          method: 'POST',
          headers: { token, 'Content-Type': 'application/json' },
          body: JSON.stringify([{ id: Number(bookingId), invoiceItems }]),
          cache: 'no-store',
        });
        const invoiceRaw = await invoiceRes.text();
        console.log('[stripe-confirm] Beds24 invoiceItems:', invoiceRes.status, invoiceRaw.slice(0, 150));
      }
    }

    return NextResponse.json({ ok: true, confirmed: true, cardSaved: !capture });

  } catch (err: any) {
    console.error('[stripe-confirm] Errore:', err.message);
    return NextResponse.json({ error: err.message ?? 'Errore conferma' }, { status: 500 });
  }
}
