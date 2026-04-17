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
      <div className="d-flex justify-content-center align-items-center py-2" style={{ gap: 6 }}>
        {Array.from({ length: end - start }, (_, i) => {
          const idx      = start + i;
          const isActive = idx === current;
          const isEdge   = (i === 0 && start > 0) || (i === end - start - 1 && end < total);
          return (
            <div key={idx}
              className="flex-shrink-0"
              style={{
                width:        isActive ? 20 : isEdge ? 5 : 8,
                height:       8,
                borderRadius: 4,
                background:   dark
                  ? (isActive ? '#FCAF1A' : 'rgba(255,255,255,0.45)')
                  : (isActive ? 'var(--color-primary)' : '#d1d5db'),
                transition: 'all 0.2s',
              }} />
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* ── PREVIEW sulla scheda ─────────────────────────────────────────── */}
      {isTouch ? (
        // Touch (mobile + iPhone landscape): foto 16:9 + dots sotto
        <div className="mb-4">
          <div
            onClick={() => openAt(0)}
            className="position-relative w-100 overflow-hidden"
            style={{
              aspectRatio: '4/3',
              cursor: 'pointer',
              background: '#111',
            }}
          >
            {photos[0] && (
              <img
                src={photos[0]}
                alt={roomName}
                className="w-100 h-100 d-block"
                style={{ objectFit: 'cover' }}
              />
            )}
            <div
              className="position-absolute text-white fw-semibold rounded-pill"
              style={{
                bottom: 12, right: 12,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                fontSize: 13,
                padding: '6px 14px',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              📷 {photos.length} foto
            </div>
          </div>
          <DotIndicators dark={false} />
        </div>
      ) : (
        // Desktop: griglia 2fr 1fr
        <div
          onClick={() => openAt(0)}
          className="d-grid overflow-hidden mb-5 position-relative"
          style={{
            gridTemplateColumns: '2fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 6, borderRadius: 20,
            height: 420,
            cursor: 'pointer',
          }}
        >
          <div className="overflow-hidden" style={{ gridRow: '1 / 3' }}>
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
      )}

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 overflow-hidden"
          style={{
            zIndex: 9999,
            background: '#000',
            touchAction: 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

          {/* ── FOTO: occupa tutto il container — i controls sono in overlay ── */}
          <div className="position-absolute d-flex align-items-center justify-content-center" style={{ inset: 0 }}>
            <img
              key={current}
              src={photos[current]}
              alt={`${roomName} ${current + 1}`}
              className="w-100 h-100 d-block"
              style={{
                maxWidth:  '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* ── TOP BAR in overlay ── */}
          <div
            className="position-absolute top-0 start-0 end-0 d-flex justify-content-between align-items-center px-3"
            style={{
              zIndex: 2,
              paddingTop: 'max(16px, env(safe-area-inset-top))',
              paddingBottom: 16,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, transparent 100%)',
            }}
          >
            <span className="text-white fw-semibold" style={{ fontSize: 15 }}>
              {roomName}
            </span>
            <div className="d-flex align-items-center" style={{ gap: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
                {current + 1} / {photos.length}
              </span>
              <button
                onClick={close}
                className="btn rounded-circle text-white d-flex align-items-center justify-content-center"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  width: 44, height: 44, fontSize: 18,
                }}
              >✕</button>
            </div>
          </div>

          {/* ── FRECCE in overlay ── */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="btn position-absolute rounded-circle text-white d-flex align-items-center justify-content-center"
                style={{
                  left: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                  width: 44, height: 44,
                  fontSize: 24, zIndex: 3,
                  backdropFilter: 'blur(6px)',
                }}
              >‹</button>
              <button
                onClick={next}
                className="btn position-absolute rounded-circle text-white d-flex align-items-center justify-content-center"
                style={{
                  right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                  width: 44, height: 44,
                  fontSize: 24, zIndex: 3,
                  backdropFilter: 'blur(6px)',
                }}
              >›</button>
            </>
          )}

          {/* ── BOTTOM in overlay: dots (touch) o thumbnails (desktop) ── */}
          {isTouch ? (
            <div
              className="position-absolute bottom-0 start-0 end-0"
              style={{
                zIndex: 2,
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 100%)',
              }}
            >
              <DotIndicators dark={true} />
            </div>
          ) : (
            <div
              className="position-absolute bottom-0 start-0 end-0 d-flex gap-2 px-3 py-3"
              style={{
                zIndex: 2,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                overflowX: 'auto',
                justifyContent: photos.length <= 10 ? 'center' : 'flex-start',
              }}
            >
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="flex-shrink-0 overflow-hidden p-0"
                  style={{
                    width: 56, height: 40,
                    borderRadius: 5,
                    border: i === current ? '2px solid #FCAF1A' : '2px solid transparent',
                    background: 'transparent',
                    opacity: i === current ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <img src={url} alt="" className="w-100 h-100 d-block" style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
