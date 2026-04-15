import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const TTL_SECONDS = 60 * 60; // 1 ora

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

async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  try {
    const body = JSON.stringify([['SET', key, value, 'EX', ttlSeconds]]);
    const res  = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('[cloudinary] Redis SET error:', res.status, text.slice(0, 100));
    }
  } catch (e) {
    console.warn('[cloudinary] Redis SET exception:', e);
  }
}

// ─── Cloudinary helpers ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeUrl(publicId: string, width: number, height?: number): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transforms: any = { width, crop: 'fill', quality: 'auto', fetch_format: 'auto' };
  if (height) transforms.height = height;
  return cloudinary.url(publicId, transforms);
}

// ─── Route handler ────────────────────────────────────────────────────────────
// GET /api/cloudinary?folder=livingapple/fuji  → tutte le foto (usato dal lightbox)
//
// NB: il branch "covers" è stato rimosso — le cover ora usano URL diretti
// costruiti da getCloudinaryUrl() in properties.ts (zero chiamate API Cloudinary).

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder');

  if (!folder) {
    return NextResponse.json({ error: 'Missing folder parameter' }, { status: 400 });
  }

  try {
    const redisKey = `cloudinary:folder:${folder}`;

    // 1. Prova Redis
    const cached = await redisGet(redisKey);
    if (cached) {
      try {
        const photos = JSON.parse(cached);
        return NextResponse.json({ photos, cached: true }, {
          headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
        });
      } catch {
        // JSON corrotto → ricarica da Cloudinary
      }
    }

    // 2. Fetch da Cloudinary (solo quando si apre il lightbox di un appartamento)
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

    // 3. Salva su Redis (solo se ci sono foto)
    if (photos.length > 0) {
      await redisSet(redisKey, JSON.stringify(photos), TTL_SECONDS);
    }

    return NextResponse.json({ photos }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });

  } catch (err) {
    console.error('[cloudinary] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
