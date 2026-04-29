import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import Wizard from '@/components/wizard/Wizard';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrenotaPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = getTranslations(locale);

  return (
    <main className="prenota-page-main">
      {/* useSearchParams() in Wizard richiede Suspense */}
      <Suspense fallback={
        <div className="prenota-page-loading">
          Caricamento...
        </div>
      }>
        <Wizard translations={t} locale={locale} />
      </Suspense>
    </main>
  );
}
