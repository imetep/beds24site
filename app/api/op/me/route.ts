/**
 * /api/op/me
 *
 * GET → restituisce info dell'operatore loggato (per gating client-side
 *       e onboarding del cookie session).
 *       401 se non autenticato.
 *
 * Risposta: { id, username, displayName, ruoli, hasTelegram }
 */

import { NextResponse } from 'next/server';
import { getCurrentOperatore } from '@/lib/op-session';

export const runtime = 'nodejs';

export async function GET() {
  const op = await getCurrentOperatore();
  if (!op) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    operatore: {
      id:           op.id,
      username:     op.username,
      displayName:  op.displayName,
      ruoli:        op.ruoli,
      hasTelegram:  !!op.chatIdTelegram,
    },
  });
}
