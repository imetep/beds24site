'use client';
import { useState } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

type Season = 'winter' | 'summer';


function AccItem({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  const lines = text.split('\n');
  return (
    <div className={`utenze__acc-item ${open ? 'is-open' : ''}`}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="utenze__acc-btn"
      >
        <span className="flex-fill fw-medium lh-base">{title}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="utenze__acc-chevron">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="utenze__acc-body">
        {lines.map((line, i) => (
          <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-light border rounded-3 p-2">
      <p className="small text-muted mb-1">{label}</p>
      <p className="fs-5 fw-bold mb-0">{value}</p>
    </div>
  );
}

interface Props { locale: Locale; }

export default function UtenzeClient({ locale }: Props) {
  const t = getTranslations(locale).components.utenzeClient;
  const [season, setSeason] = useState<Season>('winter');

  const isWinter = season === 'winter';

  return (
    <div className="page-container page-top pb-5">

      {/* Hero */}
      <div className="bg-white border-bottom px-3 pb-3 mb-2">
        <h1 className="fs-2 fw-bold mb-2">{t.pageTitle}</h1>
        <p className="text-secondary mb-0">{t.pageSubtitle}</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-white border-bottom p-3 mb-2">
        <p className="small text-secondary mb-0">{t.disclaimer}</p>
      </div>

      {/* Tariffe */}
      <div className="bg-white p-3 mb-2">
        <p className="small fw-semibold text-secondary mb-2">{t.ratesTitle}</p>
        <div className="utenze__rates-grid">
          <RateCard label={t.elec} value={t.elecUnit} />
          <RateCard label={t.gas} value={t.gasUnit} />
          <RateCard label={t.water} value={t.waterUnit} />
        </div>
        <p className="small text-muted mb-0">{t.meterNote}</p>
      </div>

      {/* Toggle stagione */}
      <div className="bg-white p-3 mb-2">
        <p className="small fw-semibold text-muted text-uppercase mb-2 utenze__season-label">{t.seasonLabel}</p>
        <div className="d-flex gap-2">
          <button
            onClick={() => setSeason('winter')}
            className={`btn utenze__season-btn ${isWinter ? 'fw-semibold utenze__season-btn--winter' : 'border utenze__season-btn--inactive'}`}
          >
            <i className="bi bi-snow me-1" aria-hidden="true" />
            {t.seasonWinter}
          </button>
          <button
            onClick={() => setSeason('summer')}
            className={`btn utenze__season-btn ${!isWinter ? 'fw-semibold utenze__season-btn--summer' : 'border utenze__season-btn--inactive'}`}
          >
            <i className="bi bi-sun-fill me-1" aria-hidden="true" />
            {t.seasonSummer}
          </button>
        </div>
      </div>

      {/* Contenuto stagionale */}
      <div className="bg-white mb-2">
        <div className="p-3">
          <h2 className="fs-5 fw-bold mb-2">
            {isWinter ? t.wIntroTitle : t.sIntroTitle}
          </h2>
          <p className="text-secondary mb-3 utenze__intro-text">
            {isWinter ? t.wIntroText : t.sIntroText}
          </p>

          {/* Box costi stimati */}
          <div className={`utenze__cost-box ${isWinter ? 'utenze__cost-box--winter' : 'utenze__cost-box--summer'}`}>
            <p className={`small fw-semibold mb-2 ${isWinter ? 'utenze__cost-label--winter' : 'utenze__cost-label--summer'}`}>
              {isWinter ? t.wCostLabel : t.sCostLabel}
            </p>
            <div className="d-flex flex-column gap-1">
              <div className="d-flex justify-content-between align-items-center gap-2">
                <span className={`small ${isWinter ? 'utenze__cost-text--winter' : 'utenze__cost-text--summer'}`}>
                  {isWinter ? t.wCostCareful : t.sCostCareful}
                </span>
                <span className={`fw-bold text-nowrap ${isWinter ? 'utenze__cost-label--winter' : 'utenze__cost-label--summer'}`}>
                  {isWinter ? t.wCostCarefulVal : t.sCostCarefulVal}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center gap-2">
                <span className={`small ${isWinter ? 'utenze__cost-text--winter' : 'utenze__cost-text--summer'}`}>
                  {isWinter ? t.wCostIntense : t.sCostIntense}
                </span>
                <span className="fw-bold text-nowrap text-danger">
                  {isWinter ? t.wCostIntenseVal : t.sCostIntenseVal}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Accordion dettagli */}
        {isWinter ? (
          <>
            <AccItem title={t.wAcc1Title} text={t.wAcc1Text} />
            <AccItem title={t.wAcc2Title} text={t.wAcc2Text} />
            <AccItem title={t.wAcc3Title} text={t.wAcc3Text} />
          </>
        ) : (
          <>
            <AccItem title={t.sAcc1Title} text={t.sAcc1Text} />
            <AccItem title={t.sAcc2Title} text={t.sAcc2Text} />
            <AccItem title={t.sAcc3Title} text={t.sAcc3Text} />
          </>
        )}
      </div>

      {/* Consiglio onesto */}
      <div className="utenze__honest-section">
        <p className="fs-6 fw-bold text-primary mb-2">{t.honestTitle}</p>
        <p className="text-secondary mb-3 utenze__honest-text">{t.honestText}</p>
        <div className="bg-light border rounded p-3">
          <p className="small text-secondary mb-0 utenze__honest-caution">
            <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
            {t.honestCaution.split('\n').map((line, i) => (
              <span key={i}>{line}{i < t.honestCaution.split('\n').length - 1 && <br />}</span>
            ))}
          </p>
        </div>
      </div>

    </div>
  );
}
