'use client';

import { useState, useEffect, useCallback } from 'react';
import GuestLogin     from './GuestLogin';
import DepositSection from './DepositSection';
import CheckinSection from './CheckinSection';
import BedSection     from './BedSection';

const C = {
  blue:        '#1E73BE',
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
          ✅ {tD.depositSuccess}
        </div>
      )}
      {depositResult === 'cancel' && (
        <div style={{ background: C.blueLight, borderBottom: `1px solid #bfdbfe`, padding: '0.85rem 1.5rem', textAlign: 'center', color: C.blue, fontWeight: 700, fontSize: '0.88rem' }}>
          ℹ️ {tD.depositCancel}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '1.1rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
              🔐 {tD.title}
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
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

        {/* 1. Info prenotazione */}
        <div style={card}>
          <div style={{ marginBottom: '1.25rem', padding: '1rem 1.1rem', background: C.blueLight, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {tD.yourProperty}
              </p>
              {booking.roomSlug
                ? <a href={`/${locale}/residenze/${booking.roomSlug}`} style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text, textDecoration: 'none' }}>{booking.roomName}</a>
                : <span style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text }}>{booking.roomName}</span>
              }
              {booking.propertyName && <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: C.textMid }}>{booking.propertyName}</p>}
            </div>
            <span style={{ fontSize: '2rem' }}>🏡</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <InfoTile label="Check-in"          value={fmtDate(booking.checkIn)}  icon="📅" />
            <InfoTile label="Check-out"         value={fmtDate(booking.checkOut)} icon="📅" />
            <InfoTile label={tD.nights}         value={String(nights)}            icon="🌙" />
            <InfoTile label={tD.guests}
              value={`${booking.numAdult} ${tD.adults}${booking.numChild > 0 ? ` · ${booking.numChild} ${tD.children}` : ''}`}
              icon="👥" />
          </div>

          {/* Pagamenti */}
          {booking.totalCharged > 0 && (
            <div style={{ paddingTop: '1rem', borderTop: `1px solid ${C.borderLight}` }}>
              <p style={{ margin: '0 0 0.65rem', fontSize: '0.75rem', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                💰 {tD.payments}
              </p>
              {booking.isAirbnb ? (
                <div>
                  <PayRow label={tD.total} value={`€ ${booking.totalCharged.toFixed(2)}`} />
                  <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: C.success, fontWeight: 600 }}>✅ {tD.paidViaAirbnb}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <PayRow label={tD.total}      value={`€ ${booking.totalCharged.toFixed(2)}`} />
                  <PayRow label={tD.paid}       value={`€ ${booking.totalPaid.toFixed(2)}`}    color={C.success} />
                  <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: '0.35rem', marginTop: '0.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: C.text }}>{tD.balanceDue}</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: booking.balanceDue === 0 ? C.success : C.orange }}>€ {booking.balanceDue.toFixed(2)}</span>
                  </div>
                  {booking.balanceDue === 0 && <div style={{ fontSize: '0.82rem', color: C.success, fontWeight: 600 }}>✅ {tD.fullyPaid}</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Deposito */}
        {/* Configurazione letti */}
        <BedSection locale={locale} t={t.beds} numGuests={(booking.numAdult ?? 0) + (booking.numChild ?? 0)} />

        <DepositSection locale={locale} t={t} bookId={booking.bookId} amount={booking.depositAmount} deposit={deposit} onDepositStarted={() => {}} />

        {/* 3. Self check-in */}
        {checkin && <CheckinSection locale={locale} t={t} bookId={booking.bookId} checkin={checkin} />}

        {/* 4. FAQ */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span>❓</span>
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
            <a href="https://wa.me/393283131500" style={supportLink}>💬 WhatsApp</a>
            <a href="mailto:contattolivingapple@gmail.com" style={supportLink}>✉️ Email</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '0.75rem', border: '1px solid #e5e7eb' }}>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.72rem', color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{icon} {label}</p>
      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111111' }}>{value}</p>
    </div>
  );
}

function PayRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
      <span style={{ color: '#555555' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color ?? '#111111' }}>{value}</span>
    </div>
  );
}

const card: React.CSSProperties        = { background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' };
const supportLink: React.CSSProperties = { color: '#1E73BE', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 };
