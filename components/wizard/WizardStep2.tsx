'use client';

/**
 * WizardStep2 — checkout unificato (assorbe l'ex WizardStep3).
 * Pattern Airbnb /book: 3 card nella colonna form + BookingSidebar a destra.
 *   1. Metodo di pagamento (collapsed → apre PaymentMethodModal)
 *   2. Dati ospite (Nome, Cognome, Email, Telefono, Ora arrivo, Richieste)
 *   3. Servizi opzionali (upsell stepper)
 * CTA finale "Conferma prenotazione" → handlePagaStripe / handlePayPalOneTime /
 * handlePayPalFlexVault, secondo paymentMethod e isFlexOffer.
 *
 * ⚠️ LOGICA PAGAMENTO — vincoli da preservare:
 *   - Pre-caricamento SDK v6 core: triggerato dal callback onConfirm di
 *     PaymentMethodModal quando l'utente sceglie 'paypal' (lazy-load).
 *   - createBooking() invocata DENTRO il click del CTA finale (mai al mount).
 *   - Status 'new' settato server-side in /api/paypal-capture o
 *     /api/paypal-confirm-vault — non toccare.
 *   - Stripe: createBooking → /api/stripe-session → redirect Stripe Checkout.
 *   - PayPal Flex (Vault): setup-token + redirect approveUrl → /paypal-return.
 *   - PayPal Non Rimborsabile: capture 100% via SDK v6 + session.start()
 *     (TODO: opzione B "redirect classico" richiede /api/paypal-order che
 *      ritorni anche approveUrl — fuori scope di questa sessione).
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import type { SelectedExtra } from '@/store/wizard-store';
import { PROPERTIES, getPropertyForRoom, calculateTouristTax } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import {
  findOffer, findPropertyByRoom, isFlexBookingType,
  computeDepositAmount, computeVaultChargeAt,
} from '@/lib/offer-deposit';
import type { Locale } from '@/config/i18n';
import BookingSidebar from './BookingSidebar';
import PaymentMethodModal from './PaymentMethodModal';

const SUPPORTED_LOCALES = ['it', 'en', 'de', 'pl'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

// ─── Componente principale ────────────────────────────────────────────────────
interface Props { locale?: string; }

export default function WizardStep2({ locale = 'it' }: Props) {
  const loc = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'it';
  const tr           = getTranslations(loc as Locale);
  const t            = tr.components.wizardStep2 as any;
  const tStep3       = tr.components.wizardStep3 as any;
  const tSidebar     = tr.components.wizardSidebar;
  const router       = useRouter();
  const searchParams = useSearchParams();
  const fromRoom     = searchParams.get('from') === 'room';

  const {
    numAdult, childrenAges,
    checkIn, checkOut,
    selectedRoomId, selectedOfferId,
    cachedOffers,
    selectedExtras, setExtraQuantity,
    paymentMethod, setPaymentMethod,
    voucherCode, setVoucherCode,
    guestFirstName, guestLastName, guestEmail,
    guestPhone, guestCountry, guestArrivalTime, guestComments,
    pendingBookId,
    setPendingBooking, setGuestField, setCurrentStep, prevStep,
    discountedPrice, setDiscountedPrice, propertyConfig, reset,
  } = useWizardStore();

  // ── State ────────────────────────────────────────────────────────────────
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [upsellItems, setUpsellItems]           = useState<SelectedExtra[]>([]);
  const [voucherInput, setVoucherInput]         = useState(voucherCode);
  const [voucherError, setVoucherError]         = useState<string | null>(null);
  const [voucherApplied, setVoucherApplied]     = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [phase, setPhase]                       = useState<'ready' | 'paying'>('ready');
  const [vaultPhase, setVaultPhase]             = useState<'idle' | 'saving' | 'redirecting'>('idle');

  // PayPal SDK v6 refs
  const sdkInstanceRef   = useRef<any>(null);
  const paypalSessionRef = useRef<any>(null);
  const createdBookIdRef = useRef<number | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  // ── Dati calcolati ─────────────────────────────────────────────────────────
  const room   = getRoomData(selectedRoomId);
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;

  const roomOffers = cachedOffers?.find((ro: any) => ro.roomId === selectedRoomId);
  const offer = roomOffers?.offers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerPrice: number = offer?.price ?? 0;
  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price * e.quantity, 0);
  const realPrice = discountedPrice !== null ? discountedPrice : offerPrice;
  const hasDiscount = discountedPrice !== null && discountedPrice < offerPrice;
  const discountAmount = hasDiscount ? offerPrice - discountedPrice! : 0;
  const total = realPrice + touristTax + extrasTotal;

  const offerConfig = findOffer(propertyConfig, selectedRoomId, selectedOfferId);
  const propertyCfg = findPropertyByRoom(propertyConfig, selectedRoomId);
  const isFlexOffer = isFlexBookingType(offerConfig?.bookingType);
  const amountToCharge = computeDepositAmount(total, offerConfig, propertyCfg);

  // Validazione form
  const formValid = !!(
    paymentMethod &&
    guestFirstName.trim() &&
    guestLastName.trim() &&
    guestEmail.trim() &&
    guestEmail.includes('@')
  );

  function handleBack() {
    if (pendingBookId) {
      cancelBooking(pendingBookId);
    }
    if (fromRoom && room?.slug) {
      router.push(`/${locale}/residenze/${room.slug}?from=wizard`);
    } else {
      prevStep();
    }
  }

  // ── Carica upsell items da API ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedRoomId) return;
    const prop = getPropertyForRoom(selectedRoomId);
    if (!prop) return;

    fetch(`/api/upsells?propertyId=${prop.propertyId}`)
      .then(r => r.json())
      .then(data => {
        const items: SelectedExtra[] = (data.data ?? []).map((item: any) => ({
          id:    item.id,
          name:  item.name,
          price: item.price,
        }));
        setUpsellItems(items);
      })
      .catch(() => {});
  }, [selectedRoomId]);

  // ── PayPal SDK v6: inizializzazione completa al click radio "PayPal" ─────
  // Triggerato quando paymentMethod === 'paypal' (settato dal modale onConfirm).
  // Per offerte non-flex crea anche la session one-time per capture 100%.
  useEffect(() => {
    if (paymentMethod !== 'paypal') {
      setSdkReady(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const tkRes  = await fetch('/api/paypal-client-token', { method: 'POST' });
        const tkData = await tkRes.json();
        if (cancelled) return;
        if (!tkRes.ok || !tkData.clientToken) {
          setError(tStep3.errPayPalLoad);
          return;
        }
        const mode = tkData.mode === 'sandbox' ? 'sandbox' : 'live';
        const host = mode === 'sandbox' ? 'www.sandbox.paypal.com' : 'www.paypal.com';
        const src  = `https://${host}/web-sdk/v6/core`;

        // Carica script v6 (idempotente)
        const existing = document.getElementById('paypal-sdk-script') as HTMLScriptElement | null;
        if (!existing || existing.src !== src) {
          if (existing) existing.remove();
          const script = document.createElement('script');
          script.id    = 'paypal-sdk-script';
          script.src   = src;
          script.async = true;
          await new Promise<void>((resolve, reject) => {
            script.onload  = () => resolve();
            script.onerror = () => reject(new Error('script load failed'));
            document.head.appendChild(script);
          });
        }
        if (cancelled) return;

        const paypalGlobal = (window as any).paypal;
        if (!paypalGlobal?.createInstance) {
          setError(tStep3.errPayPalLoad);
          return;
        }
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) {
          setError(tStep3.errPayPalLoad);
          return;
        }
        const instance = await paypalGlobal.createInstance({
          clientId,
          components: ['paypal-payments'],
          pageType:   'checkout',
        });
        if (cancelled) return;
        sdkInstanceRef.current = instance;

        // Session one-time per offerte non-flex (capture 100% o 50% upfront)
        if (!isFlexOffer && typeof instance.createPayPalOneTimePaymentSession === 'function') {
          paypalSessionRef.current = instance.createPayPalOneTimePaymentSession({
            onApprove: async (data: { orderId: string }) => {
              setPhase('paying');
              const bookId = createdBookIdRef.current;
              if (!bookId) {
                setError(tStep3.errPayPalBookingMissing);
                setPhase('ready');
                return;
              }
              try {
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
                if (!res.ok || !result.ok) throw new Error(result.error ?? tStep3.errPayPalCapture);

                reset();
                const origin = window.location.origin;
                window.location.href = `${origin}/${locale}/prenota/successo?bookingId=${bookId}&paypal=1`;
              } catch (e: any) {
                setError(e.message ?? tStep3.errGeneric);
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
              setError(tStep3.errPayPalGeneric);
              setPhase('ready');
            },
          });
        }

        setSdkReady(true);
      } catch (e: any) {
        console.error('[PayPal v6] init error:', e);
        if (!cancelled) setError(tStep3.errPayPalLoad);
      }
    })();

    return () => { cancelled = true; };
  }, [paymentMethod, isFlexOffer]);

  // ── Applica voucher ─────────────────────────────────────────────────────
  async function handleApplyVoucher() {
    const code = voucherInput.trim();
    if (!code) return;
    setVoucherError(null);
    setVoucherApplied(false);
    setDiscountedPrice(null);
    try {
      const res = await fetch(`/api/voucher-check?code=${encodeURIComponent(code)}&price=${offerPrice}`);
      const data = await res.json();
      if (data.valid) {
        setVoucherCode(code);
        setDiscountedPrice(data.discountedPrice);
        setVoucherApplied(true);
      } else {
        setVoucherError(t.voucherErrorInvalid);
        setVoucherCode('');
      }
    } catch {
      setVoucherError(t.voucherErrorFetch);
    }
  }

  // ── Crea booking su Beds24 ───────────────────────────────────────────────
  async function createBooking(): Promise<number | null> {
    if (!selectedRoomId || !checkIn || !checkOut) {
      setError(tStep3.errDataMissing);
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
      setError(e.message ?? tStep3.errGeneric);
      return null;
    }
  }

  function cancelBooking(bookId: number) {
    fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: bookId }),
    }).catch(() => {});
    setPendingBooking(null, null);
  }

  // ── Stripe handler ───────────────────────────────────────────────────────
  async function handlePagaStripe() {
    setPhase('paying');
    setError(null);
    let bookId: number | null = null;
    try {
      bookId = await createBooking();
      if (!bookId) { setPhase('ready'); return; }

      const stripeRes = await fetch('/api/stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:   bookId,
          amount:      amountToCharge,
          total,
          offerId:     selectedOfferId,
          bookingType: offerConfig?.bookingType ?? null,
          locale,
          description: `LivingApple · ${room?.name ?? ''} · ${checkIn} → ${checkOut}`,
        }),
      });
      const stripeData = await stripeRes.json();
      if (!stripeRes.ok || !stripeData.ok) throw new Error(stripeData.error ?? `HTTP ${stripeRes.status}`);

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
      } catch {}

      window.location.href = stripeData.url;
    } catch (e: any) {
      if (bookId) cancelBooking(bookId);
      setError(e.message ?? tStep3.errGeneric);
      setPhase('ready');
    }
  }

  // ── PayPal Non Rimborsabile / Rimborsabile (capture one-shot via SDK v6) ──
  async function handlePayPalOneTime() {
    if (!paypalSessionRef.current) {
      setError(tStep3.errPayPalGeneric);
      return;
    }
    setError(null);

    const createOrderPromise = (async () => {
      const bookId = await createBooking();
      if (!bookId) throw new Error(tStep3.errPayPalOrder);
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
        throw new Error(data.error ?? tStep3.errPayPalOrder);
      }
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
      setError(e?.message ?? tStep3.errPayPalGeneric);
    }
  }

  // ── PayPal Flex Vault (setup-token + redirect) ───────────────────────────
  async function handlePayPalFlexVault() {
    setError(null);
    setVaultPhase('saving');

    try {
      const bookId = await createBooking();
      if (!bookId) { setVaultPhase('idle'); return; }
      createdBookIdRef.current = bookId;

      const chargeAt = computeVaultChargeAt(
        checkIn,
        offerConfig?.cancellationDaysBeforeArrival,
      );
      if (!chargeAt) {
        cancelBooking(bookId);
        throw new Error(tStep3.errDataMissing);
      }

      const origin    = window.location.origin;
      const returnUrl = `${origin}/${locale}/paypal-return?bookingId=${bookId}`;
      const cancelUrl = `${origin}/${locale}/prenota?cancelled=1&bookingId=${bookId}`;

      try {
        sessionStorage.setItem('paypal_vault_pending', JSON.stringify({
          bookingId:      bookId,
          policy:         'flex',
          chargeAt,
          totalAmount:    total,
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
      } catch {}

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
        throw new Error(data.error ?? tStep3.errPayPalVault);
      }

      try { sessionStorage.setItem('paypal_vault_setupToken', data.setupTokenId); } catch {}

      setVaultPhase('redirecting');
      window.location.href = data.approveUrl;
    } catch (e: any) {
      setError(e?.message ?? tStep3.errPayPalVault);
      setVaultPhase('idle');
    }
  }

  // ── Click CTA "Conferma prenotazione" ────────────────────────────────────
  function handleConfirm() {
    if (!formValid || phase === 'paying') return;
    if (paymentMethod === 'stripe') {
      handlePagaStripe();
      return;
    }
    if (paymentMethod === 'paypal') {
      if (isFlexOffer) {
        handlePayPalFlexVault();
      } else {
        handlePayPalOneTime();
      }
      return;
    }
  }

  // ── Modale "Modifica metodo": apertura/chiusura + lazy-load PayPal ───────
  function openPaymentModal() { setShowPaymentModal(true); }
  function closePaymentModal() { setShowPaymentModal(false); }
  function onPaymentConfirm(_method: any) {
    // Nessun lazy-load esplicito qui: il useEffect su paymentMethod si attiva
    // automaticamente al cambio di store e fa init SDK + crea session.
  }

  // ── Riepilogo metodo pagamento (Card 1) ──────────────────────────────────
  function paymentSummary(): { icon: string; label: string; isEmpty: boolean } {
    if (paymentMethod === 'stripe') {
      return { icon: 'bi-credit-card-2-front-fill', label: tr.components.paymentModal.methods.stripe.label, isEmpty: false };
    }
    if (paymentMethod === 'paypal') {
      return { icon: 'bi-paypal', label: tr.components.paymentModal.methods.paypal.label, isEmpty: false };
    }
    return { icon: 'bi-credit-card', label: t.cardPagamentoEmpty, isEmpty: true };
  }
  const ps = paymentSummary();

  // CTA label dinamica
  const ctaLabel = (() => {
    if (phase === 'paying') return tStep3.paying;
    if (vaultPhase === 'saving') return tStep3.paypalVaultSaving ?? tStep3.paying;
    if (vaultPhase === 'redirecting') return tStep3.paypalVaultRedirect ?? tStep3.paying;
    if (paymentMethod === 'paypal' && !sdkReady && !isFlexOffer) return tStep3.paypalLoading;
    if (isFlexOffer) return t.ctaConfirm;
    const amt = amountToCharge > 0 ? amountToCharge : total;
    return `${t.ctaConfirmAndPay} · ${fmt(amt)}`;
  })();

  // CTA disabled
  const ctaDisabled = !formValid
    || phase === 'paying'
    || vaultPhase !== 'idle'
    || (paymentMethod === 'paypal' && !isFlexOffer && !sdkReady);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="wizard-step2">
      <h2 className="section-title-main">{t.title}</h2>

      <div className="wizard-step2__layout">

        {/* ── Colonna sinistra: form ── */}
        <div className="wizard-step2__main">

          {/* CARD 1 — Metodo di pagamento */}
          <div className="step2-section-card">
            <div className="step2-section-header">
              <div className="step2-section-number">1</div>
              <p className="step2-section-title">{t.cardPagamentoTitle}</p>
            </div>

            <div className="step2-pagamento-row">
              <i
                className={`bi ${ps.icon} step2-pagamento-icon${ps.isEmpty ? ' is-empty' : ''}`}
                aria-hidden="true"
              />
              <div className="step2-pagamento-content">
                <p className={`step2-pagamento-label${ps.isEmpty ? ' is-empty' : ''}`}>
                  {ps.label}
                </p>
              </div>
              <button
                type="button"
                onClick={openPaymentModal}
                className="step2-pagamento-edit-btn"
              >
                {t.edit}
              </button>
            </div>

            {/* Logo strip metodi accettati */}
            <div className="step2-pagamento-logos" aria-hidden="true">
              <i className="bi bi-credit-card-2-front-fill" title="Visa" />
              <i className="bi bi-credit-card-2-back-fill" title="Mastercard" />
              <i className="bi bi-credit-card" title="Amex" />
              <i className="bi bi-paypal" title="PayPal" />
              <i className="bi bi-shield-lock-fill" title="Stripe" />
            </div>
          </div>

          {/* CARD 2 — Dati ospite */}
          <div className="step2-section-card">
            <div className="step2-section-header">
              <div className="step2-section-number">2</div>
              <p className="step2-section-title">{t.cardOspiteTitle}</p>
            </div>
            <p className="step2-section-sub">{t.cardOspiteSub}</p>

            <div className="step2-form-grid-2">
              <Field label={t.firstName} value={guestFirstName} onChange={v => setGuestField('guestFirstName', v)} autoComplete="given-name" />
              <Field label={t.lastName}  value={guestLastName}  onChange={v => setGuestField('guestLastName', v)}  autoComplete="family-name" />
            </div>
            <Field label={t.email} value={guestEmail} onChange={v => setGuestField('guestEmail', v)} type="email" autoComplete="email" />
            <div className="step2-form-grid-2">
              <Field label={t.phone}   value={guestPhone}   onChange={v => setGuestField('guestPhone', v)}   type="tel" autoComplete="tel" />
              <Field label={t.country} value={guestCountry} onChange={v => setGuestField('guestCountry', v)} autoComplete="country-name" />
            </div>
            <Field label={t.arrivalTime} value={guestArrivalTime} onChange={v => setGuestField('guestArrivalTime', v)} type="time" />
            <div className="ui-field-wrapper">
              <label className="ui-field-label">{t.comments}</label>
              <textarea
                value={guestComments}
                onChange={e => setGuestField('guestComments', e.target.value)}
                className="ui-field-input ui-field-textarea"
              />
            </div>
          </div>

          {/* CARD 3 — Servizi opzionali (solo se l'API ha restituito upsell) */}
          {upsellItems.length > 0 && (
            <div className="step2-section-card">
              <div className="step2-section-header">
                <div className="step2-section-number">3</div>
                <p className="step2-section-title">{t.cardUpsellTitle}</p>
              </div>

              <div className="extras-catalog">
                {upsellItems.map(item => {
                  const sel = selectedExtras.find(e => e.id === item.id);
                  const qty = sel?.quantity ?? 0;
                  const MAX_QTY = 4;
                  return (
                    <div key={item.id} className={`extras-catalog__item${qty > 0 ? ' is-selected' : ''}`}>
                      <span className="extras-catalog__item-icon" aria-hidden="true">
                        <i className="bi bi-bag-plus-fill" />
                      </span>
                      <div className="extras-catalog__item-info">
                        <p className="extras-catalog__item-name">
                          {item.name[loc] ?? item.name.it}
                        </p>
                        <p className="extras-catalog__item-price">
                          +{fmt(item.price)} {t.perUnit}
                        </p>
                      </div>
                      <div className="extras-catalog__stepper">
                        <button
                          onClick={() => setExtraQuantity(item, qty - 1)}
                          disabled={qty === 0}
                          className={`extras-stepper-btn extras-stepper-btn--minus${qty > 0 ? ' is-active' : ''}`}
                        >−</button>
                        <span className={`extras-catalog__stepper-qty${qty > 0 ? ' is-active' : ''}`}>
                          {qty}
                        </span>
                        <button
                          onClick={() => setExtraQuantity(item, qty + 1)}
                          disabled={qty >= MAX_QTY}
                          className={`extras-stepper-btn extras-stepper-btn--plus${qty < MAX_QTY ? ' is-active' : ''}`}
                        >+</button>
                      </div>
                      <span
                        className={`extras-catalog__item-total${qty === 0 ? ' is-hidden' : ''}`}
                        aria-hidden={qty === 0}
                      >
                        {fmt(item.price * Math.max(qty, 1))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Errore inline */}
          {error && (
            <div className="banner banner--error banner--with-icon">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
              <div>
                <p className="banner__title">{t.errTitle}</p>
                <p className="banner__text">{error}</p>
              </div>
            </div>
          )}

          {/* Disclaimer terms+privacy sopra CTA */}
          <p className="step2-terms">
            {t.terms}{' '}
            <a href={`/${locale}/condizioni`} target="_blank" rel="noopener noreferrer">{t.termsLink}</a>{' '}
            {t.termsAnd}{' '}
            <a href={`/${locale}/privacy`} target="_blank" rel="noopener noreferrer">{t.privacyLink}</a>.
          </p>

          {/* CTA finale */}
          <button
            onClick={handleConfirm}
            disabled={ctaDisabled}
            className="btn btn--primary step2-cta"
          >
            {ctaLabel}
          </button>

          {isFlexOffer && phase !== 'paying' && (
            <p className="wizard-step3__cta-note">{tStep3.payBtnFlexNote}</p>
          )}

          <button onClick={handleBack} disabled={phase === 'paying'} className="step2-back-link">
            {t.back}
          </button>
        </div>

        {/* ── Sidebar destra (desktop) — voucher slot, niente extras (passati a Card 3) ── */}
        <div className="wizard-step2__sidebar">
          <BookingSidebar
            locale={locale}
            step={2}
            onEditDates={() => setCurrentStep(2)}
            onEditGuests={() => setCurrentStep(1)}
            step2VoucherSlot={
              <>
                <p className="label-uppercase-muted">{t.voucher}</p>
                <div className="voucher-block__row">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={e => {
                      setVoucherInput(e.target.value);
                      if (voucherApplied) { setVoucherApplied(false); setDiscountedPrice(null); setVoucherCode(''); }
                    }}
                    placeholder={(tSidebar as any).voucherPlaceholder}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className={`voucher-block__input${voucherApplied ? ' is-applied' : ''}`}
                  />
                  <button
                    onClick={handleApplyVoucher}
                    disabled={!voucherInput.trim()}
                    className={`voucher-block__apply-btn${voucherApplied ? ' is-applied' : ''}`}
                  >
                    {voucherApplied ? (
                      <>
                        <i className="bi bi-check-lg me-1" aria-hidden="true" />
                        {(tSidebar as any).voucherApplied}
                      </>
                    ) : t.voucherApply}
                  </button>
                </div>
                {voucherError && <p className="voucher-block__error">{voucherError}</p>}
              </>
            }
          />
        </div>
      </div>

      {/* Modale metodo pagamento */}
      {showPaymentModal && (
        <PaymentMethodModal
          locale={locale}
          onClose={closePaymentModal}
          onConfirm={onPaymentConfirm}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', autoComplete }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; autoComplete?: string;
}) {
  return (
    <div className="ui-field-wrapper">
      <label className="ui-field-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="ui-field-input"
      />
    </div>
  );
}
