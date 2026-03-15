'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  photos: string[];
  roomName: string;
}

export default function PhotoLightbox({ photos, roomName }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goTo = useCallback((index: number, dir: 'left' | 'right') => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setDirection(null);
      setIsAnimating(false);
    }, 280);
  }, [isAnimating]);

  const prev = useCallback(() => {
    const newIndex = (current - 1 + photos.length) % photos.length;
    goTo(newIndex, 'right');
  }, [current, photos.length, goTo]);

  const next = useCallback(() => {
    const newIndex = (current + 1) % photos.length;
    goTo(newIndex, 'left');
  }, [current, photos.length, goTo]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, prev, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const getSlideStyle = (): React.CSSProperties => {
    if (!isAnimating) return { opacity: 1, transform: 'translateX(0)', transition: 'none' };
    return {
      opacity: 0,
      transform: direction === 'left' ? 'translateX(-40px)' : 'translateX(40px)',
      transition: 'opacity 0.28s ease, transform 0.28s ease',
    };
  };

  return (
    <>
      {/* Trigger — griglia foto cliccabile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 6,
          borderRadius: 20,
          overflow: 'hidden',
          height: 420,
          marginBottom: 32,
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => { setCurrent(0); setOpen(true); }}
      >
        {/* Foto principale */}
        <div style={{ gridRow: '1 / 3', overflow: 'hidden', position: 'relative' }}>
          {photos[0] && (
            <img
              src={photos[0]}
              alt={roomName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          )}
        </div>

        {/* 4 foto piccole */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ overflow: 'hidden', position: 'relative', background: '#1a1a1a' }}>
            {photos[i] ? (
              <img
                src={photos[i]}
                alt={`${roomName} ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }} />
            )}
          </div>
        ))}

        {/* Badge "Mostra tutte le foto" */}
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          padding: '8px 16px',
          borderRadius: 30,
          border: '1px solid rgba(255,255,255,0.2)',
          letterSpacing: '0.3px',
        }}>
          📷 {photos.length} foto
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.97)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600 }}>
              {roomName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                {current + 1} / {photos.length}
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  width: 40, height: 40,
                  borderRadius: '50%',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Foto principale */}
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 80px 100px' }}>
            <img
              key={current}
              src={photos[current]}
              alt={`${roomName} ${current + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
                ...getSlideStyle(),
              }}
            />
          </div>

          {/* Frecce navigazione */}
          <button
            onClick={prev}
            style={{
              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', width: 52, height: 52,
              borderRadius: '50%', fontSize: 20,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >
            ‹
          </button>

          <button
            onClick={next}
            style={{
              position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', width: 52, height: 52,
              borderRadius: '50%', fontSize: 20,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >
            ›
          </button>

          {/* Thumbnails in basso */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '16px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            display: 'flex', gap: 8, overflowX: 'auto',
            justifyContent: 'center',
          }}>
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > current ? 'left' : 'right')}
                style={{
                  flexShrink: 0,
                  width: 56, height: 40,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: i === current ? '2px solid #FCAF1A' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: i === current ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}
              >
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>

        </div>
      )}
    </>
  );
}
