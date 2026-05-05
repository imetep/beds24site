/**
 * /api/admin/operatori
 *
 * Gestione operatori dal pannello admin.
 *
 *   GET  → lista operatori (senza passwordHash/Salt)
 *   POST → crea operatore { username, displayName, ruoli, password, attivo }
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 * Risposte: passwordHash/Salt MAI esposti.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listOperatori,
  saveOperatore,
  getOperatoreByUsername,
} from '@/lib/operatori-kv';
import { hashPassword } from '@/lib/operatori-auth';
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

/** Strip campi sensibili prima di restituire al client. */
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

// ─── GET list ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const ops = await listOperatori();
  return NextResponse.json({ operatori: ops.map(publicView) });
}

// ─── POST create ─────────────────────────────────────────────────────────────

interface CreateBody {
  username?:    unknown;
  displayName?: unknown;
  ruoli?:       unknown;
  password?:    unknown;
  attivo?:      unknown;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  // Validazione input
  const username    = typeof body.username    === 'string' ? body.username.trim().toLowerCase() : '';
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const password    = typeof body.password    === 'string' ? body.password : '';
  const attivo      = body.attivo === undefined ? true : Boolean(body.attivo);

  if (!isValidUsername(username)) {
    return NextResponse.json({
      error: 'Username deve essere 3-30 caratteri [a-z0-9-], no trattini iniziali/finali',
    }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ error: 'Nome visualizzato richiesto' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minima 6 caratteri' }, { status: 400 });
  }

  if (!Array.isArray(body.ruoli) || body.ruoli.length === 0) {
    return NextResponse.json({ error: 'Almeno un ruolo richiesto' }, { status: 400 });
  }
  const ruoli = (body.ruoli as unknown[])
    .filter((r): r is Ruolo => typeof r === 'string' && (RUOLI as readonly string[]).includes(r));
  if (ruoli.length === 0) {
    return NextResponse.json({ error: 'Ruoli non validi' }, { status: 400 });
  }

  // Univocità username
  const existing = await getOperatoreByUsername(username);
  if (existing) {
    return NextResponse.json({ error: `Username "${username}" già in uso` }, { status: 409 });
  }

  // Hash password
  const hashed = await hashPassword(password);

  const now = Date.now();
  const op: Operatore = {
    id:                  crypto.randomUUID(),
    username,
    displayName,
    ruoli,
    passwordHash:        hashed.hash,
    passwordSalt:        hashed.salt,
    passwordIterations:  hashed.iterations,
    attivo,
    createdAt:           now,
    updatedAt:           now,
    createdBy:           'admin',
  };

  await saveOperatore(op);
  return NextResponse.json({ operatore: publicView(op) }, { status: 201 });
}
