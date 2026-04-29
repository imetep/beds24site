'use client';

/**
 * EditGuestsModal — modale inline (Round 2 sidebar) per modificare ospiti
 * Stepper Adulti + Bambini + età bambini. Si aggancia al wizard-store:
 * setNumAdult / setNumChild / setChildAge. Il fetch /api/offers in
 * WizardStep1 si rilancia automaticamente al cambio.
 *
 * Pattern semplificato di HomeSearch.GuestPanel (no inline style).
 */

import { useWizardStore } from '@/store/wizard-store';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

interface Props {
  locale: string;
  onClose: () => void;
}

export default function EditGuestsModal({ locale, onClose }: Props) {
  const tr = getTranslations(locale as Locale);
  const ui = tr.components.homeSearch.ui;

  const {
    numAdult, numChild, childrenAges,
    setNumAdult, setNumChild, setChildAge,
  } = useWizardStore();

  const ageLabel = locale === 'it' ? 'Età bambino' : locale === 'de' ? 'Alter Kind' : locale === 'pl' ? 'Wiek dziecka' : 'Child age';
  const agePlaceholder = locale === 'it' ? 'Seleziona età' : locale === 'de' ? 'Alter wählen' : locale === 'pl' ? 'Wybierz wiek' : 'Select age';
  const yearStr = locale === 'it' ? 'anni' : locale === 'de' ? 'Jahre' : locale === 'pl' ? 'lat' : 'years';

  const rows: { label: string; sub: string; val: number; set: (n: number) => void; min: number; max: number }[] = [
    { label: ui.adults, sub: ui.adultsAge, val: numAdult, set: setNumAdult, min: 1, max: 12 },
    { label: ui.children, sub: ui.childrenAge, val: numChild, set: setNumChild, min: 0, max: 8 },
  ];

  // Validazione: ospiti possono confermare solo se età bambini compilate
  const ageMissing = numChild > 0 && (childrenAges ?? []).slice(0, numChild).some((a: number) => a < 0);

  return (
    <>
      <div className="edit-modal__overlay" onClick={onClose} />
      <div className="edit-modal__panel" role="dialog" aria-label={ui.guests}>
        <div className="edit-modal__header">
          <h3 className="edit-modal__title">{ui.guests}</h3>
          <button type="button" className="edit-modal__close" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        <div className="edit-modal__body">
          {rows.map(({ label, sub, val, set, min, max }) => (
            <div key={label} className="edit-modal__stepper-row">
              <div className="edit-modal__stepper-info">
                <div className="edit-modal__stepper-label">{label}</div>
                <div className="edit-modal__stepper-sub">{sub}</div>
              </div>
              <div className="edit-modal__stepper-controls">
                <button
                  type="button"
                  onClick={() => set(val - 1)}
                  disabled={val <= min}
                  className="edit-modal__stepper-btn"
                  aria-label={`Riduci ${label}`}
                >−</button>
                <span className="edit-modal__stepper-value">{val}</span>
                <button
                  type="button"
                  onClick={() => set(val + 1)}
                  disabled={val >= max}
                  className="edit-modal__stepper-btn"
                  aria-label={`Aumenta ${label}`}
                >+</button>
              </div>
            </div>
          ))}

          {numChild > 0 && (
            <div className={`edit-modal__ages-grid${numChild === 1 ? ' is-single' : ''}`}>
              {Array.from({ length: numChild }, (_, i) => (
                <div key={i} className="edit-modal__age-cell">
                  <label className="edit-modal__age-label" htmlFor={`child-age-${i}`}>
                    {ageLabel} {i + 1}
                  </label>
                  <select
                    id={`child-age-${i}`}
                    value={childrenAges[i] ?? -1}
                    onChange={(e) => setChildAge(i, Number(e.target.value))}
                    className={`edit-modal__age-select${(childrenAges[i] ?? -1) < 0 ? ' is-error' : ''}`}
                  >
                    <option value={-1}>{agePlaceholder}</option>
                    {Array.from({ length: 18 }, (_, age) => (
                      <option key={age} value={age}>{age} {yearStr}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="edit-modal__footer">
          <span /> {/* spacer (no Cancel here, è already 1 adult min) */}
          <button
            type="button"
            className="btn btn--primary edit-modal__btn-primary"
            onClick={onClose}
            disabled={ageMissing}
          >
            {ui.done}
          </button>
        </div>
      </div>
    </>
  );
}
