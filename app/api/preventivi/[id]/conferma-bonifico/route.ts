/**
 * POST /api/preventivi/[id]/conferma-bonifico  (admin only)
 *
 * L'admin conferma di aver ricevuto il bonifico in banca:
 *   1. Crea booking Beds24 (status='confirmed', calendario bloccato)
 *   2. Marca preventivo status='converted' + salva bookingId
 *   3. Rimuove il lock KV (ormai inutile, calendario è bloccato su Beds24)
 *
 * Body opzionale: { receivedAmount?: number }
 *   se non fornito, usa preventivo.depositAmount
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPreventivo,
  savePreventivo,
  deleteLock,
} from '@/lib/preventivo-kv';
import type { Preventivo } from '@/lib/preventivo-types';
import { createBeds24BookingFromPreventivo } from '@/lib/preventivo-to-beds24';

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return !!cookie && cookie === process.env.ADMIN_PASSWORD;
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const p = await getPreventivo(id);
  if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (p.status === 'converted') {
    return NextResponse.json({ error: 'already_converted', bookingId: p.bookingId }, { status: 409 });
  }
  if (p.paymentMethodChosen !== 'bonifico') {
    return NextResponse.json({ error: 'not_bonifico' }, { status: 400 });
  }
  if (!p.customerEmail || !p.customerName) {
    return NextResponse.json({ error: 'customer_missing' }, { status: 400 });
  }

  // Importo bonifico ricevuto: dal body o dal preventivo
  let receivedAmount = p.depositAmount ?? 0;
  try {
    const body = await req.json();
    if (typeof body?.receivedAmount === 'number' && body.receivedAmount > 0) {
      receivedAmount = body.receivedAmount;
    }
  } catch {
    // body opzionale, ignora errori parsing
  }
  if (receivedAmount <= 0) {
    return NextResponse.json({ error: 'amount_missing' }, { status: 400 });
  }

  // 1. Crea booking Beds24
  let bookingId: number;
  try {
    const result = await createBeds24BookingFromPreventivo(p, {
      paymentMethod: 'bonifico',
      receivedAmount,
    });
    bookingId = result.bookId;
  } catch (e: any) {
    console.error('[conferma-bonifico] Beds24 booking creation failed:', e);
    return NextResponse.json({
      error: 'beds24_booking_failed',
      detail: String(e?.message ?? e),
    }, { status: 502 });
  }

  // 2. Marca preventivo converted
  const updated: Preventivo = {
    ...p,
    status: 'converted',
    bookingId,
  };
  await savePreventivo(updated);

  // 3. Rimuovi lock (calendario è bloccato su Beds24, lock superfluo)
  await deleteLock(p.roomId, p.arrival, p.departure);

  return NextResponse.json({ ok: true, bookingId });
}
