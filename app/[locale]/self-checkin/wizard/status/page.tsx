import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import StatusCheckin from '@/components/self-checkin/StatusCheckin';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: 'Stato richiesta check-in — LivingApple',
    en: 'Check-in request status — LivingApple',
    de: 'Check-in Status — LivingApple',
    pl: 'Status check-in — LivingApple',
  };
  return { title: titles[locale] ?? titles.it, robots: 'noindex' };
}

export default async function StatusPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <StatusCheckin locale={locale} />;
}
