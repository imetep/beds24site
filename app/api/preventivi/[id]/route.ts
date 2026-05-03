/**
 * GET    /api/preventivi/[id]   → lettura pubblica (sanitizzata) per la vista cliente
 * DELETE /api/preventivi/[id]   → admin: cancella preventivo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPreventivo, deletePreventivo, savePreventivo } from '@/lib/preventivo-kv';
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
