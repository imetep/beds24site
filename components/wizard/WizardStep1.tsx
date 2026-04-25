'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import { getAvailableRooms, getPropertyForRoom, PROPERTIES, calculateTouristTax } from '@/config/properties';
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
function getPoolIcon(room: Room): string {
  return room.privatePool ? 'bi-water' : room.sharedPool ? 'bi-water' : 'bi-umbrella-fill';
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
  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);

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
    <div>

      {/* ── Box riassunto prenotazione ── */}
      {checkIn && checkOut && (
        <div className="card-info card-info--compact">
          <div className="layout-row-between layout-row-between--start">
            <div>
              <div className="step1-summary__dates">
                {fmtShort(checkIn, loc)} – {fmtShort(checkOut, loc)}
              </div>
              <div className="step1-summary__meta">
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
              className="step1-summary__edit-btn"
              aria-label={t.indietro}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M11 4H4v7"/><path d="M4 4l7 7"/><path d="M20 20v-7h-7"/><path d="M20 20l-7-7"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <h2 className="section-title-main">
        {isSingleRoom ? t.titleSingle : t.titleMulti}
      </h2>

      {/* ── Filter bar ── */}
      {!isSingleRoom && !loading && !error && roomOffers.length > 0 && (
        <div className="step1-filter-bar">

          {/* Bottone apri modale */}
          <button
            onClick={() => setShowFilterPanel(true)}
            className={`step1-filter-btn${activeFiltersCount > 0 ? ' is-active' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
            </svg>
            {t.filtriBtn}
            {activeFiltersCount > 0 && (
              <span className="step1-filter-btn__count">{activeFiltersCount}</span>
            )}
          </button>

          {/* Chip filtri attivi (chiudibili) */}
          {activeFilter !== 'all' && (
            <button onClick={() => setActiveFilter('all')} className="step1-filter-chip">
              {activeFilter === 'priceLow' ? t.sortPriceLow : activeFilter === 'priceHigh' ? t.sortPriceHigh : activeFilter === 'size' ? t.sortBiggest : t.sortSmallest}
              <span className="step1-filter-chip__x">×</span>
            </button>
          )}
          {activeSeaFilter !== 'all' && (
            <button onClick={() => setActiveSeaFilter('all')} className="step1-filter-chip">
              {activeSeaFilter === 'sea' ? t.sea250 : t.sea2km}
              <span className="step1-filter-chip__x">×</span>
            </button>
          )}
          {poolPreference !== 'none' && (
            <button onClick={() => setPoolPreference('none')} className="step1-filter-chip">
              {poolPreference === 'private' ? t.poolPrivate : t.poolShared}
              <span className="step1-filter-chip__x">×</span>
            </button>
          )}
          {activeTypeFilter !== 'all' && (
            <button onClick={() => setActiveTypeFilter('all')} className="step1-filter-chip">
              {activeTypeFilter === 'monolocale' ? t.typeMono : activeTypeFilter === 'appartamento' ? t.typeAppart : t.typeVilla}
              <span className="step1-filter-chip__x">×</span>
            </button>
          )}
          {activeBedsFilter > 0 && (
            <button onClick={() => setActiveBedsFilter(0)} className="step1-filter-chip">
              {activeBedsFilter}+ {t.camere}
              <span className="step1-filter-chip__x">×</span>
            </button>
          )}
        </div>
      )}

      {/* ── Filter modal (bottom-sheet mobile / centered desktop) ── */}
      {showFilterPanel && (
        <>
          <div
            onClick={() => setShowFilterPanel(false)}
            className="filter-modal__overlay"
          />
          <div className={`filter-modal__panel ${isDesk ? 'filter-modal__panel--centered' : 'filter-modal__panel--bottom-sheet'}`}>

            {/* Header fisso */}
            <div className="filter-modal__header">
              <button
                onClick={() => setShowFilterPanel(false)}
                className="filter-modal__close-btn"
                aria-label="Chiudi"
              >
                ×
              </button>
              <span className="filter-modal__header-title">{t.filtriTitle}</span>
              <button onClick={resetAllFilters} className="filter-modal__clear-btn">
                {t.filtriClear}
              </button>
            </div>

            {/* Corpo scrollabile */}
            <div className="filter-modal__body">

              {/* 1. Ordina per — radio list */}
              <div className="filter-modal__section">
                <div className="filter-modal__section-title">{t.sortSection}</div>
                <div>
                  {([
                    { key: 'all'       as FilterType, label: t.sortDefault },
                    { key: 'priceLow'  as FilterType, label: t.sortPriceLow },
                    { key: 'priceHigh' as FilterType, label: t.sortPriceHigh },
                    { key: 'size'      as FilterType, label: t.sortBiggest },
                    { key: 'sizeSmall' as FilterType, label: t.sortSmallest },
                  ]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`filter-modal__radio-row${activeFilter === key ? ' is-active' : ''}`}
                    >
                      <span className="filter-modal__radio-label">{label}</span>
                      <div className="filter-modal__radio-dot">
                        {activeFilter === key && <div className="filter-modal__radio-dot-inner" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-modal__divider" />

              {/* 2. Distanza mare (opzionale) */}
              {hasSeaFilter && (
                <>
                  <div className="filter-modal__section">
                    <div className="filter-modal__section-title">{t.seaSection}</div>
                    <div className="filter-modal__pills">
                      {([
                        { key: 'all'    as const, label: t.seaAll },
                        { key: 'sea'    as const, label: t.sea250 },
                        { key: 'nature' as const, label: t.sea2km },
                      ]).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setActiveSeaFilter(key)}
                          className={`filter-pill${activeSeaFilter === key ? ' is-active' : ''}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-modal__divider" />
                </>
              )}

              {/* 3. Piscina */}
              <div className="filter-modal__section">
                <div className="filter-modal__section-title">{t.poolSection}</div>
                <div className="filter-modal__pills">
                  {([
                    { val: 'none'    as const, label: locale === 'it' ? 'Tutte' : locale === 'de' ? 'Tutte' : locale === 'pl' ? 'Wszystkie' : 'All' },
                    { val: 'private' as const, label: t.poolPrivate },
                    { val: 'shared'  as const, label: t.poolShared },
                  ]).map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setPoolPreference(val)}
                      className={`filter-pill${poolPreference === val ? ' is-active' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {poolPreference !== 'none' && (
                  <div className="banner banner--accent banner--with-icon">
                    <i className="bi bi-water" aria-hidden="true" />
                    <span>
                      {locale === 'it' ? 'La piscina è aperta indicativamente da fine maggio a metà ottobre.' :
                       locale === 'de' ? 'Der Pool ist voraussichtlich von Ende Mai bis Mitte Oktober geöffnet.' :
                       locale === 'pl' ? 'Basen jest czynny orientacyjnie od końca maja do połowy października.' :
                       'The pool is generally open from late May to mid-October.'}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Tipo di casa (opzionale) */}
              {hasMultipleTypes && (
                <>
                  <div className="filter-modal__divider" />
                  <div className="filter-modal__section">
                    <div className="filter-modal__section-title">{t.typeSection}</div>
                    <div className="filter-modal__pills">
                      {([
                        { val: 'all'          as const, label: locale === 'it' ? 'Tutti' : locale === 'de' ? 'Alle' : locale === 'pl' ? 'Wszystkie' : 'All' },
                        ...(hasMono   ? [{ val: 'monolocale'   as const, label: t.typeMono }]   : []),
                        ...(hasAppart ? [{ val: 'appartamento' as const, label: t.typeAppart }] : []),
                        ...(hasVilla  ? [{ val: 'villa'        as const, label: t.typeVilla }]  : []),
                      ]).map(({ val, label }) => (
                        <button
                          key={val}
                          onClick={() => setActiveTypeFilter(val)}
                          className={`filter-pill${activeTypeFilter === val ? ' is-active' : ''}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 5. Camere da letto */}
              <div className="filter-modal__divider" />
              <div className="filter-modal__section">
                <div className="filter-modal__section-title">{t.bedsSection}</div>
                <div className="filter-modal__pills">
                  {([
                    { val: 0 as const, label: t.bedsAny },
                    { val: 1 as const, label: '1+' },
                    { val: 2 as const, label: '2+' },
                    { val: 3 as const, label: '3+' },
                    { val: 4 as const, label: '4+' },
                  ]).map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setActiveBedsFilter(val)}
                      className={`filter-pill${activeBedsFilter === val ? ' is-active' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-modal__body-spacer" />
            </div>

            {/* Footer fisso */}
            <div className="filter-modal__footer">
              <button
                onClick={() => setShowFilterPanel(false)}
                className="btn btn--primary w-100"
              >
                {t.filtriApply}{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Spinner ── */}
      {loading && (
        <div className="step1-loading">
          <div className="step1-loading__spinner" />
          <span className="step1-loading__label">{t.loading}</span>
        </div>
      )}

      {/* ── Errore ── */}
      {!loading && error && (
        <div className="banner banner--error banner--stack">
          <p className="banner__title">{t.errTitle}</p>
          <p className="banner__text">{error}</p>
          {checkIn && checkOut && (
            <button onClick={fetchOffers} className="btn btn--secondary">{t.retry}</button>
          )}
        </div>
      )}

      {/* ── Nessun risultato ── */}
      {!loading && !error && filteredRoomOffers.length === 0 && (
        <div className="step1-empty-state">{t.noResults}</div>
      )}

      {/* ── Lista card rooms ── */}
      {!loading && !error && filteredRoomOffers.length > 0 && (
        <div className="d-flex flex-column gap-3 mb-4">
          {filteredRoomOffers.map(ro => {
            const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
            if (!room) return null;
            const isRoomPicked = pickedRoomId === room.roomId;
            const coverUrl = coverUrls[room.roomId];

            return (
              <div key={room.roomId} className={`step1-room-card${isRoomPicked ? ' is-selected' : ''}`}>
                <div className="step1-room-card__row">

                  {/* COL 1: Foto (solo multi-room) */}
                  {!isSingleRoom && (
                    <div className="step1-room-card__photo">
                      <div
                        onClick={e => { e.stopPropagation(); router.push(`/${locale}/residenze/${room.slug}?from=wizard`); }}
                        className="step1-room-card__photo-link"
                      >
                        {coverUrl ? (
                          <img src={coverUrl} alt={room.name} className="step1-room-card__photo-img" loading="lazy" />
                        ) : (
                          <div className="step1-room-card__photo-placeholder">
                            <i className="bi bi-house-fill" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <span className="badge-overlay step1-room-card__floor">
                        {getFloorLabel(room, loc)}
                      </span>
                    </div>
                  )}

                  {/* COL 2: Nome + dettagli */}
                  <div className="step1-room-card__details">
                    <div className="step1-room-card__name">{room.name}</div>
                    {isSingleRoom && <span className="badge-feature">{room.type}</span>}
                    <div className="step1-room-card__meta-chips">
                      <span className="badge-feature">
                        <i className="bi bi-door-closed-fill me-1" aria-hidden="true" />
                        {room.bedrooms} {t.camere}
                      </span>
                      <span className="badge-feature">
                        <i className="bi bi-people-fill me-1" aria-hidden="true" />
                        {t.maxPers} {room.maxPeople} {t.persone}
                      </span>
                      <span className="badge-feature">
                        <i className="bi bi-aspect-ratio me-1" aria-hidden="true" />
                        {room.sqm} mq
                      </span>
                      <span className="badge-feature">
                        <i className={`bi ${getPoolIcon(room)} me-1`} aria-hidden="true" />
                        {getPoolLabel(room, t)}
                      </span>
                      <span className="badge-feature">
                        <i className="bi bi-geo-alt-fill me-1" aria-hidden="true" />
                        {getLocationLabel(room, t)}
                      </span>
                    </div>
                  </div>

                  {/* COL 3: Tariffe */}
                  <div className="step1-room-card__offers">
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
                              <button
                                key={offer.offerId}
                                onClick={() => avail && pick(room.roomId, offer.offerId)}
                                disabled={!avail}
                                className={`step1-offer-option${isPicked ? ' is-selected' : ''}`}
                              >
                                <div className="step1-offer-option__info">
                                  <div className="step1-offer-option__name-row">
                                    <span className="step1-offer-option__name">{name}</span>
                                    {isPicked && <span className="step1-offer-option__selected-tag" aria-hidden="true"><i className="bi bi-check-lg" /></span>}
                                  </div>
                                  {desc && <p className="step1-offer-option__desc">{desc}</p>}
                                  {!avail && <span className="step1-offer-option__unavail">{t.nonDisp}</span>}
                                </div>
                                <div className="step1-offer-option__price-col">
                                  <div className="step1-offer-option__price">{fmt(offer.price + touristTax)}</div>
                                  {perNight > 0 && <div className="step1-offer-option__per-night">{fmt(perNight)}{t.perNight}</div>}
                                  <div className="step1-offer-option__total-label">{t.total}</div>
                                </div>
                              </button>
                            );
                          })}
                          {/* Espandi/comprimi — solo desktop, se più tariffe */}
                          {isDesk && ro.offers.length > 1 && !isRoomPicked && (
                            <button
                              onClick={() => setExpandedRoomId(expandedRoomId === room.roomId ? null : room.roomId)}
                              className="step1-offer-expand-btn"
                            >
                              {isExpanded
                                ? (locale === 'it' ? 'Meno tariffe ▴' : locale === 'de' ? 'Weniger ▴' : locale === 'pl' ? 'Mniej ▴' : 'Less ▴')
                                : (locale === 'it' ? `Vedi tutte le tariffe (${ro.offers.length}) ▾` : locale === 'de' ? `Alle Tarife (${ro.offers.length}) ▾` : locale === 'pl' ? `Wszystkie taryfy (${ro.offers.length}) ▾` : `View all rates (${ro.offers.length}) ▾`)}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Indietro ── */}
      <button onClick={onBack ?? prevStep} className="step1-back-link">
        {t.indietro}
      </button>

      {/* ── CTA mobile sticky ── */}
      <div className="layout-sticky-mobile-bar">
        <button
          onClick={handleContinua}
          disabled={!canContinue}
          className="btn btn--primary w-100"
        >
          {t.continua}
        </button>
      </div>
    </div>
  );
}
