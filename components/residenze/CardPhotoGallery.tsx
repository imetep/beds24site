'use client';

import Link from 'next/link';

interface Props {
  coverUrl: string | null;
  roomName: string;
  noPhotoLabel: string;
  linkHref?: string; // se passato, la foto è un Link alla scheda (unica modalità usata oggi)
}

/**
 * Foto cover di una residenza nella lista `/residenze`. Renderizza sempre
 * un Link alla scheda (quando `linkHref` è passato). Hover scale gestito in CSS.
 *
 * NOTE: questo componente aveva anche una modalità "lightbox fullscreen"
 * attivata quando `linkHref` era omesso. Era dead code — nessuno lo invocava
 * mai senza `linkHref`. Il lightbox vero vive in `PhotoCarousel.tsx` (ramo
 * desktop fullscreen con topbar + frecce + thumbs).
 * Blocco rimosso nel commit di Sessione 8 per ridurre duplicazione.
 */
export default function CardPhotoGallery({ coverUrl, roomName, noPhotoLabel, linkHref }: Props) {
  const photoContent = coverUrl ? (
    <img
      src={coverUrl}
      alt={roomName}
      className="card-gallery__img"
    />
  ) : (
    <div className="card-gallery__no-photo">
      <span>{noPhotoLabel}</span>
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="card-gallery">
        {photoContent}
      </Link>
    );
  }

  // Fallback (non usato oggi): div non cliccabile
  return <div className="card-gallery">{photoContent}</div>;
}
