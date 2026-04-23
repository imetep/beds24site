'use client';
import { useState } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';


// ─── Componente step ────────────────────────────────────────────────────────
function StepCard({ n, text }: { n: number; text: string }) {
  return (
    <div className="d-flex gap-3 py-3 border-bottom">
      <div
        className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
        style={{ width: 28, height: 28, background: 'var(--color-primary)', fontSize: 13, marginTop: 2 }}
      >
        {n}
      </div>
      <p className="m-0 small text-secondary" style={{ lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

// ─── Componente FAQ ─────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-bottom">
      <button
        onClick={() => setOpen(!open)}
        className="btn w-100 d-flex justify-content-between align-items-center gap-2 py-3 px-0 text-start"
      >
        <span className="small fw-semibold text-dark" style={{ lineHeight: 1.4 }}>{q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#9ca3af" strokeWidth="2.5"
          className="flex-shrink-0"
          style={{ transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <p className="small text-secondary mb-3" style={{ lineHeight: 1.65 }}>{a}</p>
      )}
    </div>
  );
}

// ─── Componente principale ──────────────────────────────────────────────────
interface Props { locale: Locale; contactHref: string; portalHref: string; }

export default function DepositoClient({ locale, contactHref, portalHref }: Props) {
  const t = getTranslations(locale).components.depositoClient;

  return (
    <div className="page-container pb-5">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="bg-white px-3 pt-4 pb-3 border-bottom mb-2">
        <div
          className="d-inline-block mb-2 fw-bold rounded-pill"
          style={{ background: '#FFF8E7', color: '#92400e', fontSize: 12, padding: '4px 12px' }}
        >
          💳 {t.badge}
        </div>
        <h1 className="fs-2 fw-bold text-dark mb-2" style={{ lineHeight: 1.2 }}>
          {t.title}
        </h1>
        <p className="m-0 text-secondary" style={{ fontSize: 15, lineHeight: 1.55 }}>
          {t.subtitle}
        </p>
      </div>

      {/* ── Perché ──────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 mb-2">
        <h2 className="fs-6 fw-bold text-dark mb-2">
          {t.whyTitle}
        </h2>
        <p className="m-0 small text-secondary" style={{ lineHeight: 1.7 }}>
          {t.whyText}
        </p>
      </div>

      {/* ── Due metodi ──────────────────────────────────────────────────────── */}
      <div className="d-grid gap-2 pb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

        {/* Offline */}
        <div className="bg-white p-3">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ fontSize: 20 }}>🏨</span>
            <h2 className="fs-6 fw-bold text-dark m-0">{t.offlineTitle}</h2>
          </div>
          {t.offlineSteps.map((step, i) => (
            <StepCard key={i} n={i + 1} text={step} />
          ))}
          <p className="mt-3 mb-0 text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            ℹ️ {t.offlineNote}
          </p>
        </div>

        {/* Online */}
        <div className="p-3 border-top border-2" style={{ background: '#EEF5FC', borderColor: 'var(--color-primary)' }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ fontSize: 20 }}>🔒</span>
            <h2 className="fs-6 fw-bold m-0" style={{ color: '#0C447C' }}>{t.onlineTitle}</h2>
          </div>
          <div
            className="d-inline-block mb-2 fw-bold text-white rounded-pill"
            style={{ background: 'var(--color-primary)', fontSize: 10, padding: '3px 8px' }}
          >
            {t.onlineBadge}
          </div>
          {t.onlineSteps.map((step, i) => (
            <StepCard key={i} n={i + 1} text={step} />
          ))}
          <p className="mt-3 mb-0" style={{ fontSize: 12, color: '#185FA5', lineHeight: 1.5 }}>
            🔐 {t.onlineNote}
          </p>
        </div>

      </div>

      {/* ── Importi ─────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 mb-2">
        <h2 className="fs-6 fw-bold text-dark mb-2">
          {t.amountsTitle}
        </h2>
        <p className="text-muted mb-3" style={{ fontSize: 13 }}>{t.amountsNote}</p>
        <div className="d-flex flex-column">
          {t.amounts.map((row, i) => (
            <div
              key={i}
              className={`d-flex justify-content-between align-items-center py-2${i < t.amounts.length - 1 ? ' border-bottom' : ''}`}
            >
              <span className="small" style={{ color: '#374151' }}>{row.label}</span>
              <span className="fw-bold" style={{ fontSize: 15, color: 'var(--color-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Restituzione ────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 mb-2">
        <h2 className="fs-6 fw-bold text-dark mb-1">
          {t.returnTitle}
        </h2>
        {t.returnSteps.map((step, i) => (
          <StepCard key={i} n={i + 1} text={step} />
        ))}
      </div>

      {/* ── Danni ───────────────────────────────────────────────────────────── */}
      <div className="border p-3 mb-2" style={{ background: '#FFF8E7', borderColor: '#FDE68A' }}>
        <h2 className="fs-6 fw-bold mb-2" style={{ color: '#92400e' }}>
          ⚠️ {t.damagesTitle}
        </h2>
        <p className="m-0 small" style={{ color: '#78350f', lineHeight: 1.7 }}>
          {t.damagesText}
        </p>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 mb-2">
        <h2 className="fs-6 fw-bold text-dark mb-1">
          {t.faqTitle}
        </h2>
        {t.faqs.map((f, i) => (
          <FaqItem key={i} {...f} />
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <div className="p-3 mb-2 border-top border-2" style={{ background: '#EEF5FC', borderColor: 'var(--color-primary)' }}>
        <h2 className="fs-5 fw-bold mb-2" style={{ color: '#0C447C' }}>
          {t.ctaTitle}
        </h2>
        <p className="small mb-3" style={{ color: '#185FA5', lineHeight: 1.6 }}>
          {t.ctaText}
        </p>
        <a
          href={portalHref}
          className="d-inline-block text-white fw-bold text-decoration-none rounded-3 mb-2"
          style={{ background: 'var(--color-primary)', padding: '13px 24px', fontSize: 15 }}
        >
          {t.ctaBtn} →
        </a>
        <p className="mb-0" style={{ fontSize: 12, color: '#185FA5' }}>
          ℹ️ {t.ctaNote}
        </p>
      </div>

      {/* ── Link contatti ────────────────────────────────────────────────────── */}
      <div className="p-3 text-center">
        <a href={contactHref} className="small text-decoration-none" style={{ color: 'var(--color-primary)' }}>
          {t.questionsLink}
        </a>
      </div>

    </div>
  );
}
