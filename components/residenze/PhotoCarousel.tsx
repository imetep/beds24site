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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '10px 0' }}>
        {Array.from({ length: end - start }, (_, i) => {
          const di       = start + i;
          const isActive = di === idx;
          const isEdge   = (i === 0 && start > 0) || (i === end - start - 1 && end < total);
          return (
            <div key={di} style={{
              width:        isActive ? 20 : isEdge ? 5 : 8,
              height:       8,
              borderRadius: 4,
              flexShrink:   0,
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
      <div style={{ marginBottom: 24 }}>
        {/* Foto carousel */}
        <div
          style={{
            position:   'relative',
            width:      '100%',
            // aspect-ratio 4:3 in portrait (≈56%),
            // max-height: 60vh in landscape così la foto non scappa fuori schermo
            aspectRatio: '4/3',
            maxHeight:  '60vh',
            overflow:   'hidden',
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
              style={{
                position:  'absolute',
                top: 0, left: 0,
                width:     '100%',
                height:    '100%',
                objectFit: 'cover',
                display:   'block',
              }}
            />
          )}

          {/* Frecce — tap zone laterali invisibili (no bottoni, touch area grande) */}
          {photos.length > 1 && (
            <>
              <div
                onClick={e => { e.stopPropagation(); prev(); }}
                style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 60,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                  paddingLeft: 10, zIndex: 2,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 20,
                }}>‹</div>
              </div>
              <div
                onClick={e => { e.stopPropagation(); next(); }}
                style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0, width: 60,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 10, zIndex: 2,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 20,
                }}>›</div>
              </div>
            </>
          )}

          {/* Badge foto in basso a destra */}
          <div style={{
            position: 'absolute', bottom: 12, right: 12, zIndex: 2,
            background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            padding: '5px 13px', borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.18)',
          }}>
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
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 6, borderRadius: 20, overflow: 'hidden',
          height: 420, marginBottom: 32,
          cursor: 'pointer', position: 'relative',
        }}
      >
        <div style={{ gridRow: '1 / 3', overflow: 'hidden' }}>
          {photos[0] && (
            <img src={photos[0]} alt={roomName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          )}
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ overflow: 'hidden', background: '#1a1a1a' }}>
            {photos[i] ? (
              <img src={photos[i]} alt={`${roomName} ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }} />
            )}
          </div>
        ))}
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '8px 16px', borderRadius: 30,
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          📷 {photos.length} foto
        </div>
      </div>

      {/* Lightbox desktop */}
      {open && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 9999, background: '#000', overflow: 'hidden',
          }}
        >
          {/* Foto a pieno schermo */}
          <img
            key={lightboxIdx}
            src={photos[lightboxIdx]}
            alt={`${roomName} ${lightboxIdx + 1}`}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'contain', display: 'block',
            }}
          />

          {/* Top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.72), transparent)',
          }}>
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{roomName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                {lightboxIdx + 1} / {photos.length}
              </span>
              <button onClick={closeLightbox} style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', width: 44, height: 44, borderRadius: '50%',
                fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          </div>

          {/* Frecce */}
          {photos.length > 1 && (
            <>
              <button onClick={lbPrev} style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', width: 52, height: 52, borderRadius: '50%',
                fontSize: 22, cursor: 'pointer', zIndex: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}>‹</button>
              <button onClick={lbNext} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', width: 52, height: 52, borderRadius: '50%',
                fontSize: 22, cursor: 'pointer', zIndex: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}>›</button>
            </>
          )}

          {/* Thumbnails desktop in basso */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
            padding: '16px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
            display: 'flex', gap: 8, overflowX: 'auto',
            justifyContent: photos.length <= 10 ? 'center' : 'flex-start',
          }}>
            {photos.map((url, i) => (
              <button key={i} onClick={() => setLbIdx(i)} style={{
                flexShrink: 0, width: 56, height: 40,
                borderRadius: 5, overflow: 'hidden',
                border: i === lightboxIdx ? '2px solid #FCAF1A' : '2px solid transparent',
                cursor: 'pointer', padding: 0,
                opacity: i === lightboxIdx ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
