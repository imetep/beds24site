'use client';

/**
 * PaymentMethodModal — modale "Modifica metodo di pagamento" stile Airbnb /book.
 * Lista 5 metodi (Carta credito/debito, Apple Pay, PayPal, Google Pay, Klarna).
 * Solo Stripe (Carta) e PayPal sono attivi oggi — gli altri 'coming soon' disabled.
 *
 * Lazy-load SDK PayPal al click del radio PayPal (decisione sessione 2026-04-29
 * opzione B: redirect classico, no Button embedded). Fino al click PayPal
 * niente fetch del client-token + niente script v6 caricato.
 *
 * Aggiorna wizard-store.paymentMethod al click "Fatto". onClose chiude senza salvare.
 */

import { useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

type Method = 'stripe' | 'paypal' | 'apple-pay' | 'google-pay' | 'klarna' | null;
type MethodId = Exclude<Method, null>;
type MethodKey = 'stripe' | 'paypal' | 'applePay' | 'googlePay' | 'klarna';

interface Props {
  locale: string;
  onClose: () => void;
  /** Callback opzionale invocato al click "Fatto" con il metodo selezionato.
   *  Il caller può usarlo per triggerare lazy-load (es. preload SDK PayPal) */
  onConfirm?: (method: Method) => void;
}

/**
 * Config NON-i18n dei metodi (id, mapping a chiavi i18n, icona Bootstrap, attivo/coming-soon).
 * Tutti i testi user-facing (label, sub) vivono in locales/{it,en,de,pl}/common.json
 * sotto components.paymentModal.methods.* + components.paymentModal.comingSoon*
 * (memoria progetto: i18n centralizzato).
 */
interface MethodConfig {
  id: MethodId;
  i18nKey: MethodKey;
  icon: string;
  enabled: boolean;
  /** Se non-attivo, prefisso del sub-text i18n (comingSoon | comingSoonInterestFree) */
  comingSoonKey?: 'comingSoon' | 'comingSoonInterestFree';
}

const METHODS: MethodConfig[] = [
  { id: 'stripe',     i18nKey: 'stripe',    icon: 'bi-credit-card-2-front-fill', enabled: true },
  { id: 'paypal',     i18nKey: 'paypal',    icon: 'bi-paypal',                   enabled: true },
  { id: 'apple-pay',  i18nKey: 'applePay',  icon: 'bi-apple',                    enabled: false, comingSoonKey: 'comingSoon' },
  { id: 'google-pay', i18nKey: 'googlePay', icon: 'bi-google',                   enabled: false, comingSoonKey: 'comingSoon' },
  { id: 'klarna',     i18nKey: 'klarna',    icon: 'bi-cash-stack',               enabled: false, comingSoonKey: 'comingSoonInterestFree' },
];

export default function PaymentMethodModal({ locale, onClose, onConfirm }: Props) {
  const tr = getTranslations(locale as Locale);
  const pm = (tr as any).components.paymentModal;
  const cancelText: string = tr.components.homeSearch.ui.cancel;

  const { paymentMethod, setPaymentMethod } = useWizardStore() as any;
  const [selected, setSelected] = useState<Method>(
    (paymentMethod as Method) ?? null
  );

  function handleConfirm() {
    if (!selected) return;
    setPaymentMethod(selected);
    onConfirm?.(selected);
    onClose();
  }

  // Helper: label/sub di un metodo da i18n
  function methodLabel(key: MethodKey): string {
    return pm.methods[key]?.label ?? key;
  }
  function methodSub(comingSoonKey?: 'comingSoon' | 'comingSoonInterestFree'): string | null {
    if (!comingSoonKey) return null;
    return pm[comingSoonKey] ?? null;
  }

  return (
    <>
      <div className="edit-modal__overlay" onClick={onClose} />
      <div className="edit-modal__panel payment-modal__panel" role="dialog" aria-label={pm.title}>
        <div className="edit-modal__header">
          <h3 className="edit-modal__title">{pm.title}</h3>
          <button
            type="button"
            className="edit-modal__close"
            onClick={onClose}
            aria-label={pm.close}
          >
            ×
          </button>
        </div>

        <div className="edit-modal__body payment-modal__body">
          {/* Metodi attivi (Stripe + PayPal) */}
          <ul className="payment-modal__list">
            {METHODS.filter(m => m.enabled).map(m => {
              const label = methodLabel(m.i18nKey);
              const sub = methodSub(m.comingSoonKey);
              const isSelected = selected === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m.id)}
                    className={`payment-modal__option${isSelected ? ' is-selected' : ''}`}
                  >
                    <i className={`bi ${m.icon} payment-modal__option-icon`} aria-hidden="true" />
                    <span className="payment-modal__option-label">
                      <span className="payment-modal__option-name">{label}</span>
                      {sub && <span className="payment-modal__option-sub">{sub}</span>}
                    </span>
                    <span className={`payment-modal__radio${isSelected ? ' is-checked' : ''}`} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Sezione "Oppure paga con" — metodi disabled (coming soon) */}
          {METHODS.some(m => !m.enabled) && (
            <>
              <p className="payment-modal__section-label">{pm.sectionAlt}</p>
              <ul className="payment-modal__list payment-modal__list--disabled">
                {METHODS.filter(m => !m.enabled).map(m => {
                  const label = methodLabel(m.i18nKey);
                  const sub = methodSub(m.comingSoonKey);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        disabled
                        className="payment-modal__option is-disabled"
                      >
                        <i className={`bi ${m.icon} payment-modal__option-icon`} aria-hidden="true" />
                        <span className="payment-modal__option-label">
                          <span className="payment-modal__option-name">{label}</span>
                          {sub && <span className="payment-modal__option-sub">{sub}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="edit-modal__footer">
          <button type="button" className="edit-modal__btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn--primary edit-modal__btn-primary payment-modal__confirm"
            onClick={handleConfirm}
            disabled={!selected}
          >
            {pm.confirm}
          </button>
        </div>
      </div>
    </>
  );
}
