'use client';

import { useState, useEffect } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { calculateTouristTax } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

interface Props {
  roomId: number;
  locale: string;
  roomName: string;
}

export default function StickyBookingBar({ roomId, locale, roomName }: Props) {
  const t = getTranslations(locale as Locale).components.stickyBookingBar;

  const { checkIn, checkOut, numAdult, numChild, childrenAges } = useWizardStore();

  // Visibilità: sempre visibile una volta che l'utente ha scrollato oltre la soglia.
  // Best practice UX (Booking.com/Airbnb/Expedia): sticky CTA bar sempre presente
  // su mobile dopo il primo scroll, per ridurre friction del "torna su per prenotare"
  // e massimizzare conversioni. La ridondanza col BookingPanel quando è a schermo
  // è accettabile: CTA identica, semplice backup visivo, l'utente non si confonde.
  const [scrolledPast, setScrolledPast] = useState(false);

  // Prezzo totale (con tassa soggiorno) — identico a BookingPanel
  const [lowestTotal, setLowestTotal] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;

  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);

  // ── Scroll threshold: appare dopo 350px (oltre la foto) ──────────────
  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > 350);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── 3. Fetch autonomo offerte (solo se ci sono date) ────────────────────
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setLowestTotal(null);
      return;
    }
    const n = calcNights(checkIn, checkOut);
    if (n <= 0) { setLowestTotal(null); return; }

    setLoadingPrice(true);

    const qs = new URLSearchParams({
      roomIds:   String(roomId),
      arrival:   checkIn,
      departure: checkOut,
      numAdults: String(numAdult + (childrenAges ?? []).filter((a: number) => a >= 3).length),
    });

    fetch(`/api/offers?${qs}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const roomData = (data.data ?? []).find((x: any) => x.roomId === roomId);
        const offers: { price: number; unitsAvailable: number }[] = roomData?.offers ?? [];
        const available = offers.filter(o => o.unitsAvailable > 0);
        if (available.length > 0) {
          const minPrice = Math.min(...available.map(o => o.price));
          // Totale = prezzo offerta + tassa soggiorno (stessa formula di BookingPanel)
          const n = calcNights(checkIn!, checkOut!);
          const cTax = (childrenAges ?? []).filter((a: number) => a >= 12).length;
          const tAdults = numAdult + cTax;
          const tNights = Math.min(n, 10);
          const tax = tNights * tAdults * 2;
          setLowestTotal(minPrice + tax);
        } else {
          setLowestTotal(null);
        }
      })
      .catch(() => setLowestTotal(null))
      .finally(() => setLoadingPrice(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, numAdult, numChild, JSON.stringify(childrenAges), roomId]);

  // ── Navigazione ──────────────────────────────────────────────────────────
  function scrollToPanel() {
    const el = document.getElementById('booking-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const show = scrolledPast;

  return (
    <div
      aria-hidden={!show}
      className={`sticky-booking-bar${show ? ' is-visible' : ''}`}
    >
      <div className="sticky-booking-bar__inner">
        {/* Sinistra: nome + prezzo */}
        <div className="sticky-booking-bar__info">
          <div className="sticky-booking-bar__name">
            {roomName}
          </div>

          {checkIn && checkOut && nights > 0 ? (
            <div className="mt-1">
              {loadingPrice ? (
                <span className="small text-muted">…</span>
              ) : lowestTotal ? (
                <>
                  <span className="sticky-booking-bar__price">
                    {fmt(lowestTotal)}
                  </span>
                  <span className="sticky-booking-bar__price-suffix">{t.totale}</span>
                </>
              ) : (
                <span className="small text-muted">
                  {nights} {nights === 1 ? t.notte : t.notti}
                </span>
              )}
            </div>
          ) : (
            <div className="small text-muted mt-1">
              {t.vediTariffe} →
            </div>
          )}
        </div>

        {/* Destra: CTA */}
        <button
          type="button"
          onClick={scrollToPanel}
          className="btn btn-warning fw-bold text-white flex-shrink-0 px-4 text-nowrap"
        >
          {t.prenota}
        </button>
      </div>
    </div>
  );
}
