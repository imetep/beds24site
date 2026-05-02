'use client';
import { useState } from 'react';
import type { Locale } from '@/config/i18n';
import { Icon } from '@/components/ui/Icon';
import { getTranslations } from '@/lib/i18n';

// ─── Fonti (statiche — stessa lista in tutte le lingue) ───────────────────────
const SOURCES_INTL = [
  { outlet: 'Euronews — dic 2025',          title: 'Milan bans self check-in key boxes for short-term rentals starting in 2026',           url: 'https://www.euronews.com/travel/2025/12/05/milan-bans-self-check-in-key-boxes-for-short-term-rentals-starting-in-2026' },
  { outlet: 'The Local Italy — dic 2025',   title: 'Explained: how Italy\'s rules on self check-ins have changed again',                    url: 'https://www.thelocal.it/20251204/explained-how-italys-rules-on-self-check-ins-have-changed-again' },
  { outlet: 'Skift — feb 2025',             title: 'Italy clamps down on self check-ins and key boxes for short-term rentals',              url: 'https://skift.com/2025/02/25/italy-clamps-down-on-self-check-ins-and-key-boxes-for-short-term-rentals/' },
  { outlet: 'Rental Scale-Up — giu 2025',   title: 'Italy legalizes remote check-ins again: why this matters',                             url: 'https://www.rentalscaleup.com/italy-legalizes-remote-check-ins-again-why-this-matters-to-short-term-rental-managers-everywhere/' },
  { outlet: 'Travel & Tour World',          title: 'How new short-term rental laws will change your check-in experience in Italy',          url: 'https://www.travelandtourworld.com/news/article/planning-a-trip-to-italy-heres-how-new-short-term-rental-laws-will-change-your-check-in-experience/' },
];

const SOURCES_IT = [
  { outlet: 'Il Sole 24 Ore — nov 2025',      title: 'Affitti brevi: Consiglio di Stato conferma il divieto di self check-in',          url: 'https://www.ilsole24ore.com/art/affitti-brevi-consiglio-stato-conferma-divieto-self-check-in-AH0w2psD' },
  { outlet: 'Sky TG24 — nov 2025',            title: 'Affitti brevi e self check-in: la sentenza del Consiglio di Stato',               url: 'https://tg24.sky.it/economia/2025/11/22/affitti-brevi-self-check-in-consiglio-stato' },
  { outlet: 'Agenda Digitale — nov 2025',     title: 'Self check-in negli affitti brevi: cambia tutto di nuovo, ecco come',            url: 'https://www.agendadigitale.eu/documenti/self-check-in-negli-affitti-brevi-cambia-tutto-di-nuovo-ecco-come/' },
  { outlet: 'Il Fatto Quotidiano — nov 2025', title: 'Affitti brevi, self check-in vietato: la sentenza del Consiglio di Stato',       url: 'https://www.ilfattoquotidiano.it/2025/11/21/affitti-brevi-self-check-in-vietato-consiglio-stato-sentenza-oggi-news/8203757/' },
  { outlet: 'Smoobu Blog — dic 2025',         title: 'Stop self check-in e key box: cosa cambia per gli host',                        url: 'https://www.smoobu.com/it/blog/stop-self-check-in-e-key-box' },
  { outlet: 'Lodgify Blog — gen 2026',        title: 'Obbligo check-in de visu: cosa è legale nel 2026',                             url: 'https://www.lodgify.com/blog/it/obbligo-check-in-de-visu' },
];

// ─── Componenti interni ────────────────────────────────────────────────────────
function StepCard({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="self-checkin-page__step-card">
      <div className="self-checkin-page__step-num">{n}</div>
      <div>
        <p className="self-checkin-page__step-title">{title}</p>
        <p className="self-checkin-page__step-text">{text}</p>
      </div>
    </div>
  );
}

type FaqEntry = { q: string; a: string; linkLabel?: string };

function FaqItem({ faq, depositoHref }: { faq: FaqEntry; depositoHref: string }) {
  return (
    <div className="self-checkin-page__faq-item">
      <p className="self-checkin-page__faq-q">{faq.q}</p>
      <p className="self-checkin-page__faq-a">{faq.a}</p>
      {faq.linkLabel && (
        <a href={depositoHref} target="_blank" rel="noopener noreferrer" className="self-checkin-page__faq-link">
          {faq.linkLabel}
        </a>
      )}
    </div>
  );
}

interface Props { locale: Locale; wizardHref: string; contactHref: string; }

export default function SelfCheckinPage({ locale, wizardHref, contactHref }: Props) {
  const t = getTranslations(locale).components.selfCheckin;
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const depositoHref = `/${locale}/deposito`;

  return (
    <div className="page-container page-top self-checkin-page">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="self-checkin-page__hero">
        <div className="self-checkin-page__badge">
          {t.whyBadge}
        </div>
        <h1 className="self-checkin-page__title">{t.title}</h1>
        <p className="self-checkin-page__sub">{t.subtitle}</p>
      </div>

      {/* ── CTA sopra il fold ───────────────────────────────────────────────── */}
      <div className="self-checkin-page__cta-top">
        <a href={wizardHref} className="btn btn-primary btn-lg fw-bold w-100 py-3">
          {t.ctaBtn} →
        </a>
        <p className="small text-muted mt-2 mb-0">
          <Icon name="info-circle" className="me-1" /> {t.ctaNote}
        </p>
      </div>

      {/* ── Perché è obbligatorio ────────────────────────────────────────────── */}
      <div className="self-checkin-page__section">
        <h2 className="self-checkin-page__h2">{t.whyTitle}</h2>
        <p className="self-checkin-page__p">{t.whyText}</p>

        {/* Accordion fonti — subito dopo whyText */}
        <div className={`self-checkin-page__sources ${sourcesOpen ? 'is-open' : ''}`}>
          <button onClick={() => setSourcesOpen(o => !o)} className="self-checkin-page__sources-toggle">
            <span className="self-checkin-page__sources-toggle-text">
              <Icon name="newspaper" className="me-1" />
              {t.sourcesTitle}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="self-checkin-page__sources-chevron">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <div className="self-checkin-page__sources-body">
            <div className="self-checkin-page__sources-inner">
              <p className="self-checkin-page__sources-sub">{t.sourcesSubtitle}</p>
              <p className="self-checkin-page__sources-section">{t.sourcesIntl}</p>
              <ul className="self-checkin-page__sources-list">
                {SOURCES_INTL.map((s, i) => (
                  <li key={i} className="self-checkin-page__sources-item">
                    <span className="self-checkin-page__sources-outlet">{s.outlet}</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="self-checkin-page__sources-link">
                      {s.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
              <p className="self-checkin-page__sources-section">{t.sourcesIt}</p>
              <ul className="self-checkin-page__sources-list self-checkin-page__sources-list--last">
                {SOURCES_IT.map((s, i) => (
                  <li key={i} className="self-checkin-page__sources-item">
                    <span className="self-checkin-page__sources-outlet">{s.outlet}</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="self-checkin-page__sources-link">
                      {s.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="self-checkin-page__legal">
          <p className="self-checkin-page__legal-text">
            <Icon name="bank2" className="me-1" />
            {t.legalNote}
          </p>
        </div>
      </div>

      {/* ── 5 passi ─────────────────────────────────────────────────────────── */}
      <div className="self-checkin-page__section self-checkin-page__section--steps">
        <h2 className="self-checkin-page__h2 self-checkin-page__h2--mb-tight">{t.stepsTitle}</h2>
        {t.steps.map(s => (
          <StepCard key={s.n} {...s} />
        ))}
      </div>

      {/* ── Cosa ti serve ───────────────────────────────────────────────────── */}
      <div className="self-checkin-page__section">
        <h2 className="self-checkin-page__h2">{t.needTitle}</h2>
        <ul className="self-checkin-page__needs-list">
          {t.needs.map((need, i) => (
            <li key={i} className="self-checkin-page__needs-item">
              <Icon name="check-lg" className="self-checkin-page__needs-icon" />
              {need}
            </li>
          ))}
        </ul>
        <p className="self-checkin-page__time-note">
          <Icon name="clock-fill" className="me-1" /> {t.timeNote}
        </p>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <div className="self-checkin-page__section self-checkin-page__section--faq">
        <h2 className="self-checkin-page__h2 self-checkin-page__h2--mb-tight">{t.faqTitle}</h2>
        {t.faqs.map((faq, i) => (
          <FaqItem key={i} faq={faq} depositoHref={depositoHref} />
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <div className="self-checkin-page__cta">
        <h2 className="self-checkin-page__cta-title">{t.ctaTitle}</h2>
        <p className="self-checkin-page__cta-text">{t.ctaText}</p>
        <a href={wizardHref} className="self-checkin-page__cta-btn">
          {t.ctaBtn} →
        </a>
        <p className="self-checkin-page__cta-note">
          <Icon name="info-circle" className="me-1" /> {t.ctaNote}
        </p>
      </div>

      {/* ── Link contatti secondario ─────────────────────────────────────────── */}
      <div className="self-checkin-page__contact-link">
        <a href={contactHref}>
          {t.contactQuestion}
        </a>
      </div>

    </div>
  );
}
