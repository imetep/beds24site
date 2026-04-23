'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';
import { fetchCoversCached, fetchFolderPhotosCached } from '@/lib/cloudinary-client-cache';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';


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
export default function HomeSearch({ locale }: { locale: string }) {
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
    // Se il giorno cliccato è negli ultimi 6 giorni del mese destro, sposta
    // il calendario in avanti così il mese destro diventa quello di sinistra
    // e il check-out auto-calcolato (+3 giorni) resta visibile.
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
      <div style={{ flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
          {dys.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#bbb', paddingBottom: 4 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {cells(year, month).map((day, i) => {
            if (!day) return <div key={i} />;
            const ymd = toYMD(year, month, day);
            const isPast  = ymd < todayYMD;
            const isStart = ymd === checkIn;
            const isEnd   = ymd === checkOut;
            const inRange = !!(checkIn && rangeEnd && ymd > checkIn && ymd < rangeEnd);
            return (
              <button key={i} onClick={() => handleDay(ymd)}
                onMouseEnter={() => { if (!isPast) setHover(ymd); }}
                onMouseLeave={() => setHover(null)}
                disabled={isPast}
                style={{
                  height: 36, width: '100%', border: 'none', outline: 'none',
                  borderRadius: (isStart || isEnd) ? '50%' : 0,
                  background: (isStart || isEnd) ? 'var(--color-primary)' : inRange ? 'var(--color-primary-soft)' : 'transparent',
                  color: (isStart || isEnd) ? 'var(--color-on-dark)' : isPast ? '#ccc' : 'var(--color-text)',
                  fontSize: 13, fontWeight: (isStart || isEnd) ? 700 : 400,
                  cursor: isPast ? 'default' : 'pointer',
                  textDecoration: isPast ? 'line-through' : 'none',
                }}
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
    router.push(`/${locale}/prenota?from=home`);
  }

  // ── Panel calendario ──────────────────────────────────────────────────────
  function CalContent() {
    const mobileMonths = Array.from({ length: 12 }, (_, i) => addM(now.getFullYear(), now.getMonth(), i));

    return (
      <div>
        <div style={{ padding: isDesk ? '24px 24px 0' : '0 20px', position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 10, paddingTop: isDesk ? 24 : 0 }}>
          {!isDesk && (
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ddd', margin: '8px auto 16px' }} />
          )}
          {/* Pills check-in / check-out */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[{l: ui.checkin, v: checkIn}, {l: ui.checkout, v: checkOut}].map(({l, v}, i) => (
              <div key={i} style={{
                flex: 1, padding: '8px 10px', borderRadius: 10,
                border: `2px solid ${v ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: v ? 'var(--color-primary-soft)' : 'var(--color-bg-muted)',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: v ? 'var(--color-primary)' : '#aaa' }}>{v ? fmtDate(v, locale, monthsShort) : '—'}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, margin: '0 0 8px' }}>
            {phase === 'ci' ? ui.hintCI : ui.hintCO}
          </p>
          {phase === 'co' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF3DC 100%)',
              border: '1px solid var(--color-cta)', borderLeft: '4px solid var(--color-cta)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🌙</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92610A', letterSpacing: '0.02em' }}>
                  {locale === 'it' ? 'Soggiorno minimo consigliato: 3 notti'
                   : locale === 'de' ? 'Empfohlener Mindestaufenthalt: 3 Nächte'
                   : locale === 'pl' ? 'Zalecany minimalny pobyt: 3 noce'
                   : 'Recommended minimum stay: 3 nights'}
                </div>
                <div style={{ fontSize: 11, color: '#B07820', marginTop: 2 }}>
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
          // DESKTOP: 2 mesi affiancati — frecce agli estremi, titoli centrati sopra i mesi
          <div style={{ padding: '0 24px 20px' }}>
            {/* Navigazione desktop: freccia sx | titolo mese1 | titolo mese2 | freccia dx */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <button
                onClick={() => { if (!isPrevDis) { const p = addM(vy, vm, -1); setVY(p.y); setVM(p.m); }}}
                disabled={isPrevDis}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: isPrevDis ? 'default' : 'pointer', color: isPrevDis ? '#ddd' : '#333', padding: '0 12px 0 0', flexShrink: 0 }}>
                ‹
              </button>
              <div style={{ flex: 1, display: 'flex' }}>
                <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                  {mons[vm]} {vy}
                </span>
                <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                  {mons[sec.m]} {sec.y}
                </span>
              </div>
              <button
                onClick={() => { const n = addM(vy, vm, 1); setVY(n.y); setVM(n.m); }}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#333', padding: '0 0 0 12px', flexShrink: 0 }}>
                ›
              </button>
            </div>
            {/* 2 mesi affiancati */}
            <div style={{ display: 'flex', gap: 24 }}>
              {renderMonth(vy, vm)}
              <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />
              {renderMonth(sec.y, sec.m)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <button onClick={() => { setCheckIn(''); setCheckOut(''); setSelectingCheckout(false); }}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                {ui.cancel}
              </button>
              <button onClick={() => setPanel('none')}
                style={{ padding: '10px 24px', background: 'var(--color-cta)', color: 'var(--color-on-dark)', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {ui.done}
              </button>
            </div>
          </div>
        ) : (
          // MOBILE: scroll verticale
          <>
            <div style={{ padding: '0 20px', overflowY: 'auto', paddingBottom: 80 }}>
              {mobileMonths.map(({ y, m }, idx) => (
                <div key={idx} style={{ marginBottom: 28 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'center', marginBottom: 10, color: 'var(--color-text)' }}>
                    {mons[m]} {y}
                  </div>
                  {renderMonth(y, m)}
                </div>
              ))}
            </div>
            <div style={{
              position: 'sticky', bottom: 0,
              background: 'var(--color-bg)', padding: '10px 20px 24px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              zIndex: 10,
            }}>
              <button onClick={() => { setCheckIn(''); setCheckOut(''); setSelectingCheckout(false); }}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                {ui.cancel}
              </button>
              <button onClick={() => setPanel('none')}
                style={{ padding: '10px 28px', background: 'var(--color-cta)', color: 'var(--color-on-dark)', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
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
      <div style={{ padding: 20 }}>
        {!isDesk && (
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ddd', margin: '0 auto 16px' }} />
        )}
        {[
          { label: ui.adults, sub: ui.adultsAge, val: numAdult, set: setNumAdult, min: 1 },
          { label: ui.children, sub: ui.childrenAge, val: numChild, set: setNumChild, min: 0 },
        ].map(({ label, sub, val, set, min }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{sub}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => set(val - 1)} disabled={val <= min}
                style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${val <= min ? 'var(--color-border)' : 'var(--color-primary)'}`,
                  background: 'var(--color-bg)', color: val <= min ? '#ccc' : 'var(--color-primary)', fontSize: 18, cursor: val <= min ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                −
              </button>
              <span style={{ fontSize: 16, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{val}</span>
              <button onClick={() => set(val + 1)}
                style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--color-primary)',
                  background: 'var(--color-bg)', color: 'var(--color-primary)', fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                +
              </button>
            </div>
          </div>
        ))}

        {numChild > 0 && (
          <div style={{ marginTop: 14, padding: 14, background: 'var(--color-bg-muted)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: numChild === 1 ? '1fr' : '1fr 1fr', gap: 10 }}>
              {Array.from({ length: numChild }, (_, i) => (
                <div key={i}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-label)', marginBottom: 4, textTransform: 'uppercase' }}>
                    {ageLabel} {i + 1}
                  </label>
                  <select
                    value={childrenAges[i] ?? -1}
                    onChange={e => setChildAge(i, Number(e.target.value))}
                    style={{
                      width: '100%', padding: '8px 10px', fontSize: 14, borderRadius: 8,
                      border: `1.5px solid ${(childrenAges[i] ?? -1) < 0 ? '#f97316' : 'var(--color-border)'}`,
                      background: 'var(--color-bg)', appearance: 'auto',
                    }}
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

        <button onClick={() => setPanel('none')}
          style={{ width: '100%', marginTop: 20, padding: '12px', background: 'var(--color-cta)', color: 'var(--color-on-dark)', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          {ui.done}
        </button>
      </div>
    );
  }

  // ── Hero BG — pick a generic photo if available else use gradient ─────────
  const heroBg = dintorniPhotos.length > 0 ? dintorniPhotos[0] : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', boxSizing: 'border-box', width: '100%', overflowX: 'hidden' }}>

      {/* ── Hero UX 3.2 ────────────────────────────────────────────────────── */}
      <section
        className="d-flex align-items-center justify-content-center text-white position-relative"
        style={{
          height: isDesk ? 320 : 220,
          background: heroBg
            ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${heroBg}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--color-primary) 0%, #0c447c 100%)',
        }}
      >
        <div className="container text-center px-3" style={{ maxWidth: 900 }}>
          <h1 className="fw-bold mb-2" style={{ fontSize: isDesk ? '2.6rem' : '1.6rem', lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {ui.hero_title}
          </h1>
          <p className="fs-5 mb-0" style={{ opacity: 0.95, textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}>
            {ui.hero_sub}
          </p>
        </div>
      </section>

      <div className="page-container">

      {/* ── Barra ricerca ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: isDesk ? 900 : 600, margin: '0 auto', padding: '1.5rem 16px 0', boxSizing: 'border-box', position: 'relative' }}>

        {isDesk ? (
          // ── DESKTOP: una riga orizzontale ─────────────────────────────────
          <div style={{
            display: 'flex', alignItems: 'stretch',
            border: '1.5px solid var(--color-border)', borderRadius: 50,
            background: 'var(--color-bg)', boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            {/* Date */}
            <button
              onClick={() => setPanel(p => p === 'dates' ? 'none' : 'dates')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 28px',
                background: panel === 'dates' ? 'var(--color-primary-soft)' : 'transparent',
                border: 'none', borderRight: '1px solid var(--color-border)', cursor: 'pointer', textAlign: 'left',
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" style={{ flexShrink: 0 }}>
                <rect x="3" y="4" width="18" height="18" rx="3"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ui.dates}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: datesLabel ? 'var(--color-text)' : '#aaa', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {datesLabel ?? `${ui.checkin} – ${ui.checkout}`}
                </div>
                {nightsLabel && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{nightsLabel}</div>
                )}
              </div>
            </button>

            {/* Ospiti */}
            <button
              ref={personeBtnRef}
              onClick={() => setPanel(p => p === 'guests' ? 'none' : 'guests')}
              style={{
                flex: '0 0 260px', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px',
                background: panel === 'guests' ? 'var(--color-primary-soft)' : 'transparent',
                border: 'none', borderRight: '1px solid var(--color-border)', cursor: 'pointer', textAlign: 'left',
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round"/>
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ui.guests}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {guestsLabel ?? `${numAdult} ${locale === 'it' ? 'adulti' : 'adults'}`}
                </div>
                {agesLabel ? <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>età: {agesLabel}</div> : null}
              </div>
            </button>

            {/* Cerca */}
            <button
              onClick={handleCerca}
              style={{
                padding: '0 32px', background: 'var(--color-cta)', color: 'var(--color-on-dark)', border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: 15,
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              {ui.search}
            </button>
          </div>

        ) : (
          // ── MOBILE: 2 card staccate stile Expedia + bottone Cerca ─────────
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Card Date */}
            <button
              onClick={() => setPanel(p => p === 'dates' ? 'none' : 'dates')}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px',
                border: `1.5px solid ${panel === 'dates' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 16,
                background: panel === 'dates' ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" style={{ flexShrink: 0 }}>
                <rect x="3" y="4" width="18" height="18" rx="3"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  {ui.dates}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: datesLabel ? 'var(--color-text)' : '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {datesLabel ?? `${ui.checkin} – ${ui.checkout}`}
                </div>
                {nightsLabel && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{nightsLabel}</div>
                )}
              </div>
              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            {/* Card Ospiti */}
            <button
              onClick={() => setPanel(p => p === 'guests' ? 'none' : 'guests')}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px',
                border: `1.5px solid ${panel === 'guests' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 16,
                background: panel === 'guests' ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  {ui.guests}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {guestsLabel ?? `${numAdult} ${locale === 'it' ? 'adulti' : 'adults'}`}
                </div>
                {agesLabel ? <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>età: {agesLabel}</div> : null}
              </div>
              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            {/* Bottone Cerca */}
            <button
              onClick={handleCerca}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '16px',
                borderRadius: 50,
                background: 'var(--color-cta)', color: 'var(--color-on-dark)', border: 'none',
                fontWeight: 700, fontSize: 16, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(252,175,26,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              {ui.search}
            </button>
          </div>
        )}

        {/* Dropdown desktop */}
        {isDesk && panel === 'dates' && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 580,
            background: 'var(--color-bg)', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden',
          }}>
            <CalContent />
          </div>
        )}
        {isDesk && panel === 'guests' && (
          <div ref={guestsPopoverRef} style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 300,
            background: 'var(--color-bg)', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden',
          }}>
            <GuestsContent />
          </div>
        )}
      </div>

      {/* Bottom sheets mobile */}
      {!isDesk && panel !== 'none' && (
        <>
          <div
            onClick={() => setPanel('none')}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
            background: 'var(--color-bg)', borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            maxHeight: '88vh', overflowY: 'auto',
          }}>
            {panel === 'dates'  && <CalContent />}
            {panel === 'guests' && <GuestsContent />}
          </div>
        </>
      )}

      {/* ── Slider residenze ───────────────────────────────────────────────── */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: isDesk ? '1.4rem' : '1.15rem', fontWeight: 700, margin: '0 0 0.75rem 16px', color: 'var(--color-text)' }}>
          {ui.inspire}
        </h2>
        <div style={{ position: 'relative' }}
          onMouseEnter={() => isDesk && setShowResArr(true)}
          onMouseLeave={() => isDesk && setShowResArr(false)}>
          {isDesk && showResArr && (
            <button onClick={() => { residenzeRef.current?.scrollBy({ left: -220, behavior: 'smooth' }); }}
              style={{ position: 'absolute', left: 2, top: '40%', transform: 'translateY(-50%)', zIndex: 10, width: 36, height: 36, borderRadius: '50%', border: '1px solid #ddd', background: 'var(--color-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          )}
          <div ref={residenzeRef} style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            padding: '4px 16px 20px',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none', scrollbarWidth: 'none',
          }}>
            {PROPERTIES.flatMap(p => p.rooms).map(room => {
              const src = covers[room.cloudinaryFolder];
              const cardW = isDesk ? 240 : 120;
              return (
                <button
                  key={room.roomId}
                  onClick={() => router.push(`/${locale}/residenze/${room.slug}`)}
                  style={{
                    flexShrink: 0, width: cardW, scrollSnapAlign: 'start',
                    border: 'none', padding: 0, background: 'var(--color-border)',
                    cursor: 'pointer', borderRadius: 12, overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    position: 'relative', aspectRatio: '2/3', display: 'block',
                  }}
                >
                  {src ? (
                    <img src={src} alt={room.name} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--color-border)' }} />
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 100%)',
                  }} />
                  <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, textAlign: 'left' }}>
                    <div style={{ color: 'var(--color-on-dark)', fontSize: isDesk ? 14 : 12, fontWeight: 700, lineHeight: 1.2 }}>{room.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 10, marginTop: 2 }}>
                      max {room.maxPeople} · {room.sqm} m²
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {isDesk && showResArr && (
            <button onClick={() => { residenzeRef.current?.scrollBy({ left: 220, behavior: 'smooth' }); }}
              style={{ position: 'absolute', right: 2, top: '40%', transform: 'translateY(-50%)', zIndex: 10, width: 36, height: 36, borderRadius: '50%', border: '1px solid #ddd', background: 'var(--color-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          )}
        </div>
      </div>

      {/* ── Slider dintorni — solo desktop ─────────────────────────────────── */}
      {isDesk && dintorniPhotos.length > 0 && (
        <div style={{ marginTop: '1.5rem', paddingBottom: 32 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.75rem 16px', color: 'var(--color-text)' }}>
            {ui.dintorni}
          </h2>
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setShowDintArr(true)}
            onMouseLeave={() => setShowDintArr(false)}>
            {showDintArr && (
              <button onClick={() => { dintorniRef.current?.scrollBy({ left: -200, behavior: 'smooth' }); }}
                style={{ position: 'absolute', left: 2, top: '40%', transform: 'translateY(-50%)', zIndex: 10, width: 36, height: 36, borderRadius: '50%', border: '1px solid #ddd', background: 'var(--color-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            )}
            <div ref={dintorniRef} style={{
              display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 16px 20px',
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none', scrollbarWidth: 'none',
            }}>
              {dintorniPhotos.map((src, idx) => (
                <button key={idx} onClick={() => setLightbox(src)}
                  style={{ flexShrink: 0, width: 240, aspectRatio: '2/3', scrollSnapAlign: 'start', border: 'none', padding: 0, background: 'var(--color-border)', cursor: 'pointer', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
            {showDintArr && (
              <button onClick={() => { dintorniRef.current?.scrollBy({ left: 200, behavior: 'smooth' }); }}
                style={{ position: 'absolute', right: 2, top: '40%', transform: 'translateY(-50%)', zIndex: 10, width: 36, height: 36, borderRadius: '50%', border: '1px solid #ddd', background: 'var(--color-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            )}
          </div>
          {lightbox && (
            <>
              <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, cursor: 'pointer' }} />
              <img src={lightbox} alt="" onClick={() => setLightbox(null)}
                style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', zIndex: 301, borderRadius: 8, cursor: 'pointer' }} />
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
