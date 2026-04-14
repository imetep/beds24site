'use client';

import { useState, useEffect, useRef } from 'react';
import { useWizardStore } from '@/store/wizard-store';

const UI: Record<string, {
  prenota: string;
  vediTariffe: string;
  perNotte: string;
  notti: string;
  notte: string;
  totale: string;
}> = {
  it: { prenota: 'Prenota ora', vediTariffe: 'Vedi tariffe', perNotte: '/notte', notti: 'notti', notte: 'notte', totale: 'totale'  },
  en: { prenota: 'Book now',    vediTariffe: 'See rates',    perNotte: '/night', notti: 'nights', notte: 'night', totale: 'total'   },
  de: { prenota: 'Jetzt buchen',vediTariffe: 'Tarife sehen', perNotte: '/Nacht', notti: 'Nächte', notte: 'Nacht', totale: 'gesamt'  },
  pl: { prenota: 'Zarezerwuj',  vediTariffe: 'Zobacz taryfy',perNotte: '/noc',  notti: 'nocy',   notte: 'noc',   totale: 'łącznie' },
};

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
  const t = UI[locale] ?? UI.it;

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
      style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     200,
        transform:  show ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.25s ease',
        pointerEvents: show ? 'auto' : 'none',
        background: '#fff',
        borderTop:  '1px solid #e5e7eb',
        boxShadow:  '0 -4px 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* Contenuto centrato, maxWidth coerente con il main */}
      <div style={{
        maxWidth:       1100,
        margin:         '0 auto',
        padding:        '12px 16px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            12,
      }}>

        {/* Sinistra: nome + prezzo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize:     13,
            fontWeight:   700,
            color:        '#111',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {roomName}
          </div>

          {checkIn && checkOut && nights > 0 ? (
            <div style={{ marginTop: 2 }}>
              {loadingPrice ? (
                <span style={{ color: '#aaa', fontSize: 13 }}>…</span>
              ) : lowestTotal ? (
                <>
                  <span style={{ fontWeight: 800, color: '#1E73BE', fontSize: 17 }}>
                    {fmt(lowestTotal)}
                  </span>
                  <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>
                    {t.totale}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 12, color: '#aaa' }}>
                  {nights} {nights === 1 ? t.notte : t.notti}
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
              {t.vediTariffe} →
            </div>
          )}
        </div>

        {/* Destra: CTA */}
        <button
          onClick={scrollToPanel}
          style={{
            flexShrink:   0,
            padding:      '11px 22px',
            borderRadius: 12,
            border:       'none',
            background:   '#FCAF1A',
            color:        '#fff',
            fontSize:     15,
            fontWeight:   700,
            cursor:       'pointer',
            whiteSpace:   'nowrap',
            boxShadow:    '0 2px 8px rgba(252,175,26,0.35)',
          }}
        >
          {t.prenota}
        </button>
      </div>
    </div>
  );
}
