'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import WizardSidebar from './WizardSidebar';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';

interface Props {
  translations: any;
  locale: string;
}

function WizardSidebarWrapper({ locale, logicalStep }: { locale: string; logicalStep: number }) {
  const { selectedOfferId, nextStep } = useWizardStore();
  if (logicalStep === 1) {
    return <WizardSidebar locale={locale} step={5} onContinua={nextStep} canContinua={!!selectedOfferId} />;
  }
  return <WizardSidebar locale={locale} step={5} />;
}

export default function Wizard({ translations: t, locale }: Props) {
  const {
    currentStep, setCurrentStep,
    setCheckIn, setCheckOut,
    setNumAdult,
    setSelectedRoomId, setSelectedOfferId, setOffers,
    setPendingBooking,
  } = useWizardStore();

  const [isDesk, setIsDesk]     = useState(false);
  const [ready,  setReady]      = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromHome    = searchParams.get('from') === 'home';
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

  useEffect(() => {
    const check = () => setIsDesk(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
    // così l'utente vede /prenota pulita e può ricominciare
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

  const showSidebar = logicalStep === 1;
  const fullWidth   = logicalStep >= 2;

  if (isGuestLink && !ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 12, color: '#9ca3af', fontSize: 15 }}>
        <div style={{ width: 22, height: 22, border: '2px solid #eee', borderTop: '2px solid #1E73BE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Caricamento...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1100,
      margin: '0 auto',
      padding: isDesk ? '1.5rem 24px 3rem' : '1.25rem 16px 2rem',
    }}>
      <div style={{ display: 'flex', gap: 32 }}>

        <div style={{ flex: 1, minWidth: 0, maxWidth: fullWidth ? 'none' : 680 }}>
          {logicalStep === 1 && <WizardStep1 locale={locale} onBack={goBackHome} />}
          {logicalStep === 2 && <WizardStep2 locale={locale} />}
          {logicalStep === 3 && <WizardStep3 locale={locale} />}
        </div>

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
