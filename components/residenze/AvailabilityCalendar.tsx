'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';

// ─── Costanti ────────────────────────────────────────────────────────────────

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

const UI: Record<string, Record<string, string>> = {
  it: { title: 'Disponibilità', loading: 'Caricamento...', prev: '‹', next: '›',
        minStay: 'Soggiorno minimo consigliato: 3 notti', minSub: 'Puoi selezionare qualsiasi durata, ma potremmo avere poca disponibilità',
        legend_free: 'Disponibile', legend_busy: 'Occupato',
        checkin: 'Check-in', checkout: 'Check-out', clear: 'Cancella date',
        selectCheckin: 'Seleziona la data di arrivo', selectCheckout: 'Seleziona la data di partenza' },
  en: { title: 'Availability',  loading: 'Loading...',     prev: '‹', next: '›',
        minStay: 'Recommended minimum stay: 3 nights', minSub: 'Shorter stays are possible but rarely available',
        legend_free: 'Available', legend_busy: 'Booked',
        checkin: 'Check-in', checkout: 'Check-out', clear: 'Clear dates',
        selectCheckin: 'Select check-in date', selectCheckout: 'Select check-out date' },
  de: { title: 'Verfügbarkeit', loading: 'Laden...',       prev: '‹', next: '›',
        minStay: 'Empfohlener Mindestaufenthalt: 3 Nächte', minSub: 'Kürzere Aufenthalte sind möglich, aber selten verfügbar',
        legend_free: 'Verfügbar', legend_busy: 'Belegt',
        checkin: 'Check-in', checkout: 'Check-out', clear: 'Daten löschen',
        selectCheckin: 'Check-in wählen', selectCheckout: 'Check-out wählen' },
  pl: { title: 'Dostępność',    loading: 'Ładowanie...',   prev: '‹', next: '›',
        minStay: 'Zalecany minimalny pobyt: 3 noce', minSub: 'Krótsze pobyty są możliwe, ale rzadko dostępne',
        legend_free: 'Dostępny', legend_busy: 'Zajęty',
        checkin: 'Zameldowanie', checkout: 'Wymeldowanie', clear: 'Wyczyść daty',
        selectCheckin: 'Wybierz zameldowanie', selectCheckout: 'Wybierz wymeldowanie' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function diffNights(a: string, b: string): number {
  const da = new Date(a), db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(ymd: string, n: number): string {
  const d = parseYMD(ymd);
  d.setDate(d.getDate() + n);
  return toYMD(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMonths(year: number, month: number, delta: number) {
  let m = month + delta;
  const y = year + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return { year: y, month: m };
}

function buildCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function fmtDate(ymd: string, locale: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'short' }
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  roomId: number;
  locale?: string;
  interactive?: boolean; // true nella scheda appartamento
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AvailabilityCalendar({ roomId, locale = 'it', interactive = false }: Props) {
  const ui     = UI[locale]     ?? UI.it;
  const months = MONTHS[locale] ?? MONTHS.it;
  const days   = DAYS[locale]   ?? DAYS.it;

  const { checkIn, checkOut, setCheckIn, setCheckOut } = useWizardStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availMap,  setAvailMap]  = useState<Record<string, boolean>>({});
  const [loading,   setLoading]   = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  // fase selezione: 'checkin' → aspetta check-in, 'checkout' → aspetta check-out
  const [selectingCheckout, setSelectingCheckout] = useState(false);

  // Responsive
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => { window.removeEventListener('resize', check); };
  }, []);

  // Carica disponibilità
  useEffect(() => {
    setLoading(true);
    fetch(`/api/availability?roomId=${roomId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setAvailMap(data?.data?.[0]?.availability ?? {}))
      .catch(err => console.error('[AvailabilityCalendar]', err))
      .finally(() => setLoading(false));
  }, [roomId]);

  const phase: 'ci' | 'co' = selectingCheckout ? 'co' : (checkIn && !checkOut ? 'co' : 'ci');

  function isOccupied(ymd: string): boolean {
    if (ymd < todayYMD) return true;
    if (ymd in availMap) return availMap[ymd] === false;
    return false;
  }

  const rangeEnd = checkOut || hoverDate;

  function isInRange(ymd: string): boolean {
    if (!checkIn || !rangeEnd) return false;
    return ymd > checkIn && ymd < rangeEnd;
  }

  function handleDayClick(ymd: string) {
    if (!interactive) return;
    if (ymd < todayYMD) return;
    if (phase === 'ci') {
      // Clicco check-in: pre-seleziono +3 come suggerimento, resto in modalità checkout
      setCheckIn(ymd);
      setCheckOut(addDays(ymd, 3));
      setSelectingCheckout(true);
    } else {
      // Checkout: minimo 1 notte
      if (!checkIn || diffNights(checkIn, ymd) < 1) return;
      setCheckOut(ymd);
      setSelectingCheckout(false);
    }
  }

  function clearDates() {
    setCheckIn('');
    setCheckOut('');
    setSelectingCheckout(false);
  }

  // Navigazione
  const isPrevDisabled = toYMD(viewYear, viewMonth, 1) <= toYMD(today.getFullYear(), today.getMonth(), 1);
  const goToPrev = () => {
    if (isPrevDisabled) return;
    const p = addMonths(viewYear, viewMonth, -1);
    setViewYear(p.year); setViewMonth(p.month);
  };
  const goToNext = () => {
    const n = addMonths(viewYear, viewMonth, 1);
    setViewYear(n.year); setViewMonth(n.month);
  };

  const secondMonth = addMonths(viewYear, viewMonth, 1);

  // ─── Render singolo mese ───────────────────────────────────────────────────

  function renderMonth(year: number, month: number, showTitle: boolean) {
    const cells = buildCells(year, month);
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        {showTitle && (
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#111' }}>
            {months[month]} {year}
          </div>
        )}

        {/* Intestazione giorni */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {days.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#bbb', paddingBottom: 4 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Celle giorni */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ height: 36 }} />;

            const ymd      = toYMD(year, month, day);
            const occupied = isOccupied(ymd);
            const isPast   = ymd < todayYMD;
            const isToday  = ymd === todayYMD;
            const isCI     = checkIn === ymd;
            const isCO     = checkOut === ymd;
            const inRange  = isInRange(ymd);
            const isHover  = interactive && !occupied && hoverDate === ymd;
            const canClick = interactive && !occupied && !isPast;

            let bg = 'transparent';
            let color = isPast ? '#ccc' : occupied ? '#ccc' : '#222';
            let fontWeight: number = isToday ? 700 : 400;
            let borderRadius = '6px';

            if (isCI || isCO) {
              bg = '#1E73BE';
              color = '#fff';
              fontWeight = 700;
              borderRadius = isCI ? '6px 0 0 6px' : '0 6px 6px 0';
            } else if (inRange) {
              bg = '#EEF5FC';
              borderRadius = '0';
            } else if (isHover && phase === 'co' && checkIn && ymd > checkIn) {
              bg = '#f0f7ff';
            }

            return (
              <div
                key={i}
                onClick={() => handleDayClick(ymd)}
                onMouseEnter={() => interactive && setHoverDate(ymd)}
                onMouseLeave={() => interactive && setHoverDate(null)}
                style={{
                  height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                  fontWeight,
                  userSelect: 'none',
                  cursor: canClick ? 'pointer' : 'default',
                  borderRadius,
                  color,
                  textDecoration: (!isPast && occupied) ? 'line-through' : 'none',
                  background: bg,
                  opacity: isPast ? 0.4 : 1,
                  transition: 'background 0.1s',
                  position: 'relative',
                }}
              >
                {day}
                {isToday && !isCI && !isCO && (
                  <span style={{
                    position: 'absolute', bottom: 3, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#1E73BE',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── JSX principale ────────────────────────────────────────────────────────

  return (
    <section style={{ marginTop: 48 }}>

      {/* Titolo + legenda */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>
            {ui.title}
          </h2>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, background: 'transparent', border: '1px solid #e0e0e0', fontWeight: 600, fontSize: 12, color: '#222' }}>15</span>
              {ui.legend_free}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#999' }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: '#ccc', textDecoration: 'line-through' }}>15</span>
              {ui.legend_busy}
            </div>
          </div>
        </div>
      </div>

      {/* Box date selezionate — solo in modalità interattiva */}
      {interactive && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{
            flex: 1, border: `1.5px solid ${phase === 'ci' ? '#1E73BE' : '#e5e7eb'}`,
            borderRadius: 10, padding: '10px 14px',
            background: phase === 'ci' ? '#EEF5FC' : '#fff',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ui.checkin}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: checkIn ? '#111' : '#bbb', marginTop: 2 }}>
              {checkIn ? fmtDate(checkIn, locale) : '—'}
            </div>
          </div>
          <div style={{
            flex: 1, border: `1.5px solid ${phase === 'co' ? '#1E73BE' : '#e5e7eb'}`,
            borderRadius: 10, padding: '10px 14px',
            background: phase === 'co' ? '#EEF5FC' : '#fff',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ui.checkout}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: checkOut ? '#111' : '#bbb', marginTop: 2 }}>
              {checkOut ? fmtDate(checkOut, locale) : '—'}
            </div>
          </div>
          {(checkIn || checkOut) && (
            <button onClick={clearDates} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer', padding: '0 8px', alignSelf: 'center' }}>
              ✕
            </button>
          )}
        </div>
      )}

      {/* Hint */}
      {interactive && (
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px' }}>
          {phase === 'ci' ? ui.selectCheckin : ui.selectCheckout}
        </p>
      )}

      {/* Box soggiorno minimo */}
      {interactive && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF3DC 100%)',
          border: '1px solid #F5C842', borderRadius: 10,
          padding: '10px 14px', marginBottom: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🌙</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92610A' }}>{ui.minStay}</div>
            <div style={{ fontSize: 11, color: '#B07820', marginTop: 2 }}>{ui.minSub}</div>
          </div>
        </div>
      )}

      {/* Spinner */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: '#aaa', fontSize: 14 }}>
          <div style={{ width: 20, height: 20, border: '2px solid #eee', borderTop: '2px solid #1E73BE', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          {ui.loading}
        </div>
      )}

      {/* Calendario */}
      {!loading && (
        <div
          style={{
            border: '1px solid #e5e7eb', borderRadius: 16,
            padding: isDesktop ? '20px 28px 24px' : '16px 12px 20px',
            background: '#fff',
          }}
          onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={e => {
            if (touchStartX === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 50) {
              if (dx < 0) goToNext();
              else if (!isPrevDisabled) goToPrev();
            }
            setTouchStartX(null);
          }}
        >
          {/* Navigazione */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            {isDesktop && <button onClick={goToPrev} disabled={isPrevDisabled} style={navBtnStyle(isPrevDisabled)}>‹</button>}
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111', flex: 1, textAlign: isDesktop ? 'left' : 'center' }}>
              {months[viewMonth]} {viewYear}
            </span>
            {isDesktop && (
              <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{months[viewMonth]} {viewYear}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{months[secondMonth.month]} {secondMonth.year}</span>
              </div>
            )}
            {isDesktop && <button onClick={goToNext} style={navBtnStyle(false)}>›</button>}
          </div>

          {/* Mesi */}
          <div style={{ display: 'flex', gap: isDesktop ? 40 : 0 }}>
            {renderMonth(viewYear, viewMonth, false)}
            {isDesktop && (
              <>
                <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />
                {renderMonth(secondMonth.year, secondMonth.month, false)}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'none', border: 'none',
  fontSize: 28, lineHeight: 1,
  cursor: disabled ? 'default' : 'pointer',
  color: disabled ? '#ddd' : '#333',
  padding: '0 8px', fontWeight: 300, flexShrink: 0,
});
