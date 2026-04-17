'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import { getAvailableRooms, getPropertyForRoom, PROPERTIES } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import type { Room } from '@/config/properties';
import type { Locale } from '@/config/i18n';

const SUPPORTED_LOCALES = ['it', 'en', 'de', 'pl'] as const;

// ─── Tipi filtro ─────────────────────────────────────────────────────────────
type FilterType = 'all' | 'priceLow' | 'priceHigh' | 'size' | 'sizeSmall';

// ─── Tipi API ────────────────────────────────────────────────────────────────
interface OfferItem { offerId: number; offerName: string; price: number; unitsAvailable: number; }
interface RoomOffers { roomId: number; propertyId: number; offers: OfferItem[]; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}
function fmt(price: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
}
function getPoolLabel(room: Room, ui: { privPool: string; sharedPool: string; noPool: string }) {
  return room.privatePool ? ui.privPool : room.sharedPool ? ui.sharedPool : ui.noPool;
}
function getLocationLabel(room: Room, ui: { nearSea: string; nature: string }) {
  const prop = getPropertyForRoom(room.roomId);
  return prop?.propertyId === 46871 ? ui.nearSea : ui.nature;
}
// Formato data compatto per box riassunto: "8 apr"
function fmtShort(ymd: string, loc: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const months = getTranslations(loc as Locale).shared.monthsShort;
  return `${dt.getDate()} ${months[dt.getMonth()]}`;
}

// ─── Floor label multilingue ─────────────────────────────────────────────────
function getFloorLabel(room: Room, loc: string): string {
  const fl = getTranslations(loc as Locale).shared.floorLabels;
  if (room.floor < 0) return fl.basement;
  if (room.floor === 0) return fl.ground;
  return `${fl.floor} ${room.floor}`;
}

function getMinPrice(ro: RoomOffers): number {
  const avail = ro.offers.filter(o => o.unitsAvailable > 0);
  if (avail.length === 0) return Infinity;
  return Math.min(...avail.map(o => o.price));
}

// ─── Componente principale ───────────────────────────────────────────────────
interface Props { locale?: string; onBack?: () => void; }

export default function WizardStep1({ locale = 'it', onBack }: Props) {
  const loc = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'it';
  const t = getTranslations(loc as Locale).components.wizardStep1;
  const sharedT = getTranslations(loc as Locale).shared;
  const OFFER_NAMES = sharedT.offerNames as Record<string, string>;
  const OFFER_DESC = sharedT.offerDescriptions as Record<string, string>;
  const router = useRouter();

  const {
    numAdult, numChild, childrenAges, checkIn, checkOut, poolPreference, setPoolPreference,
    selectedRoomId, setSelectedRoomId,
    selectedOfferId, setSelectedOfferId, setOffers,
    nextStep, prevStep,
  } = useWizardStore();

  const isSingleRoom = false;

  const [roomOffers, setRoomOffers]       = useState<RoomOffers[]>([]);
  const [coverUrls, setCoverUrls]         = useState<Record<number, string>>({});
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [pickedRoomId, setPickedRoomId]   = useState<number | null>(null);
  const [pickedOfferId, setPickedOfferId] = useState<number | null>(null);
  const [expandedRoomId, setExpandedRoomId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter]   = useState<FilterType>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all'|'monolocale'|'appartamento'|'villa'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeSeaFilter, setActiveSeaFilter] = useState<'all'|'sea'|'nature'>('all');
  const [activeBedsFilter, setActiveBedsFilter] = useState<0|1|2|3|4>(0);
  const [isDesk, setIsDesk]               = useState(false);

  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
  const childrenTaxable = (childrenAges ?? []).filter((a: number) => a >= 12).length;
  const taxableAdults   = numAdult + childrenTaxable;
  const taxableNights   = Math.min(nights, 10);
  const touristTax      = taxableNights * taxableAdults * 2;

  // ── Fetch offerte ────────────────────────────────────────────────────────
  const fetchOffers = useCallback(async () => {
    if (!checkIn || !checkOut) {
      setError('Torna indietro e seleziona le date.');
      setLoading(false); return;
    }
    setLoading(true); setError(null); setRoomOffers([]);
    try {
      let targetRoomIds: number[];
      if (isSingleRoom) {
        targetRoomIds = [];
      } else {
        const total = numAdult + numChild;
        targetRoomIds = getAvailableRooms(total, poolPreference).map(r => r.roomId);
      }
      if (targetRoomIds.length === 0) { setLoading(false); return; }

      // ⚠️ numChildren NON va passato a Beds24 — i bambini 0-2 non influenzano il prezzo.
      // I bambini 3-17 vengono contati come adulti (passano come numAdults).
      // Passare numChildren causa l'applicazione di una tariffa bambini non prevista.
      const numAdultsForBeds24 = numAdult + (childrenAges ?? []).filter((a: number) => a >= 3).length;
      const qs = new URLSearchParams({
        roomIds:   targetRoomIds.join(','),
        arrival:   checkIn,
        departure: checkOut,
        numAdults: String(numAdultsForBeds24),
      });

      const res = await fetch(`/api/offers?${qs}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      const data = await res.json();
      const list: RoomOffers[] = (data.data ?? []).filter((x: RoomOffers) => x.offers?.length > 0);
      setRoomOffers(list);
      if (typeof setOffers === 'function') setOffers(list);
    } catch (e: any) {
      setError(e.message ?? 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [checkIn, checkOut, numAdult, numChild, childrenAges, poolPreference]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  useEffect(() => {
    const check = () => setIsDesk(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Fetch cover foto ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isSingleRoom || roomOffers.length === 0) return;
    (async () => {
      const data = await fetchCoversCached();
      if (!data) return;
      const covers: Record<number, string> = {};
      for (const ro of roomOffers) {
        const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
        if (room && data[room.cloudinaryFolder]) {
          covers[ro.roomId] = data[room.cloudinaryFolder]!;
        }
      }
      setCoverUrls(covers);
    })();
  }, [roomOffers, isSingleRoom]);

  // ── Filtra e ordina ───────────────────────────────────────────────────────
  const filteredRoomOffers = (() => {
    let list = [...roomOffers];

    // Filtro distanza mare
    if (activeSeaFilter === 'sea') {
      list = list.filter(ro => ro.propertyId === 46871);
    } else if (activeSeaFilter === 'nature') {
      list = list.filter(ro => ro.propertyId === 46487);
    }

    // Filtro tipo
    if (activeTypeFilter !== 'all') {
      list = list.filter(ro => {
        const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
        return room?.type === activeTypeFilter;
      });
    }

    // Filtro camere da letto
    if (activeBedsFilter > 0) {
      list = list.filter(ro => {
        const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
        return (room?.bedrooms ?? 0) >= activeBedsFilter;
      });
    }

    // Ordina
    if (activeFilter === 'priceLow') {
      list.sort((a, b) => getMinPrice(a) - getMinPrice(b));
    } else if (activeFilter === 'priceHigh') {
      list.sort((a, b) => getMinPrice(b) - getMinPrice(a));
    } else if (activeFilter === 'size') {
      list.sort((a, b) => {
        const roomA = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === a.roomId);
        const roomB = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === b.roomId);
        return (roomB?.sqm ?? 0) - (roomA?.sqm ?? 0);
      });
    } else if (activeFilter === 'sizeSmall') {
      list.sort((a, b) => {
        const roomA = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === a.roomId);
        const roomB = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === b.roomId);
        return (roomA?.sqm ?? 0) - (roomB?.sqm ?? 0);
      });
    }

    return list;
  })();

  // ── Selezione ────────────────────────────────────────────────────────────
  function pick(rId: number, oId: number) {
    setPickedRoomId(rId);
    setPickedOfferId(oId);
    setSelectedRoomId(rId);
    setSelectedOfferId(oId);
  }
  function handleContinua() {
    if (!pickedRoomId || !pickedOfferId) return;
    nextStep();
  }
  const canContinue = !!pickedRoomId && !!pickedOfferId;

  // ── Flags disponibilità filtri ───────────────────────────────────────────
  const hasSea    = roomOffers.some(ro => ro.propertyId === 46871);
  const hasNature = roomOffers.some(ro => ro.propertyId === 46487);
  const hasSeaFilter = hasSea && hasNature;
  const hasMono   = roomOffers.some(ro => PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId)?.type === 'monolocale');
  const hasAppart = roomOffers.some(ro => PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId)?.type === 'appartamento');
  const hasVilla  = roomOffers.some(ro => PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId)?.type === 'villa');
  const hasMultipleTypes = [hasMono, hasAppart, hasVilla].filter(Boolean).length > 1;

  // Conteggio filtri attivi (per badge bottone)
  const activeFiltersCount = [
    activeFilter !== 'all' ? 1 : 0,
    activeSeaFilter !== 'all' ? 1 : 0,
    poolPreference !== 'none' ? 1 : 0,
    activeTypeFilter !== 'all' ? 1 : 0,
    activeBedsFilter > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  function resetAllFilters() {
    setActiveFilter('all');
    setActiveSeaFilter('all');
    setPoolPreference('none');
    setActiveTypeFilter('all');
    setActiveBedsFilter(0);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 2px', fontFamily: 'sans-serif' }}>

      {/* ── Box riassunto prenotazione stile Expedia ── */}
      {checkIn && checkOut && (
        <div
          className="bg-white px-3 py-3 mb-3 shadow-sm"
          style={{ border: '1.5px solid #e5e7eb', borderRadius: 14 }}
        >
          {/* Date e modifica */}
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: 16 }}>
                {fmtShort(checkIn, loc)} – {fmtShort(checkOut, loc)}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                {nights} {nights === 1 ? t.nightsSing : t.nightsPlur}
                {' · '}
                {numAdult} {locale === 'it' ? (numAdult === 1 ? 'adulto' : 'adulti') : locale === 'de' ? 'Erw.' : locale === 'pl' ? 'dorosłych' : (numAdult === 1 ? 'adult' : 'adults')}
                {numChild > 0 && (
                  <>, {numChild} {locale === 'it' ? (numChild === 1 ? 'bambino' : 'bambini') : locale === 'de' ? (numChild === 1 ? 'Kind' : 'Kinder') : locale === 'pl' ? 'dzieci' : (numChild === 1 ? 'child' : 'children')}
                  {(() => {
                    const ages = (childrenAges ?? []).slice(0, numChild).filter((a: number) => a >= 0);
                    if (ages.length !== numChild) return null;
                    const suffix = locale === 'it' || locale === 'de' ? 'a' : locale === 'pl' ? 'l' : 'y';
                    return ` (${ages.map((a: number) => `${a}${suffix}`).join(', ')})`;
                  })()}</>
                )}
              </div>
            </div>
            <button
              onClick={onBack ?? prevStep}
              className="btn p-0 d-flex align-items-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E73BE" strokeWidth="1.8">
                <path d="M11 4H4v7"/><path d="M4 4l7 7"/><path d="M20 20v-7h-7"/><path d="M20 20l-7-7"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <h2 className="fw-bold mb-3" style={{ color: '#1E73BE', fontSize: 21 }}>
        {isSingleRoom ? t.titleSingle : t.titleMulti}
      </h2>

      {/* ── Filtri ── */}
      {!isSingleRoom && !loading && !error && roomOffers.length > 0 && (
        <div className="mb-3">

          {/* Riga: bottone Filtri + chip filtri attivi */}
          <div className="d-flex align-items-center gap-2" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>

            {/* Bottone Filtri */}
            <button
              onClick={() => setShowFilterPanel(true)}
              className="d-flex align-items-center fw-semibold flex-shrink-0 rounded-pill"
              style={{
                gap: 7,
                padding: '8px 16px',
                border: activeFiltersCount > 0 ? '1.5px solid #FCAF1A' : '1.5px solid #333',
                background: activeFiltersCount > 0 ? '#FCAF1A' : '#fff',
                color: activeFiltersCount > 0 ? '#fff' : '#111',
                fontSize: 14, cursor: 'pointer',
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
              </svg>
              {t.filtriBtn}
              {activeFiltersCount > 0 && (
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.9)', color: '#B07820',
                    width: 20, height: 20,
                    fontSize: 11,
                  }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Chip filtri attivi */}
            {activeFilter !== 'all' && (
              <button onClick={() => setActiveFilter('all')} style={chipActiveStyle}>
                {activeFilter === 'priceLow' ? t.sortPriceLow : activeFilter === 'priceHigh' ? t.sortPriceHigh : activeFilter === 'size' ? t.sortBiggest : t.sortSmallest}
                <span style={{ fontSize: 15, lineHeight: 1 }}>×</span>
              </button>
            )}
            {activeSeaFilter !== 'all' && (
              <button onClick={() => setActiveSeaFilter('all')} style={chipActiveStyle}>
                {activeSeaFilter === 'sea' ? t.sea250 : t.sea2km}
                <span style={{ fontSize: 15, lineHeight: 1 }}>×</span>
              </button>
            )}
            {poolPreference !== 'none' && (
              <button onClick={() => setPoolPreference('none')} style={chipActiveStyle}>
                {poolPreference === 'private' ? t.poolPrivate : t.poolShared}
                <span style={{ fontSize: 15, lineHeight: 1 }}>×</span>
              </button>
            )}
            {activeTypeFilter !== 'all' && (
              <button onClick={() => setActiveTypeFilter('all')} style={chipActiveStyle}>
                {activeTypeFilter === 'monolocale' ? t.typeMono : activeTypeFilter === 'appartamento' ? t.typeAppart : t.typeVilla}
                <span style={{ fontSize: 15, lineHeight: 1 }}>×</span>
              </button>
            )}
            {activeBedsFilter > 0 && (
              <button onClick={() => setActiveBedsFilter(0)} style={chipActiveStyle}>
                {activeBedsFilter}+ {t.camere}
                <span style={{ fontSize: 15, lineHeight: 1 }}>×</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Panel filtri: modal su desktop, bottom sheet su mobile ── */}
      {showFilterPanel && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowFilterPanel(false)}
            className="position-fixed"
            style={{ inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }}
          />

          {/* Contenitore: centrato su desktop, bottom sheet su mobile */}
          <div
            className="position-fixed bg-white d-flex flex-column overflow-hidden"
            style={{
              zIndex: 301,
              ...(isDesk ? {
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 560, maxWidth: '90vw',
                borderRadius: 16,
                maxHeight: '85vh',
              } : {
                bottom: 0, left: 0, right: 0,
                borderRadius: '20px 20px 0 0',
                height: '85vh',
              }),
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}
          >

            {/* Header fisso */}
            <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom flex-shrink-0">
              <button
                onClick={() => setShowFilterPanel(false)}
                className="rounded-circle bg-white d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 32, height: 32, border: '1.5px solid #333', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
              <span className="fw-bold" style={{ fontSize: 16 }}>{t.filtriTitle}</span>
              <button
                onClick={resetAllFilters}
                className="btn fw-semibold text-decoration-underline"
                style={{ color: '#1E73BE', fontSize: 14 }}
              >
                {t.filtriClear}
              </button>
            </div>

            {/* Corpo scrollabile */}
            <div className="flex-fill px-3" style={{ overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>

              {/* ── 1. Ordina per ── */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>{t.sortSection}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {([
                    { key: 'all'       as FilterType, label: t.sortDefault },
                    { key: 'priceLow'  as FilterType, label: t.sortPriceLow },
                    { key: 'priceHigh' as FilterType, label: t.sortPriceHigh },
                    { key: 'size'      as FilterType, label: t.sortBiggest },
                    { key: 'sizeSmall' as FilterType, label: t.sortSmallest },
                  ]).map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveFilter(key)} style={radioRowStyle}>
                      <span style={{ fontSize: 15, color: activeFilter === key ? '#1E73BE' : '#111', fontWeight: activeFilter === key ? 600 : 400 }}>{label}</span>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${activeFilter === key ? '#1E73BE' : '#ccc'}`,
                        background: activeFilter === key ? '#1E73BE' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {activeFilter === key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={dividerStyle} />

              {/* ── 2. Distanza dal mare (solo se entrambe le proprietà disponibili) ── */}
              {hasSeaFilter && (
                <>
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>{t.seaSection}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {([
                        { key: 'all'    as const, label: t.seaAll },
                        { key: 'sea'    as const, label: t.sea250 },
                        { key: 'nature' as const, label: t.sea2km },
                      ]).map(({ key, label }) => (
                        <button key={key} onClick={() => setActiveSeaFilter(key)} style={pillStyle(activeSeaFilter === key)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={dividerStyle} />
                </>
              )}

              {/* ── 3. Piscina ── */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>{t.poolSection}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {([
                    { val: 'none'    as const, label: locale === 'it' ? 'Tutte' : locale === 'de' ? 'Tutte' : locale === 'pl' ? 'Wszystkie' : 'All' },
                    { val: 'private' as const, label: t.poolPrivate },
                    { val: 'shared'  as const, label: t.poolShared },
                  ]).map(({ val, label }) => (
                    <button key={val} onClick={() => setPoolPreference(val)} style={pillStyle(poolPreference === val)}>
                      {label}
                    </button>
                  ))}
                </div>
                {poolPreference !== 'none' && (
                  <div style={{
                    marginTop: 10, padding: '9px 12px', borderRadius: 8,
                    background: '#FFF8EC', border: '1px solid #FCAF1A',
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>🏊</span>
                    <span style={{ fontSize: 12, color: '#B07820', lineHeight: 1.5 }}>
                      {locale === 'it' ? 'La piscina è aperta indicativamente da fine maggio a metà ottobre.' :
                       locale === 'de' ? 'Der Pool ist voraussichtlich von Ende Mai bis Mitte Oktober geöffnet.' :
                       locale === 'pl' ? 'Basen jest czynny orientacyjnie od końca maja do połowy października.' :
                       'The pool is generally open from late May to mid-October.'}
                    </span>
                  </div>
                )}
              </div>

              {/* ── 4. Tipo di casa (solo se più tipi disponibili) ── */}
              {hasMultipleTypes && (
                <>
                  <div style={dividerStyle} />
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>{t.typeSection}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {([
                        { val: 'all'          as const, label: locale === 'it' ? 'Tutti' : locale === 'de' ? 'Alle' : locale === 'pl' ? 'Wszystkie' : 'All' },
                        ...(hasMono   ? [{ val: 'monolocale'   as const, label: t.typeMono }]   : []),
                        ...(hasAppart ? [{ val: 'appartamento' as const, label: t.typeAppart }] : []),
                        ...(hasVilla  ? [{ val: 'villa'        as const, label: t.typeVilla }]  : []),
                      ]).map(({ val, label }) => (
                        <button key={val} onClick={() => setActiveTypeFilter(val)} style={pillStyle(activeTypeFilter === val)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── 5. Camere da letto ── */}
              <div style={dividerStyle} />
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>{t.bedsSection}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {([
                    { val: 0 as const, label: t.bedsAny },
                    { val: 1 as const, label: '1+' },
                    { val: 2 as const, label: '2+' },
                    { val: 3 as const, label: '3+' },
                    { val: 4 as const, label: '4+' },
                  ]).map(({ val, label }) => (
                    <button key={val} onClick={() => setActiveBedsFilter(val)} style={pillStyle(activeBedsFilter === val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 24 }} />
            </div>

            {/* Footer fisso */}
            <div className="flex-shrink-0 bg-white px-3 border-top" style={{ paddingTop: 14, paddingBottom: 28 }}>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="w-100 fw-bold border-0"
                style={{ padding: 13, borderRadius: 10, background: '#FCAF1A', color: '#fff', fontSize: 15, cursor: 'pointer' }}
              >
                {t.filtriApply}{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Spinner */}
      {loading && (
        <div className="d-flex flex-column align-items-center gap-2 py-5">
          <div className="rounded-circle" style={{ width: 38, height: 38, border: '3px solid #eee', borderTop: '3px solid #1E73BE', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#888', fontSize: 13 }}>{t.loading}</span>
        </div>
      )}

      {/* Errore */}
      {!loading && error && (
        <div className="text-center mb-3 px-3 py-4" style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 12 }}>
          <p className="fw-bold mb-2" style={{ color: '#c0392b' }}>{t.errTitle}</p>
          <p className="mb-3" style={{ fontSize: 13, color: '#888' }}>{error}</p>
          {checkIn && checkOut && (
            <button onClick={fetchOffers} style={retryBtn}>{t.retry}</button>
          )}
        </div>
      )}

      {/* Nessun risultato */}
      {!loading && !error && filteredRoomOffers.length === 0 && (
        <div className="text-center mb-3 px-3 py-4" style={{ background: '#f5f5f5', borderRadius: 12 }}>
          <p className="m-0" style={{ color: '#888', fontSize: 14 }}>{t.noResults}</p>
        </div>
      )}

      {/* Lista card rooms */}
      {!loading && !error && filteredRoomOffers.length > 0 && (
        <div className="d-flex flex-column gap-3 mb-4">
          {filteredRoomOffers.map(ro => {
            const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
            if (!room) return null;
            const isRoomPicked = pickedRoomId === room.roomId;
            const coverUrl = coverUrls[room.roomId];

            return (
              <div key={room.roomId} style={{
                border: `2px solid ${isRoomPicked ? '#1E73BE' : '#e5e7eb'}`,
                borderRadius: 16, overflow: 'hidden', background: '#fff',
                boxShadow: isRoomPicked ? '0 0 0 3px rgba(30,115,190,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
              }}>

                {/* ── Layout VRBO: 3 colonne su desktop, verticale su mobile ── */}
                <div className="s5-card-row">

                  {/* COL 1: Foto — solo WizardLibero */}
                  {!isSingleRoom && (
                    <div className="s5-card-photo" style={{ background: '#f0f4f8', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                      <div
                        onClick={e => { e.stopPropagation(); router.push(`/${locale}/residenze/${room.slug}`); }}
                        style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}
                      >
                        {coverUrl ? (
                          <img src={coverUrl} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 24 }}>🏠</div>
                        )}
                      </div>
                      <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, pointerEvents: 'none' }}>
                        {getFloorLabel(room, loc)}
                      </span>
                    </div>
                  )}

                  {/* COL 2: Nome + dettagli */}
                  <div className="s5-card-details" style={{ flex: 1, minWidth: 0, padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1E73BE', marginBottom: 8 }}>{room.name}</div>
                    {isSingleRoom && <span style={{ fontSize: 11, color: '#888', background: '#f0f0f0', borderRadius: 6, padding: '2px 8px', marginBottom: 8, display: 'inline-block' }}>{room.type}</span>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={chip}>🛏️ {room.bedrooms} {t.camere}</span>
                      <span style={chip}>👥 {t.maxPers} {room.maxPeople} {t.persone}</span>
                      <span style={chip}>📐 {room.sqm} mq</span>
                      <span style={chip}>{getPoolLabel(room, t)}</span>
                      <span style={chip}>📍 {getLocationLabel(room, t)}</span>
                    </div>
                  </div>

                  {/* COL 3: Tariffe */}
                  <div className="s5-card-offers">
                    {(() => {
                      const availOffers = ro.offers.filter(o => o.unitsAvailable > 0);
                      const minOffer = availOffers.length > 0
                        ? availOffers.reduce((a, b) => a.price < b.price ? a : b)
                        : ro.offers[0];
                      const isExpanded = !isDesk || expandedRoomId === room.roomId || isRoomPicked;
                      const offersToShow = isExpanded ? ro.offers : (minOffer ? [minOffer] : ro.offers);

                      return (
                        <>
                          {offersToShow.map(offer => {
                            const isPicked = isRoomPicked && pickedOfferId === offer.offerId;
                            const perNight = nights > 0 ? Math.round(offer.price / nights) : 0;
                            const name = OFFER_NAMES[String(offer.offerId)] ?? offer.offerName;
                            const desc = OFFER_DESC[String(offer.offerId)];
                            const avail = offer.unitsAvailable > 0;
                            return (
                              <button key={offer.offerId}
                                onClick={() => avail && pick(room.roomId, offer.offerId)}
                                disabled={!avail}
                                style={{
                                  width: '100%', textAlign: 'left',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '10px 14px', marginBottom: 6, borderRadius: 10,
                                  border: isPicked ? '2px solid #1E73BE' : '1.5px solid #e5e7eb',
                                  background: isPicked ? '#EEF5FC' : '#fff',
                                  cursor: avail ? 'pointer' : 'default',
                                  opacity: avail ? 1 : 0.4, transition: 'all 0.12s',
                                }}>
                                <div style={{ flex: 1, marginRight: 10, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{name}</span>
                                    {isPicked && <span style={{ fontSize: 11, color: '#1E73BE', fontWeight: 700 }}>{t.selezionata}</span>}
                                  </div>
                                  {desc && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666', lineHeight: 1.3 }}>{desc}</p>}
                                  {!avail && <span style={{ fontSize: 11, color: '#e74c3c', display: 'block', marginTop: 2 }}>{t.nonDisp}</span>}
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 19, fontWeight: 800, color: '#1E73BE', lineHeight: 1 }}>{fmt(offer.price + touristTax)}</div>
                                  {perNight > 0 && <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{fmt(perNight)}{t.perNight}</div>}
                                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>{t.total}</div>
                                </div>
                              </button>
                            );
                          })}
                          {/* Bottone espandi/comprimi — solo desktop, solo se ci sono più tariffe */}
                          {isDesk && ro.offers.length > 1 && !isRoomPicked && (
                            <button
                              onClick={() => setExpandedRoomId(expandedRoomId === room.roomId ? null : room.roomId)}
                              style={{ width: '100%', background: 'none', border: 'none', color: '#1E73BE', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0', textAlign: 'center' }}>
                              {isExpanded
                                ? (locale === 'it' ? 'Meno tariffe ▴' : locale === 'de' ? 'Weniger ▴' : locale === 'pl' ? 'Mniej ▴' : 'Less ▴')
                                : (locale === 'it' ? `Vedi tutte le tariffe (${ro.offers.length}) ▾` : locale === 'de' ? `Alle Tarife (${ro.offers.length}) ▾` : locale === 'pl' ? `Wszystkie taryfy (${ro.offers.length}) ▾` : `View all rates (${ro.offers.length}) ▾`)}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>{/* fine s5-card-offers */}

                </div>{/* fine s5-card-row */}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA mobile */}
      {/* ← Indietro */}
      <button
        onClick={onBack ?? prevStep}
        className="btn d-block"
        style={{ color: '#1E73BE', fontSize: 14, padding: '12px 0 80px' }}
      >
        {t.indietro}
      </button>

      {/* CTA mobile sticky */}
      <div
        className="position-fixed bottom-0 start-0 end-0 bg-white border-top step1-cta-mobile"
        style={{ paddingTop: 12, paddingLeft: 16, paddingRight: 16, paddingBottom: 28, zIndex: 50 }}
      >
        <button
          onClick={handleContinua}
          disabled={!canContinue}
          className="w-100 fw-bold border-0"
          style={{
            padding: 15,
            borderRadius: 12,
            fontSize: 16,
            background: canContinue ? '#FCAF1A' : '#e0e0e0',
            color: canContinue ? '#fff' : '#999',
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          {t.continua}
        </button>
      </div>
      <style>{'@media (min-width: 768px) { .step1-cta-mobile { display: none !important; } }'}</style>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* MOBILE default: verticale */
        .s5-card-row { display: flex; flex-direction: column; }
        .s5-card-photo { width: 100%; height: 180px; }
        .s5-card-details { border-right: none; }
        .s5-card-offers { padding: 8px 12px 14px; }

        /* DESKTOP: VRBO 3 colonne */
        @media (min-width: 768px) {
          .s5-card-row { flex-direction: row; align-items: stretch; }
          .s5-card-photo { width: 220px; height: auto; min-height: 180px; }
          .s5-card-details { border-bottom: none !important; border-right: 1px solid #f0f0f0; flex: 1; }
          .s5-card-offers { width: 260px; flex-shrink: 0; padding: 16px 14px; display: flex; flex-direction: column; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

const chipActiveStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 11px', borderRadius: 20, flexShrink: 0,
  border: '1.5px solid #1E73BE', background: '#EEF5FC',
  color: '#1E73BE', fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
const sectionStyle: React.CSSProperties = {
  paddingTop: 14, paddingBottom: 10,
};
const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 10,
};
const radioRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  width: '100%', padding: '9px 0', background: 'none', border: 'none',
  borderBottom: '1px solid #f0f0f0', cursor: 'pointer', textAlign: 'left',
};
const dividerStyle: React.CSSProperties = {
  height: 1, background: '#e5e7eb',
};
const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 400,
  border: `1.5px solid ${active ? '#1E73BE' : '#e5e7eb'}`,
  background: active ? '#EEF5FC' : '#f5f5f5',
  color: active ? '#1E73BE' : '#555',
});

const chip: React.CSSProperties = {
  fontSize: 11, color: '#555', background: '#f5f5f5', borderRadius: 6, padding: '3px 8px',
};
const retryBtn: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 8, border: '1px solid #1E73BE',
  background: '#fff', color: '#1E73BE', fontSize: 14, cursor: 'pointer',
};
