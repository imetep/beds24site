import type { Room } from '@/config/properties';
import CardPhotoGallery from './CardPhotoGallery';
import Link from 'next/link';

interface Props {
  room: Room;
  locale: string;
  coverUrl: string | null;
}

// Etichette con supporto singolare/plurale per IT/EN/DE/PL
const LABELS: Record<string, {
  bedroom: string; bedrooms: string;
  bathroom: string; bathrooms: string;
  maxPeople: string; person: string; people: string;
  sqm: string;
  privatePool: string; sharedPool: string; noPool: string;
  prenota: string; noPhoto: string;
  floorGround: string; floor: string;
}> = {
  it: {
    bedroom: 'camera',   bedrooms: 'camere',
    bathroom: 'bagno',   bathrooms: 'bagni',
    maxPeople: 'max',    person: 'persona',   people: 'persone',
    sqm: 'mq',
    privatePool: '🏊 Piscina privata', sharedPool: '🌊 Piscina condivisa', noPool: '🏖️ 250m dal mare',
    prenota: 'Scopri e Prenota →', noPhoto: 'Foto in arrivo',
    floorGround: 'Piano terra', floor: 'Piano',
  },
  en: {
    bedroom: 'bedroom',  bedrooms: 'bedrooms',
    bathroom: 'bathroom',bathrooms: 'bathrooms',
    maxPeople: 'max',    person: 'person',     people: 'people',
    sqm: 'sqm',
    privatePool: '🏊 Private pool', sharedPool: '🌊 Shared pool', noPool: '🏖️ 250m from the sea',
    prenota: 'Discover & Book →', noPhoto: 'Photo coming soon',
    floorGround: 'Ground floor', floor: 'Floor',
  },
  de: {
    bedroom: 'Schlafzimmer', bedrooms: 'Schlafzimmer',
    bathroom: 'Bad',         bathrooms: 'Bäder',
    maxPeople: 'max',        person: 'Person',  people: 'Personen',
    sqm: 'qm',
    privatePool: '🏊 Privater Pool', sharedPool: '🌊 Gemeinschaftspool', noPool: '🏖️ 250m vom Meer',
    prenota: 'Entdecken & Buchen →', noPhoto: 'Foto folgt',
    floorGround: 'Erdgeschoss', floor: 'Etage',
  },
  pl: {
    bedroom: 'sypialnia', bedrooms: 'sypialnie',
    bathroom: 'łazienka', bathrooms: 'łazienki',
    maxPeople: 'maks',    person: 'osoba',    people: 'osoby',
    sqm: 'mkw',
    privatePool: '🏊 Prywatny basen', sharedPool: '🌊 Wspólny basen', noPool: '🏖️ 250m od morza',
    prenota: 'Zobacz i Zarezerwuj →', noPhoto: 'Zdjęcie wkrótce',
    floorGround: 'Parter', floor: 'Piętro',
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
  const floorLabel = room.floor === 0 ? t.floorGround : `${t.floor} ${room.floor}`;

  return (
    <div style={cardStyle}>

      {/* Foto cliccabile → gallery slider */}
      <div style={{ position: 'relative' }}>
        <CardPhotoGallery
          cloudinaryFolder={room.cloudinaryFolder}
          coverUrl={coverUrl}
          roomName={room.name}
          noPhotoLabel={t.noPhoto}
        />
        <div style={badgeStyle}>{floorLabel}</div>
      </div>

      {/* Contenuto */}
      <div style={{ padding: '14px 16px 16px' }}>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1E73BE', margin: '0 0 10px' }}>
          {room.name}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <span style={chipStyle}>🛏️ {room.bedrooms} {pl(t, 'bedroom',  room.bedrooms)}</span>
          <span style={chipStyle}>🚿 {room.bathrooms} {pl(t, 'bathroom', room.bathrooms)}</span>
          <span style={chipStyle}>👥 {t.maxPeople} {room.maxPeople} {pl(t, 'person', room.maxPeople)}</span>
          <span style={chipStyle}>📐 {room.sqm} {t.sqm}</span>
          <span style={chipStyle}>{poolLabel}</span>
        </div>

        {/* Solo "Prenota" → scheda appartamento (non più wizard) */}
        <Link href={`/${locale}/residenze/${room.slug}`} style={btnPrimaryStyle}>
          {t.prenota}
        </Link>

      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: 16, overflow: 'hidden',
  border: '1px solid #e8e8e8', background: '#fff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute', top: 12, left: 12,
  background: 'rgba(0,0,0,0.55)', color: '#fff',
  fontSize: 12, fontWeight: 600,
  padding: '4px 10px', borderRadius: 20,
  pointerEvents: 'none',
};

const chipStyle: React.CSSProperties = {
  fontSize: 12, color: '#555',
  background: '#f5f5f5', borderRadius: 6, padding: '4px 8px',
};

const btnPrimaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '11px 0', borderRadius: 8,
  background: '#FCAF1A', color: '#fff',
  fontWeight: 700, fontSize: 15,
  textAlign: 'center', textDecoration: 'none',
  boxSizing: 'border-box',
};
