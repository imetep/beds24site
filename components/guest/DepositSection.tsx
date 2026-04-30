'use client';

import { useState } from 'react';

interface DepositInfo {
  url?:      string;
  amount:    number;
  status:    'pending' | 'authorized' | 'captured' | 'cancelled';
  createdAt: string;
}

interface Props {
  locale:           string;
  t:                any;  // t.deposit
  bookId:           string;
  amount:           number | null;
  deposit:          DepositInfo | null;
  onDepositStarted: (url: string) => void;
}

export default function DepositSection({ locale, t, bookId, amount, deposit, onDepositStarted }: Props) {
  const tD = t.deposit;
  const [mode, setMode]       = useState<'choose' | 'offline' | 'online'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Deposito già presente ─────────────────────────────────────────────────
  if (deposit) {
    const statusMap: Record<string, { label: string; modifier: string }> = {
      pending:    { label: tD.statusPending,    modifier: 'pending' },
      authorized: { label: tD.statusAuthorized, modifier: 'authorized' },
      captured:   { label: tD.statusCaptured,   modifier: 'captured' },
      cancelled:  { label: tD.statusCancelled,  modifier: 'cancelled' },
    };
    const st = statusMap[deposit.status] ?? statusMap.pending;

    return (
      <div className="guest-section">
        <SectionHeader icon="bi-credit-card-fill" title={tD.title} />
        <div className="deposit-section__amount-row">
          <span className="deposit-section__amount">€ {deposit.amount.toFixed(2)}</span>
          <span className={`status-badge status-badge--${st.modifier}`}>{st.label}</span>
        </div>
        {deposit.status === 'pending' && deposit.url && (
          <a href={deposit.url} target="_blank" rel="noopener noreferrer" className="btn-cta-orange">
            <i className="bi bi-link-45deg me-1" aria-hidden="true" />
            {tD.completePayment}
          </a>
        )}
        {deposit.status === 'authorized' && (
          <div className="info-box">{tD.authorizedMsg}</div>
        )}
        <p className="deposit-section__createdat">
          {tD.createdAt}: {new Date(deposit.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
    );
  }

  // ── Scelta modalità ───────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="guest-section">
        <SectionHeader icon="bi-credit-card-fill" title={tD.title} badge={amount ? `€ ${amount}` : undefined} />
        <p className="deposit-section__description">{tD.description}</p>
        <div className="deposit-section__choices">
          <ChoiceCard icon="bi-tag-fill" title={tD.offlineTitle} sub={tD.offlineSub} onClick={() => setMode('offline')} />
          {amount && <ChoiceCard icon="bi-credit-card-fill" title={tD.onlineTitle} sub={tD.onlineSub} onClick={() => setMode('online')} highlight />}
        </div>
      </div>
    );
  }

  // ── Offline ───────────────────────────────────────────────────────────────
  if (mode === 'offline') {
    return (
      <div className="guest-section">
        <BackBtn label={tD.back} onClick={() => setMode('choose')} />
        <SectionHeader icon="bi-tag-fill" title={tD.offlineTitle} />
        <div className="info-box">
          <p className="info-box__title">{tD.offlineHowTitle}</p>
          <ol className="info-box__list">
            <li>{tD.offlineStep1}</li>
            <li>{tD.offlineStep2}</li>
            <li>{tD.offlineStep3}</li>
            <li>{tD.offlineStep4}</li>
          </ol>
        </div>
        <p className="deposit-section__offline-note">{tD.offlineNote}</p>
      </div>
    );
  }

  // ── Online Stripe ─────────────────────────────────────────────────────────
  return (
    <div className="guest-section">
      <BackBtn label={tD.back} onClick={() => setMode('choose')} />
      <SectionHeader icon="bi-credit-card-fill" title={tD.onlineTitle} />
      <div className="info-box info-box--accent">
        <p className="info-box__title info-box__title--brand">
          <i className="bi bi-lock-fill me-1" aria-hidden="true" />
          {tD.stripeTitle}
        </p>
        <ul className="info-box__list info-box__list--brand">
          <li>{tD.stripeBullet1}</li>
          <li>{tD.stripeBullet2}</li>
          <li>{tD.stripeBullet3}</li>
          <li>{tD.stripeBullet4}</li>
        </ul>
      </div>
      <div className="deposit-section__amount-line">
        <span className="deposit-section__amount-line-label">{tD.amountLabel}</span>
        <span className="deposit-section__amount-line-value">€ {amount}</span>
      </div>
      {error && (
        <div className="deposit-section__error">{error}</div>
      )}
      <button
        disabled={loading}
        className="btn-cta-orange"
        onClick={async () => {
          setLoading(true); setError('');
          try {
            const res  = await fetch('/api/portal/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId, locale }) });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? tD.errorPayment); setLoading(false); return; }
            onDepositStarted(data.url);
            window.location.href = data.url;
          } catch { setError(tD.errorNetwork); setLoading(false); }
        }}
      >
        {loading ? tD.btnPayLoading : (
          <>
            <i className="bi bi-lock-fill me-1" aria-hidden="true" />
            {tD.btnPay}
          </>
        )}
      </button>
      <p className="deposit-section__note">{tD.stripeNote}</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, badge: b }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="section-header">
      <i className={`bi ${icon} section-header__icon`} aria-hidden="true" />
      <h3 className="section-header__title">{title}</h3>
      {b && <span className="section-header__badge">{b}</span>}
    </div>
  );
}

function ChoiceCard({ icon, title, sub, onClick, highlight }: { icon: string; title: string; sub: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`choice-card ${highlight ? 'choice-card--highlight' : ''}`}
    >
      <div className="choice-card__icon">
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>
      <div className="choice-card__title">{title}</div>
      <div className="choice-card__sub">{sub}</div>
    </button>
  );
}

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="back-btn">
      <i className="bi bi-arrow-left me-1" aria-hidden="true" />
      {label}
    </button>
  );
}
