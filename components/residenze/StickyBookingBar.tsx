'use client';

import { useState, useEffect, useRef } from 'react';
import { useWizardStore } from '@/store/wizard-store';
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

  // Visibilità: true solo se l'utente ha scrollato oltre la soglia
  // E il #booking-panel NON è visibile a schermo
  const [scrolledPast, setScrolledPast]   = useState(false);
  const [panelVisible, setPanelVisible]   = useState(false);

  // Prezzo totale (con tassa soggiorno) — identico a BookingPanel
  const [lowestTotal, setLowestTotal] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;

  // Tassa di soggiorno — stessa formula di BookingPanel
  const childrenTaxable = (childrenAges ?? []).filter((a: number) => a >= 12).length;
  const taxableAdults   = numAdult + childrenTaxable;
  const taxableNights   = Math.min(nights, 10);
  const touristTax      = taxableNights * taxableAdults * 2;

  // ── 1. Scroll threshold: appare dopo 350px (oltre la foto) ──────────────
  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > 350);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── 2. IntersectionObserver: si nasconde quando #booking-panel è visibile
  useEffect(() => {
    const target = document.getElementById('booking-panel');
    if (!target) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPanelVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(target);
    return () => obs.disconnect();
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

  const show = scrolledPast && !panelVisible;

  return (
    <div
      aria-hidden={!show}
      className="position-fixed start-0 end-0 bottom-0 bg-white border-top shadow-lg"
      style={{
        zIndex: 200,
        transform: show ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.25s ease',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <div
        className="container d-flex align-items-center justify-content-between gap-2 px-3 py-2"
        style={{ maxWidth: 1100 }}
      >
        {/* Sinistra: nome + prezzo */}
        <div className="flex-fill" style={{ minWidth: 0 }}>
          <div className="fw-bold text-truncate" style={{ fontSize: 13 }}>
            {roomName}
          </div>

          {checkIn && checkOut && nights > 0 ? (
            <div className="mt-1">
              {loadingPrice ? (
                <span className="small text-muted">…</span>
              ) : lowestTotal ? (
                <>
                  <span className="fw-bold text-primary" style={{ fontSize: 17 }}>
                    {fmt(lowestTotal)}
                  </span>
                  <span className="ms-1 small text-muted">{t.totale}</span>
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
