/**
 * /api/telegram/webhook
 *
 * Endpoint chiamato da Telegram quando il bot riceve un update.
 * Configurato via setWebhook (vedi /api/admin/telegram/setup).
 *
 * Validazione: header X-Telegram-Bot-Api-Secret-Token deve corrispondere a
 * TELEGRAM_WEBHOOK_SECRET. Se non corrisponde → 401.
 *
 * Comandi gestiti:
 *   /start <registrationToken>  → lega il chatId all'operatore identificato
 *                                  dal token (consumato, single-use).
 *   /start                       → saluto generico, istruzioni.
 *   altro testo                  → echo helper.
 *
 * Quando l'admin manda /start <token> dal SUO link di registrazione, lo stesso
 * meccanismo lega il chatId admin a TELEGRAM_ADMIN_CHAT_ID — ma per ora il
 * setup admin è manuale (env var). Vedi /api/admin/telegram/setup.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  isValidWebhookRequest,
  parseStartCommand,
  sendMessage,
  type TelegramUpdate,
} from '@/lib/telegram';
import {
  consumeRegistrationToken,
  getOperatore,
  saveOperatore,
  getOperatoreByChatId,
} from '@/lib/operatori-kv';
import { RUOLO_LABEL } from '@/lib/operatori-types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // 1) Validazione secret (header set da Telegram quando è registrato secret_token)
  if (!isValidWebhookRequest(req.headers)) {
    console.warn('[telegram/webhook] secret token non valido');
    return new NextResponse('unauthorized', { status: 401 });
  }

  // 2) Parsing update
  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new NextResponse('bad request', { status: 400 });
  }

  // 3) Solo messaggi testuali per ora (no callback_query / inline)
  const message = update.message;
  if (!message || !message.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  try {
    // /start con token → registrazione operatore
    const startToken = parseStartCommand(message);
    if (startToken !== null) {
      await handleStart(chatId, startToken, message.from?.first_name);
      return NextResponse.json({ ok: true });
    }

    // /start senza token → istruzioni
    if (text === '/start' || text.toLowerCase() === '/help') {
      await sendMessage(chatId,
        'Ciao! Questo bot è riservato agli operatori LivingApple.\n\n' +
        'Per registrarti, l\'admin deve fornirti un link personale di registrazione. ' +
        'Cliccando il link tornerai qui automaticamente con un codice di attivazione.',
      );
      return NextResponse.json({ ok: true });
    }

    // /codice — restituisci OTP attivo se chatId riconosciuto (futuro: per ora stub)
    if (text.toLowerCase() === '/codice') {
      const op = await getOperatoreByChatId(chatId);
      if (!op) {
        await sendMessage(chatId, 'Non risulti registrato. Chiedi all\'admin un link di registrazione.');
      } else {
        await sendMessage(chatId, `Per richiedere un codice di accesso vai nella pagina di login operatori e usa "Accedi via Telegram" con il tuo username "${op.username}".`);
      }
      return NextResponse.json({ ok: true });
    }

    // Default echo guida
    const op = await getOperatoreByChatId(chatId);
    if (op) {
      await sendMessage(chatId,
        `Ciao ${op.displayName}! Sei registrato come operatore (${op.ruoli.map(r => RUOLO_LABEL[r]).join(', ')}). ` +
        `Riceverai qui notifiche e codici di accesso.\n\n` +
        `Comandi: /codice (info su come richiedere un codice)`,
      );
    } else {
      await sendMessage(chatId, 'Non riconosco questo comando. Chiedi all\'admin un link di registrazione.');
    }
  } catch (err) {
    console.error('[telegram/webhook] errore:', err);
    // Telegram fa retry se rispondiamo non-200, quindi rispondiamo 200 anche dopo errore
    // per evitare loop infiniti.
  }

  return NextResponse.json({ ok: true });
}

// ─── Handler /start <token> ─────────────────────────────────────────────────

async function handleStart(
  chatId:    number,
  token:     string,
  firstName: string | undefined,
): Promise<void> {
  const operatoreId = await consumeRegistrationToken(token);
  if (!operatoreId) {
    await sendMessage(chatId,
      '❌ Link di registrazione non valido o scaduto.\n\n' +
      'Chiedi all\'admin un nuovo link di registrazione.',
    );
    return;
  }

  const op = await getOperatore(operatoreId);
  if (!op) {
    await sendMessage(chatId, '❌ Errore: operatore non trovato. Contatta l\'admin.');
    return;
  }

  // Lega chatId
  op.chatIdTelegram        = chatId;
  op.telegramRegisteredAt  = Date.now();
  op.updatedAt             = Date.now();
  await saveOperatore(op);

  const greet = firstName ? `Ciao ${firstName}!` : 'Ciao!';
  await sendMessage(chatId,
    `${greet} ✅ Registrazione completata.\n\n` +
    `Sei registrato come ${op.displayName} (${op.ruoli.map(r => RUOLO_LABEL[r]).join(', ')}).\n\n` +
    `Da ora puoi accedere all'area operatori usando "Accedi via Telegram" e il tuo username "${op.username}". ` +
    `Riceverai qui anche le notifiche e i codici di accesso.`,
  );
}
