'use client';

import { useWizardStore } from '@/store/wizard-store';
import { getAvailableRooms, allRoomsAreBeach } from '@/config/properties';
import type { PoolType } from '@/config/properties';

const POOL_OPTIONS: { value: PoolType; labelKey: string; icon: string }[] = [
  { value: 'none',    labelKey: 'none',    icon: '🏖️' },
  { value: 'private', labelKey: 'private', icon: '🏊' },
  { value: 'shared',  labelKey: 'shared',  icon: '🌊' },
];

const LABELS: Record<string, Record<string, string>> = {
  it: {
    title: 'Vuoi la piscina?',
    none: 'Non mi interessa',
    private: 'Privata (solo per noi)',
    shared: 'Condivisa con gli altri appartamenti',
    poolOnlyNatura: 'La piscina è disponibile solo a LivingApple, immerso nella natura a 1.5km dal mare.',
    noSolution: 'Nessuna soluzione disponibile per questa combinazione. Prova a modificare la ricerca.',
    continua: 'Continua →',
    indietro: '← Indietro',
    stepOf: 'Step 3 di 5',
  },
  en: {
    title: 'Do you want a pool?',
    none: 'Not interested',
    private: 'Private (just for us)',
    shared: 'Shared with other apartments',
    poolOnlyNatura: 'The pool is only available at LivingApple, surrounded by nature, 1.5km from the sea.',
    noSolution: 'No solution available for this combination. Try changing your search.',
    continua: 'Continue →',
    indietro: '← Back',
    stepOf: 'Step 3 of 5',
  },
  de: {
    title: 'Möchten Sie einen Pool?',
    none: 'Nicht interessiert',
    private: 'Privat (nur für uns)',
    shared: 'Geteilt mit anderen Apartments',
    poolOnlyNatura: 'Der Pool ist nur in LivingApple verfügbar, eingebettet in die Natur, 1,5 km vom Meer entfernt.',
    noSolution: 'Keine Lösung für diese Kombination verfügbar. Bitte ändern Sie Ihre Suche.',
    continua: 'Weiter →',
    indietro: '← Zurück',
    stepOf: 'Schritt 3 von 5',
  },
  pl: {
    title: 'Czy chcesz basen?',
    none: 'Nie interesuje mnie',
    private: 'Prywatny (tylko dla nas)',
    shared: 'Wspólny z innymi apartamentami',
    poolOnlyNatura: 'Basen dostępny jest tylko w LivingApple, otoczonym naturą, 1,5 km od morza.',
    noSolution: 'Brak rozwiązania dla tej kombinacji. Spróbuj zmienić wyszukiwanie.',
    continua: 'Dalej →',
    indietro: '← Wstecz',
    stepOf: 'Krok 3 z 5',
  },
};

interface Props {
  locale?: string;
}

export default function WizardStep3({ locale = 'it' }: Props) {
  const t = LABELS[locale] ?? LABELS.it;

  const { numAdult, numChild, poolPreference, setPoolPreference, nextStep, prevStep, setSelectedRoomId } =
    useWizardStore();

  const totalGuests = numAdult + numChild;

  // Rooms disponibili con la preferenza attuale
  const availableRooms = getAvailableRooms(totalGuests, poolPreference);
  const beachOnly = availableRooms.length > 0 && allRoomsAreBeach(availableRooms);
  const noSolution = availableRooms.length === 0;

  // Messaggio info piscina
  const showPoolMessage = poolPreference !== 'none';

  function handleSelect(value: PoolType) {
    setPoolPreference(value);
    setSelectedRoomId(null);
    // Auto-avanza subito dopo la selezione (bottone Continua resta come fallback)
    const rooms = getAvailableRooms(totalGuests, value);
    if (rooms.length > 0) {
      if (rooms.length === 1) setSelectedRoomId(rooms[0].roomId);
      // Piccolo delay per mostrare la selezione prima di avanzare
      setTimeout(() => nextStep(), 200);
    }
  }

  function handleContinua() {
    if (noSolution) return;
    // Se una sola room disponibile → selezione automatica
    if (availableRooms.length === 1) {
      setSelectedRoomId(availableRooms[0].roomId);
    }
    nextStep();
  }

  const canContinue = !noSolution;

  return (
    <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* Step indicator */}
      <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{t.stepOf}</div>

      {/* Titolo */}
      <h2 style={{ color: '#1E73BE', fontSize: 22, fontWeight: 700, marginBottom: 14 }}>
        {t.title}
      </h2>

      {/* Opzioni */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        {POOL_OPTIONS.map((opt) => {
          const selected = poolPreference === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '13px 18px',
                borderRadius: 12,
                border: selected ? '2px solid #1E73BE' : '2px solid #e0e0e0',
                background: selected ? '#EEF5FC' : '#fff',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: selected ? 600 : 400,
                color: '#222',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 28 }}>{opt.icon}</span>
              <span>{t[opt.labelKey]}</span>
            </button>
          );
        })}
      </div>

      {/* Box info piscina */}
      {showPoolMessage && (
        <div
          style={{
            background: '#EEF5FC',
            border: '1px solid #1E73BE',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 14,
            color: '#1E73BE',
            marginBottom: 16,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <span>{t.poolOnlyNatura}</span>
        </div>
      )}

      {/* Box nessuna soluzione */}
      {noSolution && (
        <div
          style={{
            background: '#FFF3CD',
            border: '1px solid #FCAF1A',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 14,
            color: '#856404',
            marginBottom: 16,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <span>{t.noSolution}</span>
        </div>
      )}

      {/* Continua */}
      <button
        onClick={handleContinua}
        disabled={!canContinue}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 12,
          border: 'none',
          background: canContinue ? '#FCAF1A' : '#e0e0e0',
          color: canContinue ? '#fff' : '#999',
          fontSize: 16,
          fontWeight: 700,
          cursor: canContinue ? 'pointer' : 'not-allowed',
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
