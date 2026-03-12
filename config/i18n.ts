/**
 * config/i18n.ts
 *
 * Configurazione multilingua.
 * Aggiungere una lingua = aggiungere il codice qui + creare locales/{code}/common.json
 */

export const locales = ['it', 'en', 'de', 'pl'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'it';

/** Nomi visualizzati nel language switcher */
export const localeLabels: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
  de: 'Deutsch',
  pl: 'Polski',
};

/** Slug localizzati per ogni pagina */
export const localeSlugs: Record<string, Record<Locale, string>> = {
  location:   { it: 'dove-siamo',  en: 'location',   de: 'lage',       pl: 'lokalizacja' },
  contact:    { it: 'contatti',    en: 'contact',     de: 'kontakt',    pl: 'kontakt'     },
  residences: { it: 'residenze',   en: 'residences',  de: 'residenzen', pl: 'rezydencje'  },
  book:       { it: 'prenota',     en: 'book',        de: 'buchen',     pl: 'rezerwuj'    },
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
