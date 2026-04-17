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
        className="position-fixed top-0 start-0 overflow-hidden"
        style={{
          // Dimensioni congelate in px al momento dell'entrata in landscape.
          // Né 100vh né 100dvh risolvono stabilmente il problema della toolbar
          // su Safari iOS e Chrome Android: 100vh è statico ma sbagliato,
          // 100dvh si aggiorna ma causa resize continui ad ogni tap.
          // window.innerHeight catturato una volta sola è l'unica soluzione stabile.
          width:      frozenW || '100vw',
          height:     frozenH || '100vh',
          background: '#000',
          zIndex:     9999,
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
          className="position-absolute top-0 start-0 w-100 h-100 d-block"
          style={{ objectFit: 'contain' }}
        />

        {/* ── Overlay controls — stile YouTube ──
             Visibili 3s, poi spariscono. Tap per richiamarli.        */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            zIndex:     2,
            opacity:    controlsVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: controlsVisible ? 'auto' : 'none',
          }}
        >

          {/* Gradient top */}
          <div
            className="position-absolute top-0 start-0 end-0"
            style={{
              height:     90,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
            }}
          />

          {/* Gradient bottom */}
          <div
            className="position-absolute bottom-0 start-0 end-0"
            style={{
              height:     90,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
            }}
          />

          {/* Top left — nome residenza */}
          <div
            className="position-absolute text-white fw-semibold"
            style={{
              top:        'max(16px, env(safe-area-inset-top))',
              left:       'max(16px, env(safe-area-inset-left))',
              fontSize:   15,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {roomName}
          </div>

          {/* Top right — contatore N / totale */}
          <div
            className="position-absolute fw-medium"
            style={{
              top:        'max(16px, env(safe-area-inset-top))',
              right:      'max(16px, env(safe-area-inset-right))',
              color:      'rgba(255,255,255,0.85)',
              fontSize:   14,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {current + 1} / {photos.length}
          </div>

          {/* Freccia sinistra */}
          {photos.length > 1 && (
            <button
              onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); prev(); showControls(); }}
              className="btn position-absolute rounded-circle text-white d-flex align-items-center justify-content-center"
              style={{
                left:        'max(12px, env(safe-area-inset-left))',
                top:         '50%',
                transform:   'translateY(-50%)',
                background:  'rgba(255,255,255,0.15)',
                border:      '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(6px)',
                width:       48, height: 48,
                fontSize:    24,
              }}
            >‹</button>
          )}

          {/* Freccia destra */}
          {photos.length > 1 && (
            <button
              onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); next(); showControls(); }}
              className="btn position-absolute rounded-circle text-white d-flex align-items-center justify-content-center"
              style={{
                right:       'max(12px, env(safe-area-inset-right))',
                top:         '50%',
                transform:   'translateY(-50%)',
                background:  'rgba(255,255,255,0.15)',
                border:      '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(6px)',
                width:       48, height: 48,
                fontSize:    24,
              }}
            >›</button>
          )}

          {/* Bottom center — barra progressione dot minimale */}
          <div
            className="position-absolute start-0 end-0 d-flex justify-content-center"
            style={{
              bottom:         'max(16px, env(safe-area-inset-bottom))',
              gap:            4,
            }}
          >
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
    <div className="bg-white min-vh-100">

      {/* ── Banner browser non supportato ── */}
      {isUnsupportedBrowser && !bannerDismissed && (
        <div
          className="position-sticky top-0 d-flex align-items-center justify-content-between gap-2 px-3 py-2"
          style={{ zIndex: 200, background: 'var(--color-primary)' }}
        >
          <div className="d-flex align-items-center gap-2 flex-fill min-w-0">
            <span className="flex-shrink-0" style={{ fontSize: 18 }}>📷</span>
            <span className="text-white fw-medium" style={{ fontSize: 13, lineHeight: 1.3 }}>
              Per la galleria immersiva usa Safari
            </span>
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <a
              href={`safari-https://${typeof window !== 'undefined' ? window.location.host + window.location.pathname : ''}`}
              className="bg-white fw-bold text-decoration-none text-nowrap rounded-pill"
              style={{
                color: 'var(--color-primary)',
                fontSize: 12,
                padding: '6px 12px',
              }}
            >
              Apri in Safari
            </a>
            <button
              onClick={() => setBannerDismissed(true)}
              className="btn rounded-circle text-white d-flex align-items-center justify-content-center border-0"
              style={{
                background: 'rgba(255,255,255,0.20)',
                width: 28, height: 28,
                fontSize: 14,
              }}
            >✕</button>
          </div>
        </div>
      )}

      {/* ── Top bar sticky ── */}
      <div
        className="position-sticky top-0 bg-white border-bottom shadow-sm"
        style={{ zIndex: 100 }}
      >

        {/* Riga 1: ← + nome + conteggio */}
        <div className="d-flex align-items-center gap-2 px-3 pt-3 pb-2">
          <Link
            href={`/${locale}/residenze/${slug}`}
            className="d-flex align-items-center justify-content-center rounded-circle border text-decoration-none flex-shrink-0"
            style={{
              width: 40, height: 40,
              background: '#f5f5f5',
              color: '#111', fontSize: 20,
            }}
          >←</Link>
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: 16, lineHeight: 1.2 }}>
              {roomName}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {allPhotosLabel}
            </div>
          </div>
        </div>

        {/* Riga 2: card-foto residenze scroll orizzontale */}
        <div
          className="d-flex gap-2 px-3 pb-3"
          style={{
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch' as any,
            msOverflowStyle: 'none', scrollbarWidth: 'none' as any,
          }}
        >
          {rooms.map(r => {
            const isActive = r.slug === slug;
            return (
              <Link
                key={r.slug}
                href={`/${locale}/residenze/${r.slug}/foto`}
                className="flex-shrink-0 d-block text-decoration-none"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div
                  className="position-relative overflow-hidden"
                  style={{
                    width:        110, height: 74,
                    borderRadius: 12,
                    border:       isActive ? '2.5px solid #1E73BE' : '2px solid transparent',
                    background:   '#e5e7eb',
                    boxShadow:    isActive ? '0 0 0 1px #1E73BE' : 'none',
                    transition:   'border 0.15s',
                  }}
                >
                  {r.coverUrl ? (
                    <img
                      src={r.coverUrl} alt={r.name}
                      className="w-100 h-100 d-block"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-100 h-100" style={{ background: '#d1d5db' }} />
                  )}
                  {/* Gradient + label */}
                  <div
                    className="position-absolute bottom-0 start-0 end-0"
                    style={{
                      height: '55%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                    }}
                  />
                  <div
                    className="position-absolute start-0 end-0 text-center text-white fw-bold"
                    style={{
                      bottom: 6,
                      fontSize: 11, lineHeight: 1.2,
                      padding: '0 4px', textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    {r.name}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Foto verticali ── */}
      <div className="mx-auto pb-5 position-relative" style={{ maxWidth: 900, paddingTop: 4 }}>

        {photos.length === 0 ? (
          <div className="text-center py-5 px-3" style={{ color: '#999', fontSize: 15 }}>
            Nessuna foto disponibile.
          </div>
        ) : (
          <>
            {photos.map((url, i) => (
              <div
                key={i}
                className={`w-100 overflow-hidden${i === 0 ? ' position-relative' : ''}`}
                style={{
                  marginBottom: 4,
                  background:  '#f0f0f0', aspectRatio: '4/3',
                }}
              >
                <img
                  src={url}
                  alt={`${roomName} ${i + 1}`}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  className="w-100 h-100 d-block"
                  style={{ objectFit: 'cover' }}
                />

                {/* ── Floating hint SOLO sulla prima foto ── */}
                {i === 0 && (
                  <div
                    className="position-absolute d-flex align-items-center gap-2 text-nowrap rounded-pill"
                    style={{
                      bottom:    16,
                      left:      '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.62)',
                      backdropFilter: 'blur(8px)',
                      border:    '1px solid rgba(255,255,255,0.20)',
                      padding:   '8px 18px',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* Icona rotazione */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.90)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2"/>
                      <path d="M12 18h.01"/>
                      {/* Freccia rotazione */}
                      <path d="M8 22c2.5 1.5 7 1.5 9.5-1" strokeDasharray="2 1"/>
                    </svg>
                    <span className="text-white fw-semibold" style={{ fontSize: 13, letterSpacing: '0.01em' }}>
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
        <div className="text-center px-3 pt-4">
          <Link
            href={`/${locale}/residenze/${slug}`}
            className="d-inline-flex align-items-center gap-2 text-decoration-none rounded-pill fw-bold"
            style={{
              padding: '12px 28px',
              border: '1.5px solid #1E73BE', color: 'var(--color-primary)',
              fontSize: 14,
            }}
          >
            ← {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
