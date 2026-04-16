import type { Room } from '@/config/properties';
import CardPhotoGallery from './CardPhotoGallery';
import Link from 'next/link';

interface Props {
  room: Room;
  locale: string;
  coverUrl: string | null;
}

const LABELS: Record<string, {
  bedroom: string; bedrooms: string;
  bathroom: string; bathrooms: string;
  maxPeople: string; person: string; people: string;
  sqm: string;
  privatePool: string; sharedPool: string; noPool: string;
  prenota: string; noPhoto: string;
  floorGround: string; floor: string; basement: string;
}> = {
  it: {
    bedroom: 'camera',   bedrooms: 'camere',
    bathroom: 'bagno',   bathrooms: 'bagni',
    maxPeople: 'max',    person: 'persona',   people: 'persone',
    sqm: 'mq',
    privatePool: '🏊 Piscina privata', sharedPool: '🌊 Piscina condivisa', noPool: '🏖️ 250m dal mare',
    prenota: 'Scopri e Prenota →', noPhoto: 'Foto in arrivo',
    floorGround: 'Piano terra', floor: 'Piano', basement: 'Seminterrato',
  },
  en: {
    bedroom: 'bedroom',  bedrooms: 'bedrooms',
    bathroom: 'bathroom',bathrooms: 'bathrooms',
    maxPeople: 'max',    person: 'person',     people: 'people',
    sqm: 'sqm',
    privatePool: '🏊 Private pool', sharedPool: '🌊 Shared pool', noPool: '🏖️ 250m from the sea',
    prenota: 'Discover & Book →', noPhoto: 'Photo coming soon',
    floorGround: 'Ground floor', floor: 'Floor', basement: 'Basement',
  },
  de: {
    bedroom: 'Schlafzimmer', bedrooms: 'Schlafzimmer',
    bathroom: 'Bad',         bathrooms: 'Bäder',
    maxPeople: 'max',        person: 'Person',  people: 'Personen',
    sqm: 'qm',
    privatePool: '🏊 Privater Pool', sharedPool: '🌊 Gemeinschaftspool', noPool: '🏖️ 250m vom Meer',
    prenota: 'Entdecken & Buchen →', noPhoto: 'Foto folgt',
    floorGround: 'Erdgeschoss', floor: 'Etage', basement: 'Untergeschoss',
  },
  pl: {
    bedroom: 'sypialnia', bedrooms: 'sypialnie',
    bathroom: 'łazienka', bathrooms: 'łazienki',
    maxPeople: 'maks',    person: 'osoba',    people: 'osoby',
    sqm: 'mkw',
    privatePool: '🏊 Prywatny basen', sharedPool: '🌊 Wspólny basen', noPool: '🏖️ 250m od morza',
    prenota: 'Zobacz i Zarezerwuj →', noPhoto: 'Zdjęcie wkrótce',
    floorGround: 'Parter', floor: 'Piętro', basement: 'Piwnica',
  },
};

type LabelSet = typeof LABELS.it;

function pl(t: LabelSet, key: 'bedroom' | 'bathroom' | 'person', count: number): string {
  if (key === 'bedroom')  return count === 1 ? t.bedroom  : t.bedrooms;
  if (key === 'bathroom') return count === 1 ? t.bathroom : t.bathrooms;
  if (key === 'person')   return count === 1 ? t.person   : t.people;
  return '';
}

export default function RoomCard({ room, locale, coverUrl }: Props) {
  const t = LABELS[locale] ?? LABELS.it;

  const poolLabel  = room.privatePool ? t.privatePool : room.sharedPool ? t.sharedPool : t.noPool;
  const floorLabel = room.floor < 0 ? t.basement : room.floor === 0 ? t.floorGround : `${t.floor} ${room.floor}`;
  const roomHref   = `/${locale}/residenze/${room.slug}`;

  return (
    <div className="card shadow-sm overflow-hidden">

      {/* Foto cliccabile → scheda appartamento */}
      <div className="position-relative">
        <CardPhotoGallery
          cloudinaryFolder={room.cloudinaryFolder}
          coverUrl={coverUrl}
          roomName={room.name}
          noPhotoLabel={t.noPhoto}
          linkHref={roomHref}
        />
        <div
          className="position-absolute text-white small fw-semibold rounded-pill px-2 py-1"
          style={{ top: 12, left: 12, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }}
        >
          {floorLabel}
        </div>
      </div>

      {/* Contenuto */}
      <div className="card-body">
        <h3 className="fs-4 fw-bold text-primary mb-2">{room.name}</h3>

        <div className="d-flex flex-wrap gap-1 mb-3">
          <span className="badge bg-light text-secondary border">🛏️ {room.bedrooms} {pl(t, 'bedroom', room.bedrooms)}</span>
          <span className="badge bg-light text-secondary border">🚿 {room.bathrooms} {pl(t, 'bathroom', room.bathrooms)}</span>
          <span className="badge bg-light text-secondary border">👥 {t.maxPeople} {room.maxPeople} {pl(t, 'person', room.maxPeople)}</span>
          <span className="badge bg-light text-secondary border">📐 {room.sqm} {t.sqm}</span>
          <span className="badge bg-light text-secondary border">{poolLabel}</span>
        </div>

        <Link
          href={roomHref}
          className="btn btn-warning fw-bold w-100 text-white"
        >
          {t.prenota}
        </Link>
      </div>
    </div>
  );
}
