/**
 * /api/admin/operatori/[id]
 *
 *   GET    → operatore (publicView, senza hash/salt)
 *   PATCH  → aggiorna campi modificabili: displayName, ruoli, attivo, username
 *           (la password si cambia via /reset-password, il chatId via webhook
 *            Telegram, non da qui)
 *   DELETE → hard delete (rimuove anche indici by-username e by-chatId)
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOperatore,
  saveOperatore,
  deleteOperatore,
  getOperatoreByUsername,
} from '@/lib/operatori-kv';
import {
  isValidUsername,
  RUOLI,
  type Operatore,
  type Ruolo,
} from '@/lib/operatori-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

function publicView(op: Operatore) {
  return {
    id:                    op.id,
    username:              op.username,
    displayName:           op.displayName,
    ruoli:                 op.ruoli,
    chatIdTelegram:        op.chatIdTelegram ?? null,
    telegramRegisteredAt:  op.telegramRegisteredAt ?? null,
    attivo:                op.attivo,
    createdAt:             op.createdAt,
    updatedAt:             op.updatedAt,
  };
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const op = await getOperatore(id);
  if (!op) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ operatore: publicView(op) });
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

interface PatchBody {
  username?:    unknown;
  displayName?: unknown;
  ruoli?:       unknown;
  attivo?:      unknown;
  /** Se true, scolega chatId Telegram (force re-registration). */
  unlinkTelegram?: unknown;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const op = await getOperatore(id);
  if (!op) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  // username
  if (typeof body.username === 'string') {
    const u = body.username.trim().toLowerCase();
    if (!isValidUsername(u)) {
      return NextResponse.json({ error: 'Username non valido' }, { status: 400 });
    }
    if (u !== op.username) {
      const existing = await getOperatoreByUsername(u);
      if (existing && existing.id !== op.id) {
        return NextResponse.json({ error: `Username "${u}" già in uso` }, { status: 409 });
      }
      op.username = u;
    }
  }

  // displayName
  if (typeof body.displayName === 'string') {
    const dn = body.displayName.trim();
    if (!dn) return NextResponse.json({ error: 'displayName vuoto' }, { status: 400 });
    op.displayName = dn;
  }

  // ruoli
  if (Array.isArray(body.ruoli)) {
    const ruoli = (body.ruoli as unknown[])
      .filter((r): r is Ruolo => typeof r === 'string' && (RUOLI as readonly string[]).includes(r));
    if (ruoli.length === 0) {
      return NextResponse.json({ error: 'Almeno un ruolo richiesto' }, { status: 400 });
    }
    op.ruoli = ruoli;
  }

  // attivo
  if (body.attivo !== undefined) {
    op.attivo = Boolean(body.attivo);
  }

  // unlinkTelegram (rimuove chatId — l'operatore dovrà rifare la registrazione via deeplink)
  if (body.unlinkTelegram === true) {
    op.chatIdTelegram = undefined;
    op.telegramRegisteredAt = undefined;
  }

  op.updatedAt = Date.now();
  await saveOperatore(op);
  return NextResponse.json({ operatore: publicView(op) });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await deleteOperatore(id);
  return NextResponse.json({ ok: true });
}
