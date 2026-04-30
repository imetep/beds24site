'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { locales, localeLabels, localeSlugs, type Locale } from '@/config/i18n';

interface Props {
  locale: Locale;
  nav: { home: string; residences: string; location: string; contact: string; book: string };
  legal: { privacy: string; terms: string; data: string; contact: string };
}

// Reverse map — localized slug → italian folder
const SLUG_TO_IT: Record<Locale, Record<string, string>> = {
  it: {},
  en: { 'book': 'prenota', 'contact': 'contatti', 'residences': 'residenze', 'location': 'dove-siamo', 'utilities': 'utenze', 'pay': 'paga', 'safe-booking': 'prenotazione-sicura', 'photos': 'foto' },
  de: { 'buchen': 'prenota', 'kontakt': 'contatti', 'residenzen': 'residenze', 'lage': 'dove-siamo', 'energie': 'utenze', 'zahlen': 'paga', 'sicher-buchen': 'prenotazione-sicura', 'fotos': 'foto' },
  pl: { 'rezerwuj': 'prenota', 'kontakt': 'contatti', 'rezydencje': 'residenze', 'lokalizacja': 'dove-siamo', 'media': 'utenze', 'bezpieczna-rezerwacja': 'prenotazione-sicura' },
};

// IT folder → localized slug for target locale
function itToSlug(itFolder: string, target: Locale): string {
  // Find the localeSlugs key whose IT value matches
  for (const key in localeSlugs) {
    if (localeSlugs[key].it === itFolder) {
      return localeSlugs[key][target];
    }
  }
  // foto subsegment
  if (itFolder === 'foto') {
    return target === 'en' ? 'photos' : target === 'de' ? 'fotos' : 'foto';
  }
  return itFolder; // fallback
}

function buildLocalizedHref(currentPath: string, currentLocale: Locale, target: Locale): string {
  const segments = currentPath.split('/').filter(Boolean);
  if (segments.length === 0) return `/${target}`;
  // segments[0] = current locale
  const rest = segments.slice(1);
  // Translate each segment: reverse to IT, then forward to target
  const translated = rest.map((seg, i) => {
    // Only translate known slug segments at specific positions
    // Position 0 (root section) always translated
    if (i === 0) {
      const itFolder = currentLocale === 'it' ? seg : (SLUG_TO_IT[currentLocale][seg] ?? seg);
      return itToSlug(itFolder, target);
    }
    // Position 2 under residenze: photos/fotos
    if (i === 2 && rest[0] && (rest[0] === 'residenze' || SLUG_TO_IT[currentLocale][rest[0]] === 'residenze')) {
      const itFolder = currentLocale === 'it' ? seg : (SLUG_TO_IT[currentLocale][seg] ?? seg);
      return itToSlug(itFolder, target);
    }
    return seg;
  });
  return '/' + [target, ...translated].join('/');
}

export default function HeaderClient({ locale, nav, legal }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const isWizard = pathname.includes('/prenota') || pathname.includes('/book') || pathname.includes('/buchen') || pathname.includes('/rezerwuj');

  if (isWizard) {
    return (
      <header className="sticky-top bg-white border-bottom">
        <div className="container d-flex align-items-center" style={{ maxWidth: 1200, height: 60 }}>
          <a href={`/${locale}`} className="d-flex align-items-center text-decoration-none flex-shrink-0">
            <Image src="/logo.svg" alt="LivingApple" height={34} width={130} style={{ objectFit: 'contain' }} priority unoptimized />
          </a>
          <a href={`/${locale}/${localeSlugs.residences[locale]}`} className="ms-auto small text-muted text-decoration-none text-nowrap">
            ← {nav.residences}
          </a>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky-top bg-white border-bottom">
        <div className="container d-flex align-items-center gap-3" style={{ maxWidth: 1200, height: 60 }}>
          <a href={`/${locale}`} className="d-flex align-items-center text-decoration-none flex-shrink-0">
            <Image src="/logo.svg" alt="LivingApple" height={34} width={130} style={{ objectFit: 'contain' }} priority unoptimized />
          </a>

          {/* Nav desktop */}
          <nav className="desktop-nav d-flex gap-4 ms-auto align-items-center">
            <a href={`/${locale}`} className="text-secondary text-decoration-none text-nowrap">{nav.home}</a>
            <a href={`/${locale}/${localeSlugs.residences[locale]}`} className="text-secondary text-decoration-none text-nowrap">{nav.residences}</a>
            <a href={`/${locale}`} className="btn btn-primary btn-sm fw-semibold text-nowrap">{nav.book}</a>

            {/* Language selector dropdown */}
            <div className="dropdown">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                onClick={() => setLangOpen(o => !o)}
                aria-expanded={langOpen}
              >
                <i className="bi bi-globe me-1"></i>
                {locale.toUpperCase()}
              </button>
              {langOpen && (
                <ul className="dropdown-menu dropdown-menu-end show mt-1" style={{ minWidth: 140 }}>
                  {locales.map(l => (
                    <li key={l}>
                      <a
                        href={buildLocalizedHref(pathname, locale, l)}
                        className={`dropdown-item ${l === locale ? 'active' : ''}`}
                      >
                        {localeLabels[l]}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Guest portal */}
            <a
              href={`/${locale}/guest/portal`}
              aria-label="Area Ospiti"
              title="Area Ospiti"
              className="text-muted text-decoration-none"
            >
              <i className="bi bi-lock" style={{ fontSize: '1.1rem' }}></i>
            </a>
          </nav>

          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            className="hamburger-btn btn btn-link p-2 ms-auto"
          >
            <span style={barStyle(menuOpen, 0)} />
            <span style={barStyle(menuOpen, 1)} />
            <span style={barStyle(menuOpen, 2)} />
          </button>
        </div>
      </header>

      {/* Drawer mobile */}
      {menuOpen && (
        <div
          className="position-fixed start-0 end-0 bottom-0 bg-white d-flex flex-column overflow-auto"
          style={{ top: 60, zIndex: 99 }}
          onClick={() => setMenuOpen(false)}
        >
          <div className="px-3 py-2">
            {[
              { href: `/${locale}`, label: nav.home },
              { href: `/${locale}/${localeSlugs.residences[locale]}`, label: nav.residences },
              { href: `/${locale}/${localeSlugs.location[locale]}`, label: nav.location },
              { href: `/${locale}/${localeSlugs.contact[locale]}`, label: nav.contact },
              { href: `/${locale}/guest/portal`, label: 'Area Ospiti', iconClass: 'bi-shield-lock-fill' },
            ].map(({ href, label, iconClass }: { href: string; label: string; iconClass?: string }) => (
              <a key={href} href={href} className="d-block fw-semibold text-dark text-decoration-none py-3 border-bottom" style={{ fontSize: '1.1rem' }}>
                {iconClass && <i className={`bi ${iconClass} me-2`} aria-hidden="true" />}
                {label}
              </a>
            ))}
          </div>

          {/* CTA Prenota */}
          <div className="px-3 py-3">
            <a href={`/${locale}`} className="btn btn-primary w-100 fw-bold">
              {nav.book}
            </a>
          </div>

          {/* Language selector mobile */}
          <div className="px-3 pt-2">
            <p className="small text-muted text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.05em' }}>
              <i className="bi bi-globe me-1"></i> Lingua
            </p>
            <div className="d-flex gap-2 flex-wrap">
              {locales.map(l => (
                <a
                  key={l}
                  href={buildLocalizedHref(pathname, locale, l)}
                  className={`btn btn-sm ${l === locale ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  {localeLabels[l]}
                </a>
              ))}
            </div>
          </div>

          {/* Separatore */}
          <div className="mx-3 mt-3 border-top" />

          {/* Link legali */}
          <div className="px-3 py-2 d-flex flex-column">
            {[
              { href: `/${locale}/privacy`, label: legal.privacy },
              { href: `/${locale}/condizioni`, label: legal.terms },
              { href: `/${locale}/trattamento-dati`, label: legal.data },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="small text-muted text-decoration-none py-2">
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: inline-flex !important; flex-direction: column; gap: 5px; }
        }
        @media (min-width: 681px) {
          .hamburger-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}

function barStyle(open: boolean, index: number): React.CSSProperties {
  const base: React.CSSProperties = { display: 'block', width: 22, height: 2, background: '#374151', borderRadius: 2, transition: 'all 0.22s ease', transformOrigin: 'center' };
  if (!open) return base;
  if (index === 0) return { ...base, transform: 'translateY(7px) rotate(45deg)' };
  if (index === 1) return { ...base, opacity: 0 };
  if (index === 2) return { ...base, transform: 'translateY(-7px) rotate(-45deg)' };
  return base;
}
