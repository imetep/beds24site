/**
 * GET    /api/preventivi/[id]   → lettura pubblica (sanitizzata) per la vista cliente
 * PUT    /api/preventivi/[id]   → admin: salva modifiche (id+expiresAt invariati)
 * DELETE /api/preventivi/[id]   → admin: cancella preventivo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPreventivo, deletePreventivo, savePreventivo } from '@/lib/preventivo-kv';
import { isValidLocale } from '@/config/i18n';
import type { Preventivo } from '@/lib/preventivo-types';

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return !!cookie && cookie === process.env.ADMIN_PASSWORD;
}

/**
 * Vista pubblica: rimuove campi interni (notes, customerEmail, customerName, bookingId).
 * Il cliente vede solo ciò che serve per decidere e pagare.
 */
function toPublicView(p: Preventivo) {
  // bookingId resta visibile (il cliente vede il proprio numero prenotazione
  // nello stato 'converted'). Stripiamo solo i dati personali e le note interne.
  const { notes, customerEmail, customerName, customerPhone, ...publicFields } = p;
  return publicFields;
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const p = await getPreventivo(id);
  if (!p) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Auto-flag expired al volo (senza riscriverlo: TTL Upstash farà il cleanup)
  const now = Date.now();
  let view: Preventivo = p;
  if (p.status === 'active' && p.expiresAt < now) {
    view = { ...p, status: 'expired' };
  }

  return NextResponse.json({ preventivo: toPublicView(view) });
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const existing = await getPreventivo(id);
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  // Non modificabile se già convertito (booking Beds24 esiste e ha stato proprio)
  if (existing.status === 'converted') {
    return NextResponse.json({ error: 'cannot_edit_converted' }, { status: 409 });
  }

  const err = validateEditInput(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  // Update: id, createdAt, expiresAt invariati. Cliente info, bookingId,
  // paymentMethodChosen, depositAmount: resettati (l'admin sta modificando
  // l'offerta, eventuale flow di pagamento iniziato è da rivedere).
  const updated: Preventivo = {
    id: existing.id,
    propertyId: body.propertyId,
    roomId: body.roomId,
    offerId: Number.isInteger(body.offerId) ? body.offerId : undefined,
    arrival: body.arrival,
    departure: body.departure,
    numAdults: body.numAdults,
    numChildren: body.numChildren ?? 0,
    childrenAges: Array.isArray(body.childrenAges)
      ? body.childrenAges.map((a: any) => Number(a)).filter((a: number) => Number.isFinite(a))
      : undefined,
    basePrice: body.basePrice,
    baseDiscountPct: body.baseDiscountPct ?? 0,
    upsells: Array.isArray(body.upsells) ? body.upsells.map((u: any) => ({
      index: Number(u.index),
      qty: Number(u.qty),
      unitPrice: Number(u.unitPrice),
      discountPct: Number(u.discountPct ?? 0),
    })) : [],
    locale: body.locale,
    notes: body.notes?.trim() || undefined,
    createdAt: existing.createdAt,
    expiresAt: existing.expiresAt,
    // Riporta a 'active' se era 'expired' (l'admin ha appena rivisto l'offerta);
    // 'cancelled' resta cancelled (admin ha esplicitamente cancellato — può rigenerare).
    status: existing.status === 'expired' ? 'active' : existing.status,
  };

  await savePreventivo(updated);
  return NextResponse.json({ ok: true, id });
}

function validateEditInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'body_missing';
  if (!Number.isInteger(body.propertyId)) return 'propertyId_invalid';
  if (!Number.isInteger(body.roomId)) return 'roomId_invalid';
  if (typeof body.arrival !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.arrival)) return 'arrival_invalid';
  if (typeof body.departure !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.departure)) return 'departure_invalid';
  if (body.arrival >= body.departure) return 'date_range_invalid';
  if (!Number.isInteger(body.numAdults) || body.numAdults < 1) return 'numAdults_invalid';
  if (typeof body.basePrice !== 'number' || body.basePrice < 0) return 'basePrice_invalid';
  if (typeof body.locale !== 'string' || !isValidLocale(body.locale)) return 'locale_invalid';
  return null;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const p = await getPreventivo(id);
  if (!p) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (p.status === 'converted') {
    // marchiamo cancelled invece di cancellare: la booking Beds24 va annullata a parte
    await savePreventivo({ ...p, status: 'cancelled' });
    return NextResponse.json({ ok: true, mode: 'marked_cancelled' });
  }
  await deletePreventivo(id);
  return NextResponse.json({ ok: true, mode: 'deleted' });
}
