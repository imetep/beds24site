import type { Room } from '@/config/properties';
import CardPhotoGallery from './CardPhotoGallery';
import Link from 'next/link';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';
import { Icon } from '@/components/ui/Icon';

interface Props {
  room: Room;
  locale: string;
  coverUrl: string | null;
}

function pl(t: Record<string, string>, key: 'bedroom' | 'bathroom' | 'person', count: number): string {
  if (key === 'bedroom')  return count === 1 ? t.bedroom  : t.bedrooms;
  if (key === 'bathroom') return count === 1 ? t.bathroom : t.bathrooms;
  if (key === 'person')   return count === 1 ? t.person   : t.people;
  return '';
}

export default function RoomCard({ room, locale, coverUrl }: Props) {
  const ui = getTranslations(locale as Locale).components.roomCard;

  const poolIcon   = room.privatePool ? 'water' : room.sharedPool ? 'water' : 'umbrella-fill';
  const poolLabel  = room.privatePool ? ui.privatePool : room.sharedPool ? ui.sharedPool : ui.noPool;
  const floorLabel = room.floor < 0 ? ui.basement : room.floor === 0 ? ui.floorGround : `${ui.floor} ${room.floor}`;
  const roomHref   = `/${locale}/residenze/${room.slug}`;

  return (
    <div className="card shadow-sm overflow-hidden">

      {/* Foto cliccabile → scheda appartamento */}
      <div className="position-relative">
        <CardPhotoGallery
          coverUrl={coverUrl}
          roomName={room.name}
          noPhotoLabel={ui.noPhoto}
          linkHref={roomHref}
        />
        <div className="badge-overlay badge-overlay--corner-tl">
          {floorLabel}
        </div>
      </div>

      {/* Contenuto */}
      <div className="card-body">
        <h3 className="fs-4 fw-bold text-primary mb-2">{room.name}</h3>

        <ul className="feature-list mb-3">
          <li className="feature-list__item">
            <Icon name="door-closed-fill" />
            {room.bedrooms} {pl(ui, 'bedroom', room.bedrooms)}
          </li>
          <li className="feature-list__item">
            <Icon name="droplet-fill" />
            {room.bathrooms} {pl(ui, 'bathroom', room.bathrooms)}
          </li>
          <li className="feature-list__item">
            <Icon name="people-fill" />
            {ui.maxPeople} {room.maxPeople} {pl(ui, 'person', room.maxPeople)}
          </li>
          <li className="feature-list__item">
            <Icon name="aspect-ratio" />
            {room.sqm} {ui.sqm}
          </li>
          <li className="feature-list__item">
            <Icon name={poolIcon} />
            {poolLabel}
          </li>
        </ul>

        <Link
          href={roomHref}
          className="btn btn-warning fw-bold w-100 text-white"
        >
          {ui.prenota}
        </Link>
      </div>
    </div>
  );
}
