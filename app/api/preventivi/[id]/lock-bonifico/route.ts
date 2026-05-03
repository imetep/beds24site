/**
 * POST /api/preventivi/[id]/lock-bonifico
 *
 * Cliente sceglie bonifico: crea un lock KV con TTL 20 min e salva i dati cliente
 * sul preventivo (paymentMethodChosen='bonifico'). Restituisce IBAN/causale/etc.
 * da mostrare nel wizard. Il lock viene sottratto da /api/availability per evitare
 * doppie prenotazioni durante i 20 min in cui il cliente fa il bonifico.
 *
 * Body: { customerName, customerEmail, customerPhone?, depositAmount }
 * Returns: { bonifico: BonificoDati, ttlSec: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPreventivo,
  savePreventivo,
  saveLock,
  getLock,
} from '@/lib/preventivo-kv';
import {
  computeTotals,
  LOCK_BONIFICO_TTL_SEC,
  type Preventivo,
} from '@/lib/preventivo-types';
import { buildBonificoData } from '@/lib/preventivo-bonifico';

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

  if (customerName.length < 2) return NextResponse.json({ error: 'name_required' }, { status: 400 });
  if (!isEmail(customerEmail)) return NextResponse.json({ error: 'email_invalid' }, { status: 400 });
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return NextResponse.json({ error: 'amount_invalid' }, { status: 400 });
  }

  const p = await getPreventivo(id);
  if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Stato: solo active può essere bloccato
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

  // Lock già esistente per le stesse date+camera? (shouldn't happen ma safety)
  const existingLock = await getLock(p.roomId, p.arrival, p.departure);
  if (existingLock && existingLock.preventivoId !== id) {
    return NextResponse.json({ error: 'room_no_longer_available' }, { status: 409 });
  }
  // NOTA: rimosso checkBeds24Available (era cache: 'no-store' = chiamata fresh
  // ad ogni tentativo di lock). Il lock KV già protegge dalla doppia prenotazione
  // tra clienti del preventivo. Se Beds24 nel frattempo ha la camera occupata da
  // altra fonte, lo scopriamo a conferma-bonifico (che fallirà sulla POST /bookings).

  // Salva customer info + paymentMethodChosen + depositAmount
  const updated: Preventivo = {
    ...p,
    customerName,
    customerEmail,
    customerPhone: customerPhone || undefined,
    paymentMethodChosen: 'bonifico',
    depositAmount,
  };
  await savePreventivo(updated);

  // Crea lock KV (TTL 20 min)
  await saveLock({
    preventivoId: id,
    roomId: p.roomId,
    arrival: p.arrival,
    departure: p.departure,
    amount: depositAmount,
    createdAt: now,
  });

  const bonifico = buildBonificoData({
    preventivoId: id,
    customerName,
    amount: depositAmount,
  });

  return NextResponse.json({
    bonifico,
    ttlSec: LOCK_BONIFICO_TTL_SEC,
  });
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
