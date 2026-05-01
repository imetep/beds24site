import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import { getTranslations } from '@/lib/i18n';
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
  const t = getTranslations(locale).components.utenzeClient;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

export default async function UtenzePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return <UtenzeClient locale={locale} />;
}
