/**
 * /api/admin/telegram/registra-admin
 *
 * POST → genera un deeplink admin e ritorna l'URL t.me/<bot>?start=<token>.
 *        L'admin clicca → bot riceve /start <token> → webhook setta admin
 *        chatId in Redis. Da quel momento sendToAdmin funziona senza
 *        TELEGRAM_ADMIN_CHAT_ID env var.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  buildRegistrationDeeplink,
  saveAdminRegistrationToken,
  getAdminChatIdFromKv,
} from '@/lib/telegram';
import { generateRegistrationToken } from '@/lib/operatori-auth';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Ritorna stato corrente (chatId admin se già registrato)
  const fromEnv = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const fromKv = await getAdminChatIdFromKv();
  return NextResponse.json({
    adminChatId: fromEnv ?? fromKv,
    source:      fromEnv ? 'env' : (fromKv ? 'kv' : null),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const token = generateRegistrationToken();
  await saveAdminRegistrationToken(token);

  let deeplink: string;
  try {
    deeplink = buildRegistrationDeeplink(token);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  return NextResponse.json({
    deeplink,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
}
