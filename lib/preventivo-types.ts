/**
 * lib/preventivo-types.ts
 *
 * Tipi e helper di calcolo per il modulo Preventivo.
 *
 * Ciclo di vita di un Preventivo:
 *   active → (cliente paga online) → converted (booking creata su Beds24)
 *          → (48h senza azione) → expired (admin può rigenerare)
 *          → (admin annulla) → cancelled
 *
 * Lock bonifico: chiave separata `preventivo-lock:{roomId}:{arrival}:{departure}`
 *   con TTL 20 min, sottratta da /api/availability per evitare doppie prenotazioni.
 */

import type { Locale } from '@/config/i18n';

export type PreventivoStatus = 'active' | 'expired' | 'converted' | 'cancelled';

export type PaymentMethod = 'paypal' | 'stripe' | 'bonifico';

export interface PreventivoUpsell {
  /** Index Beds24 dell'upsell item (vedi config/upsell-items.ts) */
  index: number;
  qty: number;
  /** Prezzo unitario in € (digitato da admin) */
  unitPrice: number;
  /** Sconto percentuale 0-100 */
  discountPct: number;
}

export interface Preventivo {
  /** ID URL-safe (es. "k3f9p2") */
  id: string;
  propertyId: number;
  roomId: number;
  /** YYYY-MM-DD */
  arrival: string;
  /** YYYY-MM-DD (esclusivo: notte di partenza) */
  departure: string;
  numAdults: number;
  numChildren: number;
  /** Prezzo base soggiorno in € (digitato da admin) */
  basePrice: number;
  /** Sconto sul base 0-100 */
  baseDiscountPct: number;
  upsells: PreventivoUpsell[];
  /** Lingua iniziale del link condiviso (cliente può cambiare) */
  locale: Locale;
  /** Nota interna admin, non mostrata al cliente */
  notes?: string;
  /** epoch ms */
  createdAt: number;
  /** epoch ms (createdAt + 48h) */
  expiresAt: number;
  status: PreventivoStatus;
  /** Popolato a conversione */
  bookingId?: number;
  paymentMethodChosen?: PaymentMethod;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  /** Importo dell'acconto scelto dal cliente (€) */
  depositAmount?: number;
}

export interface PreventivoLock {
  preventivoId: string;
  roomId: number;
  arrival: string;
  departure: string;
  /** Importo atteso del bonifico in € */
  amount: number;
  /** epoch ms */
  createdAt: number;
}

export interface PreventivoTotals {
  /** Prezzo base lordo (prima dello sconto) */
  baseGross: number;
  baseDiscount: number;
  baseNet: number;
  upsellGross: number;
  upsellDiscount: number;
  upsellNet: number;
  /** Totale finale (baseNet + upsellNet) */
  total: number;
  /** Risparmio totale (baseDiscount + upsellDiscount) */
  totalDiscount: number;
}

/**
 * Calcola i totali di un preventivo applicando gli sconti percentuali.
 * Sconti arrotondati al centesimo.
 */
export function computeTotals(p: Preventivo): PreventivoTotals {
  const baseGross = p.basePrice;
  const baseDiscount = round2(baseGross * (p.baseDiscountPct / 100));
  const baseNet = round2(baseGross - baseDiscount);

  let upsellGross = 0;
  let upsellDiscount = 0;
  for (const u of p.upsells) {
    const lineGross = u.unitPrice * u.qty;
    const lineDiscount = round2(lineGross * (u.discountPct / 100));
    upsellGross += lineGross;
    upsellDiscount += lineDiscount;
  }
  upsellGross = round2(upsellGross);
  upsellDiscount = round2(upsellDiscount);
  const upsellNet = round2(upsellGross - upsellDiscount);

  return {
    baseGross,
    baseDiscount,
    baseNet,
    upsellGross,
    upsellDiscount,
    upsellNet,
    total: round2(baseNet + upsellNet),
    totalDiscount: round2(baseDiscount + upsellDiscount),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Validità in millisecondi (48 ore) */
export const PREVENTIVO_TTL_MS = 48 * 60 * 60 * 1000;

/** Validità in secondi per Upstash EX (48 ore) */
export const PREVENTIVO_TTL_SEC = 48 * 60 * 60;

/** Validità lock bonifico in secondi (20 min) */
export const LOCK_BONIFICO_TTL_SEC = 20 * 60;
