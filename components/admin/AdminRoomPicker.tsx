'use client';

/**
 * AdminRoomPicker — riuso visuale di WizardStep1 per l'admin del preventivo.
 *
 * Stessa UX delle card/filtri/tariffe del wizard cliente, ma senza wizard-store
 * Zustand: stato controllato via props (arrival/departure/numAdult/numChild/
 * selectedRoomId/selectedOfferId) e callback onSelect quando admin clicca
 * una tariffa.
 *
 * NON tocca WizardStep1 originale — serve a evitare regressioni in /prenota.
 * Quando si decidesse di unificare in un singolo `<RoomPicker>`, WizardStep1
 * diventerà un thin wrapper attorno a questo (o viceversa).
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailableRooms, getPropertyForRoom, PROPERTIES, calculateTouristTax, type Room } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import type { Locale } from '@/config/i18n';
import { Icon, type IconName } from '@/components/ui/Icon';

const SUPPORTED_LOCALES = ['it', 'en', 'de', 'pl'] as const;

type FilterType = 'all' | 'priceLow' | 'priceHigh' | 'size' | 'sizeSmall';
type PoolPref = 'none' | 'private' | 'shared';

interface OfferItem { offerId: number; offerName: string; price: number; unitsAvailable: number; }
interface RoomOffers { roomId: number; propertyId: number; offers: OfferItem[]; }

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}
function fmt(price: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
}
function getPoolLabel(room: Room, ui: { privPool: string; sharedPool: string; noPool: string }) {
  return room.privatePool ? ui.privPool : room.sharedPool ? ui.sharedPool : ui.noPool;
}
function getPoolIcon(room: Room): IconName {
  return room.privatePool ? 'water' : room.sharedPool ? 'water' : 'umbrella-fill';
}
function getLocationLabel(room: Room, ui: { nearSea: string; nature: string }) {
  const prop = getPropertyForRoom(room.roomId);
  return prop?.propertyId === 46871 ? ui.nearSea : ui.nature;
}
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

interface Props {
  arrival: string;       // YYYY-MM-DD
  departure: string;     // YYYY-MM-DD
  numAdult: number;
  numChild: number;
  childrenAges?: number[];
  locale?: string;
  selectedRoomId: number | null;
  selectedOfferId: number | null;
  /** Chiamata quando admin clicca una tariffa: riceve roomId + offerId + prezzo della tariffa */
  onSelect: (roomId: number, offerId: number, offerPrice: number) => void;
}

export default function AdminRoomPicker({
  arrival, departure, numAdult, numChild, childrenAges = [],
  locale = 'it',
  selectedRoomId, selectedOfferId,
  onSelect,
}: Props) {
  const loc = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'it';
  const t = getTranslations(loc as Locale).components.wizardStep1;
  const sharedT = getTranslations(loc as Locale).shared;
  const OFFER_NAMES = sharedT.offerNames as Record<string, string>;
  const OFFER_DESC = sharedT.offerDescriptions as Record<string, string>;
  const router = useRouter();

  const [poolPreference, setPoolPreference] = useState<PoolPref>('none');
  const [roomOffers, setRoomOffers] = useState<RoomOffers[]>([]);
  const [coverUrls, setCoverUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoomId, setExpandedRoomId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all'|'monolocale'|'appartamento'|'villa'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeSeaFilter, setActiveSeaFilter] = useState<'all'|'sea'|'nature'>('all');
  const [activeBedsFilter, setActiveBedsFilter] = useState<0|1|2|3|4>(0);
  const [isDesk, setIsDesk] = useState(false);

  const datesValid = !!arrival && !!departure && arrival < departure;
  const nights = datesValid ? calcNights(arrival, departure) : 0;
  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);

  const fetchOffers = useCallback(async () => {
    if (!datesValid) {
      setRoomOffers([]); setError(null); setLoading(false);
      return;
    }
    setLoading(true); setError(null); setRoomOffers([]);
    try {
      const total = numAdult + numChild;
      const targetRoomIds = getAvailableRooms(total, poolPreference).map(r => r.roomId);
      if (targetRoomIds.length === 0) { setLoading(false); return; }

      const numAdultsForBeds24 = numAdult + (childrenAges ?? []).filter((a: number) => a >= 3).length;
      const qs = new URLSearchParams({
        roomIds: targetRoomIds.join(','),
        arrival,
        departure,
        numAdults: String(numAdultsForBeds24),
      });

      const res = await fetch(`/api/offers?${qs}`);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const list: RoomOffers[] = (data.data ?? []).filter((x: RoomOffers) => x.offers?.length > 0);
      setRoomOffers(list);
    } catch (e: any) {
      setError(e.message ?? 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [arrival, departure, numAdult, numChild, childrenAges, poolPreference, datesValid]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  useEffect(() => {
    const check = () => setIsDesk(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (roomOffers.length === 0) return;
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
  }, [roomOffers]);

  // Filtri/ordinamento (copiati 1:1 da WizardStep1)
  const filteredRoomOffers = (() => {
    let list = [...roomOffers];
    if (activeSeaFilter === 'sea') list = list.filter(ro => ro.propertyId === 46871);
    else if (activeSeaFilter === 'nature') list = list.filter(ro => ro.propertyId === 46487);

    if (activeTypeFilter !== 'all') {
      list = list.filter(ro => {
        const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
        return room?.type === activeTypeFilter;
      });
    }
    if (activeBedsFilter > 0) {
      list = list.filter(ro => {
        const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
        return (room?.bedrooms ?? 0) >= activeBedsFilter;
      });
    }

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

  const hasSea = roomOffers.some(ro => ro.propertyId === 46871);
  const hasNature = roomOffers.some(ro => ro.propertyId === 46487);
  const hasSeaFilter = hasSea && hasNature;
  const hasMono = roomOffers.some(ro => PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId)?.type === 'monolocale');
  const hasAppart = roomOffers.some(ro => PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId)?.type === 'appartamento');
  const hasVilla = roomOffers.some(ro => PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId)?.type === 'villa');
  const hasMultipleTypes = [hasMono, hasAppart, hasVilla].filter(Boolean).length > 1;

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

  if (!datesValid) {
    return (
      <div className="step1-empty-state">
        Seleziona date di check-in e check-out per vedere le case disponibili.
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar filtri */}
      <div className="step1-toolbar">
        <h2 className="section-title-main section-title-main--inline step1-toolbar__title">
          {filteredRoomOffers.length > 0 && t.titleMultiCount
            ? t.titleMultiCount.replace('{count}', String(filteredRoomOffers.length))
            : t.titleMulti}
        </h2>

        {!loading && !error && roomOffers.length > 0 && (
          <div className="step1-filter-bar step1-toolbar__filters">
            <button
              onClick={() => setShowFilterPanel(true)}
              className={`step1-filter-btn${activeFiltersCount > 0 ? ' is-active' : ''}`}
            >
              <Icon name="sliders" />
              {t.filtriBtn}
              {activeFiltersCount > 0 && (
                <span className="step1-filter-btn__count">{activeFiltersCount}</span>
              )}
            </button>

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
      </div>

      {/* Filter modal */}
      {showFilterPanel && (
        <>
          <div onClick={() => setShowFilterPanel(false)} className="filter-modal__overlay" />
          <div className={`filter-modal__panel ${isDesk ? 'filter-modal__panel--centered' : 'filter-modal__panel--bottom-sheet'}`}>
            <div className="filter-modal__header">
              <button onClick={() => setShowFilterPanel(false)} className="filter-modal__close-btn" aria-label="Chiudi">×</button>
              <span className="filter-modal__header-title">{t.filtriTitle}</span>
              <button onClick={resetAllFilters} className="filter-modal__clear-btn">{t.filtriClear}</button>
            </div>

            <div className="filter-modal__body">
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
                    <button key={key} onClick={() => setActiveFilter(key)} className={`filter-modal__radio-row${activeFilter === key ? ' is-active' : ''}`}>
                      <span className="filter-modal__radio-label">{label}</span>
                      <div className="filter-modal__radio-dot">
                        {activeFilter === key && <div className="filter-modal__radio-dot-inner" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-modal__divider" />

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
                        <button key={key} onClick={() => setActiveSeaFilter(key)} className={`filter-pill${activeSeaFilter === key ? ' is-active' : ''}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-modal__divider" />
                </>
              )}

              <div className="filter-modal__section">
                <div className="filter-modal__section-title">{t.poolSection}</div>
                <div className="filter-modal__pills">
                  {([
                    { val: 'none'    as const, label: 'Tutte' },
                    { val: 'private' as const, label: t.poolPrivate },
                    { val: 'shared'  as const, label: t.poolShared },
                  ]).map(({ val, label }) => (
                    <button key={val} onClick={() => setPoolPreference(val)} className={`filter-pill${poolPreference === val ? ' is-active' : ''}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {hasMultipleTypes && (
                <>
                  <div className="filter-modal__divider" />
                  <div className="filter-modal__section">
                    <div className="filter-modal__section-title">{t.typeSection}</div>
                    <div className="filter-modal__pills">
                      {([
                        { val: 'all' as const, label: 'Tutti' },
                        ...(hasMono   ? [{ val: 'monolocale'   as const, label: t.typeMono }]   : []),
                        ...(hasAppart ? [{ val: 'appartamento' as const, label: t.typeAppart }] : []),
                        ...(hasVilla  ? [{ val: 'villa'        as const, label: t.typeVilla }]  : []),
                      ]).map(({ val, label }) => (
                        <button key={val} onClick={() => setActiveTypeFilter(val)} className={`filter-pill${activeTypeFilter === val ? ' is-active' : ''}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

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
                    <button key={val} onClick={() => setActiveBedsFilter(val)} className={`filter-pill${activeBedsFilter === val ? ' is-active' : ''}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-modal__body-spacer" />
            </div>

            <div className="filter-modal__footer">
              <button onClick={() => setShowFilterPanel(false)} className="btn btn--primary w-100">
                {t.filtriApply}{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Spinner */}
      {loading && (
        <div className="step1-loading">
          <div className="step1-loading__spinner" />
          <span className="step1-loading__label">{t.loading}</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="banner banner--error banner--stack">
          <p className="banner__title">{t.errTitle}</p>
          <p className="banner__text">{error}</p>
          <button onClick={fetchOffers} className="btn btn--secondary">{t.retry}</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredRoomOffers.length === 0 && (
        <div className="step1-empty-state">{t.noResults}</div>
      )}

      {/* Lista card */}
      {!loading && !error && filteredRoomOffers.length > 0 && (
        <div className="d-flex flex-column gap-3 mb-4">
          {filteredRoomOffers.map(ro => {
            const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
            if (!room) return null;
            const isRoomPicked = selectedRoomId === room.roomId;
            const coverUrl = coverUrls[room.roomId];

            return (
              <div key={room.roomId} className={`step1-room-card${isRoomPicked ? ' is-selected' : ''}`}>
                <div className="step1-room-card__row">

                  <div className="step1-room-card__photo">
                    <div
                      onClick={e => { e.stopPropagation(); router.push(`/${locale}/residenze/${room.slug}?from=admin-preventivo`); }}
                      className="step1-room-card__photo-link"
                    >
                      {coverUrl ? (
                        <img src={coverUrl} alt={room.name} className="step1-room-card__photo-img" loading="lazy" />
                      ) : (
                        <div className="step1-room-card__photo-placeholder">
                          <Icon name="house-fill" />
                        </div>
                      )}
                    </div>
                    <span className="badge-overlay step1-room-card__floor">
                      {getFloorLabel(room, loc)}
                    </span>
                  </div>

                  <div className="step1-room-card__details">
                    <div className="step1-room-card__name">{room.name}</div>
                    <ul className="feature-list step1-room-card__meta-chips">
                      <li className="feature-list__item">
                        <Icon name="door-closed-fill" />
                        {room.bedrooms} {t.camere}
                      </li>
                      <li className="feature-list__item">
                        <Icon name="people-fill" />
                        {t.maxPers} {room.maxPeople} {t.persone}
                      </li>
                      <li className="feature-list__item">
                        <Icon name="aspect-ratio" />
                        {room.sqm} mq
                      </li>
                      <li className="feature-list__item">
                        <Icon name={getPoolIcon(room)} />
                        {getPoolLabel(room, t)}
                      </li>
                      <li className="feature-list__item">
                        <Icon name="geo-alt-fill" />
                        {getLocationLabel(room, t)}
                      </li>
                    </ul>
                  </div>

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
                            const isPicked = isRoomPicked && selectedOfferId === offer.offerId;
                            const perNight = nights > 0 ? Math.round(offer.price / nights) : 0;
                            const name = OFFER_NAMES[String(offer.offerId)] ?? offer.offerName;
                            const desc = OFFER_DESC[String(offer.offerId)];
                            const avail = offer.unitsAvailable > 0;
                            return (
                              <button
                                key={offer.offerId}
                                onClick={() => avail && onSelect(room.roomId, offer.offerId, offer.price)}
                                disabled={!avail}
                                className={`step1-offer-option${isPicked ? ' is-selected' : ''}`}
                                type="button"
                              >
                                <div className="step1-offer-option__info">
                                  <div className="step1-offer-option__name-row">
                                    <span className="step1-offer-option__name">{name}</span>
                                    {isPicked && <span className="step1-offer-option__selected-tag" aria-hidden="true"><Icon name="check-lg" /></span>}
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
                          {isDesk && ro.offers.length > 1 && !isRoomPicked && (
                            <button
                              onClick={() => setExpandedRoomId(expandedRoomId === room.roomId ? null : room.roomId)}
                              className="step1-offer-expand-btn"
                              type="button"
                            >
                              {isExpanded
                                ? 'Meno tariffe ▴'
                                : `Vedi tutte le tariffe (${ro.offers.length}) ▾`}
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
    </div>
  );
}
