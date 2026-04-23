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
    <main className="page-container" style={{ minHeight: '80vh', padding: '2rem 16px 3rem' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: '#aaa', gap: 12 }}>
          <div style={{ width: 22, height: 22, border: '2px solid #eee', borderTop: '2px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Caricamento...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }>
        <PagaClient locale={locale} />
      </Suspense>
    </main>
  );
}
