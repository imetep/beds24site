import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import { getPreventivo } from '@/lib/preventivo-kv';
import PreventivoPagaClient from '@/components/preventivo/PreventivoPagaClient';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale).components.preventivoPaga;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function PreventivoPagaPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();

  const raw = await getPreventivo(id);
  if (!raw) notFound();

  // Sanitizza dati interni
  const { notes, customerEmail, customerName, customerPhone, ...safe } = raw;

  // Feature flags lato server (non NEXT_PUBLIC_ per non bakare in build client)
  const stripeEnabled = process.env.STRIPE_ENABLED === '1';
  const paypalEnabled = process.env.PAYPAL_ENABLED !== '0'; // default attivo

  return (
    <PreventivoPagaClient
      locale={locale}
      preventivo={safe}
      stripeEnabled={stripeEnabled}
      paypalEnabled={paypalEnabled}
    />
  );
}
