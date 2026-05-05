/**
 * lib/operatori-types.ts
 *
 * Tipi per il modello operatori, autenticazione e legame Telegram.
 *
 * Modello auth dual-mode:
 *   - username/password (sempre disponibile)
 *   - OTP via Telegram (solo se l'operatore ha completato la registrazione bot
 *     cliccando il deeplink t.me/<bot>?start=<registrationToken>)
 */

// ─── Ruoli ───────────────────────────────────────────────────────────────────

export const RUOLI = ['pulizie', 'manutentore', 'giardiniere', 'receptionist'] as const;
export type Ruolo = typeof RUOLI[number];

export const RUOLO_LABEL: Record<Ruolo, string> = {
  pulizie:      'Pulizie',
  manutentore:  'Manutentore',
  giardiniere:  'Giardiniere',
  receptionist: 'Receptionist',
};

// ─── Operatore ───────────────────────────────────────────────────────────────

export interface Operatore {
  id:                 string;        // uuid
  username:           string;        // slug univoco, lowercase, [a-z0-9-]
  displayName:        string;        // "Maria Rossi"
  ruoli:              Ruolo[];       // multi-ruolo (es. manutentore + giardiniere)

  // Auth password
  passwordHash:       string;        // base64 PBKDF2-SHA256, 32 bytes
  passwordSalt:       string;        // base64, 16 bytes
  passwordIterations: number;        // tipicamente 100_000

  // Telegram (compilato dopo che l'operatore clicca il deeplink di registrazione)
  chatIdTelegram?:    number;
  telegramRegisteredAt?: number;     // epoch ms

  // Stato
  attivo:             boolean;
  createdAt:          number;
  updatedAt:          number;
  createdBy:          'admin';       // per ora solo l'admin può creare
}

// ─── Sessione ────────────────────────────────────────────────────────────────

/**
 * Sessione operatore loggato. Il cookie "op_session" contiene il token.
 * Tipo distinto da quello admin (che usa una password singola condivisa).
 */
export interface OperatoreSession {
  token:        string;      // random 64 char hex
  operatoreId:  string;
  createdAt:    number;
  expiresAt:    number;      // epoch ms
}

export const SESSION_TTL_DAYS = 90;
export const SESSION_TTL_SEC  = SESSION_TTL_DAYS * 24 * 60 * 60;
export const SESSION_COOKIE_NAME = 'op_session';

// ─── OTP via Telegram ────────────────────────────────────────────────────────

/**
 * OTP request: l'operatore inserisce username, sistema verifica che abbia
 * chatIdTelegram, genera codice 6 cifre, lo invia via bot, salva l'OTP
 * con TTL 5 min. L'operatore inserisce il codice nella pagina login.
 */
export interface OtpRequest {
  operatoreId: string;
  codice:      string;       // 6 cifre
  tentativi:   number;       // max 3, poi invalida
  createdAt:   number;
  expiresAt:   number;       // epoch ms (createdAt + 5 min)
}

export const OTP_TTL_SEC      = 5 * 60;
export const OTP_MAX_TRIES    = 3;
export const OTP_COOLDOWN_SEC = 60;        // 1 nuova richiesta al minuto

// ─── Registration token (deeplink Telegram) ──────────────────────────────────

/**
 * Quando l'admin crea o ricrea l'invito Telegram per un operatore, genera un
 * registrationToken random. L'admin condivide il deeplink con l'operatore.
 * L'operatore clicca, manda /start <token> al bot, il webhook lega chatId.
 *
 * TTL 7 giorni: tempo abbondante per condividere il link senza farlo scadere.
 */
export interface RegistrationToken {
  token:       string;       // random 32 char hex
  operatoreId: string;
  createdAt:   number;
  expiresAt:   number;       // epoch ms (createdAt + 7 giorni)
}

export const REGISTRATION_TTL_SEC = 7 * 24 * 60 * 60;

// ─── Validazione username ────────────────────────────────────────────────────

/** Regex per username: [a-z0-9-], 3-30 caratteri, no trattini iniziali/finali. */
export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

export function isValidUsername(s: string): boolean {
  return USERNAME_REGEX.test(s);
}

/** Slugifica un nome reale ("Maria Rossi") in uno username candidato ("maria-rossi"). */
export function slugifyUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}
