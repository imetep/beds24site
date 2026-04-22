import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';
import { getPaypalAccessToken, retrieveVaultForOrder } from '@/lib/paypal';
import { setVault } from '@/lib/paypal-vault-kv';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const BEDS24_BASE = 'https://beds24.com/api/v2';

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const {
    orderID, bookingId, amount, accommodation, touristTax, discountAmount,
    voucherCode, extras,
    // Nuovi: quando il paypal-order è stato creato con saveVault=true
    // (Rimborsabile), il client passa anche questi per registrare il vault
    // residuo su KV.
    saveVault          = false,
    residualAmount     = 0,          // es. 50% del totale → addebitato dal cron
    residualChargeAt   = null,       // ISO8601, es. checkIn - 48h
    residualPolicy     = null,       // 'rimborsabile-residuo' attualmente
  } = body;

  console.log('[paypal-capture] Body:', JSON.stringify({
    accommodation, touristTax, discountAmount, voucherCode,
    extrasCount: Array.isArray(extras) ? extras.length : 0,
    saveVault, residualAmount, residualChargeAt,
  }));

  if (!orderID || !bookingId) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti: orderID, bookingId' }, { status: 400 });
  }

  try {
    const accessToken = await getPaypalAccessToken();

    // 1. Cattura PayPal
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    const rawText = await res.text();
    console.log('[paypal-capture] PayPal status:', res.status, rawText.slice(0, 400));
    if (!res.ok) throw new Error(`PayPal capture fallita (${res.status}): ${rawText.slice(0, 200)}`);

    const data          = JSON.parse(rawText);
    const captureUnit   = data.purchase_units?.[0]?.payments?.captures?.[0];
    const captureID     = captureUnit?.id;
    const captureStatus = captureUnit?.status;
    const capturedAmount = Number(captureUnit?.amount?.value ?? amount ?? 0);

    console.log('[paypal-capture] captureID:', captureID, 'status:', captureStatus, 'amount:', capturedAmount);
    if (captureStatus !== 'COMPLETED') {
      throw new Error(`Pagamento PayPal non completato. Status: ${captureStatus ?? 'sconosciuto'}`);
    }

    // 1b. Estrai vault id se saveVault era on.
    // PayPal lo espone in posti diversi a seconda del flow/versione:
    //   data.payment_source.paypal.attributes.vault.id
    //   data.payment_source.paypal.vault.id              (senza "attributes")
    //   captureUnit.payment_source.paypal.attributes.vault.id
    //   captureUnit.payment_source.paypal.vault.id
    //   data.payment_source.card.attributes.vault.id     (ospite paga con carta via PayPal)
    // Se non lo trova, logghiamo l'intera response ridotta per capire.
    let vaultId: string | null = null;
    let customerId: string | null = null;
    if (saveVault) {
      const ps       = data?.payment_source ?? {};
      const psCap    = captureUnit?.payment_source ?? {};
      const candidates: Array<string | undefined> = [
        ps?.paypal?.attributes?.vault?.id,
        ps?.paypal?.vault?.id,
        ps?.card?.attributes?.vault?.id,
        psCap?.paypal?.attributes?.vault?.id,
        psCap?.paypal?.vault?.id,
        psCap?.card?.attributes?.vault?.id,
      ];
      vaultId = candidates.find(v => typeof v === 'string' && v.length > 0) ?? null;

      const custCandidates: Array<string | undefined> = [
        ps?.paypal?.attributes?.vault?.customer?.id,
        ps?.paypal?.vault?.customer?.id,
        ps?.card?.attributes?.vault?.customer?.id,
        psCap?.paypal?.attributes?.vault?.customer?.id,
        psCap?.paypal?.vault?.customer?.id,
        data?.payer?.payer_id,
      ];
      customerId = custCandidates.find(v => typeof v === 'string' && v.length > 0) ?? null;

      console.log('[paypal-capture] vault id extracted (immediate):', vaultId, 'customer:', customerId);

      // Se vault.status === APPROVED ma id ancora non popolato (tipico del
      // flow ON_SUCCESS), PayPal lo crea in modo asincrono. Retry con GET
      // ordine fino a 3 volte (~4.5 sec totali).
      if (!vaultId) {
        const retrieved = await retrieveVaultForOrder(orderID);
        if (retrieved.vaultId) {
          vaultId    = retrieved.vaultId;
          customerId = retrieved.customerId ?? customerId;
          console.log('[paypal-capture] vault id retrieved via retry:', vaultId);
        } else {
          console.log('[paypal-capture] 🔍 DEBUG payment_source (root):',   JSON.stringify(ps).slice(0, 800));
          console.log('[paypal-capture] 🔍 DEBUG payment_source (capture):', JSON.stringify(psCap).slice(0, 800));
        }
      }
    }

    const token = await getToken();

    // 2. Aggiorna status a new
    const statusPayload = [{ id: Number(bookingId), status: 'new' }];
    const res1 = await fetch(`${BEDS24_BASE}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify(statusPayload),
      cache: 'no-store',
    });
    const raw1 = await res1.text();
    console.log('[paypal-capture] Beds24 status POST:', res1.status, raw1.slice(0, 200));

    // 3. Aggiunge charges + payment
    const invoiceItems: any[] = [];

    if (accommodation && Number(accommodation) > 0) {
      invoiceItems.push({
        type: 'charge',
        description: voucherCode ? `Soggiorno (voucher: ${voucherCode})` : 'Soggiorno',
        amount: Number(accommodation),
        qty: 1,
      });
    }

    if (discountAmount && Number(discountAmount) > 0) {
      invoiceItems.push({
        type: 'charge',
        description: `Sconto voucher${voucherCode ? ` (${voucherCode})` : ''}`,
        amount: -Number(discountAmount),
        qty: 1,
      });
    }

    if (touristTax && Number(touristTax) > 0) {
      invoiceItems.push({
        type: 'charge',
        description: 'Imposta di soggiorno',
        amount: Number(touristTax),
        qty: 1,
      });
    }

    if (Array.isArray(extras)) {
      for (const ex of extras) {
        const price = Number(ex?.price);
        const qty   = Number(ex?.quantity);
        const desc  = typeof ex?.description === 'string' ? ex.description : '';
        if (desc && price > 0 && qty > 0) {
          invoiceItems.push({ type: 'charge', description: desc, amount: price, qty });
        }
      }
    }

    invoiceItems.push({
      type: 'payment',
      description: 'PayPal',
      amount: capturedAmount,
      qty: 1,
    });

    const invoicePayload = [{ id: Number(bookingId), invoiceItems }];
    const res2 = await fetch(`${BEDS24_BASE}/bookings`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload),
      cache: 'no-store',
    });
    const raw2 = await res2.text();
    console.log('[paypal-capture] Beds24 invoice POST:', res2.status, raw2.slice(0, 300));

    if (!res1.ok || !res2.ok) {
      console.error('[paypal-capture] Beds24 update parzialmente fallita — verificare manualmente');
    }

    // 4. Se era un vault save (Rimborsabile), persistiamo il vault record su KV
    //    per il cron che addebiterà il 50% residuo a checkIn − 48h.
    if (saveVault && vaultId && residualAmount > 0 && residualChargeAt && residualPolicy) {
      try {
        await setVault({
          bookingId:      Number(bookingId),
          vaultId,
          customerId,
          amount:         Number(residualAmount),
          currency:       'EUR',
          policy:         residualPolicy,
          createdAt:      new Date().toISOString(),
          chargeAt:       residualChargeAt,
          status:         'pending',
          retryCount:     0,
          lastAttemptAt:  null,
          lastError:      null,
          captureId:      null,
          capturedAmount: null,
        });
        console.log('[paypal-capture] ✅ vault saved for residual charge:', { bookingId, vaultId, residualAmount, residualChargeAt });
      } catch (vaultErr: any) {
        console.error('[paypal-capture] ⚠️ vault KV save failed (pagamento upfront OK):', vaultErr.message);
      }
    } else if (saveVault && !vaultId) {
      console.warn('[paypal-capture] ⚠️ saveVault richiesto ma vault_id non presente in risposta PayPal — il 50% residuo non potrà essere addebitato automaticamente');
    }

    return NextResponse.json({
      ok:        true,
      captureID,
      status:    captureStatus,
      bookingId: Number(bookingId),
      amount:    capturedAmount,
      vaultSaved: Boolean(saveVault && vaultId),
    });

  } catch (err: any) {
    console.error('[paypal-capture] Errore:', err.message);
    return NextResponse.json({ error: err.message ?? 'Errore cattura PayPal' }, { status: 500 });
  }
}
