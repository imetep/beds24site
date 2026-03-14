import Link from 'next/link';
import type { Room } from '@/config/properties';

interface Props {
  room: Room;
  locale: string;
  coverUrl: string | null;
}

const LABELS: Record<string, Record<string, string>> = {
  it: {
    bedrooms: 'camere', bathrooms: 'bagni', maxPeople: 'max', people: 'persone', sqm: 'mq',
    privatePool: '🏊 Piscina privata', sharedPool: '🌊 Piscina condivisa', noPool: '🏖️ 250m dal mare',
    prenota: 'Prenota', scopri: 'Scopri →', noPhoto: 'Foto in arrivo',
    floorGround: 'Piano terra', floor: 'Piano',
  },
  en: {
    bedrooms: 'bedrooms', bathrooms: 'bathrooms', maxPeople: 'max', people: 'people', sqm: 'sqm',
    privatePool: '🏊 Private pool', sharedPool: '🌊 Shared pool', noPool: '🏖️ 250m from the sea',
    prenota: 'Book', scopri: 'Discover →', noPhoto: 'Photo coming soon',
    floorGround: 'Ground floor', floor: 'Floor',
  },
  de: {
    bedrooms: 'Schlafzimmer', bathrooms: 'Bäder', maxPeople: 'max', people: 'Personen', sqm: 'qm',
    privatePool: '🏊 Privater Pool', sharedPool: '🌊 Gemeinschaftspool', noPool: '🏖️ 250m vom Meer',
    prenota: 'Buchen', scopri: 'Entdecken →', noPhoto: 'Foto folgt',
    floorGround: 'Erdgeschoss', floor: 'Etage',
  },
  pl: {
    bedrooms: 'sypialnie', bathrooms: 'łazienki', maxPeople: 'maks', people: 'osoby', sqm: 'mkw',
    privatePool: '🏊 Prywatny basen', sharedPool: '🌊 Wspólny basen', noPool: '🏖️ 250m od morza',
    prenota: 'Rezerwuj', scopri: 'Odkryj →', noPhoto: 'Zdjęcie wkrótce',
    floorGround: 'Parter', floor: 'Piętro',
  },
};

export default function RoomCard({ room, locale, coverUrl }: Props) {
  const t = LABELS[locale] ?? LABELS.it;

  const poolLabel = room.privatePool ? t.privatePool
    : room.sharedPool ? t.sharedPool
    : t.noPool;

  const floorLabel = room.floor === 0 ? t.floorGround : `${t.floor} ${room.floor}`;

  return (
    <div style={cardStyle}>

      {/* Foto */}
      <div style={photoContainerStyle}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={room.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={photoPlaceholderStyle}>
            <span style={{ color: '#bbb', fontSize: 13 }}>{t.noPhoto}</span>
          </div>
        )}
        {/* Badge piano */}
        <div style={badgeStyle}>{floorLabel}</div>
      </div>

      {/* Contenuto */}
      <div style={{ padding: '16px' }}>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1E73BE', margin: '0 0 10px' }}>
          {room.name}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <span style={chipStyle}>🛏️ {room.bedrooms} {t.bedrooms}</span>
          <span style={chipStyle}>🚿 {room.bathrooms} {t.bathrooms}</span>
          <span style={chipStyle}>👥 {t.maxPeople} {room.maxPeople} {t.people}</span>
          <span style={chipStyle}>📐 {room.sqm} {t.sqm}</span>
          <span style={chipStyle}>{poolLabel}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/${locale}/residenze/${room.slug}`} style={btnSecondaryStyle}>
            {t.scopri}
          </Link>
          <Link href={`/${locale}?roomId=${room.roomId}`} style={btnPrimaryStyle}>
            {t.prenota}
          </Link>
        </div>

      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  borderRadius: 16, overflow: 'hidden',
  border: '1px solid #e8e8e8', background: '#fff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const photoContainerStyle: React.CSSProperties = {
  position: 'relative', height: 220,
  background: '#f0f0f0', overflow: 'hidden',
};

const photoPlaceholderStyle: React.CSSProperties = {
  width: '100%', height: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute', top: 12, left: 12,
  background: 'rgba(0,0,0,0.55)', color: '#fff',
  fontSize: 12, fontWeight: 600,
  padding: '4px 10px', borderRadius: 20,
};

const chipStyle: React.CSSProperties = {
  fontSize: 12, color: '#555',
  background: '#f5f5f5', borderRadius: 6, padding: '4px 8px',
};

const btnPrimaryStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', borderRadius: 8,
  background: '#FCAF1A', color: '#fff',
  fontWeight: 700, fontSize: 14,
  textAlign: 'center', textDecoration: 'none',
};

const btnSecondaryStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', borderRadius: 8,
  background: '#f0f0f0', color: '#1E73BE',
  fontWeight: 600, fontSize: 14,
  textAlign: 'center', textDecoration: 'none',
};
