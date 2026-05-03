/**
 * lib/preventivo-bonifico.ts
 *
 * Dati per bonifico bancario configurabili via env vars.
 * Restituiti dall'API /lock-bonifico e mostrati al cliente nel wizard pagamento.
 *
 * Env vars:
 *   BANK_HOLDER  — intestatario conto (default "LivingApple")
 *   BANK_IBAN    — IBAN destinazione
 *   BANK_BIC     — BIC/SWIFT (opzionale)
 *   BANK_NAME    — nome banca (opzionale, mostrato sotto IBAN)
 */

export interface BonificoDati {
  holder: string;
  iban: string;
  bic?: string;
  bankName?: string;
  causale: string;
  amount: number;
}

export function buildBonificoData(opts: {
  preventivoId: string;
  customerName: string;
  amount: number;
}): BonificoDati {
  const holder = process.env.BANK_HOLDER || 'LivingApple';
  const iban = process.env.BANK_IBAN || 'IT00X0000000000000000000000';
  const bic = process.env.BANK_BIC || undefined;
  const bankName = process.env.BANK_NAME || undefined;

  // Causale richiesta dalla legge bonifici: identifica univocamente l'operazione
  const causale = `Preventivo ${opts.preventivoId.toUpperCase()} - ${opts.customerName}`.slice(0, 140);

  return { holder, iban, bic, bankName, causale, amount: opts.amount };
}
