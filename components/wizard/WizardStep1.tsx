'use client';

import { useWizardStore } from '@/store/wizard-store';
import { getRoomById } from '@/config/properties';

interface Props {
  translations: {
    step1: {
      title: string;
      subtitle?: string;
      adults: string;
      adultsAge: string;
      children: string;
      childrenAge: string;
      next: string;
    };
  };
  roomId?: number | null; // passato da Wizard.tsx
}

const OVER_CAPACITY: Record<string, string> = {
  it: (max: number) => `⚠️ Questo appartamento ospita massimo ${max} persone.`,
  en: (max: number) => `⚠️ This apartment accommodates a maximum of ${max} people.`,
  de: (max: number) => `⚠️ Diese Unterkunft bietet Platz für maximal ${max} Personen.`,
  pl: (max: number) => `⚠️ Ten apartament mieści maksymalnie ${max} osób.`,
} as any;

export default function WizardStep1({
  translations: t,
  roomId,
  locale = 'it',
}: Props & { locale?: string }) {
  const { numAdult, numChild, setNumAdult, setNumChild, nextStep } = useWizardStore();

  const room = roomId ? getRoomById(roomId) : null;
  const maxPeople = room?.maxPeople ?? null;
  const total = numAdult + numChild;
  const overCapacity = maxPeople !== null && total > maxPeople;

  const msgFn = OVER_CAPACITY[locale] ?? OVER_CAPACITY.it;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 0.2rem' }}>
        {t.step1.title}
      </h2>

      {/* Nome appartamento se noto */}
      {room && (
        <p style={{ fontSize: '0.85rem', color: '#1E73BE', margin: '0 0 1rem', fontWeight: 600 }}>
          🏠 {room.name} · max {room.maxPeople} persone
        </p>
      )}

      {!room && t.step1.subtitle && (
        <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 1.5rem' }}>
          {t.step1.subtitle}
        </p>
      )}

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

      {/* Warning capienza */}
      {overCapacity && (
        <div style={{
          marginTop: '1rem',
          padding: '10px 14px',
          background: '#fff8e1',
          border: '1px solid #FCAF1A',
          borderRadius: 10,
          fontSize: '0.875rem',
          color: '#b45309',
        }}>
          {msgFn(maxPeople!)}
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: '1.5rem', paddingTop: 0 }}>
        <button
          onClick={nextStep}
          disabled={overCapacity}
          style={{
            width: '100%', padding: '0.9rem',
            background: overCapacity ? '#e5e7eb' : '#FCAF1A',
            color: overCapacity ? '#aaa' : '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '1rem', fontWeight: 600,
            cursor: overCapacity ? 'not-allowed' : 'pointer',
          }}
        >
          {t.step1.next} →
        </button>
      </div>
    </div>
  );
}

function Counter({ value, onDecrement, onIncrement, min }: {
  value: number; onDecrement: () => void; onIncrement: () => void; min: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button onClick={onDecrement} disabled={value <= min} style={cntBtnStyle(value <= min)}>−</button>
      <span style={{ fontSize: '1.1rem', fontWeight: 600, minWidth: '1.2rem', textAlign: 'center' }}>{value}</span>
      <button onClick={onIncrement} style={cntBtnStyle(false)}>+</button>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0.65rem 0', borderBottom: '1px solid #eee',
};
const labelStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 500 };
const subStyle: React.CSSProperties = { fontSize: '0.8rem', color: '#888', marginTop: '2px' };
const cntBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '32px', height: '32px', borderRadius: '50%',
  border: '1px solid #ccc',
  background: disabled ? '#f5f5f5' : '#fff',
  color: disabled ? '#ccc' : '#333',
  fontSize: '1.1rem', cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});
