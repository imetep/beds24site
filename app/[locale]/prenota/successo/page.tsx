import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import SuccessContent from './SuccessContent';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function SuccessPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <main className="prenota-success-main">
      <Suspense fallback={
        <div className="prenota-page-loading">
          <i className="bi bi-hourglass-split" aria-hidden="true" /> Verifica pagamento...
        </div>
      }>
        <SuccessContent locale={locale} />
      </Suspense>
    </main>
  );
}
