'use client';

const STEP_LABELS: Record<string, string[]> = {
  it: ['Ospiti','Date','Piscina','Under 12','Tariffa','Dati','Riepilogo'],
  en: ['Guests','Dates','Pool','Under 12','Rate','Details','Summary'],
  de: ['Gäste','Daten','Pool','Unter 12','Tarif','Details','Übersicht'],
  pl: ['Goście','Daty','Basen','Poniżej 12','Taryfa','Dane','Podsumowanie'],
};

// Con skip step3: rimuove 'Piscina'
const STEP_LABELS_SKIP: Record<string, string[]> = {
  it: ['Ospiti','Date','Under 12','Tariffa','Dati','Riepilogo'],
  en: ['Guests','Dates','Under 12','Rate','Details','Summary'],
  de: ['Gäste','Daten','Unter 12','Tarif','Details','Übersicht'],
  pl: ['Goście','Daty','Poniżej 12','Taryfa','Dane','Podsumowanie'],
};

interface Props {
  currentStep: number;
  totalSteps: number;
  locale?: string;
  skipStep3?: boolean;
}

export default function WizardProgressBar({ currentStep, totalSteps, locale = 'it', skipStep3 = false }: Props) {
  const labels = (skipStep3 ? STEP_LABELS_SKIP : STEP_LABELS)[locale]
    ?? (skipStep3 ? STEP_LABELS_SKIP.it : STEP_LABELS.it);

  return (
    <div style={{ padding: '0 0 28px' }}>
      {/* Desktop: step numerati con labels */}
      <div className="progress-desktop" style={{ display: 'flex', alignItems: 'flex-start' }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum  = i + 1;
          const done     = stepNum < currentStep;
          const active   = stepNum === currentStep;
          const label    = labels[i] ?? String(stepNum);

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: i < totalSteps - 1 ? 1 : 'none' }}>
              {/* Dot + label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: done ? '#1E73BE' : active ? '#fff' : '#f3f4f6',
                  color:      done ? '#fff'    : active ? '#1E73BE' : '#9ca3af',
                  border:     active ? '2px solid #1E73BE' : done ? 'none' : '2px solid #e5e7eb',
                  transition: 'all 0.25s',
                }}>
                  {done ? '✓' : stepNum}
                </div>
                <span style={{
                  fontSize: 11, whiteSpace: 'nowrap',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#1E73BE' : done ? '#6b7280' : '#9ca3af',
                }}>
                  {label}
                </span>
              </div>
              {/* Linea di connessione */}
              {i < totalSteps - 1 && (
                <div style={{
                  flex: 1, height: 2, marginTop: 13, marginLeft: 4, marginRight: 4,
                  background: done ? '#1E73BE' : '#e5e7eb',
                  transition: 'background 0.25s',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: pallini senza label + testo "Step X di Y" */}
      <div className="progress-mobile" style={{ display: 'none', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNum = i + 1;
            const done    = stepNum < currentStep;
            const active  = stepNum === currentStep;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < totalSteps - 1 ? 1 : 'none' }}>
                <div style={{
                  width: active ? 10 : 8, height: active ? 10 : 8,
                  borderRadius: '50%', flexShrink: 0,
                  background: (done || active) ? '#1E73BE' : '#e5e7eb',
                  transition: 'all 0.2s',
                }} />
                {i < totalSteps - 1 && (
                  <div style={{ flex: 1, height: 2, background: done ? '#1E73BE' : '#e5e7eb' }} />
                )}
              </div>
            );
          })}
        </div>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Step {currentStep} di {totalSteps} — {labels[currentStep - 1] ?? ''}
        </span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .progress-desktop { display: none !important; }
          .progress-mobile  { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
