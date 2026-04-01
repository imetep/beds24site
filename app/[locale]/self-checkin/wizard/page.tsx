import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import WizardCheckin from '@/components/self-checkin/WizardCheckin';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: 'Check-in online — LivingApple',
    en: 'Online check-in — LivingApple',
    de: 'Online-Check-in — LivingApple',
    pl: 'Check-in online — LivingApple',
  };
  return { title: titles[locale] ?? titles.it, robots: 'noindex' };
}

export default async function WizardPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return <WizardCheckin locale={locale} />;
}
