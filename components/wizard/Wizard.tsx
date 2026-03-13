'use client';

import { useWizardStore } from '@/store/wizard-store';
import WizardStep1 from './WizardStep1';

interface Props {
  translations: any;
}

const STEP_KEYS = [
  'step1', 'step2', 'step3', 'step4', 'step5', 'step6'
];

export default function Wizard({ translations: t }: Props) {
  const { currentStep, prevStep } = useWizardStore();

  return (
    <div style={containerStyle}>

      {/* Barra progresso */}
      <div style={progressBarBg}>
        <div style={{ ...progressBarFill, width: `${(currentStep / 6) * 100}%` }} />
      </div>

      {/* Label step */}
      <div style={stepLabelStyle}>
        {t.wizard?.stepOf?.replace('{current}', currentStep).replace('{total}', 6) ?? `Step ${currentStep} di 6`}
      </div>

      {/* Contenuto step */}
      <div style={bodyStyle}>
        {currentStep === 1 && <WizardStep1 translations={t.wizard} />}
        {currentStep === 2 && <StepPlaceholder label="Step 2 — Quando?" />}
        {currentStep === 3 && <StepPlaceholder label="Step 3 — Tipo alloggio" />}
        {currentStep === 4 && <StepPlaceholder label="Step 4 — Quale proprietà?" />}
        {currentStep === 5 && <StepPlaceholder label="Step 5 — Servizi extra" />}
        {currentStep === 6 && <StepPlaceholder label="Step 6 — Riepilogo" />}
      </div>

      {/* Pulsante indietro */}
      {currentStep > 1 && (
        <button onClick={prevStep} style={backBtnStyle}>
          ← {t.wizard?.back ?? 'Indietro'}
        </button>
      )}
    </div>
  );
}

function StepPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ padding: '2rem 0', color: '#aaa', textAlign: 'center', fontSize: '1rem' }}>
      {label} — in arrivo
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: '0 auto',
  padding: '1.5rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '520px',
};

const progressBarBg: React.CSSProperties = {
  height: '4px',
  background: '#eee',
  borderRadius: '2px',
  marginBottom: '0.5rem',
};

const progressBarFill: React.CSSProperties = {
  height: '4px',
  background: '#1D9E75',
  borderRadius: '2px',
  transition: 'width 0.3s ease',
};

const stepLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#999',
  marginBottom: '1.5rem',
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

const backBtnStyle: React.CSSProperties = {
  marginTop: '1rem',
  background: 'none',
  border: 'none',
  color: '#888',
  fontSize: '0.9rem',
  cursor: 'pointer',
  padding: '0.5rem 0',
  textAlign: 'left',
};
