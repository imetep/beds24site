/**
 * POST /api/preventivi  → crea un nuovo preventivo (admin only)
 * GET  /api/preventivi  → lista tutti i preventivi (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { savePreventivo, listPreventivi } from '@/lib/preventivo-kv';
import { PREVENTIVO_TTL_MS, type Preventivo } from '@/lib/preventivo-types';
import { isValidLocale } from '@/config/i18n';

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return !!cookie && cookie === process.env.ADMIN_PASSWORD;
}

/** ID URL-safe da 8 caratteri base32 (no caratteri ambigui 0/O/1/l/I) */
function generateId(): string {
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const err = validateInput(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const now = Date.now();
  const id = generateId();
  const preventivo: Preventivo = {
    id,
    propertyId: body.propertyId,
    roomId: body.roomId,
    arrival: body.arrival,
    departure: body.departure,
    numAdults: body.numAdults,
    numChildren: body.numChildren ?? 0,
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
    createdAt: now,
    expiresAt: now + PREVENTIVO_TTL_MS,
    status: 'active',
  };

  await savePreventivo(preventivo);

  return NextResponse.json({
    id,
    expiresAt: preventivo.expiresAt,
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const all = await listPreventivi();
  // Auto-aggiorna stato 'expired' al volo (non riscriviamo: la scadenza KV TTL fa il resto)
  const now = Date.now();
  const preventivi = all.map(p => {
    if (p.status === 'active' && p.expiresAt < now) {
      return { ...p, status: 'expired' as const };
    }
    return p;
  });

  return NextResponse.json({ preventivi });
}

// ─── Validazione input ───────────────────────────────────────────────────────

function validateInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'body_missing';
  if (!Number.isInteger(body.propertyId)) return 'propertyId_invalid';
  if (!Number.isInteger(body.roomId)) return 'roomId_invalid';
  if (!isYmd(body.arrival)) return 'arrival_invalid';
  if (!isYmd(body.departure)) return 'departure_invalid';
  if (body.arrival >= body.departure) return 'date_range_invalid';
  if (!Number.isInteger(body.numAdults) || body.numAdults < 1) return 'numAdults_invalid';
  if (body.numChildren != null && (!Number.isInteger(body.numChildren) || body.numChildren < 0)) {
    return 'numChildren_invalid';
  }
  if (typeof body.basePrice !== 'number' || body.basePrice < 0) return 'basePrice_invalid';
  if (body.baseDiscountPct != null && (typeof body.baseDiscountPct !== 'number' || body.baseDiscountPct < 0 || body.baseDiscountPct > 100)) {
    return 'baseDiscountPct_invalid';
  }
  if (typeof body.locale !== 'string' || !isValidLocale(body.locale)) return 'locale_invalid';
  if (body.upsells != null && !Array.isArray(body.upsells)) return 'upsells_invalid';
  return null;
}

function isYmd(s: any): boolean {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
