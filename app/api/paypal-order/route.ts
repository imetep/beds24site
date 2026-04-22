import { NextRequest, NextResponse } from 'next/server';
import { getPaypalAccessToken } from '@/lib/paypal';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

// ── POST /api/paypal-order ────────────────────────────────────────────────────
// Body: {
//   amount:       number      // importo da addebitare ora
//   bookingId:    number
//   description:  string
//   saveVault?:   boolean     // true → aggiunge store_in_vault per Rimborsabile
//                             //         (così cattura il 50% subito E salva il
//                             //         vault_id per il 50% residuo via cron)
//   returnUrl?:   string      // richiesto quando saveVault=true
//   cancelUrl?:   string      // richiesto quando saveVault=true
//   guestEmail?:  string      // opzionale (merchant_customer_id per vault)
// }
// Risposta: { orderID: string }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const {
    amount, bookingId, description = 'Soggiorno LivingApple',
    saveVault = false, returnUrl, cancelUrl, guestEmail,
  } = body;

  if (!amount || !bookingId) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti: amount, bookingId' },
      { status: 400 }
    );
  }

  if (saveVault && (!returnUrl || !cancelUrl)) {
    return NextResponse.json(
      { error: 'Con saveVault=true servono returnUrl e cancelUrl' },
      { status: 400 },
    );
  }

  const amountStr = Number(amount).toFixed(2);

  console.log('[paypal-order] Creo ordine:', { amount: amountStr, bookingId, saveVault });

  try {
    const accessToken = await getPaypalAccessToken();

    const payload: any = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(bookingId),
          description:  String(description).slice(0, 127),
          amount: {
            currency_code: 'EUR',
            value:         amountStr,
          },
        },
      ],
      application_context: {
        brand_name:          'LivingApple',
        landing_page:        'NO_PREFERENCE',
        shipping_preference: 'NO_SHIPPING',
        user_action:         'PAY_NOW',
      },
    };

    // Rimborsabile: addebita il 50% E salva il vault_id per il residuo.
    // PayPal fornisce vault.id nella response della capture successiva.
    //
    // NB: quando passiamo payment_source.paypal.experience_context, NON
    // includere brand_name né duplicare application_context — PayPal
    // risponde 422 INCOMPATIBLE_PARAMETER_VALUE. Usa solo experience_context
    // e ometti il brand_name (PayPal usa quello registrato sull'app).
    if (saveVault) {
      const paypalSource: any = {
        experience_context: {
          return_url:          returnUrl,
          cancel_url:          cancelUrl,
          shipping_preference: 'NO_SHIPPING',
          user_action:         'PAY_NOW',
          locale:              'it-IT',
        },
        attributes: {
          vault: {
            store_in_vault: 'ON_SUCCESS',
            usage_type:     'MERCHANT',
            customer_type:  'CONSUMER',
          },
        },
      };
      if (guestEmail) {
        paypalSource.attributes.customer = { merchant_customer_id: guestEmail };
      }
      payload.payment_source = { paypal: paypalSource };
      // Con payment_source presente, application_context non serve (e può
      // confliggere). Lo rimuoviamo per evitare errori 422.
      delete payload.application_context;
    }

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method:  'POST',
      headers: {
        'Authorization':     `Bearer ${accessToken}`,
        'Content-Type':      'application/json',
        'PayPal-Request-Id': `livingapple-${bookingId}-${Date.now()}`,
      },
      body:  JSON.stringify(payload),
      cache: 'no-store',
    });

    const rawText = await res.text();
    console.log('[paypal-order] PayPal status:', res.status, rawText.slice(0, 300));

    if (!res.ok) {
      throw new Error(`PayPal /v2/checkout/orders fallita (${res.status}): ${rawText.slice(0, 200)}`);
    }

    const data    = JSON.parse(rawText);
    const orderID = data.id;

    if (!orderID) {
      throw new Error('PayPal non ha restituito un order ID. Risposta: ' + rawText.slice(0, 200));
    }

    console.log('[paypal-order] Order creato:', orderID, saveVault ? '(vault save)' : '');
    return NextResponse.json({ ok: true, orderID });

  } catch (err: any) {
    console.error('[paypal-order] Errore:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Errore creazione ordine PayPal' },
      { status: 500 }
    );
  }
}
