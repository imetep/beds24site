import { NextResponse } from 'next/server';
import { getPaypalClientToken } from '@/lib/paypal';

/**
 * POST /api/paypal-client-token
 *
 * Ritorna un client token firmato da PayPal, richiesto dal JS SDK v6
 * per inizializzare `paypal.createInstance({ clientToken, ... })`.
 *
 * Il client token è short-lived (~1h) e va richiesto ogni volta che il
 * wizard monta il componente Step3. Non mette in cache lato server: è
 * già server-signed e PayPal gestisce la scadenza.
 */
export async function POST() {
  try {
    const { clientToken, expiresIn } = await getPaypalClientToken();
    return NextResponse.json({ ok: true, clientToken, expiresIn });
  } catch (err: any) {
    console.error('[paypal-client-token]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore generazione client token' },
      { status: 500 },
    );
  }
}
