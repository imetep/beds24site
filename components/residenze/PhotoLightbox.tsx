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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '8px 0' }}>
        {Array.from({ length: end - start }, (_, i) => {
          const idx      = start + i;
          const isActive = idx === current;
          const isEdge   = (i === 0 && start > 0) || (i === end - start - 1 && end < total);
          return (
            <div key={idx} style={{
              width:        isActive ? 20 : isEdge ? 5 : 8,
              height:       8,
              borderRadius: 4,
              flexShrink:   0,
              background:   dark
                ? (isActive ? '#FCAF1A' : 'rgba(255,255,255,0.45)')
                : (isActive ? '#1E73BE' : '#d1d5db'),
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
        <div style={{ marginBottom: 20 }}>
          <div
            onClick={() => openAt(0)}
            style={{
              position: 'relative', width: '100%', aspectRatio: '16/9',
              overflow: 'hidden', cursor: 'pointer', background: '#111',
            }}
          >
            {photos[0] && (
              <img
                src={photos[0]}
                alt={roomName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              padding: '6px 14px', borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.18)',
            }}>
              📷 {photos.length} foto
            </div>
          </div>
          <DotIndicators dark={false} />
        </div>
      ) : (
        // Desktop: griglia 2fr 1fr
        <div
          onClick={() => openAt(0)}
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
      )}

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            background: '#000',
            overflow: 'hidden',
            touchAction: 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

          {/* ── FOTO: occupa tutto il container — i controls sono in overlay ── */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              key={current}
              src={photos[current]}
              alt={`${roomName} ${current + 1}`}
              style={{
                maxWidth:  '100%',
                maxHeight: '100%',
                width:     '100%',
                height:    '100%',
                objectFit: 'contain',
                display:   'block',
              }}
            />
          </div>

          {/* ── TOP BAR in overlay ── */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, transparent 100%)',
          }}>
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
              {roomName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
                {current + 1} / {photos.length}
              </span>
              <button
                onClick={close}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff', width: 44, height: 44,
                  borderRadius: '50%', fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
          </div>

          {/* ── FRECCE in overlay ── */}
          {photos.length > 1 && (
            <>
              <button onClick={prev} style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', width: 44, height: 44, borderRadius: '50%',
                fontSize: 24, cursor: 'pointer', zIndex: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}>‹</button>
              <button onClick={next} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', width: 44, height: 44, borderRadius: '50%',
                fontSize: 24, cursor: 'pointer', zIndex: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}>›</button>
            </>
          )}

          {/* ── BOTTOM in overlay: dots (touch) o thumbnails (desktop) ── */}
          {isTouch ? (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 100%)',
            }}>
              <DotIndicators dark={true} />
            </div>
          ) : (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
              padding: '14px 20px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
              display: 'flex', gap: 8, overflowX: 'auto',
              justifyContent: photos.length <= 10 ? 'center' : 'flex-start',
            }}>
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    flexShrink: 0, width: 56, height: 40,
                    borderRadius: 5, overflow: 'hidden',
                    border: i === current ? '2px solid #FCAF1A' : '2px solid transparent',
                    cursor: 'pointer', padding: 0,
                    opacity: i === current ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
