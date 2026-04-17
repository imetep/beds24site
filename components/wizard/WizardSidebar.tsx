'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import type { Locale } from '@/config/i18n';

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}
function formatDate(ymd: string, locale: string) {
  return new Date(ymd + 'T00:00:00').toLocaleDateString(
    locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'short' }
  );
}
function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

// Costruisce URL immagine Cloudinary
function cloudUrl(folder: string, width = 500) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dsnlduczj';
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${width},h_140,c_fill,q_auto,f_auto/${folder}`;
}

interface Props {
  locale?: string;
  step?: number; // logicalStep passato da Wizard.tsx
  onContinua?: () => void;
  canContinua?: boolean;
}

export default function WizardSidebar({ locale = 'it', step = 1, onContinua, canContinua }: Props) {
  const tr  = getTranslations(locale as Locale);
  const t   = tr.components.wizardSidebar;
  const OFFER_NAMES = tr.shared.offerNames as Record<string, string>;
  const loc = (['it','en','de','pl'] as const).includes(locale as Locale) ? locale : 'it';

  const { numAdult, numChild, childrenAges, checkIn, checkOut, selectedRoomId, selectedOfferId, cachedOffers, poolPreference, nextStep } = useWizardStore();

  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const room = selectedRoomId
    ? PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === selectedRoomId)
    : null;

  // Fetch cover foto appartamento (solo quando selezionato)
  useEffect(() => {
    if (!room?.cloudinaryFolder) { setCoverUrl(null); return; }
    fetchCoversCached().then(covers => setCoverUrl(covers?.[room.cloudinaryFolder] ?? null));
  }, [room?.cloudinaryFolder]);

  // ✅ FIX: cerca prima nella room selezionata, poi fallback globale
  // (stesso pattern di WizardStep2/3 — evita di mostrare prezzo di unaltra room)
  const roomOffers = cachedOffers?.find((ro: any) => ro.roomId === selectedRoomId);
  const offer = roomOffers?.offers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerName: string | null = offer ? (OFFER_NAMES[String(offer.offerId)] ?? String(offer.offerName ?? '')) : null;
  const offerPrice: number = offer?.price ?? 0;
  const nights  = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
  const childrenTaxable = (childrenAges ?? []).filter((a: number) => a >= 12).length;
  const taxableAdults   = numAdult + childrenTaxable;
  const taxableNights   = Math.min(nights, 10);
  const touristTax      = taxableNights * taxableAdults * 2;
  const totalWithTax    = offerPrice + touristTax;
  const perNight = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

  // Mappa Scauri (Step1) — zoom ridotto per vedere più territorio
  const mapScauri = mapsKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=41.2590,13.7050&zoom=11&language=${loc}`
    : '';
  // Mappa LivingApple Beach (Step2) — zoom 15 sulla spiaggia
  const mapBeach = mapsKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=41.237587,13.74424&zoom=11&language=${loc}`
    : '';

  // Foto piscina — Kissabel ha la piscina privata più bella
  const poolPhotoUrl = cloudUrl('livingapple/kissabel');
  const poolSpecificUrl = cloudUrl('17_iqlmy7.jpg');
  const beachUrl = cloudUrl('DSC05154_phrl3z.jpg');
  const step5Photo = cloudUrl('_DSC2502_laqzeh.jpg');
  // Foto LivingApple natura
  const naturaPhotoUrl = cloudUrl('livingapple/stark');

  const handleContinua = onContinua ?? nextStep;
  const showContinua   = canContinua !== undefined ? canContinua : !!selectedOfferId;

  // ── Sezione superiore: cambia per step ────────────────────────────────────
  function renderTopSection() {
    // Step 1 — Ospiti: mappa Scauri + messaggi brand
    if (step === 1) return (
      <div style={{ marginBottom: 14 }}>
        <MapFrame src={mapScauri} />
        <InfoItem bold>{t.prof1}</InfoItem>
        <InfoItem>{t.prof2}</InfoItem>
      </div>
    );

    // Step 2 — Date: mappa Beach + distanze, notti in evidenza
    if (step === 2) return (
      <div style={{ marginBottom: 14 }}>
        <MapFrame src={mapBeach} />
        <InfoItem icon="🌿">{t.nature}</InfoItem>
        <InfoItem icon="🏖️">{t.beach}</InfoItem>
      </div>
    );

    // Step 3 — Piscina: foto piscina + nota sul mare
    if (step === 3) return (
      <div style={{ marginBottom: 14 }}>
        <PhotoFrame src={poolSpecificUrl} alt="Piscina LivingApple" />
        <InfoItem icon="ℹ️" italic>{t.poolNote}</InfoItem>
      </div>
    );

    // Step 4 — Under12: foto piscina (se vuole piscina) o spiaggia (se non interessa)
    if (step === 4) {
      return (
        <div style={{ marginBottom: 14 }}>
          <PhotoFrame src={beachUrl} alt="LivingApple Beach" />
          <InfoItem icon="⚡">{t.energy}</InfoItem>
          <InfoItem icon="🔐">{t.deposit}</InfoItem>
        </div>
      );
    }

    // Step 5 — Tariffa: foto appartamento se noto, altrimenti _DSC2502_laqzeh
    if (step === 5) return (
      <div style={{ marginBottom: 14 }}>
        {room ? (
          <div style={{ width: '100%', height: 130, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
            {coverUrl
              ? <img src={coverUrl} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <img src={step5Photo} alt="LivingApple" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            }
          </div>
        ) : (
          <PhotoFrame src={step5Photo} alt="LivingApple" />
        )}
        <InfoItem icon="⚡">{t.energy}</InfoItem>
        <InfoItem icon="🔐">{t.deposit}</InfoItem>
      </div>
    );

    return null;
  }

  return (
    <div
      className="flex-shrink-0 border position-sticky align-self-start"
      style={{
        width: 250, marginLeft: 32,
        background: '#f9fafb',
        borderRadius: 16,
        padding: '20px 18px',
        top: 90,
      }}
    >
      <p
        className="fw-bold text-uppercase text-muted mb-3"
        style={{ fontSize: 11, letterSpacing: '0.07em' }}
      >
        {t.title}
      </p>

      {/* Sezione superiore contestuale per step */}
      {renderTopSection()}

      <div className="mb-3" style={{ height: 1, background: '#e5e7eb' }} />

      {/* Riepilogo dati sempre visibili */}
      <Row label={t.checkin}  value={checkIn  ? formatDate(checkIn,  locale) : '—'} active={!!checkIn} />
      <Row label={t.checkout} value={checkOut ? formatDate(checkOut, locale) : '—'} active={!!checkOut} />
      {nights > 0 && <Row label="" value={`${nights} ${nights === 1 ? t.night : t.nights}`} muted />}
      {numAdult > 0 && (
        <Row label={t.guests}
          value={`${numAdult} ${t.adults}${numChild > 0 ? `, ${numChild} ${t.children}` : ''}`}
          active
        />
      )}

      {/* Tariffa selezionata (solo da step 5) */}
      {offerName && step >= 5 && (
        <>
          <div className="my-2" style={{ height: 1, background: '#e5e7eb' }} />
          <Row label={t.rate} value={offerName} active />
        </>
      )}

      {/* Prezzo (solo da step 5 in poi) */}
      {offerPrice > 0 && step >= 5 && (
        <div className="border-top mt-3 pt-3">
          <div className="d-flex justify-content-between align-items-baseline">
            <span className="text-muted" style={{ fontSize: 12 }}>{t.total}</span>
            <span className="fw-bolder" style={{ fontSize: 22, color: 'var(--color-primary)' }}>{fmt(totalWithTax)}</span>
          </div>
          {perNight > 0 && (
            <p className="text-end mb-0" style={{ fontSize: 12, color: '#c4c4c4', marginTop: 2 }}>
              {fmt(perNight)}{t.perNight}
            </p>
          )}
        </div>
      )}

      {/* Bottone Continua (solo Step 5 su desktop) */}
      {showContinua && (
        <button
          onClick={handleContinua}
          className="w-100 fw-bold text-white border-0 mt-3"
          style={{
            padding: '11px 0',
            borderRadius: 10,
            background: '#FCAF1A',
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {t.continua}
        </button>
      )}
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function MapFrame({ src }: { src: string }) {
  if (!src) return <div className="mb-2" style={{ height: 130, borderRadius: 10, background: '#e5e7eb' }} />;
  return (
    <div className="overflow-hidden mb-2" style={{ height: 130, borderRadius: 10 }}>
      <iframe src={src} width="100%" height="130" className="d-block border-0"
        loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mappa" />
    </div>
  );
}

function PhotoFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden mb-2" style={{ height: 130, borderRadius: 10 }}>
      <img src={src} alt={alt} className="w-100 h-100 d-block" style={{ objectFit: 'cover' }} loading="lazy" />
    </div>
  );
}

function NightsBadge({ nights, label }: { nights: number; label: string }) {
  return (
    <div
      className="d-inline-flex align-items-center mb-2 rounded-pill"
      style={{ gap: 6, background: '#EEF5FC', border: '1.5px solid #1E73BE', padding: '5px 14px' }}
    >
      <span className="fw-bolder" style={{ fontSize: 18, color: '#0f4c7a' }}>{nights}</span>
      <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--color-primary)' }}>{label}</span>
    </div>
  );
}

function InfoItem({ children, icon, bold, italic }: { children: React.ReactNode; icon?: string; bold?: boolean; italic?: boolean }) {
  return (
    <div className="d-flex align-items-start mb-2" style={{ gap: 7 }}>
      {icon && <span className="flex-shrink-0" style={{ fontSize: 13, lineHeight: 1.5 }}>{icon}</span>}
      <p
        className="m-0"
        style={{ fontSize: 12, color: '#555', lineHeight: 1.45, fontWeight: bold ? 700 : 400, fontStyle: italic ? 'italic' : 'normal' }}
      >
        {children}
      </p>
    </div>
  );
}

function Row({ label, value, active, muted }: { label: string; value: string; active?: boolean; muted?: boolean }) {
  return (
    <div className="d-flex justify-content-between align-items-baseline" style={{ padding: '3px 0' }}>
      <span className="text-muted" style={{ fontSize: 12 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : muted ? 500 : 400, color: active ? '#111' : muted ? '#555' : '#d4d4d4' }}>{value}</span>
    </div>
  );
}
