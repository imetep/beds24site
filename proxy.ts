/**
 * proxy.ts  — LivingApple (Next.js 16)
 *
 * Riscrive i slug localizzati verso i nomi fisici delle cartelle (italiano).
 *
 * CARTELLA FISICA → SLUG PER LINGUA
 * ────────────────────────────────────────────────────────────────────────
 * prenota            IT:prenota       EN:book            DE:buchen          PL:rezerwuj
 * contatti           IT:contatti      EN:contact         DE:kontakt         PL:kontakt
 * residenze          IT:residenze     EN:residences      DE:residenzen      PL:rezydencje
 * dove-siamo         IT:dove-siamo    EN:location        DE:lage            PL:lokalizacja
 * utenze             IT:utenze        EN:utilities       DE:energie         PL:media
 * paga               IT:paga          EN:pay             DE:zahlen          PL:(usa paga)
 * prenotazione-sicura IT:p-sicura     EN:safe-booking    DE:sicher-buchen   PL:bezpieczna-rezerwacja
 *
 * SUB-PATH (3° segmento sotto residenze/[slug])
 * ────────────────────────────────────────────────────────────────────────
 * foto               EN:photos        DE:fotos
 */

import { NextRequest, NextResponse } from 'next/server';

const locales = ['it', 'en', 'de', 'pl'] as const;
type Locale = (typeof locales)[number];

/** Mappa slug-localizzato → cartella-italiana (2° segmento URL) */
const slugToIt: Record<Locale, Record<string, string>> = {
  it: {},
  en: {
    'book':                   'prenota',
    'contact':                'contatti',
    'residences':             'residenze',
    'location':               'dove-siamo',
    'utilities':              'utenze',
    'pay':                    'paga',
    'safe-booking':           'prenotazione-sicura',
  },
  de: {
    'buchen':                 'prenota',
    'kontakt':                'contatti',
    'residenzen':             'residenze',
    'lage':                   'dove-siamo',
    'energie':                'utenze',
    'zahlen':                 'paga',
    'sicher-buchen':          'prenotazione-sicura',
  },
  pl: {
    'rezerwuj':               'prenota',
    'kontakt':                'contatti',
    'rezydencje':             'residenze',
    'lokalizacja':            'dove-siamo',
    'media':                  'utenze',
    'bezpieczna-rezerwacja':  'prenotazione-sicura',
  },
};

/** Mappa sub-slug → sub-cartella italiana (3° segmento, solo sotto residenze/[slug]) */
const subSlugToIt: Record<Locale, Record<string, string>> = {
  it: {},
  en: { 'photos': 'foto' },
  de: { 'fotos':  'foto' },
  pl: {},
};

function isValidLocale(s: string): s is Locale {
  return (locales as readonly string[]).includes(s);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin/') ||
    /\.(.+)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return NextResponse.next();

  const locale = segments[0];
  if (!isValidLocale(locale)) return NextResponse.next();

  const slug = segments[1];
  const itSlug = slugToIt[locale][slug];

  if (!itSlug) return NextResponse.next();

  const rest = segments.slice(2);

  // Controlla se il 3° segmento (es. fotos/photos) va tradotto
  if (rest.length >= 2 && itSlug === 'residenze') {
    const subSlug = rest[1]; // es. "fotos" in /de/residenzen/pink-lady/fotos
    const itSubSlug = subSlugToIt[locale][subSlug];
    if (itSubSlug) {
      rest[1] = itSubSlug;
    }
  }

  const newPathname = ['', locale, itSlug, ...rest].join('/');
  const url = request.nextUrl.clone();
  url.pathname = newPathname;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
