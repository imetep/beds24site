'use client';
import { useState } from 'react';

const C = {
  blue:      'var(--color-primary)',
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
  borderRadius: 16,
  padding: '1.5rem',
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
        className="w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
        style={{
          padding: '0.75rem',
          background: C.blueLight,
          border: `1px solid ${C.blue}`,
          borderRadius: 12, cursor: 'pointer',
          fontSize: '0.88rem', color: C.blue,
        }}>
        <i className="bi bi-pencil-fill me-1" aria-hidden="true" />
        {tC.btnOpen}
      </button>
    );
  }

  return (
    <div className="bg-white border shadow-sm" style={card}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0 fw-bold" style={{ fontSize: '1rem', color: C.text }}>
          <i className="bi bi-pencil-fill me-1" aria-hidden="true" />
          {tC.title}
        </h3>
        <button onClick={() => { setOpen(false); reset(); }}
          className="btn p-0"
          style={{ fontSize: '1.2rem', color: C.textMuted }}>✕</button>
      </div>

      {/* ── Step 1 — cosa vuoi modificare ────────────────────────────────── */}
      {step === 1 && (
        <>
          <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: C.textMid }}>{tC.step1Hint}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {([
              { key: 'dates',     icon: 'bi-calendar-fill', label: tC.optDates     },
              { key: 'guests',    icon: 'bi-people-fill',   label: tC.optGuests    },
              { key: 'apartment', icon: 'bi-house-fill',    label: tC.optApartment },
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
                  <i className={`bi ${icon}`} style={{ fontSize: '1.2rem' }} aria-hidden="true" />
                  {label}
                  {active && <i className="bi bi-check-lg" style={{ marginLeft: 'auto', fontSize: '1rem' }} aria-hidden="true" />}
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
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: C.textMid, textTransform: 'uppercase' }}>
                <i className="bi bi-calendar-fill me-1" aria-hidden="true" />
                {tC.optDates}
              </p>
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
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: C.textMid, textTransform: 'uppercase' }}>
                <i className="bi bi-people-fill me-1" aria-hidden="true" />
                {tC.optGuests}
              </p>
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
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: C.textMid, textTransform: 'uppercase' }}>
                <i className="bi bi-house-fill me-1" aria-hidden="true" />
                {tC.optApartment}
              </p>
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
              <div><i className="bi bi-calendar-fill me-1" aria-hidden="true" />{tC.optDates}: {dates.checkIn} → {dates.checkOut}</div>
            )}
            {types.has('guests') && (
              <div><i className="bi bi-people-fill me-1" aria-hidden="true" />{tC.optGuests}: {guests.numAdult} {tC.labelAdults} · {guests.numChild} {tC.labelChildren}</div>
            )}
            {types.has('apartment') && apt && (
              <div><i className="bi bi-house-fill me-1" aria-hidden="true" />{tC.optApartment}: {apt}</div>
            )}
            {notes && <div><i className="bi bi-sticky-fill me-1" aria-hidden="true" />{notes}</div>}
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
        <div className="text-center py-4">
          <div className="mb-2" style={{ fontSize: '2.5rem' }}>✅</div>
          <p className="fw-bold mb-1" style={{ fontSize: '1rem', color: C.text }}>{tC.sentTitle}</p>
          <p className="mb-3" style={{ fontSize: '0.88rem', color: C.textMid }}>{tC.sentSub}</p>
          <button
            onClick={() => { setOpen(false); reset(); }}
            className="text-white fw-bold border-0"
            style={{ padding: '0.6rem 1.5rem', background: C.blue, borderRadius: 10, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            {tC.btnClose}
          </button>
        </div>
      )}
    </div>
  );
}
