'use client';
import { useState } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

const AIRBNB_URL = 'https://www.airbnb.it/p/livingapple-italy-vacation-rentals';
const UFFICIOCAMERALE_URL = 'https://www.ufficiocamerale.it/trova-azienda';

type Chapter = {
  title: string;
  body: string;
  warn?: string;
  tip?: string;
};

function ChapterToggle({ chapter, index }: { chapter: Chapter; index: number }) {
  const [open, setOpen] = useState(index < 2);
  return (
    <div className={`prenotazione-sicura__chapter-toggle ${open ? 'is-open' : ''}`}>
      <button onClick={() => setOpen(!open)} className="prenotazione-sicura__chapter-btn">
        <span className="fw-semibold text-primary flex-fill">{chapter.title}</span>
        <span className="prenotazione-sicura__chapter-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-3 border-top">
          {chapter.body.split('\n\n').map((para, i) => (
            <p key={i} className="text-secondary mb-2 prenotazione-sicura__chapter-para">{para}</p>
          ))}
          {chapter.warn && (
            <div className="prenotazione-sicura__chapter-warn">
              <p className="small mb-0">
                <Icon name="exclamation-triangle-fill" className="me-1" />
                {chapter.warn}
              </p>
            </div>
          )}
          {chapter.tip && (
            <div className="prenotazione-sicura__chapter-tip">
              <p className="small mb-0">
                <Icon name="lightbulb-fill" className="me-1" />
                {chapter.tip}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PrenotazioneSicuraClient({
  locale,
  bookHref,
}: {
  locale: Locale;
  bookHref: string;
}) {
  const t = getTranslations(locale).components.prenotazioneSicura;

  return (
    <div className="page-container page-top pb-5">

      {/* Hero */}
      <section className="text-center pb-5">
        <div className="prenotazione-sicura__hero-icon">
          <Icon name="search" />
        </div>
        <h1 className="fw-bold text-primary mb-3 prenotazione-sicura__hero-title">{t.heroTitle}</h1>
        <p className="fs-5 text-secondary mx-auto mb-0 prenotazione-sicura__hero-sub">{t.heroSub}</p>
      </section>

      {/* 5 pillole trust */}
      <section className="mb-5">
        <h2 className="fw-bold text-primary fs-3 mb-3">{t.trustTitle}</h2>
        <div className="prenotazione-sicura__pillars-grid">
          {t.trustPills.map((pill, i) => (
            <div key={i} className="prenotazione-sicura__pillar">
              <Icon name={pill.icon as IconName} className="prenotazione-sicura__pillar-icon" />
              <strong className="prenotazione-sicura__pillar-title">{pill.title}</strong>
              <p className="prenotazione-sicura__pillar-text">{pill.text}</p>
              {pill.link && (
                <a
                  href={pill.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="small fw-semibold text-primary text-decoration-none mt-1"
                >
                  {pill.link.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Checklist rapida */}
      <section className="prenotazione-sicura__checklist">
        <h2 className="fw-bold text-primary fs-3 mb-3">
          <Icon name="check-circle-fill" className="me-1" />
          {t.checklistTitle}
        </h2>
        <ol className="ps-4 d-flex flex-column gap-2 mb-3 prenotazione-sicura__checklist-list">
          {t.checklist.map((item, i) => (
            <li key={i} className="small">{item}</li>
          ))}
        </ol>
        <div className="d-flex gap-2 flex-wrap">
          <a href={UFFICIOCAMERALE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
            <Icon name="building" className="me-1" /> {t.ctaVerifyRi}
          </a>
          <a href={AIRBNB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
            <Icon name="star-fill" className="me-1" /> {t.ctaVerifyAirbnb}
          </a>
        </div>
      </section>

      {/* Guida completa */}
      <section className="mb-5">
        <h2 className="fw-bold text-primary fs-3 mb-1">{t.guideTitle}</h2>
        <p className="small text-muted fst-italic mb-3">{t.guideSub}</p>
        {t.chapters.map((chapter, i) => (
          <ChapterToggle key={i} chapter={chapter} index={i} />
        ))}
      </section>

      {/* In caso di truffa */}
      <section className="prenotazione-sicura__scam">
        <h3 className="prenotazione-sicura__scam-title">
          <Icon name="exclamation-octagon-fill" className="me-1" />
          {t.scamTitle}
        </h3>
        <ol className="ps-4 d-flex flex-column gap-2 mb-0 prenotazione-sicura__scam-list">
          {t.scamSteps.map((step, i) => (
            <li key={i} className="small">{step}</li>
          ))}
        </ol>
      </section>

      {/* CTA finale */}
      <section className="text-center">
        <a href={bookHref} className="cta-book">{t.ctaBook}</a>
        <p className="small text-muted mt-2 mb-0">{t.ctaBookSub}</p>
      </section>

    </div>
  );
}
