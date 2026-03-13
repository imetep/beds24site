import { NextResponse } from 'next/server';

export async function GET() {
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN;

  if (!refreshToken) {
    return NextResponse.json({ error: 'BEDS24_REFRESH_TOKEN non trovato in .env.local' }, { status: 500 });
  }

  try {
    // Step 1: ottieni token
    const authRes = await fetch('https://beds24.com/api/v2/authentication/token', {
      headers: { refreshToken },
    });
    const authData = await authRes.json();

    if (!authData.token) {
      return NextResponse.json({ error: 'Token non ottenuto', details: authData }, { status: 401 });
    }

    // Step 2: prova a leggere le properties
    const propRes = await fetch('https://beds24.com/api/v2/properties?includeAllRooms=true', {
      headers: { token: authData.token },
    });
    const propData = await propRes.json();

    return NextResponse.json({
      success: true,
      tokenOk: true,
      propertiesCount: propData.data?.length ?? 0,
      properties: propData.data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        rooms: p.rooms?.map((r: any) => ({ id: r.id, name: r.name })),
      })),
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}