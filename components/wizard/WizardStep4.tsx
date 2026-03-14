'use client';

import { useWizardStore } from '@/store/wizard-store';

const LABELS: Record<string, Record<string, string>> = {
  it: {
    title: 'Quanti ospiti hanno meno di 12 anni?',
    info: "Gli ospiti sotto i 12 anni sono esenti dall'Imposta di Soggiorno (€2,00 a persona al giorno per i primi 10 giorni).",
    under12: 'Ospiti under 12',
    of: 'su',
    adults: 'adulti',
    continua: 'Continua →',
    indietro: '← Indietro',
    stepOf: 'Step 4 di 6',
  },
  en: {
    title: 'How many guests are under 12 years old?',
    info: 'Guests under 12 are exempt from the Tourist Tax (€2.00 per person per day for the first 10 nights).',
    under12: 'Guests under 12',
    of: 'of',
    adults: 'adults',
    continua: 'Continue →',
    indietro: '← Back',
    stepOf: 'Step 4 of 6',
  },
  de: {
    title: 'Wie viele Gäste sind unter 12 Jahre alt?',
    info: 'Gäste unter 12 Jahren sind von der Kurtaxe befreit (€2,00 pro Person pro Tag für die ersten 10 Nächte).',
    under12: 'Gäste unter 12',
    of: 'von',
    adults: 'Erwachsenen',
    continua: 'Weiter →',
    indietro: '← Zurück',
    stepOf: 'Schritt 4 von 6',
  },
  pl: {
    title: 'Ile osób ma mniej niż 12 lat?',
    info: 'Goście poniżej 12 lat są zwolnieni z opłaty turystycznej (€2,00 za osobę za dobę przez pierwsze 10 nocy).',
    under12: 'Goście poniżej 12 lat',
    of: 'z',
    adults: 'dorosłych',
    continua: 'Dalej →',
    indietro: '← Wstecz',
    stepOf: 'Krok 4 z 6',
  },
};

interface Props {
  locale?: string;
}

export default function WizardStep5({ locale = 'it' }: Props) {
  const t = LABELS[locale] ?? LABELS.it;
  const { numAdult, numUnder12, setNumUnder12, nextStep, prevStep } = useWizardStore();

  return (
    <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif' }}>

      {/* Step indicator */}
      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.stepOf}</div>

      {/* Titolo */}
      <h2 style={{ color: '#1E73BE', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        {t.title}
      </h2>

      {/* Contatore */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderRadius: 12,
        border: '2px solid #e0e0e0',
        background: '#fff',
        marginBottom: 24,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#222' }}>{t.under12}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
            {numUnder12} {t.of} {numAdult} {t.adults}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setNumUnder12(numUnder12 - 1)}
            disabled={numUnder12 <= 0}
            style={counterBtnStyle(numUnder12 <= 0)}
          >
            −
          </button>
          <span style={{ fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
            {numUnder12}
          </span>
          <button
            onClick={() => setNumUnder12(numUnder12 + 1)}
            disabled={numUnder12 >= numAdult}
            style={counterBtnStyle(numUnder12 >= numAdult)}
          >
            +
          </button>
        </div>
      </div>

      {/* Box informativo */}
      <div style={{
        background: '#EEF5FC',
        border: '1px solid #1E73BE',
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 14,
        color: '#1E73BE',
        marginBottom: 32,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
        <span>{t.info}</span>
      </div>

      {/* Continua */}
      <button
        onClick={nextStep}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 12,
          border: 'none',
          background: '#FCAF1A',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        {t.continua}
      </button>

      {/* Indietro */}
      <button
        onClick={prevStep}
        style={{
          background: 'none',
          border: 'none',
          color: '#1E73BE',
          fontSize: 14,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {t.indietro}
      </button>

    </div>
  );
}

function counterBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: `2px solid ${disabled ? '#e0e0e0' : '#1E73BE'}`,
    background: '#fff',
    color: disabled ? '#ccc' : '#1E73BE',
    fontSize: 20,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };
}
