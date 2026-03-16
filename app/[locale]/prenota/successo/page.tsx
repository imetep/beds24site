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
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '2rem',
      paddingBottom: '3rem',
    }}>
      <Suspense fallback={
        <div style={{ textAlign: 'center', padding: '4rem', color: '#999', fontFamily: 'sans-serif' }}>
          ⏳ Verifica pagamento...
        </div>
      }>
        <SuccessContent locale={locale} />
      </Suspense>
    </main>
  );
}
