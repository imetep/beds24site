import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import UtenzeClient from '@/components/utenze/UtenzeClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const titles: Record<Locale, string> = {
    it: 'Utenze e consumi energetici — LivingApple',
    en: 'Utilities & energy use — LivingApple',
    de: 'Nebenkosten & Energieverbrauch — LivingApple',
    pl: 'Media i zużycie energii — LivingApple',
  };
  const descriptions: Record<Locale, string> = {
    it: 'Come funzionano i consumi energetici nelle strutture LivingApple a Scauri (LT). Tariffe, consigli pratici per inverno ed estate, stima dei costi.',
    en: 'How energy consumption works at LivingApple properties in Scauri (LT). Rates, practical tips for winter and summer, cost estimates.',
    de: 'Wie der Energieverbrauch in den LivingApple-Unterkünften in Scauri (LT) funktioniert. Tarife, praktische Tipps für Winter und Sommer, Kostenschätzungen.',
    pl: 'Jak działa zużycie energii w obiektach LivingApple w Scauri (LT). Stawki, praktyczne wskazówki na zimę i lato, szacunkowe koszty.',
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

export default async function UtenzePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return <UtenzeClient locale={locale} />;
}
