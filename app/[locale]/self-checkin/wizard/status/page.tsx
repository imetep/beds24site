import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import { getTranslations } from '@/lib/i18n';
import StatusCheckin from '@/components/self-checkin/StatusCheckin';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return { robots: 'noindex' };
  return { title: getTranslations(locale).components.statusCheckin.metaTitle, robots: 'noindex' };
}

export default async function StatusPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <StatusCheckin locale={locale} />;
}
