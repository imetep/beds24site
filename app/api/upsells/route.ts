import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { getUpsellTexts } from '@/config/upsell-items';

const BASE_URL = 'https://beds24.com/api/v2';

/**
 * GET /api/upsells?propertyId=46487
 *
 * Restituisce gli upsell items opzionali configurati in Beds24 per una proprietà,
 * arricchiti con nome e descrizione multilingue da config/upsell-items.ts.
 *
 * Filtra solo type = "optional" | "optionalQty" — gli obbligatori sono già
 * inclusi nel prezzo calcolato da /inventory/rooms/offers.
 *
 * Response:
 * {
 *   data: Array<{
 *     id: string;        // "46487_1"
 *     index: number;     // index Beds24
 *     type: string;      // "optional" | "optionalQty"
 *     price: number;     // amount da Beds24
 *     per: string;       // "booking" | "room" | "person" ecc.
 *     period: string;    // "oneTime" | "daily" ecc.
 *     name: Record<string, string>;
 *     description?: Record<string, string>;
 *   }>
 * }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyId = Number(searchParams.get('propertyId'));

  if (!propertyId) {
    return NextResponse.json(
      { error: 'Parametro obbligatorio mancante: propertyId' },
      { status: 400 }
    );
  }

  try {
    const token = await getToken();

    const qs = new URLSearchParams({
      id: String(propertyId),
      includeUpsellItems: 'true',
    });

    const res = await fetch(`${BASE_URL}/properties?${qs}`, {
      headers: { token, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Beds24 HTTP ${res.status}`);
    }

    const data = await res.json();
    const prop = data?.data?.[0];

    if (!prop) {
      return NextResponse.json({ data: [] });
    }

    const OPTIONAL_TYPES = ['optional', 'optionalQty'];

    const items = (prop.upsellItems ?? [])
      .filter((item: any) => OPTIONAL_TYPES.includes(item.type))
      .map((item: any) => {
        const texts = getUpsellTexts(propertyId, item.index);

        // Se non c'è un nome configurato saltiamo l'item — non mostriamo
        // upsell senza nome al guest
        if (!texts) return null;

        return {
          id:          `${propertyId}_${item.index}`,
          index:       item.index,
          type:        item.type,
          price:       item.amount,
          per:         item.per,
          period:      item.period,
          name:        texts.name,
          description: texts.description,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ data: items });

  } catch (err: any) {
    console.error('[API /upsells]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore recupero upsell' },
      { status: 500 }
    );
  }
}
