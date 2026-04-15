'use client';
import { useState } from 'react';

const C = {
  blue:      '#1E73BE',
  blueLight: '#EEF5FC',
  orange:    '#FCAF1A',
  text:      '#111111',
  textMid:   '#555555',
  textMuted: '#888888',
  border:    '#e5e7eb',
  bg:        '#f9fafb',
  success:   '#16a34a',
};

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '16px',
  border: `1px solid ${C.border}`,
  padding: '1.5rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

type ChangeType = 'dates' | 'guests' | 'apartment';

interface Props {
  locale: string;
  t: any;
  booking: {
    bookId: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
    numAdult: number;
    numChild: number;
  };
}

export default function ChangeRequestWizard({ locale, t, booking }: Props) {
  const [open,    setOpen]    = useState(false);
  const [step,    setStep]    = useState<1|2|3>(1);
  const [types,   setTypes]   = useState<Set<ChangeType>>(new Set());
  const [dates,   setDates]   = useState({ checkIn: booking.checkIn, checkOut: booking.checkOut });
  const [guests,  setGuests]  = useState({ numAdult: booking.numAdult, numChild: booking.numChild });
  const [apt,     setApt]     = useState('');
  const [notes,   setNotes]   = useState('');
  const [status,  setStatus]  = useState<'idle'|'sending'|'sent'|'error'>('idle');

  const tC = t.changeRequest;

  function reset() {
    setStep(1); setTypes(new Set());
    setDates({ checkIn: booking.checkIn, checkOut: booking.checkOut });
    setGuests({ numAdult: booking.numAdult, numChild: booking.numChild });
    setApt(''); setNotes(''); setStatus('idle');
  }

  function toggleType(type: ChangeType) {
    setTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  async function send() {
    setStatus('sending');
    try {
      const res = await fetch('/api/portal/change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId:   booking.bookId,
          types:    Array.from(types),
          dates:    types.has('dates')     ? dates   : null,
          guests:   types.has('guests')    ? guests  : null,
          apartment:types.has('apartment') ? apt     : null,
          notes,
          locale,
        }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => { reset(); setOpen(true); }}
        style={{
          width: '100%', padding: '0.75rem',
          background: C.blueLight,
          border: `1px solid ${C.blue}`,
          borderRadius: '12px', cursor: 'pointer',
          fontSize: '0.88rem', color: C.blue, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}>
        ✏️ {tC.btnOpen}
      </button>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>
          ✏️ {tC.title}
        </h3>
        <button onClick={() => { setOpen(false); reset(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: C.textMuted }}>✕</button>
      </div>

      {/* ── Step 1 — cosa vuoi modificare ────────────────────────────────── */}
      {step === 1 && (
        <>
          <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: C.textMid }}>{tC.step1Hint}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {([
              { key: 'dates',     icon: '📅', label: tC.optDates     },
              { key: 'guests',    icon: '👥', label: tC.optGuests    },
              { key: 'apartment', icon: '🏠', label: tC.optApartment },
            ] as { key: ChangeType; icon: string; label: string }[]).map(({ key, icon, label }) => {
              const active = types.has(key);
              return (
                <button key={key} onClick={() => toggleType(key)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer',
                  border: active ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
                  background: active ? C.blueLight : '#fff',
                  fontSize: '0.9rem', fontWeight: active ? 700 : 400,
                  color: active ? C.blue : C.text,
                  transition: 'all .15s',
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                  {label}
                  {active && <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>✓</span>}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={types.size === 0}
            style={{
              width: '100%', padding: '0.75rem',
              background: types.size > 0 ? C.orange : C.border,
              border: 'none', borderRadius: '10px', cursor: types.size > 0 ? 'pointer' : 'default',
              fontSize: '0.9rem', fontWeight: 700, color: types.size > 0 ? '#fff' : C.textMuted,
            }}>
            {tC.btnNext} →
          </button>
        </>
      )}

      {/* ── Step 2 — dettagli ────────────────────────────────────────────── */}
      {step === 2 && (
        <>
          <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: C.textMid }}>{tC.step2Hint}</p>

          {types.has('dates') && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: C.bg, borderRadius: '10px' }}>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: C.textMid, textTransform: 'uppercase' }}>📅 {tC.optDates}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.82rem', color: C.textMid }}>
                  {tC.labelArrival}
                  <input type="date" value={dates.checkIn}
                    onChange={e => setDates(d => ({ ...d, checkIn: e.target.value }))}
                    style={{ display: 'block', width: '100%', marginTop: '0.3rem', padding: '0.5rem', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontSize: '0.82rem', color: C.textMid }}>
                  {tC.labelDeparture}
                  <input type="date" value={dates.checkOut}
                    onChange={e => setDates(d => ({ ...d, checkOut: e.target.value }))}
                    style={{ display: 'block', width: '100%', marginTop: '0.3rem', padding: '0.5rem', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                </label>
              </div>
            </div>
          )}

          {types.has('guests') && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: C.bg, borderRadius: '10px' }}>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: C.textMid, textTransform: 'uppercase' }}>👥 {tC.optGuests}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { key: 'numAdult', label: tC.labelAdults,   min: 1 },
                  { key: 'numChild', label: tC.labelChildren, min: 0 },
                ].map(({ key, label, min }) => (
                  <label key={key} style={{ fontSize: '0.82rem', color: C.textMid }}>
                    {label}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                      <button onClick={() => setGuests(g => ({ ...g, [key]: Math.max(min, (g as any)[key] - 1) }))}
                        style={{ width: 32, height: 32, border: `1px solid ${C.border}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '1rem' }}>−</button>
                      <span style={{ fontSize: '1rem', fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{(guests as any)[key]}</span>
                      <button onClick={() => setGuests(g => ({ ...g, [key]: (g as any)[key] + 1 }))}
                        style={{ width: 32, height: 32, border: `1px solid ${C.border}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '1rem' }}>+</button>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {types.has('apartment') && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: C.bg, borderRadius: '10px' }}>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: C.textMid, textTransform: 'uppercase' }}>🏠 {tC.optApartment}</p>
              <textarea
                value={apt}
                onChange={e => setApt(e.target.value)}
                placeholder={tC.aptPlaceholder}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <label style={{ fontSize: '0.82rem', color: C.textMid, display: 'block', marginBottom: '1rem' }}>
            {tC.labelNotes}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={tC.notesPlaceholder}
              rows={2}
              style={{ display: 'block', width: '100%', marginTop: '0.3rem', padding: '0.5rem', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: '0.65rem', background: 'none', border: `1px solid ${C.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', color: C.textMid }}>
              ← {tC.btnBack}
            </button>
            <button onClick={() => setStep(3)} style={{ flex: 2, padding: '0.65rem', background: C.orange, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
              {tC.btnNext} →
            </button>
          </div>
        </>
      )}

      {/* ── Step 3 — riepilogo e invio ───────────────────────────────────── */}
      {step === 3 && status !== 'sent' && (
        <>
          <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: C.textMid }}>{tC.step3Hint}</p>
          <div style={{ background: C.bg, borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.88rem', color: C.text, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><b>#{booking.bookId}</b> — {booking.roomName}</div>
            {types.has('dates') && (
              <div>📅 {tC.optDates}: {dates.checkIn} → {dates.checkOut}</div>
            )}
            {types.has('guests') && (
              <div>👥 {tC.optGuests}: {guests.numAdult} {tC.labelAdults} · {guests.numChild} {tC.labelChildren}</div>
            )}
            {types.has('apartment') && apt && (
              <div>🏠 {tC.optApartment}: {apt}</div>
            )}
            {notes && <div>📝 {notes}</div>}
          </div>

          {status === 'error' && (
            <p style={{ fontSize: '0.82rem', color: '#dc2626', marginBottom: '0.75rem' }}>{tC.errorSend}</p>
          )}

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: '0.65rem', background: 'none', border: `1px solid ${C.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', color: C.textMid }}>
              ← {tC.btnBack}
            </button>
            <button
              onClick={send}
              disabled={status === 'sending'}
              style={{ flex: 2, padding: '0.65rem', background: C.orange, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: '#fff', opacity: status === 'sending' ? 0.6 : 1 }}>
              {status === 'sending' ? tC.btnSending : tC.btnSend}
            </button>
          </div>
        </>
      )}

      {/* ── Conferma inviata ─────────────────────────────────────────────── */}
      {status === 'sent' && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
          <p style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '1rem', color: C.text }}>{tC.sentTitle}</p>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: C.textMid }}>{tC.sentSub}</p>
          <button onClick={() => { setOpen(false); reset(); }} style={{ padding: '0.6rem 1.5rem', background: C.blue, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
            {tC.btnClose}
          </button>
        </div>
      )}
    </div>
  );
}
