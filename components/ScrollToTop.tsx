'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Gestisce manualmente lo scroll position su navigazione client-side per
 * compensare il caso in cui Safari iOS / Chrome mobile ripristinerebbero lo
 * scroll Y precedente all'arrivo di una pagina, in particolare quando il
 * middleware proxy.ts riscrive lo slug straniero (es. /en/residences →
 * /en/residenze) e Next.js cade su hard-navigation o forza un remount del
 * locale layout.
 *
 * Comportamento:
 *  - Forward navigation (Link, router.push, primo arrivo da link esterno)
 *    → scroll a 0,0.
 *  - Back/forward del browser (popstate) → ripristina la posizione salvata
 *    per quella entry (sync nel popstate handler, prima che React renderizzi).
 *  - URL con hash → lascia che il browser scrolli all'ancora.
 *
 * Lo scroll restoration nativo del browser è disabilitato in
 * app/layout.tsx via inline script (history.scrollRestoration='manual').
 *
 * Il componente è montato in app/layout.tsx (root) — NON in
 * app/[locale]/layout.tsx — perché il locale layout si remounta a ogni
 * cambio pathname, e perderebbe i listener.
 *
 * Lo storico scroll è in sessionStorage per resistere a hard-nav.
 */
const SCROLL_MAP_KEY = '__scroll_map_v1__';
const POPSTATE_FLAG_KEY = '__popstate_at_v1__';
const POPSTATE_GUARD_MS = 200;

function readMap(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_MAP_KEY) || '{}');
  } catch {
    return {};
  }
}
function writeMap(map: Record<string, number>) {
  try {
    sessionStorage.setItem(SCROLL_MAP_KEY, JSON.stringify(map));
  } catch {
    /* quota o privacy mode → fallback silenzioso */
  }
}
function buildKey(): string {
  return window.location.pathname + window.location.search;
}

export default function ScrollToTop() {
  const pathname = usePathname();
  const currentKey = useRef<string>('');

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    currentKey.current = buildKey();

    const onScroll = () => {
      const map = readMap();
      map[currentKey.current] = window.scrollY;
      writeMap(map);
    };
    const onPopstate = () => {
      sessionStorage.setItem(POPSTATE_FLAG_KEY, String(Date.now()));
      const key = buildKey();
      const map = readMap();
      const saved = map[key] ?? 0;
      window.scrollTo({ top: saved, left: 0, behavior: 'instant' as ScrollBehavior });
      currentKey.current = key;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', onPopstate);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', onPopstate);
    };
  }, []);

  useEffect(() => {
    const newKey = buildKey();
    // Su back/forward (popstate), il restore è già stato gestito sincronamente
    // dal popstate handler. Non sovrascrivere.
    const popstateAt = Number(sessionStorage.getItem(POPSTATE_FLAG_KEY) || '0');
    if (Date.now() - popstateAt < POPSTATE_GUARD_MS) {
      currentKey.current = newKey;
      return;
    }
    if (window.location.hash) {
      // L'ancora viene gestita dal browser.
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    currentKey.current = newKey;
  }, [pathname]);

  return null;
}
