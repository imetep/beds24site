import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import DepositoClient from '@/components/deposito/DepositoClient';

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
    it: 'Deposito cauzionale — LivingApple',
    en: 'Security deposit — LivingApple',
    de: 'Kaution — LivingApple',
    pl: 'Kaucja — LivingApple',
  };
  const descriptions: Record<Locale, string> = {
    it: 'Come funziona il deposito cauzionale nelle strutture LivingApple. Versamento online con Stripe o in persona all\'arrivo con carta di credito.',
    en: 'How the security deposit works at LivingApple properties. Pay online via Stripe or in person on arrival with a credit card.',
    de: 'So funktioniert die Kaution bei LivingApple. Online per Stripe oder persönlich bei der Ankunft mit Kreditkarte.',
    pl: 'Jak działa kaucja w obiektach LivingApple. Płatność online przez Stripe lub osobiście przy zameldowaniu kartą kredytową.',
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

export default async function DepositoPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const contactSlugs: Record<Locale, string> = {
    it: 'contatti', en: 'contact', de: 'kontakt', pl: 'kontakt',
  };
  const portalSlugs: Record<Locale, string> = {
    it: 'guest/portal', en: 'guest/portal', de: 'guest/portal', pl: 'guest/portal',
  };

  return (
    <DepositoClient
      locale={locale}
      contactHref={`/${locale}/${contactSlugs[locale]}`}
      portalHref={`/${locale}/${portalSlugs[locale]}`}
    />
  );
}
