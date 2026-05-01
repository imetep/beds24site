import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import ContattiClient from '@/components/contatti/ContattiClient';
import { getTranslations } from '@/lib/i18n';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale).components.contatti;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

export default async function ContattiPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <ContattiClient
      locale={locale}
      bookHref={`/${locale}`}
    />
  );
}
