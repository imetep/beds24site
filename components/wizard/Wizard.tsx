'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import { getTranslations } from '@/lib/i18n';
import Stepper from '@/components/ui/Stepper';
import WizardBookingSummary from './WizardBookingSummary';
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
    selectedOfferId, nextStep,
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

    // Cancella la prenotazione pendente su Beds24
    fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: Number(cancelledBookId) }),
    }).catch(e => console.warn('[Wizard] cancel fallita (ignoro):', e));

    // Pulisci il pendingBookId dallo store (per sicurezza)
    setPendingBooking(null, null);

    // Pulisci anche sessionStorage se presente
    try { sessionStorage.removeItem('stripe_pending'); } catch {}

    // Rimuovi i parametri dall'URL senza ricaricare la pagina
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

  // Click su step precedente = torna indietro (solo se già visitato).
  // Bloccato quando l'utente entra dal link ospite (fromRoom/isGuestLink):
  // step 1 non è mai stato suo, niente senso permettergli di tornarci.
  const canGoBack = !fromRoom && !isGuestLink;

  // ── Loader iniziale (solo per link ospite che fetcha offerte) ─────────────
  if (isGuestLink && !ready) {
    return (
      <div className="wizard-loading">
        <div className="wizard-loading-spinner" />
        Caricamento...
      </div>
    );
  }

  // ── CTA sidebar: solo allo step 1 (scelta offerta), coerente con logica
  //    attuale (gli step 2 e 3 hanno le loro CTA interne al form).
  const showSidebarCta     = logicalStep === 1;
  const sidebarCanContinua = !!selectedOfferId;

  return (
    <div className="wizard-container">
      <Stepper
        steps={steps}
        current={logicalStep}
        onGoBack={canGoBack ? (s) => setCurrentStep(s) : undefined}
        ariaLabel={stepperT.ariaLabel}
      />

      <div className="wizard-row">
        <div className="wizard-content">
          {logicalStep === 1 && <WizardStep1 locale={locale} onBack={goBackHome} />}
          {logicalStep === 2 && <WizardStep2 locale={locale} />}
          {logicalStep === 3 && <WizardStep3 locale={locale} />}
        </div>

        <aside className="wizard-sidebar">
          <WizardBookingSummary
            locale={locale}
            onContinua={showSidebarCta ? nextStep : undefined}
            canContinua={showSidebarCta ? sidebarCanContinua : undefined}
          />
        </aside>
      </div>
    </div>
  );
}
