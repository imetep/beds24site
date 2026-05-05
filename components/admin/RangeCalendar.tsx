'use client';

/**
 * components/admin/RangeCalendar.tsx
 *
 * Selettore date a "pill" con calendario doppio mese desktop / singolo
 * mese mobile, hover preview e drag visivo. Usato dalle pagine admin
 * biancheria (check-in / check-out) e potenzialmente altre.
 *
 * Estratto da components/admin/AdminBiancheria.tsx (ex inline) per
 * coerenza visuale tra pagine.
 */

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

// ─── Date helpers ───────────────────────────────────────────────────────────

function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
  const m = month + delta;
  return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
}
function buildCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) cells.push(d);
  return cells;
}

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const DAYS_IT   = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];

// ─── Componente ─────────────────────────────────────────────────────────────

export default function RangeCalendar({ from, to, onChange }: {
  from: string;
  to:   string;
  onChange: (from: string, to: string) => void;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [phase,     setPhase]     = useState<'from' | 'to'>('from');
  const [hover,     setHover]     = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [open,      setOpen]      = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function handleDay(ymd: string) {
    if (ymd < todayYMD) return;
    if (phase === 'from') {
      onChange(ymd, addDays(ymd, 7));
      setPhase('to');
    } else {
      if (ymd <= from) return;
      onChange(from, ymd);
      setPhase('from');
      setOpen(false);
    }
  }

  const rangeEnd = phase === 'to' ? (hover ?? to) : to;

  function renderMonth(year: number, month: number) {
    const cells = buildCells(year, month);
    return (
      <div style={{ flex: 1, minWidth: 210 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(28px, 1fr))', marginBottom: 4 }}>
          {DAYS_IT.map(d => (
            <div key={d} className="text-center small fw-semibold text-muted pb-1">{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(28px, 1fr))', gap: 2 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ height: 36 }} />;
            const ymd     = toYMD(year, month, day);
            const isPast  = ymd < todayYMD;
            const isFrom  = ymd === from;
            const isTo    = ymd === to;
            const isToday = ymd === todayYMD;
            const inRange = from && rangeEnd && ymd > from && ymd < rangeEnd;

            let bg = 'transparent';
            let color = isPast ? '#ccc' : '#222';
            let fontWeight: number = isToday ? 700 : 400;
            let borderRadius = '6px';

            if (isFrom || isTo) {
              bg = 'var(--color-primary)'; color = 'var(--color-on-dark)'; fontWeight = 700;
              borderRadius = isFrom ? '6px 0 0 6px' : '0 6px 6px 0';
            } else if (inRange) {
              bg = 'var(--color-primary-soft)'; borderRadius = '0';
            } else if (hover === ymd && phase === 'to' && ymd > from) {
              bg = 'var(--color-primary-soft)';
            }

            return (
              <div key={i} onClick={() => !isPast && handleDay(ymd)}
                onMouseEnter={() => setHover(ymd)} onMouseLeave={() => setHover(null)}
                style={{
                  height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight, userSelect: 'none',
                  cursor: isPast ? 'default' : 'pointer',
                  borderRadius, color, background: bg, opacity: isPast ? 0.4 : 1,
                  transition: 'background 0.1s', position: 'relative',
                }}>
                {day}
                {isToday && !isFrom && !isTo && (
                  <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--color-primary)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const isPrevDisabled = toYMD(viewYear, viewMonth, 1) <= toYMD(today.getFullYear(), today.getMonth(), 1);
  const second = addMonths(viewYear, viewMonth, 1);

  const fmtPill = (ymd: string) =>
    new Date(ymd + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

  const navBtnClass = (disabled: boolean) =>
    `btn btn-link p-0 px-2 fs-4 fw-light ${disabled ? 'text-muted' : 'text-dark'}`;

  return (
    <div>
      {/* Pill trigger */}
      <button
        onClick={() => { setOpen(o => !o); setPhase('from'); }}
        className={`btn d-inline-flex align-items-center gap-2 ${open ? 'border-primary' : 'border'}`}
        style={{
          background: open ? 'var(--color-primary-soft)' : 'var(--color-bg)',
          marginBottom: open ? 12 : 0,
        }}
      >
        <Icon name="calendar-event" />
        <span>
          <span className="fw-bold text-primary">{fmtPill(from)}</span>
          <span className="text-muted mx-2">→</span>
          <span className="fw-bold text-primary">{fmtPill(to)}</span>
        </span>
        <span
          className="small text-muted ms-1"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >▼</span>
      </button>

      {/* Calendario */}
      {open && (
        <div
          className="border rounded-4 bg-white"
          style={{ padding: isDesktop ? '20px 28px 24px' : '16px 12px 20px', overflowX: 'auto' }}
        >
          <p className="small text-muted mb-2">
            {phase === 'from' ? (
              <><Icon name="calendar-event" className="me-1" /> Seleziona la data di inizio</>
            ) : (
              <><Icon name="calendar-event" className="me-1" /> Seleziona la data di fine</>
            )}
          </p>
          {isDesktop ? (
            <>
              <div className="d-flex align-items-center mb-3">
                <button onClick={() => { if (!isPrevDisabled) { const p = addMonths(viewYear, viewMonth, -1); setViewYear(p.year); setViewMonth(p.month); } }}
                  disabled={isPrevDisabled} className={navBtnClass(isPrevDisabled)}>‹</button>
                <div className="flex-fill text-center fw-bold">
                  {MONTHS_IT[viewMonth]} {viewYear}
                </div>
                <div style={{ width: 1, flexShrink: 0, margin: '0 20px' }} />
                <div className="flex-fill text-center fw-bold">
                  {MONTHS_IT[second.month]} {second.year}
                </div>
                <button onClick={() => { const n = addMonths(viewYear, viewMonth, 1); setViewYear(n.year); setViewMonth(n.month); }}
                  className={navBtnClass(false)}>›</button>
              </div>
              <div className="d-flex" style={{ gap: 40 }}>
                {renderMonth(viewYear, viewMonth)}
                <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />
                {renderMonth(second.year, second.month)}
              </div>
            </>
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <button onClick={() => { if (!isPrevDisabled) { const p = addMonths(viewYear, viewMonth, -1); setViewYear(p.year); setViewMonth(p.month); } }}
                  disabled={isPrevDisabled} className={navBtnClass(isPrevDisabled)}>‹</button>
                <span className="fw-bold">{MONTHS_IT[viewMonth]} {viewYear}</span>
                <button onClick={() => { const n = addMonths(viewYear, viewMonth, 1); setViewYear(n.year); setViewMonth(n.month); }}
                  className={navBtnClass(false)}>›</button>
              </div>
              {renderMonth(viewYear, viewMonth)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
