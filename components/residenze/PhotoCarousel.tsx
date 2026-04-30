'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';
import { Icon } from '@/components/ui/Icon';

interface Props {
  photos: string[];
  roomName: string;
  slug: string;
  locale: string;
}

export default function PhotoCarousel({ photos, roomName, slug, locale }: Props) {
  const router   = useRouter();
  const ui       = getTranslations(locale as Locale).components.photoCarousel;
  const [current, setCurrent] = useState(0);
  // ✅ Fix Bug #1 — touch device detection corretta.
  // navigator.maxTouchPoints > 0 è true su iPhone/iPad anche in landscape.
  // window.innerWidth in landscape restituisce ~932px → triggherava layout desktop.
  const [isTouch, setIsTouch] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Lightbox desktop
  const [open, setOpen]       = useState(false);
  const [lightboxIdx, setLbIdx] = useState(0);
  const savedScrollY = useRef<number>(0);

  useEffect(() => {
    setIsTouch(navigator.maxTouchPoints > 0);
  }, []);

  // ── Navigazione carousel touch ────────────────────────────────────────────
  const prev = useCallback(() => setCurrent(c => (c - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % photos.length), [photos.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    // Swipe orizzontale solo se movimento X > Y (non scroll verticale)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx > 0 ? next() : prev();
    }
  };

  // ── iOS Safari scroll lock per lightbox desktop ───────────────────────────
  const lockScroll = useCallback(() => {
    savedScrollY.current = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top      = `-${savedScrollY.current}px`;
    document.body.style.left     = '0';
    document.body.style.right    = '0';
    document.body.style.overflow = 'hidden';
  }, []);
  const unlockScroll = useCallback(() => {
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.left     = '';
    document.body.style.right    = '';
    document.body.style.overflow = '';
    window.scrollTo(0, savedScrollY.current);
  }, []);

  const openLightbox = (idx: number) => {
    setLbIdx(idx);
    setOpen(true);
  };
  const closeLightbox = useCallback(() => {
    setOpen(false);
    unlockScroll();
  }, [unlockScroll]);

  useEffect(() => {
    if (open) lockScroll();
  }, [open, lockScroll]);
  useEffect(() => () => unlockScroll(), [unlockScroll]);

  // Tastiera lightbox desktop
  const lbPrev = useCallback(() => setLbIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const lbNext = useCallback(() => setLbIdx(i => (i + 1) % photos.length), [photos.length]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  lbPrev();
      if (e.key === 'ArrowRight') lbNext();
      if (e.key === 'Escape')     closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, lbPrev, lbNext, closeLightbox]);

  // ── Dot indicators ────────────────────────────────────────────────────────
  function Dots({ idx, dark }: { idx: number; dark: boolean }) {
    if (photos.length <= 1) return null;
    const total   = photos.length;
    const maxDots = 5;
    const half    = Math.floor(maxDots / 2);
    let start = Math.max(0, idx - half);
    let end   = Math.min(total, start + maxDots);
    if (end - start < maxDots) start = Math.max(0, end - maxDots);

    return (
      <div className={`photo-dots ${dark ? 'photo-dots--dark' : ''}`}>
        {Array.from({ length: end - start }, (_, i) => {
          const di       = start + i;
          const isActive = di === idx;
          const isEdge   = (i === 0 && start > 0) || (i === end - start - 1 && end < total);
          return (
            <div
              key={di}
              className={`photo-dots__dot ${isActive ? 'is-active' : ''} ${isEdge ? 'is-edge' : ''}`}
            />
          );
        })}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // TOUCH — Carousel inline + navigazione a /foto
  // ════════════════════════════════════════════════════════════════════════
  if (isTouch) {
    return (
      <div className="mb-4">
        {/* Foto carousel */}
        <div
          className="photo-preview--touch"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => router.push(`/${locale}/residenze/${slug}/foto`)}
        >
          {photos[current] && (
            <img
              src={photos[current]}
              alt={`${roomName} ${current + 1}`}
              className="photo-preview--touch__img"
            />
          )}

          {/* Frecce — tap zone laterali invisibili (no bottoni, touch area grande) */}
          {photos.length > 1 && (
            <>
              <div
                onClick={e => { e.stopPropagation(); prev(); }}
                className="photo-nav-tap-zone photo-nav-tap-zone--left"
              >
                <div className="photo-nav-mini">‹</div>
              </div>
              <div
                onClick={e => { e.stopPropagation(); next(); }}
                className="photo-nav-tap-zone photo-nav-tap-zone--right"
              >
                <div className="photo-nav-mini">›</div>
              </div>
            </>
          )}

          {/* Badge foto in basso a destra */}
          <div className="photo-count-badge">
            <Icon name="camera-fill" />
            {ui.photoCount.replace('{count}', String(photos.length))}
          </div>
        </div>

        {/* Dots sotto la foto */}
        <Dots idx={current} dark={false} />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // DESKTOP — Griglia + lightbox (comportamento invariato)
  // ════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Griglia desktop */}
      <div
        onClick={() => openLightbox(0)}
        className="photo-preview-grid photo-preview-grid--5 mb-5"
      >
        <div className="photo-preview-grid__hero">
          {photos[0] && (
            <img src={photos[0]} alt={roomName} className="photo-preview-grid__img" />
          )}
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="photo-preview-grid__cell">
            {photos[i] ? (
              <img
                src={photos[i]}
                alt={`${roomName} ${i + 1}`}
                className="photo-preview-grid__img"
              />
            ) : (
              <div className="photo-preview-grid__cell-empty" />
            )}
          </div>
        ))}
        <div className="photo-count-badge photo-count-badge--prominent">
          <Icon name="camera-fill" />
          {photos.length} foto
        </div>
      </div>

      {/* Lightbox desktop */}
      {open && (
        <div className="layout-fullscreen-overlay">
          {/* Foto a pieno schermo */}
          <img
            key={lightboxIdx}
            src={photos[lightboxIdx]}
            alt={`${roomName} ${lightboxIdx + 1}`}
            className="lightbox-photo"
          />

          {/* Top bar */}
          <div className="lightbox-topbar">
            <span className="lightbox-topbar__title">{roomName}</span>
            <div className="lightbox-topbar__actions">
              <span className="lightbox-topbar__counter">
                {lightboxIdx + 1} / {photos.length}
              </span>
              <button
                onClick={closeLightbox}
                className="lightbox-close-btn"
                aria-label={ui.close}
              ><Icon name="x-lg" /></button>
            </div>
          </div>

          {/* Frecce */}
          {photos.length > 1 && (
            <>
              <button
                onClick={lbPrev}
                className="lightbox-arrow lightbox-arrow--lg lightbox-arrow--left-lg"
                aria-label={ui.prev}
              >‹</button>
              <button
                onClick={lbNext}
                className="lightbox-arrow lightbox-arrow--lg lightbox-arrow--right-lg"
                aria-label={ui.next}
              >›</button>
            </>
          )}

          {/* Thumbnails desktop in basso */}
          <div
            className={`lightbox-thumbs ${photos.length <= 10 ? 'lightbox-thumbs--center' : 'lightbox-thumbs--scroll'}`}
          >
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setLbIdx(i)}
                className={`lightbox-thumb ${i === lightboxIdx ? 'is-active' : ''}`}
              >
                <img src={url} alt="" className="lightbox-thumb__img" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
