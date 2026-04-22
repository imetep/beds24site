import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import PaypalReturnClient from './PaypalReturnClient';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * /[locale]/paypal-return
 *
 * Landing page dopo che PayPal ha completato il flusso di vault save
 * (offerte Flessibile). PayPal redirige qui con ?bookingId=...&token=...
 * dopo che l'utente ha approvato.
 *
 * Il componente client legge `paypal_vault_pending` da sessionStorage
 * (salvato dal wizard prima del redirect) e chiama /api/paypal-confirm-vault
 * per finalizzare il booking + salvare il vault su KV.
 */
export default async function PaypalReturnPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <main className="paypal-return-main">
      <Suspense fallback={null}>
        <PaypalReturnClient locale={locale} />
      </Suspense>
    </main>
  );
}
