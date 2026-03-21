'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { getAvailableRooms, getPropertyForRoom, PROPERTIES } from '@/config/properties';
import type { Room } from '@/config/properties';

// ─── Offer IDs fissi LivingApple ─────────────────────────────────────────────
const OFFER_NAMES: Record<number, Record<string, string>> = {
  1: { it:'Non Rimborsabile',          en:'Non-Refundable',         de:'Nicht erstattungsfähig',    pl:'Bezzwrotna' },
  2: { it:'Parzialmente Rimborsabile', en:'Partially Refundable',   de:'Teilw. erstattungsfähig',   pl:'Częściowo zwrotna' },
  3: { it:'Flessibile 60 gg',          en:'Flexible 60 days',       de:'Flexibel 60 Tage',          pl:'Elastyczna 60 dni' },
  4: { it:'Flessibile 45 gg',          en:'Flexible 45 days',       de:'Flexibel 45 Tage',          pl:'Elastyczna 45 dni' },
  5: { it:'Flessibile 30 gg',          en:'Flexible 30 days',       de:'Flexibel 30 Tage',          pl:'Elastyczna 30 dni' },
  6: { it:'Flessibile 5 gg',           en:'Flexible 5 days',        de:'Flexibel 5 Tage',           pl:'Elastyczna 5 dni' },
};
const OFFER_DESC: Record<number, Record<string, string>> = {
  1: { it:'Paghi tutto entro 48h dalla prenotazione.',       en:'Pay in full within 48h of booking.',                de:'Vollzahlung innerhalb 48h nach Buchung.',          pl:'Płatność w całości w ciągu 48h.' },
  2: { it:"Paghi 50% ora, il saldo all'arrivo.",             en:'Pay 50% now, balance at arrival.',                  de:'50% jetzt, Rest bei Ankunft.',                     pl:'50% teraz, reszta przy przyjeździe.' },
  3: { it:"Cancellazione gratuita entro 60 gg dall'arrivo.", en:'Free cancellation up to 60 days before arrival.',   de:'Kostenlose Stornierung bis 60 Tage vor Ankunft.',  pl:'Bezpłatne anulowanie do 60 dni przed przyjazdem.' },
  4: { it:"Cancellazione gratuita entro 45 gg dall'arrivo.", en:'Free cancellation up to 45 days before arrival.',   de:'Kostenlose Stornierung bis 45 Tage vor Ankunft.',  pl:'Bezpłatne anulowanie do 45 dni przed przyjazdem.' },
  5: { it:"Cancellazione gratuita entro 30 gg dall'arrivo.", en:'Free cancellation up to 30 days before arrival.',   de:'Kostenlose Stornierung bis 30 Tage vor Ankunft.',  pl:'Bezpłatne anulowanie do 30 dni przed przyjazdem.' },
  6: { it:"Cancellazione gratuita entro 5 gg dall'arrivo.",  en:'Free cancellation up to 5 days before arrival.',    de:'Kostenlose Stornierung bis 5 Tage vor Ankunft.',   pl:'Bezpłatne anulowanie do 5 dni przed przyjazdem.' },
};

// ─── Traduzioni UI ────────────────────────────────────────────────────────────
const UI: Record<string, Record<string, string>> = {
  it: {
    titleSingle:'Quale tariffa preferite?',
    titleMulti: 'Scegli appartamento e tariffa',
    loading: 'Ricerca prezzi e disponibilità...',
    noResults: 'Nessun appartamento disponibile per le date selezionate.',
    nightsSing: 'notte', nightsPlur: 'notti',
    perNight: '/notte', total: 'totale',
    continua: 'Continua →', indietro: '← Indietro',
    errTitle: 'Errore caricamento prezzi', retry: 'Riprova',
    camere: 'camere', maxPers: 'max', persone: 'pers.',
    privPool: '🏊 Piscina privata', sharedPool: '🌊 Piscina condivisa', noPool: '🏖️ 250m dal mare',
    nearSea: 'Vicino al mare', nature: 'Immerso nella natura',
    nonDisp: 'Non disponibile', selezionata: '✓',
    // Filtri
    filterAll:        'Tutti',
    filterPriceLow:   'Prezzo ↑',
    filterPriceHigh:  'Prezzo ↓',
    filterSize:       'Più grande',
    filterSea:        '250m mare',
    filterNature:     '2km mare',
    // Desktop dropdown labels
    filterAllLong:        'Predefinito',
    filterPriceLowLong:   'Prezzo più basso',
    filterPriceHighLong:  'Prezzo più alto',
    filterSizeLong:       'Più grande (mq)',
    filterSeaLong:        '250m dal mare',
    filterNatureLong:     '2km dal mare',
    filterAllClean: 'Tutti', filterPriceClean: 'Prezzo', filterSizeClean: 'Più grande', filterSeaClean: '250m dal mare', filterNatureClean: '2km dal mare',
  },
  en: {
    titleSingle:'Which rate do you prefer?',
    titleMulti: 'Choose apartment and rate',
    loading: 'Searching prices and availability...',
    noResults: 'No apartments available for the selected dates.',
    nightsSing: 'night', nightsPlur: 'nights',
    perNight: '/night', total: 'total',
    continua: 'Continue →', indietro: '← Back',
    errTitle: 'Error loading prices', retry: 'Retry',
    camere: 'bd', maxPers: 'max', persone: 'pax',
    privPool: '🏊 Private pool', sharedPool: '🌊 Shared pool', noPool: '🏖️ 250m from sea',
    nearSea: 'Near the sea', nature: 'In nature',
    nonDisp: 'Unavailable', selezionata: '✓',
    filterAll:        'All',
    filterPriceLow:   'Price ↑',
    filterPriceHigh:  'Price ↓',
    filterSize:       'Largest',
    filterSea:        '250m sea',
    filterNature:     '2km sea',
    filterAllLong:        'Default',
    filterPriceLowLong:   'Lowest price',
    filterPriceHighLong:  'Highest price',
    filterSizeLong:       'Largest (sqm)',
    filterSeaLong:        '250m from sea',
    filterNatureLong:     '2km from sea',
    filterAllClean: 'All', filterPriceClean: 'Price', filterSizeClean: 'Largest', filterSeaClean: '250m from sea', filterNatureClean: '2km from sea',
  },
  de: {
    titleSingle:'Welchen Tarif bevorzugen Sie?',
    titleMulti: 'Unterkunft und Tarif wählen',
    loading: 'Preise und Verfügbarkeit suchen...',
    noResults: 'Keine Unterkünfte für die gewählten Daten verfügbar.',
    nightsSing: 'Nacht', nightsPlur: 'Nächte',
    perNight: '/Nacht', total: 'gesamt',
    continua: 'Weiter →', indietro: '← Zurück',
    errTitle: 'Fehler beim Laden', retry: 'Wiederholen',
    camere: 'Zi.', maxPers: 'max', persone: 'Pers.',
    privPool: '🏊 Privater Pool', sharedPool: '🌊 Gemeinsch.pool', noPool: '🏖️ 250m vom Meer',
    nearSea: 'Meeresnähe', nature: 'In der Natur',
    nonDisp: 'Nicht verfügbar', selezionata: '✓',
    filterAll:        'Alle',
    filterPriceLow:   'Preis ↑',
    filterPriceHigh:  'Preis ↓',
    filterSize:       'Größte',
    filterSea:        '250m Meer',
    filterNature:     '2km Meer',
    filterAllLong:        'Standard',
    filterPriceLowLong:   'Günstigster Preis',
    filterPriceHighLong:  'Höchster Preis',
    filterSizeLong:       'Größte (qm)',
    filterSeaLong:        '250m vom Meer',
    filterNatureLong:     '2km vom Meer',
    filterAllClean: 'Alle', filterPriceClean: 'Preis', filterSizeClean: 'Größte', filterSeaClean: '250m vom Meer', filterNatureClean: '2km vom Meer',
  },
  pl: {
    titleSingle:'Którą taryfę preferujecie?',
    titleMulti: 'Wybierz apartament i taryfę',
    loading: 'Wyszukiwanie cen i dostępności...',
    noResults: 'Brak dostępnych apartamentów dla wybranych dat.',
    nightsSing: 'noc', nightsPlur: 'nocy',
    perNight: '/noc', total: 'łącznie',
    continua: 'Dalej →', indietro: '← Wstecz',
    errTitle: 'Błąd ładowania cen', retry: 'Ponów',
    camere: 'sypialnie', maxPers: 'maks', persone: 'os.',
    privPool: '🏊 Prywatny basen', sharedPool: '🌊 Wspólny basen', noPool: '🏖️ 250m od morza',
    nearSea: 'Blisko morza', nature: 'Wśród natury',
    nonDisp: 'Niedostępne', selezionata: '✓',
    filterAll:        'Wszystkie',
    filterPriceLow:   'Cena ↑',
    filterPriceHigh:  'Cena ↓',
    filterSize:       'Największy',
    filterSea:        '250m morze',
    filterNature:     '2km morze',
    filterAllLong:        'Domyślne',
    filterPriceLowLong:   'Najniższa cena',
    filterPriceHighLong:  'Najwyższa cena',
    filterSizeLong:       'Największy (mkw)',
    filterSeaLong:        '250m od morza',
    filterNatureLong:     '2km od morza',
    filterAllClean: 'Wszystkie', filterPriceClean: 'Cena', filterSizeClean: 'Największy', filterSeaClean: '250m od morza', filterNatureClean: '2km od morza',
  },
};

// ─── Tipi filtro ─────────────────────────────────────────────────────────────
type FilterType = 'all' | 'priceLow' | 'priceHigh' | 'size' | 'sea' | 'nature';

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
function getPoolLabel(room: Room, ui: Record<string, string>) {
  return room.privatePool ? ui.privPool : room.sharedPool ? ui.sharedPool : ui.noPool;
}
function getLocationLabel(room: Room, ui: Record<string, string>) {
  const prop = getPropertyForRoom(room.roomId);
  return prop?.propertyId === 46871 ? ui.nearSea : ui.nature;
}
function getMinPrice(ro: RoomOffers): number {
  const avail = ro.offers.filter(o => o.unitsAvailable > 0);
  if (avail.length === 0) return Infinity;
  return Math.min(...avail.map(o => o.price));
}

// ─── Componente principale ───────────────────────────────────────────────────
interface Props { locale?: string; roomId?: number | null; }

export default function WizardStep5({ locale = 'it', roomId: roomIdProp }: Props) {
  const t = UI[locale] ?? UI.it;
  const loc = locale in UI ? locale : 'it';

  const {
    numAdult, numChild, childrenAges, checkIn, checkOut, poolPreference,
    selectedRoomId, setSelectedRoomId,
    selectedOfferId, setSelectedOfferId, setOffers,
    nextStep, prevStep,
  } = useWizardStore();

  const roomId = roomIdProp ?? selectedRoomId;
  const isSingleRoom = !!roomId;

  const [roomOffers, setRoomOffers]       = useState<RoomOffers[]>([]);
  const [coverUrls, setCoverUrls]         = useState<Record<number, string>>({});
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [pickedRoomId, setPickedRoomId]   = useState<number | null>(roomId ?? null);
  const [pickedOfferId, setPickedOfferId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter]   = useState<FilterType>('all');

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
        targetRoomIds = [roomId!];
      } else {
        const total = numAdult + numChild;
        targetRoomIds = getAvailableRooms(total, poolPreference).map(r => r.roomId);
      }
      if (targetRoomIds.length === 0) { setLoading(false); return; }

      const qs = new URLSearchParams({
        roomIds:     targetRoomIds.join(','),
        arrival:     checkIn,
        departure:   checkOut,
        numAdults:   String(numAdult),
        numChildren: String((childrenAges ?? []).filter((a: number) => a >= 3).length),
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
  }, [roomId, checkIn, checkOut, numAdult, numChild, poolPreference, isSingleRoom]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  // ── Fetch cover foto ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isSingleRoom || roomOffers.length === 0) return;
    (async () => {
      const res = await fetch('/api/cloudinary?covers=true').catch(() => null);
      if (!res?.ok) return;
      const data = await res.json();
      const covers: Record<number, string> = {};
      for (const ro of roomOffers) {
        const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
        if (room && data.covers?.[room.cloudinaryFolder]) {
          covers[ro.roomId] = data.covers[room.cloudinaryFolder];
        }
      }
      setCoverUrls(covers);
    })();
  }, [roomOffers, isSingleRoom]);

  // ── Filtra e ordina ───────────────────────────────────────────────────────
  const filteredRoomOffers = (() => {
    let list = [...roomOffers];

    // Filtro posizione
    if (activeFilter === 'sea') {
      list = list.filter(ro => ro.propertyId === 46871);
    } else if (activeFilter === 'nature') {
      list = list.filter(ro => ro.propertyId === 46487);
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

  // ── Filtri disponibili (solo in WizardLibero) ────────────────────────────
  const hasSea    = roomOffers.some(ro => ro.propertyId === 46871);
  const hasNature = roomOffers.some(ro => ro.propertyId === 46487);

  const filters: { key: FilterType; label: string; labelLong: string }[] = [
    { key: 'all',       label: t.filterAll,       labelLong: t.filterAllLong },
    { key: 'priceLow',  label: t.filterPriceLow,  labelLong: t.filterPriceLowLong },
    { key: 'priceHigh', label: t.filterPriceHigh, labelLong: t.filterPriceHighLong },
    { key: 'size',      label: t.filterSize,      labelLong: t.filterSizeLong },
    ...(hasSea    ? [{ key: 'sea'    as FilterType, label: t.filterSea,    labelLong: t.filterSeaLong }]    : []),
    ...(hasNature ? [{ key: 'nature' as FilterType, label: t.filterNature, labelLong: t.filterNatureLong }] : []),
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 2px', maxWidth: 500, margin: '0 auto', fontFamily: 'sans-serif' }}>

      <h2 style={{ color: '#1E73BE', fontSize: 21, fontWeight: 700, margin: '0 0 4px' }}>
        {isSingleRoom ? t.titleSingle : t.titleMulti}
      </h2>
      {nights > 0 && (
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
          {checkIn} → {checkOut} · {nights} {nights === 1 ? t.nightsSing : t.nightsPlur}
        </p>
      )}

      {/* ── Filtri: select su desktop, pill su mobile ── */}
      {!isSingleRoom && !loading && !error && roomOffers.length > 0 && (
        <>
          {/* Desktop: menu a discesa */}
          <div className="filter-desktop" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <select
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value as FilterType)}
              style={{
                padding: '7px 32px 7px 12px',
                borderRadius: 8,
                border: '1.5px solid #e0e0e0',
                background: '#fff',
                color: '#333',
                fontSize: 14,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'auto',
              }}
            >
              {filters.map(f => (
                <option key={f.key} value={f.key}>{f.labelClean}</option>
              ))}
            </select>
          </div>

          {/* Mobile: pill scrollabili */}
          <div className="filter-mobile" style={{
            display: 'flex', gap: 8, flexWrap: 'nowrap',
            marginBottom: 16, paddingBottom: 16,
            borderBottom: '1px solid #f0f0f0',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}>
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: activeFilter === f.key ? '2px solid #1E73BE' : '1.5px solid #e0e0e0',
                  background: activeFilter === f.key ? '#EEF5FC' : '#fff',
                  color: activeFilter === f.key ? '#1E73BE' : '#555',
                  fontSize: 13,
                  fontWeight: activeFilter === f.key ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {f.labelClean}
              </button>
            ))}
          </div>
        </>
      )}
      <style>{`
        .filter-desktop { display: flex !important; }
        .filter-mobile  { display: none !important; }
        @media (max-width: 640px) {
          .filter-desktop { display: none !important; }
          .filter-mobile  { display: flex !important; }
        }
      `}</style>

      {/* Spinner */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
          <div style={{ width: 38, height: 38, border: '3px solid #eee', borderTop: '3px solid #1E73BE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#888', fontSize: 13 }}>{t.loading}</span>
        </div>
      )}

      {/* Errore */}
      {!loading && error && (
        <div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 12, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#c0392b' }}>{t.errTitle}</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#888' }}>{error}</p>
          <button onClick={fetchOffers} style={retryBtn}>{t.retry}</button>
        </div>
      )}

      {/* Nessun risultato */}
      {!loading && !error && filteredRoomOffers.length === 0 && (
        <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '24px', textAlign: 'center', marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#888', fontSize: 14 }}>{t.noResults}</p>
        </div>
      )}

      {/* Lista card rooms */}
      {!loading && !error && filteredRoomOffers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
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

                {/* Foto (solo WizardLibero) */}
                {!isSingleRoom && (
                  <div style={{ height: 180, background: '#f0f4f8', position: 'relative', overflow: 'hidden' }}>
                    {coverUrl ? (
                      <img src={coverUrl} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 13 }}>🏠</div>
                    )}
                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                      {room.type}
                    </span>
                  </div>
                )}

                {/* Header room */}
                <div style={{ padding: isSingleRoom ? '12px 16px 6px' : '10px 16px 6px', background: isRoomPicked ? '#EEF5FC' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#1E73BE' }}>{room.name}</span>
                    {isSingleRoom && <span style={{ fontSize: 11, color: '#888', background: '#f0f0f0', borderRadius: 6, padding: '2px 8px' }}>{room.type}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <span style={chip}>🛏️ {room.bedrooms} {t.camere}</span>
                    <span style={chip}>👥 {t.maxPers} {room.maxPeople} {t.persone}</span>
                    <span style={chip}>📐 {room.sqm} mq</span>
                    <span style={chip}>{getPoolLabel(room, t)}</span>
                    <span style={chip}>📍 {getLocationLabel(room, t)}</span>
                  </div>
                </div>

                {/* Tariffe */}
                <div style={{ padding: '8px 12px 14px' }}>
                  {ro.offers.map(offer => {
                    const isPicked = isRoomPicked && pickedOfferId === offer.offerId;
                    const perNight = nights > 0 ? Math.round(offer.price / nights) : 0;
                    const name = OFFER_NAMES[offer.offerId]?.[loc] ?? offer.offerName;
                    const desc = OFFER_DESC[offer.offerId]?.[loc];
                    const avail = offer.unitsAvailable > 0;

                    return (
                      <button
                        key={offer.offerId}
                        onClick={() => avail && pick(room.roomId, offer.offerId)}
                        disabled={!avail}
                        style={{
                          width: '100%', textAlign: 'left',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', marginTop: 6,
                          borderRadius: 10,
                          border: isPicked ? '2px solid #1E73BE' : '1.5px solid #e5e7eb',
                          background: isPicked ? '#EEF5FC' : '#fff',
                          cursor: avail ? 'pointer' : 'default',
                          opacity: avail ? 1 : 0.4,
                          transition: 'all 0.12s',
                        }}
                      >
                        <div style={{ flex: 1, marginRight: 12, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{name}</span>
                            {isPicked && <span style={{ fontSize: 13, color: '#1E73BE', fontWeight: 700 }}>{t.selezionata}</span>}
                          </div>
                          {desc && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#666', lineHeight: 1.4 }}>{desc}</p>}
                          {!avail && <span style={{ fontSize: 11, color: '#e74c3c', display: 'block', marginTop: 2 }}>{t.nonDisp}</span>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#1E73BE', lineHeight: 1 }}>{fmt(offer.price + touristTax)}</div>
                          {perNight > 0 && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{fmt(perNight)}{t.perNight}</div>}
                          <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>{t.total}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA mobile */}
      <div className="step5-continua-mobile">
        <button onClick={handleContinua} disabled={!canContinue} style={{
          width: '100%', padding: '15px', borderRadius: 12, border: 'none',
          fontSize: 16, fontWeight: 700, marginBottom: 14,
          background: canContinue ? '#FCAF1A' : '#e0e0e0',
          color: canContinue ? '#fff' : '#999',
          cursor: canContinue ? 'pointer' : 'not-allowed',
        }}>
          {t.continua}
        </button>
      </div>
      <style>{'@media (min-width: 768px) { .step5-continua-mobile { display: none; } }'}</style>

      <button onClick={prevStep} style={{ background: 'none', border: 'none', color: '#1E73BE', fontSize: 14, cursor: 'pointer', padding: 0 }}>
        {t.indietro}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .filter-desktop { display: none; }
        .filter-mobile  { display: flex; }
        @media (min-width: 640px) {
          .filter-desktop { display: flex !important; }
          .filter-mobile  { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const chip: React.CSSProperties = {
  fontSize: 11, color: '#555', background: '#f5f5f5', borderRadius: 6, padding: '3px 8px',
};
const retryBtn: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 8, border: '1px solid #1E73BE',
  background: '#fff', color: '#1E73BE', fontSize: 14, cursor: 'pointer',
};      {/* ── Filtri: dropdown su desktop, pills su mobile ── */}
      {!isSingleRoom && !loading && !error && roomOffers.length > 0 && (
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>

          {/* Desktop: select a discesa */}
          <div className="filter-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>
              {locale === 'it' ? 'Ordina per:' : locale === 'de' ? 'Sortieren:' : locale === 'pl' ? 'Sortuj:' : 'Sort by:'}
            </span>
            <select
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value as FilterType)}
              style={{
                padding: '7px 32px 7px 12px',
                borderRadius: 8,
                border: '1.5px solid #e0e0e0',
                background: '#fff',
                fontSize: 14,
                color: '#333',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: "url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                minWidth: 200,
              }}
            >
              {filters.map(f => (
                <option key={f.key} value={f.key}>{f.labelLong}</option>
              ))}
            </select>
          </div>

          {/* Mobile: pills scrollabili */}
          <div
            className="filter-mobile"
            style={{
              display: 'flex', gap: 8, flexWrap: 'nowrap',
              overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              paddingBottom: 2,
            }}
          >
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: activeFilter === f.key ? '2px solid #1E73BE' : '1.5px solid #e0e0e0',
                  background: activeFilter === f.key ? '#EEF5FC' : '#fff',
                  color: activeFilter === f.key ? '#1E73BE' : '#555',
                  fontSize: 13,
                  fontWeight: activeFilter === f.key ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>
      )}

ent';

import { useEffect, useState, useCallback } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { getAvailableRooms, getPropertyForRoom, PROPERTIES } from '@/config/properties';
import type { Room } from '@/config/properties';

// ─── Offer IDs fissi LivingApple ─────────────────────────────────────────────
const OFFER_NAMES: Record<number, Record<string, string>> = {
  1: { it:'Non Rimborsabile',          en:'Non-Refundable',         de:'Nicht erstattungsfähig',    pl:'Bezzwrotna' },
  2: { it:'Parzialmente Rimborsabile', en:'Partially Refundable',   de:'Teilw. erstattungsfähig',   pl:'Częściowo zwrotna' },
  3: { it:'Flessibile 60 gg',          en:'Flexible 60 days',       de:'Flexibel 60 Tage',          pl:'Elastyczna 60 dni' },
  4: { it:'Flessibile 45 gg',          en:'Flexible 45 days',       de:'Flexibel 45 Tage',          pl:'Elastyczna 45 dni' },
  5: { it:'Flessibile 30 gg',          en:'Flexible 30 days',       de:'Flexibel 30 Tage',          pl:'Elastyczna 30 dni' },
  6: { it:'Flessibile 5 gg',           en:'Flexible 5 days',        de:'Flexibel 5 Tage',           pl:'Elastyczna 5 dni' },
};
const OFFER_DESC: Record<number, Record<string, string>> = {
  1: { it:'Paghi tutto entro 48h dalla prenotazione.',       en:'Pay in full within 48h of booking.',                de:'Vollzahlung innerhalb 48h nach Buchung.',          pl:'Płatność w całości w ciągu 48h.' },
  2: { it:"Paghi 50% ora, il saldo all'arrivo.",             en:'Pay 50% now, balance at arrival.',                  de:'50% jetzt, Rest bei Ankunft.',                     pl:'50% teraz, reszta przy przyjeździe.' },
  3: { it:"Cancellazione gratuita entro 60 gg dall'arrivo.", en:'Free cancellation up to 60 days before arrival.',   de:'Kostenlose Stornierung bis 60 Tage vor Ankunft.',  pl:'Bezpłatne anulowanie do 60 dni przed przyjazdem.' },
  4: { it:"Cancellazione gratuita entro 45 gg dall'arrivo.", en:'Free cancellation up to 45 days before arrival.',   de:'Kostenlose Stornierung bis 45 Tage vor Ankunft.',  pl:'Bezpłatne anulowanie do 45 dni przed przyjazdem.' },
  5: { it:"Cancellazione gratuita entro 30 gg dall'arrivo.", en:'Free cancellation up to 30 days before arrival.',   de:'Kostenlose Stornierung bis 30 Tage vor Ankunft.',  pl:'Bezpłatne anulowanie do 30 dni przed przyjazdem.' },
  6: { it:"Cancellazione gratuita entro 5 gg dall'arrivo.",  en:'Free cancellation up to 5 days before arrival.',    de:'Kostenlose Stornierung bis 5 Tage vor Ankunft.',   pl:'Bezpłatne anulowanie do 5 dni przed przyjazdem.' },
};

// ─── Traduzioni UI ────────────────────────────────────────────────────────────
const UI: Record<string, Record<string, string>> = {
  it: {
    titleSingle:'Quale tariffa preferite?',
    titleMulti: 'Scegli appartamento e tariffa',
    loading: 'Ricerca prezzi e disponibilità...',
    noResults: 'Nessun appartamento disponibile per le date selezionate.',
    nightsSing: 'notte', nightsPlur: 'notti',
    perNight: '/notte', total: 'totale',
    continua: 'Continua →', indietro: '← Indietro',
    errTitle: 'Errore caricamento prezzi', retry: 'Riprova',
    camere: 'camere', maxPers: 'max', persone: 'pers.',
    privPool: '🏊 Piscina privata', sharedPool: '🌊 Piscina condivisa', noPool: '🏖️ 250m dal mare',
    nearSea: 'Vicino al mare', nature: 'Immerso nella natura',
    nonDisp: 'Non disponibile', selezionata: '✓',
    // Filtri
    filterAll:        'Tutti',
    filterPriceLow:   'Prezzo ↑',
    filterPriceHigh:  'Prezzo ↓',
    filterSize:       'Più grande',
    filterSea:        '250m mare',
    filterNature:     '2km mare',
    // Desktop dropdown labels
    filterAllLong:        'Predefinito',
    filterPriceLowLong:   'Prezzo più basso',
    filterPriceHighLong:  'Prezzo più alto',
    filterSizeLong:       'Più grande (mq)',
    filterSeaLong:        '250m dal mare',
    filterNatureLong:     '2km dal mare',
    filterAllClean: 'Tutti', filterPriceClean: 'Prezzo', filterSizeClean: 'Più grande', filterSeaClean: '250m dal mare', filterNatureClean: '2km dal mare',
  },
  en: {
    titleSingle:'Which rate do you prefer?',
    titleMulti: 'Choose apartment and rate',
    loading: 'Searching prices and availability...',
    noResults: 'No apartments available for the selected dates.',
    nightsSing: 'night', nightsPlur: 'nights',
    perNight: '/night', total: 'total',
    continua: 'Continue →', indietro: '← Back',
    errTitle: 'Error loading prices', retry: 'Retry',
    camere: 'bd', maxPers: 'max', persone: 'pax',
    privPool: '🏊 Private pool', sharedPool: '🌊 Shared pool', noPool: '🏖️ 250m from sea',
    nearSea: 'Near the sea', nature: 'In nature',
    nonDisp: 'Unavailable', selezionata: '✓',
    filterAll:        'All',
    filterPriceLow:   'Price ↑',
    filterPriceHigh:  'Price ↓',
    filterSize:       'Largest',
    filterSea:        '250m sea',
    filterNature:     '2km sea',
    filterAllLong:        'Default',
    filterPriceLowLong:   'Lowest price',
    filterPriceHighLong:  'Highest price',
    filterSizeLong:       'Largest (sqm)',
    filterSeaLong:        '250m from sea',
    filterNatureLong:     '2km from sea',
    filterAllClean: 'All', filterPriceClean: 'Price', filterSizeClean: 'Largest', filterSeaClean: '250m from sea', filterNatureClean: '2km from sea',
  },
  de: {
    titleSingle:'Welchen Tarif bevorzugen Sie?',
    titleMulti: 'Unterkunft und Tarif wählen',
    loading: 'Preise und Verfügbarkeit suchen...',
    noResults: 'Keine Unterkünfte für die gewählten Daten verfügbar.',
    nightsSing: 'Nacht', nightsPlur: 'Nächte',
    perNight: '/Nacht', total: 'gesamt',
    continua: 'Weiter →', indietro: '← Zurück',
    errTitle: 'Fehler beim Laden', retry: 'Wiederholen',
    camere: 'Zi.', maxPers: 'max', persone: 'Pers.',
    privPool: '🏊 Privater Pool', sharedPool: '🌊 Gemeinsch.pool', noPool: '🏖️ 250m vom Meer',
    nearSea: 'Meeresnähe', nature: 'In der Natur',
    nonDisp: 'Nicht verfügbar', selezionata: '✓',
    filterAll:        'Alle',
    filterPriceLow:   'Preis ↑',
    filterPriceHigh:  'Preis ↓',
    filterSize:       'Größte',
    filterSea:        '250m Meer',
    filterNature:     '2km Meer',
    filterAllLong:        'Standard',
    filterPriceLowLong:   'Günstigster Preis',
    filterPriceHighLong:  'Höchster Preis',
    filterSizeLong:       'Größte (qm)',
    filterSeaLong:        '250m vom Meer',
    filterNatureLong:     '2km vom Meer',
    filterAllClean: 'Alle', filterPriceClean: 'Preis', filterSizeClean: 'Größte', filterSeaClean: '250m vom Meer', filterNatureClean: '2km vom Meer',
  },
  pl: {
    titleSingle:'Którą taryfę preferujecie?',
    titleMulti: 'Wybierz apartament i taryfę',
    loading: 'Wyszukiwanie cen i dostępności...',
    noResults: 'Brak dostępnych apartamentów dla wybranych dat.',
    nightsSing: 'noc', nightsPlur: 'nocy',
    perNight: '/noc', total: 'łącznie',
    continua: 'Dalej →', indietro: '← Wstecz',
    errTitle: 'Błąd ładowania cen', retry: 'Ponów',
    camere: 'sypialnie', maxPers: 'maks', persone: 'os.',
    privPool: '🏊 Prywatny basen', sharedPool: '🌊 Wspólny basen', noPool: '🏖️ 250m od morza',
    nearSea: 'Blisko morza', nature: 'Wśród natury',
    nonDisp: 'Niedostępne', selezionata: '✓',
    filterAll:        'Wszystkie',
    filterPriceLow:   'Cena ↑',
    filterPriceHigh:  'Cena ↓',
    filterSize:       'Największy',
    filterSea:        '250m morze',
    filterNature:     '2km morze',
    filterAllLong:        'Domyślne',
    filterPriceLowLong:   'Najniższa cena',
    filterPriceHighLong:  'Najwyższa cena',
    filterSizeLong:       'Największy (mkw)',
    filterSeaLong:        '250m od morza',
    filterNatureLong:     '2km od morza',
    filterAllClean: 'Wszystkie', filterPriceClean: 'Cena', filterSizeClean: 'Największy', filterSeaClean: '250m od morza', filterNatureClean: '2km od morza',
  },
};

// ─── Tipi filtro ─────────────────────────────────────────────────────────────
type FilterType = 'all' | 'priceLow' | 'priceHigh' | 'size' | 'sea' | 'nature';

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
function getPoolLabel(room: Room, ui: Record<string, string>) {
  return room.privatePool ? ui.privPool : room.sharedPool ? ui.sharedPool : ui.noPool;
}
function getLocationLabel(room: Room, ui: Record<string, string>) {
  const prop = getPropertyForRoom(room.roomId);
  return prop?.propertyId === 46871 ? ui.nearSea : ui.nature;
}
function getMinPrice(ro: RoomOffers): number {
  const avail = ro.offers.filter(o => o.unitsAvailable > 0);
  if (avail.length === 0) return Infinity;
  return Math.min(...avail.map(o => o.price));
}

// ─── Componente principale ───────────────────────────────────────────────────
interface Props { locale?: string; roomId?: number | null; }

export default function WizardStep5({ locale = 'it', roomId: roomIdProp }: Props) {
  const t = UI[locale] ?? UI.it;
  const loc = locale in UI ? locale : 'it';

  const {
    numAdult, numChild, childrenAges, checkIn, checkOut, poolPreference,
    selectedRoomId, setSelectedRoomId,
    selectedOfferId, setSelectedOfferId, setOffers,
    nextStep, prevStep,
  } = useWizardStore();

  const roomId = roomIdProp ?? selectedRoomId;
  const isSingleRoom = !!roomId;

  const [roomOffers, setRoomOffers]       = useState<RoomOffers[]>([]);
  const [coverUrls, setCoverUrls]         = useState<Record<number, string>>({});
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [pickedRoomId, setPickedRoomId]   = useState<number | null>(roomId ?? null);
  const [pickedOfferId, setPickedOfferId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter]   = useState<FilterType>('all');

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
        targetRoomIds = [roomId!];
      } else {
        const total = numAdult + numChild;
        targetRoomIds = getAvailableRooms(total, poolPreference).map(r => r.roomId);
      }
      if (targetRoomIds.length === 0) { setLoading(false); return; }

      const qs = new URLSearchParams({
        roomIds:     targetRoomIds.join(','),
        arrival:     checkIn,
        departure:   checkOut,
        numAdults:   String(numAdult),
        numChildren: String((childrenAges ?? []).filter((a: number) => a >= 3).length),
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
  }, [roomId, checkIn, checkOut, numAdult, numChild, poolPreference, isSingleRoom]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  // ── Fetch cover foto ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isSingleRoom || roomOffers.length === 0) return;
    (async () => {
      const res = await fetch('/api/cloudinary?covers=true').catch(() => null);
      if (!res?.ok) return;
      const data = await res.json();
      const covers: Record<number, string> = {};
      for (const ro of roomOffers) {
        const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === ro.roomId);
        if (room && data.covers?.[room.cloudinaryFolder]) {
          covers[ro.roomId] = data.covers[room.cloudinaryFolder];
        }
      }
      setCoverUrls(covers);
    })();
  }, [roomOffers, isSingleRoom]);

  // ── Filtra e ordina ───────────────────────────────────────────────────────
  const filteredRoomOffers = (() => {
    let list = [...roomOffers];

    // Filtro posizione
    if (activeFilter === 'sea') {
      list = list.filter(ro => ro.propertyId === 46871);
    } else if (activeFilter === 'nature') {
      list = list.filter(ro => ro.propertyId === 46487);
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

  // ── Filtri disponibili (solo in WizardLibero) ────────────────────────────
  const hasSea    = roomOffers.some(ro => ro.propertyId === 46871);
  const hasNature = roomOffers.some(ro => ro.propertyId === 46487);

  const filters: { key: FilterType; label: string; labelLong: string }[] = [
    { key: 'all',       label: t.filterAll,       labelLong: t.filterAllLong },
    { key: 'priceLow',  label: t.filterPriceLow,  labelLong: t.filterPriceLowLong },
    { key: 'priceHigh', label: t.filterPriceHigh, labelLong: t.filterPriceHighLong },
    { key: 'size',      label: t.filterSize,      labelLong: t.filterSizeLong },
    ...(hasSea    ? [{ key: 'sea'    as FilterType, label: t.filterSea,    labelLong: t.filterSeaLong }]    : []),
    ...(hasNature ? [{ key: 'nature' as FilterType, label: t.filterNature, labelLong: t.filterNatureLong }] : []),
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 2px', maxWidth: 500, margin: '0 auto', fontFamily: 'sans-serif' }}>

      <h2 style={{ color: '#1E73BE', fontSize: 21, fontWeight: 700, margin: '0 0 4px' }}>
        {isSingleRoom ? t.titleSingle : t.titleMulti}
      </h2>
      {nights > 0 && (
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
          {checkIn} → {checkOut} · {nights} {nights === 1 ? t.nightsSing : t.nightsPlur}
        </p>
      )}

      {/* ── Filtri: select su desktop, pill su mobile ── */}
      {!isSingleRoom && !loading && !error && roomOffers.length > 0 && (
        <>
          {/* Desktop: menu a discesa */}
          <div className="filter-desktop" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <select
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value as FilterType)}
              style={{
                padding: '7px 32px 7px 12px',
                borderRadius: 8,
                border: '1.5px solid #e0e0e0',
                background: '#fff',
                color: '#333',
                fontSize: 14,
                cursor: 'pointer',
                outline: 'none',
                appearance: 'auto',
              }}
            >
              {filters.map(f => (
                <option key={f.key} value={f.key}>{f.labelClean}</option>
              ))}
            </select>
          </div>

          {/* Mobile: pill scrollabili */}
          <div className="filter-mobile" style={{
            display: 'flex', gap: 8, flexWrap: 'nowrap',
            marginBottom: 16, paddingBottom: 16,
            borderBottom: '1px solid #f0f0f0',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}>
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: activeFilter === f.key ? '2px solid #1E73BE' : '1.5px solid #e0e0e0',
                  background: activeFilter === f.key ? '#EEF5FC' : '#fff',
                  color: activeFilter === f.key ? '#1E73BE' : '#555',
                  fontSize: 13,
                  fontWeight: activeFilter === f.key ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {f.labelClean}
              </button>
            ))}
          </div>
        </>
      )}
      <style>{`
        .filter-desktop { display: flex !important; }
        .filter-mobile  { display: none !important; }
        @media (max-width: 640px) {
          .filter-desktop { display: none !important; }
          .filter-mobile  { display: flex !important; }
        }
      `}</style>

      {/* Spinner */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
          <div style={{ width: 38, height: 38, border: '3px solid #eee', borderTop: '3px solid #1E73BE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#888', fontSize: 13 }}>{t.loading}</span>
        </div>
      )}

      {/* Errore */}
      {!loading && error && (
        <div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 12, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#c0392b' }}>{t.errTitle}</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#888' }}>{error}</p>
          <button onClick={fetchOffers} style={retryBtn}>{t.retry}</button>
        </div>
      )}

      {/* Nessun risultato */}
      {!loading && !error && filteredRoomOffers.length === 0 && (
        <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '24px', textAlign: 'center', marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#888', fontSize: 14 }}>{t.noResults}</p>
        </div>
      )}

      {/* Lista card rooms */}
      {!loading && !error && filteredRoomOffers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
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

                {/* Foto (solo WizardLibero) */}
                {!isSingleRoom && (
                  <div style={{ height: 180, background: '#f0f4f8', position: 'relative', overflow: 'hidden' }}>
                    {coverUrl ? (
                      <img src={coverUrl} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 13 }}>🏠</div>
                    )}
                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                      {room.type}
                    </span>
                  </div>
                )}

                {/* Header room */}
                <div style={{ padding: isSingleRoom ? '12px 16px 6px' : '10px 16px 6px', background: isRoomPicked ? '#EEF5FC' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#1E73BE' }}>{room.name}</span>
                    {isSingleRoom && <span style={{ fontSize: 11, color: '#888', background: '#f0f0f0', borderRadius: 6, padding: '2px 8px' }}>{room.type}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <span style={chip}>🛏️ {room.bedrooms} {t.camere}</span>
                    <span style={chip}>👥 {t.maxPers} {room.maxPeople} {t.persone}</span>
                    <span style={chip}>📐 {room.sqm} mq</span>
                    <span style={chip}>{getPoolLabel(room, t)}</span>
                    <span style={chip}>📍 {getLocationLabel(room, t)}</span>
                  </div>
                </div>

                {/* Tariffe */}
                <div style={{ padding: '8px 12px 14px' }}>
                  {ro.offers.map(offer => {
                    const isPicked = isRoomPicked && pickedOfferId === offer.offerId;
                    const perNight = nights > 0 ? Math.round(offer.price / nights) : 0;
                    const name = OFFER_NAMES[offer.offerId]?.[loc] ?? offer.offerName;
                    const desc = OFFER_DESC[offer.offerId]?.[loc];
                    const avail = offer.unitsAvailable > 0;

                    return (
                      <button
                        key={offer.offerId}
                        onClick={() => avail && pick(room.roomId, offer.offerId)}
                        disabled={!avail}
                        style={{
                          width: '100%', textAlign: 'left',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', marginTop: 6,
                          borderRadius: 10,
                          border: isPicked ? '2px solid #1E73BE' : '1.5px solid #e5e7eb',
                          background: isPicked ? '#EEF5FC' : '#fff',
                          cursor: avail ? 'pointer' : 'default',
                          opacity: avail ? 1 : 0.4,
                          transition: 'all 0.12s',
                        }}
                      >
                        <div style={{ flex: 1, marginRight: 12, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{name}</span>
                            {isPicked && <span style={{ fontSize: 13, color: '#1E73BE', fontWeight: 700 }}>{t.selezionata}</span>}
                          </div>
                          {desc && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#666', lineHeight: 1.4 }}>{desc}</p>}
                          {!avail && <span style={{ fontSize: 11, color: '#e74c3c', display: 'block', marginTop: 2 }}>{t.nonDisp}</span>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#1E73BE', lineHeight: 1 }}>{fmt(offer.price + touristTax)}</div>
                          {perNight > 0 && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{fmt(perNight)}{t.perNight}</div>}
                          <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>{t.total}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA mobile */}
      <div className="step5-continua-mobile">
        <button onClick={handleContinua} disabled={!canContinue} style={{
          width: '100%', padding: '15px', borderRadius: 12, border: 'none',
          fontSize: 16, fontWeight: 700, marginBottom: 14,
          background: canContinue ? '#FCAF1A' : '#e0e0e0',
          color: canContinue ? '#fff' : '#999',
          cursor: canContinue ? 'pointer' : 'not-allowed',
        }}>
          {t.continua}
        </button>
      </div>
      <style>{'@media (min-width: 768px) { .step5-continua-mobile { display: none; } }'}</style>

      <button onClick={prevStep} style={{ background: 'none', border: 'none', color: '#1E73BE', fontSize: 14, cursor: 'pointer', padding: 0 }}>
        {t.indietro}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .filter-desktop { display: none; }
        .filter-mobile  { display: flex; }
        @media (min-width: 640px) {
          .filter-desktop { display: flex !important; }
          .filter-mobile  { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const chip: React.CSSProperties = {
  fontSize: 11, color: '#555', background: '#f5f5f5', borderRadius: 6, padding: '3px 8px',
};
const retryBtn: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 8, border: '1px solid #1E73BE',
  background: '#fff', color: '#1E73BE', fontSize: 14, cursor: 'pointer',
};
