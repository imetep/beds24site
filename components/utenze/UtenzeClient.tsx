'use client';
import { useState } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

type Season = 'winter' | 'summer';


function AccItem({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  const lines = text.split('\n');
  return (
    <div className="border-top">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="btn w-100 d-flex align-items-center justify-content-between gap-3 text-start px-3 py-3"
        style={{ minHeight: 56 }}
      >
        <span className="flex-fill fw-medium lh-base">{title}</span>
        <svg
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="#9ca3af" strokeWidth="2.5"
          style={{ flexShrink: 0, transition: 'transform 260ms ease', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className="px-3 small text-secondary"
        style={{
          overflow: 'hidden',
          maxHeight: open ? 800 : 0,
          transition: 'max-height 280ms ease',
          lineHeight: 1.7,
          paddingBottom: open ? 18 : 0,
          paddingTop: open ? 4 : 0,
        }}
      >
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
    <div className="container pb-5" style={{ maxWidth: 720 }}>

      {/* Hero */}
      <div className="bg-white border-bottom p-3 mb-2">
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
        <div className="d-grid gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <RateCard label={t.elec} value={t.elecUnit} />
          <RateCard label={t.gas} value={t.gasUnit} />
          <RateCard label={t.water} value={t.waterUnit} />
        </div>
        <p className="small text-muted mb-0">{t.meterNote}</p>
      </div>

      {/* Toggle stagione */}
      <div className="bg-white p-3 mb-2">
        <p className="small fw-semibold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>
          {t.seasonLabel}
        </p>
        <div className="d-flex gap-2">
          <button
            onClick={() => setSeason('winter')}
            className={`btn flex-fill ${isWinter ? 'fw-semibold' : 'border'}`}
            style={{
              background: isWinter ? '#E6F1FB' : '#fff',
              color: isWinter ? '#0C447C' : '#6b7280',
            }}
          >
            {t.seasonWinter}
          </button>
          <button
            onClick={() => setSeason('summer')}
            className={`btn flex-fill ${!isWinter ? 'fw-semibold' : 'border'}`}
            style={{
              background: !isWinter ? '#FAEEDA' : '#fff',
              color: !isWinter ? '#633806' : '#6b7280',
            }}
          >
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
          <p className="text-secondary mb-3" style={{ lineHeight: 1.7 }}>
            {isWinter ? t.wIntroText : t.sIntroText}
          </p>

          {/* Box costi stimati */}
          <div
            className="rounded-3 p-3 mb-3 border"
            style={{
              background: isWinter ? '#FAEEDA' : '#FEF9C3',
              borderColor: isWinter ? '#FDE68A' : '#FDE047',
            }}
          >
            <p className="small fw-semibold mb-2" style={{ color: isWinter ? '#633806' : '#713f12' }}>
              {isWinter ? t.wCostLabel : t.sCostLabel}
            </p>
            <div className="d-flex flex-column gap-1">
              <div className="d-flex justify-content-between align-items-center gap-2">
                <span className="small" style={{ color: isWinter ? '#854F0B' : '#713f12' }}>
                  {isWinter ? t.wCostCareful : t.sCostCareful}
                </span>
                <span className="fw-bold text-nowrap" style={{ color: isWinter ? '#633806' : '#713f12' }}>
                  {isWinter ? t.wCostCarefulVal : t.sCostCarefulVal}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center gap-2">
                <span className="small" style={{ color: isWinter ? '#854F0B' : '#713f12' }}>
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
      <div className="bg-white mb-2 p-3 border-start border-4 border-primary">
        <p className="fs-6 fw-bold text-primary mb-2">{t.honestTitle}</p>
        <p className="text-secondary mb-3" style={{ lineHeight: 1.7 }}>
          {t.honestText}
        </p>
        <div className="bg-light border rounded p-3">
          <p className="small text-secondary mb-0" style={{ lineHeight: 1.7 }}>
            ⚠️{' '}
            {t.honestCaution.split('\n').map((line, i) => (
              <span key={i}>{line}{i < t.honestCaution.split('\n').length - 1 && <br />}</span>
            ))}
          </p>
        </div>
      </div>

    </div>
  );
}
