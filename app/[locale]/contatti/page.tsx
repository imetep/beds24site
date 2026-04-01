import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import type { Metadata } from 'next';
import ContattiClient from '@/components/contatti/ContattiClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: 'Contatti — LivingApple',
    en: 'Contact Us — LivingApple',
    de: 'Kontakt — LivingApple',
    pl: 'Kontakt — LivingApple',
  };
  const descriptions: Record<Locale, string> = {
    it: 'Contatta LivingApple via WhatsApp, telefono o email. Risposte alle domande frequenti sulle nostre ville e appartamenti vacanza a Scauri (LT).',
    en: 'Contact LivingApple via WhatsApp, phone or email. Answers to frequently asked questions about our holiday villas and apartments in Scauri (LT).',
    de: 'Kontaktieren Sie LivingApple per WhatsApp, Telefon oder E-Mail. Antworten auf häufig gestellte Fragen zu unseren Ferienwohnungen in Scauri (LT).',
    pl: 'Skontaktuj się z LivingApple przez WhatsApp, telefon lub email. Odpowiedzi na często zadawane pytania o nasze apartamenty wakacyjne w Scauri (LT).',
  };
  if (!isValidLocale(locale)) return {};
  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

export default async function ContattiPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const bookSlugs: Record<Locale, string> = {
    it: 'prenota', en: 'book', de: 'buchen', pl: 'rezerwuj',
  };

  return (
    <ContattiClient
      locale={locale}
      bookHref={`/${locale}/${bookSlugs[locale]}`}
    />
  );
}
