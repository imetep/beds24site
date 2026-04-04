/**
 * app/sitemap.ts
 *
 * Sitemap dinamica Next.js — generata a build time.
 * Include tutte le pagine pubbliche in IT / EN / DE / PL.
 *
 * NON include:
 * - /admin/* (privato)
 * - /api/* (non sono pagine)
 * - /[locale]/prenota, /paga, /prenota/successo (flusso transazionale)
 * - /[locale]/self-checkin/wizard* (richiede dati prenotazione)
 * - /[locale]/guest/portal (privato, già noindex)
 */

import { MetadataRoute } from 'next';
import { locales, type Locale } from '@/config/i18n';
import { ALL_ROOMS } from '@/config/properties';

const BASE_URL = 'https://livingapple.it';

// Slug localizzati per le sezioni del sito
const SLUGS: Record<string, Record<Locale, string>> = {
  residences: { it: 'residenze',   en: 'residences',  de: 'residenzen', pl: 'rezydencje'  },
  contact:    { it: 'contatti',    en: 'contact',      de: 'kontakt',    pl: 'kontakt'     },
  location:   { it: 'dove-siamo', en: 'location',     de: 'lage',       pl: 'lokalizacja' },
  checkin:    { it: 'self-checkin',en: 'self-checkin', de: 'self-checkin',pl: 'self-checkin'},
  utilities:  { it: 'utenze',     en: 'utilities',    de: 'energie',    pl: 'media'       },
  privacy:    { it: 'privacy',    en: 'privacy',      de: 'datenschutz',pl: 'prywatnosc'  },
  terms:      { it: 'condizioni', en: 'terms',        de: 'bedingungen',pl: 'regulamin'   },
  data:       { it: 'trattamento-dati', en: 'data-processing', de: 'datenverarbeitung', pl: 'przetwarzanie-danych' },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const now = new Date();

  // ── 1. Root redirect (→ /it) ────────────────────────────────────────────
  entries.push({
    url:              BASE_URL,
    lastModified:     now,
    changeFrequency:  'weekly',
    priority:         1.0,
  });

  // ── 2. Home per ogni locale ──────────────────────────────────────────────
  for (const locale of locales) {
    entries.push({
      url:             `${BASE_URL}/${locale}`,
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        locale === 'it' ? 1.0 : 0.9,
    });
  }

  // ── 3. Lista residenze ───────────────────────────────────────────────────
  for (const locale of locales) {
    entries.push({
      url:             `${BASE_URL}/${locale}/${SLUGS.residences[locale]}`,
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        0.9,
    });
  }

  // ── 4. Schede singole appartamenti (tutti gli slug × tutte le lingue) ────
  for (const room of ALL_ROOMS) {
    for (const locale of locales) {
      entries.push({
        url:             `${BASE_URL}/${locale}/${SLUGS.residences[locale]}/${room.slug}`,
        lastModified:    now,
        changeFrequency: 'monthly',
        priority:        0.85,
      });
    }
  }

  // ── 5. Pagine galleria foto ──────────────────────────────────────────────
  for (const room of ALL_ROOMS) {
    for (const locale of locales) {
      entries.push({
        url:             `${BASE_URL}/${locale}/${SLUGS.residences[locale]}/${room.slug}/foto`,
        lastModified:    now,
        changeFrequency: 'monthly',
        priority:        0.6,
      });
    }
  }

  // ── 6. Self check-in (pagina pubblica informativa) ───────────────────────
  for (const locale of locales) {
    entries.push({
      url:             `${BASE_URL}/${locale}/${SLUGS.checkin[locale]}`,
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.7,
    });
  }

  // ── 7. Contatti ──────────────────────────────────────────────────────────
  for (const locale of locales) {
    entries.push({
      url:             `${BASE_URL}/${locale}/${SLUGS.contact[locale]}`,
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.7,
    });
  }

  // ── 8. Utenze ────────────────────────────────────────────────────────────
  for (const locale of locales) {
    entries.push({
      url:             `${BASE_URL}/${locale}/${SLUGS.utilities[locale]}`,
      lastModified:    now,
      changeFrequency: 'yearly',
      priority:        0.4,
    });
  }

  // ── 9. Pagine legali ─────────────────────────────────────────────────────
  for (const locale of locales) {
    entries.push(
      {
        url:             `${BASE_URL}/${locale}/${SLUGS.privacy[locale]}`,
        lastModified:    now,
        changeFrequency: 'yearly',
        priority:        0.3,
      },
      {
        url:             `${BASE_URL}/${locale}/${SLUGS.terms[locale]}`,
        lastModified:    now,
        changeFrequency: 'yearly',
        priority:        0.3,
      },
      {
        url:             `${BASE_URL}/${locale}/${SLUGS.data[locale]}`,
        lastModified:    now,
        changeFrequency: 'yearly',
        priority:        0.3,
      },
    );
  }

  return entries;
}
