/**
 * Stepper — indicatore di avanzamento multi-step.
 *
 * Usato nei wizard (prenota, self-checkin). Stile in globals.css (.ui-stepper-*).
 *
 * Spec: docs/ux/wizard-layout.md §5 (D1 ratificata — label sempre visibili).
 *
 * Esempio:
 *   <Stepper
 *     steps={[{ label: 'Scegli' }, { label: 'Ospite' }, { label: 'Paga' }]}
 *     current={2}
 *     onGoBack={(step) => setCurrentStep(step)}
 *   />
 */

import { Icon } from '@/components/ui/Icon';

interface Step {
  label: string;
}

interface Props {
  steps: Step[];
  /** Step corrente, 1-based */
  current: number;
  /** Callback quando l'utente clicca su uno step completato (torna indietro). Se omesso, gli step completati non sono cliccabili. */
  onGoBack?: (step: number) => void;
  /** aria-label del nav wrapper */
  ariaLabel?: string;
}

export default function Stepper({ steps, current, onGoBack, ariaLabel = 'Progresso' }: Props) {
  return (
    <nav className="ui-stepper" aria-label={ariaLabel}>
      <ol className="ui-stepper-list">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const status: 'done' | 'current' | 'future' =
            stepNum < current ? 'done' : stepNum === current ? 'current' : 'future';
          const isClickable = status === 'done' && !!onGoBack;

          const content = (
            <>
              <span className="ui-stepper-dot" aria-hidden="true">
                {status === 'done' ? <Icon name="check" /> : stepNum}
              </span>
              <span className="ui-stepper-label">{step.label}</span>
            </>
          );

          return (
            <li key={stepNum} className={`ui-stepper-item is-${status}`}>
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onGoBack!(stepNum)}
                  className="ui-stepper-btn"
                  aria-label={`Torna a ${step.label}`}
                >
                  {content}
                </button>
              ) : (
                <div
                  className="ui-stepper-inner"
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
