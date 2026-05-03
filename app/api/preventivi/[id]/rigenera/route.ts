/**
 * POST /api/preventivi/[id]/rigenera  → admin: clona il preventivo con nuovo id e
 *                                       scadenza 48h dal momento della rigenerazione.
 *                                       Il vecchio preventivo viene marcato 'cancelled'
 *                                       per evitare due link attivi sulle stesse date.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getPreventivo, savePreventivo } from '@/lib/preventivo-kv';
import { PREVENTIVO_TTL_MS, type Preventivo } from '@/lib/preventivo-types';

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return !!cookie && cookie === process.env.ADMIN_PASSWORD;
}

function generateId(): string {
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const old = await getPreventivo(id);
  if (!old) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (old.status === 'converted') {
    return NextResponse.json({ error: 'already_converted' }, { status: 409 });
  }

  const now = Date.now();
  const newId = generateId();
  const fresh: Preventivo = {
    ...old,
    id: newId,
    createdAt: now,
    expiresAt: now + PREVENTIVO_TTL_MS,
    status: 'active',
    paymentMethodChosen: undefined,
    customerEmail: undefined,
    customerName: undefined,
    bookingId: undefined,
  };

  await savePreventivo(fresh);
  await savePreventivo({ ...old, status: 'cancelled' });

  return NextResponse.json({
    id: newId,
    expiresAt: fresh.expiresAt,
  });
}
