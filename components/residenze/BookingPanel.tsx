'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import { calculateTouristTax } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

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
  const tr = getTranslations(locale as Locale);
  const t = tr.components.bookingPanel;
  const OFFER_NAMES = tr.shared.offerNames as Record<string, string>;
  const OFFER_DESC = tr.shared.offerDescriptions as Record<string, string>;
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
  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);
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
    setOffers([{ roomId, offers }]);
    setCurrentStep(1); // Wizard partirà da Step2 grazie a from=room
    router.push(`/${locale}/prenota?roomId=${roomId}&from=room`);
  }

  return (
    <section className="mt-5">

      {/* Ospiti */}
      <div className="mb-4 p-3 border bg-white" style={{ borderRadius: 14 }}>
        <h3 className="fs-6 fw-bold text-dark mb-3">{t.guests}</h3>
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
          <div
            className="mt-3 px-3 py-3 border"
            style={{ background: '#f9fafb', borderRadius: 10 }}
          >
            <p className="mb-2" style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
              {locale === 'it' ? 'Per mostrarti i prezzi esatti, dobbiamo conoscere l’età dei bambini.'
               : locale === 'de' ? 'Für genaue Preise benötigen wir das Alter der Kinder.'
               : locale === 'pl' ? 'Potrzebujemy znać wiek dzieci, aby pokazać dokładne ceny.'
               : 'To show exact prices, we need to know the children’s ages.'}
            </p>
            <div className="d-grid gap-2" style={{ gridTemplateColumns: numChild === 1 ? '1fr' : '1fr 1fr' }}>
              {Array.from({ length: numChild }, (_, i) => (
                <div key={i}>
                  <label className="d-block fw-semibold mb-1" style={{ fontSize: 11, color: '#6b7280' }}>
                    {locale === 'it' ? `Età bambino ${i + 1}` : locale === 'de' ? `Alter Kind ${i + 1}` : locale === 'pl' ? `Wiek dziecka ${i + 1}` : `Child ${i + 1} age`}
                  </label>
                  <select
                    value={childrenAges[i] ?? -1}
                    onChange={e => setChildAge(i, Number(e.target.value))}
                    className="form-select"
                    style={{
                      fontSize: 14,
                      borderColor: (childrenAges[i] ?? -1) < 0 ? '#f97316' : undefined,
                      borderWidth: 1.5,
                      color: (childrenAges[i] ?? -1) < 0 ? '#9ca3af' : '#111',
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
          <p className="mt-2 mb-0 text-danger" style={{ fontSize: 13 }}>
            ⚠️ Massimo {maxPeople} {maxPeople === 1 ? 'persona' : 'persone'} per questo appartamento.
          </p>
        )}
      </div>

      {/* Offerte */}
      {!checkIn || !checkOut ? (
        <p className="text-muted text-center py-3" style={{ fontSize: 14 }}>{t.selectDates}</p>
      ) : loading ? (
        <div className="d-flex align-items-center gap-2 py-3 text-muted" style={{ fontSize: 14 }}>
          <div className="rounded-circle" style={{ width: 20, height: 20, border: '2px solid #eee', borderTop: '2px solid #006CB7', animation: 'spin 0.8s linear infinite' }} />
          {t.loading}
        </div>
      ) : offers.length === 0 ? (
        <p className="text-muted py-3" style={{ fontSize: 14 }}>{t.noOffers}</p>
      ) : (
        <div>
          <h3 className="fs-6 fw-bold text-dark mb-3">
            {t.offersTitle} — {nights} {nights === 1 ? t.nights : t.nightsP}
          </h3>
          <div className="d-flex flex-column gap-2">
            {offers.map(offer => {
              const isPicked = pickedOffer === offer.offerId;
              const avail = offer.unitsAvailable > 0;
              const perNight = nights > 0 ? Math.round(offer.price / nights) : 0;
              const name = OFFER_NAMES[String(offer.offerId)] ?? offer.offerName;
              const desc = OFFER_DESC[String(offer.offerId)];

              return (
                <button key={offer.offerId}
                  onClick={() => avail && setPicked(offer.offerId)}
                  disabled={!avail}
                  className="w-100 d-flex align-items-center justify-content-between text-start px-3 py-3"
                  style={{
                    borderRadius: 12,
                    border: `${isPicked ? '2px' : '1.5px'} solid ${isPicked ? 'var(--color-primary)' : '#e5e7eb'}`,
                    background: isPicked ? '#EEF5FC' : '#fff',
                    cursor: avail ? 'pointer' : 'default',
                    opacity: avail ? 1 : 0.45,
                    transition: 'all 0.12s',
                  }}>
                  <div className="flex-fill me-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark" style={{ fontSize: 14 }}>{name}</span>
                      {isPicked && (
                        <span
                          className="fw-bold rounded-pill"
                          style={{ fontSize: 11, color: 'var(--color-primary)', background: '#dbeafe', padding: '2px 8px' }}
                        >
                          {t.selezionata}
                        </span>
                      )}
                      {!avail && <span className="text-danger" style={{ fontSize: 11 }}>{t.nonDisp}</span>}
                    </div>
                    {desc && <p className="mt-1 mb-0" style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{desc}</p>}
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div className="fw-bolder" style={{ fontSize: 20, color: 'var(--color-primary)', lineHeight: 1 }}>{fmt(offer.price + touristTax)}</div>
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
            className="w-100 mt-3 fw-bold border-0"
            style={{
              padding: 16,
              borderRadius: 12, fontSize: 16,
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
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
      <div>
        <div className="fw-medium" style={{ fontSize: 14 }}>{label}</div>
        <div className="text-muted" style={{ fontSize: 12 }}>{sub}</div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <button onClick={onDec} disabled={value <= min}
          className="rounded-circle border d-flex align-items-center justify-content-center"
          style={{ width: 'var(--touch-target)', height: 'var(--touch-target)', background: value <= min ? '#f5f5f5' : '#fff', color: value <= min ? '#ccc' : '#333', fontSize: 20, cursor: value <= min ? 'not-allowed' : 'pointer' }}>
          −
        </button>
        <span className="fw-semibold text-center" style={{ fontSize: 15, minWidth: 24 }}>{value}</span>
        <button onClick={onInc}
          className="rounded-circle border bg-white d-flex align-items-center justify-content-center"
          style={{ width: 'var(--touch-target)', height: 'var(--touch-target)', color: '#333', fontSize: 20, cursor: 'pointer' }}>
          +
        </button>
      </div>
    </div>
  );
}
