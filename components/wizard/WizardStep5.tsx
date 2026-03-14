'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';
import type { Beds24Offer } from '@/lib/beds24-client';

// ─── Traduzioni ───────────────────────────────────────────────────────────────
const LABELS: Record<string, Record<string, string>> = {
  it: {
    title: 'Quale tariffa preferite?',
    loading: 'Ricerca tariffe...',
    noOffers: 'Nessuna tariffa disponibile per le date e gli ospiti selezionati.',
    nightsSingular: 'notte', nightsPlural: 'notti',
    total: 'Totale soggiorno', perNight: 'a notte',
    select: 'Seleziona', selected: '✓ Selezionata',
    continua: 'Continua →', indietro: '← Indietro',
    errorTitle: 'Impossibile caricare le tariffe', retry: 'Riprova',
    nights: 'notti', apartment: 'Appartamento',
  },
  en: {
    title: 'Which rate do you prefer?',
    loading: 'Searching rates...',
    noOffers: 'No rates available for the selected dates and guests.',
    nightsSingular: 'night', nightsPlural: 'nights',
    total: 'Total stay', perNight: 'per night',
    select: 'Select', selected: '✓ Selected',
    continua: 'Continue →', indietro: '← Back',
    errorTitle: 'Unable to load rates', retry: 'Retry',
    nights: 'nights', apartment: 'Apartment',
  },
  de: {
    title: 'Welchen Tarif bevorzugen Sie?',
    loading: 'Tarife suchen...',
    noOffers: 'Keine Tarife für die ausgewählten Daten und Gäste verfügbar.',
    nightsSingular: 'Nacht', nightsPlural: 'Nächte',
    total: 'Gesamtaufenthalt', perNight: 'pro Nacht',
    select: 'Auswählen', selected: '✓ Ausgewählt',
    continua: 'Weiter →', indietro: '← Zurück',
    errorTitle: 'Tarife konnten nicht geladen werden', retry: 'Wiederholen',
    nights: 'Nächte', apartment: 'Unterkunft',
  },
  pl: {
    title: 'Którą taryfę preferujecie?',
    loading: 'Wyszukiwanie taryf...',
    noOffers: 'Brak dostępnych taryf dla wybranych dat i gości.',
    nightsSingular: 'noc', nightsPlural: 'nocy',
    total: 'Całkowity pobyt', perNight: 'za noc',
    select: 'Wybierz', selected: '✓ Wybrano',
    continua: 'Dalej →', indietro: '← Wstecz',
    errorTitle: 'Nie można załadować taryf', retry: 'Ponów',
    nights: 'nocy', apartment: 'Apartament',
  },
};

function getRoomName(roomId: number): string {
  for (const prop of PROPERTIES) {
    const room = prop.rooms.find((r) => r.roomId === roomId);
    if (room) return room.name;
  }
  return `Room ${roomId}`;
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(price);
}

function calcNights(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
}

interface Props { locale?: string; }

export default function WizardStep5({ locale = 'it' }: Props) {
  const t = LABELS[locale] ?? LABELS.it;

  const {
    numAdult, numChild, checkIn, checkOut, selectedRoomId,
    selectedOfferId, setSelectedOfferId, setOffers,
    nextStep, prevStep,
  } = useWizardStore();

  const [offers, setLocalOffers] = useState<Beds24Offer[]>([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState<string | null>(null);

  async function fetchOffers() {
    if (!selectedRoomId || !checkIn || !checkOut) return;
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({
        roomId: String(selectedRoomId), checkIn, checkOut,
        numAdult: String(numAdult), numChild: String(numChild),
      });
      const res = await fetch(`/api/offers?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Beds24Offer[] = data.offers ?? [];
      setLocalOffers(list);
      if (typeof setOffers === 'function') setOffers(list);
    } catch (err: any) {
      setError(err.message ?? 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOffers(); }, []); // eslint-disable-line

  const nights   = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
  const roomName = selectedRoomId ? getRoomName(selectedRoomId) : '';

  return (
    <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#1E73BE', fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>{t.title}</h2>

      {roomName && (
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 20px' }}>
          {t.apartment}: <strong>{roomName}</strong>
          {nights > 0 && ` · ${nights} ${nights === 1 ? t.nightsSingular : t.nightsPlural}`}
        </p>
      )}

      {/* Spinner */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e0e0e0', borderTop: '3px solid #1E73BE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#888', fontSize: 14 }}>{t.loading}</span>
        </div>
      )}

      {/* Errore */}
      {!loading && error && (
        <div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 12, padding: '16px 20px', textAlign: 'center', marginBottom: 20 }}>
          <p style={{ margin: '0 0 10px', color: '#c0392b' }}>{t.errorTitle}</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#888' }}>{error}</p>
          <button onClick={fetchOffers} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #1E73BE', background: '#fff', color: '#1E73BE', fontSize: 14, cursor: 'pointer' }}>{t.retry}</button>
        </div>
      )}

      {/* Nessuna offerta */}
      {!loading && !error && offers.length === 0 && (
        <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '24px', textAlign: 'center', marginBottom: 20 }}>
          <p style={{ margin: 0, color: '#888', fontSize: 14 }}>{t.noOffers}</p>
        </div>
      )}

      {/* Offerte */}
      {!loading && !error && offers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {offers.map((offer) => {
            const isSelected = selectedOfferId === offer.offerId;
            const perNight   = nights > 0 ? Math.round(offer.price / nights) : 0;
            return (
              <button
                key={offer.offerId}
                onClick={() => setSelectedOfferId(offer.offerId)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s', width: '100%',
                  border: isSelected ? '2px solid #1E73BE' : '2px solid #e0e0e0',
                  background: isSelected ? '#EEF5FC' : '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#222' }}>
                    {offer.offerName ?? `Tariffa ${offer.offerId}`}
                  </span>
                  {isSelected && <span style={{ fontSize: 13, color: '#1E73BE', fontWeight: 600 }}>{t.selected}</span>}
                </div>

                {offer.offerDescription && !offer.offerDescription.includes('CUSTOMSTAYFEE') && (
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666', textAlign: 'left' }}>
                    {offer.offerDescription}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#1E73BE' }}>
                    {formatPrice(offer.price, offer.currency || 'EUR')}
                  </span>
                  {perNight > 0 && (
                    <span style={{ fontSize: 13, color: '#888' }}>
                      ({formatPrice(perNight, offer.currency || 'EUR')} {t.perNight})
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#555', background: '#f0f0f0', borderRadius: 6, padding: '3px 8px' }}>
                    {t.total} · {nights} {t.nights}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={nextStep}
        disabled={!selectedOfferId}
        style={{
          width: '100%', padding: '16px', borderRadius: 12, border: 'none',
          fontSize: 16, fontWeight: 700, marginBottom: 16,
          background: selectedOfferId ? '#FCAF1A' : '#e0e0e0',
          color: selectedOfferId ? '#fff' : '#999',
          cursor: selectedOfferId ? 'pointer' : 'not-allowed',
        }}
      >
        {t.continua}
      </button>

      <button onClick={prevStep} style={{ background: 'none', border: 'none', color: '#1E73BE', fontSize: 14, cursor: 'pointer', padding: 0 }}>
        {t.indietro}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
