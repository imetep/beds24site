/**
 * lib/i18n.ts
 *
 * FIX: static imports invece di dynamic import con template literal.
 * Il dynamic import causava SyntaxError JSON in Turbopack (Next.js 16).
 */

import type { Locale } from '@/config/i18n';

import it from '@/locales/it/common.json';
import en from '@/locales/en/common.json';
import de from '@/locales/de/common.json';
import pl from '@/locales/pl/common.json';

const translations = { it, en, de, pl };

export function getTranslations(locale: Locale) {
  return translations[locale];
}
