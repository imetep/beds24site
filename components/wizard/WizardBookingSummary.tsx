'use client';

/**
 * WizardBookingSummary — wrapper "container" che connette lo store wizard
 * al primitivo presentazionale BookingSummary.
 *
 * Responsabilità:
 * - Leggere dati dallo store wizard (date, ospiti, offerta, residenza).
 * - Caricare la cover foto Cloudinary dell'appartamento selezionato.
 * - Calcolare prezzo totale CON tassa di soggiorno (principio chiarezza:
 *   mostriamo il prezzo finale, non "da €X").
 * - Tradurre le label i18n.
 *
 * Il primitivo BookingSummary resta dumb (pure props), riusabile altrove
 * (es. /guest/portal) con wrapper differente.
 */

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import BookingSummary from '@/components/ui/BookingSummary';
import type { Locale } from '@/config/i18n';

interface Props {
  locale: string;
  /** Se fornito, la CTA Continua viene mostrata (desktop, solo agli step dove ha senso avere CTA in sidebar). */
  onContinua?: () => void;
  /** Abilitata quando lo step corrente ha i dati necessari per procedere. */
  canContinua?: boolean;
}

export default function WizardBookingSummary({ locale, onContinua, canContinua }: Props) {
  const tr = getTranslations(locale as Locale);
  const t = tr.components.wizardSidebar;
  const OFFER_NAMES = tr.shared.offerNames as Record<string, string>;

  const {
    numAdult,
    numChild,
    childrenAges,
    checkIn,
    checkOut,
    selectedRoomId,
    selectedOfferId,
    cachedOffers,
  } = useWizardStore();

  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);

  const room = selectedRoomId
    ? PROPERTIES.flatMap((p) => p.rooms).find((r) => r.roomId === selectedRoomId)
    : null;

  // Fetch cover Cloudinary della residenza selezionata (solo quando cambia).
  useEffect(() => {
    if (!room?.cloudinaryFolder) {
      setCoverUrl(undefined);
      return;
    }
    fetchCoversCached().then((covers) =>
      setCoverUrl(covers?.[room.cloudinaryFolder] ?? undefined)
    );
  }, [room?.cloudinaryFolder]);

  // ── Calcolo prezzi ────────────────────────────────────────────────────────
  // Cerca l'offerta prima nella room selezionata, poi fallback globale
  // (stesso schema usato negli step, evita di mostrare prezzo di un'altra room).
  const roomOffers = cachedOffers?.find((ro: any) => ro.roomId === selectedRoomId);
  const offer =
    roomOffers?.offers?.find((o: any) => o.offerId === selectedOfferId) ??
    cachedOffers
      ?.flatMap((ro: any) => ro.offers ?? [])
      .find((o: any) => o.offerId === selectedOfferId);

  const offerName: string | undefined = offer
    ? OFFER_NAMES[String(offer.offerId)] ?? String(offer.offerName ?? '')
    : undefined;
  const offerPrice: number = offer?.price ?? 0;

  const nights =
    checkIn && checkOut
      ? Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
        )
      : 0;

  // Tassa di soggiorno: €2/notte/adulto (bambini >=12 contano come adulti),
  // max 10 notti consecutive per ospite (regolamento comunale Scauri).
  const childrenTaxable = (childrenAges ?? []).filter((a: number) => a >= 12).length;
  const taxableAdults = numAdult + childrenTaxable;
  const taxableNights = Math.min(nights, 10);
  const touristTax = taxableNights * taxableAdults * 2;

  const totalWithTax = offerPrice > 0 ? offerPrice + touristTax : 0;
  const perNight = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;

  // Label Continua: rimuovo eventuale "→" finale perché il primitivo lo aggiunge.
  const ctaContinue = t.continua.replace(/\s*→\s*$/, '').trim();

  return (
    <BookingSummary
      labels={{
        title: t.title,
        checkin: t.checkin,
        checkout: t.checkout,
        nights: t.nights,
        night: t.night,
        guests: t.guests,
        adults: t.adults,
        children: t.children,
        rate: t.rate,
        total: t.total,
        perNight: t.perNight,
        ctaContinue,
      }}
      locale={locale}
      roomName={room?.name}
      roomCoverUrl={coverUrl}
      checkIn={checkIn || undefined}
      checkOut={checkOut || undefined}
      numAdults={numAdult || undefined}
      numChildren={numChild || undefined}
      offerName={offerName}
      totalPrice={totalWithTax || undefined}
      pricePerNight={perNight || undefined}
      ctaDisabled={!canContinua}
      onCta={onContinua}
    />
  );
}
