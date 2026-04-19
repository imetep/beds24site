'use client';

/**
 * BookingSidebar — riepilogo soggiorno wizard unificato step 1 e step 2.
 * Spec: docs/ux/wizard-sidebar-design.md (v3 ratificato)
 * Look master: SidebarContent di WizardStep2 (ratificato 2026-04-19).
 *
 * Sessione 3c.1: rifacimento visuale step 1 per adottare DNA unificato
 * (banner titolo+testo, dati verticali, totale, riordinamento blocchi).
 * Sessione 3c.2+: slot step=2 per voucher/extras (da fare).
 */

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES, CIN, OFFER_INFO, type Room, type Property } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import type { Locale } from '@/config/i18n';

interface Props {
  locale?: string;
  onContinua?: () => void;
  canContinua?: boolean;
}

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

function formatDate(ymd: string, locale: string) {
  return new Date(ymd + 'T00:00:00').toLocaleDateString(
    locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'long' }
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function cloudUrl(folder: string, width = 500, height = 160) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dsnlduczj';
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${folder}`;
}

function typeLabel(t: any, type: Room['type']): string {
  if (type === 'monolocale') return t.typeMonolocale;
  if (type === 'villa') return t.typeVilla;
  return t.typeAppartamento;
}

function poolLabel(t: any, room: Room): string | null {
  if (room.privatePool && room.sharedPool) return t.poolBoth;
  if (room.privatePool) return t.poolPrivate;
  if (room.sharedPool) return t.poolShared;
  return null;
}


export default function BookingSidebar({ locale = 'it', onContinua, canContinua }: Props) {
  const tr = getTranslations(locale as Locale);
  const t = tr.components.wizardSidebar;
  const OFFER_NAMES = tr.shared.offerNames as Record<string, string>;

  const {
    numAdult, numChild, checkIn, checkOut,
    selectedRoomId, selectedOfferId, cachedOffers,
    nextStep,
  } = useWizardStore();

  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const room: Room | null = selectedRoomId
    ? PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === selectedRoomId) ?? null
    : null;
  const property: Property | null = room
    ? PROPERTIES.find(p => p.rooms.some(r => r.roomId === room.roomId)) ?? null
    : null;

  useEffect(() => {
    if (!room?.cloudinaryFolder) { setCoverUrl(null); return; }
    fetchCoversCached().then(covers => setCoverUrl(covers?.[room.cloudinaryFolder] ?? null));
  }, [room?.cloudinaryFolder]);

  const fallbackHero = cloudUrl('_DSC2502_laqzeh.jpg');
  const heroUrl = coverUrl ?? fallbackHero;

  // Offer + pricing
  const roomOffers = cachedOffers?.find((ro: any) => ro.roomId === selectedRoomId);
  const offer = roomOffers?.offers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerName: string | null = offer ? (OFFER_NAMES[String(offer.offerId)] ?? String(offer.offerName ?? '')) : null;
  const offerPrice: number = offer?.price ?? 0;
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
  const perNight = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;
  const touristTax = Math.min(nights, 10) * numAdult * 2;
  const totalWithTax = offerPrice + touristTax;

  const offerInfo = offer ? OFFER_INFO[offer.offerId as number] : null;
  const offerCondition = offerInfo?.conditions[locale] ?? offerInfo?.conditions.it ?? null;

  const handleContinua = onContinua ?? nextStep;
  const showContinua = canContinua !== undefined ? canContinua : !!selectedOfferId;
  const hasPricing = offerPrice > 0 && nights > 0;

  const depositText = room?.securityDeposit
    ? t.depositText.replace('{amount}', String(room.securityDeposit))
    : t.depositTextGeneric;

  return (
    <div className="booking-sidebar">
      {/* 1. HERO */}
      <div className="booking-sidebar__hero">
        <img
          src={heroUrl}
          alt={room?.name ?? 'LivingApple'}
          className="booking-sidebar__hero-img"
          loading="lazy"
        />
      </div>
      {room ? (
        <>
          <p className="section-title-secondary">{room.name}</p>
          <p className="label-metadata">{typeLabel(t, room.type)} · {room.sqm} {t.sqm} · {room.maxPeople} {t.people}</p>
        </>
      ) : (
        <p className="hint-text">{t.selectRoomMsg}</p>
      )}

      {/* 2. BANNER ⚡ CONSUMI (sempre visibile) */}
      <div className="banner banner--info banner--with-icon">
        <i className="bi bi-lightning-fill" aria-hidden="true"></i>
        <div>
          <p className="banner__title">{t.energyTitle}</p>
          <p className="banner__text">{t.energyText}</p>
        </div>
      </div>

      {/* 3. FEATURE appartamento (solo se selezionato) */}
      {room && (
        <>
          <hr className="divider-horizontal" />
          <p className="label-uppercase-muted">{t.propertySection}</p>
          <ul className="booking-sidebar__feature-list">
            {property && (
              <li className="booking-sidebar__feature-item">
                {property.name} · {property.distanceLabel}
              </li>
            )}
            <li className="booking-sidebar__feature-item">
              <i className="bi bi-door-closed-fill me-2" aria-hidden="true"></i>
              {room.bedrooms} {t.bedrooms}
              <i className="bi bi-droplet-fill ms-3 me-2" aria-hidden="true"></i>
              {room.bathrooms} {t.bathrooms}
              <i className="bi bi-people-fill ms-3 me-2" aria-hidden="true"></i>
              {room.maxPeople} {t.people}
            </li>
            {poolLabel(t, room) && (
              <li className="booking-sidebar__feature-item">
                <i className="bi bi-water me-2" aria-hidden="true"></i>
                {poolLabel(t, room)}
              </li>
            )}
            {room.features.garden && (
              <li className="booking-sidebar__feature-item">
                <i className="bi bi-tree-fill me-2" aria-hidden="true"></i>
                {t.featureGarden}
              </li>
            )}
            {room.features.patio && (
              <li className="booking-sidebar__feature-item">
                <i className="bi bi-house-door-fill me-2" aria-hidden="true"></i>
                {t.featurePatio}
              </li>
            )}
            {room.features.eventHall && (
              <li className="booking-sidebar__feature-item">
                <i className="bi bi-calendar-event-fill me-2" aria-hidden="true"></i>
                {t.featureEventHall}
              </li>
            )}
          </ul>
        </>
      )}

      {/* 5. DATI CHIAVE — layout verticale (label sopra, valore sotto) */}
      <hr className="divider-horizontal" />
      <div className="booking-sidebar__data-row">
        <div className="booking-sidebar__data-cell">
          <p className="booking-sidebar__data-label">{t.dates}</p>
          <p className="booking-sidebar__data-value">
            {checkIn && checkOut
              ? `${formatDate(checkIn, locale)} – ${formatDate(checkOut, locale)}`
              : '—'}
          </p>
          {nights > 0 && (
            <p className="booking-sidebar__data-hint">{nights} {nights === 1 ? t.night : t.nights}</p>
          )}
        </div>
      </div>
      <div className="booking-sidebar__data-row">
        <div className="booking-sidebar__data-cell">
          <p className="booking-sidebar__data-label">{t.guests}</p>
          <p className="booking-sidebar__data-value">
            {numAdult > 0 ? `${numAdult} ${t.adults}${numChild > 0 ? `, ${numChild} ${t.children}` : ''}` : '—'}
          </p>
        </div>
      </div>

      {/* 6. DETTAGLI DEL PREZZO + 8. TOTALE */}
      <hr className="divider-horizontal" />
      <p className="label-uppercase-muted">{t.priceSection}</p>
      {hasPricing ? (
        <>
          <div className="layout-row-between">
            <span>{nights} {nights === 1 ? t.night : t.nights} × {fmt(perNight)}</span>
            <span>{fmt(offerPrice)}</span>
          </div>
          {touristTax > 0 && (
            <>
              <div className="layout-row-between">
                <span>{t.touristTax}</span>
                <span>{fmt(touristTax)}</span>
              </div>
              <p className="hint-text">{t.touristTaxNote}</p>
            </>
          )}
          <div className="booking-sidebar__total">
            <span className="booking-sidebar__total-label">{t.total}</span>
            <span className="booking-sidebar__total-value">{fmt(totalWithTax)}</span>
          </div>
        </>
      ) : (
        <p className="hint-text">{t.priceWaitingMsg}</p>
      )}

      {/* 9. CANCELLAZIONE */}
      <hr className="divider-horizontal" />
      <p className="label-uppercase-muted">{t.cancellationSection}</p>
      <p className="hint-text">
        {offerCondition ? (offerName ? `${offerName} — ${offerCondition}` : offerCondition) : t.cancellationPendingMsg}
      </p>

      {/* 10. BANNER 🔐 DEPOSITO */}
      <div className="banner banner--warning banner--with-icon">
        <i className="bi bi-shield-lock-fill" aria-hidden="true"></i>
        <div>
          <p className="banner__title">
            {t.depositTitle}{room?.securityDeposit ? ` — €${room.securityDeposit}` : ''}
          </p>
          <p className="banner__text">{depositText}</p>
        </div>
      </div>

      {/* 11. CTA */}
      {showContinua && (
        <button
          onClick={handleContinua}
          className="btn btn--primary booking-sidebar__cta"
          disabled={!selectedOfferId}
        >
          {t.continua}
        </button>
      )}

      {/* 12. CIN/CIR footer */}
      <p className="booking-sidebar__footer">{t.cinLabel} {CIN}</p>
    </div>
  );
}
