import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import PrenotazioneSicuraClient from '@/components/prenotazione-sicura/PrenotazioneSicuraClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale).components.prenotazioneSicura;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

export default async function PrenotazioneSicuraPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <PrenotazioneSicuraClient
      locale={locale}
      bookHref={`/${locale}`}
    />
  );
}
