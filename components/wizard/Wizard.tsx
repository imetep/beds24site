'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import WizardProgressBar from './WizardProgressBar';
import WizardSidebar from './WizardSidebar';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';
import WizardStep4 from './WizardStep4';
import WizardStep5 from './WizardStep5';
import WizardStep6 from './WizardStep6';
import WizardStep7 from './WizardStep7';

interface Props {
  translations: any;
  locale: string;
}

// Wrapper che passa onContinua alla sidebar solo sullo Step5
function WizardSidebarWrapper({ locale, logicalStep }: { locale: string; logicalStep: number }) {
  const { selectedOfferId, nextStep } = useWizardStore();
  if (logicalStep === 5) {
    return <WizardSidebar locale={locale} step={logicalStep} onContinua={nextStep} canContinua={!!selectedOfferId} />;
  }
  return <WizardSidebar locale={locale} step={logicalStep} />;
}

export default function Wizard({ translations: t, locale }: Props) {
  const { currentStep, selectedRoomId, setSelectedRoomId } = useWizardStore();

  const searchParams = useSearchParams();
  const roomIdFromUrl = Number(searchParams.get('roomId') ?? '0') || null;

  useEffect(() => {
    if (roomIdFromUrl && roomIdFromUrl !== selectedRoomId) {
      setSelectedRoomId(roomIdFromUrl);
    }
  }, [roomIdFromUrl, selectedRoomId, setSelectedRoomId]);

  const effectiveRoomId = roomIdFromUrl ?? selectedRoomId;
  const skipStep3  = !!effectiveRoomId;
  const totalSteps = skipStep3 ? 6 : 7;

  /**
   * Mappa currentStep (1..6 nello store) → logicalStep (numero dello Step da renderizzare)
   *
   * WizardLibero (skipStep3=false):
   *   currentStep 1→S1, 2→S2, 3→S3, 4→S4, 5→S5, 6→S6
   *
   * WizardDiretto (skipStep3=true, totalSteps=5):
   *   currentStep 1→S1, 2→S2, 3→S4, 4→S5, 5→S6
   *   (S3 piscina viene saltato, tutto shiftato di -1)
   */
  function getLogicalStep(): number {
    if (!skipStep3) return currentStep;
    // Clamp: currentStep non deve superare totalSteps (5)
    const clamped = Math.min(currentStep, totalSteps);
    // Con skip: da step 3 in poi shifta +1 per saltare S3
    return clamped >= 3 ? clamped + 1 : clamped;
    // Nota: step 7 (riepilogo) è sempre l'ultimo
  }
  const logicalStep = getLogicalStep();

  const showSidebar = logicalStep < 6; // nascondi sidebar su Step6 e Step7

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem 1.25rem 2rem' }}>

      <WizardProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        locale={locale}
        skipStep3={skipStep3}
      />

      <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>

        {/* Colonna form — Step6 occupa tutta la larghezza (ha il suo layout 2 colonne interno) */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: (logicalStep === 6 || logicalStep === 7) ? 'none' : 680 }}>
          {logicalStep === 1 && <WizardStep1 translations={t.wizard} locale={locale} roomId={effectiveRoomId} />}
          {logicalStep === 2 && <WizardStep2 translations={t.wizard} locale={locale} roomId={effectiveRoomId} />}
          {logicalStep === 3 && <WizardStep3 locale={locale} />}
          {logicalStep === 4 && <WizardStep4 locale={locale} />}
          {logicalStep === 5 && <WizardStep5 locale={locale} roomId={effectiveRoomId} />}
          {logicalStep === 6 && <WizardStep6 locale={locale} />}
          {logicalStep === 7 && <WizardStep7 locale={locale} />}
        </div>

        {/* Sidebar destra — solo desktop, solo step 1-5 */}
        {showSidebar && (
          <div className="wizard-sidebar-wrapper">
            <WizardSidebarWrapper locale={locale} logicalStep={logicalStep} />
          </div>
        )}
      </div>

      <style>{`
        .wizard-sidebar-wrapper { display: none; }
        @media (min-width: 768px) {
          .wizard-sidebar-wrapper { display: block; }
        }
      `}</style>
    </div>
  );
}
