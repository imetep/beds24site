'use client';

import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

interface Props { locale?: string; }

export default function WizardBottomBar({ locale = 'it' }: Props) {
  const { selectedRoomId, checkIn, checkOut, selectedOfferId, cachedOffers, currentStep } = useWizardStore();

  // Non mostrare al primo step o all'ultimo (step 6 ha già il suo bottone)
  if (currentStep === 1 || currentStep === 6 || currentStep === 7) return null;

  const room = selectedRoomId
    ? PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === selectedRoomId)
    : null;

  const offer = cachedOffers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerPrice: number = offer?.price ?? 0;
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
  const perNight = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;

  const label: Record<string, string> = { it: 'a notte', en: '/night', de: '/Nacht', pl: '/noc' };

  return (
    <div className="wizard-bottom-bar" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '1px solid #e5e7eb',
      padding: '10px 16px',
      display: 'none', // mostrato via CSS su mobile
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 50,
    }}>
      {/* Info sinistra */}
      <div>
        {room && <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0 }}>{room.name}</p>}
        {perNight > 0 && (
          <p style={{ fontSize: 12, color: '#1E73BE', margin: 0 }}>
            {fmt(perNight)} {label[locale] ?? label.it}
          </p>
        )}
        {offerPrice > 0 && nights > 0 && (
          <p style={{ fontSize: 12, color: '#1E73BE', margin: 0 }}>
            {fmt(offerPrice)} totale · {nights} notti
          </p>
        )}
      </div>
      {/* Spazio vuoto — il bottone Continua è già dentro ogni step */}
    </div>
  );
}
