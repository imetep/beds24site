'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Forza scroll-to-top su navigazione forward (Link click, router.push) e
 * preserva la posizione su back/forward del browser.
 *
 * Risolve un caso reale: cliccando una card residenza dal fondo della pagina
 * /residenze, la nuova pagina di dettaglio appariva scrollata in basso invece
 * di partire dall'header. Centralizzato qui per coprire tutte le navigazioni
 * interne, non solo residenze.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const isPopstate = useRef(false);
  const isInitial = useRef(true);

  useEffect(() => {
    const onPopstate = () => { isPopstate.current = true; };
    window.addEventListener('popstate', onPopstate);
    return () => window.removeEventListener('popstate', onPopstate);
  }, []);

  useEffect(() => {
    // Primo render: lascia decidere al browser (rispetta scroll restoration su reload).
    if (isInitial.current) { isInitial.current = false; return; }
    // Back/forward: il browser ripristina la posizione, non sovrascrivere.
    if (isPopstate.current) { isPopstate.current = false; return; }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
