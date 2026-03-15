import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import Wizard from '@/components/wizard/Wizard';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export default async function LocalePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = await getTranslations(locale);

  return (
    <main style={{ minHeight: '80vh', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <Suspense fallback={
        <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
          Caricamento...
        </div>
      }>
        <Wizard translations={t} locale={locale} />
      </Suspense>
    </main>
  );
}
