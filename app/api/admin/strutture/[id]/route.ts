/**
 * /api/admin/strutture/[id]
 *
 *   GET    → casa
 *   PATCH  → aggiorna campi (anche archiviata true/false → soft delete)
 *   DELETE → hard delete (solo se la casa non ha mai avuto task; per ora
 *            non controllato, l'admin sa cosa fa)
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCasa,
  saveCasa,
  deleteCasa,
  getCasaByRoomId,
} from '@/lib/case-kv';
import type {
  Casa,
  DotazioneTecnica,
  VoceNonApplicabile,
} from '@/lib/case-types';
import { RUOLI } from '@/lib/operatori-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const casa = await getCasa(id);
  if (!casa) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ casa });
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const casa = await getCasa(id);
  if (!casa) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  if (typeof body.nome === 'string') {
    const n = body.nome.trim();
    if (!n) return NextResponse.json({ error: 'Nome vuoto' }, { status: 400 });
    casa.nome = n;
  }

  if (body.beds24RoomId !== undefined) {
    const newRoomId = typeof body.beds24RoomId === 'number'
      ? body.beds24RoomId
      : Number(body.beds24RoomId);
    if (!Number.isFinite(newRoomId) || newRoomId <= 0) {
      return NextResponse.json({ error: 'beds24RoomId non valido' }, { status: 400 });
    }
    if (newRoomId !== casa.beds24RoomId) {
      const existing = await getCasaByRoomId(newRoomId);
      if (existing && existing.id !== casa.id) {
        return NextResponse.json({
          error: `Beds24 roomId ${newRoomId} già associato alla casa "${existing.nome}"`,
        }, { status: 409 });
      }
      casa.beds24RoomId = newRoomId;
    }
  }

  if (typeof body.indirizzo === 'string') casa.indirizzo = body.indirizzo.trim() || undefined;
  if (typeof body.note === 'string')      casa.note      = body.note.trim() || undefined;
  if (typeof body.keybox === 'string')    casa.keybox    = body.keybox.trim() || undefined;

  if (Array.isArray(body.fotoUrls)) {
    casa.fotoUrls = body.fotoUrls
      .filter((x): x is string => typeof x === 'string' && x.trim() !== '')
      .map(x => x.trim());
  }

  if (Array.isArray(body.dotazioni)) {
    const out: DotazioneTecnica[] = [];
    for (const item of body.dotazioni) {
      if (typeof item !== 'object' || item === null) continue;
      const r = item as Record<string, unknown>;
      const chiave = typeof r.chiave === 'string' ? r.chiave.trim() : '';
      const valore = typeof r.valore === 'string' ? r.valore.trim() : '';
      if (chiave) out.push({ chiave, valore });
    }
    casa.dotazioni = out;
  }

  if (Array.isArray(body.vociNonApplicabili)) {
    const out: VoceNonApplicabile[] = [];
    for (const item of body.vociNonApplicabili) {
      if (typeof item !== 'object' || item === null) continue;
      const r = item as Record<string, unknown>;
      if (typeof r.ruolo !== 'string' || !(RUOLI as readonly string[]).includes(r.ruolo)) continue;
      if (typeof r.voceId !== 'string') continue;
      out.push({
        ruolo:  r.ruolo as VoceNonApplicabile['ruolo'],
        voceId: r.voceId.trim(),
        motivo: typeof r.motivo === 'string' && r.motivo.trim() ? r.motivo.trim() : undefined,
      });
    }
    casa.vociNonApplicabili = out;
  }

  if (body.archiviata !== undefined) {
    casa.archiviata = Boolean(body.archiviata);
  }

  casa.updatedAt = Date.now();

  try {
    await saveCasa(casa);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }

  return NextResponse.json({ casa });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await deleteCasa(id);
  return NextResponse.json({ ok: true });
}
