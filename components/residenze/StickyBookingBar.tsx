'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  // Visibile solo se l'utente arriva dal wizard (?from=wizard); da link diretto
  // sarebbe rumore (l'utente non è ancora in flusso prenotazione).
  const fromWizard = searchParams.get('from') === 'wizard';

  const {
    checkIn, checkOut, numAdult, numChild, childrenAges,
    selectedRoomId, selectedOfferId, cachedOffers,
  } = useWizardStore();

  // Soglia scroll: la barra entra dopo che l'utente ha superato l'hero foto.
  const [scrolledPast, setScrolledPast] = useState(false);

  // Prezzo fallback (lowest) quando l'utente non ha ancora scelto un'offerta.
  const [lowestTotal, setLowestTotal] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);

  // Stato 3-vie: l'utente ha già scelto un'offerta per QUESTA stanza?
  const hasPickedOffer = selectedRoomId === roomId && selectedOfferId !== null;
  const pickedOffer = hasPickedOffer
    ? cachedOffers
        ?.find((ro: any) => ro.roomId === roomId)
        ?.offers
        ?.find((o: any) => o.offerId === selectedOfferId) ?? null
    : null;
  const pickedTotal = pickedOffer ? pickedOffer.price + touristTax : null;
  const displayTotal = pickedTotal ?? lowestTotal;

  // ── Scroll threshold: appare dopo 350px (oltre la foto) ──────────────
  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > 350);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Fetch lowest price (skippato se la barra è nascosta o offerta già scelta)
  useEffect(() => {
    if (!fromWizard || hasPickedOffer || !checkIn || !checkOut) {
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
          setLowestTotal(minPrice + touristTax);
        } else {
          setLowestTotal(null);
        }
      })
      .catch(() => setLowestTotal(null))
      .finally(() => setLoadingPrice(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromWizard, hasPickedOffer, checkIn, checkOut, numAdult, numChild, JSON.stringify(childrenAges), roomId]);

  // ── CTA action: dipende dallo stato ─────────────────────────────────────
  function handleCta() {
    if (hasPickedOffer) {
      // Offerta scelta → salta direttamente al wizard step 2
      router.push(`/${locale}/prenota?roomId=${roomId}&from=room`);
    } else {
      // Offerta non scelta → scrolla al BookingPanel per farla scegliere
      const el = document.getElementById('booking-panel');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Da link diretto: niente barra (vedi commento all'inizio).
  if (!fromWizard) return null;

  const show = scrolledPast;
  const ctaLabel = hasPickedOffer ? t.prenota : t.vediTariffe;

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
              ) : displayTotal ? (
                <>
                  <span className="sticky-booking-bar__price">
                    {fmt(displayTotal)}
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
          onClick={handleCta}
          className="btn btn-warning fw-bold text-white flex-shrink-0 px-4 text-nowrap"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
