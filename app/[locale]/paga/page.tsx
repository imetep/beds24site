import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import PagaClient from './PagaClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PagaPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <main className="page-container page-container--wide paga-main">
      <Suspense fallback={
        <div className="page-loading">
          <div className="page-loading__spinner" />
          Caricamento...
        </div>
      }>
        <PagaClient locale={locale} />
      </Suspense>
    </main>
  );
}
