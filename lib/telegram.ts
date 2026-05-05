/**
 * lib/telegram.ts
 *
 * Helper per Telegram Bot API. Usato per:
 *   - inviare messaggi all'admin (notifiche segnalazioni, lavoro terminato)
 *   - inviare OTP agli operatori che hanno chatId registrato
 *   - generare deeplink di registrazione (admin crea operatore → URL t.me/<bot>?start=<token>
 *     l'operatore clicca, il webhook /api/telegram/webhook riceve /start <token>,
 *     lega chatId ↔ operatore)
 *   - validare le richieste webhook in ingresso (X-Telegram-Bot-Api-Secret-Token)
 *
 * Env richieste:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_BOT_USERNAME
 *   TELEGRAM_WEBHOOK_SECRET
 *   TELEGRAM_ADMIN_CHAT_ID   (opzionale finché admin non si registra al bot)
 */

const TG_API = 'https://api.telegram.org';

function botToken(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error('[telegram] TELEGRAM_BOT_TOKEN mancante');
  return t;
}

function botUsername(): string {
  const u = process.env.TELEGRAM_BOT_USERNAME;
  if (!u) throw new Error('[telegram] TELEGRAM_BOT_USERNAME mancante');
  return u;
}

// ─── API call helper ─────────────────────────────────────────────────────────

async function callApi<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${TG_API}/bot${botToken()}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) {
    throw new Error(`[telegram] ${method} fallita: ${data.description ?? 'unknown error'}`);
  }
  return data.result as T;
}

// ─── Send message ────────────────────────────────────────────────────────────

export interface SendMessageOptions {
  parseMode?:             'HTML' | 'MarkdownV2';
  disableNotification?:   boolean;
  replyMarkup?:           unknown;   // inline keyboard / keyboard / remove
}

/**
 * Invia un messaggio testuale a una chat.
 * chatId può essere un numero (utente Telegram) o stringa "@username" per canali.
 * Lancia eccezione se Telegram risponde !ok.
 */
export async function sendMessage(
  chatId:  number | string,
  text:    string,
  options: SendMessageOptions = {},
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
  };
  if (options.parseMode)            body.parse_mode           = options.parseMode;
  if (options.disableNotification)  body.disable_notification = true;
  if (options.replyMarkup)          body.reply_markup         = options.replyMarkup;

  await callApi('sendMessage', body);
}

/**
 * Invia un messaggio all'admin. Cerca il chatId in tre modi (in ordine):
 *   1. env var TELEGRAM_ADMIN_CHAT_ID
 *   2. Redis chiave 'telegram:admin-chat-id' (compilato dal webhook quando
 *      l'admin clicca il deeplink di registrazione)
 * Se nessuno è disponibile, no-op silenzioso + log.
 */
export async function sendToAdmin(text: string, options: SendMessageOptions = {}): Promise<void> {
  const fromEnv = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (fromEnv) {
    await sendMessage(fromEnv, text, options);
    return;
  }
  const fromKv = await getAdminChatIdFromKv();
  if (fromKv) {
    await sendMessage(fromKv, text, options);
    return;
  }
  console.warn('[telegram] sendToAdmin skipped: nessun admin chatId disponibile (env + Redis vuoti)');
}

// ─── Admin chatId in KV ─────────────────────────────────────────────────────

const ADMIN_CHATID_KEY = 'telegram:admin-chat-id';
const ADMIN_REG_PREFIX = 'telegram:admin-registration:';

/**
 * Lazy import @upstash/redis per non agganciare il modulo se non serve.
 * (sendToAdmin è il caller principale; in caso fallisca di import logga.)
 */
async function getKv() {
  const url = process.env.KV_REST_API_URL;
  const tok = process.env.KV_REST_API_TOKEN;
  if (!url || !tok) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({ url, token: tok });
}

export async function getAdminChatIdFromKv(): Promise<string | null> {
  const kv = await getKv();
  if (!kv) return null;
  return kv.get<string>(ADMIN_CHATID_KEY);
}

export async function setAdminChatIdInKv(chatId: number): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error('Redis non configurato');
  await kv.set(ADMIN_CHATID_KEY, String(chatId));
}

/**
 * Salva un token di registrazione admin (single-use, TTL 7gg).
 * Usato dal flusso "/admin/telegram → Genera link admin" → l'admin clicca il
 * deeplink → webhook riceve /start <token> → recupera che è un token admin
 * e setta admin chatId.
 */
export async function saveAdminRegistrationToken(token: string): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error('Redis non configurato');
  await kv.set(`${ADMIN_REG_PREFIX}${token}`, '1', { ex: 7 * 24 * 60 * 60 });
}

export async function consumeAdminRegistrationToken(token: string): Promise<boolean> {
  const kv = await getKv();
  if (!kv) return false;
  const v = await kv.get<string>(`${ADMIN_REG_PREFIX}${token}`);
  if (!v) return false;
  await kv.del(`${ADMIN_REG_PREFIX}${token}`);
  return true;
}

// ─── Deeplink registrazione ─────────────────────────────────────────────────

/**
 * Genera un URL t.me/<bot>?start=<registrationToken> che l'admin condivide
 * all'operatore. L'operatore clicca, Telegram apre la chat con il bot e invia
 * automaticamente "/start <registrationToken>". Il webhook lo intercetta e
 * lega chatId ↔ operatore.
 *
 * Il registrationToken DEVE essere un random univoco e a tempo
 * (gestito da operatori-kv).
 */
export function buildRegistrationDeeplink(registrationToken: string): string {
  return `https://t.me/${botUsername()}?start=${encodeURIComponent(registrationToken)}`;
}

// ─── Webhook validation ──────────────────────────────────────────────────────

/**
 * Verifica che la richiesta webhook arrivi davvero da Telegram, controllando
 * l'header X-Telegram-Bot-Api-Secret-Token contro il TELEGRAM_WEBHOOK_SECRET.
 *
 * NOTA: Telegram include questo header SOLO se è stato registrato il webhook
 * con il parametro secret_token (vedi setWebhook).
 */
export function isValidWebhookRequest(headers: Headers): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;
  const provided = headers.get('x-telegram-bot-api-secret-token');
  return provided === expected;
}

// ─── setWebhook / getWebhookInfo / deleteWebhook ────────────────────────────

/**
 * Registra il webhook per ricevere gli update da Telegram.
 * URL deve essere HTTPS pubblico (in produzione = NEXT_PUBLIC_BASE_URL/api/telegram/webhook).
 * Il secret_token aggiunge un header alle richieste in ingresso per validazione.
 */
export async function setWebhook(url: string): Promise<void> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) throw new Error('[telegram] TELEGRAM_WEBHOOK_SECRET mancante');
  await callApi('setWebhook', {
    url,
    secret_token:    secret,
    drop_pending_updates: false,
    allowed_updates: ['message', 'callback_query'],
  });
}

export async function getWebhookInfo(): Promise<{
  url:             string;
  has_custom_certificate: boolean;
  pending_update_count:   number;
  last_error_date?:       number;
  last_error_message?:    string;
}> {
  return callApi('getWebhookInfo', {});
}

export async function deleteWebhook(): Promise<void> {
  await callApi('deleteWebhook', { drop_pending_updates: false });
}

// ─── Telegram Update types (subset usato qui) ───────────────────────────────

export interface TelegramUpdate {
  update_id: number;
  message?:  TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from?: {
    id:             number;
    is_bot:         boolean;
    first_name:     string;
    last_name?:     string;
    username?:      string;
    language_code?: string;
  };
  chat: {
    id:    number;
    type:  'private' | 'group' | 'supergroup' | 'channel';
    title?:     string;
    username?:  string;
    first_name?: string;
  };
  date: number;
  text?: string;
}

/**
 * Estrae il payload "/start <token>" da un messaggio. Restituisce il token
 * (stringa dopo "/start ") oppure null se non è un comando /start con argomento.
 */
export function parseStartCommand(message: TelegramMessage): string | null {
  const text = (message.text ?? '').trim();
  if (!text.startsWith('/start')) return null;
  const rest = text.slice('/start'.length).trim();
  return rest.length > 0 ? rest : null;
}
