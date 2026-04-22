import { NextResponse } from 'next/server';
import { getPaypalClientToken } from '@/lib/paypal';

/**
 * POST /api/paypal-client-token
 *
 * Ritorna un client token firmato da PayPal, richiesto dal JS SDK v6
 * per inizializzare `paypal.createInstance({ clientToken, ... })`.
 *
 * Ritorna anche `mode` ('sandbox' | 'live') per evitare di esporre
 * NEXT_PUBLIC_PAYPAL_MODE al client — il wizard sceglie l'URL del
 * core SDK (sandbox.paypal.com vs paypal.com) in base a mode.
 */
export async function POST() {
  try {
    const { clientToken, expiresIn } = await getPaypalClientToken();
    const mode = process.env.PAYPAL_MODE === 'sandbox' ? 'sandbox' : 'live';
    return NextResponse.json({ ok: true, clientToken, expiresIn, mode });
  } catch (err: any) {
    console.error('[paypal-client-token]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore generazione client token' },
      { status: 500 },
    );
  }
}
