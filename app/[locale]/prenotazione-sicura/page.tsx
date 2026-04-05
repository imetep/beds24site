import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import PrenotazioneSicuraClient from '@/components/prenotazione-sicura/PrenotazioneSicuraClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: 'Prenotazione sicura — Come verificarci | LivingApple',
    en: 'Safe booking — How to verify us | LivingApple',
    de: 'Sicheres Buchen — Wie Sie uns prüfen können | LivingApple',
    pl: 'Bezpieczna rezerwacja — Jak nas zweryfikować | LivingApple',
  };
  const descriptions: Record<Locale, string> = {
    it: 'LivingApple è un gestore professionale con CIN, P.IVA verificabile e pagamenti tramite Stripe. Scopri come verificarci in 2 minuti prima di prenotare.',
    en: 'LivingApple is a professional operator with a verified CIN, VAT number and Stripe payments. Find out how to verify us in 2 minutes before booking.',
    de: 'LivingApple ist ein professioneller Betreiber mit CIN, verifizierbarer USt-IdNr. und Stripe-Zahlungen. Erfahren Sie, wie Sie uns in 2 Minuten prüfen können.',
    pl: 'LivingApple to profesjonalny zarządca z CIN, weryfikowalnym NIP i płatnościami Stripe. Dowiedz się, jak nas zweryfikować w 2 minuty przed rezerwacją.',
  };
  if (!isValidLocale(locale)) return {};
  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

export default async function PrenotazioneSicuraPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const bookSlugs: Record<Locale, string> = {
    it: 'prenota', en: 'book', de: 'buchen', pl: 'rezerwuj',
  };

  return (
    <PrenotazioneSicuraClient
      locale={locale}
      bookHref={`/${locale}/${bookSlugs[locale]}`}
    />
  );
}
