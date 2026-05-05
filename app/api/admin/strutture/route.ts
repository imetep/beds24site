/**
 * /api/admin/strutture
 *
 *   GET ?archived=1  → lista case (default: solo non archiviate)
 *   POST             → crea casa { nome, beds24RoomId, ... } - admin
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listCase, saveCasa, getCasaByRoomId } from '@/lib/case-kv';
import type { Casa, DotazioneTecnica, VoceNonApplicabile } from '@/lib/case-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

// ─── GET list ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const includeArchived = req.nextUrl.searchParams.get('archived') === '1';
  const case_ = await listCase(includeArchived);
  return NextResponse.json({ case: case_ });
}

// ─── POST create ─────────────────────────────────────────────────────────────

interface CreateBody {
  nome?:                 unknown;
  beds24RoomId?:         unknown;
  indirizzo?:            unknown;
  note?:                 unknown;
  keybox?:               unknown;
  fotoUrls?:             unknown;
  dotazioni?:            unknown;
  vociNonApplicabili?:   unknown;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const nome         = typeof body.nome === 'string' ? body.nome.trim() : '';
  const beds24RoomId = typeof body.beds24RoomId === 'number' ? body.beds24RoomId : Number(body.beds24RoomId);

  if (!nome) {
    return NextResponse.json({ error: 'Nome richiesto' }, { status: 400 });
  }
  if (!Number.isFinite(beds24RoomId) || beds24RoomId <= 0) {
    return NextResponse.json({ error: 'beds24RoomId richiesto (intero positivo)' }, { status: 400 });
  }

  // Univocità beds24RoomId
  const existing = await getCasaByRoomId(beds24RoomId);
  if (existing) {
    return NextResponse.json({
      error: `Beds24 roomId ${beds24RoomId} già associato alla casa "${existing.nome}"`,
    }, { status: 409 });
  }

  const casa: Casa = {
    id:                  crypto.randomUUID(),
    nome,
    beds24RoomId,
    indirizzo:           typeof body.indirizzo === 'string' ? body.indirizzo.trim() : undefined,
    note:                typeof body.note === 'string' ? body.note.trim() : undefined,
    keybox:              typeof body.keybox === 'string' ? body.keybox.trim() : undefined,
    fotoUrls:            sanitizeStringArray(body.fotoUrls),
    dotazioni:           sanitizeDotazioni(body.dotazioni),
    vociNonApplicabili:  sanitizeVociNA(body.vociNonApplicabili),
    archiviata:          false,
    createdAt:           Date.now(),
    updatedAt:           Date.now(),
  };

  try {
    await saveCasa(casa);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }

  return NextResponse.json({ casa }, { status: 201 });
}

// ─── Sanitizers ──────────────────────────────────────────────────────────────

function sanitizeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map(x => x.trim());
}

function sanitizeDotazioni(v: unknown): DotazioneTecnica[] {
  if (!Array.isArray(v)) return [];
  const out: DotazioneTecnica[] = [];
  for (const item of v) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const chiave = typeof r.chiave === 'string' ? r.chiave.trim() : '';
    const valore = typeof r.valore === 'string' ? r.valore.trim() : '';
    if (chiave) out.push({ chiave, valore });
  }
  return out;
}

function sanitizeVociNA(v: unknown): VoceNonApplicabile[] {
  if (!Array.isArray(v)) return [];
  const out: VoceNonApplicabile[] = [];
  for (const item of v) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    if (typeof r.ruolo !== 'string' || typeof r.voceId !== 'string') continue;
    out.push({
      ruolo:  r.ruolo as VoceNonApplicabile['ruolo'],
      voceId: r.voceId.trim(),
      motivo: typeof r.motivo === 'string' && r.motivo.trim() ? r.motivo.trim() : undefined,
    });
  }
  return out;
}
