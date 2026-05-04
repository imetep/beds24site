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
  // Default = dati reali LIVINGAPPLE S.R.L. (Unicredit). Env vars BANK_*
  // su Vercel li sovrascrivono se serve cambiarli senza rideploy.
  const holder = process.env.BANK_HOLDER || 'LIVINGAPPLE S.R.L.';
  const iban = process.env.BANK_IBAN || 'IT76W0200874030000102587025';
  const bic = process.env.BANK_BIC || 'UNCRITM1431';
  const bankName = process.env.BANK_NAME || 'Unicredit';

  // Causale richiesta dalla legge bonifici: identifica univocamente l'operazione
  const causale = `Preventivo ${opts.preventivoId.toUpperCase()} - ${opts.customerName}`.slice(0, 140);

  return { holder, iban, bic, bankName, causale, amount: opts.amount };
}
