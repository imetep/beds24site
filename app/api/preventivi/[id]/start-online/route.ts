/**
 * POST /api/preventivi/[id]/start-online
 *
 * Cliente ha scelto pagamento online (PayPal/Stripe). Crea booking Beds24
 * con status='request' (calendario bloccato pending pagamento; Beds24
 * autoaction cancella se non pagato entro ~1h), salva customer info +
 * bookId nel preventivo. Il client poi usa bookId per inizializzare PayPal
 * SDK o creare sessione Stripe.
 *
 * Body: { customerName, customerEmail, customerPhone?, depositAmount,
 *         paymentMethod: 'paypal'|'stripe' }
 * Returns: { bookId, totals, depositAmount }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPreventivo, savePreventivo } from '@/lib/preventivo-kv';
import { computeTotals, type Preventivo } from '@/lib/preventivo-types';
import { createBeds24BookingFromPreventivo } from '@/lib/preventivo-to-beds24';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const customerName = String(body.customerName ?? '').trim();
  const customerEmail = String(body.customerEmail ?? '').trim();
  const customerPhone = String(body.customerPhone ?? '').trim();
  const depositAmount = Number(body.depositAmount);
  const paymentMethod = body.paymentMethod;

  if (customerName.length < 2) return NextResponse.json({ error: 'name_required' }, { status: 400 });
  if (!isEmail(customerEmail)) return NextResponse.json({ error: 'email_invalid' }, { status: 400 });
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return NextResponse.json({ error: 'amount_invalid' }, { status: 400 });
  }
  if (paymentMethod !== 'paypal' && paymentMethod !== 'stripe') {
    return NextResponse.json({ error: 'method_invalid' }, { status: 400 });
  }

  const p = await getPreventivo(id);
  if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const now = Date.now();
  if (p.status !== 'active' || p.expiresAt < now) {
    return NextResponse.json({ error: 'not_active' }, { status: 409 });
  }

  // Importo deve essere almeno 30% del totale
  const totals = computeTotals(p);
  const minDeposit = Math.round(totals.total * 0.30 * 100) / 100;
  if (depositAmount < minDeposit) {
    return NextResponse.json({ error: 'amount_below_minimum', minDeposit }, { status: 400 });
  }
  if (depositAmount > totals.total) {
    return NextResponse.json({ error: 'amount_above_total', max: totals.total }, { status: 400 });
  }

  // Se già esiste un bookingId pending sul preventivo (cliente è tornato indietro
  // dopo aver iniziato), riusalo invece di crearne un altro.
  if (p.bookingId) {
    const updated: Preventivo = {
      ...p,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      paymentMethodChosen: paymentMethod,
      depositAmount,
    };
    await savePreventivo(updated);
    return NextResponse.json({
      bookId: p.bookingId,
      total: totals.total,
      touristTax: totals.touristTax,
      depositAmount,
    });
  }

  // Salva customer info PRIMA di creare la booking Beds24 (serve a
  // createBeds24BookingFromPreventivo che legge da p.customerEmail/Name)
  const withCustomer: Preventivo = {
    ...p,
    customerName,
    customerEmail,
    customerPhone: customerPhone || undefined,
    paymentMethodChosen: paymentMethod,
    depositAmount,
  };
  await savePreventivo(withCustomer);

  // Crea booking Beds24 con status='request' — pending pagamento.
  // Se il pagamento va a buon fine, /confirm-online la promuove a 'new'/'confirmed'.
  // Se cliente abbandona, /cancel-online la cancella.
  let bookId: number;
  try {
    const result = await createBeds24BookingFromPreventivo(withCustomer, {
      paymentMethod,
      receivedAmount: depositAmount,
      status: 'request',
    });
    bookId = result.bookId;
  } catch (e: any) {
    console.error('[start-online] Beds24 booking creation failed:', e);
    return NextResponse.json({
      error: 'beds24_booking_failed',
      detail: String(e?.message ?? e),
    }, { status: 502 });
  }

  // Salva bookId sul preventivo (status resta 'active' fino a capture)
  await savePreventivo({ ...withCustomer, bookingId: bookId });

  return NextResponse.json({
    bookId,
    total: totals.total,
    touristTax: totals.touristTax,
    depositAmount,
  });
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
