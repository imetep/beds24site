'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { PROPERTIES, type Room } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';
import {
  computeTotals,
  type Preventivo,
  type PaymentMethod,
} from '@/lib/preventivo-types';
import type { BonificoDati } from '@/lib/preventivo-bonifico';

interface Props {
  locale: Locale;
  preventivo: Omit<Preventivo, 'notes' | 'customerEmail' | 'customerName' | 'customerPhone'>;
  stripeEnabled: boolean;
  paypalEnabled: boolean;
}

type WizardStep = 1 | 2 | 3;

function findRoom(roomId: number): Room | null {
  for (const p of PROPERTIES) {
    const r = p.rooms.find(r => r.roomId === roomId);
    if (r) return r;
  }
  return null;
}

function fmtEuro(n: number, locale: Locale): string {
  const map: Record<Locale, string> = { it: 'it-IT', en: 'en-GB', de: 'de-DE', pl: 'pl-PL' };
  return new Intl.NumberFormat(map[locale], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtSubject(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
}

function fmtMmSs(sec: number): string {
  const mm = Math.floor(sec / 60).toString().padStart(2, '0');
  const ss = (sec % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function PreventivoPagaClient({
  locale,
  preventivo,
  stripeEnabled,
  paypalEnabled,
}: Props) {
  const t = getTranslations(locale).components.preventivoPaga;
  const tView = getTranslations(locale).components.preventivoView;
  const room = findRoom(preventivo.roomId);
  const totals = useMemo(() => computeTotals(preventivo as Preventivo), [preventivo]);
  const minDeposit = useMemo(() => Math.round(totals.total * 0.30 * 100) / 100, [totals.total]);

  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('bonifico');
  const [depositPct, setDepositPct] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Stato bonifico (step 3 quando method=bonifico)
  const [bonifico, setBonifico] = useState<BonificoDati | null>(null);
  const [countdownSec, setCountdownSec] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const depositAmount = useMemo(
    () => Math.round(totals.total * (depositPct / 100) * 100) / 100,
    [totals.total, depositPct]
  );
  const remainingAmount = useMemo(
    () => Math.round((totals.total - depositAmount) * 100) / 100,
    [totals.total, depositAmount]
  );

  // Countdown bonifico
  useEffect(() => {
    if (!bonifico || countdownSec <= 0) return;
    const id = setInterval(() => setCountdownSec(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [bonifico, countdownSec]);

  if (!room) {
    return <div className="page-container"><p className="text-center py-5">Camera non trovata</p></div>;
  }

  // Stati non-active: redirect alla view (mostra messaggio scaduto/cancelled/converted)
  if (preventivo.status !== 'active') {
    return (
      <div className="page-container preventivo-paga">
        <div className="preventivo-view__status-card">
          <Icon name="x-circle" size={56} className="preventivo-view__status-icon" />
          <h1 className="preventivo-view__status-title">{t.errorNotActive}</h1>
          <Link href={`/${locale}/preventivo/${preventivo.id}`} className="preventivo-view__status-cta">
            {t.bonificoBackToView}
          </Link>
        </div>
      </div>
    );
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function goToStep2() {
    setError('');
    if (name.trim().length < 2) { setError(t.errorGeneric); return; }
    if (!isEmail(email)) { setError(t.errorGeneric); return; }
    setStep(2);
  }

  function goToStep3() {
    setError('');
    setStep(3);
  }

  async function startBonifico() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/preventivi/${preventivo.id}/lock-bonifico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim() || undefined,
          depositAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'amount_below_minimum') {
          setError(fmtSubject(t.errorAmountBelow, { amount: fmtEuro(data.minDeposit, locale) }));
        } else if (data.error === 'amount_above_total') {
          setError(fmtSubject(t.errorAmountAbove, { amount: fmtEuro(data.max, locale) }));
        } else if (data.error === 'room_locked_by_other' || data.error === 'room_no_longer_available') {
          setError(t.errorRoomLocked);
        } else if (data.error === 'not_active') {
          setError(t.errorNotActive);
        } else {
          setError(t.errorGeneric);
        }
        return;
      }
      setBonifico(data.bonifico);
      setCountdownSec(data.ttlSec);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  function copyToClipboard(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(c => (c === key ? null : c)), 1500);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-container preventivo-paga">

      <div className="preventivo-paga__header">
        <Link href={`/${locale}/preventivo/${preventivo.id}`} className="preventivo-paga__back">
          ← {room.name}
        </Link>
        <h1 className="preventivo-paga__title">{t.pageTitle}</h1>
      </div>

      {/* Stepper indicator */}
      <ol className="preventivo-paga__steps">
        {[1, 2, 3].map(n => (
          <li key={n} className={`preventivo-paga__step ${step === n ? 'is-current' : step > n ? 'is-done' : ''}`}>
            <span className="preventivo-paga__step-num">{n}</span>
            <span className="preventivo-paga__step-label">
              {n === 1 ? t.step1Title : n === 2 ? t.step2Title : t.step3Title}
            </span>
          </li>
        ))}
      </ol>

      {/* Riepilogo prezzo (sempre visibile in alto) */}
      <div className="preventivo-paga__summary">
        <div className="preventivo-paga__summary-row">
          <span>{t.totalLabel}</span>
          <strong>{fmtEuro(totals.total, locale)}</strong>
        </div>
      </div>

      {error && (
        <div className="preventivo-paga__error">
          <Icon name="exclamation-triangle-fill" size={18} />
          {error}
        </div>
      )}

      {/* ─── Step 1: dati ospite ─── */}
      {step === 1 && (
        <div className="preventivo-paga__card">
          <h2 className="preventivo-paga__card-title">{t.step1Title}</h2>

          <div className="preventivo-paga__field">
            <label className="preventivo-paga__label">{t.nameLabel}</label>
            <input
              type="text"
              className="preventivo-paga__input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              autoComplete="name"
            />
          </div>

          <div className="preventivo-paga__field">
            <label className="preventivo-paga__label">{t.emailLabel}</label>
            <input
              type="email"
              className="preventivo-paga__input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              autoComplete="email"
            />
          </div>

          <div className="preventivo-paga__field">
            <label className="preventivo-paga__label">{t.phoneLabel}</label>
            <input
              type="tel"
              className="preventivo-paga__input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              autoComplete="tel"
            />
            <p className="preventivo-paga__help">{t.phoneHelp}</p>
          </div>

          <button
            className="preventivo-paga__cta"
            onClick={goToStep2}
            disabled={!name.trim() || !isEmail(email)}
          >
            {t.continueBtn}
          </button>
        </div>
      )}

      {/* ─── Step 2: metodo + acconto ─── */}
      {step === 2 && (
        <div className="preventivo-paga__card">
          <h2 className="preventivo-paga__card-title">{t.step2Title}</h2>

          {/* Metodi */}
          <div className="preventivo-paga__methods">
            {paypalEnabled && (
              <MethodOption
                checked={method === 'paypal'}
                onChange={() => setMethod('paypal')}
                icon="paypal"
                title={t.methodPaypal}
                desc={t.methodPaypalDesc}
                badge={t.methodComingSoon}
                disabled
              />
            )}
            {stripeEnabled && (
              <MethodOption
                checked={method === 'stripe'}
                onChange={() => setMethod('stripe')}
                icon="credit-card-fill"
                title={t.methodStripe}
                desc={t.methodStripeDesc}
                badge={t.methodComingSoon}
                disabled
              />
            )}
            <MethodOption
              checked={method === 'bonifico'}
              onChange={() => setMethod('bonifico')}
              icon="bank2"
              title={t.methodBonifico}
              desc={t.methodBonificoDesc}
            />
          </div>

          {/* Slider acconto */}
          <div className="preventivo-paga__deposit">
            <label className="preventivo-paga__label">{t.depositLabel}</label>
            <input
              type="range"
              min={30}
              max={100}
              step={10}
              value={depositPct}
              onChange={e => setDepositPct(Number(e.target.value))}
              className="preventivo-paga__slider"
            />
            <div className="preventivo-paga__slider-marks">
              <span>30%</span>
              <span>40%</span>
              <span>50%</span>
              <span>60%</span>
              <span>70%</span>
              <span>80%</span>
              <span>90%</span>
              <span>100%</span>
            </div>
            <div className="preventivo-paga__deposit-amount">
              <span>{depositPct}%</span>
              <strong>{fmtEuro(depositAmount, locale)}</strong>
            </div>
            <p className="preventivo-paga__help">{fmtSubject(t.depositMin, { amount: fmtEuro(minDeposit, locale) })}</p>
            {remainingAmount > 0 && (
              <p className="preventivo-paga__remaining">
                {t.remainingLabel}: <strong>{fmtEuro(remainingAmount, locale)}</strong>
              </p>
            )}
          </div>

          <div className="preventivo-paga__actions">
            <button className="preventivo-paga__back-btn" onClick={() => setStep(1)}>{t.backBtn}</button>
            <button className="preventivo-paga__cta" onClick={goToStep3}>{t.continueBtn}</button>
          </div>
        </div>
      )}

      {/* ─── Step 3: esegui pagamento ─── */}
      {step === 3 && (
        <div className="preventivo-paga__card">
          {method === 'bonifico' && !bonifico && (
            <>
              <h2 className="preventivo-paga__card-title">{t.step3Title}</h2>
              <p className="preventivo-paga__pay-summary">
                {fmtSubject(t.payNowBtn, { amount: fmtEuro(depositAmount, locale) })}
              </p>
              <div className="preventivo-paga__actions">
                <button className="preventivo-paga__back-btn" onClick={() => setStep(2)} disabled={busy}>{t.backBtn}</button>
                <button className="preventivo-paga__cta" onClick={startBonifico} disabled={busy}>
                  {busy ? '…' : fmtSubject(t.payNowBtn, { amount: fmtEuro(depositAmount, locale) })}
                </button>
              </div>
            </>
          )}

          {/* Bonifico: dati visualizzati + countdown */}
          {method === 'bonifico' && bonifico && countdownSec > 0 && (
            <div className="preventivo-paga__bonifico">
              <h2 className="preventivo-paga__card-title">{t.bonificoTitle}</h2>
              <div className="preventivo-paga__countdown">
                <Icon name="clock" size={20} />
                {t.bonificoDeadlinePrefix} <strong>{fmtMmSs(countdownSec)}</strong>
              </div>

              <BonificoField label={t.bonificoHolderLabel} value={bonifico.holder} keyName="holder" copiedKey={copiedKey} onCopy={copyToClipboard} t={t} />
              <BonificoField label={t.bonificoIbanLabel} value={bonifico.iban} keyName="iban" copiedKey={copiedKey} onCopy={copyToClipboard} t={t} mono />
              {bonifico.bic && (
                <BonificoField label={t.bonificoBicLabel} value={bonifico.bic} keyName="bic" copiedKey={copiedKey} onCopy={copyToClipboard} t={t} mono />
              )}
              {bonifico.bankName && (
                <BonificoField label={t.bonificoBankLabel} value={bonifico.bankName} keyName="bank" copiedKey={copiedKey} onCopy={copyToClipboard} t={t} />
              )}
              <BonificoField label={t.bonificoCausaleLabel} value={bonifico.causale} keyName="causale" copiedKey={copiedKey} onCopy={copyToClipboard} t={t} highlight />
              <BonificoField label={t.bonificoAmountLabel} value={fmtEuro(bonifico.amount, locale)} keyName="amount" copiedKey={copiedKey} onCopy={copyToClipboard} t={t} highlight />

              <p className="preventivo-paga__bonifico-note">
                <Icon name="info-circle-fill" size={16} />
                {t.bonificoNote}
              </p>

              <Link href={`/${locale}/preventivo/${preventivo.id}`} className="preventivo-paga__back-btn">
                {t.bonificoBackToView}
              </Link>
            </div>
          )}

          {/* Lock scaduto */}
          {method === 'bonifico' && bonifico && countdownSec === 0 && (
            <div className="preventivo-view__status-card">
              <Icon name="hourglass-split" size={56} className="preventivo-view__status-icon" />
              <h2 className="preventivo-view__status-title">{t.lockExpiredTitle}</h2>
              <p className="preventivo-view__status-text">{t.lockExpiredText}</p>
              <button className="preventivo-view__status-cta" onClick={() => { setBonifico(null); setStep(2); }}>
                {t.lockExpiredCta}
              </button>
            </div>
          )}

          {/* PayPal/Stripe — disabled placeholder */}
          {(method === 'paypal' || method === 'stripe') && (
            <>
              <h2 className="preventivo-paga__card-title">{t.step3Title}</h2>
              <div className="preventivo-paga__error">
                <Icon name="info-circle-fill" size={18} />
                {t.methodComingSoon} — {t.methodBonificoDesc}
              </div>
              <button className="preventivo-paga__back-btn" onClick={() => { setMethod('bonifico'); }}>
                ← {t.methodBonifico}
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MethodOption({
  checked, onChange, icon, title, desc, badge, disabled,
}: {
  checked: boolean;
  onChange: () => void;
  icon: 'paypal' | 'credit-card-fill' | 'bank2';
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`preventivo-paga__method ${checked ? 'is-checked' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <input
        type="radio"
        name="payment-method"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="preventivo-paga__method-icon">
        <Icon name={icon} size={24} />
      </span>
      <span className="preventivo-paga__method-text">
        <span className="preventivo-paga__method-title">
          {title}
          {badge && <span className="preventivo-paga__method-badge">{badge}</span>}
        </span>
        <span className="preventivo-paga__method-desc">{desc}</span>
      </span>
    </label>
  );
}

function BonificoField({
  label, value, keyName, copiedKey, onCopy, t, mono, highlight,
}: {
  label: string;
  value: string;
  keyName: string;
  copiedKey: string | null;
  onCopy: (value: string, key: string) => void;
  t: any;
  mono?: boolean;
  highlight?: boolean;
}) {
  const isCopied = copiedKey === keyName;
  return (
    <div className={`preventivo-paga__bonifico-field ${highlight ? 'is-highlight' : ''}`}>
      <span className="preventivo-paga__bonifico-label">{label}</span>
      <div className="preventivo-paga__bonifico-row">
        <span className={`preventivo-paga__bonifico-value ${mono ? 'is-mono' : ''}`}>{value}</span>
        <button
          className={`preventivo-paga__copy-btn ${isCopied ? 'is-copied' : ''}`}
          onClick={() => onCopy(value, keyName)}
          type="button"
        >
          {isCopied ? t.bonificoCopied : t.bonificoCopyBtn}
        </button>
      </div>
    </div>
  );
}
