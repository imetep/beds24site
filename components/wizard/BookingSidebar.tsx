'use client';

/**
 * BookingSidebar — riepilogo soggiorno wizard unificato step 1 e step 2.
 * Spec: docs/ux/wizard-sidebar-design.md (v3 ratificato)
 * Look master: SidebarContent di WizardStep2 (ratificato 2026-04-19).
 *
 * Sessione 3c.1: rifacimento visuale step 1 (banner titolo+testo, dati verticali, totale).
 * Sessione 3c.2: API estesa con prop `step`, slot `step2VoucherSlot` / `step2ExtrasSlot`,
 *   callback `onEditDates` / `onEditGuests`, override `ctaLabel`. Il componente rende
 *   i blocchi voucher/extras solo quando step=2 e mostra i bottoni "Modifica" inline.
 *   Il cablaggio a WizardStep2 avviene in 3c.3.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES, OFFER_INFO, calculateTouristTax, formatTouristTaxNote, type Room, type Property } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import type { Locale } from '@/config/i18n';
import EditDatesModal from './EditDatesModal';
import EditGuestsModal from './EditGuestsModal';

interface Props {
  locale?: string;
  step?: 1 | 2;
  onContinua?: () => void;
  canContinua?: boolean;
  // step=2 only
  step2VoucherSlot?: ReactNode;
  step2ExtrasSlot?: ReactNode;
  onEditDates?: () => void;
  onEditGuests?: () => void;
  ctaLabel?: string;
}

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

function formatDate(ymd: string, locale: string) {
  return new Date(ymd + 'T00:00:00').toLocaleDateString(
    locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }
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


export default function BookingSidebar({
  locale = 'it',
  step = 1,
  onContinua,
  canContinua,
  step2VoucherSlot,
  step2ExtrasSlot,
  onEditDates,
  onEditGuests,
  ctaLabel,
}: Props) {
  const tr = getTranslations(locale as Locale);
  const t = tr.components.wizardSidebar;
  const OFFER_NAMES = tr.shared.offerNames as Record<string, string>;

  const {
    numAdult, numChild, childrenAges, checkIn, checkOut,
    selectedRoomId, selectedOfferId, cachedOffers,
    selectedExtras, voucherCode, discountedPrice,
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
  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);

  // Step 2 addendum: voucher discount + extras contribute al totale e appaiono
  // come righe supplementari nel price breakdown.
  const basePrice = step === 2 && discountedPrice !== null ? discountedPrice : offerPrice;
  const voucherSaving = step === 2 && discountedPrice !== null ? offerPrice - discountedPrice : 0;
  const extrasTotal = step === 2
    ? selectedExtras.reduce((sum, e) => sum + e.price * e.quantity, 0)
    : 0;
  const totalWithTax = basePrice + touristTax + extrasTotal;

  const offerInfo = offer ? OFFER_INFO[offer.offerId as number] : null;
  const offerCondition = offerInfo?.conditions[locale] ?? offerInfo?.conditions.it ?? null;

  const handleContinua = onContinua ?? nextStep;
  // Step 1: CTA shown solo se selezionata un'offerta (legacy behaviour).
  // Step 2: CTA opt-in — visibile solo se il caller passa `onContinua`
  //         (WizardStep2 tiene la CTA sotto il form, non nella sidebar).
  const showContinua = step === 2
    ? onContinua !== undefined
    : (canContinua !== undefined ? canContinua : !!selectedOfferId);
  const ctaDisabled = step === 2
    ? canContinua === false
    : !selectedOfferId;
  const hasPricing = offerPrice > 0 && nights > 0;

  const depositText = room?.securityDeposit
    ? t.depositText.replace('{amount}', String(room.securityDeposit))
    : t.depositTextGeneric;

  // Round 1 sidebar 2026-04-29 — toggle banner consumi cliccabile
  const [energyExpanded, setEnergyExpanded] = useState(false);
  // Round 2 sidebar 2026-04-29 — modali Modifica Date / Ospiti
  const [showEditDates, setShowEditDates] = useState(false);
  const [showEditGuests, setShowEditGuests] = useState(false);
  // In step=1 i bottoni Modifica funzionano (aprono modale).
  // In step=2 il caller passa onEditDates/Guests con la sua logica.
  const editDatesHandler = step === 1 ? () => setShowEditDates(true) : onEditDates;
  const editGuestsHandler = step === 1 ? () => setShowEditGuests(true) : onEditGuests;

  // i18n fallback per cancellation (pre-tariffa) — chiavi nuove possono mancare a runtime
  const tAny = t as any;
  const cancellationFallbackTitle: string = tAny.cancellationFallbackTitle ?? 'Termini di cancellazione';
  const cancellationFallbackText: string = tAny.cancellationFallbackText ?? 'Per conoscere i termini di cancellazione devi scegliere una delle tariffe nella lista degli appartamenti';

  return (
    <div className="booking-sidebar">
      {/* 1. HERO — 2 varianti
          A) no tariffa selezionata: foto wide 100% h=103
          B) tariffa selezionata:    foto 103×103 sx + nome+caratteristiche dx */}
      {room ? (
        <div className="booking-sidebar__hero-row">
          <img
            src={heroUrl}
            alt={room.name}
            className="booking-sidebar__hero-img--compact"
            loading="lazy"
          />
          <div className="booking-sidebar__hero-info">
            <p className="section-title-secondary">{room.name}</p>
            <ul className="feature-list">
              <li className="feature-list__item">
                <i className="bi bi-door-closed-fill" aria-hidden="true" />
                {room.bedrooms} {t.bedrooms}
              </li>
              <li className="feature-list__item">
                <i className="bi bi-droplet-fill" aria-hidden="true" />
                {room.bathrooms} {t.bathrooms}
              </li>
              <li className="feature-list__item">
                <i className="bi bi-people-fill" aria-hidden="true" />
                {room.maxPeople} {t.people}
              </li>
              {poolLabel(t, room) && (
                <li className="feature-list__item">
                  <i className="bi bi-water" aria-hidden="true" />
                  {poolLabel(t, room)}
                </li>
              )}
              {room.features.patio && (
                <li className="feature-list__item">
                  <i className="bi bi-house-door-fill" aria-hidden="true" />
                  {t.featurePatio}
                </li>
              )}
              {room.features.garden && (
                <li className="feature-list__item">
                  <i className="bi bi-tree-fill" aria-hidden="true" />
                  {t.featureGarden}
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="booking-sidebar__hero">
          <img
            src={heroUrl}
            alt="LivingApple"
            className="booking-sidebar__hero-img"
            loading="lazy"
          />
        </div>
      )}

      {/* 2. CANCELLAZIONE — sempre visibile
          A) no tariffa: titolo+sub fallback (i18n)
          B) tariffa:    name + conditions da OFFER_INFO[offerId] */}
      <div className="booking-sidebar__cancellation">
        <p className="booking-sidebar__cancellation-title">
          {offerName ?? cancellationFallbackTitle}
        </p>
        <p className="booking-sidebar__cancellation-text">
          {offerCondition ?? cancellationFallbackText}
        </p>
      </div>

      {/* 3. BANNER DEPOSITO (compatto, fisso) */}
      <div className="banner banner--warning banner--compact banner--with-icon">
        <i className="bi bi-shield-lock-fill" aria-hidden="true"></i>
        <div>
          <p className="banner__title">
            {t.depositTitle}{room?.securityDeposit ? ` — €${room.securityDeposit}` : ''}
          </p>
          <p className="banner__text">{depositText}</p>
        </div>
      </div>

      {/* 4. BANNER CONSUMI (compatto, cliccabile expand/collapse) */}
      <button
        type="button"
        onClick={() => setEnergyExpanded((e) => !e)}
        aria-expanded={energyExpanded}
        className={`banner banner--info banner--compact banner--with-icon banner--clickable${energyExpanded ? ' is-expanded' : ''}`}
      >
        <i className="bi bi-lightning-fill" aria-hidden="true"></i>
        <span className="banner__title">{t.energyTitle}</span>
        <i className="bi bi-chevron-down banner__chevron" aria-hidden="true"></i>
      </button>
      {energyExpanded && (
        <p className="banner__text-expanded">{t.energyText}</p>
      )}

      {/* 5. VOUCHER (solo step 2) — slot */}
      {step === 2 && step2VoucherSlot && (
        <>
          <hr className="divider-horizontal" />
          {step2VoucherSlot}
        </>
      )}

      {/* 6. DATI CHIAVE — Date · Ospiti (con Modifica btn anche in step 1, disabled placeholder) */}
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
        <button
          type="button"
          onClick={editDatesHandler}
          disabled={!editDatesHandler}
          className="booking-sidebar__edit-btn"
        >
          {t.editBtn}
        </button>
      </div>
      <div className="booking-sidebar__data-row">
        <div className="booking-sidebar__data-cell">
          <p className="booking-sidebar__data-label">{t.guests}</p>
          <p className="booking-sidebar__data-value">
            {numAdult > 0 ? `${numAdult} ${t.adults}${numChild > 0 ? `, ${numChild} ${t.children}` : ''}` : '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={editGuestsHandler}
          disabled={!editGuestsHandler}
          className="booking-sidebar__edit-btn"
        >
          {t.editBtn}
        </button>
      </div>

      {/* 7. DETTAGLI DEL PREZZO */}
      <hr className="divider-horizontal" />
      <p className="label-uppercase-muted">{t.priceSection}</p>
      {hasPricing ? (
        <>
          <div className="layout-row-between">
            <span>{nights} {nights === 1 ? t.night : t.nights} × {fmt(perNight)}</span>
            <span>{fmt(offerPrice)}</span>
          </div>
          {step === 2 && voucherSaving > 0 && (
            <div className="layout-row-between booking-sidebar__price-discount">
              <span>{t.voucherDiscount}{voucherCode ? ` (${voucherCode})` : ''}</span>
              <span>− {fmt(voucherSaving)}</span>
            </div>
          )}
          {step === 2 && selectedExtras.map(extra => (
            <div key={extra.id} className="price-row">
              <span>{extra.name[locale] ?? extra.name.it}{extra.quantity > 1 ? ` ×${extra.quantity}` : ''}</span>
              <span>+ {fmt(extra.price * extra.quantity)}</span>
            </div>
          ))}
          {touristTax > 0 && (
            <>
              <div className="layout-row-between">
                <span>{t.touristTax}</span>
                <span>{fmt(touristTax)}</span>
              </div>
              <p className="hint-text">{formatTouristTaxNote(t.touristTaxNote)}</p>
            </>
          )}
        </>
      ) : (
        <p className="hint-text">{t.priceWaitingMsg}</p>
      )}

      {/* 8. SERVIZI EXTRA (solo step 2) — slot */}
      {step === 2 && step2ExtrasSlot && (
        <>
          <hr className="divider-horizontal" />
          {step2ExtrasSlot}
        </>
      )}

      {/* 9. TOTALE */}
      {hasPricing && (
        <div className="booking-sidebar__total">
          <span className="booking-sidebar__total-label">{t.total}</span>
          <span className="booking-sidebar__total-value">{fmt(totalWithTax)}</span>
        </div>
      )}

      {/* 10. CTA */}
      {showContinua && (
        <button
          onClick={handleContinua}
          className="btn btn--primary booking-sidebar__cta"
          disabled={ctaDisabled}
        >
          {ctaLabel ?? t.continua}
        </button>
      )}
      {/* Footer CIN rimosso (Round 1 sidebar 2026-04-29) */}

      {/* Round 2: modali Modifica Date / Ospiti (solo step 1 di default) */}
      {showEditDates && (
        <EditDatesModal locale={locale} onClose={() => setShowEditDates(false)} />
      )}
      {showEditGuests && (
        <EditGuestsModal locale={locale} onClose={() => setShowEditGuests(false)} />
      )}
    </div>
  );
}
