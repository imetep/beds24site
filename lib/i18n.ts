import { Locale } from '@/config/i18n';

export async function getTranslations(locale: Locale) {
  const translations = await import(`@/locales/${locale}/common.json`);
  return translations.default;
}