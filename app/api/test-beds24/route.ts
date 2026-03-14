import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(
    'https://beds24.com/booking2.php?propid=46487&roomid=107773&layout=3&lang=it',
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const html = await res.text();

  // Estrai features dal div b24-room-features-107773
  const featuresMatch = html.match(
    /class="b24-features b24-room-features-107773">([\s\S]*?)<\/div><script/
  );

  // Estrai tutti i testi dentro i tag <p>
  const features: string[] = [];
  if (featuresMatch) {
    const featureHtml = featuresMatch[1];
    const pMatches = featureHtml.matchAll(/<p[^>]*>[\s\S]*?glyphicon-ok[^>]*><\/span>&nbsp;(.*?)<\/p>/g);
    for (const m of pMatches) {
      features.push(m[1].trim());
    }
  }

  return new Response(JSON.stringify({ features }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}