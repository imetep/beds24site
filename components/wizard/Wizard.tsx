'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import WizardSidebar from './WizardSidebar';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';
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
  const { currentStep, setCurrentStep, selectedRoomId, setSelectedRoomId } = useWizardStore();
  const router = useRouter();

  const searchParams = useSearchParams();
  const roomIdFromUrl = Number(searchParams.get('roomId') ?? '0') || null;
  // fromHome: true se l'utente è arrivato cliccando "Cerca" nella home
  // Usare query param è più affidabile dello store (che potrebbe essere già valorizzato)
  const fromHome = searchParams.get('from') === 'home';

  // Callback per tornare alla home da Step5 — resetta lo step
  function goBackHome() {
    setCurrentStep(1);
    router.push(`/${locale}`);
  }

  useEffect(() => {
    if (roomIdFromUrl && roomIdFromUrl !== selectedRoomId) {
      setSelectedRoomId(roomIdFromUrl);
    }
  }, [roomIdFromUrl, selectedRoomId, setSelectedRoomId]);

  // Se arriviamo dalla home, resettiamo currentStep a 1 (→ logicalStep S5)
  useEffect(() => {
    if (fromHome) setCurrentStep(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveRoomId = roomIdFromUrl ?? selectedRoomId;
  const skipStep3 = !!effectiveRoomId;

  // totalSteps: fromHome → S5+S6+S7 = 3 step
  //             skipStep3 → S1+S2+S5+S6+S7 = 5 step
  //             altrimenti → S1+S2+S3+S5+S6+S7 = 6 step
  const totalSteps = fromHome ? 3 : (skipStep3 ? 5 : 6);

  /**
   * Mappa currentStep → logicalStep (Step da renderizzare)
   *
   * fromHome (arriva dalla home con date+ospiti):
   *   currentStep 1→S5, 2→S6, 3→S7
   *
   * WizardDiretto (skipStep3=true, senza home):
   *   currentStep 1→S1, 2→S2, 3→S5, 4→S6, 5→S7
   *
   * WizardLibero (senza home, senza roomId):
   *   currentStep 1→S1, 2→S2, 3→S3, 4→S5, 5→S6, 6→S7
   */
  function getLogicalStep(): number {
    if (fromHome) {
      // 1→S5, 2→S6, 3→S7
      const map: Record<number, number> = { 1: 5, 2: 6, 3: 7 };
      return map[Math.min(currentStep, 3)] ?? 5;
    }
    if (!skipStep3) {
      return currentStep >= 4 ? currentStep + 1 : currentStep;
    }
    const clamped = Math.min(currentStep, totalSteps);
    if (clamped >= 3) return clamped + 2;
    return clamped;
  }
  const logicalStep = getLogicalStep();

  const showSidebar = logicalStep < 6; // nascondi sidebar su Step6 e Step7

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem 1.25rem 2rem' }}>

<div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>

        {/* Colonna form — Step6 occupa tutta la larghezza (ha il suo layout 2 colonne interno) */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: (logicalStep === 6 || logicalStep === 7) ? 'none' : 680 }}>
          {logicalStep === 1 && <WizardStep1 translations={t.wizard} locale={locale} roomId={effectiveRoomId} />}
          {logicalStep === 2 && <WizardStep2 translations={t.wizard} locale={locale} roomId={effectiveRoomId} />}
          {logicalStep === 3 && <WizardStep3 locale={locale} />}
          {logicalStep === 5 && <WizardStep5 locale={locale} roomId={effectiveRoomId} onBack={fromHome ? goBackHome : undefined} />}
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
