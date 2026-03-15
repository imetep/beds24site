import { notFound } from 'next/navigation';
import Link from 'next/link';
import { v2 as cloudinary } from 'cloudinary';
import { getRoomBySlug, getPropertyForRoom, PROPERTIES } from '@/config/properties';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import ThingsToKnow from '@/components/residenze/ThingsToKnow';
import PhotoLightbox from '@/components/residenze/PhotoLightbox';
import PropertyMap from '@/components/residenze/PropertyMap';
import AvailabilityCalendar from '@/components/residenze/AvailabilityCalendar';


cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const revalidate = 3600; // ISR: rigenera ogni ora, 0 chiamate Cloudinary tra un refresh e l'altro

export async function generateStaticParams() {
  const params = [];
  for (const locale of locales) {
    for (const property of PROPERTIES) {
      for (const room of property.rooms) {
        params.push({ locale, slug: room.slug });
      }
    }
  }
  return params;
}

// Feature codes → icona + label IT
const FEATURE_LABELS: Record<string, { icon: string; it: string; en: string; de: string; pl: string }> = {
  WIFI:                { icon: '📶', it: 'WiFi gratuito',        en: 'Free WiFi',          de: 'Kostenloses WLAN',     pl: 'Bezpłatne WiFi' },
  AIR_CONDITIONING:    { icon: '❄️', it: 'Aria condizionata',    en: 'Air conditioning',   de: 'Klimaanlage',          pl: 'Klimatyzacja' },
  HEATING:             { icon: '🔥', it: 'Riscaldamento',        en: 'Heating',            de: 'Heizung',              pl: 'Ogrzewanie' },
  PARKING_INCLUDED:    { icon: '🚗', it: 'Parcheggio incluso',   en: 'Free parking',       de: 'Kostenloser Parkplatz',pl: 'Bezpłatny parking' },
  WASHER:              { icon: '🧺', it: 'Lavatrice',            en: 'Washer',             de: 'Waschmaschine',        pl: 'Pralka' },
  DISHWASHER:          { icon: '🍽️', it: 'Lavastoviglie',        en: 'Dishwasher',         de: 'Geschirrspüler',       pl: 'Zmywarka' },
  TV:                  { icon: '📺', it: 'TV',                   en: 'TV',                 de: 'Fernseher',            pl: 'Telewizor' },
  HAIR_DRYER:          { icon: '💨', it: 'Asciugacapelli',       en: 'Hair dryer',         de: 'Haartrockner',         pl: 'Suszarka' },
  KITCHEN:             { icon: '🍳', it: 'Cucina attrezzata',    en: 'Full kitchen',       de: 'Küche',                pl: 'Kuchnia' },
  KITCHEN_DINING_ROOM: { icon: '🍳', it: 'Cucina con sala da pranzo', en: 'Kitchen & dining', de: 'Küche & Esszimmer', pl: 'Kuchnia i jadalnia' },
  MICROWAVE:           { icon: '📡', it: 'Microonde',            en: 'Microwave',          de: 'Mikrowelle',           pl: 'Mikrofalówka' },
  OVEN:                { icon: '🥘', it: 'Forno',                en: 'Oven',               de: 'Backofen',             pl: 'Piekarnik' },
  COFFEE_MAKER:        { icon: '☕', it: 'Macchina del caffè',   en: 'Coffee maker',       de: 'Kaffeemaschine',       pl: 'Ekspres do kawy' },
  FREEZER:             { icon: '🧊', it: 'Congelatore',          en: 'Freezer',            de: 'Gefrierschrank',       pl: 'Zamrażarka' },
  REFRIGERATOR:        { icon: '🧊', it: 'Frigorifero',          en: 'Refrigerator',       de: 'Kühlschrank',          pl: 'Lodówka' },
  STOVE:               { icon: '🔥', it: 'Fornelli',             en: 'Stove',              de: 'Herd',                 pl: 'Kuchenka' },
  TOASTER:             { icon: '🍞', it: 'Tostapane',            en: 'Toaster',            de: 'Toaster',              pl: 'Toster' },
  KETTLE:              { icon: '🫖', it: 'Bollitore',            en: 'Kettle',             de: 'Wasserkocher',         pl: 'Czajnik' },
  DISHES_UTENSILS:     { icon: '🥄', it: 'Stoviglie e utensili',en: 'Dishes & utensils',  de: 'Geschirr & Utensilien',pl: 'Naczynia i przybory' },
  HIGHCHAIR:           { icon: '👶', it: 'Seggiolone',           en: 'High chair',         de: 'Hochstuhl',            pl: 'Krzesełko' },
  SWIMMING:            { icon: '🏊', it: 'Piscina',              en: 'Pool',               de: 'Schwimmbad',           pl: 'Basen' },
  GARDEN:              { icon: '🌿', it: 'Giardino',             en: 'Garden',             de: 'Garten',               pl: 'Ogród' },
  BEACH:               { icon: '🏖️', it: 'Vicino alla spiaggia', en: 'Near the beach',    de: 'Strandnähe',           pl: 'Blisko plaży' },
  RURAL:               { icon: '🌾', it: 'Zona rurale',          en: 'Rural area',         de: 'Ländliche Lage',       pl: 'Obszar wiejski' },
  MOUNTAIN_VIEW:       { icon: '⛰️', it: 'Vista montagna',       en: 'Mountain view',      de: 'Bergblick',            pl: 'Widok na góry' },
  SITTING_AREA:        { icon: '🛋️', it: 'Area salotto',         en: 'Sitting area',       de: 'Sitzbereich',          pl: 'Strefa wypoczynku' },
  LANAI_GAZEBO_COVERED:{ icon: '⛺', it: 'Gazebo coperto',       en: 'Covered gazebo',     de: 'Überdachte Terrasse',  pl: 'Altana' },
  WHEELCHAIR_YES:      { icon: '♿', it: 'Accessibile',          en: 'Wheelchair accessible',de: 'Rollstuhlgerecht',   pl: 'Dostępny dla niepełnosprawnych' },
  CHILDREN_WELCOME:    { icon: '👧', it: 'Bambini benvenuti',    en: 'Children welcome',   de: 'Kinder willkommen',    pl: 'Dzieci mile widziane' },
  PETS_NOT_ALLOWED:    { icon: '🐾', it: 'Animali non ammessi',  en: 'No pets',            de: 'Keine Haustiere',      pl: 'Zakaz zwierząt' },
  SMOKING_NOT_ALLOWED: { icon: '🚭', it: 'Non fumatori',         en: 'No smoking',         de: 'Nichtraucher',         pl: 'Zakaz palenia' },
  LONG_TERM_RENTERS:   { icon: '📅', it: 'Soggiorni lunghi ok',  en: 'Long stays welcome', de: 'Langzeitmiete möglich',pl: 'Długie pobyty ok' },
};

// Feature codes per property
const PROPERTY_FEATURES: Record<number, string[]> = {
  46487: ['AIR_CONDITIONING','HEATING','HAIR_DRYER','WASHER','PARKING_INCLUDED','TV','WIFI','MICROWAVE','KITCHEN_DINING_ROOM','FREEZER','OVEN','STOVE','HIGHCHAIR','COFFEE_MAKER','SWIMMING','KETTLE','TOASTER','DISHES_UTENSILS','CHILDREN_WELCOME','PETS_NOT_ALLOWED','SMOKING_NOT_ALLOWED'],
  46871: ['PARKING_INCLUDED','WIFI','BEACH','AIR_CONDITIONING','HEATING','WASHER','DISHWASHER','MICROWAVE','TV','HAIR_DRYER','REFRIGERATOR','KITCHEN','DISHES_UTENSILS','PETS_NOT_ALLOWED','SMOKING_NOT_ALLOWED'],
};

async function getRoomPhotos(folder: string): Promise<string[]> {
  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('public_id', 'asc')
      .max_results(20)
      .execute();
    return result.resources.map((r: any) =>
      cloudinary.url(r.public_id, { width: 1200, crop: 'fill', quality: 'auto', fetch_format: 'auto' })
    );
  } catch {
    return [];
  }
}

async function getRoomDescription(propId: number, roomId: number, lang: string): Promise<string> {
  try {
    const res = await fetch(
      `https://beds24.com/booking2.php?propid=${propId}&roomid=${roomId}&layout=3&lang=${lang}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 86400 } }
    );
    const html = await res.text();
    const regex = new RegExp(
      `class="[^"]*b24-room-107\\s+b24-room-${roomId}[^"]*">([\\s\\S]*?)<script`, 'i'
    );
    const match = html.match(regex);
    if (!match) return '';
    return match[1].replace(/<[^>]+>/g, '').trim();
  } catch {
    return '';
  }
}

const LABELS: Record<string, Record<string, string | ((...args: any[]) => string)>> = {
  it: {
    bedrooms: 'camere', bathrooms: 'bagni', maxPeople: 'ospiti', sqm: 'mq',
    floorGround: 'Piano terra', floor: 'Piano',
    privatePool: '🏊 Piscina privata', sharedPool: '🌊 Piscina condivisa', noPool: '🏖️ 250m dal mare',
    services: 'Servizi', description: 'La residenza',
    checkIn: 'Check-in', checkOut: 'Check-out',
    prenota: 'Prenota ora', back: '← Torna alle Residenze',
    deposit: 'Deposito cauzionale', depositText: 'Richiesto al check-in con Carta di Credito (no Debit Card) · Rimborsato alla partenza',
  },
  en: {
    bedrooms: 'bedrooms', bathrooms: 'bathrooms', maxPeople: 'guests', sqm: 'sqm',
    floorGround: 'Ground floor', floor: 'Floor',
    privatePool: '🏊 Private pool', sharedPool: '🌊 Shared pool', noPool: '🏖️ 250m from sea',
    services: 'Amenities', description: 'The residence',
    checkIn: 'Check-in', checkOut: 'Check-out',
    prenota: 'Book now', back: '← Back to Residences',
    deposit: 'Security deposit', depositText: 'Required at check-in by Credit Card (no Debit Card) · Refunded at departure',
  },
  de: {
    bedrooms: 'Schlafzimmer', bathrooms: 'Bäder', maxPeople: 'Gäste', sqm: 'qm',
    floorGround: 'Erdgeschoss', floor: 'Etage',
    privatePool: '🏊 Privater Pool', sharedPool: '🌊 Gemeinschaftspool', noPool: '🏖️ 250m vom Meer',
    services: 'Ausstattung', description: 'Die Residenz',
    checkIn: 'Check-in', checkOut: 'Check-out',
    prenota: 'Jetzt buchen', back: '← Zurück zu den Residenzen',
    deposit: 'Kaution', depositText: 'Beim Check-in per Kreditkarte (keine Debitkarte) · Bei Abreise zurückerstattet',
  },
  pl: {
    bedrooms: 'sypialnie', bathrooms: 'łazienki', maxPeople: 'gości', sqm: 'mkw',
    floorGround: 'Parter', floor: 'Piętro',
    privatePool: '🏊 Prywatny basen', sharedPool: '🌊 Wspólny basen', noPool: '🏖️ 250m od morza',
    services: 'Udogodnienia', description: 'Rezydencja',
    checkIn: 'Check-in', checkOut: 'Check-out',
    prenota: 'Zarezerwuj', back: '← Wróć do Rezydencji',
    deposit: 'Kaucja', depositText: 'Wymagana przy zameldowaniu kartą kredytową (bez kart debetowych) · Zwracana przy wyjeździe',
  },
};

export default async function RoomPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const room = getRoomBySlug(slug);
  if (!room) notFound();

  const property = getPropertyForRoom(room.roomId);
  if (!property) notFound();

  const t = LABELS[locale] ?? LABELS.it;

  // Carica foto e descrizione in parallelo
  const [photos, description] = await Promise.all([
    getRoomPhotos(room.cloudinaryFolder),
    getRoomDescription(property.propertyId, room.roomId, locale),
  ]);

  const floorLabel = room.floor === 0 ? t.floorGround : `${t.floor} ${room.floor}`;
  const poolLabel = room.privatePool ? t.privatePool : room.sharedPool ? t.sharedPool : t.noPool;

  const featureCodes = PROPERTY_FEATURES[property.propertyId] ?? [];

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 120px' }}>

      {/* Back link */}
      <Link href={`/${locale}/residenze`} style={{ color: '#1E73BE', fontSize: 14, textDecoration: 'none' }}>
        {t.back}
      </Link>

      {/* Titolo */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#222', margin: '16px 0 4px' }}>
        {room.name}
      </h1>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
        {property.distanceLabel} · {floorLabel}
      </div>

      <PhotoLightbox photos={photos} roomName={room.name} />

      {/* Caratteristiche principali */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '20px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', marginBottom: 28 }}>
        <div style={statStyle}>
          <span style={statNumStyle}>{room.bedrooms}</span>
          <span style={statLabelStyle}>{t.bedrooms}</span>
        </div>
        <div style={statStyle}>
          <span style={statNumStyle}>{room.bathrooms}</span>
          <span style={statLabelStyle}>{t.bathrooms}</span>
        </div>
        <div style={statStyle}>
          <span style={statNumStyle}>{room.maxPeople}</span>
          <span style={statLabelStyle}>{t.maxPeople}</span>
        </div>
        <div style={statStyle}>
          <span style={statNumStyle}>{room.sqm}</span>
          <span style={statLabelStyle}>{t.sqm}</span>
        </div>
        <div style={statStyle}>
          <span style={{ fontSize: 18 }}>{poolLabel}</span>
        </div>
      </div>

      {/* Descrizione */}
      {description && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={sectionTitleStyle}>{t.description}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#444', whiteSpace: 'pre-line' }}>
            {description}
          </p>
        </div>
      )}

      {/* Servizi */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={sectionTitleStyle}>{t.services}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2px 16px' }}>
          {featureCodes.map((code) => {
            const feature = FEATURE_LABELS[code];
            if (!feature) return null;
            return (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#333', padding: '1px 0' }}>
                <span style={{ fontSize: 20 }}>{feature.icon}</span>
                <span>{feature[locale as keyof typeof feature] ?? feature.it}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mappa */}
      <PropertyMap
        latitude={property.latitude}
        longitude={property.longitude}
        name={room.name}
        locale={locale}
      />



      {/* Cose da sapere */}
      <ThingsToKnow
        locale={locale}
        checkInStart={property.propertyId === 46487 ? '16:00' : '16:00'}
        checkInEnd={property.propertyId === 46487 ? '19:00' : '19:00'}
        checkOutEnd="10:00"
        securityDeposit={room.securityDeposit}
      />

      {/* Calendario disponibilità — 12 mesi */}
      <AvailabilityCalendar
        roomId={room.roomId}
        locale={locale}
        bookingUrl={`/${locale}/prenota?roomId=${room.roomId}`}
      />

      {/* Bottone Prenota fisso in basso su mobile */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #eee',
        padding: '16px 20px',
        display: 'flex', justifyContent: 'center',
        zIndex: 100,
      }}>
        <Link
          href={`/${locale}/prenota?roomId=${room.roomId}`}
          style={{
            display: 'block', width: '100%', maxWidth: 480,
            padding: '16px', borderRadius: 12,
            background: '#FCAF1A', color: '#fff',
            fontWeight: 700, fontSize: 18,
            textAlign: 'center', textDecoration: 'none',
          }}
        >
          {t.prenota}
        </Link>
      </div>

    </main>
  );
}

const statStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60,
};
const statNumStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 800, color: '#1E73BE',
};
const statLabelStyle: React.CSSProperties = {
  fontSize: 12, color: '#888', marginTop: 2,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 16,
};
