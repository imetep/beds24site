import { NextRequest, NextResponse } from 'next/server';
import { getRoomOffers } from '@/lib/beds24-client';

/**
 * GET /api/offers?roomId=&checkIn=&checkOut=&numAdult=&numChild=&voucherCode=
 *
 * Proxy server-side per Beds24 /inventory/rooms/offers.
 * Il token Beds24 non viene mai esposto al browser.
 * Chiamata real-time (no cache) — usata da WizardStep5 e WizardStep6.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const roomId  = Number(searchParams.get('roomId'));
  const checkIn  = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const numAdult = Number(searchParams.get('numAdult') ?? 1);
  const numChild = Number(searchParams.get('numChild') ?? 0);
  const voucherCode = searchParams.get('voucherCode') ?? undefined;

  if (!roomId || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'Parametri mancanti: roomId, checkIn, checkOut obbligatori' },
      { status: 400 }
    );
  }

  try {
    const offers = await getRoomOffers({
      roomId, checkIn, checkOut, numAdult, numChild, voucherCode,
    });

    return NextResponse.json({ offers }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error('[API /offers] Error:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore recupero offerte' },
      { status: 500 }
    );
  }
}
