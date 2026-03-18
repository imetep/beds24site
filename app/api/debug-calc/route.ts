import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

/**
 * GET /api/debug-calc
 * Testa il calcolo prezzi senza bisogno di completare una prenotazione.
 *
 * Parametri:
 *   roomId       — ID della room
 *   arrival      — YYYY-MM-DD
 *   departure    — YYYY-MM-DD
 *   numAdult     — adulti (età 2+)
 *   numChild     — bambini (età 0-2, NON pagano)
 *   numUnder12   — ragazzi 3-12 anni (esenti imposta soggiorno)
 *   offerId      — offerta scelta (1-6)
 *   voucherCode  — codice sconto (opzionale)
 *
 * Risposta: tutti i valori calcolati step by step
 */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  const roomId     = sp.get('roomId')     ?? '';
  const arrival    = sp.get('arrival')    ?? '';
  const departure  = sp.get('departure')  ?? '';
  const numAdult   = Number(sp.get('numAdult')   ?? 2);
  const numChild   = Number(sp.get('numChild')   ?? 0);
  const numUnder12 = Number(sp.get('numUnder12') ?? 0);
  const offerId    = Number(sp.get('offerId')    ?? 1);
  const voucherCode = sp.get('voucherCode') ?? '';

  if (!roomId || !arrival || !departure) {
    return NextResponse.json({ error: 'Parametri obbligatori: roomId, arrival, departure' }, { status: 400 });
  }

  // ── Calcolo notti ──────────────────────────────────────────────────────────
  const nights = Math.round((new Date(departure + 'T00:00:00').getTime() - new Date(arrival + 'T00:00:00').getTime()) / 86_400_000);

  // ── Calcolo imposta di soggiorno ───────────────────────────────────────────
  const taxableNights = Math.min(nights, 10);
  const taxableAdults = Math.max(0, numAdult - numUnder12);
  // NOTA: numChild (0-2 anni) non è incluso in numAdult, quindi non va in taxableAdults
  const touristTax = taxableNights * taxableAdults * 2;

  // ── Chiamata Beds24 /offers ────────────────────────────────────────────────
  // IMPORTANTE: numChild (0-2 anni) NON viene passato a Beds24 perché non pagano
  const token = await getToken();
  const qs = new URLSearchParams({
    roomId:    roomId,
    arrival:   arrival,
    departure: departure,
    numAdults: String(numAdult),
    // numChildren NON passato: bambini 0-2 non influenzano il prezzo
  });
  if (voucherCode) qs.set('voucherCode', voucherCode);

  console.log('[debug-calc] Chiamata Beds24 /offers con:', qs.toString());

  const res = await fetch(`${BASE_URL}/inventory/rooms/offers?${qs}`, {
    headers: { token },
    cache: 'no-store',
  });

  const offersData = await res.json();
  console.log('[debug-calc] Risposta Beds24:', JSON.stringify(offersData).slice(0, 500));

  // Trova l'offerta richiesta
  const roomOffers = offersData?.data?.[0] ?? offersData?.[0];
  const offers = roomOffers?.offers ?? [];
  const selectedOffer = offers.find((o: any) => o.offerId === offerId) ?? offers[0];
  const offerPrice = Number(selectedOffer?.price ?? 0);

  // ── Calcolo voucher (se presente) ─────────────────────────────────────────
  let discountedPrice: number | null = null;
  let discountAmount = 0;

  if (voucherCode) {
    const vRes = await fetch(`${new URL(req.url).origin}/api/voucher-check?code=${encodeURIComponent(voucherCode)}&price=${offerPrice}`);
    const vData = await vRes.json();
    console.log('[debug-calc] Voucher check:', JSON.stringify(vData));
    if (vData.valid) {
      discountedPrice = vData.discountedPrice;
      discountAmount  = offerPrice - discountedPrice!;
    }
  }

  const realPrice = discountedPrice !== null ? discountedPrice : offerPrice;
  const total     = realPrice + touristTax;

  // ── Risposta con tutti i valori ────────────────────────────────────────────
  return NextResponse.json({
    // Input
    input: { roomId, arrival, departure, numAdult, numChild, numUnder12, offerId, voucherCode },

    // Beds24 riceve
    beds24Input: {
      numAdults:    numAdult,
      numChildren:  0,  // bambini 0-2 NON passati
      note: 'numChild (0-2 anni) NON passato a Beds24 — non pagano',
    },

    // Prezzi
    prices: {
      offerPrice,
      discountAmount,
      discountedPrice,
      realPrice,
    },

    // Imposta soggiorno
    touristTaxCalc: {
      nights,
      taxableNights,
      numAdult,
      numUnder12,
      taxableAdults,
      formula: `${taxableNights} notti × ${taxableAdults} adulti × €2 = €${touristTax}`,
      touristTax,
    },

    // Totale finale
    total,
    breakdown: `${realPrice} (soggiorno) + ${touristTax} (imposta) = ${total}`,

    // Offers raw da Beds24
    allOffers: offers,
  });
}
