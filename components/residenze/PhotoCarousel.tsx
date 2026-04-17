'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  photos: string[];
  roomName: string;
  slug: string;
  locale: string;
}

export default function PhotoCarousel({ photos, roomName, slug, locale }: Props) {
  const router   = useRouter();
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
      <div className="d-flex justify-content-center align-items-center py-2" style={{ gap: 6 }}>
        {Array.from({ length: end - start }, (_, i) => {
          const di       = start + i;
          const isActive = di === idx;
          const isEdge   = (i === 0 && start > 0) || (i === end - start - 1 && end < total);
          return (
            <div key={di}
              className="flex-shrink-0"
              style={{
                width:        isActive ? 20 : isEdge ? 5 : 8,
                height:       8,
                borderRadius: 4,
                background:   dark
                  ? (isActive ? '#FCAF1A' : 'rgba(255,255,255,0.50)')
                  : (isActive ? '#1E73BE' : '#d1d5db'),
                transition: 'all 0.2s',
              }} />
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
          className="position-relative w-100 overflow-hidden"
          style={{
            // aspect-ratio 4:3 in portrait (≈56%),
            // max-height: 60vh in landscape così la foto non scappa fuori schermo
            aspectRatio: '4/3',
            maxHeight:  '60vh',
            background: '#111',
            cursor:     'pointer',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => router.push(`/${locale}/residenze/${slug}/foto`)}
        >
          {photos[current] && (
            <img
              src={photos[current]}
              alt={`${roomName} ${current + 1}`}
              className="position-absolute top-0 start-0 w-100 h-100 d-block"
              style={{ objectFit: 'cover' }}
            />
          )}

          {/* Frecce — tap zone laterali invisibili (no bottoni, touch area grande) */}
          {photos.length > 1 && (
            <>
              <div
                onClick={e => { e.stopPropagation(); prev(); }}
                className="position-absolute top-0 bottom-0 start-0 d-flex align-items-center justify-content-start"
                style={{ width: 60, paddingLeft: 10, zIndex: 2 }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: 36, height: 36,
                    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
                    fontSize: 20,
                  }}
                >‹</div>
              </div>
              <div
                onClick={e => { e.stopPropagation(); next(); }}
                className="position-absolute top-0 bottom-0 end-0 d-flex align-items-center justify-content-end"
                style={{ width: 60, paddingRight: 10, zIndex: 2 }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: 36, height: 36,
                    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
                    fontSize: 20,
                  }}
                >›</div>
              </div>
            </>
          )}

          {/* Badge foto in basso a destra */}
          <div
            className="position-absolute text-white fw-semibold rounded-pill"
            style={{
              bottom: 12, right: 12, zIndex: 2,
              background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)',
              fontSize: 13,
              padding: '5px 13px',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            📷 {photos.length} foto
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
        className="d-grid overflow-hidden mb-5 position-relative"
        style={{
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 6, borderRadius: 20,
          height: 420,
          cursor: 'pointer',
        }}
      >
        <div className="overflow-hidden h-100" style={{ gridRow: '1 / 3', background: '#1a1a1a' }}>
          {photos[0] && (
            <img src={photos[0]} alt={roomName}
              className="w-100 h-100 d-block"
              style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          )}
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="overflow-hidden" style={{ background: '#1a1a1a' }}>
            {photos[i] ? (
              <img src={photos[i]} alt={`${roomName} ${i + 1}`}
                className="w-100 h-100 d-block"
                style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ) : (
              <div className="w-100 h-100" style={{ background: '#2a2a2a' }} />
            )}
          </div>
        ))}
        <div
          className="position-absolute text-white fw-semibold rounded-pill"
          style={{
            bottom: 16, right: 16,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            fontSize: 13,
            padding: '8px 16px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          📷 {photos.length} foto
        </div>
      </div>

      {/* Lightbox desktop */}
      {open && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 overflow-hidden"
          style={{ zIndex: 9999, background: '#000' }}
        >
          {/* Foto a pieno schermo */}
          <img
            key={lightboxIdx}
            src={photos[lightboxIdx]}
            alt={`${roomName} ${lightboxIdx + 1}`}
            className="position-absolute top-0 start-0 w-100 h-100 d-block"
            style={{ objectFit: 'contain' }}
          />

          {/* Top bar */}
          <div
            className="position-absolute top-0 start-0 end-0 d-flex justify-content-between align-items-center px-3 py-3"
            style={{
              zIndex: 2,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.72), transparent)',
            }}
          >
            <span className="text-white fw-semibold" style={{ fontSize: 15 }}>{roomName}</span>
            <div className="d-flex align-items-center gap-4">
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                {lightboxIdx + 1} / {photos.length}
              </span>
              <button
                onClick={closeLightbox}
                className="btn rounded-circle text-white d-flex align-items-center justify-content-center"
                style={{
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  width: 44, height: 44, fontSize: 18,
                }}
              >✕</button>
            </div>
          </div>

          {/* Frecce */}
          {photos.length > 1 && (
            <>
              <button
                onClick={lbPrev}
                className="btn position-absolute rounded-circle text-white d-flex align-items-center justify-content-center"
                style={{
                  left: 16, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  width: 52, height: 52, fontSize: 22, zIndex: 3,
                  backdropFilter: 'blur(6px)',
                }}
              >‹</button>
              <button
                onClick={lbNext}
                className="btn position-absolute rounded-circle text-white d-flex align-items-center justify-content-center"
                style={{
                  right: 16, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  width: 52, height: 52, fontSize: 22, zIndex: 3,
                  backdropFilter: 'blur(6px)',
                }}
              >›</button>
            </>
          )}

          {/* Thumbnails desktop in basso */}
          <div
            className="position-absolute bottom-0 start-0 end-0 d-flex gap-2 px-3 py-3"
            style={{
              zIndex: 2,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
              overflowX: 'auto',
              justifyContent: photos.length <= 10 ? 'center' : 'flex-start',
            }}
          >
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setLbIdx(i)}
                className="flex-shrink-0 overflow-hidden p-0"
                style={{
                  width: 56, height: 40,
                  borderRadius: 5,
                  border: i === lightboxIdx ? '2px solid #FCAF1A' : '2px solid transparent',
                  background: 'transparent',
                  opacity: i === lightboxIdx ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
              >
                <img src={url} alt="" className="w-100 h-100 d-block" style={{ objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
