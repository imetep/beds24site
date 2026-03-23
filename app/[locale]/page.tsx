import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import HomeSearch from '@/components/home/HomeSearch';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export default async function LocalePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = await getTranslations(locale);

  return (
    <main>
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <HomeSearch locale={locale} translations={t} />
      </Suspense>
    </main>
  );
}
