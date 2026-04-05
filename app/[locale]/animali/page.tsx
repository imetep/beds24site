import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import AnimaliClient from '@/components/animali/AnimaliClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: 'Animali domestici — Regolamento | LivingApple',
    en: 'Pets Policy — LivingApple',
    de: 'Haustiere — Hausordnung | LivingApple',
    pl: 'Zwierzęta domowe — Regulamin | LivingApple',
  };
  const descriptions: Record<Locale, string> = {
    it: 'Regolamento completo per l\'accettazione degli animali domestici nelle strutture LivingApple. Cani ammessi sotto i 15 kg con deposito cauzionale obbligatorio.',
    en: 'Full pet policy for LivingApple properties. Dogs accepted up to 15 kg with mandatory security deposit.',
    de: 'Vollständige Haustierpolitik für LivingApple-Unterkünfte. Hunde bis 15 kg mit obligatorischer Kaution.',
    pl: 'Pełny regulamin dotyczący zwierząt w obiektach LivingApple. Psy do 15 kg z obowiązkową kaucją.',
  };
  if (!isValidLocale(locale)) return {};
  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

export default async function AnimaliPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return <AnimaliClient locale={locale} />;
}
