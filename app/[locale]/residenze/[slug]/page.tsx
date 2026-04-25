import { notFound } from 'next/navigation';
import Link from 'next/link';
import { v2 as cloudinary } from 'cloudinary';
import { unstable_cache } from 'next/cache';
import { redisSet } from '@/lib/cloudinary-covers';
import { getRoomBySlug, getPropertyForRoom, PROPERTIES } from '@/config/properties';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import ThingsToKnow from '@/components/residenze/ThingsToKnow';
import PhotoCarousel from '@/components/residenze/PhotoCarousel';
import PropertyMap from '@/components/residenze/PropertyMap';
import AvailabilityCalendar from '@/components/residenze/AvailabilityCalendar';
import BookingPanel from '@/components/residenze/BookingPanel';
import BedConfigDisplay from '@/components/residenze/BedConfigDisplay';
import StickyBookingBar from '@/components/residenze/StickyBookingBar';


cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const revalidate = 3600;

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

// Feature codes → Bootstrap icon + label (UX 3.4)
const FEATURE_LABELS: Record<string, { icon: string; it: string; en: string; de: string; pl: string }> = {
  WIFI:                { icon: 'bi-wifi',                 it: 'WiFi gratuito',        en: 'Free WiFi',          de: 'Kostenloses WLAN',     pl: 'Bezpłatne WiFi' },
  AIR_CONDITIONING:    { icon: 'bi-thermometer-snow',     it: 'Aria condizionata',    en: 'Air conditioning',   de: 'Klimaanlage',          pl: 'Klimatyzacja' },
  HEATING:             { icon: 'bi-fire',                 it: 'Riscaldamento',        en: 'Heating',            de: 'Heizung',              pl: 'Ogrzewanie' },
  PARKING_INCLUDED:    { icon: 'bi-p-square-fill',        it: 'Parcheggio incluso',   en: 'Free parking',       de: 'Kostenloser Parkplatz',pl: 'Bezpłatny parking' },
  WASHER:              { icon: 'bi-droplet-fill',         it: 'Lavatrice',            en: 'Washer',             de: 'Waschmaschine',        pl: 'Pralka' },
  DISHWASHER:          { icon: 'bi-basket2-fill',         it: 'Lavastoviglie',        en: 'Dishwasher',         de: 'Geschirrspüler',       pl: 'Zmywarka' },
  TV:                  { icon: 'bi-tv-fill',              it: 'TV',                   en: 'TV',                 de: 'Fernseher',            pl: 'Telewizor' },
  HAIR_DRYER:          { icon: 'bi-wind',                 it: 'Asciugacapelli',       en: 'Hair dryer',         de: 'Haartrockner',         pl: 'Suszarka' },
  KITCHEN:             { icon: 'bi-egg-fried',            it: 'Cucina attrezzata',    en: 'Full kitchen',       de: 'Küche',                pl: 'Kuchnia' },
  KITCHEN_DINING_ROOM: { icon: 'bi-cup-hot-fill',         it: 'Cucina con sala da pranzo', en: 'Kitchen & dining', de: 'Küche & Esszimmer', pl: 'Kuchnia i jadalnia' },
  MICROWAVE:           { icon: 'bi-broadcast',            it: 'Microonde',            en: 'Microwave',          de: 'Mikrowelle',           pl: 'Mikrofalówka' },
  OVEN:                { icon: 'bi-oven',                 it: 'Forno',                en: 'Oven',               de: 'Backofen',             pl: 'Piekarnik' },
  COFFEE_MAKER:        { icon: 'bi-cup-fill',             it: 'Macchina del caffè',   en: 'Coffee maker',       de: 'Kaffeemaschine',       pl: 'Ekspres do kawy' },
  FREEZER:             { icon: 'bi-snow',                 it: 'Congelatore',          en: 'Freezer',            de: 'Gefrierschrank',       pl: 'Zamrażarka' },
  REFRIGERATOR:        { icon: 'bi-box-fill',             it: 'Frigorifero',          en: 'Refrigerator',       de: 'Kühlschrank',          pl: 'Lodówka' },
  STOVE:               { icon: 'bi-fire',                 it: 'Fornelli',             en: 'Stove',              de: 'Herd',                 pl: 'Kuchenka' },
  TOASTER:             { icon: 'bi-bread-slice',          it: 'Tostapane',            en: 'Toaster',            de: 'Toaster',              pl: 'Toster' },
  KETTLE:              { icon: 'bi-cup-straw',            it: 'Bollitore',            en: 'Kettle',             de: 'Wasserkocher',         pl: 'Czajnik' },
  DISHES_UTENSILS:     { icon: 'bi-cup',                  it: 'Stoviglie e utensili', en: 'Dishes & utensils',  de: 'Geschirr & Utensilien',pl: 'Naczynia i przybory' },
  HIGHCHAIR:           { icon: 'bi-person-arms-up',       it: 'Seggiolone',           en: 'High chair',         de: 'Hochstuhl',            pl: 'Krzesełko' },
  SWIMMING:            { icon: 'bi-water',                it: 'Piscina',              en: 'Pool',               de: 'Schwimmbad',           pl: 'Basen' },
  GARDEN:              { icon: 'bi-tree-fill',            it: 'Giardino',             en: 'Garden',             de: 'Garten',               pl: 'Ogród' },
  BEACH:               { icon: 'bi-umbrella-fill',        it: 'Vicino alla spiaggia', en: 'Near the beach',     de: 'Strandnähe',           pl: 'Blisko plaży' },
  RURAL:               { icon: 'bi-flower1',              it: 'Zona rurale',          en: 'Rural area',         de: 'Ländliche Lage',       pl: 'Obszar wiejski' },
  MOUNTAIN_VIEW:       { icon: 'bi-triangle-fill',        it: 'Vista montagna',       en: 'Mountain view',      de: 'Bergblick',            pl: 'Widok na góry' },
  SITTING_AREA:        { icon: 'bi-house-door-fill',      it: 'Area salotto',         en: 'Sitting area',       de: 'Sitzbereich',          pl: 'Strefa wypoczynku' },
  LANAI_GAZEBO_COVERED:{ icon: 'bi-house-fill',           it: 'Gazebo coperto',       en: 'Covered gazebo',     de: 'Überdachte Terrasse',  pl: 'Altana' },
  WHEELCHAIR_YES:      { icon: 'bi-universal-access',     it: 'Accessibile',          en: 'Wheelchair accessible',de: 'Rollstuhlgerecht',   pl: 'Dostępny' },
  CHILDREN_WELCOME:    { icon: 'bi-emoji-smile',          it: 'Bambini benvenuti',    en: 'Children welcome',   de: 'Kinder willkommen',    pl: 'Dzieci mile widziane' },
  PETS_NOT_ALLOWED:    { icon: 'bi-dash-circle',          it: 'Animali non ammessi',  en: 'No pets',            de: 'Keine Haustiere',      pl: 'Zakaz zwierząt' },
  SMOKING_NOT_ALLOWED: { icon: 'bi-slash-circle',         it: 'Non fumatori',         en: 'No smoking',         de: 'Nichtraucher',         pl: 'Zakaz palenia' },
  LONG_TERM_RENTERS:   { icon: 'bi-calendar-range',       it: 'Soggiorni lunghi ok',  en: 'Long stays welcome', de: 'Langzeitmiete möglich',pl: 'Długie pobyty ok' },
};

const PROPERTY_FEATURES: Record<number, string[]> = {
  46487: ['AIR_CONDITIONING','HEATING','HAIR_DRYER','WASHER','PARKING_INCLUDED','TV','WIFI','MICROWAVE','KITCHEN_DINING_ROOM','FREEZER','OVEN','STOVE','HIGHCHAIR','COFFEE_MAKER','SWIMMING','KETTLE','TOASTER','DISHES_UTENSILS','CHILDREN_WELCOME','PETS_NOT_ALLOWED','SMOKING_NOT_ALLOWED'],
  46871: ['PARKING_INCLUDED','WIFI','BEACH','AIR_CONDITIONING','HEATING','WASHER','DISHWASHER','MICROWAVE','TV','HAIR_DRYER','REFRIGERATOR','KITCHEN','DISHES_UTENSILS','PETS_NOT_ALLOWED','SMOKING_NOT_ALLOWED'],
};

const TTL_PHOTOS_SECONDS   = 60 * 60 * 24; // 24h — disallineato da ISR (1h) per evitare rebuild → cloudinary
const TTL_FALLBACK_SECONDS = 60 * 5;        // 5 min — risultati vuoti/errore (anti-storm)

async function redisGet(key: string): Promise<string | null> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const res  = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

async function fetchRoomPhotos(folder: string): Promise<string[]> {
  const redisKey = `cloudinary:room-photos:${folder}`;

  // 1. Redis (persiste runtime, 24h)
  const cached = await redisGet(redisKey);
  if (cached) {
    try {
      const arr = JSON.parse(cached);
      if (Array.isArray(arr)) return arr as string[];
    } catch { /* corrotto → ricarica */ }
  }

  // 2. Cloudinary Search API
  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('public_id', 'asc')
      .max_results(20)
      .execute();
    const urls = result.resources.map((r: any) =>
      cloudinary.url(r.public_id, { width: 1200, crop: 'fill', quality: 'auto', fetch_format: 'auto' })
    );
    await redisSet(
      redisKey,
      JSON.stringify(urls),
      urls.length > 0 ? TTL_PHOTOS_SECONDS : TTL_FALLBACK_SECONDS,
    );
    return urls;
  } catch {
    await redisSet(redisKey, JSON.stringify([]), TTL_FALLBACK_SECONDS).catch(() => {});
    return [];
  }
}

// unstable_cache dedupa cross-worker al build Next.js (chiave base + folder argomento).
const getRoomPhotos = unstable_cache(
  fetchRoomPhotos,
  ['cloudinary-room-photos'],
  { revalidate: TTL_PHOTOS_SECONDS, tags: ['cloudinary'] },
);

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

function plLabel(t: Record<string, string>, singular: string, plural: string, count: number): string {
  return count === 1 ? (t[singular] ?? '') : (t[plural] ?? '');
}

export default async function RoomPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const room = getRoomBySlug(slug);
  if (!room) notFound();

  const property = getPropertyForRoom(room.roomId);
  if (!property) notFound();

  const t = getTranslations(locale as Locale).components.roomPage;

  const [photos, description] = await Promise.all([
    getRoomPhotos(room.cloudinaryFolder),
    getRoomDescription(property.propertyId, room.roomId, locale),
  ]);

  const floorLabel = room.floor === 0 ? t.floorGround : `${t.floor} ${room.floor}`;
  const poolLabel = room.privatePool ? t.privatePool : room.sharedPool ? t.sharedPool : t.noPool;
  const poolIcon = room.privatePool || room.sharedPool ? 'bi-water' : 'bi-umbrella-fill';

  const featureCodes = PROPERTY_FEATURES[property.propertyId] ?? [];

  return (
    <main className="room-page">

      {/* Breadcrumb — UX 3.7 */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item">
            <Link href={`/${locale}`} className="text-decoration-none">{t.breadcrumbHome}</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href={`/${locale}/residenze`} className="text-decoration-none">{t.back}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">{room.name}</li>
        </ol>
      </nav>

      {/* Titolo */}
      <h1 className="section-title-main mb-1">
        {room.name}
      </h1>
      <div className="room-page__meta">
        {property.distanceLabel[locale] ?? property.distanceLabel.it} · {floorLabel}
      </div>

      {/* Foto — edge-to-edge su mobile */}
      <div className="photo-carousel-wrapper">
        <PhotoCarousel photos={photos} roomName={room.name} slug={room.slug} locale={locale} />
      </div>

      {/* Caratteristiche principali — card row UX 3.7 */}
      <div className="row g-2 mb-4">
        {[
          { icon: 'bi-door-closed-fill', num: room.bedrooms,  label: plLabel(t, 'bedroom',  'bedrooms',  room.bedrooms) },
          { icon: 'bi-droplet-fill',     num: room.bathrooms, label: plLabel(t, 'bathroom', 'bathrooms', room.bathrooms) },
          { icon: 'bi-people-fill',      num: room.maxPeople, label: plLabel(t, 'guest',    'maxPeople', room.maxPeople) },
          { icon: 'bi-aspect-ratio',     num: room.sqm,       label: t.sqm },
          { icon: poolIcon,              num: null,           label: poolLabel },
        ].map((stat, i) => (
          <div key={i} className="col-6 col-md">
            <div className="card h-100 border-0 bg-light">
              <div className="card-body text-center p-2">
                <i className={`bi ${stat.icon} fs-3 text-primary d-block mb-1`}></i>
                {stat.num !== null && (
                  <div className="room-feature-card__num">{stat.num}</div>
                )}
                <div className="small text-muted">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Descrizione */}
      {description && (
        <div className="mb-4">
          <h2 className="fs-4 fw-bold mb-3">{t.description}</h2>
          <p className="room-page__description">
            {description}
          </p>
        </div>
      )}

      {/* Dove dormirete */}
      <BedConfigDisplay roomId={room.roomId} locale={locale} />

      {/* Servizi — Bootstrap grid with bi-* icons UX 3.4 */}
      <div className="mb-4">
        <h2 className="fs-4 fw-bold mb-3">{t.services}</h2>
        <div className="services-grid">
          {featureCodes.map((code) => {
            const feature = FEATURE_LABELS[code];
            if (!feature) return null;
            return (
              <div key={code} className="room-services__item">
                <i className={`bi ${feature.icon} room-services__icon`}></i>
                <span className="lh-sm">{feature[locale as keyof typeof feature] ?? feature.it}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mappa */}
      <div className="mb-4">
        <PropertyMap
          latitude={property.latitude}
          longitude={property.longitude}
          name={room.name}
          locale={locale}
          distanceLabel={property.distanceLabel[locale] ?? property.distanceLabel.it}
        />
      </div>

      {/* Cose da sapere — accordion UX 3.7 */}
      <div className="mb-4">
        <ThingsToKnow
          locale={locale}
          checkInStart={property.propertyId === 46487 ? '16:00' : '16:00'}
          checkInEnd={property.propertyId === 46487 ? '19:00' : '19:00'}
          checkOutEnd="10:00"
          securityDeposit={room.securityDeposit}
        />
      </div>

      {/* Calendario + BookingPanel */}
      <div id="booking-panel">
        <AvailabilityCalendar
          roomId={room.roomId}
          locale={locale}
          interactive={true}
        />
        <BookingPanel
          roomId={room.roomId}
          locale={locale}
          maxPeople={room.maxPeople}
        />
      </div>

      {/* Sticky CTA */}
      <StickyBookingBar
        roomId={room.roomId}
        locale={locale}
        roomName={room.name}
      />

    </main>
  );
}
