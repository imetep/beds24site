'use client';
import { useState } from 'react';

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
      <button onClick={() => { reset(); setOpen(true); }} className="change-req__toggle">
        <i className="bi bi-pencil-fill me-1" aria-hidden="true" />
        {tC.btnOpen}
      </button>
    );
  }

  return (
    <div className="guest-section">
      <div className="change-req__header">
        <h3 className="section-header__title">
          <i className="bi bi-pencil-fill me-1" aria-hidden="true" />
          {tC.title}
        </h3>
        <button onClick={() => { setOpen(false); reset(); }} className="change-req__close-btn" aria-label="Chiudi">
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>

      {/* ── Step 1 — cosa vuoi modificare ────────────────────────────────── */}
      {step === 1 && (
        <>
          <p className="change-req__hint">{tC.step1Hint}</p>
          <div className="change-req__options">
            {([
              { key: 'dates',     icon: 'bi-calendar-fill', label: tC.optDates     },
              { key: 'guests',    icon: 'bi-people-fill',   label: tC.optGuests    },
              { key: 'apartment', icon: 'bi-house-fill',    label: tC.optApartment },
            ] as { key: ChangeType; icon: string; label: string }[]).map(({ key, icon, label }) => {
              const active = types.has(key);
              return (
                <button key={key} onClick={() => toggleType(key)} className={`change-req__option-btn ${active ? 'is-active' : ''}`}>
                  <i className={`bi ${icon} change-req__option-icon`} aria-hidden="true" />
                  {label}
                  {active && <i className="bi bi-check-lg change-req__option-check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={types.size === 0}
            className="change-req__step1-cta"
          >
            {tC.btnNext} →
          </button>
        </>
      )}

      {/* ── Step 2 — dettagli ────────────────────────────────────────────── */}
      {step === 2 && (
        <>
          <p className="change-req__hint">{tC.step2Hint}</p>

          {types.has('dates') && (
            <div className="change-req__panel">
              <p className="change-req__panel-label">
                <i className="bi bi-calendar-fill me-1" aria-hidden="true" />
                {tC.optDates}
              </p>
              <div className="change-req__date-grid">
                <label className="change-req__field-label">
                  {tC.labelArrival}
                  <input type="date" value={dates.checkIn}
                    onChange={e => setDates(d => ({ ...d, checkIn: e.target.value }))}
                    className="change-req__input" />
                </label>
                <label className="change-req__field-label">
                  {tC.labelDeparture}
                  <input type="date" value={dates.checkOut}
                    onChange={e => setDates(d => ({ ...d, checkOut: e.target.value }))}
                    className="change-req__input" />
                </label>
              </div>
            </div>
          )}

          {types.has('guests') && (
            <div className="change-req__panel">
              <p className="change-req__panel-label">
                <i className="bi bi-people-fill me-1" aria-hidden="true" />
                {tC.optGuests}
              </p>
              <div className="change-req__date-grid">
                {[
                  { key: 'numAdult', label: tC.labelAdults,   min: 1 },
                  { key: 'numChild', label: tC.labelChildren, min: 0 },
                ].map(({ key, label, min }) => (
                  <label key={key} className="change-req__field-label">
                    {label}
                    <div className="change-req__counter-row">
                      <button onClick={() => setGuests(g => ({ ...g, [key]: Math.max(min, (g as any)[key] - 1) }))} className="change-req__counter-btn">−</button>
                      <span className="change-req__counter-value">{(guests as any)[key]}</span>
                      <button onClick={() => setGuests(g => ({ ...g, [key]: (g as any)[key] + 1 }))} className="change-req__counter-btn">+</button>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {types.has('apartment') && (
            <div className="change-req__panel">
              <p className="change-req__panel-label">
                <i className="bi bi-house-fill me-1" aria-hidden="true" />
                {tC.optApartment}
              </p>
              <textarea
                value={apt}
                onChange={e => setApt(e.target.value)}
                placeholder={tC.aptPlaceholder}
                rows={2}
                className="change-req__input change-req__textarea"
              />
            </div>
          )}

          <label className="change-req__field-label change-req__field-label--mb">
            {tC.labelNotes}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={tC.notesPlaceholder}
              rows={2}
              className="change-req__input change-req__textarea"
            />
          </label>

          <div className="change-req__nav">
            <button onClick={() => setStep(1)} className="change-req__nav-back">
              ← {tC.btnBack}
            </button>
            <button onClick={() => setStep(3)} className="change-req__nav-next">
              {tC.btnNext} →
            </button>
          </div>
        </>
      )}

      {/* ── Step 3 — riepilogo e invio ───────────────────────────────────── */}
      {step === 3 && status !== 'sent' && (
        <>
          <p className="change-req__hint">{tC.step3Hint}</p>
          <div className="change-req__recap">
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
            <p className="change-req__error">{tC.errorSend}</p>
          )}

          <div className="change-req__nav">
            <button onClick={() => setStep(2)} className="change-req__nav-back">
              ← {tC.btnBack}
            </button>
            <button
              onClick={send}
              disabled={status === 'sending'}
              className={`change-req__nav-next ${status === 'sending' ? 'is-loading' : ''}`}>
              {status === 'sending' ? tC.btnSending : tC.btnSend}
            </button>
          </div>
        </>
      )}

      {/* ── Conferma inviata ─────────────────────────────────────────────── */}
      {status === 'sent' && (
        <div className="change-req__sent">
          <div className="page-state__icon page-state__icon--xl page-state__icon--success">
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
          </div>
          <p className="change-req__sent-title">{tC.sentTitle}</p>
          <p className="change-req__sent-sub">{tC.sentSub}</p>
          <button
            onClick={() => { setOpen(false); reset(); }}
            className="change-req__sent-btn"
          >
            {tC.btnClose}
          </button>
        </div>
      )}
    </div>
  );
}
