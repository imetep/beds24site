import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import { getTranslations } from '@/lib/i18n';
import WizardCheckin from '@/components/self-checkin/WizardCheckin';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return { robots: 'noindex' };
  return { title: getTranslations(locale).components.selfCheckin.metaTitle, robots: 'noindex' };
}

export default async function WizardPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return <WizardCheckin locale={locale} />;
}
