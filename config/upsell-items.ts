/**
 * config/upsell-items.ts
 *
 * Nomi e descrizioni degli upsell items hardcodati per lingua.
 * I dati operativi (type, amount, per, period) vengono letti da Beds24
 * via GET /properties?includeUpsellItems=true e sovrascrivono quelli qui.
 *
 * Struttura: propertyId → index Beds24 → { name, description }
 *
 * Quando Beds24 esporrà i testi via API, questa config potrà essere
 * eliminata e sostituita con la chiamata diretta.
 *
 * Per aggiungere un nuovo upsell:
 *   1. Configuralo in Beds24 (Settings → Booking Engine → Upsell Items)
 *   2. Annota l'index assegnato da Beds24
 *   3. Aggiungi qui nome e descrizione nelle 4 lingue
 */

export interface UpsellItemTexts {
  name: Record<'it' | 'en' | 'de' | 'pl', string>;
  description?: Record<'it' | 'en' | 'de' | 'pl', string>;
}

// propertyId → index Beds24 → testi
export const UPSELL_TEXTS: Record<number, Record<number, UpsellItemTexts>> = {

  // ── Livingapple campagna (46487) ─────────────────────────────────────────
  46487: {
    1: {
      name: {
        it: 'Lettino da campeggio con biancheria',
        en: 'Camp cot with bedding',
        de: 'Feldbett mit Bettwäsche',
        pl: 'Łóżko polowe z pościelą',
      },
    },
  },

  // ── Livingapple beach (46871) ────────────────────────────────────────────
  46871: {
    1: {
      name: {
        it: 'Lettino da campeggio con biancheria',
        en: 'Camp cot with bedding',
        de: 'Feldbett mit Bettwäsche',
        pl: 'Łóżko polowe z pościelą',
      },
    },
  },

};

/**
 * Helper — restituisce i testi per un upsell item dato propertyId e index.
 * Ritorna null se non trovato (item obbligatorio o non configurato).
 */
export function getUpsellTexts(
  propertyId: number,
  index: number
): UpsellItemTexts | null {
  return UPSELL_TEXTS[propertyId]?.[index] ?? null;
}
