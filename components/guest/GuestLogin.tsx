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
  error:       '#c0392b',
  errorBg:     '#fef2f2',
  errorBorder: '#fecaca',
};

interface Props {
  locale:         string;
  t:              any;   // t.login
  onLoginSuccess: () => void;
}

export default function GuestLogin({ locale, t, onLoginSuccess }: Props) {
  const tL = t.login;

  const [bookId, setBookId]           = useState('');
  const [arrival, setArrival]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  // Formatta input → GG/MM/AAAA aggiungendo "/" automaticamente
  const handleArrivalChange = (raw: string) => {
    // Rimuovi tutto tranne cifre
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4);
    else if (digits.length > 2) formatted = digits.slice(0,2) + '/' + digits.slice(2);
    setArrival(formatted);
  };

  const handleSubmit = async () => {
    if (!bookId.trim() || !arrival.trim()) { setError(tL.errorFields); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/portal/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookId: bookId.trim(), arrival: arrival.trim() }),
      });
      if (res.status === 429) { setRateLimited(true); setLoading(false); return; }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? tL.errorGeneric);
        setLoading(false);
        return;
      }
      onLoginSuccess();
    } catch {
      setError(tL.errorNetwork);
      setLoading(false);
    }
  };

  if (rateLimited) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>⏱️</div>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.2rem', color: C.text, textAlign: 'center' }}>{tL.rateLimited}</h2>
          <p style={{ color: C.textMid, fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center', margin: '0 0 1.5rem' }}>{tL.rateLimitedMsg}</p>
          <div style={{ textAlign: 'center' }}>
            <a href="https://wa.me/393283131500" style={supportLink}>💬 WhatsApp</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.6rem' }}>
            🔐
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.45rem', fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
            {tL.title}
          </h1>
          <p style={{ margin: 0, color: C.textMid, fontSize: '0.88rem', lineHeight: 1.6 }}>
            {tL.subtitle}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>{tL.bookingId}</label>
            <input
              type="text" value={bookId} onChange={e => setBookId(e.target.value)}
              placeholder="es. 84750124" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label style={labelStyle}>{tL.arrival}</label>
            <input
              type="text" value={arrival}
              onChange={e => handleArrivalChange(e.target.value)}
              placeholder={tL.arrivalPlaceholder}
              style={inputStyle}
              inputMode="numeric"
              maxLength={10}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: '8px', padding: '0.75rem 1rem', color: C.error, fontSize: '0.875rem', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '0.85rem', background: loading ? '#e0e0e0' : C.orange, color: loading ? C.textMid : C.text, border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem' }}
          >
            {loading ? tL.loading : tL.btn}
          </button>
        </div>

        {/* Supporto */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.82rem', color: C.textMuted }}>{tL.noBooking}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <a href="https://wa.me/393283131500" style={supportLink}>💬 WhatsApp</a>
            <a href="mailto:contattolivingapple@gmail.com" style={supportLink}>✉️ Email</a>
          </div>
        </div>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: '#f9fafb' };
const card: React.CSSProperties = { background: '#fff', borderRadius: '20px', boxShadow: '0 4px 32px rgba(0,0,0,0.09)', padding: '2.5rem', width: '100%', maxWidth: '420px' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#555555', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.95rem', border: '1.5px solid #e5e7eb', borderRadius: '9px', fontSize: '0.95rem', color: '#111', outline: 'none', boxSizing: 'border-box' };
const supportLink: React.CSSProperties = { color: '#1E73BE', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 };
