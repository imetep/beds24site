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
  roomId?: number | null;
  locale?: string;
}

const OVER_CAPACITY: Record<string, (max: number) => string> = {
  it: (max) => `⚠️ Questo appartamento ospita massimo ${max} persone.`,
  en: (max) => `⚠️ This apartment accommodates a maximum of ${max} people.`,
  de: (max) => `⚠️ Diese Unterkunft bietet Platz für maximal ${max} Personen.`,
  pl: (max) => `⚠️ Ten apartament mieści maksymalnie ${max} osób.`,
};

const AGE_LABEL: Record<string, (i: number) => string> = {
  it: (i) => `Età bambino ${i + 1} (obbligatoria)`,
  en: (i) => `Child ${i + 1} age (required)`,
  de: (i) => `Alter Kind ${i + 1} (erforderlich)`,
  pl: (i) => `Wiek dziecka ${i + 1} (wymagany)`,
};

const AGE_PLACEHOLDER: Record<string, string> = {
  it: 'Età (obbligatoria)',
  en: 'Age (required)',
  de: 'Alter (erforderlich)',
  pl: 'Wiek (wymagany)',
};

const AGE_NOTE: Record<string, string> = {
  it: 'Per trovare un alloggio con spazio per tutti e mostrarti i prezzi esatti, dobbiamo conoscere l\'età dei bambini.',
  en: 'To find an accommodation with space for everyone and show you exact prices, we need to know the children\'s ages.',
  de: 'Um eine Unterkunft mit Platz für alle zu finden und genaue Preise zu zeigen, benötigen wir das Alter der Kinder.',
  pl: 'Aby znaleźć nocleg z miejscem dla wszystkich i pokazać dokładne ceny, potrzebujemy znać wiek dzieci.',
};

export default function WizardStep1({
  translations: t,
  roomId,
  locale = 'it',
}: Props) {
  const {
    numAdult, numChild, childrenAges,
    setNumAdult, setNumChild, setChildAge,
    nextStep,
  } = useWizardStore();

  const room = roomId ? getRoomById(roomId) : null;
  const maxPeople = room?.maxPeople ?? null;
  const total = numAdult + numChild;
  const overCapacity = maxPeople !== null && total > maxPeople;

  // Tutte le età devono essere selezionate prima di poter continuare
  const allAgesSelected = numChild === 0 || (childrenAges.length === numChild && childrenAges.every(a => a >= 0));

  const canContinue = !overCapacity && allAgesSelected;

  const msgFn = OVER_CAPACITY[locale] ?? OVER_CAPACITY.it;
  const ageLabelFn = AGE_LABEL[locale] ?? AGE_LABEL.it;
  const agePlaceholder = AGE_PLACEHOLDER[locale] ?? AGE_PLACEHOLDER.it;
  const ageNote = AGE_NOTE[locale] ?? AGE_NOTE.it;

  // Genera opzioni età 0-17
  const ageOptions = Array.from({ length: 18 }, (_, i) => i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 0.2rem' }}>
        {t.step1.title}
      </h2>

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

      {/* Selettori età bambini — stile Booking.com */}
      {numChild > 0 && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px', lineHeight: 1.5 }}>
            {ageNote}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: numChild === 1 ? '1fr' : '1fr 1fr', gap: 10 }}>
            {Array.from({ length: numChild }, (_, i) => (
              <div key={i}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                  {ageLabelFn(i)}
                </label>
                <select
                  value={childrenAges[i] ?? -1}
                  onChange={e => setChildAge(i, Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: 14,
                    border: `1.5px solid ${(childrenAges[i] ?? -1) < 0 ? '#f97316' : '#e5e7eb'}`,
                    borderRadius: 8,
                    background: '#fff',
                    color: (childrenAges[i] ?? -1) < 0 ? '#9ca3af' : '#111',
                    outline: 'none',
                  }}
                >
                  <option value={-1}>{agePlaceholder}</option>
                  {ageOptions.map(age => (
                    <option key={age} value={age}>
                      {age === 0
                        ? (locale === 'it' ? '0 anni' : locale === 'de' ? '0 Jahre' : locale === 'pl' ? '0 lat' : '0 years')
                        : age === 1
                          ? (locale === 'it' ? '1 anno' : locale === 'de' ? '1 Jahr' : locale === 'pl' ? '1 rok' : '1 year')
                          : `${age} ${locale === 'it' ? 'anni' : locale === 'de' ? 'Jahre' : locale === 'pl' ? 'lata' : 'years'}`
                      }
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

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
      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={nextStep}
          disabled={!canContinue}
          style={{
            width: '100%', padding: '0.9rem',
            background: canContinue ? '#FCAF1A' : '#e5e7eb',
            color: canContinue ? '#fff' : '#aaa',
            border: 'none', borderRadius: '8px',
            fontSize: '1rem', fontWeight: 600,
            cursor: canContinue ? 'pointer' : 'not-allowed',
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
