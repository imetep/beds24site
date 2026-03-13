'use client';

import { useWizardStore } from '@/store/wizard-store';

interface Props {
  translations: {
    step1: {
      title: string;
      subtitle: string;
      adults: string;
      adultsAge: string;
      children: string;
      childrenAge: string;
      next: string;
    };
  };
}

export default function WizardStep1({ translations: t }: Props) {
  const { numAdult, numChild, setNumAdult, setNumChild, nextStep } = useWizardStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1 }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 0.4rem' }}>
        {t.step1.title}
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 1.5rem' }}>
        {t.step1.subtitle}
      </p>

      {/* Adulti */}
      <div style={rowStyle}>
        <div>
          <div style={labelStyle}>{t.step1.adults}</div>
          <div style={subStyle}>{t.step1.adultsAge}</div>
        </div>
        <Counter
          value={numAdult}
          onDecrement={() => setNumAdult(numAdult - 1)}
          onIncrement={() => setNumAdult(numAdult + 1)}
          min={1}
        />
      </div>

      {/* Bambini */}
      <div style={rowStyle}>
        <div>
          <div style={labelStyle}>{t.step1.children}</div>
          <div style={subStyle}>{t.step1.childrenAge}</div>
        </div>
        <Counter
          value={numChild}
          onDecrement={() => setNumChild(numChild - 1)}
          onIncrement={() => setNumChild(numChild + 1)}
          min={0}
        />
      </div>

      {/* CTA */}
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
        <button onClick={nextStep} style={btnStyle}>
          {t.step1.next} →
        </button>
      </div>
    </div>
  );
}

function Counter({
  value,
  onDecrement,
  onIncrement,
  min,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button
        onClick={onDecrement}
        disabled={value <= min}
        style={cntBtnStyle(value <= min)}
      >
        −
      </button>
      <span style={{ fontSize: '1.1rem', fontWeight: 600, minWidth: '1.2rem', textAlign: 'center' }}>
        {value}
      </span>
      <button onClick={onIncrement} style={cntBtnStyle(false)}>
        +
      </button>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 0',
  borderBottom: '1px solid #eee',
};

const labelStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 500,
};

const subStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#888',
  marginTop: '2px',
};

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem',
  background: '#FCAF1A',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const cntBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: '1px solid #ccc',
  background: disabled ? '#f5f5f5' : '#fff',
  color: disabled ? '#ccc' : '#333',
  fontSize: '1.1rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
