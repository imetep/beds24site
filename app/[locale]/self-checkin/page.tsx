import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import SelfCheckinPage from '@/components/self-checkin/SelfCheckinPage';

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
    it: 'Check-in online — LivingApple',
    en: 'Online check-in — LivingApple',
    de: 'Online-Check-in — LivingApple',
    pl: 'Check-in online — LivingApple',
  };
  const descriptions: Record<Locale, string> = {
    it: 'Come funziona il check-in online nelle strutture LivingApple. Procedura obbligatoria ai sensi dell\'art. 109 TULPS. 5 passi, 10 minuti.',
    en: 'How online check-in works at LivingApple properties. Mandatory procedure under Art. 109 TULPS. 5 steps, 10 minutes.',
    de: 'So funktioniert der Online-Check-in bei LivingApple. Pflichtverfahren gemäß Art. 109 TULPS. 5 Schritte, 10 Minuten.',
    pl: 'Jak działa check-in online w obiektach LivingApple. Obowiązkowa procedura zgodnie z art. 109 TULPS. 5 kroków, 10 minut.',
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

export default async function SelfCheckinRoute({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const contactSlugs: Record<Locale, string> = {
    it: 'contatti', en: 'contact', de: 'kontakt', pl: 'kontakt',
  };

  return (
    <SelfCheckinPage
      locale={locale}
      wizardHref={`/${locale}/self-checkin/wizard`}
      contactHref={`/${locale}/${contactSlugs[locale]}`}
    />
  );
}
