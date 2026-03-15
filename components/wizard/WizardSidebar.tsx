'use client';

import { useEffect, useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';

// ─── Offer names ──────────────────────────────────────────────────────────────
const OFFER_NAMES: Record<number, Record<string,string>> = {
  1: { it:'Non Rimborsabile',          en:'Non-Refundable',        de:'Nicht erstattungsfähig',  pl:'Bezzwrotna' },
  2: { it:'Parzialmente Rimborsabile', en:'Partially Refundable',  de:'Teilw. erstattungsfähig', pl:'Częściowo zwrotna' },
  3: { it:'Flessibile 60 gg',          en:'Flexible 60 days',      de:'Flexibel 60 Tage',        pl:'Elastyczna 60 dni' },
  4: { it:'Flessibile 45 gg',          en:'Flexible 45 days',      de:'Flexibel 45 Tage',        pl:'Elastyczna 45 dni' },
  5: { it:'Flessibile 30 gg',          en:'Flexible 30 days',      de:'Flexibel 30 Tage',        pl:'Elastyczna 30 dni' },
  6: { it:'Flessibile 5 gg',           en:'Flexible 5 days',       de:'Flexibel 5 Tage',         pl:'Elastyczna 5 dni' },
};

const UI: Record<string,Record<string,string>> = {
  it: { title:'Il tuo soggiorno', checkin:'Check-in', checkout:'Check-out',
        guests:'Ospiti', adults:'adulti', children:'bambini',
        nights:'notti', night:'notte', rate:'Tariffa',
        total:'Totale', perNight:'/notte', noRoom:'Scegli un appartamento',
        continua:'Continua →',
        energy:'Consumi energetici a consumo — contatori in ogni abitazione',
        deposit:'Deposito cauzionale richiesto — rimborsabile al check-out',
        prof1:'La professionalità ci rende diversi',
        prof2:'Lusso al giusto prezzo',
        nature:'A 1,5 km dal mare, immerso nella natura',
        beach:'A 250 metri dal mare',
        poolNote:'A 250 metri dal mare la piscina non è necessaria — il mare è a portata di mano',
      },
  en: { title:'Your stay', checkin:'Check-in', checkout:'Check-out',
        guests:'Guests', adults:'adults', children:'children',
        nights:'nights', night:'night', rate:'Rate',
        total:'Total', perNight:'/night', noRoom:'Choose an apartment',
        continua:'Continue →',
        energy:'Energy billed by actual usage — meters in each unit',
        deposit:'Security deposit required — refunded at check-out',
        prof1:'Professionalism sets us apart',
        prof2:'Luxury at the right price',
        nature:'1.5km from the sea, surrounded by nature',
        beach:'250 metres from the sea',
        poolNote:'Just 250m from the sea — you may not need a pool at all',
      },
  de: { title:'Ihr Aufenthalt', checkin:'Check-in', checkout:'Check-out',
        guests:'Gäste', adults:'Erwachsene', children:'Kinder',
        nights:'Nächte', night:'Nacht', rate:'Tarif',
        total:'Gesamt', perNight:'/Nacht', noRoom:'Unterkunft wählen',
        continua:'Weiter →',
        energy:'Energiekosten nach Verbrauch — Zähler in jeder Einheit',
        deposit:'Kaution erforderlich — Rückgabe bei Check-out',
        prof1:'Professionalität macht uns besonders',
        prof2:'Luxus zum richtigen Preis',
        nature:'1,5 km vom Meer, eingebettet in die Natur',
        beach:'250 Meter vom Meer',
        poolNote:'Nur 250m vom Meer — ein Pool ist vielleicht gar nicht nötig',
      },
  pl: { title:'Twój pobyt', checkin:'Zameldowanie', checkout:'Wymeldowanie',
        guests:'Goście', adults:'dorośli', children:'dzieci',
        nights:'nocy', night:'noc', rate:'Taryfa',
        total:'Łącznie', perNight:'/noc', noRoom:'Wybierz apartament',
        continua:'Dalej →',
        energy:'Koszty energii według zużycia — liczniki w każdym lokalu',
        deposit:'Kaucja wymagana — zwracana przy wymeldowaniu',
        prof1:'Profesjonalizm nas wyróżnia',
        prof2:'Luksus w dobrej cenie',
        nature:'1,5 km od morza, otoczony naturą',
        beach:'250 metrów od morza',
        poolNote:'Zaledwie 250m od morza — basen może nie być potrzebny',
      },
};

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
  const t   = UI[locale] ?? UI.it;
  const loc = locale in UI ? locale : 'it';

  const { numAdult, numChild, checkIn, checkOut, selectedRoomId, selectedOfferId, cachedOffers, poolPreference, nextStep } = useWizardStore();

  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const room = selectedRoomId
    ? PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === selectedRoomId)
    : null;

  // Fetch cover foto appartamento (solo quando selezionato)
  useEffect(() => {
    if (!room?.cloudinaryFolder) { setCoverUrl(null); return; }
    fetch('/api/cloudinary?covers=true')
      .then(r => r.ok ? r.json() : null)
      .then(data => setCoverUrl(data?.covers?.[room.cloudinaryFolder] ?? null))
      .catch(() => {});
  }, [room?.cloudinaryFolder]);

  const offer = cachedOffers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerName  = offer ? (OFFER_NAMES[offer.offerId]?.[loc] ?? offer.offerName) : null;
  const offerPrice: number = offer?.price ?? 0;
  const nights  = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;
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
    <div style={{
      width: 250, flexShrink: 0, marginLeft: 32,
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '20px 18px',
      position: 'sticky', top: 90,
      alignSelf: 'flex-start',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', margin: '0 0 14px' }}>
        {t.title}
      </p>

      {/* Sezione superiore contestuale per step */}
      {renderTopSection()}

      <div style={{ height: 1, background: '#e5e7eb', margin: '0 0 12px' }} />

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
          <div style={{ height: 1, background: '#e5e7eb', margin: '10px 0' }} />
          <Row label={t.rate} value={offerName} active />
        </>
      )}

      {/* Prezzo (solo da step 5 in poi) */}
      {offerPrice > 0 && step >= 5 && (
        <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 12, paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{t.total}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#1E73BE' }}>{fmt(offerPrice)}</span>
          </div>
          {perNight > 0 && (
            <p style={{ fontSize: 12, color: '#c4c4c4', margin: '2px 0 0', textAlign: 'right' }}>
              {fmt(perNight)}{t.perNight}
            </p>
          )}
        </div>
      )}

      {/* Bottone Continua (solo Step 5 su desktop) */}
      {showContinua && (
        <button
          onClick={handleContinua}
          style={{
            width: '100%', padding: '11px 0',
            marginTop: 16, borderRadius: 10, border: 'none',
            background: '#FCAF1A', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
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
  if (!src) return <div style={{ height: 130, borderRadius: 10, background: '#e5e7eb', marginBottom: 10 }} />;
  return (
    <div style={{ height: 130, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <iframe src={src} width="100%" height="130" style={{ border: 0, display: 'block' }}
        loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mappa" />
    </div>
  );
}

function PhotoFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{ height: 130, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
    </div>
  );
}

function NightsBadge({ nights, label }: { nights: number; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF5FC', border: '1.5px solid #1E73BE', borderRadius: 20, padding: '5px 14px', marginBottom: 10 }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: '#0f4c7a' }}>{nights}</span>
      <span style={{ fontSize: 13, color: '#1E73BE', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function InfoItem({ children, icon, bold, italic }: { children: React.ReactNode; icon?: string; bold?: boolean; italic?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 8 }}>
      {icon && <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>}
      <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.45, fontWeight: bold ? 700 : 400, fontStyle: italic ? 'italic' : 'normal' }}>
        {children}
      </p>
    </div>
  );
}

function Row({ label, value, active, muted }: { label: string; value: string; active?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0' }}>
      <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : muted ? 500 : 400, color: active ? '#111' : muted ? '#555' : '#d4d4d4' }}>{value}</span>
    </div>
  );
}
