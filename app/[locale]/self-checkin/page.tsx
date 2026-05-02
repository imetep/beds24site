import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import { getTranslations } from '@/lib/i18n';
import SelfCheckinPage from '@/components/self-checkin/SelfCheckinPage';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale).components.selfCheckin;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

export default async function SelfCheckinRoute({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const contactSlugs: Record<Locale, string> = {
    it: 'contatti', en: 'contact', de: 'kontakt', pl: 'kontakt',
  };

  return (
    <SelfCheckinPage
      locale={locale}
      wizardHref={`/${locale}/self-checkin/wizard`}
      contactHref={`/${locale}/${contactSlugs[locale]}`}
    />
  );
}
