'use client';

import { useRouter } from 'next/navigation';
import { PROPERTIES, getCloudinaryUrl } from '@/config/properties';

const TIPO: Record<string, Record<string, string>> = {
  it: { holidayHome: 'Casa vacanze', villa: 'Villa', apartment: 'Appartamento', studio: 'Monolocale' },
  en: { holidayHome: 'Holiday home', villa: 'Villa', apartment: 'Apartment', studio: 'Studio' },
  de: { holidayHome: 'Ferienhaus', villa: 'Villa', apartment: 'Wohnung', studio: 'Studio' },
  pl: { holidayHome: 'Dom wakacyjny', villa: 'Willa', apartment: 'Apartament', studio: 'Kawalerka' },
};

interface Props { locale: string }

export default function ResidenzaSlider({ locale }: Props) {
  const router = useRouter();

  const rooms = PROPERTIES.flatMap(p => p.rooms);

  return (
    <div className="residenza-slider">
      {rooms.map(room => {
        const photoUrl = getCloudinaryUrl(room, 1, 600);

        return (
          <button
            key={room.roomId}
            onClick={() => router.push(`/${locale}/residenze/${room.slug}`)}
            className="residenza-slider__card"
          >
            <img
              src={photoUrl}
              alt={room.name}
              loading="lazy"
              className="residenza-slider__img"
            />

            {/* Overlay gradiente */}
            <div className="residenza-slider__overlay" />

            {/* Testo */}
            <div className="residenza-slider__info">
              <div className="residenza-slider__name">{room.name}</div>
              <div className="residenza-slider__meta">
                max {room.maxPeople} · {room.sqm} m²
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
