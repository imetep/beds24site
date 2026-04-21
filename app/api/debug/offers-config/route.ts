import { NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

/**
 * GET /api/debug/offers-config
 *
 * Endpoint DI DEBUG TEMPORANEO.
 * Restituisce la configurazione completa delle offerte da Beds24 tramite
 * /properties?includeOffers=true — ci serve per scoprire quali campi di deposit /
 * payment collection sono esposti (fields tipo "depositCollection",
 * "depositAmount", "depositType", "offerRules", ...).
 *
 * TODO: RIMUOVERE dopo aver integrato la lettura deposit nel wizard.
 */
export async function GET() {
  try {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/properties?includeOffers=true`, {
      headers: { token },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Beds24 HTTP ${res.status}`, body: text.slice(0, 500) },
        { status: 500 },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Errore' }, { status: 500 });
  }
}
