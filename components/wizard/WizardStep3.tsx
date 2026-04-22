'use client';

/**
 * WizardStep3 — riepilogo finale + pagamento (Stripe o PayPal).
 * Redesign B (2026-04-19): single-col 680px, 1 card riepilogo compatta
 * con hero foto + dati soggiorno + prezzo breakdown + totale,
 * banner policy cancellazione, card dati ospite compatta, trust signal,
 * CTA full-width. Applica visual audit §3.1–§3.7.
 *
 * ⚠️ LOGICA PAGAMENTO — vincoli da preservare:
 *   - Pre-caricamento SDK v6 core avviene in WizardStep2 quando si sceglie PayPal
 *   - `createBooking()` invocata dentro il click del bottone PayPal (mai al mount)
 *   - `createdBookIdRef` passa il bookId al capture handler
 *   - Status 'new' è settato server-side in /api/paypal-capture o
 *     /api/paypal-confirm-vault (flex) — mai toccare qui
 *   - Stripe: booking creato con status 'request', Beds24 /channels/stripe setta
 *     confirmed automaticamente → reset a 'request' avviene server-side in
 *     /api/stripe-session. /api/stripe-confirm al ritorno setta 'new' + invoice items.
 *   - Flex + PayPal: redirect full-page a PayPal (approveUrl) → return a
 *     /[locale]/paypal-return che chiama /api/paypal-confirm-vault. Dati
 *     soggiorno passati via sessionStorage key `paypal_vault_pending`.
 */

import { useState, useEffect, useRef } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES, calculateTouristTax } from '@/config/properties';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import { getTranslations } from '@/lib/i18n';
import {
  findOffer, findPropertyByRoom, computeDepositAmount,
  isFlexBookingType, isPartialRefundableBookingType, computeVaultChargeAt,
} from '@/lib/offer-deposit';
import type { Locale } from '@/config/i18n';

const SUPPORTED_LOCALES = ['it', 'en', 'de', 'pl'] as const;

function getRoomData(roomId: number | null) {
  if (!roomId) return null;
  for (const p of PROPERTIES) {
    const r = p.rooms.find(x => x.roomId === roomId);
    if (r) return r;
  }
  return null;
}

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);
}

function formatDate(ymd: string, locale: string) {
  return new Date(ymd + 'T00:00:00').toLocaleDateString(
    locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

interface Props { locale?: string; }

export default function WizardStep3({ locale = 'it' }: Props) {
  const loc = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'it';
  const tr            = getTranslations(loc as Locale);
  const t             = tr.components.wizardStep3;
  const tSidebar      = tr.components.wizardSidebar;
  const OFFER_NAMES   = tr.shared.offerNames as Record<string, string>;
  const CANCEL_POLICY = tr.shared.cancelPolicy as Record<string, string>;

  const {
    numAdult, numChild, childrenAges,
    checkIn, checkOut,
    selectedRoomId, selectedOfferId,
    cachedOffers,
    selectedExtras,
    voucherCode,
    paymentMethod,
    guestFirstName, guestLastName, guestEmail,
    guestPhone, guestCountry, guestArrivalTime, guestComments,
    pendingBookId,
    discountedPrice,
    setPendingBooking,
    prevStep, reset,
    propertyConfig,
  } = useWizardStore();

  // ✅ Fase iniziale 'ready': Step3 è solo riepilogo, nessuna API al mount
  const [phase, setPhase]       = useState<'ready' | 'error' | 'paying'>('ready');
  const [error, setError]       = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // PayPal SDK v6 state + refs
  //   - sdkReady        : SDK v6 core caricato + createInstance OK
  //   - sdkInstanceRef  : istanza restituita da paypal.createInstance()
  //   - paypalSessionRef: session one-time (creata solo per non-flex)
  //   - vaultPhase      : UX del flusso Flessibile (save PayPal senza addebito)
  //   - createdBookIdRef: bookId passato da createOrder a onApprove (pattern v5)
  const [sdkReady,  setSdkReady]  = useState(false);
  const [vaultPhase, setVaultPhase] = useState<'idle' | 'saving' | 'redirecting'>('idle');
  const sdkInstanceRef              = useRef<any>(null);
  const paypalSessionRef            = useRef<any>(null);
  const createdBookIdRef            = useRef<number | null>(null);

  const room   = getRoomData(selectedRoomId);
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;

  const roomOffers = cachedOffers?.find((ro: any) => ro.roomId === selectedRoomId);
  const offer = roomOffers?.offers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerPrice: number = offer?.price ?? 0;

  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);
  const perNight   = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;
  const offerName       = OFFER_NAMES[String(selectedOfferId ?? 0)] ?? offer?.offerName ?? '';
  const cancelPolicy    = CANCEL_POLICY[String(selectedOfferId ?? 0)] ?? '';

  const realPrice      = discountedPrice !== null ? discountedPrice : offerPrice;
  const hasDiscount    = discountedPrice !== null && discountedPrice < offerPrice;
  const discountAmount = hasDiscount ? offerPrice - discountedPrice! : 0;
  const extrasTotal    = (selectedExtras ?? []).reduce((sum: number, e: any) => sum + e.price * (e.quantity ?? 1), 0);
  const total          = realPrice + touristTax + extrasTotal;

  // Importo da addebitare ORA, calcolato dinamicamente in base al bookingType
  // dell'offerta e al paymentCollection della property (letti da Beds24 e cachati
  // in store via /api/property-config). Fallback a `total` se config non caricata.
  // Vedi lib/offer-deposit.ts per la regola completa.
  const offerConfig   = findOffer(propertyConfig, selectedRoomId, selectedOfferId);
  const propertyCfg   = findPropertyByRoom(propertyConfig, selectedRoomId);
  const amountToCharge         = computeDepositAmount(total, offerConfig, propertyCfg);
  const isFlexOffer            = isFlexBookingType(offerConfig?.bookingType);
  const isPartialRefundable    = isPartialRefundableBookingType(offerConfig?.bookingType);
  // Residuo da addebitare al cron per Rimborsabile (50% se amountToCharge è 50%).
  const residualAmountFromTotal = isPartialRefundable ? Math.max(0, total - amountToCharge) : 0;

  // Etichetta tipo appartamento (legge wizardSidebar i18n — condivisa con step 1/2)
  const roomTypeLabel = room?.type === 'monolocale' ? tSidebar.typeMonolocale
                       : room?.type === 'villa'      ? tSidebar.typeVilla
                       : room                        ? tSidebar.typeAppartamento
                       : '';

  // ── Fetch cover hero (miniatura foto appartamento) ────────────────────────
  useEffect(() => {
    if (!room?.cloudinaryFolder) { setCoverUrl(null); return; }
    fetchCoversCached().then(covers => setCoverUrl(covers?.[room.cloudinaryFolder] ?? null));
  }, [room?.cloudinaryFolder]);

  // ── Crea booking su Beds24 — chiamata solo al click del bottone Paga ──────
  // Restituisce il bookId oppure null se errore (setPhase('error') già chiamato)
  async function createBooking(): Promise<number | null> {
    if (!selectedRoomId || !checkIn || !checkOut) {
      setError(t.errDataMissing);
      setPhase('error');
      return null;
    }
    try {
      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:           selectedRoomId,
          checkIn, checkOut,
          numAdult:  numAdult + (childrenAges ?? []).filter((a: number) => a >= 3).length,
          numChild:  (childrenAges ?? []).filter((a: number) => a < 3).length,
          offerId:          selectedOfferId,
          voucherCode:      voucherCode || undefined,
          guestFirstName:   guestFirstName.trim(),
          guestName:        guestLastName.trim(),
          guestEmail:       guestEmail.trim(),
          guestPhone:       guestPhone.trim() || undefined,
          guestCountry:     guestCountry.trim() || undefined,
          guestArrivalTime: guestArrivalTime.trim() || undefined,
          guestComments:    (() => {
            const babies = (childrenAges ?? []).filter((a: number) => a < 3).length;
            const babyNote = babies > 0 ? `[Bambini 0-2 anni: ${babies}]` : '';
            const userComment = guestComments.trim();
            return [babyNote, userComment].filter(Boolean).join(' — ') || undefined;
          })(),
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok || !bookData.ok) throw new Error(bookData.error ?? `HTTP ${bookRes.status}`);

      setPendingBooking(bookData.bookId, bookData.invoiceAmount ?? null);
      return bookData.bookId as number;

    } catch (e: any) {
      setError(e.message ?? t.errGeneric);
      setPhase('error');
      return null;
    }
  }

  // ── Helper: cancella un booking su Beds24 (fire and forget) ──────────────
  function cancelBooking(bookId: number) {
    fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: bookId }),
    }).catch(() => {});
    setPendingBooking(null, null);
  }

  // ── Inizializza PayPal SDK v6 (clientToken + createInstance) ─────────────
  // Flow:
  //   1. Se paymentMethod==='paypal', fetch clientToken + mode
  //   2. Inject script web-sdk/v6/core (idempotente per id)
  //   3. Al load: paypal.createInstance({ clientToken, components }) → sdkInstance
  //   4. Per offerte NON flex: crea subito createPayPalOneTimePaymentSession
  //      (per flex il SDK non serve: il bottone fa POST setup-token + redirect)
  useEffect(() => {
    if (paymentMethod !== 'paypal') return;

    let cancelled = false;

    (async () => {
      try {
        // 1. Client token + mode
        const tkRes  = await fetch('/api/paypal-client-token', { method: 'POST' });
        const tkData = await tkRes.json();
        if (cancelled) return;
        if (!tkRes.ok || !tkData.clientToken) {
          setError(t.errPayPalLoad);
          return;
        }
        const mode   = tkData.mode === 'sandbox' ? 'sandbox' : 'live';
        const host   = mode === 'sandbox' ? 'www.sandbox.paypal.com' : 'www.paypal.com';
        const src    = `https://${host}/web-sdk/v6/core`;

        // 2. Carica script v6 (idempotente)
        const existing = document.getElementById('paypal-sdk-script') as HTMLScriptElement | null;
        if (!existing || existing.src !== src) {
          if (existing) existing.remove();
          const script   = document.createElement('script');
          script.id      = 'paypal-sdk-script';
          script.src     = src;
          script.async   = true;
          await new Promise<void>((resolve, reject) => {
            script.onload  = () => resolve();
            script.onerror = () => reject(new Error('script load failed'));
            document.head.appendChild(script);
          });
        }
        if (cancelled) return;

        // 3. createInstance
        const paypalGlobal = (window as any).paypal;
        if (!paypalGlobal?.createInstance) {
          setError(t.errPayPalLoad);
          return;
        }
        // v6 accetta clientId per i flussi one-time (paypal-payments).
        // Il clientToken JWT serve solo per componenti avanzati (Fastlane)
        // che non usiamo. Il flex vault save gira via REST, non via SDK.
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) {
          setError(t.errPayPalLoad);
          return;
        }
        const instance = await paypalGlobal.createInstance({
          clientId,
          components: ['paypal-payments'],
          pageType:   'checkout',
        });
        if (cancelled) return;
        sdkInstanceRef.current = instance;

        // 4. Session one-time solo per Non rimborsabile (charge 100% one-shot).
        //    Flex e Rimborsabile usano il vault flow (setup-token + redirect),
        //    quindi non serve la session del SDK.
        if (!isFlexOffer && !isPartialRefundable && typeof instance.createPayPalOneTimePaymentSession === 'function') {
          paypalSessionRef.current = instance.createPayPalOneTimePaymentSession({
            onApprove: async (data: { orderId: string }) => {
              setPhase('paying');
              const bookId = createdBookIdRef.current;
              if (!bookId) {
                setError(t.errPayPalBookingMissing);
                setPhase('ready');
                return;
              }
              try {
                // Questa session serve solo per Non rimborsabile → capture
                // 100% one-shot senza saveVault (no residuo).
                const res = await fetch('/api/paypal-capture', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderID:        data.orderId,
                    bookingId:      bookId,
                    amount:         amountToCharge,
                    accommodation:  offerPrice,
                    touristTax:     touristTax,
                    discountAmount: discountAmount,
                    voucherCode:    voucherCode || undefined,
                    extras:         (selectedExtras ?? []).map(e => ({
                      description: e.name.it,
                      price:       e.price,
                      quantity:    e.quantity,
                    })),
                  }),
                });
                const result = await res.json();
                if (!res.ok || !result.ok) throw new Error(result.error ?? t.errPayPalCapture);

                reset();
                const origin = window.location.origin;
                window.location.href = `${origin}/${locale}/prenota/successo?bookingId=${bookId}&paypal=1`;

              } catch (e: any) {
                setError(e.message ?? t.errGeneric);
                setPhase('ready');
              }
            },

            onCancel: () => {
              if (createdBookIdRef.current) {
                cancelBooking(createdBookIdRef.current);
                createdBookIdRef.current = null;
              }
            },

            onError: (err: any) => {
              console.error('[PayPal v6] onError:', err);
              if (createdBookIdRef.current) {
                cancelBooking(createdBookIdRef.current);
                createdBookIdRef.current = null;
              }
              setError(t.errPayPalGeneric);
              setPhase('ready');
            },
          });
        }

        setSdkReady(true);
      } catch (e: any) {
        console.error('[PayPal v6] init error:', e);
        if (!cancelled) setError(t.errPayPalLoad);
      }
    })();

    return () => { cancelled = true; };
  }, [paymentMethod, isFlexOffer, isPartialRefundable]);

  // ── Click bottone "Paga con PayPal" (solo Non rimborsabile) ──────────────
  // Capture 100% one-shot via SDK v6. Rimborsabile e Flex usano invece il
  // flow setup-token (handlePayPalVaultFlow) perché il vault_id async di
  // PayPal non è affidabile in sandbox.
  async function handlePayPalOneTime() {
    if (!paypalSessionRef.current) {
      setError(t.errPayPalGeneric);
      return;
    }
    setError(null);

    const createOrderPromise = (async () => {
      const bookId = await createBooking();
      if (!bookId) throw new Error(t.errPayPalOrder);
      createdBookIdRef.current = bookId;

      const res = await fetch('/api/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:      amountToCharge,
          bookingId:   bookId,
          description: `LivingApple · ${room?.name ?? ''} · ${checkIn} → ${checkOut}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.orderID) {
        cancelBooking(bookId);
        createdBookIdRef.current = null;
        throw new Error(data.error ?? t.errPayPalOrder);
      }
      // v6 session.start vuole { orderId: string } (oggetto, non stringa)
      return { orderId: data.orderID as string };
    })();

    try {
      await paypalSessionRef.current.start(
        { presentationMode: 'auto' },
        createOrderPromise,
      );
    } catch (e: any) {
      console.error('[PayPal v6] session.start failed:', e);
      if (createdBookIdRef.current) {
        cancelBooking(createdBookIdRef.current);
        createdBookIdRef.current = null;
      }
      setError(e?.message ?? t.errPayPalGeneric);
    }
  }

  // ── Click bottone "Salva PayPal" / "Paga 50%" via vault flow ─────────────
  // Funziona per Flex e Rimborsabile. Il path è identico (setup-token +
  // redirect + return page) ma la policy + gli amount cambiano:
  //   • flex              → chargeAt=-24h, upfront=0, residual=100%
  //   • rimborsabile-residuo → chargeAt=-48h, upfront=50%, residual=50%
  // La return page (/paypal-return) legge sessionStorage e chiama
  // l'endpoint giusto (confirm-vault per flex, confirm-vault-and-charge
  // per rimborsabile).
  async function handlePayPalVaultFlow(policy: 'flex' | 'rimborsabile-residuo') {
    setError(null);
    setVaultPhase('saving');

    try {
      const bookId = await createBooking();
      if (!bookId) { setVaultPhase('idle'); return; }
      createdBookIdRef.current = bookId;

      // Per flex, il cron deve addebitare quando scade la cancellazione gratuita
      // specifica dell'offerta (daysBeforeArrivalValue letto da Beds24).
      // Per rimborsabile-residuo il parametro è ignorato (48h fisse).
      const chargeAt = computeVaultChargeAt(
        checkIn,
        policy,
        offerConfig?.cancellationDaysBeforeArrival,
      );
      if (!chargeAt) {
        cancelBooking(bookId);
        throw new Error(t.errDataMissing);
      }

      // amount breakdown per la return page
      const upfrontAmount  = policy === 'rimborsabile-residuo' ? amountToCharge : 0;
      const residualAmount = policy === 'rimborsabile-residuo' ? residualAmountFromTotal : total;

      const origin    = window.location.origin;
      const returnUrl = `${origin}/${locale}/paypal-return?bookingId=${bookId}`;
      const cancelUrl = `${origin}/${locale}/prenota?cancelled=1&bookingId=${bookId}`;

      try {
        sessionStorage.setItem('paypal_vault_pending', JSON.stringify({
          bookingId:      bookId,
          policy,
          chargeAt,
          totalAmount:    total,
          upfrontAmount,
          residualAmount,
          accommodation:  offerPrice,
          touristTax,
          discountAmount,
          voucherCode:    voucherCode || null,
          extras: (selectedExtras ?? []).map(e => ({
            description: e.name.it,
            price:       e.price,
            quantity:    e.quantity,
          })),
        }));
      } catch { /* sessionStorage non disponibile */ }

      const res = await fetch('/api/paypal-setup-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:  bookId,
          amount:     total,
          returnUrl,
          cancelUrl,
          guestEmail: guestEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.setupTokenId || !data.approveUrl) {
        cancelBooking(bookId);
        createdBookIdRef.current = null;
        throw new Error(data.error ?? t.errPayPalVault);
      }

      try {
        sessionStorage.setItem('paypal_vault_setupToken', data.setupTokenId);
      } catch {}

      setVaultPhase('redirecting');
      window.location.href = data.approveUrl;

    } catch (e: any) {
      setError(e?.message ?? t.errPayPalVault);
      setVaultPhase('idle');
    }
  }

  // Wrapper per il bottone "Salva PayPal" sulla tariffa Flex
  const handlePayPalFlexVault = () => handlePayPalVaultFlow('flex');
  // Wrapper per il bottone "Paga 50%" sulla tariffa Rimborsabile
  const handlePayPalRimborsabile = () => handlePayPalVaultFlow('rimborsabile-residuo');

  // ── Torna indietro ────────────────────────────────────────────────────────
  // ✅ Cancella il booking solo se era già stato creato (es. Stripe fallito)
  function handleBack() {
    if (pendingBookId) {
      cancelBooking(pendingBookId);
    }
    prevStep();
  }

  // ── Paga con Stripe ───────────────────────────────────────────────────────
  // ✅ Crea booking PRIMA di creare la sessione Stripe
  async function handlePagaStripe() {
    setPhase('paying');
    let bookId: number | null = null;
    try {
      // Step 1: crea booking su Beds24
      bookId = await createBooking();
      if (!bookId) return; // createBooking ha già gestito l'errore

      // Step 2: crea sessione Stripe
      // amountToCharge è già stato calcolato in base al bookingType dell'offerta:
      // 100% per non rimborsabile, 50% per parzialmente rimborsabile, 0 per flex.
      const stripeRes = await fetch('/api/stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:   bookId,
          amount:      amountToCharge,  // quanto addebitare ora (0 per flex)
          total,                        // totale pieno (line_item quando capture=false)
          offerId:     selectedOfferId,
          bookingType: offerConfig?.bookingType ?? null,
          locale,
          description: `LivingApple · ${room?.name ?? ''} · ${checkIn} → ${checkOut}`,
        }),
      });
      const stripeData = await stripeRes.json();
      if (!stripeRes.ok || !stripeData.ok) throw new Error(stripeData.error ?? `HTTP ${stripeRes.status}`);

      // Salva in sessionStorage prima del redirect (per stripe-confirm al ritorno)
      try {
        sessionStorage.setItem('stripe_pending', JSON.stringify({
          bookingId:      bookId,
          capture:        stripeData.capture,
          accommodation:  offerPrice,
          touristTax:     touristTax,
          discountAmount: discountAmount,
          voucherCode:    voucherCode || null,
          extras:         (selectedExtras ?? []).map(e => ({
            description: e.name.it,
            price:       e.price,
            quantity:    e.quantity,
          })),
        }));
      } catch {
        // sessionStorage non disponibile (Safari privato) — continua comunque
      }

      // Redirect a Stripe — NON chiamare reset() qui
      // Se l'utente abbandona, Wizard.tsx intercetta ?cancelled=1 e cancella il booking
      window.location.href = stripeData.url;

    } catch (e: any) {
      // Se il booking era stato creato ma Stripe è fallito, cancellalo
      if (bookId) {
        cancelBooking(bookId);
      }
      setError(e.message ?? t.errGeneric);
      setPhase('ready');
    }
  }

  // ── Error screen (phase === 'error', dati mancanti / errore fatale) ──────
  if (phase === 'error') {
    return (
      <div className="wizard-step3__error-screen">
        <i className="bi bi-exclamation-triangle-fill wizard-step3__error-icon" aria-hidden="true"></i>
        <h2 className="wizard-step3__error-title">{t.errTitle}</h2>
        <p className="wizard-step3__error-msg">{error}</p>
        <button onClick={handleBack} className="wizard-step3__error-btn">
          {t.errBack}
        </button>
      </div>
    );
  }

  // ── Riepilogo + pagamento ─────────────────────────────────────────────────
  return (
    <div className="wizard-step3">

      <h2 className="section-title-main">{t.title}</h2>
      <p className="wizard-step3__subtitle">{t.subtitle}</p>

      {/* Card riepilogo principale: hero + dati soggiorno + prezzo + totale */}
      <div className="card-info">

        {/* Hero compatto: foto 80x80 + nome + meta */}
        <div className="wizard-step3__hero">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={room?.name ?? ''}
              className="wizard-step3__hero-img"
              loading="lazy"
            />
          ) : (
            <div className="wizard-step3__hero-placeholder" aria-hidden="true">
              <i className="bi bi-house-fill"></i>
            </div>
          )}
          <div className="wizard-step3__hero-info">
            <p className="wizard-step3__hero-name">{room?.name ?? '—'}</p>
            {room && (
              <p className="wizard-step3__hero-meta">
                {roomTypeLabel} · {room.sqm} {tSidebar.sqm} · {room.maxPeople} {tSidebar.people}
              </p>
            )}
          </div>
        </div>

        <hr className="divider-horizontal" />

        {/* Dati chiave soggiorno (Date, Ospiti, Tariffa) */}
        <dl className="wizard-step3__data-grid">
          {checkIn && checkOut && (
            <>
              <dt>{t.dates}</dt>
              <dd>
                {formatDate(checkIn, locale)} – {formatDate(checkOut, locale)}
                {nights > 0 && ` · ${nights} ${nights === 1 ? t.night : t.nights}`}
              </dd>
            </>
          )}
          <dt>{t.guests}</dt>
          <dd>
            {numAdult} {t.adults}
            {numChild > 0 ? `, ${numChild} ${t.children}` : ''}
          </dd>
          {offerName && (
            <>
              <dt>{t.rate}</dt>
              <dd>{offerName}</dd>
            </>
          )}
        </dl>

        <hr className="divider-horizontal" />

        {/* Dettaglio prezzo breakdown */}
        <p className="label-uppercase-muted">{t.priceDetail}</p>
        <div className="wizard-step3__price-rows">
          <div className="layout-row-between">
            <span>{nights} {nights === 1 ? t.night : t.nights} × {fmt(perNight)}{t.perNight}</span>
            <span>{fmt(offerPrice)}</span>
          </div>
          {hasDiscount && (
            <div className="layout-row-between wizard-step3__price-discount">
              <span>{t.discount}{voucherCode ? ` (${voucherCode})` : ''}</span>
              <span>− {fmt(discountAmount)}</span>
            </div>
          )}
          {(selectedExtras ?? []).map((extra: any) => (
            <div key={extra.id} className="layout-row-between">
              <span>
                {extra.name[loc] ?? extra.name.it}
                {(extra.quantity ?? 1) > 1 ? ` ×${extra.quantity}` : ''}
              </span>
              <span>+ {fmt(extra.price * (extra.quantity ?? 1))}</span>
            </div>
          ))}
          {touristTax > 0 && (
            <div className="layout-row-between">
              <span>{t.touristTax}</span>
              <span>{fmt(touristTax)}</span>
            </div>
          )}
        </div>
        {touristTax > 0 && (
          <p className="wizard-step3__price-note">{t.touristNote}</p>
        )}

        {/* Totale — audit §3.5: 22px/800, nessun box gigantismo */}
        <div className="wizard-step3__total-row">
          <span className="wizard-step3__total-label">{t.total}</span>
          <span className="wizard-step3__total-value">{fmt(total)}</span>
        </div>
        {isFlexOffer && (
          <p className="wizard-step3__total-note">{t.totalFlexNote}</p>
        )}
        {hasDiscount && (
          <p className="wizard-step3__savings">
            {t.savedMsg.replace('{amount}', fmt(discountAmount))}
          </p>
        )}
      </div>

      {/* Banner policy cancellazione — audit §3.4: no border-left giallo */}
      {cancelPolicy && (
        <div className="banner banner--warning banner--with-icon">
          <i className="bi bi-calendar-x" aria-hidden="true"></i>
          <div>
            <p className="banner__title">{t.cancelPolicy}</p>
            <p className="banner__text">{cancelPolicy}</p>
          </div>
        </div>
      )}

      {/* Card dati ospite compatta */}
      <div className="card-info">
        <p className="label-uppercase-muted">{t.guestData}</p>
        <p className="wizard-step3__guest-name">{guestFirstName} {guestLastName}</p>
        <p className="wizard-step3__guest-meta">{guestEmail}</p>
        {(guestPhone || guestCountry || guestArrivalTime) && (
          <p className="wizard-step3__guest-meta">
            {[
              guestPhone,
              guestCountry,
              guestArrivalTime ? `${t.arrival}: ${guestArrivalTime}` : null,
            ].filter(Boolean).join(' · ')}
          </p>
        )}
        {guestComments && (
          <div className="wizard-step3__guest-notes">
            <i className="bi bi-chat-left-text" aria-hidden="true"></i>
            <span>{guestComments}</span>
          </div>
        )}
      </div>

      {/* Errore inline (dopo tentativo di pagamento fallito) */}
      {error && phase === 'ready' && (
        <div className="banner banner--error banner--with-icon">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
          <div>
            <p className="banner__title">{t.errTitle}</p>
            <p className="banner__text">{error}</p>
          </div>
        </div>
      )}

      {/* Trust signal inline sopra CTA */}
      <div className="wizard-step3__trust">
        <i className="bi bi-shield-lock-fill" aria-hidden="true"></i>
        <span>{t.securePayment} · Stripe · PayPal</span>
      </div>

      {/* CTA — Stripe oppure wrapper PayPal */}
      {paymentMethod === 'stripe' ? (
        <>
          <button
            onClick={handlePagaStripe}
            disabled={phase === 'paying'}
            className="btn btn--primary wizard-step3__cta"
          >
            {phase === 'paying'
              ? t.paying
              : isFlexOffer
                ? t.payBtnFlex
                : `${t.payBtn} · ${fmt(amountToCharge > 0 ? amountToCharge : total)}`}
          </button>
          {isFlexOffer && phase !== 'paying' && (
            <p className="wizard-step3__cta-note">{t.payBtnFlexNote}</p>
          )}
        </>
      ) : (
        <div className="wizard-step3__paypal-wrapper">
          {!sdkReady && phase !== 'paying' && vaultPhase === 'idle' && (
            <div className="wizard-step3__paypal-loading">
              {t.paypalLoading}
            </div>
          )}

          {/* Flex: bottone "Salva PayPal" → setup-token → redirect */}
          {sdkReady && isFlexOffer && vaultPhase === 'idle' && phase !== 'paying' && (
            <>
              <button
                onClick={handlePayPalFlexVault}
                className="wizard-step3__paypal-v6-btn"
                type="button"
              >
                <i className="bi bi-paypal" aria-hidden="true"></i>
                <span>{(t as any).paypalVaultBtn ?? t.payBtnFlex}</span>
              </button>
              <p className="wizard-step3__vault-note">
                {(t as any).paypalVaultChargeNote ?? t.payBtnFlexNote}
              </p>
            </>
          )}

          {/* Rimborsabile: stesso flow del flex + charge upfront 50% al ritorno */}
          {sdkReady && !isFlexOffer && isPartialRefundable && vaultPhase === 'idle' && phase !== 'paying' && (
            <button
              onClick={handlePayPalRimborsabile}
              className="wizard-step3__paypal-v6-btn"
              type="button"
            >
              <i className="bi bi-paypal" aria-hidden="true"></i>
              <span>{t.payBtnPaypal} · {fmt(amountToCharge)}</span>
            </button>
          )}

          {/* Non rimborsabile: capture 100% one-shot via SDK v6 */}
          {sdkReady && !isFlexOffer && !isPartialRefundable && phase !== 'paying' && (
            <button
              onClick={handlePayPalOneTime}
              className="wizard-step3__paypal-v6-btn"
              type="button"
            >
              <i className="bi bi-paypal" aria-hidden="true"></i>
              <span>{t.payBtnPaypal} · {fmt(amountToCharge > 0 ? amountToCharge : total)}</span>
            </button>
          )}

          {/* Loading states */}
          {vaultPhase === 'saving' && (
            <div className="wizard-step3__vault-redirecting">
              <i className="bi bi-hourglass-split" aria-hidden="true"></i>
              <span>{(t as any).paypalVaultSaving ?? t.paying}</span>
            </div>
          )}
          {vaultPhase === 'redirecting' && (
            <div className="wizard-step3__vault-redirecting">
              <i className="bi bi-hourglass-split" aria-hidden="true"></i>
              <span>{(t as any).paypalVaultRedirect ?? t.paying}</span>
            </div>
          )}
          {phase === 'paying' && vaultPhase === 'idle' && (
            <div className="wizard-step3__paypal-loading">
              {t.payingPaypal}
            </div>
          )}
        </div>
      )}

      {/* Back link (subtle, in basso) */}
      <button
        onClick={handleBack}
        disabled={phase === 'paying'}
        className="wizard-step3__back-link"
      >
        {t.back}
      </button>

    </div>
  );
}
