'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface Props {
  cloudinaryFolder: string;
  coverUrl: string | null;
  roomName: string;
  noPhotoLabel: string;
  linkHref?: string; // se passato, il click sulla foto naviga alla scheda (non apre gallery)
}

export default function CardPhotoGallery({ cloudinaryFolder, coverUrl, roomName, noPhotoLabel, linkHref }: Props) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);

  const fetchPhotos = useCallback(async () => {
    if (photos.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cloudinary?folder=${encodeURIComponent(cloudinaryFolder)}`);
      const data = await res.json();
      const urls = (data.photos ?? []).map((p: { url: string }) => p.url);
      setPhotos(urls.length > 0 ? urls : coverUrl ? [coverUrl] : []);
    } catch {
      setPhotos(coverUrl ? [coverUrl] : []);
    } finally {
      setLoading(false);
    }
  }, [cloudinaryFolder, coverUrl, photos.length]);

  const openGallery = () => {
    setCurrent(0);
    setOpen(true);
    fetchPhotos();
  };

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, prev, next]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
  };

  const photoContent = coverUrl ? (
    <img
      src={coverUrl}
      alt={roomName}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s ease' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    />
  ) : (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#bbb', fontSize: 13 }}>{noPhotoLabel}</span>
    </div>
  );

  // Se linkHref: click foto → naviga alla scheda appartamento
  if (linkHref) {
    return (
      <Link
        href={linkHref}
        className="d-block position-relative overflow-hidden text-decoration-none"
        style={{ height: 220, background: '#f0f0f0' }}
      >
        {photoContent}
      </Link>
    );
  }

  // Altrimenti: comportamento gallery (lightbox) — usato nella pagina foto dedicata
  return (
    <>
      {/* Foto cover cliccabile */}
      <div
        onClick={openGallery}
        className="position-relative overflow-hidden"
        style={{ height: 220, background: '#f0f0f0', cursor: 'pointer' }}
      >
        {photoContent}
      </div>

      {/* Lightbox fullscreen */}
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
            padding: '16px 20px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
            zIndex: 2,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600 }}>{roomName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {photos.length > 1 && (
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{current + 1} / {photos.length}</span>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', width: 40, height: 40, borderRadius: '50%',
                  fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
          </div>

          {/* Contenuto centrale */}
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>⏳</div>
          ) : photos.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Nessuna foto disponibile</div>
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 'env(safe-area-inset-top, 80px) 80px env(safe-area-inset-bottom, 80px)',
            }}>
              <img
                key={current}
                src={photos[current]}
                alt={`${roomName} ${current + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 8,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                }}
              />
            </div>
          )}

          {/* Frecce */}
          {photos.length > 1 && (
            <>
              <button onClick={prev} style={arrowBtn('left')}>‹</button>
              <button onClick={next} style={arrowBtn('right')}>›</button>
            </>
          )}

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '12px 16px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              display: 'flex', gap: 6, overflowX: 'auto', justifyContent: 'center',
            }}>
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    flexShrink: 0, width: 48, height: 36,
                    borderRadius: 5, overflow: 'hidden',
                    border: i === current ? '2px solid #FCAF1A' : '2px solid transparent',
                    cursor: 'pointer', padding: 0,
                    opacity: i === current ? 1 : 0.5,
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

const arrowBtn = (side: 'left' | 'right'): React.CSSProperties => ({
  position: 'absolute', [side]: 16, top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff', width: 48, height: 48, borderRadius: '50%',
  fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
});
export type PoolType = 'none' | 'private' | 'shared';
