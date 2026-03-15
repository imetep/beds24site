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

interface Props {
  translations: any;
  locale: string;
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
  const skipStep3   = !!effectiveRoomId;
  const totalSteps  = skipStep3 ? 5 : 6;

  function getLogicalStep(): number {
    if (!skipStep3) return currentStep;
    return currentStep >= 3 ? currentStep + 1 : currentStep;
  }
  const logicalStep = getLogicalStep();

  // Su step 6 (conferma) la sidebar non serve
  const showSidebar = currentStep < totalSteps;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem' }}>

      {/* Progress bar — full width sopra il layout */}
      <WizardProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        locale={locale}
        skipStep3={skipStep3}
      />

      {/* Layout: form a sinistra, sidebar a destra su desktop */}
      <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>

        {/* Colonna form — cresce fino a max 600px */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 600 }}>
          {logicalStep === 1 && <WizardStep1 translations={t.wizard} locale={locale} roomId={effectiveRoomId} />}
          {logicalStep === 2 && <WizardStep2 translations={t.wizard} locale={locale} roomId={effectiveRoomId} />}
          {logicalStep === 3 && <WizardStep3 locale={locale} />}
          {logicalStep === 4 && <WizardStep4 locale={locale} />}
          {logicalStep === 5 && <WizardStep5 locale={locale} roomId={effectiveRoomId} />}
          {logicalStep === 6 && <WizardStep6 locale={locale} />}
        </div>

        {/* Sidebar destra — visibile solo su desktop */}
        {showSidebar && (
          <div className="wizard-sidebar-wrapper">
            <WizardSidebar locale={locale} />
          </div>
        )}
      </div>

      <style>{`
        .wizard-sidebar-wrapper {
          display: none;
        }
        @media (min-width: 768px) {
          .wizard-sidebar-wrapper {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
