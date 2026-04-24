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
      <div className="mb-4 p-3 border bg-white booking-panel__guests-card">
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
          <div className="mt-3 px-3 py-3 border booking-panel__children-ages">
            <p className="mb-2 booking-panel__children-hint">{t.childrenHint}</p>
            <div
              className="booking-panel__children-grid"
              style={{ gridTemplateColumns: numChild === 1 ? '1fr' : '1fr 1fr' }}
            >
              {Array.from({ length: numChild }, (_, i) => (
                <div key={i}>
                  <label className="booking-panel__children-age-label">
                    {t.childAgeLabel.replace('{n}', String(i + 1))}
                  </label>
                  <select
                    value={childrenAges[i] ?? -1}
                    onChange={e => setChildAge(i, Number(e.target.value))}
                    className={`form-select booking-panel__children-age-select${(childrenAges[i] ?? -1) < 0 ? ' is-missing' : ''}`}
                  >
                    <option value={-1}>{t.selectAge}</option>
                    {Array.from({ length: 18 }, (_, age) => (
                      <option key={age} value={age}>
                        {age === 0 ? t.yearsLabel0
                         : age === 1 ? t.yearsLabel1
                         : t.yearsLabelN.replace('{n}', String(age))}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {overCapacity && (
          <p className="mt-2 mb-0 text-danger booking-panel__overcapacity-warning">
            <i className="bi bi-exclamation-triangle-fill me-1" />
            {(maxPeople === 1 ? t.maxPeopleOne : t.maxPeopleMany).replace('{n}', String(maxPeople))}
          </p>
        )}
      </div>

      {/* Offerte */}
      {!checkIn || !checkOut ? (
        <p className="text-muted text-center py-3 booking-panel__empty">{t.selectDates}</p>
      ) : loading ? (
        <div className="d-flex align-items-center gap-2 py-3 text-muted booking-panel__loading">
          <div className="wizard-loading-spinner" />
          {t.loading}
        </div>
      ) : offers.length === 0 ? (
        <p className="text-muted py-3 booking-panel__empty">{t.noOffers}</p>
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
                  className={`booking-panel__offer${isPicked ? ' is-picked' : ''}${!avail ? ' is-unavailable' : ''}`}
                >
                  <div className="flex-fill me-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="booking-panel__offer-name">{name}</span>
                      {isPicked && (
                        <span className="booking-panel__offer-pill-selected">
                          <i className="bi bi-check-lg me-1" aria-hidden="true" />
                          {t.selezionata}
                        </span>
                      )}
                      {!avail && <span className="text-danger booking-panel__offer-unavail-label">{t.nonDisp}</span>}
                    </div>
                    {desc && <p className="booking-panel__offer-desc">{desc}</p>}
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div className="booking-panel__offer-price">{fmt(offer.price + touristTax)}</div>
                    {perNight > 0 && <div className="booking-panel__offer-per-night">{fmt(perNight)}{t.perNight}</div>}
                    <div className="booking-panel__offer-total-label">{t.total}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottone Prenota */}
          <button
            onClick={handlePrenota}
            disabled={!pickedOffer}
            className="booking-panel__cta"
          >
            {t.prenota}
          </button>
        </div>
      )}
    </section>
  );
}

function GuestRow({ label, sub, value, min, onDec, onInc }: {
  label: string; sub: string; value: number; min: number;
  onDec: () => void; onInc: () => void;
}) {
  return (
    <div className="guest-row">
      <div>
        <div className="guest-row__label">{label}</div>
        <div className="guest-row__sub">{sub}</div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <button
          onClick={onDec}
          disabled={value <= min}
          className="guest-row__stepper-btn"
        >
          −
        </button>
        <span className="guest-row__counter">{value}</span>
        <button
          onClick={onInc}
          className="guest-row__stepper-btn"
        >
          +
        </button>
      </div>
    </div>
  );
}
