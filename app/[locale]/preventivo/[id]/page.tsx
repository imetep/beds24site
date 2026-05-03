import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import { getPreventivo } from '@/lib/preventivo-kv';
import type { Preventivo } from '@/lib/preventivo-types';
import PreventivoClient from '@/components/preventivo/PreventivoClient';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale).components.preventivoView;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    robots: { index: false, follow: false }, // i preventivi sono privati
  };
}

export default async function PreventivoPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();

  const raw = await getPreventivo(id);
  if (!raw) notFound();

  // Auto-flag expired al volo: il TTL Upstash farà il cleanup definitivo
  const now = Date.now();
  const preventivo: Preventivo =
    raw.status === 'active' && raw.expiresAt < now
      ? { ...raw, status: 'expired' }
      : raw;

  // Sanitizza prima di passare al client (no notes/email/name/phone/bookingId)
  const { notes, customerEmail, customerName, customerPhone, ...safe } = preventivo;

  return <PreventivoClient locale={locale} preventivo={safe} />;
}
