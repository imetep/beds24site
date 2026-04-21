import { NextRequest, NextResponse } from 'next/server';
import { createSetupToken } from '@/lib/paypal';

/**
 * POST /api/paypal-setup-token
 *
 * Crea un PayPal vault setup-token per il flusso Flessibile:
 * nessun addebito ora, la carta/wallet viene solo salvata per un
 * addebito successivo (effettuato dal cron /api/paypal-vault-process).
 *
 * Body:
 *   {
 *     bookingId:    number          // booking Beds24 già creato (status 'request')
 *     amount:       number          // solo display (non addebitato ora)
 *     returnUrl:    string          // PayPal redirige qui dopo approvazione
 *     cancelUrl:    string          // PayPal redirige qui se l'utente annulla
 *     guestEmail?:  string          // opzionale, usato come merchant_customer_id
 *   }
 *
 * Response:
 *   { ok: true, setupTokenId, approveUrl }
 *
 * Il frontend salva setupTokenId in sessionStorage e fa window.location=approveUrl
 * per portare l'utente all'approvazione PayPal. Al ritorno la pagina
 * /[locale]/paypal-return chiama /api/paypal-confirm-vault con questo setupTokenId.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { bookingId, amount, returnUrl, cancelUrl, guestEmail } = body;

  if (!bookingId || !returnUrl || !cancelUrl) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti: bookingId, returnUrl, cancelUrl' },
      { status: 400 },
    );
  }

  try {
    const { setupTokenId, approveUrl } = await createSetupToken({
      bookingId:          Number(bookingId),
      amount:             Number(amount ?? 0),
      returnUrl,
      cancelUrl,
      merchantCustomerId: guestEmail || undefined,
    });

    console.log('[paypal-setup-token] ok:', { bookingId, setupTokenId });
    return NextResponse.json({ ok: true, setupTokenId, approveUrl });

  } catch (err: any) {
    console.error('[paypal-setup-token]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore creazione setup token' },
      { status: 500 },
    );
  }
}
