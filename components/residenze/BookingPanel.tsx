'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';

// ─── Offer names ──────────────────────────────────────────────────────────────

const OFFER_NAMES: Record<number, Record<string, string>> = {
  1: { it:'Non Rimborsabile',          en:'Non-Refundable',         de:'Nicht erstattungsfähig',  pl:'Bezzwrotna' },
  2: { it:'Parzialmente Rimborsabile', en:'Partially Refundable',   de:'Teilw. erstattungsfähig', pl:'Częściowo zwrotna' },
  3: { it:'Flessibile 60 gg',          en:'Flexible 60 days',       de:'Flexibel 60 Tage',        pl:'Elastyczna 60 dni' },
  4: { it:'Flessibile 45 gg',          en:'Flexible 45 days',       de:'Flexibel 45 Tage',        pl:'Elastyczna 45 dni' },
  5: { it:'Flessibile 30 gg',          en:'Flexible 30 days',       de:'Flexibel 30 Tage',        pl:'Elastyczna 30 dni' },
  6: { it:'Flessibile 5 gg',           en:'Flexible 5 days',        de:'Flexibel 5 Tage',         pl:'Elastyczna 5 dni' },
};

const OFFER_DESC: Record<number, Record<string, string>> = {
  1: { it:'Paghi tutto entro 48h dalla prenotazione.',        en:'Pay in full within 48h.',               de:'Vollzahlung innerhalb 48h.',         pl:'Płatność w całości w ciągu 48h.' },
  2: { it:"Paghi 50% ora, il saldo all'arrivo.",              en:'Pay 50% now, balance at arrival.',       de:'50% jetzt, Rest bei Ankunft.',       pl:'50% teraz, reszta przy przyjeździe.' },
  3: { it:"Cancellazione gratuita entro 60 gg dall'arrivo.",  en:'Free cancellation up to 60 days before.',de:'Kostenlose Stornierung bis 60 Tage.', pl:'Bezpłatne anulowanie do 60 dni.' },
  4: { it:"Cancellazione gratuita entro 45 gg dall'arrivo.",  en:'Free cancellation up to 45 days before.',de:'Kostenlose Stornierung bis 45 Tage.', pl:'Bezpłatne anulowanie do 45 dni.' },
  5: { it:"Cancellazione gratuita entro 30 gg dall'arrivo.",  en:'Free cancellation up to 30 days before.',de:'Kostenlose Stornierung bis 30 Tage.', pl:'Bezpłatne anulowanie do 30 dni.' },
  6: { it:"Cancellazione gratuita entro 5 gg dall'arrivo.",   en:'Free cancellation up to 5 days before.', de:'Kostenlose Stornierung bis 5 Tage.',  pl:'Bezpłatne anulowanie do 5 dni.' },
};

const UI: Record<string, Record<string, string>> = {
  it: {
    guests: 'Ospiti', adults: 'Adulti', adultsAge: '18+',
    children: 'Bambini', childrenAge: '0–17',
    nights: 'notte', nightsP: 'notti',
    offersTitle: 'Tariffe disponibili',
    loading: 'Ricerca tariffe...', noOffers: 'Nessuna tariffa disponibile per le date selezionate.',
    prenota: 'Prenota ora', perNight: '/notte', total: 'totale',
    selezionata: '✓ Selezionata', nonDisp: 'Non disponibile',
    selectDates: 'Seleziona le date per vedere le tariffe disponibili.',
  },
  en: {
    guests: 'Guests', adults: 'Adults', adultsAge: '18+',
    children: 'Children', childrenAge: '0–17',
    nights: 'night', nightsP: 'nights',
    offersTitle: 'Available rates',
    loading: 'Searching rates...', noOffers: 'No rates available for the selected dates.',
    prenota: 'Book now', perNight: '/night', total: 'total',
    selezionata: '✓ Selected', nonDisp: 'Unavailable',
    selectDates: 'Select dates to see available rates.',
  },
  de: {
    guests: 'Gäste', adults: 'Erwachsene', adultsAge: '18+',
    children: 'Kinder', childrenAge: '0–17',
    nights: 'Nacht', nightsP: 'Nächte',
    offersTitle: 'Verfügbare Tarife',
    loading: 'Tarife suchen...', noOffers: 'Keine Tarife für die gewählten Daten.',
    prenota: 'Jetzt buchen', perNight: '/Nacht', total: 'gesamt',
    selezionata: '✓ Ausgewählt', nonDisp: 'Nicht verfügbar',
    selectDates: 'Wählen Sie Daten, um verfügbare Tarife zu sehen.',
  },
  pl: {
    guests: 'Goście', adults: 'Dorośli', adultsAge: '18+',
    children: 'Dzieci', childrenAge: '0–17',
    nights: 'noc', nightsP: 'nocy',
    offersTitle: 'Dostępne taryfy',
    loading: 'Wyszukiwanie...', noOffers: 'Brak taryf dla wybranych dat.',
    prenota: 'Zarezerwuj', perNight: '/noc', total: 'łącznie',
    selezionata: '✓ Wybrano', nonDisp: 'Niedostępne',
    selectDates: 'Wybierz daty, aby zobaczyć dostępne taryfy.',
  },
};

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

interface OfferItem { offerId: number; offerName: string; price: number; unitsAvailable: number; }

interface Props {
  roomId: number;
  locale?: string;
  maxPeople: number;
}

export default function BookingPanel({ roomId, locale = 'it', maxPeople }: Props) {
  const t = UI[locale] ?? UI.it;
  const router = useRouter();

  const {
    numAdult, numChild, childrenAges, checkIn, checkOut,
    setNumAdult, setNumChild, setChildAge,
    setSelectedRoomId, setSelectedOfferId, setOffers, setCurrentStep,
  } = useWizardStore();

  const [offers, setLocalOffers]   = useState<OfferItem[]>([]);
  const [loading, setLoading]      = useState(false);
  const [pickedOffer, setPicked]   = useState<number | null>(null);

  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
  const childrenTaxable = (childrenAges ?? []).filter((a: number) => a >= 12).length;
  const taxableAdults   = numAdult + childrenTaxable;
  const taxableNights   = Math.min(nights, 10);
  const touristTax      = taxableNights * taxableAdults * 2;
  const totalPeople = numAdult + numChild;
  const overCapacity = totalPeople > maxPeople;

  // Fetch offerte quando date+ospiti sono pronti
  useEffect(() => {
    if (!checkIn || !checkOut) { setLocalOffers([]); setPicked(null); return; }
    if (overCapacity) return;

    setLoading(true);
    setPicked(null);

    const qs = new URLSearchParams({
      roomIds:     String(roomId),
      arrival:     checkIn,
      departure:   checkOut,
      numAdults:   String(numAdult + (childrenAges ?? []).filter((a: number) => a >= 3).length),
    });

    fetch(`/api/offers?${qs}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const roomData = (data.data ?? []).find((x: any) => x.roomId === roomId);
        setLocalOffers(roomData?.offers ?? []);
      })
      .catch(() => setLocalOffers([]))
      .finally(() => setLoading(false));
  // ✅ numChild è dep: quando cambia il numero di bambini va ri-fetchato
  // (anche se i bambini 0-2 non influenzano il prezzo, childrenAges potrebbe
  // non essere ancora aggiornato al momento del primo render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, numAdult, numChild, JSON.stringify(childrenAges), roomId]);

  function handlePrenota() {
    if (!pickedOffer || !checkIn || !checkOut) return;
    setSelectedRoomId(roomId);
    setSelectedOfferId(pickedOffer);
    setOffers(offers.map(o => ({ ...o, roomId })));
    setCurrentStep(1); // Wizard partirà da Step2 grazie a from=room
    router.push(`/${locale}/prenota?roomId=${roomId}&from=room`);
  }

  return (
    <section style={{ marginTop: 40 }}>

      {/* Ospiti */}
      <div style={{ marginBottom: 24, padding: '16px', border: '1px solid #e5e7eb', borderRadius: 14, background: '#fff' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#111' }}>{t.guests}</h3>
        <GuestRow
          label={t.adults} sub={t.adultsAge}
          value={numAdult} min={1}
          onDec={() => setNumAdult(numAdult - 1)}
          onInc={() => setNumAdult(numAdult + 1)}
        />
        <GuestRow
          label={t.children} sub={t.childrenAge}
          value={numChild} min={0}
          onDec={() => setNumChild(numChild - 1)}
          onInc={() => setNumChild(numChild + 1)}
        />
        {/* Selezione età bambini */}
        {numChild > 0 && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 10px', lineHeight: 1.5 }}>
              {locale === 'it' ? 'Per mostrarti i prezzi esatti, dobbiamo conoscere l’età dei bambini.'
               : locale === 'de' ? 'Für genaue Preise benötigen wir das Alter der Kinder.'
               : locale === 'pl' ? 'Potrzebujemy znać wiek dzieci, aby pokazać dokładne ceny.'
               : 'To show exact prices, we need to know the children’s ages.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: numChild === 1 ? '1fr' : '1fr 1fr', gap: 10 }}>
              {Array.from({ length: numChild }, (_, i) => (
                <div key={i}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                    {locale === 'it' ? `Età bambino ${i + 1}` : locale === 'de' ? `Alter Kind ${i + 1}` : locale === 'pl' ? `Wiek dziecka ${i + 1}` : `Child ${i + 1} age`}
                  </label>
                  <select
                    value={childrenAges[i] ?? -1}
                    onChange={e => setChildAge(i, Number(e.target.value))}
                    style={{
                      width: '100%', padding: '8px 10px', fontSize: 14,
                      border: `1.5px solid ${(childrenAges[i] ?? -1) < 0 ? '#f97316' : '#e5e7eb'}`,
                      borderRadius: 8, background: '#fff',
                      color: (childrenAges[i] ?? -1) < 0 ? '#9ca3af' : '#111', outline: 'none',
                    }}>
                    <option value={-1}>{locale === 'it' ? 'Seleziona età' : locale === 'de' ? 'Alter wählen' : locale === 'pl' ? 'Wybierz wiek' : 'Select age'}</option>
                    {Array.from({ length: 18 }, (_, age) => (
                      <option key={age} value={age}>
                        {age === 0 ? (locale === 'it' ? '0 anni' : locale === 'de' ? '0 Jahre' : locale === 'pl' ? '0 lat' : '0 years')
                         : age === 1 ? (locale === 'it' ? '1 anno' : locale === 'de' ? '1 Jahr' : locale === 'pl' ? '1 rok' : '1 year')
                         : `${age} ${locale === 'it' ? 'anni' : locale === 'de' ? 'Jahre' : locale === 'pl' ? 'lata' : 'years'}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {overCapacity && (
          <p style={{ margin: '10px 0 0', fontSize: 13, color: '#e74c3c' }}>
            ⚠️ Massimo {maxPeople} {maxPeople === 1 ? 'persona' : 'persone'} per questo appartamento.
          </p>
        )}
      </div>

      {/* Offerte */}
      {!checkIn || !checkOut ? (
        <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>{t.selectDates}</p>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: '#aaa', fontSize: 14 }}>
          <div style={{ width: 20, height: 20, border: '2px solid #eee', borderTop: '2px solid #1E73BE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          {t.loading}
        </div>
      ) : offers.length === 0 ? (
        <p style={{ fontSize: 14, color: '#9ca3af', padding: '16px 0' }}>{t.noOffers}</p>
      ) : (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#111' }}>
            {t.offersTitle} — {nights} {nights === 1 ? t.nights : t.nightsP}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offers.map(offer => {
              const isPicked = pickedOffer === offer.offerId;
              const avail = offer.unitsAvailable > 0;
              const perNight = nights > 0 ? Math.round(offer.price / nights) : 0;
              const name = OFFER_NAMES[offer.offerId]?.[locale] ?? offer.offerName;
              const desc = OFFER_DESC[offer.offerId]?.[locale];

              return (
                <button key={offer.offerId}
                  onClick={() => avail && setPicked(offer.offerId)}
                  disabled={!avail}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: 12,
                    border: `${isPicked ? '2px' : '1.5px'} solid ${isPicked ? '#1E73BE' : '#e5e7eb'}`,
                    background: isPicked ? '#EEF5FC' : '#fff',
                    cursor: avail ? 'pointer' : 'default',
                    opacity: avail ? 1 : 0.45,
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{name}</span>
                      {isPicked && <span style={{ fontSize: 11, color: '#1E73BE', fontWeight: 700, background: '#dbeafe', padding: '2px 8px', borderRadius: 10 }}>{t.selezionata}</span>}
                      {!avail && <span style={{ fontSize: 11, color: '#e74c3c' }}>{t.nonDisp}</span>}
                    </div>
                    {desc && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#666', lineHeight: 1.4 }}>{desc}</p>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1E73BE', lineHeight: 1 }}>{fmt(offer.price + touristTax)}</div>
                    {perNight > 0 && <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{fmt(perNight)}{t.perNight}</div>}
                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>{t.total}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottone Prenota */}
          <button
            onClick={handlePrenota}
            disabled={!pickedOffer}
            style={{
              width: '100%', marginTop: 16, padding: '16px',
              borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700,
              background: pickedOffer ? '#FCAF1A' : '#e0e0e0',
              color: pickedOffer ? '#fff' : '#999',
              cursor: pickedOffer ? 'pointer' : 'not-allowed',
            }}>
            {t.prenota}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

function GuestRow({ label, sub, value, min, onDec, onInc }: {
  label: string; sub: string; value: number; min: number;
  onDec: () => void; onInc: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onDec} disabled={value <= min}
          style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #ccc', background: value <= min ? '#f5f5f5' : '#fff', color: value <= min ? '#ccc' : '#333', fontSize: 18, cursor: value <= min ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          −
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{value}</span>
        <button onClick={onInc}
          style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #ccc', background: '#fff', color: '#333', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          +
        </button>
      </div>
    </div>
  );
}
