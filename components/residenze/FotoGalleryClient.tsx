'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface RoomCard {
  slug:     string;
  name:     string;
  coverUrl: string | null;
}

interface Props {
  photos:   string[];
  roomName: string;
  slug:     string;
  locale:   string;
  rooms:    RoomCard[];  // tutte le residenze per il selettore
  allPhotosLabel: string;
  backLabel: string;
}

export default function FotoGalleryClient({
  photos, roomName, slug, locale, rooms, allPhotosLabel, backLabel,
}: Props) {

  // ── Stato orientamento ─────────────────────────────────────────────────────
  // true = landscape → modalità immersiva YouTube-style
  const [isLandscape, setIsLandscape] = useState(false);

  // Dimensioni del viewport congelate in px al momento dell'entrata in landscape.
  // NON usiamo 100dvh perché si aggiorna ad ogni apparizione della toolbar di
  // Safari/Chrome, causando resize continui e barre nere intermittenti.
  // Congelandole con window.innerHeight (che esclude già la toolbar al momento
  // del tap) il container non reagisce più alla toolbar per tutta la sessione.
  const [frozenW, setFrozenW] = useState(0);
  const [frozenH, setFrozenH] = useState(0);

  // ── Rilevamento browser non supportati per modalità immersiva ──────────────
  // Chrome iOS (CriOS) e Firefox iOS (FxiOS) non supportano la Fullscreen API
  // per restrizioni Apple — la toolbar riappare sempre. Mostriamo un banner
  // che suggerisce di aprire in Safari, dove tutto funziona correttamente.
  const [isUnsupportedBrowser, setIsUnsupportedBrowser] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isChromeIOS  = /CriOS/.test(ua);
    const isFirefoxIOS = /FxiOS/.test(ua);
    setIsUnsupportedBrowser(isChromeIOS || isFirefoxIOS);
  }, []);

  // Ref al container immersivo per requestFullscreen
  const immersiveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      if (landscape) {
        setFrozenW(window.innerWidth);
        setFrozenH(window.innerHeight);
      } else {
        // Portrait → esci dal fullscreen se attivo
        const exit = document.exitFullscreen
          ?? (document as any).webkitExitFullscreen
          ?? (document as any).mozCancelFullScreen;
        if (exit && document.fullscreenElement) {
          exit.call(document).catch(() => {});
        }
      }
    };
    const timer = setTimeout(check, 100);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', () => setTimeout(check, 300));
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', check);
    };
  }, []);

  // ── Foto corrente nel fullscreen landscape ─────────────────────────────────
  const [current, setCurrent] = useState(0);
  const prev = useCallback(() => setCurrent(c => (c - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % photos.length), [photos.length]);

  // ── YouTube-style controls: visibili 3s poi scompaiono, tap per togglare ──
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  // Quando entra in landscape mostra i controlli per 3s
  useEffect(() => {
    if (isLandscape) {
      showControls();
    } else {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setControlsVisible(true);
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [isLandscape, showControls]);

  // Tap sul fullscreen → toggle controlli (come YouTube)
  const handleImmersiveTap = useCallback(() => {
    if (controlsVisible) {
      setControlsVisible(false);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    } else {
      showControls();
    }
  }, [controlsVisible, showControls]);

  // ── Touch handlers fullscreen ────────────────────────────────────────────
  // CRITICO: touchstart deve essere registrato con { passive: false } per
  // poter chiamare preventDefault() — che impedisce a Safari di mostrare
  // la toolbar. I React synthetic events sono sempre passive su Safari iOS.
  // Registriamo il listener direttamente sul container via useEffect + ref.
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const fullscreenRequested = useRef<boolean>(false);

  useEffect(() => {
    const el = immersiveRef.current;
    if (!el || !isLandscape) return;

    const onTouchStart = (e: TouchEvent) => {
      // preventDefault() qui impedisce a Safari di interpretare il touch
      // come interazione col browser → la toolbar non riappare MAI.
      // Funziona solo se il listener è { passive: false }.
      e.preventDefault();
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;

      // ── Fullscreen API chiamata da gesto utente diretto ──────────────────
      // Safari iOS richiede che requestFullscreen venga chiamato dentro un
      // handler di evento touch/click — NON da resize/orientationchange.
      // Lo chiamiamo al primo touch in landscape e ad ogni touch successivo
      // per mantenere il fullscreen se Safari lo ha abbandonato.
      if (!document.fullscreenElement && !fullscreenRequested.current) {
        fullscreenRequested.current = true;
        const req = (el as any).requestFullscreen
          ?? (el as any).webkitRequestFullscreen
          ?? (el as any).mozRequestFullScreen;
        if (req) {
          req.call(el, { navigationUI: 'hide' })
            .then(() => { fullscreenRequested.current = false; })
            .catch(() => { fullscreenRequested.current = false; });
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const dx = touchStartX.current - e.changedTouches[0].clientX;
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        dx > 0 ? next() : prev();
        showControls();
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        handleImmersiveTap();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [isLandscape, next, prev, showControls, handleImmersiveTap]);

  // Handler React vuoti — il lavoro vero è nei listener nativi sopra
  const handleTouchStart = () => {};
  const handleTouchEnd   = () => {};

  // ── Scroll lock in landscape ───────────────────────────────────────────────
  useEffect(() => {
    if (isLandscape) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isLandscape]);

  // ─────────────────────────────────────────────────────────────────────────
  // LANDSCAPE — modalità immersiva YouTube-style
  // ─────────────────────────────────────────────────────────────────────────
  if (isLandscape) {
    return (
      <div
        ref={immersiveRef}
        style={{
          position:   'fixed',
          top:        0,
          left:       0,
          // Dimensioni congelate in px al momento dell'entrata in landscape.
          // Né 100vh né 100dvh risolvono stabilmente il problema della toolbar
          // su Safari iOS e Chrome Android: 100vh è statico ma sbagliato,
          // 100dvh si aggiorna ma causa resize continui ad ogni tap.
          // window.innerHeight catturato una volta sola è l'unica soluzione stabile.
          width:      frozenW || '100vw',
          height:     frozenH || '100vh',
          background: '#000',
          zIndex:     9999,
          overflow:   'hidden',
          cursor:     controlsVisible ? 'default' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Foto a schermo pieno ── */}
        <img
          key={current}
          src={photos[current]}
          alt={`${roomName} ${current + 1}`}
          style={{
            position:  'absolute',
            top:       0,
            left:      0,
            width:     '100%',
            height:    '100%',
            objectFit: 'contain',
            display:   'block',
          }}
        />

        {/* ── Overlay controls — stile YouTube ──
             Visibili 3s, poi spariscono. Tap per richiamarli.        */}
        <div style={{
          position:   'absolute',
          top:        0,
          left:       0,
          width:      '100%',
          height:     '100%',
          zIndex:     2,
          opacity:    controlsVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        }}>

          {/* Gradient top */}
          <div style={{
            position:   'absolute', top: 0, left: 0, right: 0,
            height:     90,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
          }} />

          {/* Gradient bottom */}
          <div style={{
            position:   'absolute', bottom: 0, left: 0, right: 0,
            height:     90,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
          }} />

          {/* Top left — nome residenza */}
          <div style={{
            position:   'absolute',
            top:        'max(16px, env(safe-area-inset-top))',
            left:       'max(16px, env(safe-area-inset-left))',
            color:      '#fff',
            fontSize:   15,
            fontWeight: 600,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            {roomName}
          </div>

          {/* Top right — contatore N / totale */}
          <div style={{
            position:   'absolute',
            top:        'max(16px, env(safe-area-inset-top))',
            right:      'max(16px, env(safe-area-inset-right))',
            color:      'rgba(255,255,255,0.85)',
            fontSize:   14,
            fontWeight: 500,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            {current + 1} / {photos.length}
          </div>

          {/* Freccia sinistra */}
          {photos.length > 1 && (
            <button
              onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); prev(); showControls(); }}
              style={{
                position:    'absolute',
                left:        'max(12px, env(safe-area-inset-left))',
                top:         '50%',
                transform:   'translateY(-50%)',
                background:  'rgba(255,255,255,0.15)',
                border:      '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(6px)',
                color:       '#fff',
                width:       48, height: 48,
                borderRadius:'50%',
                fontSize:    24,
                cursor:      'pointer',
                display:     'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>
          )}

          {/* Freccia destra */}
          {photos.length > 1 && (
            <button
              onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); next(); showControls(); }}
              style={{
                position:    'absolute',
                right:       'max(12px, env(safe-area-inset-right))',
                top:         '50%',
                transform:   'translateY(-50%)',
                background:  'rgba(255,255,255,0.15)',
                border:      '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(6px)',
                color:       '#fff',
                width:       48, height: 48,
                borderRadius:'50%',
                fontSize:    24,
                cursor:      'pointer',
                display:     'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >›</button>
          )}

          {/* Bottom center — barra progressione dot minimale */}
          <div style={{
            position:       'absolute',
            bottom:         'max(16px, env(safe-area-inset-bottom))',
            left:           0, right: 0,
            display:        'flex',
            justifyContent: 'center',
            gap:            4,
          }}>
            {photos.map((_, i) => (
              <div key={i} style={{
                width:        i === current ? 20 : 6,
                height:       4,
                borderRadius: 2,
                background:   i === current ? '#FCAF1A' : 'rgba(255,255,255,0.35)',
                transition:   'all 0.2s',
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PORTRAIT — layout normale: top bar sticky + foto verticali
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* ── Banner browser non supportato ── */}
      {isUnsupportedBrowser && !bannerDismissed && (
        <div style={{
          position:   'sticky', top: 0, zIndex: 200,
          background: '#1E73BE',
          display:    'flex', alignItems: 'center', justifyContent: 'space-between',
          padding:    '10px 16px',
          gap:        10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>📷</span>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>
              Per la galleria immersiva usa Safari
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <a
              href={`safari-https://${typeof window !== 'undefined' ? window.location.host + window.location.pathname : ''}`}
              style={{
                background: '#fff', color: '#1E73BE',
                fontSize: 12, fontWeight: 700,
                padding: '6px 12px', borderRadius: 20,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Apri in Safari
            </a>
            <button
              onClick={() => setBannerDismissed(true)}
              style={{
                background: 'rgba(255,255,255,0.20)', border: 'none',
                color: '#fff', width: 28, height: 28, borderRadius: '50%',
                fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        </div>
      )}

      {/* ── Top bar sticky ── */}
      <div style={{
        position:     'sticky', top: 0, zIndex: 100,
        background:   '#fff',
        borderBottom: '1px solid #f0f0f0',
        boxShadow:    '0 1px 8px rgba(0,0,0,0.06)',
      }}>

        {/* Riga 1: ← + nome + conteggio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 10px' }}>
          <Link
            href={`/${locale}/residenze/${slug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: '50%',
              background: '#f5f5f5', border: '1px solid #e5e7eb',
              color: '#111', textDecoration: 'none', fontSize: 20, flexShrink: 0,
            }}
          >←</Link>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
              {roomName}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {allPhotosLabel}
            </div>
          </div>
        </div>

        {/* Riga 2: card-foto residenze scroll orizzontale */}
        <div style={{
          display:   'flex', gap: 10, overflowX: 'auto',
          padding:   '0 16px 14px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch' as any,
          msOverflowStyle: 'none', scrollbarWidth: 'none' as any,
        }}>
          {rooms.map(r => {
            const isActive = r.slug === slug;
            return (
              <Link
                key={r.slug}
                href={`/${locale}/residenze/${r.slug}/foto`}
                style={{ flexShrink: 0, scrollSnapAlign: 'start', textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  position:     'relative',
                  width:        110, height: 74,
                  borderRadius: 12, overflow: 'hidden',
                  border:       isActive ? '2.5px solid #1E73BE' : '2px solid transparent',
                  background:   '#e5e7eb',
                  boxShadow:    isActive ? '0 0 0 1px #1E73BE' : 'none',
                  transition:   'border 0.15s',
                }}>
                  {r.coverUrl ? (
                    <img
                      src={r.coverUrl} alt={r.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#d1d5db' }} />
                  )}
                  {/* Gradient + label */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 6, left: 0, right: 0,
                    textAlign: 'center', color: '#fff',
                    fontSize: 11, fontWeight: 700, lineHeight: 1.2,
                    padding: '0 4px', textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  }}>
                    {r.name}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Foto verticali ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '4px 0 40px', position: 'relative' }}>

        {photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontSize: 15 }}>
            Nessuna foto disponibile.
          </div>
        ) : (
          <>
            {photos.map((url, i) => (
              <div key={i} style={{
                width:       '100%', marginBottom: 4,
                background:  '#f0f0f0', aspectRatio: '4/3', overflow: 'hidden',
                // Su prima foto, aggiungiamo position relative per il floating hint
                position: i === 0 ? 'relative' : undefined,
              }}>
                <img
                  src={url}
                  alt={`${roomName} ${i + 1}`}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {/* ── Floating hint SOLO sulla prima foto ── */}
                {i === 0 && (
                  <div style={{
                    position:  'absolute',
                    bottom:    16,
                    left:      '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.62)',
                    backdropFilter: 'blur(8px)',
                    border:    '1px solid rgba(255,255,255,0.20)',
                    borderRadius: 30,
                    padding:   '8px 18px',
                    display:   'flex', alignItems: 'center', gap: 8,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    {/* Icona rotazione */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.90)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2"/>
                      <path d="M12 18h.01"/>
                      {/* Freccia rotazione */}
                      <path d="M8 22c2.5 1.5 7 1.5 9.5-1" strokeDasharray="2 1"/>
                    </svg>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.01em' }}>
                      Gira il telefono per la galleria immersiva
                    </span>
                    {/* Icona landscape */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.90)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2"/>
                      <path d="M18 12h.01"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Torna indietro in fondo */}
        <div style={{ padding: '24px 16px 0', textAlign: 'center' }}>
          <Link
            href={`/${locale}/residenze/${slug}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 50,
              border: '1.5px solid #1E73BE', color: '#1E73BE',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}
          >
            ← {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
