import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { FOLDERS } from '@/lib/cloudinary-covers';

const REDIS_URL   = process.env.KV_REST_API_URL!;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN!;

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session');
  return !!cookie && cookie.value === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  // 1. Invalida Next.js Data Cache (tag condiviso da tutti i wrapper unstable_cache)
  revalidateTag('cloudinary', 'pages');

  // 2. Svuota chiavi Redis: 1 covers + 13×3 per-folder (lightbox, room page, foto gallery)
  const keys = [
    'cloudinary:covers',
    ...FOLDERS.map(f => `cloudinary:folder:${f}`),
    ...FOLDERS.map(f => `cloudinary:room-photos:${f}`),
    ...FOLDERS.map(f => `cloudinary:foto-photos:${f}`),
  ];

  let redisDeleted = 0;
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const res = await fetch(`${REDIS_URL}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(keys.map(k => ['DEL', k])),
        cache: 'no-store',
      });
      const data = await res.json();
      // Upstash pipeline risponde [{ result: 0|1 }, ...]
      redisDeleted = Array.isArray(data)
        ? data.reduce((n: number, x: { result?: number }) => n + (x?.result ?? 0), 0)
        : 0;
    } catch (err) {
      console.error('[cloudinary/invalidate] redis error:', err);
    }
  }

  return NextResponse.json({
    ok: true,
    nextCacheInvalidated: true,
    redisKeysDeleted: redisDeleted,
    redisKeysScanned: keys.length,
  });
}
