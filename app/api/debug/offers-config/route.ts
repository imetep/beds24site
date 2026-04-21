import { NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

/**
 * GET /api/debug/offers-config
 *
 * Endpoint DI DEBUG TEMPORANEO.
 * Interroga Beds24 /properties con vari flag include* e restituisce
 * SOLO i campi rilevanti per capire come sono configurati deposit
 * e bookingType per ogni offerta.
 *
 * TODO: RIMUOVERE dopo aver integrato la lettura deposit nel wizard.
 */

// Walker ricorsivo: trova tutti gli oggetti che contengono una chiave "bookingType"
// e li raccoglie con il percorso nel JSON originale.
function findBookingTypeNodes(obj: any, path: string[] = [], out: Array<{ path: string; node: any }> = []) {
  if (obj && typeof obj === 'object') {
    if (!Array.isArray(obj) && 'bookingType' in obj) {
      out.push({ path: path.join('.') || '(root)', node: obj });
    }
    for (const k of Object.keys(obj)) {
      findBookingTypeNodes(obj[k], [...path, k], out);
    }
  }
  return out;
}

export async function GET() {
  try {
    const token = await getToken();
    const qs = new URLSearchParams({
      includeAllRooms:    'true',
      includeOffers:      'true',
      includeTexts:       'all',
      includePriceRules:  'true',
    });
    const res = await fetch(`${BASE_URL}/properties?${qs}`, {
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

    // ── Sintesi: per ogni property estraiamo SOLO ciò che ci serve ──────────
    const summary = (data.data ?? []).map((p: any) => ({
      propertyId: p.id,
      propertyName: p.name,
      bookingType_default: p.bookingRules?.bookingType ?? null,
      paymentCollection: p.paymentCollection ?? null,
      // Offerte a livello property (se esistono)
      offers_property_level: Array.isArray(p.offers)
        ? p.offers.map((o: any) => ({
            offerId:      o.offerId ?? o.id ?? null,
            offerName:    o.offerName ?? o.name ?? null,
            bookingType:  o.bookingType ?? null,
            allFields:    Object.keys(o),
          }))
        : 'NO offers array at property level',
      // Offerte a livello room (se esistono)
      rooms_with_offers: Array.isArray(p.roomTypes ?? p.rooms)
        ? (p.roomTypes ?? p.rooms).slice(0, 1).map((r: any) => ({
            roomId:   r.id ?? r.roomId ?? null,
            roomName: r.name ?? null,
            offers:   Array.isArray(r.offers)
              ? r.offers.map((o: any) => ({
                  offerId:     o.offerId ?? o.id ?? null,
                  offerName:   o.offerName ?? o.name ?? null,
                  bookingType: o.bookingType ?? null,
                  allFields:   Object.keys(o),
                }))
              : 'NO offers array at room level',
          }))
        : 'NO roomTypes/rooms array',
    }));

    // ── Caccia al "bookingType": dove si trova ovunque nel JSON? ─────────────
    const nodes = findBookingTypeNodes(data);
    const bookingTypeLocations = nodes.slice(0, 15).map(n => ({
      path:        n.path,
      bookingType: n.node.bookingType,
      siblings:    Object.keys(n.node).slice(0, 10),
    }));

    // ── Top-level keys della risposta (per vedere se ci scappa qualcosa) ────
    const topLevelKeys = Object.keys(data);
    const firstPropertyKeys = data.data?.[0] ? Object.keys(data.data[0]) : [];

    return NextResponse.json({
      meta: {
        topLevelKeys,
        firstPropertyKeys,
        totalBookingTypeNodes: nodes.length,
      },
      bookingTypeLocations,
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Errore' }, { status: 500 });
  }
}
