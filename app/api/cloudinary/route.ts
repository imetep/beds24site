import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getCovers, redisSet, TTL_COVERS_SECONDS } from '@/lib/cloudinary-covers';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const TTL_FOLDER_SECONDS = 60 * 60 * 24; // 24h — lightbox singola cartella
const TTL_FALLBACK_SECONDS = 60 * 5;     // 5 min — risultati vuoti/errore (anti-storm)

// ─── Redis helpers ────────────────────────────────────────────────────────────

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeUrl(publicId: string, width: number, height?: number): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transforms: any = { width, crop: 'fill', quality: 'auto', fetch_format: 'auto' };
  if (height) transforms.height = height;
  return cloudinary.url(publicId, transforms);
}

// ─── Route handler ────────────────────────────────────────────────────────────
// GET /api/cloudinary?covers=true              → cover tutti gli appart. (Redis 7gg)
// GET /api/cloudinary?folder=livingapple/fuji  → tutte le foto (Redis 1h)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder');
  const covers = searchParams.get('covers') === 'true';

  // ── COVERS ────────────────────────────────────────────────────────────────
  if (covers) {
    try {
      const coverMap = await getCovers();
      return NextResponse.json({ covers: coverMap }, {
        headers: { 'Cache-Control': 's-maxage=604800, stale-while-revalidate' },
      });
    } catch (err) {
      console.error('[cloudinary] covers error:', err);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── FOLDER (lightbox) ─────────────────────────────────────────────────────
  if (!folder) {
    return NextResponse.json({ error: 'Missing folder parameter' }, { status: 400 });
  }

  try {
    const redisKey = `cloudinary:folder:${folder}`;

    // 1. Prova Redis (TTL 1 ora)
    const cached = await redisGet(redisKey);
    if (cached) {
      try {
        const photos = JSON.parse(cached);
        return NextResponse.json({ photos, cached: true }, {
          headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
        });
      } catch { /* JSON corrotto → ricarica */ }
    }

    // 2. Fetch da Cloudinary
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('public_id', 'asc')
      .max_results(30)
      .execute();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photos = result.resources.map((r: any) => ({
      url:      makeUrl(r.public_id, 1200),
      thumbUrl: makeUrl(r.public_id, 400, 300),
      publicId: r.public_id,
    }));

    // 3. Salva Redis: 24h se ha risultati, 5min se vuoto (anti-storm rate-limit)
    await redisSet(
      redisKey,
      JSON.stringify(photos),
      photos.length > 0 ? TTL_FOLDER_SECONDS : TTL_FALLBACK_SECONDS,
    );

    return NextResponse.json({ photos }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });

  } catch (err) {
    console.error('[cloudinary] error:', err);
    // Cacha errore per 5 min per evitare hammering durante rate-limit
    try {
      const redisKey = `cloudinary:folder:${folder}`;
      await redisSet(redisKey, JSON.stringify([]), TTL_FALLBACK_SECONDS);
    } catch { /* best-effort */ }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
