import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import HomeSearch from '@/components/home/HomeSearch';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <main>
      <Suspense fallback={<div className="vh-100" />}>
        <HomeSearch locale={locale} />
      </Suspense>
    </main>
  );
}
