/**
 * /api/admin/segnalazioni/[id]
 *
 *   GET   → dettaglio segnalazione + casa + operatore segnalante + task collegato
 *   PATCH { stato?, notaAdmin?, azioneEffettuata? }
 *         → aggiorna campi. Se stato passa a 'risolta'/'ignorata' setta risoltaAt.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSegnalazione,
  saveSegnalazione,
} from '@/lib/segnalazioni-kv';
import { STATI_SEGNALAZIONE, type StatoSegnalazione } from '@/lib/segnalazioni-types';

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
  const seg = await getSegnalazione(id);
  if (!seg) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ segnalazione: seg });
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

interface PatchBody {
  stato?:            unknown;
  notaAdmin?:        unknown;
  azioneEffettuata?: unknown;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const seg = await getSegnalazione(id);
  if (!seg) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let body: PatchBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 }); }

  if (typeof body.stato === 'string') {
    if (!(STATI_SEGNALAZIONE as readonly string[]).includes(body.stato)) {
      return NextResponse.json({ error: 'stato non valido' }, { status: 400 });
    }
    const newStato = body.stato as StatoSegnalazione;
    seg.stato = newStato;
    if (newStato === 'risolta' || newStato === 'ignorata') {
      if (!seg.risoltaAt) seg.risoltaAt = Date.now();
    } else {
      seg.risoltaAt = undefined;
    }
  }

  if (typeof body.notaAdmin === 'string') {
    seg.notaAdmin = body.notaAdmin.trim() || undefined;
  }
  if (typeof body.azioneEffettuata === 'string') {
    seg.azioneEffettuata = body.azioneEffettuata.trim() || undefined;
  }

  seg.updatedAt = Date.now();
  await saveSegnalazione(seg);
  return NextResponse.json({ segnalazione: seg });
}
