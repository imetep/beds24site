import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import DoveSiamoClient from '@/components/dove-siamo/DoveSiamoClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<Locale, string> = {
    it: 'Dove siamo — Scauri (LT) | LivingApple',
    en: 'Where We Are — Scauri (LT) | LivingApple',
    de: 'Lage — Scauri (LT) | LivingApple',
    pl: 'Lokalizacja — Scauri (LT) | LivingApple',
  };
  const descriptions: Record<Locale, string> = {
    it: 'Scauri è una piccola perla sul Tirreno, tra Roma e Napoli. Scopri come raggiungerci in auto, treno o aereo e perché è la meta ideale per le tue vacanze.',
    en: 'Scauri is a hidden gem on the Tyrrhenian coast, between Rome and Naples. Find out how to reach us by car, train or plane and why it\'s the perfect holiday destination.',
    de: 'Scauri ist ein verborgenes Juwel an der Tyrrhenischen Küste, zwischen Rom und Neapel. Erfahren Sie, wie Sie uns mit dem Auto, Zug oder Flugzeug erreichen.',
    pl: 'Scauri to ukryty klejnot wybrzeża Tyrreńskiego, między Rzymem a Neapolem. Dowiedz się, jak do nas dotrzeć samochodem, pociągiem lub samolotem.',
  };

  if (!isValidLocale(locale)) return {};
  return {
    title: titles[locale],
    description: descriptions[locale],
    alternates: {
      canonical: `https://livingapple.it/${locale}/dove-siamo`,
      languages: {
        'it': 'https://livingapple.it/it/dove-siamo',
        'en': 'https://livingapple.it/en/dove-siamo',
        'de': 'https://livingapple.it/de/dove-siamo',
        'pl': 'https://livingapple.it/pl/dove-siamo',
      },
    },
  };
}

export default async function DoveSiamoPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const bookSlugs: Record<Locale, string> = {
    it: 'prenota', en: 'book', de: 'buchen', pl: 'rezerwuj',
  };

  return (
    <DoveSiamoClient
      locale={locale}
      bookHref={`/${locale}/${bookSlugs[locale]}`}
    />
  );
}
