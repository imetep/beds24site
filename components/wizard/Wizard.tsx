'use client';

import { useWizardStore } from '@/store/wizard-store';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';
import WizardStep4 from './WizardStep4';
import WizardStep5 from './WizardStep5';

interface Props {
  translations: any;
}

export default function Wizard({ translations: t }: Props) {
  const { currentStep } = useWizardStore();

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
        {currentStep === 2 && <WizardStep2 translations={t.wizard} />}
        {currentStep === 3 && <WizardStep3 />}
        {currentStep === 4 && <WizardStep4 />}
        {currentStep === 5 && <WizardStep5 />}
        {currentStep === 6 && <StepPlaceholder label="Step 6 — Riepilogo e prezzo" />}
      </div>

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
  background: '#1E73BE',
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
