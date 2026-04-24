'use client';

import { useState, useEffect, useCallback } from 'react';
import GuestLogin     from './GuestLogin';
import DepositSection        from './DepositSection';
import CheckinSection        from './CheckinSection';
import BedSection            from './BedSection';
import ChangeRequestWizard   from './ChangeRequestWizard';

const C = {
  blue:        'var(--color-primary)',
  blueLight:   '#EEF5FC',
  orange:      '#FCAF1A',
  text:        '#111111',
  textMid:     '#555555',
  textMuted:   '#888888',
  border:      '#e5e7eb',
  borderLight: '#f0f0f0',
  bg:          '#f9fafb',
  success:     '#16a34a',
};

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
    try {
      const res = await fetch('/api/portal/booking', { cache: 'no-store' });
      if (res.status === 401) { setPhase('login'); return; }
      if (!res.ok)            { setPhase('login'); return; }
      const data = await res.json();
      setBooking(data.booking); setCheckin(data.checkin); setDeposit(data.deposit);
      setPhase('dashboard');
    } catch { setPhase('login'); }
  }, []);

  useEffect(() => { loadBooking(); }, [loadBooking]);

  const handleLogout = async () => {
    await fetch('/api/portal/auth', { method: 'DELETE' });
    setPhase('login'); setBooking(null); setCheckin(null); setDeposit(null);
  };

  if (phase === 'loading') {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: C.textMuted }}>{tD.loading}</span></div>;
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
    <div style={{ background: C.bg, minHeight: '70vh', paddingBottom: '4rem' }}>

      {/* Banner Stripe return */}
      {depositResult === 'success' && (
        <div style={{ background: '#d1fae5', borderBottom: '1px solid #6ee7b7', padding: '0.85rem 1.5rem', textAlign: 'center', color: '#065f46', fontWeight: 700, fontSize: '0.88rem' }}>
          <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
          {tD.depositSuccess}
        </div>
      )}
      {depositResult === 'cancel' && (
        <div style={{ background: C.blueLight, borderBottom: `1px solid #bfdbfe`, padding: '0.85rem 1.5rem', textAlign: 'center', color: C.blue, fontWeight: 700, fontSize: '0.88rem' }}>
          <i className="bi bi-info-circle-fill me-1" aria-hidden="true" />
          {tD.depositCancel}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0.85rem 1rem' }}>
        <div className="page-container d-flex justify-content-between align-items-center">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
              <i className="bi bi-shield-lock-fill me-2" aria-hidden="true" />
              {tD.title}
            </h1>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.79rem', color: C.textMuted }}>
              {tD.hi} {booking.guestName.split(' ')[0]} · #{booking.bookId}
            </p>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.82rem', color: C.textMid, cursor: 'pointer' }}>
            {t.login.logout}
          </button>
        </div>
      </div>

      {/* Contenuto */}
      <div className="page-container" style={{ padding: '0.75rem 0.75rem 3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* UX 3.6 — Stato prenotazione (primo elemento visibile dopo login) */}
        {checkin && (() => {
          const statusMap: Record<string, { cls: string; icon: string; label: Record<string, string> }> = {
            APPROVED: { cls: 'bg-success',        icon: 'bi-check-circle-fill',       label: { it: 'Approvato',   en: 'Approved',  de: 'Genehmigt',   pl: 'Zatwierdzone' } },
            PENDING:  { cls: 'bg-warning text-dark', icon: 'bi-hourglass-split',       label: { it: 'In attesa',   en: 'Pending',   de: 'Ausstehend',  pl: 'Oczekujące' } },
            REJECTED: { cls: 'bg-danger',         icon: 'bi-x-circle-fill',           label: { it: 'Rifiutato',   en: 'Rejected',  de: 'Abgelehnt',   pl: 'Odrzucone' } },
          };
          const s = statusMap[checkin.status];
          if (!s) return null;
          return (
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex justify-content-between align-items-center py-2">
                <span className="small fw-semibold text-muted text-uppercase" style={{ letterSpacing: '0.07em' }}>
                  {t.checkin?.title ?? 'Check-in'}
                </span>
                <span className={`badge rounded-pill fw-semibold ${s.cls}`}>
                  <i className={`bi ${s.icon} me-1`}></i>
                  {s.label[locale] ?? s.label.it}
                </span>
              </div>
            </div>
          );
        })()}

        {/* 1. Info prenotazione */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Hero struttura */}
          <div style={{ background: C.blue, borderRadius: '14px', padding: '1rem 1.1rem', position: 'relative', overflow: 'hidden' }}>
            <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', fontWeight: 600, color: C.blueLight, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tD.yourProperty}</p>
            {booking.roomSlug
              ? <a href={`/${locale}/residenze/${booking.roomSlug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '1.3rem', fontWeight: 700, color: '#fff', textDecoration: 'none', lineHeight: 1.2, marginBottom: '0.2rem' }}>{booking.roomName} ↗</a>
              : <p style={{ margin: '0 0 0.2rem', fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{booking.roomName}</p>
            }
            {booking.propertyName && <p style={{ margin: 0, fontSize: '0.78rem', color: C.blueLight, opacity: 0.8 }}>{booking.propertyName}</p>}
          </div>

          {/* Date affiancate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'stretch' }}>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.75rem' }}>
              <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Check-in</p>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: C.text }}>{fmtDate(booking.checkIn)}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: C.blue, fontWeight: 600 }}>dalle 15:00 alle 19:00</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', padding: '0 0.25rem' }}>
              <div style={{ width: 1, flex: 1, background: C.border }} />
              <p style={{ margin: 0, fontSize: '0.68rem', color: C.textMuted, whiteSpace: 'nowrap' }}>{nights} {tD.nights.toLowerCase()}</p>
              <div style={{ width: 1, flex: 1, background: C.border }} />
            </div>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.75rem' }}>
              <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Check-out</p>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: C.text }}>{fmtDate(booking.checkOut)}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: C.blue, fontWeight: 600 }}>dalle 8:00 alle 10:00</p>
            </div>
          </div>

          {/* Ospiti + Pagamenti */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1rem' }}>

            {/* Ospiti */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: `1px solid ${C.borderLight}` }}>
              <div>
                <p style={{ margin: '0 0 0.15rem', fontSize: '0.7rem', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{tD.guests}</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>
                  {booking.numAdult} {tD.adults}{booking.numChild > 0 ? ` · ${booking.numChild} ${tD.children}` : ''}
                </p>
              </div>
              <div style={{ background: C.blueLight, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                <i className="bi bi-people-fill" aria-hidden="true" />
              </div>
            </div>

            {/* Pagamenti */}
            {booking.totalCharged > 0 && (
              <>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  <i className="bi bi-cash-coin me-1" aria-hidden="true" />
                  {tD.payments}
                </p>
                {booking.isAirbnb ? (
                  <>
                    <PayRow label={tD.total} value={`€ ${booking.totalCharged.toFixed(2)}`} />
                    <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: C.success, fontWeight: 600 }}>
                      <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
                      {tD.paidViaAirbnb}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {/* Voci invoice dettagliate */}
                    {(booking.invoiceItems ?? []).map((item, i) => (
                      <PayRow key={i} label={item.description} value={`€ ${item.amount.toFixed(2)}`} small />
                    ))}
                    {(booking.invoiceItems ?? []).length > 0 && (
                      <div style={{ borderTop: `1px solid ${C.borderLight}`, marginTop: '0.25rem', paddingTop: '0.25rem' }} />
                    )}
                    <PayRow label={tD.total} value={`€ ${booking.totalCharged.toFixed(2)}`} />
                    <PayRow label={tD.paid}  value={`€ ${booking.totalPaid.toFixed(2)}`} color={C.success} />
                    <div style={{ background: '#FFF8EC', border: `1px solid ${C.orange}`, borderRadius: '10px', padding: '0.6rem 0.75rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#B07820' }}>{tD.balanceDue}</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: booking.balanceDue === 0 ? C.success : '#B07820' }}>€ {booking.balanceDue.toFixed(2)}</span>
                    </div>
                    {booking.balanceDue === 0 && <div style={{ fontSize: '0.82rem', color: C.success, fontWeight: 600, textAlign: 'center', paddingTop: '0.25rem' }}>
                      <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
                      {tD.fullyPaid}
                    </div>}
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
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <i className="bi bi-question-circle-fill" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>{tFQ.title}</h3>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < faqs.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '0.85rem 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: C.text }}>{faq.q}</span>
                <span style={{ color: C.blue, fontSize: '0.75rem', flexShrink: 0, marginLeft: '0.5rem' }}>{faqOpen === i ? '▲' : '▼'}</span>
              </button>
              {faqOpen === i && <p style={{ margin: '0 0 0.85rem', fontSize: '0.86rem', color: C.textMid, lineHeight: 1.65 }}>{faq.a}</p>}
            </div>
          ))}
        </div>

        {/* Supporto */}
        <div style={{ textAlign: 'center', paddingTop: '0.25rem' }}>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.82rem', color: C.textMuted }}>{tD.needHelp}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <a href="https://wa.me/393283131500" style={supportLink}>
            <i className="bi bi-whatsapp me-1" aria-hidden="true" />
            WhatsApp
          </a>
            <a href="mailto:contattolivingapple@gmail.com" style={supportLink}>✉️ Email</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value, icon, sub }: { label: string; value: string; icon: string; sub?: string }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '0.75rem', border: '1px solid #e5e7eb' }}>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.72rem', color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{icon} {label}</p>
      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111111' }}>{value}</p>
      {sub && <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>{sub}</p>}
    </div>
  );
}

function PayRow({ label, value, color, small }: { label: string; value: string; color?: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: small ? '0.8rem' : '0.875rem' }}>
      <span style={{ color: small ? '#888888' : '#555555' }}>{label}</span>
      <span style={{ fontWeight: small ? 400 : 700, color: color ?? '#111111' }}>{value}</span>
    </div>
  );
}

const card: React.CSSProperties        = { background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const supportLink: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 };
