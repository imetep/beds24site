import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
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
  const t = getTranslations(locale).components.depositoClient;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

export default async function DepositoPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const contactSlugs: Record<Locale, string> = {
    it: 'contatti', en: 'contact', de: 'kontakt', pl: 'kontakt',
  };

  return (
    <DepositoClient
      locale={locale}
      contactHref={`/${locale}/${contactSlugs[locale]}`}
      portalHref={`/${locale}/guest/portal`}
    />
  );
}
