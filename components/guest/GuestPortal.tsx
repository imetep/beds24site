'use client';

import { useState, useEffect, useCallback } from 'react';
import GuestLogin     from './GuestLogin';
import DepositSection        from './DepositSection';
import CheckinSection        from './CheckinSection';
import BedSection            from './BedSection';
import ChangeRequestWizard   from './ChangeRequestWizard';
import { Icon } from '@/components/ui/Icon';

interface BookingData {
  bookId: string; roomId: number; roomName: string; roomSlug: string;
  propertyName: string; checkIn: string; checkOut: string;
  numAdult: number; numChild: number; guestName: string;
  status: string; channel: string; isAirbnb: boolean;
  totalCharged: number; totalPaid: number; balanceDue: number;
  depositAmount: number | null;
  invoiceItems: { description: string; amount: number }[];
}
interface CheckinData { status: 'PENDING'|'APPROVED'|'REJECTED'; rejectReason: string|null; messages: {from:'host'|'guest';text:string;time:string}[]; }
interface DepositData  { url?: string; amount: number; status: 'pending'|'authorized'|'captured'|'cancelled'; createdAt: string; }

type Phase = 'loading' | 'login' | 'dashboard';

export default function GuestPortal({ locale, t }: { locale: string; t: any }) {
  const [phase,   setPhase]   = useState<Phase>('loading');
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [checkin, setCheckin] = useState<CheckinData | null>(null);
  const [deposit, setDeposit] = useState<DepositData | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const tD  = t.dashboard;
  const tFQ = t.faq;

  const depositResult = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('deposit') : null;

  const loadBooking = useCallback(async () => {
    // Hint client-only: evita la fetch (e il 401 rumoroso in console) se
    // l'utente non ha mai loggato in questo browser. Il cookie guest_session
    // è httpOnly quindi non leggibile qui; usiamo localStorage come flag.
    if (typeof window !== 'undefined' && !localStorage.getItem('guest_portal_session')) {
      setPhase('login');
      return;
    }
    try {
      const res = await fetch('/api/portal/booking', { cache: 'no-store' });
      if (res.status === 401 || !res.ok) {
        localStorage.removeItem('guest_portal_session');
        setPhase('login');
        return;
      }
      const data = await res.json();
      setBooking(data.booking); setCheckin(data.checkin); setDeposit(data.deposit);
      setPhase('dashboard');
    } catch { setPhase('login'); }
  }, []);

  useEffect(() => { loadBooking(); }, [loadBooking]);

  const handleLogout = async () => {
    await fetch('/api/portal/auth', { method: 'DELETE' });
    if (typeof window !== 'undefined') localStorage.removeItem('guest_portal_session');
    setPhase('login'); setBooking(null); setCheckin(null); setDeposit(null);
  };

  if (phase === 'loading') {
    return (
      <div className="guest-portal-loading">
        <span>{tD.loading}</span>
      </div>
    );
  }

  if (phase === 'login') return <GuestLogin locale={locale} t={t} onLoginSuccess={loadBooking} />;
  if (!booking) return null;

  const nights = booking.checkIn && booking.checkOut
    ? Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000) : 0;

  const fmtDate = (d: string) => d
    ? new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const faqs = [
    { q: tFQ.q1, a: tFQ.a1 },
    { q: tFQ.q2, a: tFQ.a2 },
    { q: tFQ.q3, a: tFQ.a3 },
    { q: tFQ.q4, a: tFQ.a4 },
    { q: tFQ.q5, a: tFQ.a5 },
    { q: tFQ.q6, a: tFQ.a6 },
  ];

  return (
    <div className="guest-portal">

      {/* Banner Stripe return */}
      {depositResult === 'success' && (
        <div className="guest-portal__notice guest-portal__notice--success">
          <Icon name="check-circle-fill" className="me-1" />
          {tD.depositSuccess}
        </div>
      )}
      {depositResult === 'cancel' && (
        <div className="guest-portal__notice guest-portal__notice--info">
          <Icon name="info-circle-fill" className="me-1" />
          {tD.depositCancel}
        </div>
      )}

      {/* Header */}
      <div className="guest-portal__header">
        <div className="page-container d-flex justify-content-between align-items-center">
          <div>
            <h1 className="guest-portal__title">
              <Icon name="shield-lock-fill" className="me-2" />
              {tD.title}
            </h1>
            <p className="guest-portal__subtitle">
              {tD.hi} {booking.guestName.split(' ')[0]} · #{booking.bookId}
            </p>
          </div>
          <button onClick={handleLogout} className="guest-portal__logout">
            {t.login.logout}
          </button>
        </div>
      </div>

      {/* Contenuto */}
      <div className="page-container guest-portal__content">

        {/* UX 3.6 — Stato prenotazione (primo elemento visibile dopo login) */}
        {checkin && (() => {
          const statusMap = {
            APPROVED: { cls: 'bg-success',        icon: 'check-circle-fill',       label: { it: 'Approvato',   en: 'Approved',  de: 'Genehmigt',   pl: 'Zatwierdzone' } },
            PENDING:  { cls: 'bg-warning text-dark', icon: 'hourglass-split',       label: { it: 'In attesa',   en: 'Pending',   de: 'Ausstehend',  pl: 'Oczekujące' } },
            REJECTED: { cls: 'bg-danger',         icon: 'x-circle-fill',           label: { it: 'Rifiutato',   en: 'Rejected',  de: 'Abgelehnt',   pl: 'Odrzucone' } },
          } as const;
          const s = statusMap[checkin.status as keyof typeof statusMap];
          if (!s) return null;
          return (
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex justify-content-between align-items-center py-2">
                <span className="small fw-semibold text-muted text-uppercase letter-tracking-wide">
                  {t.checkin?.title ?? 'Check-in'}
                </span>
                <span className={`badge rounded-pill fw-semibold ${s.cls}`}>
                  <Icon name={s.icon} className="me-1" />
                  {(s.label as Record<string, string>)[locale] ?? s.label.it}
                </span>
              </div>
            </div>
          );
        })()}

        {/* 1. Info prenotazione */}
        <div className="d-flex flex-column gap-3">

          {/* Hero struttura */}
          <div className="guest-portal__hero">
            <p className="guest-portal__hero-label">{tD.yourProperty}</p>
            {booking.roomSlug
              ? <a href={`/${locale}/residenze/${booking.roomSlug}`} target="_blank" rel="noopener noreferrer" className="guest-portal__hero-name">{booking.roomName} ↗</a>
              : <p className="guest-portal__hero-name">{booking.roomName}</p>
            }
            {booking.propertyName && <p className="guest-portal__hero-prop">{booking.propertyName}</p>}
          </div>

          {/* Date affiancate */}
          <div className="guest-portal__dates">
            <div className="guest-portal__date-card">
              <p className="guest-portal__date-label">Check-in</p>
              <p className="guest-portal__date-value">{fmtDate(booking.checkIn)}</p>
              <p className="guest-portal__date-time">dalle 15:00 alle 19:00</p>
            </div>
            <div className="guest-portal__nights">
              <div className="guest-portal__nights-line" />
              <p className="guest-portal__nights-label">{nights} {tD.nights.toLowerCase()}</p>
              <div className="guest-portal__nights-line" />
            </div>
            <div className="guest-portal__date-card">
              <p className="guest-portal__date-label">Check-out</p>
              <p className="guest-portal__date-value">{fmtDate(booking.checkOut)}</p>
              <p className="guest-portal__date-time">dalle 8:00 alle 10:00</p>
            </div>
          </div>

          {/* Ospiti + Pagamenti */}
          <div className="dashboard-card">

            {/* Ospiti */}
            <div className="dashboard-card__row">
              <div>
                <p className="guest-portal__date-label">{tD.guests}</p>
                <p className="dashboard-card__title">
                  {booking.numAdult} {tD.adults}{booking.numChild > 0 ? ` · ${booking.numChild} ${tD.children}` : ''}
                </p>
              </div>
              <div className="icon-avatar">
                <Icon name="people-fill" />
              </div>
            </div>

            {/* Pagamenti */}
            {booking.totalCharged > 0 && (
              <>
                <p className="guest-portal__date-label">
                  <Icon name="cash-coin" className="me-1" />
                  {tD.payments}
                </p>
                {booking.isAirbnb ? (
                  <>
                    <PayRow label={tD.total} value={`€ ${booking.totalCharged.toFixed(2)}`} />
                    <div className="pay-row__paid-confirm">
                      <Icon name="check-circle-fill" className="me-1" />
                      {tD.paidViaAirbnb}
                    </div>
                  </>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    {/* Voci invoice dettagliate */}
                    {(booking.invoiceItems ?? []).map((item, i) => (
                      <PayRow key={i} label={item.description} value={`€ ${item.amount.toFixed(2)}`} small />
                    ))}
                    {(booking.invoiceItems ?? []).length > 0 && (
                      <div className="pay-row__divider" />
                    )}
                    <PayRow label={tD.total} value={`€ ${booking.totalCharged.toFixed(2)}`} />
                    <PayRow label={tD.paid}  value={`€ ${booking.totalPaid.toFixed(2)}`} success />
                    <div className="pay-row__balance-banner">
                      <span className="pay-row__balance-label">{tD.balanceDue}</span>
                      <span className={`pay-row__balance-value ${booking.balanceDue === 0 ? 'pay-row__balance-value--paid' : ''}`}>€ {booking.balanceDue.toFixed(2)}</span>
                    </div>
                    {booking.balanceDue === 0 && (
                      <div className="pay-row__paid-confirm">
                        <Icon name="check-circle-fill" className="me-1" />
                        {tD.fullyPaid}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>

        {/* Richiesta modifica */}
        <ChangeRequestWizard
          locale={locale}
          t={t}
          booking={{
            bookId:   booking.bookId,
            roomName: booking.roomName,
            checkIn:  booking.checkIn,
            checkOut: booking.checkOut,
            numAdult: booking.numAdult,
            numChild: booking.numChild,
          }}
        />

        {/* Configurazione letti */}
        <BedSection locale={locale} t={t.beds} numGuests={(booking.numAdult ?? 0) + (booking.numChild ?? 0)} />

        <DepositSection locale={locale} t={t} bookId={booking.bookId} amount={booking.depositAmount} deposit={deposit} onDepositStarted={() => {}} />

        {/* 3. Self check-in */}
        {checkin && <CheckinSection locale={locale} t={t} bookId={booking.bookId} checkin={checkin} />}

        {/* 4. FAQ */}
        <div className="dashboard-card">
          <div className="dashboard-card__title-row">
            <Icon name="question-circle-fill" className="text-primary-brand" />
            <h3 className="dashboard-card__title">{tFQ.title}</h3>
          </div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="faq-item__btn">
                  <span className="faq-item__q">{faq.q}</span>
                  <span className="faq-item__chevron">{faqOpen === i ? '▲' : '▼'}</span>
                </button>
                {faqOpen === i && <p className="faq-item__a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Supporto */}
        <div className="support-footer">
          <p className="support-footer__hint">{tD.needHelp}</p>
          <div className="support-footer__links">
            <a href="https://wa.me/393283131500" className="support-footer__link">
              <Icon name="whatsapp" className="me-1" />
              WhatsApp
            </a>
            <a href="mailto:contattolivingapple@gmail.com" className="support-footer__link">
              <Icon name="envelope-fill" className="me-1" />
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayRow({ label, value, success, small }: { label: string; value: string; success?: boolean; small?: boolean }) {
  return (
    <div className={`pay-row ${small ? 'pay-row--small' : ''}`}>
      <span className="pay-row__label">{label}</span>
      <span className={`pay-row__value ${success ? 'pay-row__value--success' : ''}`}>{value}</span>
    </div>
  );
}
