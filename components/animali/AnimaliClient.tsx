'use client';

import { Icon } from '@/components/ui/Icon';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

export default function AnimaliClient({ locale }: { locale: Locale }) {
  const t = getTranslations(locale).components.animali;
  const rates = [
    { nights: '1 – 3', price: t.rate1to3 },
    { nights: '4 – 7', price: t.rate4to7 },
    { nights: '8+',    price: t.rate8plus },
  ];

  return (
    <div className="page-container page-top pb-5">

      {/* Hero */}
      <section className="text-center pb-5">
        <div className="mb-2 text-primary">
          <Icon name="heart-fill" size={72} />
        </div>
        <h1 className="fw-bold text-primary mb-2 animali__hero-title">{t.heroTitle}</h1>
        <p className="text-secondary mx-auto mb-2 animali__hero-text">{t.heroSub}</p>
        <p className="text-muted fst-italic mx-auto small animali__hero-text">{t.legalNote}</p>
      </section>

      {/* 3 Sezioni card */}
      <div className="d-flex flex-column gap-4 mb-5">

        {/* Card 1 — Quali animali */}
        <div className="card">
          <div className="card-body p-4">
            <h2 className="fw-semibold text-primary fs-5 mb-3">
              <Icon name="check-circle-fill" className="me-2" />
              {t.s1Title}
            </h2>
            <div className="mb-2">
              <span className="badge rounded-pill bg-warning text-dark fw-bold">{t.maxLabel}</span>
            </div>
            <ul className="ps-3 mb-0">
              {t.s1Items.map((item, i) => (
                <li key={i} className="mb-2 text-secondary lh-base">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card 2 — Comportamento */}
        <div className="card">
          <div className="card-body p-4">
            <h2 className="fw-semibold text-primary fs-5 mb-3">
              <Icon name="clipboard-fill" className="me-2" />
              {t.s2Title}
            </h2>
            <ul className="ps-3 mb-0">
              {t.s2Items.map((item, i) => (
                <li key={i} className="mb-2 text-secondary lh-base">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card 3 — Deposito */}
        <div className="card border-primary animali__deposit-card">
          <div className="card-body p-4">
            <h2 className="fw-semibold text-primary fs-5 mb-3">
              <Icon name="credit-card-fill" className="me-2" />
              {t.s3Title}
            </h2>
            <p className="text-secondary lh-base mb-2">
              {t.s3Text}
            </p>
            <a
              href={`/${locale}/deposito`}
              target="_blank"
              rel="noopener noreferrer"
              className="d-inline-block fw-semibold text-primary text-decoration-none small mt-2"
            >
              {t.s3Link}
            </a>
          </div>
        </div>

      </div>

      {/* Tabella tariffe */}
      <section className="mb-5">
        <h2 className="fw-bold text-primary fs-4 mb-2">{t.ratesTitle}</h2>
        <p className="text-secondary mb-3">
          {t.ratesNote}
        </p>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th className="bg-primary text-white fw-semibold">{t.nightsLabel}</th>
                <th className="bg-primary text-white fw-semibold">{t.priceLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'table-light' : ''}>
                  <td className="text-secondary">
                    <Icon name="moon-stars-fill" className="me-1" />
                    {row.nights} {t.nightsUnit}
                  </td>
                  <td className="fw-semibold text-primary">{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Firma */}
      <section className="bg-light border rounded-3 p-4 mb-4">
        <h3 className="fs-6 text-secondary mb-2">
          <Icon name="pencil-fill" className="me-2" />
          {t.signTitle}
        </h3>
        <p className="small text-secondary lh-base mb-0">
          {t.signText}
        </p>
        <div className="d-flex gap-4 align-items-end border-top mt-4 pt-3">
          <div className="flex-fill">
            <p className="small text-muted mb-0">{t.signDate}</p>
            <div className="border-bottom animali__sign-line" />
          </div>
          <div className="animali__sign-firma">
            <p className="small text-muted mb-0">{t.signSignature}</p>
            <div className="border-bottom animali__sign-line" />
          </div>
        </div>
      </section>

    </div>
  );
}
