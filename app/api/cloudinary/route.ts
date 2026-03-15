import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Genera URL ottimizzato per una foto
function makeUrl(publicId: string, width: number, height?: number): string {
  const transforms: any = { width, crop: 'fill', quality: 'auto', fetch_format: 'auto' };
  if (height) transforms.height = height;
  return cloudinary.url(publicId, transforms);
}

// GET /api/cloudinary?folder=livingapple/fuji         → tutte le foto di una cartella
// GET /api/cloudinary?covers=true                     → solo la prima foto di ogni appartamento
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder');
  const covers = searchParams.get('covers') === 'true';

  try {
    if (covers) {
      // Una sola chiamata — prima foto di ogni cartella
      const folders = [
        'livingapple/annurca', 'livingapple/delicious', 'livingapple/fuji',
        'livingapple/idared', 'livingapple/kissabel', 'livingapple/pink-lady',
        'livingapple/renetta', 'livingapple/sergente', 'livingapple/smith',
        'livingapple/stark', 'livingapple-beach/braeburn',
        'livingapple-beach/gala', 'livingapple-beach/rubens',
      ];

      const results = await Promise.all(
        folders.map(async (f) => {
          const res = await cloudinary.search
            .expression(`folder:${f}`)
            .sort_by('public_id', 'asc')
            .max_results(1)
            .execute();
          const photo = res.resources[0];
          return {
            folder: f,
            url: photo ? makeUrl(photo.public_id, 600, 400) : null,
          };
        })
      );

      // Restituisce oggetto { 'livingapple/fuji': 'https://...', ... }
      const coverMap: Record<string, string | null> = {};
      results.forEach(({ folder, url }) => { coverMap[folder] = url; });

      return NextResponse.json({ covers: coverMap }, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
      });
    }

    if (folder) {
      // Tutte le foto di una cartella (per scheda appartamento)
      const result = await cloudinary.search
        .expression(`folder:${folder}`)
        .sort_by('public_id', 'asc')
        .max_results(30)
        .execute();

      const photos = result.resources.map((r: any) => ({
        url: makeUrl(r.public_id, 1200),
        thumbUrl: makeUrl(r.public_id, 400, 300),
        publicId: r.public_id,
      }));

      return NextResponse.json({ photos }, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
      });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  } catch (err) {
    console.error('Cloudinary error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
}
}
