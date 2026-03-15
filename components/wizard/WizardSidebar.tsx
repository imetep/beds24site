'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';

const OFFER_NAMES: Record<number, Record<string,string>> = {
  1: { it:'Non Rimborsabile',          en:'Non-Refundable',        de:'Nicht erstattungsfähig',  pl:'Bezzwrotna' },
  2: { it:'Parzialmente Rimborsabile', en:'Partially Refundable',  de:'Teilw. erstattungsfähig', pl:'Częściowo zwrotna' },
  3: { it:'Flessibile 60 gg',          en:'Flexible 60 days',      de:'Flexibel 60 Tage',        pl:'Elastyczna 60 dni' },
  4: { it:'Flessibile 45 gg',          en:'Flexible 45 days',      de:'Flexibel 45 Tage',        pl:'Elastyczna 45 dni' },
  5: { it:'Flessibile 30 gg',          en:'Flexible 30 days',      de:'Flexibel 30 Tage',        pl:'Elastyczna 30 dni' },
  6: { it:'Flessibile 5 gg',           en:'Flexible 5 days',       de:'Flexibel 5 Tage',         pl:'Elastyczna 5 dni' },
};

const UI: Record<string, Record<string,string>> = {
  it: { title:'Il tuo soggiorno', checkin:'Check-in', checkout:'Check-out',
        guests:'Ospiti', adults:'adulti', children:'bambini',
        nights:'notti', night:'notte', rate:'Tariffa',
        priceFrom:'da', perNight:'/notte', noRoom:'Scegli un appartamento' },
  en: { title:'Your stay', checkin:'Check-in', checkout:'Check-out',
        guests:'Guests', adults:'adults', children:'children',
        nights:'nights', night:'night', rate:'Rate',
        priceFrom:'from', perNight:'/night', noRoom:'Choose an apartment' },
  de: { title:'Ihr Aufenthalt', checkin:'Check-in', checkout:'Check-out',
        guests:'Gäste', adults:'Erwachsene', children:'Kinder',
        nights:'Nächte', night:'Nacht', rate:'Tarif',
        priceFrom:'ab', perNight:'/Nacht', noRoom:'Unterkunft wählen' },
  pl: { title:'Twój pobyt', checkin:'Zameldowanie', checkout:'Wymeldowanie',
        guests:'Goście', adults:'dorośli', children:'dzieci',
        nights:'nocy', night:'noc', rate:'Taryfa',
        priceFrom:'od', perNight:'/noc', noRoom:'Wybierz apartament' },
};

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}
function formatDate(ymd: string, locale: string) {
  const d = new Date(ymd + 'T00:00:00');
  return d.toLocaleDateString(
    locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'short' }
  );
}
function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

interface Props { locale?: string; }

export default function WizardSidebar({ locale = 'it' }: Props) {
  const t = UI[locale] ?? UI.it;
  const loc = locale in UI ? locale : 'it';

  const { numAdult, numChild, checkIn, checkOut, selectedRoomId, selectedOfferId, cachedOffers } = useWizardStore();

  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Trova room info
  const room = selectedRoomId
    ? PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === selectedRoomId)
    : null;

  // Fetch cover foto
  useEffect(() => {
    if (!room?.cloudinaryFolder) return;
    fetch(`/api/cloudinary?covers=true`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const url = data?.covers?.[room.cloudinaryFolder];
        if (url) setCoverUrl(url);
      })
      .catch(() => {});
  }, [room?.cloudinaryFolder]);

  // Trova offerta selezionata
  const offer = cachedOffers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerName = offer ? (OFFER_NAMES[offer.offerId]?.[loc] ?? offer.offerName) : null;
  const offerPrice: number = offer?.price ?? 0;

  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
  const perNight = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;

  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: 'var(--sidebar-bg, #f9fafb)',
      borderLeft: '1px solid #e5e7eb',
      padding: '28px 20px',
      position: 'sticky', top: 80,
      alignSelf: 'flex-start',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', margin: '0 0 16px' }}>
        {t.title}
      </p>

      {/* Foto appartamento */}
      <div style={{ width: '100%', height: 110, borderRadius: 10, overflow: 'hidden', background: '#f0f0f0', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {coverUrl ? (
          <img src={coverUrl} alt={room?.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 24 }}>🏠</span>
        )}
      </div>

      {/* Nome appartamento */}
      {room ? (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>{room.name}</p>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>
            {room.bedrooms} {loc === 'it' ? 'camere' : loc === 'de' ? 'Zi.' : 'bd'} · max {room.maxPeople} {t.adults}
          </p>
        </>
      ) : (
        <p style={{ fontSize: 13, color: '#bbb', margin: '0 0 16px', fontStyle: 'italic' }}>{t.noRoom}</p>
      )}

      {/* Separatore */}
      <div style={{ height: 1, background: '#e5e7eb', margin: '0 0 14px' }} />

      {/* Date */}
      <Row label={t.checkin}  value={checkIn  ? formatDate(checkIn,  locale) : '—'} active={!!checkIn} />
      <Row label={t.checkout} value={checkOut ? formatDate(checkOut, locale) : '—'} active={!!checkOut} />
      {nights > 0 && (
        <Row label="" value={`${nights} ${nights === 1 ? t.night : t.nights}`} muted />
      )}

      {/* Ospiti */}
      {numAdult > 0 && (
        <Row
          label={t.guests}
          value={`${numAdult} ${t.adults}${numChild > 0 ? `, ${numChild} ${t.children}` : ''}`}
          active
        />
      )}

      {/* Tariffa */}
      {offerName && <Row label={t.rate} value={offerName} active />}

      {/* Prezzo */}
      {offerPrice > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px' }}>Totale soggiorno</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#1E73BE', margin: 0, lineHeight: 1 }}>
            {fmt(offerPrice)}
          </p>
          {perNight > 0 && (
            <p style={{ fontSize: 12, color: '#aaa', margin: '3px 0 0' }}>
              {fmt(perNight)}{t.perNight}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, active, muted }: { label: string; value: string; active?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0' }}>
      <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: muted ? '#ccc' : active ? '#111' : '#ccc' }}>
        {value}
      </span>
    </div>
  );
}
