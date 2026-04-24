'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  photos: string[];
  roomName: string;
}

export default function PhotoLightbox({ photos, roomName }: Props) {
  const [open, setOpen]       = useState(false);
  const [current, setCurrent] = useState(0);
  // ✅ Fix Bug #1 — touch device detection corretta.
  // navigator.maxTouchPoints > 0 è true su iPhone/iPad anche in landscape,
  // mentre window.innerWidth in landscape può restituire 932px e triggherare desktop.
  const [isTouch, setIsTouch] = useState(false);
  const touchStartX  = useRef<number>(0);
  const savedScrollY = useRef<number>(0);

  useEffect(() => {
    setIsTouch(navigator.maxTouchPoints > 0);
  }, []);

  // ── iOS Safari scroll lock ────────────────────────────────────────────────
  // body overflow:hidden NON basta su iOS Safari — la pagina sotto trasparisce.
  // position:fixed + top negativo è l'unica soluzione affidabile.
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

  const openAt = (index: number) => {
    setCurrent(index);
    setOpen(true);
  };

  const close = useCallback(() => {
    setOpen(false);
    unlockScroll();
  }, [unlockScroll]);

  useEffect(() => {
    if (open) lockScroll();
  }, [open, lockScroll]);

  useEffect(() => () => unlockScroll(), [unlockScroll]);

  const prev = useCallback(() => setCurrent(c => (c - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, prev, next, close]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
  };

  // ── Dot indicators (finestra scorrevole max 5) ────────────────────────────
  function DotIndicators({ dark = false }: { dark?: boolean }) {
    if (photos.length <= 1) return null;
    const total   = photos.length;
    const maxDots = 5;
    const half    = Math.floor(maxDots / 2);
    let start = Math.max(0, current - half);
    let end   = Math.min(total, start + maxDots);
    if (end - start < maxDots) start = Math.max(0, end - maxDots);

    return (
      <div className={`photo-dots ${dark ? 'photo-dots--dark' : ''}`}>
        {Array.from({ length: end - start }, (_, i) => {
          const idx      = start + i;
          const isActive = idx === current;
          const isEdge   = (i === 0 && start > 0) || (i === end - start - 1 && end < total);
          return (
            <div
              key={idx}
              className={`photo-dots__dot ${isActive ? 'is-active' : ''} ${isEdge ? 'is-edge' : ''}`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* ── PREVIEW sulla scheda ─────────────────────────────────────────── */}
      {isTouch ? (
        // Touch (mobile + iPhone landscape): foto 4:3 + dots sotto
        <div className="mb-4">
          <div onClick={() => openAt(0)} className="photo-preview--touch">
            {photos[0] && (
              <img
                src={photos[0]}
                alt={roomName}
                className="photo-preview--touch__img"
              />
            )}
            <div className="photo-count-badge">
              <i className="bi bi-camera-fill" aria-hidden="true" />
              {photos.length} foto
            </div>
          </div>
          <DotIndicators dark={false} />
        </div>
      ) : (
        // Desktop: griglia 2fr 1fr
        <div
          onClick={() => openAt(0)}
          className="photo-preview-grid photo-preview-grid--2 mb-5"
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
            <i className="bi bi-camera-fill" aria-hidden="true" />
            {photos.length} foto
          </div>
        </div>
      )}

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="layout-fullscreen-overlay lightbox--touch-lock"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

          {/* ── FOTO: occupa tutto il container — i controls sono in overlay ── */}
          <div className="lightbox-photo-centered-wrap">
            <img
              key={current}
              src={photos[current]}
              alt={`${roomName} ${current + 1}`}
              className="lightbox-photo lightbox-photo--centered"
            />
          </div>

          {/* ── TOP BAR in overlay ── */}
          <div className="lightbox-topbar">
            <span className="lightbox-topbar__title">{roomName}</span>
            <div className="lightbox-topbar__actions">
              <span className="lightbox-topbar__counter">
                {current + 1} / {photos.length}
              </span>
              <button
                onClick={close}
                className="lightbox-close-btn"
                aria-label="Chiudi"
              >✕</button>
            </div>
          </div>

          {/* ── FRECCE in overlay ── */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="lightbox-arrow lightbox-arrow--sm lightbox-arrow--left"
                aria-label="Precedente"
              >‹</button>
              <button
                onClick={next}
                className="lightbox-arrow lightbox-arrow--sm lightbox-arrow--right"
                aria-label="Successivo"
              >›</button>
            </>
          )}

          {/* ── BOTTOM in overlay: dots (touch) o thumbnails (desktop) ── */}
          {isTouch ? (
            <div className="lightbox-dots-bar">
              <DotIndicators dark={true} />
            </div>
          ) : (
            <div
              className={`lightbox-thumbs ${photos.length <= 10 ? 'lightbox-thumbs--center' : 'lightbox-thumbs--scroll'}`}
            >
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`lightbox-thumb ${i === current ? 'is-active' : ''}`}
                >
                  <img src={url} alt="" className="lightbox-thumb__img" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
