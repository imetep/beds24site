'use client';

import { useState } from 'react';

const C = {
  blue:        '#1E73BE',
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
      <div style={sectionCard}>
        <SectionHeader icon="💳" title={tD.title} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.5rem', color: C.text }}>€ {deposit.amount.toFixed(2)}</span>
          <span style={{ ...badge, color: st.color, background: st.bg }}>{st.label}</span>
        </div>
        {deposit.status === 'pending' && deposit.url && (
          <a href={deposit.url} target="_blank" rel="noopener noreferrer" style={btnOrange}>
            🔗 {tD.completePayment}
          </a>
        )}
        {deposit.status === 'authorized' && (
          <div style={infoBox}>{tD.authorizedMsg}</div>
        )}
        <p style={{ margin: '1rem 0 0', fontSize: '0.79rem', color: C.textMuted }}>
          {tD.createdAt}: {new Date(deposit.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
    );
  }

  // ── Scelta modalità ───────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div style={sectionCard}>
        <SectionHeader icon="💳" title={tD.title} badge={amount ? `€ ${amount}` : undefined} />
        <p style={{ color: C.textMid, fontSize: '0.88rem', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
          {tD.description}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          <ChoiceCard icon="🏷️" title={tD.offlineTitle} sub={tD.offlineSub} onClick={() => setMode('offline')} />
          {amount && <ChoiceCard icon="💳" title={tD.onlineTitle} sub={tD.onlineSub} onClick={() => setMode('online')} highlight />}
        </div>
      </div>
    );
  }

  // ── Offline ───────────────────────────────────────────────────────────────
  if (mode === 'offline') {
    return (
      <div style={sectionCard}>
        <BackBtn label={tD.back} onClick={() => setMode('choose')} />
        <SectionHeader icon="🏷️" title={tD.offlineTitle} />
        <div style={infoBox}>
          <p style={{ margin: '0 0 0.6rem', fontWeight: 700, color: C.text, fontSize: '0.9rem' }}>{tD.offlineHowTitle}</p>
          <ol style={{ margin: 0, paddingLeft: '1.3rem', lineHeight: 1.9, color: C.textMid, fontSize: '0.88rem' }}>
            <li>{tD.offlineStep1}</li>
            <li>{tD.offlineStep2}</li>
            <li>{tD.offlineStep3}</li>
            <li>{tD.offlineStep4}</li>
          </ol>
        </div>
        <p style={{ margin: '1rem 0 0', fontSize: '0.82rem', color: C.textMuted }}>{tD.offlineNote}</p>
      </div>
    );
  }

  // ── Online Stripe ─────────────────────────────────────────────────────────
  return (
    <div style={sectionCard}>
      <BackBtn label={tD.back} onClick={() => setMode('choose')} />
      <SectionHeader icon="💳" title={tD.onlineTitle} />
      <div style={{ background: C.blueLight, border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.1rem 1.2rem', marginBottom: '1.25rem' }}>
        <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: C.blue, fontSize: '0.88rem' }}>🔒 {tD.stripeTitle}</p>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: C.text, fontSize: '0.84rem', lineHeight: 1.8 }}>
          <li>{tD.stripeBullet1}</li>
          <li>{tD.stripeBullet2}</li>
          <li>{tD.stripeBullet3}</li>
          <li>{tD.stripeBullet4}</li>
        </ul>
      </div>
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '0.88rem', color: C.textMid }}>{tD.amountLabel}</span>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: C.text }}>€ {amount}</span>
      </div>
      {error && (
        <div style={{ background: C.errorBg, border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem', color: C.error, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
      )}
      <button
        disabled={loading}
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
      <p style={{ margin: '0.6rem 0 0', fontSize: '0.79rem', color: C.textMuted, textAlign: 'center' }}>{tD.stripeNote}</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, badge: b }: { icon: string; title: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111111' }}>{title}</h3>
      {b && <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '1.1rem', color: '#1E73BE' }}>{b}</span>}
    </div>
  );
}

function ChoiceCard({ icon, title, sub, onClick, highlight }: { icon: string; title: string; sub: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button onClick={onClick} style={{ background: highlight ? '#EEF5FC' : '#f9fafb', border: `2px solid ${highlight ? '#1E73BE' : '#e5e7eb'}`, borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontWeight: 700, color: '#111111', fontSize: '0.92rem', marginBottom: '0.3rem' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: '#555555', lineHeight: 1.5 }}>{sub}</div>
    </button>
  );
}

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#1E73BE', fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginBottom: '1rem', fontWeight: 600 }}>
      ← {label}
    </button>
  );
}

const sectionCard: React.CSSProperties = { background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' };
const badge: React.CSSProperties       = { padding: '0.22rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 };
const infoBox: React.CSSProperties     = { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem 1.1rem', fontSize: '0.88rem', lineHeight: 1.6 };
const btnOrange: React.CSSProperties   = { display: 'block', width: '100%', padding: '0.85rem', background: '#FCAF1A', color: '#111111', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' };
