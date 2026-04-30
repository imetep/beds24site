'use client';
import { CIN, CIR } from '@/config/properties';
import { useState } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';
import { Icon } from '@/components/ui/Icon';

interface Props {
  locale: string;
  checkInStart: string;
  checkInEnd: string;
  checkOutEnd: string;
  securityDeposit: number;
}

// URL routing locale-dependent (slug non-traducibili — alcuni cambiano nome per locale).
// depositHref è uniforme (/{locale}/deposito), energyHref cambia slug.
const ENERGY_HREFS: Record<string, string> = {
  it: '/it/utenze',
  en: '/en/utilities',
  de: '/de/energie',
  pl: '/pl/media',
};

export default function ThingsToKnow({ locale, checkInStart, checkInEnd, checkOutEnd, securityDeposit }: Props) {
  const [open, setOpen] = useState(false);
  const ui = getTranslations(locale as Locale).components.thingsToKnow;
  const depositHref = `/${locale}/deposito`;
  const energyHref  = ENERGY_HREFS[locale] ?? ENERGY_HREFS.it;

  return (
    <div className="things-to-know">

      {/* Header primary-colored — UX 3.7 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="things-to-know__header"
        aria-expanded={open}
      >
        <span>
          <Icon name="info-circle-fill" className="me-2" />{ui.title}
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} />
      </button>

      {/* Contenuto espandibile */}
      {open && (
        <div className="things-to-know__body">

          {/* Check-in/out */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2"><Icon name="clock" className="me-1" /> {ui.checkInTitle}</div>
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">{ui.checkIn}</span>
              <span className="fw-semibold">{checkInStart} – {checkInEnd}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span className="text-muted">{ui.checkOut}</span>
              <span className="fw-semibold">{ui.within} {checkOutEnd}</span>
            </div>
          </div>

          {/* Deposito */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2">
              <Icon name="shield-lock-fill" className="me-1" /> {ui.depositTitle}: €{securityDeposit}
            </div>
            <p className="small text-secondary mb-1">{ui.depositText}</p>
            <a href={depositHref} target="_blank" rel="noopener noreferrer" className="small text-primary text-decoration-none">{ui.depositLink}</a>
          </div>

          {/* Consumi */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2">
              <Icon name="lightning-fill" className="me-1" /> {ui.energyTitle}
            </div>
            <p className="small text-secondary mb-1">{ui.energyText}</p>
            <a href={energyHref} target="_blank" rel="noopener noreferrer" className="small text-primary text-decoration-none">{ui.energyLink}</a>
          </div>

          {/* Imposta di soggiorno */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2">
              <Icon name="bank2" className="me-1" /> {ui.taxTitle}
            </div>
            <p className="small text-secondary mb-0">{ui.taxText}</p>
          </div>

          {/* Regole */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2">
              <Icon name="card-list" className="me-1" /> {ui.rulesTitle}
            </div>
            <div className="small text-secondary">
              <Icon name="x-circle" className="me-1" />
              {ui.noPets}
            </div>
            <div className="small text-secondary">
              <Icon name="x-circle" className="me-1" />
              {ui.noSmoking}
            </div>
          </div>

          {/* CIN / CIR */}
          <div className="bg-light rounded-3 px-3 py-2 small fw-semibold text-secondary">
            CIN {CIN} &nbsp;·&nbsp; CIR {CIR}
          </div>

        </div>
      )}
    </div>
  );
}
