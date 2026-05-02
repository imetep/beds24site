import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import type { Metadata } from 'next';
import GuestPortal from '@/components/guest/GuestPortal';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale);
  return {
    title:       t.portal.metaTitle,
    description: t.portal.login.subtitle,
    robots:      'noindex, nofollow',
  };
}

export default async function GuestPortalPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = getTranslations(locale);

  return <GuestPortal locale={locale} t={t.portal} />;
}
