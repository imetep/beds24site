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

interface Props {
  locale: string;
  onClose: () => void;
  /** Callback opzionale invocato al click "Fatto" con il metodo selezionato.
   *  Il caller può usarlo per triggerare lazy-load (es. preload SDK PayPal) */
  onConfirm?: (method: Method) => void;
}

interface MethodOption {
  id: Exclude<Method, null>;
  label: Record<string, string>;
  sub?: Record<string, string>;
  icon: string;
  enabled: boolean;
}

const METHODS: MethodOption[] = [
  {
    id: 'stripe',
    label: { it: 'Carta di credito o debito', en: 'Credit or debit card', de: 'Kredit- oder Debitkarte', pl: 'Karta kredytowa lub debetowa' },
    icon: 'bi-credit-card-2-front-fill',
    enabled: true,
  },
  {
    id: 'paypal',
    label: { it: 'PayPal', en: 'PayPal', de: 'PayPal', pl: 'PayPal' },
    icon: 'bi-paypal',
    enabled: true,
  },
  {
    id: 'apple-pay',
    label: { it: 'Apple Pay', en: 'Apple Pay', de: 'Apple Pay', pl: 'Apple Pay' },
    sub: { it: 'In arrivo', en: 'Coming soon', de: 'Demnächst', pl: 'Wkrótce' },
    icon: 'bi-apple',
    enabled: false,
  },
  {
    id: 'google-pay',
    label: { it: 'Google Pay', en: 'Google Pay', de: 'Google Pay', pl: 'Google Pay' },
    sub: { it: 'In arrivo', en: 'Coming soon', de: 'Demnächst', pl: 'Wkrótce' },
    icon: 'bi-google',
    enabled: false,
  },
  {
    id: 'klarna',
    label: { it: 'Paga in 3 rate con Klarna', en: 'Pay in 3 with Klarna', de: '3 Raten mit Klarna', pl: '3 raty z Klarna' },
    sub: { it: 'In arrivo · senza interessi', en: 'Coming soon · interest-free', de: 'Demnächst · zinsfrei', pl: 'Wkrótce · bez odsetek' },
    icon: 'bi-cash-stack',
    enabled: false,
  },
];

export default function PaymentMethodModal({ locale, onClose, onConfirm }: Props) {
  const tr = getTranslations(locale as Locale);
  const tAny = tr as any;
  const titleText: string = tAny.components?.paymentModal?.title ?? 'Metodo di pagamento';
  const sectionLabel: string = tAny.components?.paymentModal?.sectionAlt ?? 'Oppure paga con';
  const cancelText: string = tr.components.homeSearch.ui.cancel ?? 'Annulla';
  const doneText: string = tAny.components?.paymentModal?.confirm ?? 'Fatto';
  const closeAria: string = tAny.components?.paymentModal?.close ?? 'Chiudi';

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

  return (
    <>
      <div className="edit-modal__overlay" onClick={onClose} />
      <div className="edit-modal__panel payment-modal__panel" role="dialog" aria-label={titleText}>
        <div className="edit-modal__header">
          <h3 className="edit-modal__title">{titleText}</h3>
          <button
            type="button"
            className="edit-modal__close"
            onClick={onClose}
            aria-label={closeAria}
          >
            ×
          </button>
        </div>

        <div className="edit-modal__body payment-modal__body">
          {/* Metodi attivi (Stripe + PayPal) */}
          <ul className="payment-modal__list">
            {METHODS.filter(m => m.enabled).map(m => {
              const label = m.label[locale] ?? m.label.it;
              const sub = m.sub?.[locale] ?? m.sub?.it;
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
              <p className="payment-modal__section-label">{sectionLabel}</p>
              <ul className="payment-modal__list payment-modal__list--disabled">
                {METHODS.filter(m => !m.enabled).map(m => {
                  const label = m.label[locale] ?? m.label.it;
                  const sub = m.sub?.[locale] ?? m.sub?.it;
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
            {doneText}
          </button>
        </div>
      </div>
    </>
  );
}
