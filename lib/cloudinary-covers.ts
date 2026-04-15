import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const FOLDERS = [
  'livingapple/annurca', 'livingapple/delicious', 'livingapple/fuji',
  'livingapple/idared', 'livingapple/kissabel', 'livingapple/pink-lady',
  'livingapple/renetta', 'livingapple/sergente', 'livingapple/smith',
  'livingapple/stark', 'livingapple-beach/braeburn',
  'livingapple-beach/gala', 'livingapple-beach/rubens',
];

export const TTL_COVERS_SECONDS = 60 * 60 * 24 * 7; // 7 giorni
const REDIS_KEY = 'cloudinary:covers';

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

export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  try {
    const body = JSON.stringify([['SET', key, value, 'EX', ttlSeconds]]);
    await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
  } catch { /* silenzioso */ }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeUrl(publicId: string, width: number, height?: number): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transforms: any = { width, crop: 'fill', quality: 'auto', fetch_format: 'auto' };
  if (height) transforms.height = height;
  return cloudinary.url(publicId, transforms);
}

/**
 * Restituisce la cover URL per ogni folder.
 * Prova Redis (7gg) → poi Cloudinary Search API → salva su Redis.
 * Usata da /api/cloudinary?covers=true e da residenze/page.tsx.
 */
export async function getCovers(): Promise<Record<string, string | null>> {
  // 1. Prova Redis
  const cached = await redisGet(REDIS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as Record<string, string | null>;
    } catch { /* corrotto → ricarica */ }
  }

  // 2. Cloudinary Search API
  const results = await Promise.all(
    FOLDERS.map(async (f) => {
      try {
        const res = await cloudinary.search
          .expression(`folder:${f}`)
          .sort_by('public_id', 'asc')
          .max_results(1)
          .execute();
        const photo = res.resources[0];
        return { folder: f, url: photo ? makeUrl(photo.public_id, 600, 400) : null };
      } catch {
        return { folder: f, url: null };
      }
    })
  );

  const coverMap: Record<string, string | null> = {};
  results.forEach(({ folder, url }) => { coverMap[folder] = url; });

  // 3. Salva Redis 7 giorni
  if (Object.values(coverMap).some(v => v !== null)) {
    await redisSet(REDIS_KEY, JSON.stringify(coverMap), TTL_COVERS_SECONDS);
  }

  return coverMap;
}
