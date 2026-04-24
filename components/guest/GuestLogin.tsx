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
  const [arrDay,   setArrDay]         = useState('');
  const [arrMonth, setArrMonth]       = useState('');
  const [arrYear,  setArrYear]        = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const months = tL.months as string[];
  const years = Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() + i));

  // Formatta in GG/MM/AAAA per l'API
  const arrivalFormatted = arrDay && arrMonth && arrYear
    ? `${arrDay.padStart(2,'0')}/${arrMonth.padStart(2,'0')}/${arrYear}`
    : '';

  const handleSubmit = async () => {
    if (!bookId.trim() || !arrivalFormatted) { setError(tL.errorFields); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/portal/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookId: bookId.trim(), arrival: arrivalFormatted }),
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
      <div className="d-flex align-items-center justify-content-center px-3 py-4" style={wrap}>
        <div className="bg-white shadow-lg" style={card}>
          <div className="text-center mb-3" style={{ fontSize: '2.5rem', color: C.textMid }}>
            <i className="bi bi-clock-fill" aria-hidden="true" />
          </div>
          <h2 className="text-center mb-2" style={{ fontSize: '1.2rem', color: C.text }}>{tL.rateLimited}</h2>
          <p className="text-center mb-4" style={{ color: C.textMid, fontSize: '0.9rem', lineHeight: 1.6 }}>{tL.rateLimitedMsg}</p>
          <div className="text-center">
            <a href="https://wa.me/393283131500" style={supportLink}>
              <i className="bi bi-whatsapp me-1" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center px-3 py-4" style={wrap}>
      <div className="bg-white shadow-lg" style={card}>
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: 56, height: 56, background: C.blueLight, fontSize: '1.6rem', color: 'var(--color-primary)' }}
          >
            <i className="bi bi-shield-lock-fill" aria-hidden="true" />
          </div>
          <h1
            className="fw-bolder mb-2"
            style={{ fontSize: '1.45rem', color: C.text, letterSpacing: '-0.02em' }}
          >
            {tL.title}
          </h1>
          <p className="m-0" style={{ color: C.textMid, fontSize: '0.88rem', lineHeight: 1.6 }}>
            {tL.subtitle}
          </p>
        </div>

        {/* Form */}
        <div className="d-flex flex-column gap-3">
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
            <div className="d-grid" style={{ gridTemplateColumns: '1fr 2fr 1.4fr', gap: '0.5rem' }}>
              <select
                value={arrDay}
                onChange={e => setArrDay(e.target.value)}
                style={selectStyle}
              >
                <option value="">{tL.dayPlaceholder}</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d)}>{String(d).padStart(2,'0')}</option>
                ))}
              </select>
              <select
                value={arrMonth}
                onChange={e => setArrMonth(e.target.value)}
                style={selectStyle}
              >
                <option value="">{tL.monthPlaceholder}</option>
                {months.map((m, i) => (
                  <option key={i} value={String(i + 1)}>{m}</option>
                ))}
              </select>
              <select
                value={arrYear}
                onChange={e => setArrYear(e.target.value)}
                style={selectStyle}
              >
                <option value="">{tL.yearPlaceholder}</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 8, padding: '0.75rem 1rem', color: C.error, fontSize: '0.875rem', lineHeight: 1.5 }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit} disabled={loading}
            className="w-100 fw-bold border-0"
            style={{ padding: '0.85rem', minHeight: 'var(--touch-target)', background: loading ? '#e0e0e0' : C.orange, color: loading ? C.textMid : C.text, borderRadius: 10, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem' }}
          >
            {loading ? tL.loading : tL.btn}
          </button>
        </div>

        {/* Supporto */}
        <div
          className="text-center mt-4"
          style={{ paddingTop: '1.5rem', borderTop: `1px solid ${C.border}` }}
        >
          <p className="mb-2" style={{ fontSize: '0.82rem', color: C.textMuted }}>{tL.noBooking}</p>
          <div className="d-flex justify-content-center" style={{ gap: '1.5rem' }}>
            <a href="https://wa.me/393283131500" style={supportLink}>
              <i className="bi bi-whatsapp me-1" aria-hidden="true" />
              WhatsApp
            </a>
            <a href="mailto:contattolivingapple@gmail.com" style={supportLink}>
              <i className="bi bi-envelope-fill me-1" aria-hidden="true" />
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight: '70vh', background: '#f9fafb' };
const card: React.CSSProperties = { borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 420 };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#555555', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.95rem', minHeight: 'var(--touch-target)', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.95rem', color: '#111', outline: 'none', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.5rem', minHeight: 'var(--touch-target)', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: '0.92rem', color: '#111', outline: 'none', background: '#fff', cursor: 'pointer', appearance: 'auto' };
const supportLink: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 };
