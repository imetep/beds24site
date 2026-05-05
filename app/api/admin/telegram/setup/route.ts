/**
 * /api/admin/telegram/setup
 *
 * Endpoint admin per configurare/diagnosticare l'integrazione Telegram.
 *
 *   GET    → restituisce stato corrente del webhook (getWebhookInfo).
 *   POST   → registra il webhook su Telegram con NEXT_PUBLIC_BASE_URL.
 *   DELETE → de-registra il webhook (utile per debug locale).
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD (stesso schema delle altre
 * route /api/admin/*).
 *
 * Note: Telegram esige URL HTTPS pubblico. In sviluppo locale (localhost) la
 * registrazione fallirà; setWebhook va eseguito DOPO il deploy in produzione.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  setWebhook,
  getWebhookInfo,
  deleteWebhook,
} from '@/lib/telegram';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

function buildWebhookUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/api/telegram/webhook`;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const info = await getWebhookInfo();
    return NextResponse.json({
      info,
      expectedUrl:    buildWebhookUrl(),
      botUsername:    process.env.TELEGRAM_BOT_USERNAME,
      adminChatIdSet: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = buildWebhookUrl();
  if (!url) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_BASE_URL non settato' },
      { status: 400 },
    );
  }
  if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
    return NextResponse.json(
      { error: 'URL locale non valido per Telegram. Esegui in produzione.', url },
      { status: 400 },
    );
  }
  try {
    await setWebhook(url);
    const info = await getWebhookInfo();
    return NextResponse.json({ ok: true, url, info });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await deleteWebhook();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
