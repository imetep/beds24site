import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import { getTranslations } from '@/lib/i18n';
import DoveSiamoClient from '@/components/dove-siamo/DoveSiamoClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale).components.doveSiamo;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
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

  return <DoveSiamoClient locale={locale} />;
}
