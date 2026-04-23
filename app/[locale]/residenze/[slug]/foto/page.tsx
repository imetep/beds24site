import { notFound } from 'next/navigation';
import { v2 as cloudinary } from 'cloudinary';
import { unstable_cache } from 'next/cache';
import { redisSet, getCovers } from '@/lib/cloudinary-covers';
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
  const redisKey = `cloudinary:foto-photos:${folder}`;

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
      .max_results(50)
      .execute();
    const urls = result.resources.map((r: any) =>
      cloudinary.url(r.public_id, { width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' })
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
  ['cloudinary-foto-photos'],
  { revalidate: TTL_PHOTOS_SECONDS, tags: ['cloudinary'] },
);

export default async function FotoPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const room = getRoomBySlug(slug);
  if (!room) notFound();

  // Fetch foto della casa + covers di tutte le case (1 chiamata aggregata invece di N)
  const [photos, coversMap] = await Promise.all([
    getRoomPhotos(room.cloudinaryFolder),
    getCovers(),
  ]);

  // Costruisce lista residenze con cover per il selettore
  const rooms = ALL_ROOMS.map((r) => ({
    slug:     r.slug,
    name:     r.name,
    coverUrl: coversMap[r.cloudinaryFolder] ?? null,
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
