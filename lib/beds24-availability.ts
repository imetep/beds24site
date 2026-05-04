/**
 * lib/beds24-availability.ts
 *
 * Helper server-side per verificare se una camera è disponibile su Beds24
 * per un range di date. Usa la stessa cache (Next.js Data Cache, 30 min,
 * tag `availability:{roomId}`) di /api/availability — quindi se la stessa
 * camera è già stata richiesta di recente non genera chiamate Beds24
 * aggiuntive.
 *
 * Fail-open: in caso di errore Beds24 ritorna true (meglio mostrare il
 * preventivo come disponibile che bloccarlo per un transient failure).
 */

import { getToken } from './beds24-token';

const BEDS24_BASE = 'https://beds24.com/api/v2';

export async function isRoomAvailable(
  roomId: number,
  arrival: string,
  departure: string
): Promise<boolean> {
  try {
    const token = await getToken();
    const url = `${BEDS24_BASE}/inventory/rooms/availability?roomId=${roomId}&startDate=${arrival}&endDate=${departure}`;

    const isDev = process.env.NODE_ENV === 'development';
    const res = await fetch(url, {
      headers: { token },
      ...(isDev
        ? { cache: 'no-store' as RequestCache }
        : { next: { revalidate: 1800, tags: [`availability:${roomId}`] } }
      ),
    });

    if (!res.ok) {
      console.warn('[isRoomAvailable] Beds24 HTTP', res.status);
      return true;
    }

    const data = await res.json();
    const avail = data?.data?.[0]?.availability ?? {};

    // Itera giorno per giorno da arrival (incluso) a departure (escluso).
    // Se anche una sola notte è false → camera occupata per quel range.
    const startMs = new Date(arrival + 'T00:00:00').getTime();
    const endMs = new Date(departure + 'T00:00:00').getTime();
    for (let ms = startMs; ms < endMs; ms += 86_400_000) {
      const ymd = new Date(ms).toISOString().split('T')[0];
      if (avail[ymd] === false) return false;
    }
    return true;
  } catch (e) {
    console.warn('[isRoomAvailable] exception:', e);
    return true; // fail-open
  }
}
