import { NextResponse } from 'next/server';
 
export async function GET() {
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;
  if (!refreshToken) return NextResponse.json({ error: 'no token' }, { status: 500 });
 
  // 1. Get token
  const authRes = await fetch('https://beds24.com/api/v2/authentication/token', {
    headers: { refreshToken },
  });
  const { token } = await authRes.json();
 
  // 2. Call /offers
  const offersRes = await fetch(
    'https://beds24.com/api/v2/inventory/rooms/offers?propertyId=46487&roomId=107847&arrival=2026-03-20&departure=2026-03-27&numAdults=2&numChildren=0&includeTexts=it',
    { headers: { token } }
  );
  const offersData = await offersRes.json();
 
  // 3. Return pretty printed
  return new Response(JSON.stringify(offersData, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}