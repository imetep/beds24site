/**
 * lib/paypal.ts
 *
 * Helpers centrali per chiamare PayPal REST v1/v2/v3.
 * Sostituisce le duplicazioni presenti in /api/paypal-order e /api/paypal-capture.
 *
 * Endpoint usati:
 *   v1/oauth2/token              → access token (client credentials)
 *   v1/identity/generate-token   → client token per SDK JS v6
 *   v3/vault/setup-tokens        → crea setup-token per vault (no charge)
 *   v3/vault/payment-tokens      → converte setup-token → payment-token permanente
 *   v2/checkout/orders           → crea/cattura ordine; charge via vault_id
 */

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

export const PAYPAL_MODE_IS_SANDBOX = process.env.PAYPAL_MODE === 'sandbox';

// ─── Access token (client credentials) ───────────────────────────────────────

export async function getPaypalAccessToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET non configurati');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body:  'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth fallita (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ─── Client token per SDK JS v6 ──────────────────────────────────────────────

export async function getPaypalClientToken(): Promise<{ clientToken: string; expiresIn: number }> {
  const accessToken = await getPaypalAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v1/identity/generate-token`, {
    method:  'POST',
    headers: {
      'Authorization':  `Bearer ${accessToken}`,
      'Content-Type':   'application/json',
      'Accept':         'application/json',
      'Accept-Language': 'en_US',
    },
    body:  JSON.stringify({}),
    cache: 'no-store',
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal /generate-token fallita (${res.status}): ${rawText.slice(0, 200)}`);
  }
  const data = JSON.parse(rawText);
  return {
    clientToken: data.client_token,
    expiresIn:   Number(data.expires_in ?? 3600),
  };
}

// ─── Setup token (vault save, no charge) ─────────────────────────────────────

export interface CreateSetupTokenOpts {
  bookingId:   number;
  amount:      number;           // solo display (non addebitato)
  brandName?:  string;
  returnUrl:   string;
  cancelUrl:   string;
  merchantCustomerId?: string;   // es. l'email del guest, per legare al customer PayPal
}

export async function createSetupToken(opts: CreateSetupTokenOpts): Promise<{
  setupTokenId: string;
  approveUrl:   string;
}> {
  const accessToken = await getPaypalAccessToken();

  // Omettiamo brand_name: PayPal rifiuta valori custom con
  // INCOMPATIBLE_PARAMETER_VALUE e usa quello registrato sull'app.
  const body: any = {
    payment_source: {
      paypal: {
        usage_type:    'MERCHANT',
        customer_type: 'CONSUMER',
        experience_context: {
          return_url:        opts.returnUrl,
          cancel_url:        opts.cancelUrl,
          locale:            'it-IT',
          shipping_preference: 'NO_SHIPPING',
          vault_instruction: 'ON_CREATE_PAYMENT_TOKENS',
        },
      },
    },
  };

  if (opts.merchantCustomerId) {
    body.customer = { merchant_customer_id: opts.merchantCustomerId };
  }

  const res = await fetch(`${PAYPAL_BASE}/v3/vault/setup-tokens`, {
    method:  'POST',
    headers: {
      'Authorization':     `Bearer ${accessToken}`,
      'Content-Type':      'application/json',
      'PayPal-Request-Id': `livingapple-setup-${opts.bookingId}-${Date.now()}`,
    },
    body:  JSON.stringify(body),
    cache: 'no-store',
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal /setup-tokens fallita (${res.status}): ${rawText.slice(0, 300)}`);
  }

  const data         = JSON.parse(rawText);
  const setupTokenId = data.id as string;
  const approveLink  = Array.isArray(data.links)
    ? data.links.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action')
    : null;
  const approveUrl   = approveLink?.href as string | undefined;

  if (!setupTokenId || !approveUrl) {
    throw new Error(`PayPal setup-token incompleto. Response: ${rawText.slice(0, 300)}`);
  }

  return { setupTokenId, approveUrl };
}

// ─── Conferma payment token (setup → permanent) ──────────────────────────────

export async function confirmPaymentToken(setupTokenId: string): Promise<{
  vaultId:     string;
  customerId:  string | null;
  emailAddress: string | null;
}> {
  const accessToken = await getPaypalAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v3/vault/payment-tokens`, {
    method:  'POST',
    headers: {
      'Authorization':     `Bearer ${accessToken}`,
      'Content-Type':      'application/json',
      'PayPal-Request-Id': `livingapple-confirm-${setupTokenId}`,
    },
    body: JSON.stringify({
      payment_source: {
        token: { id: setupTokenId, type: 'SETUP_TOKEN' },
      },
    }),
    cache: 'no-store',
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal /payment-tokens fallita (${res.status}): ${rawText.slice(0, 300)}`);
  }

  const data       = JSON.parse(rawText);
  const vaultId    = data.id as string;
  const customerId = data.customer?.id ?? null;
  const email      = data.payment_source?.paypal?.email_address ?? null;

  if (!vaultId) {
    throw new Error(`PayPal payment-token incompleto. Response: ${rawText.slice(0, 300)}`);
  }

  return { vaultId, customerId, emailAddress: email };
}

// ─── Recupero asincrono vault.id dopo capture ────────────────────────────────
// Quando una capture viene fatta con attributes.vault.store_in_vault: ON_SUCCESS,
// PayPal popola `vault.status: APPROVED` subito ma il `vault.id` compare in
// modo asincrono (tipicamente 1-3 secondi dopo). Questo helper fa GET
// sull'ordine con retry finché non trova l'id, oppure restituisce null.

export async function retrieveVaultForOrder(
  orderId: string,
  retries: number = 3,
  delayMs: number = 1500,
): Promise<{ vaultId: string | null; customerId: string | null; status: string | null }> {
  const accessToken = await getPaypalAccessToken();

  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, delayMs));

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) continue;
    const data = await res.json();

    const capUnit = data.purchase_units?.[0]?.payments?.captures?.[0];
    const ps     = data.payment_source ?? {};
    const psCap  = capUnit?.payment_source ?? {};

    const vaultId =
      ps?.paypal?.attributes?.vault?.id ??
      ps?.paypal?.vault?.id ??
      psCap?.paypal?.attributes?.vault?.id ??
      psCap?.paypal?.vault?.id ??
      null;

    const status =
      ps?.paypal?.attributes?.vault?.status ??
      ps?.paypal?.vault?.status ??
      null;

    const customerId =
      ps?.paypal?.attributes?.vault?.customer?.id ??
      ps?.paypal?.vault?.customer?.id ??
      ps?.paypal?.account_id ??
      null;

    console.log(
      `[retrieveVaultForOrder] attempt ${attempt + 1}/${retries}:`,
      { vaultId, status, customerId },
    );

    if (vaultId) return { vaultId, customerId, status };
  }
  return { vaultId: null, customerId: null, status: null };
}

// ─── Charge con vault_id (merchant-initiated) ────────────────────────────────

export interface ChargeVaultOpts {
  vaultId:        string;
  amount:         number;
  currency:       string;     // 'EUR'
  bookingId:      number;
  description:    string;
  idempotencyKey: string;
}

export async function chargeVault(opts: ChargeVaultOpts): Promise<{
  orderId:        string;
  captureId:      string;
  capturedAmount: number;
  status:         string;
}> {
  const accessToken = await getPaypalAccessToken();

  // 1. Crea order con vault_id (intent=CAPTURE, merchant-initiated)
  const orderBody = {
    intent: 'CAPTURE',
    payment_source: {
      paypal: {
        vault_id: opts.vaultId,
        stored_credential: {
          payment_initiator: 'MERCHANT',
          payment_type:      'UNSCHEDULED',
          usage:             'SUBSEQUENT',
        },
      },
    },
    purchase_units: [{
      reference_id: String(opts.bookingId),
      description:  opts.description.slice(0, 127),
      amount: {
        currency_code: opts.currency,
        value:         opts.amount.toFixed(2),
      },
    }],
  };

  const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method:  'POST',
    headers: {
      'Authorization':     `Bearer ${accessToken}`,
      'Content-Type':      'application/json',
      'PayPal-Request-Id': opts.idempotencyKey,
    },
    body:  JSON.stringify(orderBody),
    cache: 'no-store',
  });
  const orderRaw = await orderRes.text();
  if (!orderRes.ok) {
    throw new Error(`PayPal vault order fallita (${orderRes.status}): ${orderRaw.slice(0, 300)}`);
  }
  const order = JSON.parse(orderRaw);
  const orderId = order.id as string;
  if (!orderId) {
    throw new Error(`PayPal order senza id. Response: ${orderRaw.slice(0, 200)}`);
  }

  // Se l'order è già COMPLETED (merchant-initiated può capture in un solo step),
  // estraggo già il capture.
  let captureId:      string | null = null;
  let capturedAmount: number        = 0;
  let status:         string        = order.status ?? 'UNKNOWN';

  const embeddedCapture = order.purchase_units?.[0]?.payments?.captures?.[0];
  if (embeddedCapture?.id) {
    captureId      = embeddedCapture.id;
    capturedAmount = Number(embeddedCapture.amount?.value ?? opts.amount);
    status         = embeddedCapture.status ?? status;
  } else {
    // 2. Capture esplicita (fallback)
    const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method:  'POST',
      headers: {
        'Authorization':     `Bearer ${accessToken}`,
        'Content-Type':      'application/json',
        'PayPal-Request-Id': `${opts.idempotencyKey}-cap`,
      },
      body:  '{}',
      cache: 'no-store',
    });
    const capRaw = await capRes.text();
    if (!capRes.ok) {
      throw new Error(`PayPal vault capture fallita (${capRes.status}): ${capRaw.slice(0, 300)}`);
    }
    const cap = JSON.parse(capRaw);
    const captureUnit = cap.purchase_units?.[0]?.payments?.captures?.[0];
    captureId      = captureUnit?.id ?? null;
    capturedAmount = Number(captureUnit?.amount?.value ?? opts.amount);
    status         = captureUnit?.status ?? 'UNKNOWN';
  }

  if (!captureId || status !== 'COMPLETED') {
    throw new Error(`PayPal capture non completata. Status: ${status}, captureId: ${captureId}`);
  }

  return { orderId, captureId, capturedAmount, status };
}
