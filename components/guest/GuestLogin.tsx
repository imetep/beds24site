'use client';

import { useState } from 'react';

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
      if (typeof window !== 'undefined') localStorage.setItem('guest_portal_session', '1');
      onLoginSuccess();
    } catch {
      setError(tL.errorNetwork);
      setLoading(false);
    }
  };

  if (rateLimited) {
    return (
      <div className="guest-login">
        <div className="guest-login__card">
          <div className="guest-login__rate-limited-icon">
            <i className="bi bi-clock-fill" aria-hidden="true" />
          </div>
          <h2 className="guest-login__rate-limited-title">{tL.rateLimited}</h2>
          <p className="guest-login__rate-limited-msg">{tL.rateLimitedMsg}</p>
          <div className="text-center">
            <a href="https://wa.me/393283131500" className="support-footer__link">
              <i className="bi bi-whatsapp me-1" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-login">
      <div className="guest-login__card">
        {/* Header */}
        <div className="text-center">
          <div className="guest-login__avatar">
            <i className="bi bi-shield-lock-fill" aria-hidden="true" />
          </div>
          <h1 className="guest-login__title">{tL.title}</h1>
          <p className="guest-login__subtitle">{tL.subtitle}</p>
        </div>

        {/* Form */}
        <div className="guest-login__form">
          <div>
            <label className="ui-field-label ui-field-label--uppercase">{tL.bookingId}</label>
            <input
              type="text" value={bookId} onChange={e => setBookId(e.target.value)}
              placeholder="es. 84750124" className="ui-field-input"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label className="ui-field-label ui-field-label--uppercase">{tL.arrival}</label>
            <div className="guest-login__date-grid">
              <select
                value={arrDay}
                onChange={e => setArrDay(e.target.value)}
                className="ui-field-input ui-field-input--select"
              >
                <option value="">{tL.dayPlaceholder}</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d)}>{String(d).padStart(2,'0')}</option>
                ))}
              </select>
              <select
                value={arrMonth}
                onChange={e => setArrMonth(e.target.value)}
                className="ui-field-input ui-field-input--select"
              >
                <option value="">{tL.monthPlaceholder}</option>
                {months.map((m, i) => (
                  <option key={i} value={String(i + 1)}>{m}</option>
                ))}
              </select>
              <select
                value={arrYear}
                onChange={e => setArrYear(e.target.value)}
                className="ui-field-input ui-field-input--select"
              >
                <option value="">{tL.yearPlaceholder}</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="guest-login__error">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit} disabled={loading}
            className="guest-login__submit"
          >
            {loading ? tL.loading : tL.btn}
          </button>
        </div>

        {/* Supporto */}
        <div className="support-footer support-footer--bordered">
          <p className="support-footer__hint">{tL.noBooking}</p>
          <div className="support-footer__links">
            <a href="https://wa.me/393283131500" className="support-footer__link">
              <i className="bi bi-whatsapp me-1" aria-hidden="true" />
              WhatsApp
            </a>
            <a href="mailto:contattolivingapple@gmail.com" className="support-footer__link">
              <i className="bi bi-envelope-fill me-1" aria-hidden="true" />
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
