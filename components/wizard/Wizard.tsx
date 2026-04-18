'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import { getTranslations } from '@/lib/i18n';
import Stepper from '@/components/ui/Stepper';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';
import type { Locale } from '@/config/i18n';

interface Props {
  translations: any;
  locale: string;
}

export default function Wizard({ translations: t, locale }: Props) {
  const {
    currentStep, setCurrentStep,
    setCheckIn, setCheckOut,
    setNumAdult,
    setSelectedRoomId, setSelectedOfferId, setOffers,
    setPendingBooking,
  } = useWizardStore();

  const [ready, setReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromRoom    = searchParams.get('from') === 'room';
  const roomIdUrl   = Number(searchParams.get('roomId') ?? '0') || null;
  const checkInUrl  = searchParams.get('checkIn') ?? '';
  const checkOutUrl = searchParams.get('checkOut') ?? '';
  const adultsUrl   = Number(searchParams.get('adults') ?? '0') || null;

  // ✅ FIX: gestione ritorno da Stripe con pagamento annullato
  // Stripe redirige a: /prenota?cancelled=1&bookingId=X
  const cancelled        = searchParams.get('cancelled');
  const cancelledBookId  = searchParams.get('bookingId');

  const isGuestLink = !!(fromRoom && roomIdUrl && checkInUrl && checkOutUrl);

  // ── Gestione abbandono Stripe ──────────────────────────────────────────────
  useEffect(() => {
    if (cancelled !== '1' || !cancelledBookId) return;

    console.log('[Wizard] Stripe cancelled → cancello booking:', cancelledBookId);

    fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: Number(cancelledBookId) }),
    }).catch(e => console.warn('[Wizard] cancel fallita (ignoro):', e));

    setPendingBooking(null, null);
    try { sessionStorage.removeItem('stripe_pending'); } catch {}
    window.history.replaceState({}, '', `/${locale}/prenota`);

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Inizializzazione store da URL params ──────────────────────────────────
  useEffect(() => {
    if (isGuestLink) {
      setSelectedRoomId(roomIdUrl!);
      setCheckIn(checkInUrl);
      setCheckOut(checkOutUrl);
      if (adultsUrl) setNumAdult(adultsUrl);

      const adults = adultsUrl ?? 2;
      const qs = new URLSearchParams({
        roomIds:   String(roomIdUrl),
        arrival:   checkInUrl,
        departure: checkOutUrl,
        numAdults: String(adults),
      });

      fetch(`/api/offers?${qs}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
          const roomData = (data.data ?? []).find((x: any) => x.roomId === roomIdUrl);
          const offers = roomData?.offers ?? [];
          setOffers([{ roomId: roomIdUrl, offers }]);
          if (offers.length > 0) {
            const best = offers.reduce((a: any, b: any) => a.price <= b.price ? a : b);
            setSelectedOfferId(best.offerId);
          }
        })
        .catch(() => {})
        .finally(() => {
          setCurrentStep(2);
          setReady(true);
        });
    } else if (fromRoom) {
      setCurrentStep(2);
      setReady(true);
    } else {
      setCurrentStep(1);
      setReady(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function goBackHome() {
    setCurrentStep(1);
    router.push(`/${locale}`);
  }

  const logicalStep = fromRoom || isGuestLink
    ? Math.max(2, Math.min(currentStep, 3))
    : Math.min(currentStep, 3);

  // ── Stepper labels (i18n) ─────────────────────────────────────────────────
  const tr = getTranslations(locale as Locale);
  const stepperT = tr.components.wizardStepper;
  const steps = [
    { label: stepperT.stepScegli },
    { label: stepperT.stepOspite },
    { label: stepperT.stepPaga },
  ];

  // Click su step precedente = torna indietro (solo se l'utente può davvero
  // tornarci: se arriva da link ospite, non è mai stato allo step 1).
  const canGoBack = !fromRoom && !isGuestLink;

  if (isGuestLink && !ready) {
    return (
      <div className="wizard-loading">
        <div className="wizard-loading-spinner" />
        Caricamento...
      </div>
    );
  }

  // NOTA architetturale (post-rollback 2026-04-18):
  // Nessuna sidebar esterna. Ogni step gestisce il proprio layout interno:
  //  - Step 1 (WizardStep1): lista card a full-width del container
  //  - Step 2 (WizardStep2): ha già un suo layout 2-col autonomo (form + sidebar
  //    interna con voucher/extras interattivi, info critiche come deposito e
  //    cancellazione). Una sidebar esterna qui duplicherebbe e confonderebbe.
  //  - Step 3 (WizardStep3): single-column con riepilogo finale + CTA pagamento.
  // Lo Stepper in cima è l'unico elemento cross-step introdotto da questo file.
  // Vedi docs/ux/wizard-layout.md §14 per il razionale.

  return (
    <div className="wizard-container">
      <Stepper
        steps={steps}
        current={logicalStep}
        onGoBack={canGoBack ? (s) => setCurrentStep(s) : undefined}
        ariaLabel={stepperT.ariaLabel}
      />

      {logicalStep === 1 && <WizardStep1 locale={locale} onBack={goBackHome} />}
      {logicalStep === 2 && <WizardStep2 locale={locale} />}
      {logicalStep === 3 && <WizardStep3 locale={locale} />}
    </div>
  );
}
