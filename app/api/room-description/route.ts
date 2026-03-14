import { NextRequest, NextResponse } from 'next/server';

// Mappa lingua → codice Beds24
const LANG_MAP: Record<string, string> = {
  it: 'it',
  en: 'en',
  de: 'de',
  pl: 'pl',
};

async function getRoomDescription(propId: number, roomId: number, lang: string): Promise<string> {
  try {
    const res = await fetch(
      `https://beds24.com/booking2.php?propid=${propId}&roomid=${roomId}&layout=3&lang=${lang}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 86400 }, // cache 24 ore
      }
    );
    const html = await res.text();

    const regex = new RegExp(
      `class="[^"]*b24-room-107\\s+b24-room-${roomId}[^"]*">([\\s\\S]*?)<script`,
      'i'
    );
    const match = html.match(regex);
    if (!match) return '';

    return match[1].replace(/<[^>]+>/g, '').trim();
  } catch {
    return '';
  }
}

// GET /api/room-description?propId=46487&roomId=107773
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propId = Number(searchParams.get('propId'));
  const roomId = Number(searchParams.get('roomId'));

  if (!propId || !roomId) {
    return NextResponse.json({ error: 'Missing propId or roomId' }, { status: 400 });
  }

  // Recupera testi in tutte e 4 le lingue in parallelo
  const [it, en, de, pl] = await Promise.all([
    getRoomDescription(propId, roomId, 'it'),
    getRoomDescription(propId, roomId, 'en'),
    getRoomDescription(propId, roomId, 'de'),
    getRoomDescription(propId, roomId, 'pl'),
  ]);

  return NextResponse.json(
    { it, en, de, pl },
    { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' } }
  );
}
