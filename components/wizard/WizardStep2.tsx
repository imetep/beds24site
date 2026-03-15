'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWizardStore } from '@/store/wizard-store';

// ─── Costanti multilingua ────────────────────────────────────────────────────
const MONTHS: Record<string, string[]> = {
  it: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  pl: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
};
const DAYS: Record<string, string[]> = {
  it: ['Lu','Ma','Me','Gi','Ve','Sa','Do'],
  en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
  de: ['Mo','Di','Mi','Do','Fr','Sa','So'],
  pl: ['Pn','Wt','Śr','Cz','Pt','So','Nd'],
};
const UI: Record<string, Record<string,string>> = {
  it: {
    title: 'Quando volete venire?',
    checkin: 'Check-in', checkout: 'Check-out',
    selectCheckin: 'Seleziona la data di check-in',
    selectCheckout: 'Ora seleziona la data di check-out',
    notte: 'notte', notti: 'notti',
    next: 'Continua', back: 'Indietro',
    loadingAvail: 'Caricamento disponibilità...',
    minStayMsg: (n: number) => `Soggiorno minimo ${n} notti da questa data`,
    cancelDates: 'Cancella date',
  },
  en: {
    title: 'When do you want to come?',
    checkin: 'Check-in', checkout: 'Check-out',
    selectCheckin: 'Select check-in date',
    selectCheckout: 'Now select check-out date',
    notte: 'night', notti: 'nights',
    next: 'Continue', back: 'Back',
    loadingAvail: 'Loading availability...',
    minStayMsg: (n: number) => `Minimum stay ${n} nights from this date`,
    cancelDates: 'Clear dates',
  },
  de: {
    title: 'Wann möchten Sie kommen?',
    checkin: 'Check-in', checkout: 'Check-out',
    selectCheckin: 'Check-in-Datum auswählen',
    selectCheckout: 'Jetzt Check-out-Datum auswählen',
    notte: 'Nacht', notti: 'Nächte',
    next: 'Weiter', back: 'Zurück',
    loadingAvail: 'Verfügbarkeit wird geladen...',
    minStayMsg: (n: number) => `Mindestaufenthalt ${n} Nächte ab diesem Datum`,
    cancelDates: 'Daten löschen',
  },
  pl: {
    title: 'Kiedy chcecie przyjechać?',
    checkin: 'Zameldowanie', checkout: 'Wymeldowanie',
    selectCheckin: 'Wybierz datę zameldowania',
    selectCheckout: 'Teraz wybierz datę wymeldowania',
    notte: 'noc', notti: 'nocy',
    next: 'Dalej', back: 'Wstecz',
    loadingAvail: 'Ładowanie dostępności...',
    minStayMsg: (n: number) => `Minimalny pobyt ${n} nocy od tej daty`,
    cancelDates: 'Wyczyść daty',
  },
};

// ─── Tipi ────────────────────────────────────────────────────────────────────
// Beds24 /inventory/rooms/availability: { "YYYY-MM-DD": true/false }
// true = disponibile per check-in, false = occupato/bloccato
type AvailabilityMap = Record<string, boolean>;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function parseYMD(s: string): Date {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}
function nightsBetween(a: string, b: string) {
  return Math.round((parseYMD(b).getTime() - parseYMD(a).getTime()) / 86400000);
}
function formatFriendly(ymd: string, locale: string) {
  const d = parseYMD(ymd);
  const months = MONTHS[locale] ?? MONTHS.it;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
function buildCells(year: number, month: number): (number|null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysCount = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);
  return cells;
}
function addMonths(year: number, month: number, delta: number) {
  let m = month + delta;
  let y = year + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return { year: y, month: m };
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  translations: {
    step2: { title?: string; checkin: string; checkout: string; next: string; back?: string };
  };
  locale?: string;
  roomId?: number | null;
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function WizardStep2({ translations: _t, locale = 'it', roomId }: Props) {
  const ui = UI[locale] ?? UI.it;
  const months = MONTHS[locale] ?? MONTHS.it;
  const days   = DAYS[locale]   ?? DAYS.it;

  const { checkIn, checkOut, setCheckIn, setCheckOut, nextStep, prevStep } = useWizardStore();

  // Stato navigazione calendario
  const today = new Date(); today.setHours(0,0,0,0);
  const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Hover per preview range
  const [hoverYMD, setHoverYMD] = useState<string|null>(null);

  // Disponibilità da Beds24
  const [calendarData, setCalendarData] = useState<AvailabilityMap>({});
  const [loadingAvail, setLoadingAvail] = useState(false);

  // Fase selezione
  const phase: 'checkin'|'checkout' = checkIn && !checkOut ? 'checkout' : 'checkin';

  // Desktop: mostra 2 mesi se viewport >= 640px
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch disponibilità se roomId noto
  const fetchAvailability = useCallback(async () => {
    if (!roomId) return;
    setLoadingAvail(true);
    try {
      const res = await fetch(`/api/availability?roomId=${roomId}`);
      if (!res.ok) return;
      const data = await res.json();
      // Beds24 risponde: { data: [{ roomId, calendar: [...] }] }
      // Beds24 risponde: { data: [{ roomId, availability: { "YYYY-MM-DD": true/false } }] }
      const roomData = data?.data?.[0];
      const avail: AvailabilityMap = roomData?.availability ?? {};
      console.log('[WizardStep2] availability keys:', Object.keys(avail).length);
      setCalendarData(avail);
    } catch {
      // Silente: se fallisce, mostriamo il calendario senza disponibilità
    } finally {
      setLoadingAvail(false);
    }
  }, [roomId]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  // ── Logica giorno ─────────────────────────────────────────────────────────
  function isDayUnavailable(ymd: string): boolean {
    if (ymd < todayYMD) return true;
    // Se abbiamo dati Beds24 → false significa occupato
    if (ymd in calendarData) return calendarData[ymd] === false;
    return false; // nessun dato = disponibile
  }

  function getMinStay(_ymd: string): number {
    // minStay non disponibile da /availability — usiamo 1 come default
    return 1;
  }

  // In fase checkout: il giorno è selezionabile solo se la distanza dal checkin
  // rispetta il minStay del checkin
  function isCheckoutAllowed(ymd: string): boolean {
    if (!checkIn) return false;
    const minStay = getMinStay(checkIn);
    const diff = nightsBetween(checkIn, ymd);
    if (diff < minStay) return false;
    // Verifica che non ci siano giorni occupati nel range
    const start = parseYMD(checkIn);
    const end = parseYMD(ymd);
    for (let t = start.getTime() + 86400000; t < end.getTime(); t += 86400000) {
      const d = new Date(t);
      const dYMD = toYMD(d.getFullYear(), d.getMonth(), d.getDate());
      if (isDayUnavailable(dYMD)) return false;
    }
    return true;
  }

  // ── Click giorno ─────────────────────────────────────────────────────────
  function handleDayClick(ymd: string) {
    if (ymd < todayYMD) return;
    if (isDayUnavailable(ymd)) return;

    if (phase === 'checkin') {
      setCheckIn(ymd);
      setCheckOut('');
      setHoverYMD(null);
    } else {
      if (!isCheckoutAllowed(ymd)) return;
      setCheckOut(ymd);
      setHoverYMD(null);
    }
  }

  // ── Navigazione mesi ──────────────────────────────────────────────────────
  function goToPrev() {
    const prev = addMonths(viewYear, viewMonth, -1);
    if (toYMD(prev.year, prev.month, 1) >= toYMD(today.getFullYear(), today.getMonth(), 1)) {
      setViewYear(prev.year); setViewMonth(prev.month);
    }
  }
  function goToNext() {
    const next = addMonths(viewYear, viewMonth, 1);
    setViewYear(next.year); setViewMonth(next.month);
  }

  const canContinue = !!(checkIn && checkOut);
  const nights = canContinue ? nightsBetween(checkIn!, checkOut!) : null;
  const rangeEnd = phase === 'checkout' ? (checkOut || hoverYMD) : checkOut;
  const isPrevDisabled = toYMD(viewYear, viewMonth, 1) <= toYMD(today.getFullYear(), today.getMonth(), 1);

  // Secondo mese per desktop
  const secondMonth = addMonths(viewYear, viewMonth, 1);

  // ── Render singolo mese ───────────────────────────────────────────────────
  function renderMonth(year: number, month: number) {
    const cells = buildCells(year, month);
    return (
      <div style={{ flex: 1 }}>
        {/* Nomi giorni */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
          {days.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#888', paddingBottom: 6 }}>
              {d}
            </div>
          ))}
        </div>
        {/* Celle giorni */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px 0' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ymd = toYMD(year, month, day);
            const isPast = ymd < todayYMD;
            const unavail = isDayUnavailable(ymd);
            const isStart = ymd === checkIn;
            const isEnd   = ymd === checkOut;
            const inRange = !!(checkIn && rangeEnd && ymd > checkIn && ymd < rangeEnd);
            const isHover = ymd === hoverYMD && phase === 'checkout';
            const isToday = ymd === todayYMD;

            // Checkout non permesso per minStay
            const checkoutBlocked = phase === 'checkout' && !isStart && !isPast && !unavail && !isCheckoutAllowed(ymd);

            const isDisabled = isPast || unavail || (phase === 'checkout' && checkoutBlocked);

            return (
              <button
                key={i}
                onClick={() => handleDayClick(ymd)}
                onMouseEnter={() => {
                  if (phase === 'checkout' && !isDisabled) setHoverYMD(ymd);
                }}
                onMouseLeave={() => setHoverYMD(null)}
                disabled={isDisabled}
                style={{
                  position: 'relative',
                  height: 40, width: '100%',
                  border: 'none',
                  borderRadius: (isStart || isEnd) ? '50%' : '0',
                  background: (isStart || isEnd)
                    ? '#1E73BE'
                    : inRange || isHover
                    ? '#EBF4FC'
                    : 'transparent',
                  color: (isStart || isEnd) ? '#fff'
                    : isPast || unavail ? '#ccc'
                    : checkoutBlocked ? '#ccc'
                    : '#111',
                  fontSize: 14,
                  fontWeight: (isStart || isEnd) ? 700 : isToday ? 700 : 400,
                  cursor: isDisabled ? 'default' : 'pointer',
                  textDecoration: (isPast || unavail) ? 'line-through' : 'none',
                  outline: 'none',
                  transition: 'background 0.1s',
                }}
              >
                {day}
                {/* Punto "oggi" */}
                {isToday && !isStart && !isEnd && (
                  <span style={{
                    position: 'absolute', bottom: 4, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#1E73BE', display: 'block',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1rem', color: '#111' }}>
        {ui.title}
      </h2>

      {/* Pill date selezionate */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={pillStyle(!!checkIn, phase === 'checkin')}>
          <span style={pillLabelStyle}>{ui.checkin}</span>
          <span style={pillValueStyle}>{checkIn ? formatFriendly(checkIn, locale) : '—'}</span>
        </div>
        <div style={{ alignSelf: 'center', color: '#ccc', fontSize: 20, flexShrink: 0 }}>→</div>
        <div style={pillStyle(!!checkOut, phase === 'checkout')}>
          <span style={pillLabelStyle}>{ui.checkout}</span>
          <span style={pillValueStyle}>{checkOut ? formatFriendly(checkOut, locale) : '—'}</span>
        </div>
      </div>

      {/* Istruzione fase */}
      <p style={{ fontSize: 13, color: '#1E73BE', margin: '0 0 16px', fontWeight: 500, minHeight: 18 }}>
        {loadingAvail
          ? ui.loadingAvail
          : phase === 'checkin' ? ui.selectCheckin : ui.selectCheckout}
      </p>

      {/* Wrapper calendario */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>

        {/* Controlli navigazione */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 10px',
        }}>
          <button
            onClick={goToPrev}
            disabled={isPrevDisabled}
            style={navBtnStyle(isPrevDisabled)}
            aria-label="Mese precedente"
          >
            ‹
          </button>

          {/* Titoli mesi */}
          <div style={{ display: 'flex', flex: 1, justifyContent: isDesktop ? 'space-around' : 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
              {months[viewMonth]} {viewYear}
            </span>
            {isDesktop && (
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                {months[secondMonth.month]} {secondMonth.year}
              </span>
            )}
          </div>

          <button onClick={goToNext} style={navBtnStyle(false)} aria-label="Mese successivo">
            ›
          </button>
        </div>

        {/* Griglia giorni */}
        <div style={{
          display: 'flex',
          gap: isDesktop ? 32 : 0,
          padding: isDesktop ? '0 24px 20px' : '0 12px 16px',
        }}>
          {renderMonth(viewYear, viewMonth)}
          {isDesktop && (
            <>
              <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />
              {renderMonth(secondMonth.year, secondMonth.month)}
            </>
          )}
        </div>
      </div>

      {/* Badge notti + cancella */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, minHeight: 34 }}>
        {nights && nights > 0 && (
          <div style={{
            background: '#EBF4FC', color: '#1E73BE',
            border: '1px solid #1E73BE', borderRadius: 20,
            padding: '4px 14px', fontSize: 14, fontWeight: 600,
          }}>
            {nights} {nights === 1 ? ui.notte : ui.notti}
          </div>
        )}
        {(checkIn || checkOut) && (
          <button
            onClick={() => { setCheckIn(''); setCheckOut(''); }}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            {ui.cancelDates}
          </button>
        )}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 'auto', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={nextStep}
          disabled={!canContinue}
          style={{
            width: '100%', padding: '0.9rem', borderRadius: 10, border: 'none',
            background: canContinue ? '#FCAF1A' : '#e5e7eb',
            color: canContinue ? '#fff' : '#aaa',
            fontSize: '1rem', fontWeight: 700,
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          {ui.next} →
        </button>
        <button
          onClick={prevStep}
          style={{ background: 'none', border: 'none', color: '#1E73BE', fontSize: '0.9rem', cursor: 'pointer', padding: 0, textAlign: 'center' }}
        >
          ← {ui.back}
        </button>
      </div>

    </div>
  );
}

// ─── Stili componenti ────────────────────────────────────────────────────────
const pillStyle = (active: boolean, current: boolean): React.CSSProperties => ({
  flex: 1, padding: '8px 12px', borderRadius: 10,
  border: `2px solid ${current ? '#1E73BE' : active ? '#1E73BE' : '#e5e7eb'}`,
  background: active ? '#EBF4FC' : '#f9fafb',
  color: active ? '#1E73BE' : '#aaa',
  boxShadow: current ? '0 0 0 3px rgba(30,115,190,0.12)' : 'none',
  transition: 'all 0.15s',
  minWidth: 0,
});
const pillLabelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', opacity: 0.7, display: 'block',
};
const pillValueStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, display: 'block',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};
const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'none', border: 'none',
  fontSize: 24, lineHeight: 1, cursor: disabled ? 'default' : 'pointer',
  color: disabled ? '#ddd' : '#333',
  padding: '0 4px', flexShrink: 0,
  fontWeight: 300,
});
