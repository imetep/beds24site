'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface Props {
  locale: string;
  nav: { home: string; residences: string; location: string; contact: string; book: string };
  legal: { privacy: string; terms: string; data: string; contact: string };
}

export default function HeaderClient({ locale, nav, legal }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isWizard = pathname.includes('/prenota') || pathname === `/${locale}`;

  if (isWizard) {
    return (
      <header style={headerStyle}>
        <div style={innerStyle}>
          <a href={`/${locale}/residenze`} style={logoLinkStyle}>
            <Image src="/logo.png" alt="LivingApple" height={34} width={130} style={{ objectFit: 'contain' }} priority />
          </a>
          <a href={`/${locale}/residenze`} style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'none', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            ← {nav.residences}
          </a>
        </div>
      </header>
    );
  }

  return (
    <>
      <header style={headerStyle}>
        <div style={innerStyle}>
          {/* Logo → Home */}
          <a href={`/${locale}`} style={logoLinkStyle}>
            <Image src="/logo.png" alt="LivingApple" height={34} width={130} style={{ objectFit: 'contain' }} priority />
          </a>

          {/* Nav desktop: Home · Residenze · Prenota · Lucchetto ospiti */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: '1.25rem', marginLeft: 'auto', alignItems: 'center' }}>
            <a href={`/${locale}`}           style={navLinkStyle}>{nav.home}</a>
            <a href={`/${locale}/residenze`} style={navLinkStyle}>{nav.residences}</a>
            <a href={`/${locale}`}           style={ctaStyle}>{nav.book}</a>
            <a
              href={`/${locale}/guest/portal`}
              aria-label="Area Ospiti"
              title="Area Ospiti"
              style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'color 0.15s' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </a>
          </nav>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            className="hamburger-btn"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', display: 'none', flexDirection: 'column', gap: '5px' }}
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
          style={{ position: 'fixed', top: 60, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 99, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
          onClick={() => setMenuOpen(false)}
        >
          {/* Link principali */}
          <div style={{ padding: '0.5rem 1.5rem' }}>
            {[
              { href: `/${locale}`,                label: nav.home },
              { href: `/${locale}/residenze`,      label: nav.residences },
              { href: `/${locale}/dove-siamo`,     label: nav.location },
              { href: `/${locale}/contatti`,       label: nav.contact },
              { href: `/${locale}/guest/portal`,   label: '🔐 Area Ospiti' },
            ].map(({ href, label }) => (
              <a key={href} href={href} style={{ fontSize: '1.15rem', fontWeight: 600, color: '#111', textDecoration: 'none', padding: '0.9rem 0', borderBottom: '1px solid #f0f0f0', display: 'block' }}>
                {label}
              </a>
            ))}
          </div>

          {/* CTA Prenota */}
          <div style={{ padding: '1rem 1.5rem' }}>
            <a href={`/${locale}`} style={{ display: 'block', padding: '1rem', background: '#1E73BE', color: '#fff', borderRadius: '10px', textAlign: 'center', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
              {nav.book}
            </a>
          </div>

          {/* Separatore */}
          <div style={{ height: 1, background: '#f0f0f0', margin: '0 1.5rem' }} />

          {/* Link legali */}
          <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            {[
              { href: `/${locale}/privacy`,           label: legal.privacy },
              { href: `/${locale}/condizioni`,        label: legal.terms },
              { href: `/${locale}/trattamento-dati`,  label: legal.data },
            ].map(({ href, label }) => (
              <a key={href} href={href} style={{ fontSize: '0.9rem', color: '#9ca3af', textDecoration: 'none', padding: '0.5rem 0' }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
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

const headerStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 1.25rem' };
const innerStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto', height: '60px', display: 'flex', alignItems: 'center', gap: '1rem' };
const logoLinkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 };
const navLinkStyle: React.CSSProperties = { color: '#374151', textDecoration: 'none', fontSize: '0.9rem', whiteSpace: 'nowrap' };
const ctaStyle: React.CSSProperties = { backgroundColor: '#1E73BE', color: '#fff', padding: '0.45rem 1rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap' };
