'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

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

  const ui = getTranslations(locale as Locale).components.fotoGallery;

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
        className={`fotogallery-immersive ${controlsVisible ? '' : 'is-controls-hidden'}`}
        // Dimensioni congelate in px al momento dell'entrata in landscape.
        // Né 100vh né 100dvh risolvono stabilmente il problema della toolbar
        // su Safari iOS e Chrome Android: 100vh è statico ma sbagliato,
        // 100dvh si aggiorna ma causa resize continui ad ogni tap.
        // window.innerHeight catturato una volta sola è l'unica soluzione stabile.
        style={{ width: frozenW || '100vw', height: frozenH || '100vh' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Foto a schermo pieno ── */}
        <img
          key={current}
          src={photos[current]}
          alt={`${roomName} ${current + 1}`}
          className="fotogallery-immersive__img"
        />

        {/* ── Overlay controls — stile YouTube ──
             Visibili 3s, poi spariscono. Tap per richiamarli.        */}
        <div className={`fotogallery-immersive__controls ${controlsVisible ? '' : 'is-hidden'}`}>

          {/* Gradient top */}
          <div className="fotogallery-immersive__gradient-top" />

          {/* Gradient bottom */}
          <div className="fotogallery-immersive__gradient-bottom" />

          {/* Top left — nome residenza */}
          <div className="fotogallery-immersive__title">{roomName}</div>

          {/* Top right — contatore N / totale */}
          <div className="fotogallery-immersive__counter">
            {current + 1} / {photos.length}
          </div>

          {/* Freccia sinistra */}
          {photos.length > 1 && (
            <button
              onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); prev(); showControls(); }}
              className="fotogallery-immersive__arrow fotogallery-immersive__arrow--left"
              aria-label={ui.prev}
            >‹</button>
          )}

          {/* Freccia destra */}
          {photos.length > 1 && (
            <button
              onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); next(); showControls(); }}
              className="fotogallery-immersive__arrow fotogallery-immersive__arrow--right"
              aria-label={ui.next}
            >›</button>
          )}

          {/* Bottom center — barra progressione dot minimale */}
          <div className="fotogallery-immersive__progress">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`fotogallery-immersive__progress-dot ${i === current ? 'is-active' : ''}`}
              />
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
    <div className="fotogallery-page">

      {/* ── Banner browser non supportato ── */}
      {/* Visibile solo su Chrome iOS (CriOS) e Firefox iOS (FxiOS). */}
      {isUnsupportedBrowser && !bannerDismissed && (
        <div className="fotogallery-ios-banner">
          <div className="fotogallery-ios-banner__content">
            <span className="fotogallery-ios-banner__emoji" aria-hidden="true">
              <i className="bi bi-camera-fill" />
            </span>
            <span className="fotogallery-ios-banner__text">
              {ui.iosBannerText}
            </span>
          </div>
          <div className="fotogallery-ios-banner__actions">
            <a
              href={`safari-https://${typeof window !== 'undefined' ? window.location.host + window.location.pathname : ''}`}
              className="fotogallery-ios-banner__safari-btn"
            >
              {ui.iosBannerOpenSafari}
            </a>
            <button
              onClick={() => setBannerDismissed(true)}
              className="fotogallery-ios-banner__close"
              aria-label={ui.close}
            ><i className="bi bi-x-lg" aria-hidden="true" /></button>
          </div>
        </div>
      )}

      {/* ── Top bar sticky ── */}
      <div className="fotogallery-topbar">

        {/* Riga 1: ← + nome + conteggio */}
        <div className="fotogallery-topbar__title-row">
          <Link
            href={`/${locale}/residenze/${slug}`}
            className="fotogallery-topbar__back-btn"
            aria-label={ui.back}
          >←</Link>
          <div>
            <div className="fotogallery-topbar__title">{roomName}</div>
            <div className="fotogallery-topbar__subtitle">{allPhotosLabel}</div>
          </div>
        </div>

        {/* Riga 2: card-foto residenze scroll orizzontale */}
        <div className="fotogallery-topbar__rooms-scroll">
          {rooms.map(r => {
            const isActive = r.slug === slug;
            return (
              <Link
                key={r.slug}
                href={`/${locale}/residenze/${r.slug}/foto`}
                className={`fotogallery-room-thumb ${isActive ? 'is-active' : ''}`}
              >
                <div className="fotogallery-room-thumb__frame">
                  {r.coverUrl ? (
                    <img
                      src={r.coverUrl}
                      alt={r.name}
                      className="fotogallery-room-thumb__img"
                    />
                  ) : (
                    <div className="fotogallery-room-thumb__empty" />
                  )}
                  <div className="fotogallery-room-thumb__gradient" />
                  <div className="fotogallery-room-thumb__label">{r.name}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Foto verticali ── */}
      <div className="page-container fotogallery-photos-list">

        {photos.length === 0 ? (
          <div className="fotogallery-empty">{ui.emptyState}</div>
        ) : (
          <>
            {photos.map((url, i) => (
              <div
                key={i}
                className={`fotogallery-photo-item${i === 0 ? ' fotogallery-photo-item--first' : ''}`}
              >
                <img
                  src={url}
                  alt={`${roomName} ${i + 1}`}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  className="fotogallery-photo-item__img"
                />

                {/* ── Floating hint SOLO sulla prima foto ── */}
                {i === 0 && (
                  <div className="fotogallery-rotate-hint">
                    {/* Icona rotazione */}
                    <svg
                      width="18" height="18" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      className="fotogallery-rotate-hint__icon"
                      aria-hidden="true"
                    >
                      <rect x="4" y="2" width="16" height="20" rx="2"/>
                      <path d="M12 18h.01"/>
                      {/* Freccia rotazione */}
                      <path d="M8 22c2.5 1.5 7 1.5 9.5-1" strokeDasharray="2 1"/>
                    </svg>
                    <span className="fotogallery-rotate-hint__text">
                      {ui.rotateHint}
                    </span>
                    {/* Icona landscape */}
                    <svg
                      width="18" height="18" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      className="fotogallery-rotate-hint__icon"
                      aria-hidden="true"
                    >
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
        <div className="fotogallery-back-link-wrap">
          <Link
            href={`/${locale}/residenze/${slug}`}
            className="fotogallery-back-link"
          >
            ← {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
