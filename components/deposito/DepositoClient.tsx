'use client';
import { useState } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';


// ─── Componente step ────────────────────────────────────────────────────────
function StepCard({ n, text }: { n: number; text: string }) {
  return (
    <div className="step-circle">
      <div className="step-circle__num">{n}</div>
      <p className="step-circle__text">{text}</p>
    </div>
  );
}

// ─── Componente FAQ ─────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-simple ${open ? 'is-open' : ''}`}>
      <button onClick={() => setOpen(!open)} className="faq-simple__btn">
        <span className="faq-simple__q">{q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          strokeWidth="2.5"
          className="faq-simple__chevron">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && <p className="faq-simple__a">{a}</p>}
    </div>
  );
}

// ─── Componente principale ──────────────────────────────────────────────────
interface Props { locale: Locale; contactHref: string; portalHref: string; }

export default function DepositoClient({ locale, contactHref, portalHref }: Props) {
  const t = getTranslations(locale).components.depositoClient;

  return (
    <div className="page-container page-top pb-5">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="bg-white px-3 pb-3 border-bottom mb-2">
        <div className="page-hero-badge page-hero-badge--warning">
          <i className="bi bi-credit-card-fill me-1" aria-hidden="true" />
          {t.badge}
        </div>
        <h1 className="fs-2 fw-bold text-dark mb-2 prenotazione-sicura__hero-title">
          {t.title}
        </h1>
        <p className="m-0 text-secondary prenotazione-sicura__hero-sub">{t.subtitle}</p>
      </div>

      {/* ── Perché ──────────────────────────────────────────────────────────── */}
      <div className="page-section-white">
        <h2 className="page-section-white__title">{t.whyTitle}</h2>
        <p className="page-section-white__text">{t.whyText}</p>
      </div>

      {/* ── Due metodi ──────────────────────────────────────────────────────── */}
      <div className="deposito__methods-grid">

        {/* Offline */}
        <div className="page-section-white">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-building section-header__icon" aria-hidden="true" />
            <h2 className="page-section-white__title m-0">{t.offlineTitle}</h2>
          </div>
          {t.offlineSteps.map((step, i) => (
            <StepCard key={i} n={i + 1} text={step} />
          ))}
          <p className="mt-3 mb-0 text-muted utenze__pill-text">
            <i className="bi bi-info-circle-fill me-1" aria-hidden="true" />
            {t.offlineNote}
          </p>
        </div>

        {/* Online */}
        <div className="deposito__box-online">
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="bi bi-lock-fill section-header__icon" aria-hidden="true" />
            <h2 className="deposito__box-online-title">{t.onlineTitle}</h2>
          </div>
          <div className="deposito__box-online-badge">{t.onlineBadge}</div>
          {t.onlineSteps.map((step, i) => (
            <StepCard key={i} n={i + 1} text={step} />
          ))}
          <p className="deposito__box-online-note">
            <i className="bi bi-shield-lock-fill me-1" aria-hidden="true" />
            {t.onlineNote}
          </p>
        </div>

      </div>

      {/* ── Importi ─────────────────────────────────────────────────────────── */}
      <div className="page-section-white">
        <h2 className="page-section-white__title">{t.amountsTitle}</h2>
        <p className="text-muted mb-3 utenze__pill-text">{t.amountsNote}</p>
        <div className="d-flex flex-column">
          {t.amounts.map((row, i) => (
            <div key={i} className="deposito__amounts-row">
              <span className="deposito__amounts-label">{row.label}</span>
              <span className="deposito__amounts-value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Restituzione ────────────────────────────────────────────────────── */}
      <div className="page-section-white">
        <h2 className="page-section-white__title">{t.returnTitle}</h2>
        {t.returnSteps.map((step, i) => (
          <StepCard key={i} n={i + 1} text={step} />
        ))}
      </div>

      {/* ── Danni ───────────────────────────────────────────────────────────── */}
      <div className="deposito__damages">
        <h2 className="deposito__damages-title">
          <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
          {t.damagesTitle}
        </h2>
        <p className="deposito__damages-text">{t.damagesText}</p>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <div className="page-section-white">
        <h2 className="page-section-white__title">{t.faqTitle}</h2>
        {t.faqs.map((f, i) => (
          <FaqItem key={i} {...f} />
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <div className="deposito__cta-box">
        <h2 className="deposito__cta-title">{t.ctaTitle}</h2>
        <p className="deposito__cta-text">{t.ctaText}</p>
        <a href={portalHref} className="deposito__cta-btn">{t.ctaBtn} →</a>
        <p className="deposito__cta-note">
          <i className="bi bi-info-circle me-1" aria-hidden="true" /> {t.ctaNote}
        </p>
      </div>

      {/* ── Link contatti ────────────────────────────────────────────────────── */}
      <div className="p-3 text-center">
        <a href={contactHref} className="deposito__contact-link">{t.questionsLink}</a>
      </div>

    </div>
  );
}
