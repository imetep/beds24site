'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';
import { Icon } from '@/components/ui/Icon';

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
  interactive?: boolean;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AvailabilityCalendar({ roomId, locale = 'it', interactive = false }: Props) {
  const tr     = getTranslations(locale as Locale);
  const ui     = tr.components.availabilityCalendar;
  const months = tr.shared.monthsLong;
  const days   = tr.shared.daysShort;

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
  const [selectingCheckout, setSelectingCheckout] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => { window.removeEventListener('resize', check); };
  }, []);

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
      setCheckIn(ymd);
      setCheckOut(addDays(ymd, 3));
      setSelectingCheckout(true);
    } else {
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

  function renderMonth(year: number, month: number) {
    const cells = buildCells(year, month);
    return (
      <div className="avail-cal__month">
        <div className="avail-cal__weekdays">
          {days.map(d => (
            <div key={d} className="avail-cal__weekday">{d}</div>
          ))}
        </div>
        <div className="avail-cal__days">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="avail-cal__day-empty" />;

            const ymd      = toYMD(year, month, day);
            const occupied = isOccupied(ymd);
            const isPast   = ymd < todayYMD;
            const isToday  = ymd === todayYMD;
            const isCI     = checkIn === ymd;
            const isCO     = checkOut === ymd;
            const inRange  = isInRange(ymd);
            const isHover  = interactive && !occupied && hoverDate === ymd;
            const canClick = interactive && !occupied && !isPast;

            const classes = ['avail-cal__day'];
            if (isPast)                                             classes.push('is-past');
            if (!isPast && occupied)                                classes.push('is-occupied');
            if (isToday)                                            classes.push('is-today');
            if (canClick)                                           classes.push('is-clickable');
            if (isCI)                                               classes.push('is-check-in');
            if (isCO)                                               classes.push('is-check-out');
            if (inRange && !isCI && !isCO)                          classes.push('is-in-range');
            if (isHover && phase === 'co' && checkIn && ymd > checkIn && !isCI && !isCO && !inRange) {
              classes.push('is-hover-range');
            }

            return (
              <div
                key={i}
                onClick={() => handleDayClick(ymd)}
                onMouseEnter={() => interactive && setHoverDate(ymd)}
                onMouseLeave={() => interactive && setHoverDate(null)}
                className={classes.join(' ')}
              >
                {day}
                {isToday && !isCI && !isCO && (
                  <span className="avail-cal__today-dot" />
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
    <section className="mt-5">

      {/* Titolo + legenda */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h2 className="section-title-main">{ui.title}</h2>
          <div className="avail-legend">
            <div className="avail-legend__item">
              <span className="avail-legend__free">15</span>
              {ui.legendFree}
            </div>
            <div className="avail-legend__item avail-legend__item--muted">
              <span className="avail-legend__busy">15</span>
              {ui.legendBusy}
            </div>
          </div>
        </div>
      </div>

      {/* Pill CHECK-IN / CHECK-OUT — cliccabili, stile card HomeSearch */}
      {interactive && (
        <div className="avail-date-cards-row">

          {/* Card CHECK-IN */}
          <button
            onClick={() => {
              // Click check-in: azzera ENTRAMBE le date → riparte da zero
              clearDates();
            }}
            className={`avail-date-card ${checkIn ? 'is-active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="avail-date-card__icon-calendar">
              <rect x="3" y="4" width="18" height="18" rx="3"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <div className="avail-date-card__body">
              <div className="avail-date-card__label">{ui.checkin}</div>
              <div className={`avail-date-card__value ${!checkIn ? 'is-placeholder' : ''}`}>
                {checkIn ? fmtDate(checkIn, locale) : '—'}
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="avail-date-card__icon-chevron">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {/* Card CHECK-OUT */}
          <button
            onClick={() => {
              // Click check-out: azzera SOLO il checkout, mantiene check-in → fase co
              setCheckOut('');
              setSelectingCheckout(true);
            }}
            className={`avail-date-card ${(checkOut || phase === 'co') ? 'is-active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="avail-date-card__icon-calendar">
              <rect x="3" y="4" width="18" height="18" rx="3"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <div className="avail-date-card__body">
              <div className="avail-date-card__label">{ui.checkout}</div>
              <div className={`avail-date-card__value ${!checkOut ? 'is-placeholder' : ''}`}>
                {checkOut ? fmtDate(checkOut, locale) : '—'}
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="avail-date-card__icon-chevron">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {/* Bottone cancella date */}
          {(checkIn || checkOut) && (
            <button onClick={clearDates} className="avail-date-clear-btn" aria-label={ui.clear}>
              <Icon name="x-lg" />
            </button>
          )}
        </div>
      )}

      {/* Hint */}
      {interactive && (
        <p className="avail-hint">
          {phase === 'ci' ? ui.selectCheckin : ui.selectCheckout}
        </p>
      )}

      {/* Box soggiorno minimo */}
      {interactive && (
        <div className="banner banner--accent banner--with-icon mb-3">
          <Icon name="moon-stars-fill" />
          <div>
            <p className="banner__title">{ui.minStay}</p>
            <p className="banner__text">{ui.minSub}</p>
          </div>
        </div>
      )}

      {/* Spinner */}
      {loading && (
        <div className="wizard-loading">
          <div className="wizard-loading-spinner" />
          {ui.loading}
        </div>
      )}

      {/* Calendario */}
      {!loading && (
        <div
          className="avail-cal"
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
          {/* ✅ FIX: navigazione corretta — mobile: 1 titolo centrato; desktop: frecce agli estremi + 2 titoli centrati */}
          <div className="avail-cal__header">
            {isDesktop ? (
              <>
                <button
                  onClick={goToPrev}
                  disabled={isPrevDisabled}
                  className={`avail-cal__nav-btn ${isPrevDisabled ? 'is-disabled' : ''}`}
                  aria-label={ui.prevMonth}
                >‹</button>

                <div className="avail-cal__titles-desktop">
                  <span className="avail-cal__month-title">
                    {months[viewMonth]} {viewYear}
                  </span>
                  <span className="avail-cal__month-title">
                    {months[secondMonth.month]} {secondMonth.year}
                  </span>
                </div>

                <button onClick={goToNext} className="avail-cal__nav-btn" aria-label={ui.nextMonth}>›</button>
              </>
            ) : (
              <>
                <button
                  onClick={goToPrev}
                  disabled={isPrevDisabled}
                  className={`avail-cal__nav-btn ${isPrevDisabled ? 'is-disabled' : ''}`}
                  aria-label={ui.prevMonth}
                >‹</button>
                <span className="avail-cal__month-title avail-cal__month-title--mobile">
                  {months[viewMonth]} {viewYear}
                </span>
                <button onClick={goToNext} className="avail-cal__nav-btn" aria-label={ui.nextMonth}>›</button>
              </>
            )}
          </div>

          {/* Mesi */}
          <div className="avail-cal__months">
            {renderMonth(viewYear, viewMonth)}
            {isDesktop && (
              <>
                <div className="avail-cal__divider" />
                {renderMonth(secondMonth.year, secondMonth.month)}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
