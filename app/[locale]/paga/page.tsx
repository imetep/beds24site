import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/config/i18n';
import PagaClient from './PagaClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export default async function PagaPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <main style={{ minHeight: '80vh', paddingTop: '2rem', paddingBottom: '3rem', maxWidth: 1100, margin: '0 auto', padding: '2rem 16px 3rem' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: '#aaa', gap: 12 }}>
          <div style={{ width: 22, height: 22, border: '2px solid #eee', borderTop: '2px solid #1E73BE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Caricamento...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }>
        <PagaClient locale={locale} />
      </Suspense>
    </main>
  );
}
