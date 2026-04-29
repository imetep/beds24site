'use client';

/**
 * EditDatesModal — modale inline (Round 2 sidebar) per modificare date di check-in/out
 * Si aggancia al wizard-store: setCheckIn / setCheckOut. Quando si chiude la modale,
 * WizardStep1 ricarica /api/offers automaticamente (useEffect su [checkIn, checkOut, ...]).
 *
 * Pattern semplificato di HomeSearch.CalContent (1 mese alla volta vs 2 affiancati).
 */

import { useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

// Helpers (copia da HomeSearch — TODO: estrarre in lib/dates-utils.ts)
function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function parseYMD(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function diffNights(a: string, b: string) {
  return Math.round((parseYMD(b).getTime() - parseYMD(a).getTime()) / 86400000);
}
function addM(y: number, m: number, delta: number) {
  let nm = m + delta;
  const ny = y + Math.floor(nm / 12);
  nm = ((nm % 12) + 12) % 12;
  return { y: ny, m: nm };
}
function cells(year: number, month: number): (number | null)[] {
  const dow = new Date(year, month, 1).getDay();
  const off = dow === 0 ? 6 : dow - 1;
  const tot = new Date(year, month + 1, 0).getDate();
  const arr: (number | null)[] = Array(off).fill(null);
  for (let d = 1; d <= tot; d++) arr.push(d);
  return arr;
}
function fmtDateShort(ymd: string, monthsShort: string[]): string {
  const d = parseYMD(ymd);
  return `${d.getDate()} ${monthsShort[d.getMonth()]}`;
}

interface Props {
  locale: string;
  onClose: () => void;
}

export default function EditDatesModal({ locale, onClose }: Props) {
  const tr = getTranslations(locale as Locale);
  const ui = tr.components.homeSearch.ui;
  const months = tr.components.homeSearch.months;
  const monthsShort = tr.components.homeSearch.monthsShort;
  const dys = tr.components.homeSearch.days;

  const { checkIn, checkOut, setCheckIn, setCheckOut } = useWizardStore();

  const now = new Date();
  const todayYMD = toYMD(now.getFullYear(), now.getMonth(), now.getDate());
  const initial = checkIn ? parseYMD(checkIn) : now;
  const [vy, setVY] = useState(initial.getFullYear());
  const [vm, setVM] = useState(initial.getMonth());
  const [hover, setHover] = useState<string | null>(null);
  const [selectingCheckout, setSelectingCheckout] = useState(false);

  const phase: 'ci' | 'co' = selectingCheckout ? 'co' : (checkIn && !checkOut ? 'co' : 'ci');
  const isPrevDis = toYMD(vy, vm, 1) <= toYMD(now.getFullYear(), now.getMonth(), 1);

  function handleDay(ymd: string) {
    if (ymd < todayYMD) return;
    if (phase === 'ci') {
      setCheckIn(ymd);
      const pre = new Date(parseYMD(ymd).getTime() + 3 * 86_400_000);
      setCheckOut(toYMD(pre.getFullYear(), pre.getMonth(), pre.getDate()));
      setSelectingCheckout(true);
    } else {
      if (diffNights(checkIn!, ymd) < 1) return;
      setCheckOut(ymd);
      setSelectingCheckout(false);
    }
  }

  function handleClear() {
    setCheckIn('');
    setCheckOut('');
    setSelectingCheckout(false);
  }

  return (
    <>
      <div className="edit-modal__overlay" onClick={onClose} />
      <div className="edit-modal__panel" role="dialog" aria-label={ui.dates}>
        <div className="edit-modal__header">
          <h3 className="edit-modal__title">{ui.dates}</h3>
          <button type="button" className="edit-modal__close" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        <div className="edit-modal__body">
          {/* Pills check-in / check-out */}
          <div className="edit-modal__pills">
            {[{ l: ui.checkin, v: checkIn }, { l: ui.checkout, v: checkOut }].map(({ l, v }, i) => (
              <div key={i} className={`edit-modal__pill${v ? ' is-set' : ''}`}>
                <div className="edit-modal__pill-label">{l}</div>
                <div className="edit-modal__pill-value">{v ? fmtDateShort(v, monthsShort) : '—'}</div>
              </div>
            ))}
          </div>
          <p className="edit-modal__hint">{phase === 'ci' ? ui.hintCI : ui.hintCO}</p>

          {/* Mese nav */}
          <div className="edit-modal__month-nav">
            <button
              type="button"
              onClick={() => { if (!isPrevDis) { const p = addM(vy, vm, -1); setVY(p.y); setVM(p.m); } }}
              disabled={isPrevDis}
              className="edit-modal__month-nav-btn"
              aria-label="Mese precedente"
            >‹</button>
            <span className="edit-modal__month-label">{months[vm]} {vy}</span>
            <button
              type="button"
              onClick={() => { const n = addM(vy, vm, 1); setVY(n.y); setVM(n.m); }}
              className="edit-modal__month-nav-btn"
              aria-label="Mese successivo"
            >›</button>
          </div>

          {/* Calendar grid */}
          <div className="edit-modal__weekdays">
            {dys.map((d: string, i: number) => <div key={i} className="edit-modal__weekday">{d}</div>)}
          </div>
          <div className="edit-modal__cells">
            {cells(vy, vm).map((day, i) => {
              if (!day) return <div key={i} className="edit-modal__cell-empty" />;
              const ymd = toYMD(vy, vm, day);
              const isPast = ymd < todayYMD;
              const isStart = ymd === checkIn;
              const isEnd = ymd === checkOut;
              const rangeEnd = checkOut || hover;
              const inRange = !!(checkIn && rangeEnd && ymd > checkIn && ymd < rangeEnd);
              const cls = [
                'edit-modal__cell-btn',
                (isStart || isEnd) && 'is-edge',
                inRange && 'is-in-range',
                isPast && 'is-past',
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDay(ymd)}
                  onMouseEnter={() => !isPast && setHover(ymd)}
                  onMouseLeave={() => setHover(null)}
                  disabled={isPast}
                  className={cls}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="edit-modal__footer">
          <button type="button" className="edit-modal__btn-secondary" onClick={handleClear}>
            {ui.cancel}
          </button>
          <button
            type="button"
            className="btn btn--primary edit-modal__btn-primary"
            onClick={onClose}
            disabled={!checkIn || !checkOut}
          >
            {ui.done}
          </button>
        </div>
      </div>
    </>
  );
}
