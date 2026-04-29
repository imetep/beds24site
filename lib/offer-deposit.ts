import type {
  PropertyConfigResponse,
  PropertyConfig,
  OfferConfig,
  DepositScheme,
} from '@/app/api/property-config/route';

/**
 * Helper condivisi per interpretare la configurazione deposito di un'offerta
 * Beds24. Importati da WizardStep2 (isFlexOffer + calcolo amount) e
 * stripe-session.
 *
 * Regola di mapping (verificata empiricamente su tutte le 5 property):
 * - bookingType === 'confirmedWithDepositCollection1' → depositPayment1 (oggi 100%)
 * - bookingType === 'confirmedWithDepositCollection2' → depositPayment2 (oggi 50%)
 * - bookingType === 'confirmedWithCreditCard'         → flex: carta salvata, 0 ora
 * - bookingType === 'autoConfirmed'                   → nessun pagamento
 * - bookingType === 'default'                         → usa il default della property
 *
 * NB: se config è null (fetch fallito / non ancora caricato), i lookup cadono
 * in fallback che non rompono il wizard — semplicemente si torna al
 * comportamento pre-integrazione (100% addebitato, nessun flex).
 */

/** Trova la property che contiene un certo roomId nella config cache. */
export function findPropertyByRoom(
  config: PropertyConfigResponse | null,
  roomId: number | null,
): PropertyConfig | null {
  if (!config || roomId == null) return null;
  for (const p of config.properties) {
    if (p.rooms.some(r => r.roomId === roomId)) return p;
  }
  return null;
}

/** Trova una specifica offerta (per roomId + offerId) nella config cache. */
export function findOffer(
  config: PropertyConfigResponse | null,
  roomId: number | null,
  offerId: number | null,
): OfferConfig | null {
  if (!config || roomId == null || offerId == null) return null;
  for (const p of config.properties) {
    for (const r of p.rooms) {
      if (r.roomId !== roomId) continue;
      return r.offers.find(o => o.offerId === offerId) ?? null;
    }
  }
  return null;
}

/** true se l'offerta è una "flex" (carta salvata, nessun addebito immediato). */
export function isFlexBookingType(bookingType: string | null | undefined): boolean {
  return bookingType === 'confirmedWithCreditCard';
}

/**
 * Calcola `chargeAt` (ISO8601 UTC) — quando il cron PayPal deve addebitare
 * il vault Flex — partendo dal check-in e dai giorni di cancellazione
 * gratuita letti da Beds24 per la specifica offerta.
 *
 * Es. Flex60 con check-in 2026-07-03 → chargeAt 2026-05-04 (60 giorni prima).
 *
 * @param checkInYmd  data di arrivo 'YYYY-MM-DD'
 * @param daysBeforeArrival
 *   giorni letti dall'offer config Beds24 (OfferConfig.cancellationDaysBeforeArrival).
 *   Fallback a 1 giorno se null/undefined — preferiamo un addebito tardivo
 *   rispetto a perderlo del tutto.
 * @returns ISO8601 UTC o null se input non valido
 */
export function computeVaultChargeAt(
  checkInYmd: string | null | undefined,
  daysBeforeArrival?: number | null,
): string | null {
  if (!checkInYmd) return null;
  const ci = Date.parse(`${checkInYmd}T00:00:00Z`);
  if (!Number.isFinite(ci)) return null;
  const days = typeof daysBeforeArrival === 'number' && daysBeforeArrival > 0
    ? daysBeforeArrival
    : 1;
  return new Date(ci - days * 24 * 3600 * 1000).toISOString();
}

/**
 * Calcola l'importo da addebitare ORA in base al bookingType dell'offerta e
 * al paymentCollection della property. Restituisce 0 per offerte flex.
 *
 * @param total            totale prenotazione (soggiorno + tasse + extras)
 * @param offer            offerta selezionata (con bookingType)
 * @param property         property config (contiene paymentCollection)
 * @returns importo in €, oppure `total` come fallback sicuro se config assente
 */
export function computeDepositAmount(
  total: number,
  offer: OfferConfig | null,
  property: PropertyConfig | null,
): number {
  // Fallback sicuro: se non abbiamo config, addebitiamo tutto (stato pre-patch).
  if (!offer || !property) return total;

  const scheme = resolveBookingType(offer.bookingType, property.bookingTypeDefault);

  switch (scheme) {
    case 'confirmedWithDepositCollection1':
      return applyDepositScheme(total, property.paymentCollection.depositPayment1);
    case 'confirmedWithDepositCollection2':
      return applyDepositScheme(total, property.paymentCollection.depositPayment2);
    case 'confirmedWithCreditCard':
      return 0; // flex: carta solo salvata, nessun addebito ora
    case 'autoConfirmed':
      return 0; // nessun pagamento richiesto
    default:
      console.warn('[offer-deposit] bookingType non riconosciuto, fallback 100%:', scheme);
      return total;
  }
}

/** Risolve 'default' → bookingType della property. */
function resolveBookingType(
  offerBookingType: string,
  propertyDefault: string | null,
): string {
  if (offerBookingType && offerBookingType !== 'default') return offerBookingType;
  return propertyDefault ?? 'confirmedWithDepositCollection1';
}

/**
 * Applica uno schema di deposito (fixedAmount / percentage / firstNight) al
 * totale. Per ora supportiamo fixedAmount e percentage (l'unico 'type' visto
 * in produzione). Gli altri tipi loggano un warning e cadono in fallback 100%.
 */
function applyDepositScheme(total: number, scheme: DepositScheme | null): number {
  if (!scheme) return total;

  // fixedAmount ha priorità se > 0 (documentazione Beds24: può essere fisso)
  if (scheme.fixedAmount && scheme.fixedAmount > 0) {
    return Math.min(scheme.fixedAmount, total);
  }

  const va = scheme.variableAmount;
  if (!va) return total;

  if (va.type === 'percentage') {
    const pct = Number(va.percentageValue ?? 100);
    return Math.round(total * pct) / 100;
  }

  console.warn('[offer-deposit] variableAmount.type non supportato:', va.type);
  return total;
}
