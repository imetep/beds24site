'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';
import { fetchCoversCached, fetchFolderPhotosCached } from '@/lib/cloudinary-client-cache';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';
import { Icon } from '@/components/ui/Icon';


// ─── Helpers ──────────────────────────────────────────────────────────────────
function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
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
const WEEKDAYS: Record<string, string[]> = {
  it: ['dom','lun','mar','mer','gio','ven','sab'],
  en: ['sun','mon','tue','wed','thu','fri','sat'],
  de: ['so','mo','di','mi','do','fr','sa'],
  pl: ['nd','pn','wt','śr','cz','pt','so'],
};
function fmtDate(ymd: string, locale: string, monthsShort: string[]): string {
  const d = parseYMD(ymd);
  const wd  = (WEEKDAYS[locale]    ?? WEEKDAYS.it)[d.getDay()];
  const mon = monthsShort[d.getMonth()];
  return `${wd} ${d.getDate()} ${mon}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────
interface HomeSearchProps {
  locale: string;
  /** Override: chiamata al click su "Cerca" se le date sono valide (default: redirect a /prenota?from=home) */
  onCerca?: () => void;
  /** Modalità compatta: nasconde hero promozionale + slider residenze + slider dintorni.
   *  Usata in admin/preventivi dove serve solo il search bar. */
  compact?: boolean;
}

export default function HomeSearch({ locale, onCerca, compact = false }: HomeSearchProps) {
  const tr = getTranslations(locale as Locale);
  const hs = tr.components.homeSearch;
  const ui   = hs.ui;
  const mons = hs.months;
  const dys  = hs.days;
  const monthsShort = hs.monthsShort;
  const router = useRouter();

  const { checkIn, checkOut, numAdult, numChild, childrenAges,
          setCheckIn, setCheckOut, setNumAdult, setNumChild, setChildAge } = useWizardStore();

  const [panel, setPanel]   = useState<'none' | 'dates' | 'guests'>('none');
  const [hover,  setHover]  = useState<string | null>(null);
  const [isDesk, setDesk]   = useState(false);
  const [covers,       setCovers]   = useState<Record<string, string>>({});
  const [dintorniPhotos, setDintorni] = useState<string[]>([]);
  const [showResArr,   setShowResArr] = useState(false);
  const [showDintArr,  setShowDintArr]= useState(false);
  const [lightbox,     setLightbox]   = useState<string | null>(null);
  const residenzeRef = useRef<HTMLDivElement>(null);
  const dintorniRef  = useRef<HTMLDivElement>(null);
  const personeBtnRef = useRef<HTMLButtonElement>(null);
  const guestsPopoverRef = useRef<HTMLDivElement>(null);

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const todayYMD = toYMD(now.getFullYear(), now.getMonth(), now.getDate());
  const [vy, setVY] = useState(now.getFullYear());
  const [vm, setVM] = useState(now.getMonth());
  const sec = addM(vy, vm, 1);

  useEffect(() => {
    const check = () => setDesk(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (!isDesk && panel !== 'none') ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [panel, isDesk]);

  // Allinea il popover Persone al bordo destro del relativo pulsante,
  // non al bordo destro del wrapper (che si estende oltre Cerca).
  useLayoutEffect(() => {
    if (!isDesk || panel !== 'guests') return;
    const btn = personeBtnRef.current;
    const pop = guestsPopoverRef.current;
    const offsetParent = pop?.offsetParent as HTMLElement | null;
    if (!btn || !pop || !offsetParent) return;
    const parentRect = offsetParent.getBoundingClientRect();
    const btnRect    = btn.getBoundingClientRect();
    pop.style.right = `${parentRect.right - btnRect.right}px`;
  }, [panel, isDesk]);

  useEffect(() => {
    fetchCoversCached().then(covers => {
      if (!covers) return;
      const filtered: Record<string, string> = {};
      for (const k in covers) {
        const v = covers[k];
        if (v) filtered[k] = v;
      }
      setCovers(filtered);
    });
    fetchFolderPhotosCached('generiche').then(urls => {
      if (urls && urls.length > 0) setDintorni(urls);
    });
  }, []);

  const [selectingCheckout, setSelectingCheckout] = useState(false);
  const phase: 'ci' | 'co' = selectingCheckout ? 'co' : (checkIn && !checkOut ? 'co' : 'ci');
  const isPrevDis = toYMD(vy, vm, 1) <= toYMD(now.getFullYear(), now.getMonth(), 1);

  function handleDay(ymd: string) {
    if (ymd < todayYMD) return;
    const clicked = parseYMD(ymd);
    if (clicked.getFullYear() === sec.y && clicked.getMonth() === sec.m) {
      const lastDay = new Date(sec.y, sec.m + 1, 0).getDate();
      if (clicked.getDate() > lastDay - 6) {
        setVY(sec.y);
        setVM(sec.m);
      }
    }
    if (phase === 'ci') {
      setCheckIn(ymd);
      const pre = new Date(clicked.getTime() + 3 * 86400000);
      setCheckOut(toYMD(pre.getFullYear(), pre.getMonth(), pre.getDate()));
      setSelectingCheckout(true);
    } else {
      if (diffNights(checkIn!, ymd) < 1) return;
      setCheckOut(ymd);
      setSelectingCheckout(false);
    }
  }

  function renderMonth(year: number, month: number) {
    const rangeEnd = checkOut || hover;
    return (
      <div className="home-search__cal-month">
        <div className="home-search__cal-weekdays">
          {dys.map(d => (
            <div key={d} className="home-search__cal-weekday">{d}</div>
          ))}
        </div>
        <div className="home-search__cal-grid">
          {cells(year, month).map((day, i) => {
            if (!day) return <div key={i} />;
            const ymd = toYMD(year, month, day);
            const isPast  = ymd < todayYMD;
            const isStart = ymd === checkIn;
            const isEnd   = ymd === checkOut;
            const inRange = !!(checkIn && rangeEnd && ymd > checkIn && ymd < rangeEnd);
            const isEdge = isStart || isEnd;
            const cls = `home-search__cal-day ${isPast ? 'is-past' : ''} ${isEdge ? 'is-edge' : (inRange ? 'is-range' : '')}`;
            return (
              <button key={i} onClick={() => handleDay(ymd)}
                onMouseEnter={() => { if (!isPast) setHover(ymd); }}
                onMouseLeave={() => setHover(null)}
                disabled={isPast}
                className={cls}
              >{day}</button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Labels ─────────────────────────────────────────────────────────────────
  const nights = checkIn && checkOut ? diffNights(checkIn, checkOut) : 0;
  const datesLabel = checkIn && checkOut
    ? `${fmtDate(checkIn, locale, monthsShort)} – ${fmtDate(checkOut, locale, monthsShort)}`
    : checkIn ? fmtDate(checkIn, locale, monthsShort) : null;
  const nightsLabel = nights > 0 ? `${nights} ${nights === 1 ? ui.nights : ui.nightsP}` : null;

  const adultPart = locale === 'it' ? (numAdult === 1 ? '1 adulto' : `${numAdult} adulti`)
    : locale === 'de' ? `${numAdult} Erw.`
    : locale === 'pl' ? (numAdult === 1 ? '1 dorosły' : `${numAdult} dorosłych`)
    : (numAdult === 1 ? '1 adult' : `${numAdult} adults`);
  const childPart = numChild > 0
    ? (locale === 'it' ? (numChild === 1 ? '1 bambino' : `${numChild} bambini`)
      : locale === 'de' ? (numChild === 1 ? '1 Kind' : `${numChild} Kinder`)
      : locale === 'pl' ? (numChild === 1 ? '1 dziecko' : `${numChild} dzieci`)
      : (numChild === 1 ? '1 child' : `${numChild} children`))
    : '';
  const agesSet = (childrenAges ?? []).slice(0, numChild).filter((a: number) => a >= 0);
  const agesLabel = agesSet.length === numChild && numChild > 0
    ? agesSet.map((a: number) => `${a}a`).join(', ')
    : '';
  const guestsLabel = (numAdult + numChild) > 0
    ? [adultPart, childPart].filter(Boolean).join(', ')
    : null;

  function handleCerca() {
    if (!checkIn || !checkOut) { setPanel('dates'); return; }
    setPanel('none');
    if (onCerca) onCerca();
    else router.push(`/${locale}/prenota?from=home`);
  }

  // ── Panel calendario ──────────────────────────────────────────────────────
  function CalContent() {
    const mobileMonths = Array.from({ length: 12 }, (_, i) => addM(now.getFullYear(), now.getMonth(), i));

    return (
      <div>
        <div className={`home-search__cal-header-wrap ${isDesk ? 'home-search__cal-header-wrap--desktop' : ''}`}>
          {!isDesk && <div className="home-search__cal-grabber" />}
          {/* Pills check-in / check-out */}
          <div className="home-search__cal-pills">
            {[{l: ui.checkin, v: checkIn}, {l: ui.checkout, v: checkOut}].map(({l, v}, i) => (
              <div key={i} className={`home-search__cal-pill ${v ? 'is-active' : ''}`}>
                <div className="home-search__cal-pill-label">{l}</div>
                <div className="home-search__cal-pill-value">{v ? fmtDate(v, locale, monthsShort) : '—'}</div>
              </div>
            ))}
          </div>
          <p className="home-search__cal-hint">
            {phase === 'ci' ? ui.hintCI : ui.hintCO}
          </p>
          {phase === 'co' && (
            <div className="home-search__cal-min-stay">
              <Icon name="moon-stars-fill" className="home-search__cal-min-stay-icon" />
              <div>
                <div className="home-search__cal-min-stay-title">
                  {locale === 'it' ? 'Soggiorno minimo consigliato: 3 notti'
                   : locale === 'de' ? 'Empfohlener Mindestaufenthalt: 3 Nächte'
                   : locale === 'pl' ? 'Zalecany minimalny pobyt: 3 noce'
                   : 'Recommended minimum stay: 3 nights'}
                </div>
                <div className="home-search__cal-min-stay-sub">
                  {locale === 'it' ? 'Puoi selezionare qualsiasi durata, ma potremmo avere poca disponibilità'
                   : locale === 'de' ? 'Kürzere Aufenthalte sind möglich, aber selten verfügbar'
                   : locale === 'pl' ? 'Krótsze pobyty są możliwe, ale rzadko dostępne'
                   : 'Shorter stays are possible but rarely available'}
                </div>
              </div>
            </div>
          )}
        </div>

        {isDesk ? (
          // DESKTOP: 2 mesi affiancati
          <div className="home-search__cal-desktop-body">
            <div className="home-search__cal-nav">
              <button
                onClick={() => { if (!isPrevDis) { const p = addM(vy, vm, -1); setVY(p.y); setVM(p.m); }}}
                disabled={isPrevDis}
                className="home-search__cal-nav-btn">
                ‹
              </button>
              <div className="home-search__cal-nav-titles">
                <span className="home-search__cal-nav-title">{mons[vm]} {vy}</span>
                <span className="home-search__cal-nav-title">{mons[sec.m]} {sec.y}</span>
              </div>
              <button
                onClick={() => { const n = addM(vy, vm, 1); setVY(n.y); setVM(n.m); }}
                className="home-search__cal-nav-btn home-search__cal-nav-btn--right">
                ›
              </button>
            </div>
            <div className="home-search__cal-months">
              {renderMonth(vy, vm)}
              <div className="home-search__cal-divider" />
              {renderMonth(sec.y, sec.m)}
            </div>
            <div className="home-search__cal-footer">
              <button onClick={() => { setCheckIn(''); setCheckOut(''); setSelectingCheckout(false); }}
                className="home-search__cal-cancel">
                {ui.cancel}
              </button>
              <button onClick={() => setPanel('none')} className="home-search__cal-done">
                {ui.done}
              </button>
            </div>
          </div>
        ) : (
          // MOBILE: scroll verticale
          <>
            <div className="home-search__cal-mobile-body">
              {mobileMonths.map(({ y, m }, idx) => (
                <div key={idx} className="home-search__cal-month-block">
                  <div className="home-search__cal-month-title">{mons[m]} {y}</div>
                  {renderMonth(y, m)}
                </div>
              ))}
            </div>
            <div className="home-search__cal-footer home-search__cal-footer--mobile">
              <button onClick={() => { setCheckIn(''); setCheckOut(''); setSelectingCheckout(false); }}
                className="home-search__cal-cancel">
                {ui.cancel}
              </button>
              <button onClick={() => setPanel('none')} className="home-search__cal-done">
                {ui.done}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Panel ospiti ──────────────────────────────────────────────────────────
  function GuestsContent() {
    const ageLabel = locale === 'it' ? 'Età bambino' : locale === 'de' ? 'Alter Kind' : locale === 'pl' ? 'Wiek dziecka' : 'Child age';
    const agePlaceholder = locale === 'it' ? 'Seleziona età' : locale === 'de' ? 'Alter wählen' : locale === 'pl' ? 'Wybierz wiek' : 'Select age';
    const yearStr = locale === 'it' ? 'anni' : locale === 'de' ? 'Jahre' : locale === 'pl' ? 'lat' : 'years';

    return (
      <div className="home-search__guests">
        {!isDesk && <div className="home-search__cal-grabber" />}
        {[
          { label: ui.adults, sub: ui.adultsAge, val: numAdult, set: setNumAdult, min: 1 },
          { label: ui.children, sub: ui.childrenAge, val: numChild, set: setNumChild, min: 0 },
        ].map(({ label, sub, val, set, min }) => (
          <div key={label} className="home-search__guests-row">
            <div>
              <div className="home-search__guests-row-label">{label}</div>
              <div className="home-search__guests-row-sub">{sub}</div>
            </div>
            <div className="home-search__guests-counter">
              <button onClick={() => set(val - 1)} disabled={val <= min} className="home-search__guests-btn">−</button>
              <span className="home-search__guests-value">{val}</span>
              <button onClick={() => set(val + 1)} className="home-search__guests-btn">+</button>
            </div>
          </div>
        ))}

        {numChild > 0 && (
          <div className="home-search__ages">
            <div className={`home-search__ages-grid home-search__ages-grid--${numChild === 1 ? '1' : '2'}`}>
              {Array.from({ length: numChild }, (_, i) => (
                <div key={i}>
                  <label className="home-search__ages-label">{ageLabel} {i + 1}</label>
                  <select
                    value={childrenAges[i] ?? -1}
                    onChange={e => setChildAge(i, Number(e.target.value))}
                    className={`home-search__ages-select ${(childrenAges[i] ?? -1) < 0 ? 'is-empty' : ''}`}
                  >
                    <option value={-1}>{agePlaceholder}</option>
                    {Array.from({ length: 18 }, (_, age) => (
                      <option key={age} value={age}>{age} {yearStr}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setPanel('none')} className="home-search__guests-done">
          {ui.done}
        </button>
      </div>
    );
  }

  // ── Hero BG — pick a generic photo if available else use gradient ─────────
  const heroBg = dintorniPhotos.length > 0 ? dintorniPhotos[0] : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="home-search">

      {/* ── Hero UX 3.2 ────────────────────────────────────────────────────── */}
      {!compact && (
        <section
          className="home-search__hero"
          style={heroBg ? { background: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${heroBg}) center/cover no-repeat` } : undefined}
        >
          <div className="home-search__hero-content">
            <h1 className="home-search__hero-title">{ui.hero_title}</h1>
            <p className="home-search__hero-sub">{ui.hero_sub}</p>
          </div>
        </section>
      )}

      <div className="page-container">

      {/* ── Barra ricerca ─────────────────────────────────────────────────── */}
      <div className={`home-search__bar-wrap${compact ? ' home-search__bar-wrap--compact' : ''}`}>

        {/* DESKTOP: una riga orizzontale */}
        <div className="home-search__bar-desktop">
          {/* Date */}
          <button
            onClick={() => setPanel(p => p === 'dates' ? 'none' : 'dates')}
            className={`home-search__pill home-search__pill--dates ${panel === 'dates' ? 'is-active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" className="home-search__pill-icon">
              <rect x="3" y="4" width="18" height="18" rx="3"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <div className="home-search__pill-content">
              <div className="home-search__pill-label">{ui.dates}</div>
              <div className={`home-search__pill-value ${datesLabel ? '' : 'is-empty'}`}>
                {datesLabel ?? `${ui.checkin} – ${ui.checkout}`}
              </div>
              {nightsLabel && <div className="home-search__pill-meta">{nightsLabel}</div>}
            </div>
          </button>

          {/* Ospiti */}
          <button
            ref={personeBtnRef}
            onClick={() => setPanel(p => p === 'guests' ? 'none' : 'guests')}
            className={`home-search__pill home-search__pill--guests ${panel === 'guests' ? 'is-active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" className="home-search__pill-icon">
              <circle cx="12" cy="7" r="4"/>
              <path d="M5.5 21c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round"/>
            </svg>
            <div className="home-search__pill-content">
              <div className="home-search__pill-label">{ui.guests}</div>
              <div className="home-search__pill-value">
                {guestsLabel ?? `${numAdult} ${locale === 'it' ? 'adulti' : 'adults'}`}
              </div>
              {agesLabel ? <div className="home-search__pill-meta">età: {agesLabel}</div> : null}
            </div>
          </button>

          {/* Cerca */}
          <button onClick={handleCerca} className="home-search__cerca-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            {ui.search}
          </button>
        </div>

        {/* MOBILE: 2 card staccate stile Expedia + bottone Cerca */}
        <div className="home-search__bar-mobile">

          {/* Card Date */}
          <button
            onClick={() => setPanel(p => p === 'dates' ? 'none' : 'dates')}
            className={`home-search__card ${panel === 'dates' ? 'is-active' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" className="home-search__card-icon">
              <rect x="3" y="4" width="18" height="18" rx="3"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <div className="home-search__card-content">
              <div className="home-search__card-label">{ui.dates}</div>
              <div className={`home-search__card-value ${datesLabel ? '' : 'is-empty'}`}>
                {datesLabel ?? `${ui.checkin} – ${ui.checkout}`}
              </div>
              {nightsLabel && <div className="home-search__card-meta">{nightsLabel}</div>}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" className="home-search__card-chevron">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {/* Card Ospiti */}
          <button
            onClick={() => setPanel(p => p === 'guests' ? 'none' : 'guests')}
            className={`home-search__card ${panel === 'guests' ? 'is-active' : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" className="home-search__card-icon">
              <circle cx="12" cy="7" r="4"/>
              <path d="M5.5 21c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round"/>
            </svg>
            <div className="home-search__card-content">
              <div className="home-search__card-label">{ui.guests}</div>
              <div className="home-search__card-value">
                {guestsLabel ?? `${numAdult} ${locale === 'it' ? 'adulti' : 'adults'}`}
              </div>
              {agesLabel ? <div className="home-search__card-meta">età: {agesLabel}</div> : null}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" className="home-search__card-chevron">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {/* Bottone Cerca */}
          <button onClick={handleCerca} className="home-search__cerca-mobile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            {ui.search}
          </button>
        </div>

        {/* Dropdown desktop */}
        {isDesk && panel === 'dates' && (
          <div className="home-search__dropdown home-search__dropdown--dates">
            <CalContent />
          </div>
        )}
        {isDesk && panel === 'guests' && (
          <div ref={guestsPopoverRef} className="home-search__dropdown home-search__dropdown--guests">
            <GuestsContent />
          </div>
        )}
      </div>

      {/* Bottom sheets mobile */}
      {!isDesk && panel !== 'none' && (
        <>
          <div onClick={() => setPanel('none')} className="home-search__sheet-overlay" />
          <div className="home-search__sheet">
            {panel === 'dates'  && <CalContent />}
            {panel === 'guests' && <GuestsContent />}
          </div>
        </>
      )}

      {/* ── Slider residenze ───────────────────────────────────────────────── */}
      {!compact && (
      <div className="home-search__slider-section">
        <h2 className="home-search__slider-title">{ui.inspire}</h2>
        <div className="home-search__slider-wrap"
          onMouseEnter={() => isDesk && setShowResArr(true)}
          onMouseLeave={() => isDesk && setShowResArr(false)}>
          {isDesk && showResArr && (
            <button onClick={() => { residenzeRef.current?.scrollBy({ left: -220, behavior: 'smooth' }); }}
              className="home-search__slider-arrow home-search__slider-arrow--left">‹</button>
          )}
          <div ref={residenzeRef} className="home-search__slider-track">
            {PROPERTIES.flatMap(p => p.rooms).map(room => {
              const src = covers[room.cloudinaryFolder];
              return (
                <button
                  key={room.roomId}
                  onClick={() => router.push(`/${locale}/residenze/${room.slug}`)}
                  className="home-search__res-card"
                >
                  {src ? (
                    <img src={src} alt={room.name} loading="lazy" className="home-search__res-card-img" />
                  ) : (
                    <div className="home-search__res-card-img" />
                  )}
                  <div className="home-search__res-card-overlay" />
                  <div className="home-search__res-card-info">
                    <div className="home-search__res-card-name">{room.name}</div>
                    <div className="home-search__res-card-meta">
                      max {room.maxPeople} · {room.sqm} m²
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {isDesk && showResArr && (
            <button onClick={() => { residenzeRef.current?.scrollBy({ left: 220, behavior: 'smooth' }); }}
              className="home-search__slider-arrow home-search__slider-arrow--right">›</button>
          )}
        </div>
      </div>
      )}

      {/* ── Slider dintorni — solo desktop ─────────────────────────────────── */}
      {!compact && isDesk && dintorniPhotos.length > 0 && (
        <div className="home-search__slider-section home-search__slider-section--dintorni">
          <h2 className="home-search__slider-title">{ui.dintorni}</h2>
          <div className="home-search__slider-wrap"
            onMouseEnter={() => setShowDintArr(true)}
            onMouseLeave={() => setShowDintArr(false)}>
            {showDintArr && (
              <button onClick={() => { dintorniRef.current?.scrollBy({ left: -200, behavior: 'smooth' }); }}
                className="home-search__slider-arrow home-search__slider-arrow--left">‹</button>
            )}
            <div ref={dintorniRef} className="home-search__slider-track">
              {dintorniPhotos.map((src, idx) => (
                <button key={idx} onClick={() => setLightbox(src)} className="home-search__dintorni-card">
                  <img src={src} alt="" loading="lazy" className="home-search__dintorni-img" />
                </button>
              ))}
            </div>
            {showDintArr && (
              <button onClick={() => { dintorniRef.current?.scrollBy({ left: 200, behavior: 'smooth' }); }}
                className="home-search__slider-arrow home-search__slider-arrow--right">›</button>
            )}
          </div>
          {lightbox && (
            <>
              <div onClick={() => setLightbox(null)} className="home-search__lightbox-overlay" />
              <img src={lightbox} alt="" onClick={() => setLightbox(null)} className="home-search__lightbox-img" />
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
