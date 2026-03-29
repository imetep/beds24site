import { notFound } from 'next/navigation';
import { v2 as cloudinary } from 'cloudinary';
import { getRoomBySlug, ALL_ROOMS, PROPERTIES } from '@/config/properties';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import FotoGalleryClient from '@/components/residenze/FotoGalleryClient';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
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

async function getRoomPhotos(folder: string): Promise<string[]> {
  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('public_id', 'asc')
      .max_results(50)
      .execute();
    return result.resources.map((r: any) =>
      cloudinary.url(r.public_id, { width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' })
    );
  } catch {
    return [];
  }
}

async function getCoverUrl(folder: string): Promise<string | null> {
  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('public_id', 'asc')
      .max_results(1)
      .execute();
    const photo = result.resources[0];
    if (!photo) return null;
    return cloudinary.url(photo.public_id, {
      width: 300, height: 200, crop: 'fill', quality: 'auto', fetch_format: 'auto',
    });
  } catch {
    return null;
  }
}

export default async function FotoPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const room = getRoomBySlug(slug);
  if (!room) notFound();

  // Fetch foto della casa + cover di tutte le case in parallelo
  const [photos, ...covers] = await Promise.all([
    getRoomPhotos(room.cloudinaryFolder),
    ...ALL_ROOMS.map(r => getCoverUrl(r.cloudinaryFolder)),
  ]);

  // Costruisce lista residenze con cover per il selettore
  const rooms = ALL_ROOMS.map((r, i) => ({
    slug:     r.slug,
    name:     r.name,
    coverUrl: covers[i] ?? null,
  }));

  const backLabel: Record<string, string> = {
    it: 'Indietro', en: 'Back', de: 'Zurück', pl: 'Wróć',
  };
  const allPhotosLabel: Record<string, string> = {
    it: `Tutte le foto (${photos.length})`,
    en: `All photos (${photos.length})`,
    de: `Alle Fotos (${photos.length})`,
    pl: `Wszystkie zdjęcia (${photos.length})`,
  };

  return (
    <FotoGalleryClient
      photos={photos}
      roomName={room.name}
      slug={slug}
      locale={locale}
      rooms={rooms}
      allPhotosLabel={allPhotosLabel[locale] ?? allPhotosLabel.it}
      backLabel={backLabel[locale] ?? backLabel.it}
    />
  );
}
