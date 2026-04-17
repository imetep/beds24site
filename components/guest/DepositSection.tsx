'use client';

import { useState } from 'react';

const C = {
  blue:        'var(--color-primary)',
  blueLight:   '#EEF5FC',
  orange:      '#FCAF1A',
  text:        '#111111',
  textMid:     '#555555',
  textMuted:   '#888888',
  border:      '#e5e7eb',
  bg:          '#f9fafb',
  success:     '#16a34a',
  successBg:   '#f0fdf4',
  orangePale:  '#FFF8EC',
  orangeDark:  '#B07820',
  error:       '#c0392b',
  errorBg:     '#fef2f2',
};

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
    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
      pending:    { label: tD.statusPending,    color: C.orangeDark, bg: C.orangePale },
      authorized: { label: tD.statusAuthorized, color: C.success,    bg: C.successBg },
      captured:   { label: tD.statusCaptured,   color: C.blue,       bg: C.blueLight },
      cancelled:  { label: tD.statusCancelled,  color: C.textMid,    bg: C.bg },
    };
    const st = statusMap[deposit.status] ?? statusMap.pending;

    return (
      <div className="bg-white border shadow-sm" style={sectionCard}>
        <SectionHeader icon="💳" title={tD.title} />
        <div className="d-flex align-items-center mb-3" style={{ gap: '0.75rem' }}>
          <span className="fw-bolder" style={{ fontSize: '1.5rem', color: C.text }}>€ {deposit.amount.toFixed(2)}</span>
          <span className="fw-bold rounded-pill" style={{ ...badge, color: st.color, background: st.bg }}>{st.label}</span>
        </div>
        {deposit.status === 'pending' && deposit.url && (
          <a href={deposit.url} target="_blank" rel="noopener noreferrer" className="d-block w-100 fw-bold text-center text-decoration-none border-0" style={btnOrange}>
            🔗 {tD.completePayment}
          </a>
        )}
        {deposit.status === 'authorized' && (
          <div className="border" style={infoBox}>{tD.authorizedMsg}</div>
        )}
        <p className="mt-3 mb-0" style={{ fontSize: '0.79rem', color: C.textMuted }}>
          {tD.createdAt}: {new Date(deposit.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
    );
  }

  // ── Scelta modalità ───────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="bg-white border shadow-sm" style={sectionCard}>
        <SectionHeader icon="💳" title={tD.title} badge={amount ? `€ ${amount}` : undefined} />
        <p className="mb-3" style={{ color: C.textMid, fontSize: '0.88rem', lineHeight: 1.65 }}>
          {tD.description}
        </p>
        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          <ChoiceCard icon="🏷️" title={tD.offlineTitle} sub={tD.offlineSub} onClick={() => setMode('offline')} />
          {amount && <ChoiceCard icon="💳" title={tD.onlineTitle} sub={tD.onlineSub} onClick={() => setMode('online')} highlight />}
        </div>
      </div>
    );
  }

  // ── Offline ───────────────────────────────────────────────────────────────
  if (mode === 'offline') {
    return (
      <div className="bg-white border shadow-sm" style={sectionCard}>
        <BackBtn label={tD.back} onClick={() => setMode('choose')} />
        <SectionHeader icon="🏷️" title={tD.offlineTitle} />
        <div className="border" style={infoBox}>
          <p className="fw-bold mb-2" style={{ color: C.text, fontSize: '0.9rem' }}>{tD.offlineHowTitle}</p>
          <ol className="mb-0" style={{ paddingLeft: '1.3rem', lineHeight: 1.9, color: C.textMid, fontSize: '0.88rem' }}>
            <li>{tD.offlineStep1}</li>
            <li>{tD.offlineStep2}</li>
            <li>{tD.offlineStep3}</li>
            <li>{tD.offlineStep4}</li>
          </ol>
        </div>
        <p className="mt-3 mb-0" style={{ fontSize: '0.82rem', color: C.textMuted }}>{tD.offlineNote}</p>
      </div>
    );
  }

  // ── Online Stripe ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white border shadow-sm" style={sectionCard}>
      <BackBtn label={tD.back} onClick={() => setMode('choose')} />
      <SectionHeader icon="💳" title={tD.onlineTitle} />
      <div
        className="border mb-3"
        style={{ background: C.blueLight, borderColor: '#bfdbfe', borderRadius: 12, padding: '1.1rem 1.2rem' }}
      >
        <p className="fw-bold mb-2" style={{ color: C.blue, fontSize: '0.88rem' }}>🔒 {tD.stripeTitle}</p>
        <ul className="mb-0" style={{ paddingLeft: '1.2rem', color: C.text, fontSize: '0.84rem', lineHeight: 1.8 }}>
          <li>{tD.stripeBullet1}</li>
          <li>{tD.stripeBullet2}</li>
          <li>{tD.stripeBullet3}</li>
          <li>{tD.stripeBullet4}</li>
        </ul>
      </div>
      <div className="mb-3 d-flex align-items-center" style={{ gap: '0.6rem' }}>
        <span style={{ fontSize: '0.88rem', color: C.textMid }}>{tD.amountLabel}</span>
        <span className="fw-bolder" style={{ fontSize: '1.25rem', color: C.text }}>€ {amount}</span>
      </div>
      {error && (
        <div
          className="mb-3"
          style={{ background: C.errorBg, border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem', color: C.error, fontSize: '0.875rem' }}
        >{error}</div>
      )}
      <button
        disabled={loading}
        className="d-block w-100 fw-bold text-center border-0"
        style={{ ...btnOrange, background: loading ? '#e0e0e0' : C.orange, color: loading ? C.textMid : C.text, cursor: loading ? 'not-allowed' : 'pointer' }}
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
        {loading ? tD.btnPayLoading : `🔒 ${tD.btnPay}`}
      </button>
      <p className="text-center mt-2 mb-0" style={{ fontSize: '0.79rem', color: C.textMuted }}>{tD.stripeNote}</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, badge: b }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-3">
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <h3 className="m-0 fw-bold" style={{ fontSize: '1rem', color: '#111111' }}>{title}</h3>
      {b && <span className="ms-auto fw-bolder" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>{b}</span>}
    </div>
  );
}

function ChoiceCard({ icon, title, sub, onClick, highlight }: { icon: string; title: string; sub: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="text-start"
      style={{ background: highlight ? '#EEF5FC' : '#f9fafb', border: `2px solid ${highlight ? 'var(--color-primary)' : '#e5e7eb'}`, borderRadius: 14, padding: '1.25rem', cursor: 'pointer' }}
    >
      <div className="mb-2" style={{ fontSize: '1.75rem' }}>{icon}</div>
      <div className="fw-bold mb-1" style={{ color: '#111111', fontSize: '0.92rem' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: '#555555', lineHeight: 1.5 }}>{sub}</div>
    </button>
  );
}

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn fw-semibold mb-3 p-0"
      style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}
    >
      ← {label}
    </button>
  );
}

const sectionCard: React.CSSProperties = { borderRadius: 16, padding: '1.5rem' };
const badge: React.CSSProperties       = { padding: '0.22rem 0.65rem', fontSize: '0.78rem' };
const infoBox: React.CSSProperties     = { background: '#f9fafb', borderRadius: 12, padding: '1rem 1.1rem', fontSize: '0.88rem', lineHeight: 1.6 };
const btnOrange: React.CSSProperties   = { padding: '0.85rem', background: '#FCAF1A', color: '#111111', borderRadius: 10, fontSize: '0.95rem', cursor: 'pointer' };
