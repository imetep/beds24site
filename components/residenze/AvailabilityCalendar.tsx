'use client';

import { useEffect, useState } from 'react';

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
  it: { title: 'Disponibilità', loading: 'Caricamento...', prev: '‹', next: '›', legend_free: 'Disponibile', legend_busy: 'Occupato' },
  en: { title: 'Availability',  loading: 'Loading...',     prev: '‹', next: '›', legend_free: 'Available',   legend_busy: 'Booked'   },
  de: { title: 'Verfügbarkeit', loading: 'Laden...',       prev: '‹', next: '›', legend_free: 'Verfügbar',   legend_busy: 'Belegt'   },
  pl: { title: 'Dostępność',    loading: 'Ładowanie...',   prev: '‹', next: '›', legend_free: 'Dostępny',    legend_busy: 'Zajęty'   },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  roomId: number;
  locale?: string;
  bookingUrl?: string;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AvailabilityCalendar({ roomId, locale = 'it' }: Props) {
  const ui     = UI[locale]     ?? UI.it;
  const months = MONTHS[locale] ?? MONTHS.it;
  const days   = DAYS[locale]   ?? DAYS.it;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [availMap,  setAvailMap]  = useState<Record<string, boolean>>({});
  const [loading,   setLoading]   = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  // Responsive
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  // Carica disponibilità da Beds24
  useEffect(() => {
    setLoading(true);
    fetch(`/api/availability?roomId=${roomId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const avail = data?.data?.[0]?.availability ?? {};
        setAvailMap(avail);
      })
      .catch(err => console.error('[AvailabilityCalendar] fetch error:', err))
      .finally(() => setLoading(false));
  }, [roomId]);

  function isOccupied(ymd: string): boolean {
    if (ymd < todayYMD) return true;
    if (ymd in availMap) return availMap[ymd] === false;
    return false;
  }

  // Navigazione mesi
  const isPrevDisabled = toYMD(viewYear, viewMonth, 1) <= toYMD(today.getFullYear(), today.getMonth(), 1);
  const goToPrev = () => {
    if (isPrevDisabled) return;
    const p = addMonths(viewYear, viewMonth, -1);
    setViewYear(p.year);
    setViewMonth(p.month);
  };
  const goToNext = () => {
    const n = addMonths(viewYear, viewMonth, 1);
    setViewYear(n.year);
    setViewMonth(n.month);
  };

  const secondMonth = addMonths(viewYear, viewMonth, 1);

  // ─── Render singolo mese ─────────────────────────────────────────────────

  function renderMonth(year: number, month: number, showTitle: boolean) {
    const cells = buildCells(year, month);
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        {showTitle && (
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#111' }}>
            {months[month]} {year}
          </div>
        )}

        {/* Intestazione giorni settimana */}
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
            if (!day) return <div key={i} style={{ height: 34 }} />;

            const ymd     = toYMD(year, month, day);
            const occupied = isOccupied(ymd);
            const isPast  = ymd < todayYMD;
            const isToday = ymd === todayYMD;

            return (
              <div
                key={i}
                style={{
                  height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  fontSize: 13,
                  userSelect: 'none',
                  cursor: 'default',
                  borderRadius: 6,
                  fontWeight: isToday ? 700 : 400,
                  // Passato → grigio sbiadito
                  // Occupato futuro → sfondo rosato + testo barrato
                  // Disponibile → testo scuro
                  color:           isPast ? '#ccc' : occupied ? '#c0a0a0' : '#222',
                  textDecoration:  (!isPast && occupied) ? 'line-through' : 'none',
                  background:      (!isPast && occupied) ? '#fdf0f0' : 'transparent',
                  opacity:         isPast ? 0.5 : 1,
                }}
              >
                {day}
                {isToday && (
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

  // ─── JSX principale ──────────────────────────────────────────────────────

  return (
    <section style={{ marginTop: 48 }}>

      {/* Titolo + legenda */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>
            {ui.title}
          </h2>
                </div>
      </div>

      {/* Spinner caricamento */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: '#aaa', fontSize: 14 }}>
          <div style={{
            width: 20, height: 20,
            border: '2px solid #eee', borderTop: '2px solid #1E73BE',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0,
          }} />
          {ui.loading}
        </div>
      )}

      {/* Calendario */}
      {!loading && (
        <div style={{
          border: '1px solid #e5e7eb', borderRadius: 16,
          padding: isDesktop ? '20px 28px 24px' : '16px 12px 20px',
          background: '#fff',
        }}>
          {/* Navigazione */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={goToPrev} disabled={isPrevDisabled} style={navBtnStyle(isPrevDisabled)}>
              ‹
            </button>
            {/* Titolo mese su mobile */}
            {!isDesktop && (
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                {months[viewMonth]} {viewYear}
              </span>
            )}
            <button onClick={goToNext} style={navBtnStyle(false)}>
              ›
            </button>
          </div>

          {/* Mesi */}
          <div style={{ display: 'flex', gap: isDesktop ? 40 : 0 }}>
            {renderMonth(viewYear, viewMonth, isDesktop)}
            {isDesktop && (
              <>
                <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />
                {renderMonth(secondMonth.year, secondMonth.month, true)}
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
