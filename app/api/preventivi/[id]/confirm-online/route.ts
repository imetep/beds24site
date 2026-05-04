/**
 * POST /api/preventivi/[id]/confirm-online
 *
 * Pagamento online completato (PayPal capture o Stripe checkout success).
 * La booking Beds24 è già stata creata da /start-online (status='request')
 * e aggiornata dal capture handler (status='new' per PayPal o Stripe webhook).
 * Qui marchiamo solo il preventivo come 'converted'.
 *
 * Body: { capturedAmount?: number } (default = preventivo.depositAmount)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPreventivo, savePreventivo, deleteLock } from '@/lib/preventivo-kv';
import type { Preventivo } from '@/lib/preventivo-types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const p = await getPreventivo(id);
  if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (p.status === 'converted') {
    // Idempotente: già convertito, restituisci bookingId esistente
    return NextResponse.json({ ok: true, bookingId: p.bookingId, mode: 'already_converted' });
  }

  if (!p.bookingId) {
    return NextResponse.json({ error: 'no_booking' }, { status: 400 });
  }

  // Importo capturato (informativo, salvato come depositAmount)
  let capturedAmount = p.depositAmount ?? 0;
  try {
    const body = await req.json();
    if (typeof body?.capturedAmount === 'number' && body.capturedAmount > 0) {
      capturedAmount = body.capturedAmount;
    }
  } catch {
    // body opzionale
  }

  const updated: Preventivo = {
    ...p,
    status: 'converted',
    depositAmount: capturedAmount,
  };
  await savePreventivo(updated);

  // Rimuovi eventuale lock bonifico residuo (caso edge: cliente aveva
  // iniziato bonifico poi è tornato indietro e ha pagato online)
  await deleteLock(p.roomId, p.arrival, p.departure).catch(() => {});

  return NextResponse.json({ ok: true, bookingId: p.bookingId });
}
