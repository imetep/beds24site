'use client';

/**
 * PaypalReturnClient — post-approvazione PayPal vault save.
 *
 * Flusso:
 *  1. Legge `paypal_vault_pending` + `paypal_vault_setupToken` da sessionStorage
 *  2. POST /api/paypal-confirm-vault con tutti i dati
 *  3. Redirect a /prenota/successo?bookingId=X&paypal-vault=1 se OK
 *  4. Se errore: mostra messaggio + link "torna al wizard"
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

interface Props { locale: Locale; }

type Phase = 'working' | 'done' | 'error';

export default function PaypalReturnClient({ locale }: Props) {
  const tr = getTranslations(locale);
  const t  = tr.components.wizardStep3;

  const search    = useSearchParams();
  const bookingId = Number(search.get('bookingId') ?? 0);

  const [phase, setPhase] = useState<Phase>('working');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError(t.errDataMissing);
      setPhase('error');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const pendingRaw = sessionStorage.getItem('paypal_vault_pending');
        const setupId    = sessionStorage.getItem('paypal_vault_setupToken');
        if (!pendingRaw || !setupId) {
          throw new Error(t.errDataMissing);
        }
        const pending = JSON.parse(pendingRaw);

        const res = await fetch('/api/paypal-confirm-vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            setupTokenId:   setupId,
            policy:         pending.policy ?? 'flex',
            chargeAt:       pending.chargeAt,
            totalAmount:    pending.totalAmount,
            accommodation:  pending.accommodation,
            touristTax:     pending.touristTax,
            discountAmount: pending.discountAmount,
            voucherCode:    pending.voucherCode,
            extras:         pending.extras ?? [],
          }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? (t as any).errPayPalVault ?? t.errPayPalGeneric);
        }

        // Cleanup sessionStorage
        sessionStorage.removeItem('paypal_vault_pending');
        sessionStorage.removeItem('paypal_vault_setupToken');

        setPhase('done');
        window.location.href = `/${locale}/prenota/successo?bookingId=${bookingId}&paypal-vault=1`;

      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? t.errGeneric);
        setPhase('error');
      }
    })();

    return () => { cancelled = true; };
  }, [bookingId, locale, t]);

  if (phase === 'working' || phase === 'done') {
    return (
      <div className="paypal-return-center">
        <i className="bi bi-hourglass-split paypal-return-spinner" aria-hidden="true"></i>
        <p className="paypal-return-text">
          {(t as any).paypalVaultConfirming ?? t.paying}
        </p>
      </div>
    );
  }

  return (
    <div className="paypal-return-center">
      <i className="bi bi-exclamation-triangle-fill paypal-return-error-icon" aria-hidden="true"></i>
      <h2 className="paypal-return-title">{t.errTitle}</h2>
      <p className="paypal-return-text">{error}</p>
      <a href={`/${locale}/prenota`} className="btn btn--primary">{t.errBack}</a>
    </div>
  );
}
