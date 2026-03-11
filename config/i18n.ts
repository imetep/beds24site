export const locales = ['it', 'en', 'de', 'pl'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'it';

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}