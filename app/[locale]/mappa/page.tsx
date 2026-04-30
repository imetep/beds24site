import type { Metadata } from 'next';
import Link from 'next/link';
import { locales, localeLabels, type Locale } from '@/config/i18n';
import { ALL_ROOMS } from '@/config/properties';

export const metadata: Metadata = {
  title: 'Mappa pagine — LivingApple',
  description: 'Elenco interno di tutte le pagine pubbliche del sito.',
  robots: { index: false, follow: false, nocache: true },
};

type SlugMap = Record<Locale, string>;

interface Section {
  key: string;
  labels: Record<Locale, string>;
  slugs: SlugMap;
}

const PUBLIC_SECTIONS: Section[] = [
  {
    key: 'home',
    labels: { it: 'Home', en: 'Home', de: 'Home', pl: 'Home' },
    slugs: { it: '', en: '', de: '', pl: '' },
  },
  {
    key: 'residences',
    labels: { it: 'Residenze', en: 'Residences', de: 'Residenzen', pl: 'Rezydencje' },
    slugs: { it: 'residenze', en: 'residences', de: 'residenzen', pl: 'rezydencje' },
  },
  {
    key: 'location',
    labels: { it: 'Dove siamo', en: 'Location', de: 'Lage', pl: 'Lokalizacja' },
    slugs: { it: 'dove-siamo', en: 'location', de: 'lage', pl: 'lokalizacja' },
  },
  {
    key: 'contact',
    labels: { it: 'Contatti', en: 'Contact', de: 'Kontakt', pl: 'Kontakt' },
    slugs: { it: 'contatti', en: 'contact', de: 'kontakt', pl: 'kontakt' },
  },
  {
    key: 'self-checkin',
    labels: {
      it: 'Self check-in',
      en: 'Self check-in',
      de: 'Self check-in',
      pl: 'Self check-in',
    },
    slugs: { it: 'self-checkin', en: 'self-checkin', de: 'self-checkin', pl: 'self-checkin' },
  },
  {
    key: 'safebooking',
    labels: {
      it: 'Prenotazione sicura',
      en: 'Safe booking',
      de: 'Sichere Buchung',
      pl: 'Bezpieczna rezerwacja',
    },
    slugs: {
      it: 'prenotazione-sicura',
      en: 'safe-booking',
      de: 'sicher-buchen',
      pl: 'bezpieczna-rezerwacja',
    },
  },
  {
    key: 'deposit',
    labels: { it: 'Deposito', en: 'Deposit', de: 'Kaution', pl: 'Kaucja' },
    slugs: { it: 'deposito', en: 'deposito', de: 'deposito', pl: 'deposito' },
  },
  {
    key: 'utilities',
    labels: { it: 'Utenze', en: 'Utilities', de: 'Energie', pl: 'Media' },
    slugs: { it: 'utenze', en: 'utilities', de: 'energie', pl: 'media' },
  },
  {
    key: 'pets',
    labels: { it: 'Animali', en: 'Pets', de: 'Tiere', pl: 'Zwierzęta' },
    slugs: { it: 'animali', en: 'animali', de: 'animali', pl: 'animali' },
  },
];

const LEGAL_SECTIONS: Section[] = [
  {
    key: 'privacy',
    labels: { it: 'Privacy', en: 'Privacy', de: 'Privacy', pl: 'Privacy' },
    slugs: { it: 'privacy', en: 'privacy', de: 'privacy', pl: 'privacy' },
  },
  {
    key: 'terms',
    labels: { it: 'Condizioni', en: 'Terms', de: 'Bedingungen', pl: 'Regulamin' },
    slugs: { it: 'condizioni', en: 'condizioni', de: 'condizioni', pl: 'condizioni' },
  },
  {
    key: 'data',
    labels: {
      it: 'Trattamento dati',
      en: 'Data processing',
      de: 'Datenverarbeitung',
      pl: 'Przetwarzanie danych',
    },
    slugs: {
      it: 'trattamento-dati',
      en: 'trattamento-dati',
      de: 'trattamento-dati',
      pl: 'trattamento-dati',
    },
  },
];

const TRANSACTIONAL_SECTIONS: { key: string; label: string; path: (l: Locale) => string }[] = [
  {
    key: 'book',
    label: 'Prenota / Book',
    path: (l) => {
      const m: Record<Locale, string> = {
        it: 'prenota',
        en: 'book',
        de: 'buchen',
        pl: 'rezerwuj',
      };
      return `/${l}/${m[l]}`;
    },
  },
  { key: 'guest', label: 'Area Ospiti', path: (l) => `/${l}/guest/portal` },
];

const RESIDENCES_SLUG = PUBLIC_SECTIONS.find((s) => s.key === 'residences')!.slugs;

const PHOTOS_SUBSLUG: SlugMap = {
  it: 'foto',
  en: 'photos',
  de: 'fotos',
  pl: 'foto',
};

function buildPath(locale: Locale, slug: string): string {
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

function SectionList({
  locale,
  title,
  sections,
}: {
  locale: Locale;
  title: string;
  sections: Section[];
}) {
  return (
    <>
      <h3 className="h6 fw-semibold text-uppercase text-muted mt-4 mb-2">{title}</h3>
      <ul className="list-unstyled mb-0">
        {sections.map((s) => {
          const path = buildPath(locale, s.slugs[locale]);
          return (
            <li key={s.key} className="mb-1">
              <Link href={path} className="text-decoration-none">
                {s.labels[locale]}
              </Link>
              <code className="small text-muted ms-2">{path}</code>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function MappaPage() {
  const total =
    locales.length *
    (PUBLIC_SECTIONS.length +
      ALL_ROOMS.length * 2 +
      LEGAL_SECTIONS.length +
      TRANSACTIONAL_SECTIONS.length);

  return (
    <main className="container py-5 mappa-page">
      <h1 className="mb-2">Mappa pagine</h1>
      <p className="text-muted mb-1">
        Pagina interna non indicizzata. Elenco completo degli URL pubblici realmente funzionanti,
        divisi per lingua. Slug canonical generati seguendo <code>proxy.ts</code> +{' '}
        <code>config/i18n.ts</code> + <code>config/properties.ts</code>.
      </p>
      <p className="text-muted small mb-4">
        Totale URL: <strong>{total}</strong> ({locales.length} lingue × {PUBLIC_SECTIONS.length}{' '}
        pubbliche + {ALL_ROOMS.length} schede + {ALL_ROOMS.length} gallerie +{' '}
        {LEGAL_SECTIONS.length} legali + {TRANSACTIONAL_SECTIONS.length} transazionali).
      </p>

      {locales.map((loc) => (
        <section key={loc} className="mb-5 pb-4 border-bottom">
          <h2 className="h4 mb-1">
            {localeLabels[loc]} <code className="small text-muted">/{loc}</code>
          </h2>

          <SectionList locale={loc} title="Pubbliche" sections={PUBLIC_SECTIONS} />

          <h3 className="h6 fw-semibold text-uppercase text-muted mt-4 mb-2">
            Schede appartamento + galleria foto
          </h3>
          <ul className="list-unstyled mb-0">
            {ALL_ROOMS.map((room) => {
              const base = `/${loc}/${RESIDENCES_SLUG[loc]}/${room.slug}`;
              const photos = `${base}/${PHOTOS_SUBSLUG[loc]}`;
              return (
                <li key={room.slug} className="mb-1">
                  <Link href={base} className="text-decoration-none">
                    {room.name}
                  </Link>
                  {' · '}
                  <Link href={photos} className="text-decoration-none">
                    foto
                  </Link>
                  <code className="small text-muted ms-2">{base}</code>
                </li>
              );
            })}
          </ul>

          <SectionList locale={loc} title="Legali" sections={LEGAL_SECTIONS} />

          <h3 className="h6 fw-semibold text-uppercase text-muted mt-4 mb-2">
            Transazionali / Area riservata
          </h3>
          <ul className="list-unstyled mb-0">
            {TRANSACTIONAL_SECTIONS.map((s) => {
              const path = s.path(loc);
              return (
                <li key={s.key} className="mb-1">
                  <Link href={path} className="text-decoration-none">
                    {s.label}
                  </Link>
                  <code className="small text-muted ms-2">{path}</code>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
