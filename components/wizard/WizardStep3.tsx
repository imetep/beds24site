'use client';

/**
 * WizardStep3 — riepilogo finale + pagamento (Stripe o PayPal).
 * Redesign B (2026-04-19): single-col 680px, 1 card riepilogo compatta
 * con hero foto + dati soggiorno + prezzo breakdown + totale,
 * banner policy cancellazione, card dati ospite compatta, trust signal,
 * CTA full-width. Applica visual audit §3.1–§3.7.
 *
 * ⚠️ LOGICA PAGAMENTO PRESERVATA BYTE-IDENTICAL — non toccare:
 *   - Pre-caricamento SDK PayPal avviene in WizardStep2 quando si sceglie PayPal
 *   - `paymentMethod` NON va nelle deps dell'useEffect di render PayPal
 *   - `createBooking()` invocata dentro `createOrder` (mai al mount)
 *   - `createdBookIdRef` passa il bookId da createOrder a onApprove
 *   - `paypalButtonsRendered.current` guard contro double-render
 *   - Container `<div id="paypal-button-container">` sempre nel DOM
 *   - Status 'new' è settato server-side in /api/paypal-capture (mai toccare qui)
 *   - Stripe: booking creato con status 'request', Beds24 /channels/stripe setta
 *     confirmed automaticamente → reset a 'request' avviene server-side in
 *     /api/stripe-session. /api/stripe-confirm al ritorno setta 'new' + invoice items.
 */

import { useState, useEffect, useRef } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import { getTranslations } from '@/lib/i18n';
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
  } = useWizardStore();

  // ✅ Fase iniziale 'ready': Step3 è solo riepilogo, nessuna API al mount
  const [phase, setPhase]       = useState<'ready' | 'error' | 'paying'>('ready');
  const [error, setError]       = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // PayPal SDK state + refs (vedi vincoli PayPal in header)
  const [paypalReady, setPaypalReady]   = useState(false);
  const paypalContainerRef              = useRef<HTMLDivElement>(null);
  const paypalButtonsRendered           = useRef(false);
  // ✅ Ref per bookId creato durante il flusso PayPal
  const createdBookIdRef                = useRef<number | null>(null);

  const room   = getRoomData(selectedRoomId);
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;

  const roomOffers = cachedOffers?.find((ro: any) => ro.roomId === selectedRoomId);
  const offer = roomOffers?.offers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerPrice: number = offer?.price ?? 0;

  const childrenTaxable = (childrenAges ?? []).filter((a: number) => a >= 12).length;
  const taxableNights   = Math.min(nights, 10);
  const taxableAdults   = numAdult + childrenTaxable;
  const touristTax      = taxableNights * taxableAdults * 2;
  const perNight        = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;
  const offerName       = OFFER_NAMES[String(selectedOfferId ?? 0)] ?? offer?.offerName ?? '';
  const cancelPolicy    = CANCEL_POLICY[String(selectedOfferId ?? 0)] ?? '';

  const realPrice      = discountedPrice !== null ? discountedPrice : offerPrice;
  const hasDiscount    = discountedPrice !== null && discountedPrice < offerPrice;
  const discountAmount = hasDiscount ? offerPrice - discountedPrice! : 0;
  const extrasTotal    = (selectedExtras ?? []).reduce((sum: number, e: any) => sum + e.price * (e.quantity ?? 1), 0);
  const total          = realPrice + touristTax + extrasTotal;

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

  // ── Inizializza PayPal SDK ────────────────────────────────────────────────
  // Lo script è già stato pre-caricato da WizardStep2 quando l'utente ha
  // selezionato PayPal — qui aspettiamo solo che sia pronto.
  useEffect(() => {
    if (paymentMethod !== 'paypal') return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.error('[PayPal] NEXT_PUBLIC_PAYPAL_CLIENT_ID non configurato');
      return;
    }

    // Se lo script è già caricato e window.paypal è disponibile → subito ready
    if (document.getElementById('paypal-sdk-script') && (window as any).paypal) {
      setPaypalReady(true);
      return;
    }

    // Script già nel DOM ma non ancora eseguito → aspetta onload
    const existing = document.getElementById('paypal-sdk-script');
    if (existing) {
      existing.addEventListener('load', () => setPaypalReady(true));
      return;
    }

    // Fallback: carica lo script ora (caso in cui Step2 non l'ha caricato)
    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    script.onerror = () => setError(t.errPayPalLoad);
    document.head.appendChild(script);
  }, [paymentMethod]);

  // ── Renderizza i bottoni PayPal quando SDK è pronto ───────────────────────
  // ⚠️ Deps: [paypalReady, phase, total] — NON aggiungere paymentMethod!
  useEffect(() => {
    if (!paypalReady) return;
    if (phase !== 'ready') return;
    if (paypalButtonsRendered.current) return;
    if (!paypalContainerRef.current) return;

    const paypal = (window as any).paypal;
    if (!paypal) return;

    paypalButtonsRendered.current = true;

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color:  'blue',
        shape:  'rect',
        label:  'paypal',
        height: 50,
      },

      // ✅ Crea booking PRIMA di creare l'ordine PayPal
      createOrder: async () => {
        const bookId = await createBooking();
        if (!bookId) throw new Error(t.errPayPalOrder);

        // Salva il bookId nel ref per onApprove/onError/onCancel
        createdBookIdRef.current = bookId;

        // Poi crea l'ordine PayPal
        const res = await fetch('/api/paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount:      total,
            bookingId:   bookId,
            description: `LivingApple · ${room?.name ?? ''} · ${checkIn} → ${checkOut}`,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.orderID) {
          // Booking creato ma ordine PayPal fallito: cancella il booking
          cancelBooking(bookId);
          createdBookIdRef.current = null;
          throw new Error(data.error ?? t.errPayPalOrder);
        }
        return data.orderID;
      },

      // Utente ha approvato il pagamento su PayPal
      onApprove: async (data: { orderID: string }) => {
        setPhase('paying');
        const bookId = createdBookIdRef.current;
        if (!bookId) {
          setError(t.errPayPalBookingMissing);
          setPhase('ready');
          paypalButtonsRendered.current = false;
          return;
        }
        try {
          const res = await fetch('/api/paypal-capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderID:        data.orderID,
              bookingId:      bookId,
              amount:         total,
              accommodation:  offerPrice,
              touristTax:     touristTax,
              discountAmount: discountAmount,
              voucherCode:    voucherCode || undefined,
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
          paypalButtonsRendered.current = false;
        }
      },

      // Errore PayPal (rete, timeout, ecc.)
      onError: (err: any) => {
        console.error('[PayPal] onError:', err);
        // Se il booking era stato creato, cancellalo
        if (createdBookIdRef.current) {
          cancelBooking(createdBookIdRef.current);
          createdBookIdRef.current = null;
        }
        setError(t.errPayPalGeneric);
        setPhase('ready');
        paypalButtonsRendered.current = false;
      },

      // Utente ha chiuso il popup PayPal senza pagare
      onCancel: () => {
        if (createdBookIdRef.current) {
          cancelBooking(createdBookIdRef.current);
          createdBookIdRef.current = null;
        }
        paypalButtonsRendered.current = false;
      },

    }).render(paypalContainerRef.current);

  }, [paypalReady, phase, total]);

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
      const stripeRes = await fetch('/api/stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:   bookId,
          amount:      total,
          offerId:     selectedOfferId,
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
        <button
          onClick={handlePagaStripe}
          disabled={phase === 'paying'}
          className="btn btn--primary wizard-step3__cta"
        >
          {phase === 'paying'
            ? t.paying
            : `${t.payBtn} · ${fmt(total)}`}
        </button>
      ) : (
        <div className="wizard-step3__paypal-wrapper">
          {!paypalReady && (
            <div className="wizard-step3__paypal-loading">
              {t.paypalLoading}
            </div>
          )}
          {/* IMPORTANTE: il container PayPal deve rimanere nel DOM quando
              l'useEffect di render SDK viene eseguito. È sempre renderizzato
              quando paymentMethod === 'paypal', solo nascosto via d-none
              quando non ready o in paying. NON unmountarlo condizionalmente. */}
          <div
            ref={paypalContainerRef}
            id="paypal-button-container"
            className={paypalReady && phase !== 'paying' ? '' : 'd-none'}
          />
          {phase === 'paying' && (
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
