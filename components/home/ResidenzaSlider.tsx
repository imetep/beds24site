'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROPERTIES } from '@/config/properties';

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dsnlduczj';

function coverUrl(folder: string): string {
  // Prima foto della cartella, taglio 2:3 centrato, ottimizzata
  return `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,ar_2:3,w_400,q_auto,f_auto/${folder}/1.jpg`;
}

// Tipo residenza in italiano
const TIPO: Record<string, Record<string, string>> = {
  it: { holidayHome: 'Casa vacanze', villa: 'Villa', apartment: 'Appartamento', studio: 'Monolocale' },
  en: { holidayHome: 'Holiday home', villa: 'Villa', apartment: 'Apartment', studio: 'Studio' },
  de: { holidayHome: 'Ferienhaus', villa: 'Villa', apartment: 'Wohnung', studio: 'Studio' },
  pl: { holidayHome: 'Dom wakacyjny', villa: 'Willa', apartment: 'Apartament', studio: 'Kawalerka' },
};

interface Props { locale: string }

export default function ResidenzaSlider({ locale }: Props) {
  const router = useRouter();
  const tipo = TIPO[locale] ?? TIPO.it;

  // Tutte le 13 room in ordine
  const rooms = PROPERTIES.flatMap(p => p.rooms);

  return (
    <div style={{
      display: 'flex',
      gap: 14,
      overflowX: 'auto',
      padding: '4px 1.25rem 16px',
      scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch',
      // Nasconde scrollbar su tutti i browser
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      <style>{`.residenza-slider::-webkit-scrollbar { display: none; }`}</style>

      {rooms.map(room => (
        <button
          key={room.roomId}
          onClick={() => router.push(`/${locale}/residenze/${room.slug}`)}
          style={{
            flexShrink: 0,
            width: 160,
            scrollSnapAlign: 'start',
            border: 'none',
            padding: 0,
            background: 'none',
            cursor: 'pointer',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            position: 'relative',
            aspectRatio: '2/3',
            display: 'block',
          }}
        >
          {/* Foto */}
          <img
            src={coverUrl(room.cloudinaryFolder)}
            alt={room.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* Overlay gradiente */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '55%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
          }} />

          {/* Testo */}
          <div style={{
            position: 'absolute',
            bottom: 12, left: 12, right: 12,
            textAlign: 'left',
          }}>
            <div style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.2,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>
              {room.name}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.82)',
              fontSize: 12,
              marginTop: 3,
              fontWeight: 500,
            }}>
              max {room.maxPeople} · {room.sqm} m²
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
