'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import type { SelectedExtra } from '@/store/wizard-store';
import { PROPERTIES, getPropertyForRoom, calculateTouristTax, formatTouristTaxNote } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import { findOffer, findPropertyByRoom, isFlexBookingType, computeDepositAmount } from '@/lib/offer-deposit';
import type { Locale } from '@/config/i18n';
import BookingSidebar from './BookingSidebar';

// ─── Testi fissi 4 lingue ─────────────────────────────────────────────────────
const ENERGY_BOX: Record<string, string> = {
  it: "I consumi energetici vengono conteggiati in base all'utilizzo reale, tramite contatori presenti in ogni abitazione. Non si tratta di un costo aggiuntivo per guadagno, ma di una misura per evitare sprechi.",
  en: 'Energy consumption is calculated based on actual usage, measured through meters installed in each accommodation. This is not an additional charge for profit, but a measure to prevent energy waste.',
  de: 'Der Energieverbrauch wird auf Grundlage des tatsächlichen Verbrauchs berechnet und über in jeder Unterkunft installierte Zähler erfasst. Dabei handelt es sich nicht um eine zusätzliche Gebühr zur Gewinnerzielung, sondern um eine Maßnahme zur Vermeidung von Energieverschwendung.',
  pl: 'Zużycie energii jest rozliczane na podstawie rzeczywistego wykorzystania, mierzonego przez liczniki zainstalowane w każdym obiekcie. Nie jest to dodatkowa opłata w celu osiągnięcia zysku, lecz środek mający na celu zapobieganie marnotrawstwu energii.',
};
const DEPOSIT_BOX: Record<string, (n: number) => string> = {
  it: (n) => `Questo alloggio richiede un deposito cauzionale di €${n}. Sarà necessaria una Carta di Credito (no Debit Card) al momento del check-in.`,
  en: (n) => `This accommodation requires a security deposit of €${n}. Payment will be collected separately by the host before arrival or at check-in.`,
  de: (n) => `Diese Unterkunft erfordert eine Kaution von €${n}. Die Zahlung wird separat vom Gastgeber vor der Ankunft oder beim Check-in erhoben.`,
  pl: (n) => `To zakwaterowanie wymaga kaucji w wysokości €${n}. Płatność zostanie pobrana oddzielnie przez gospodarza przed przyjazdem lub przy zameldowaniu.`,
};

const CANCEL_POLICY: Record<number, Record<string,string>> = {
  1: { it:'Pagamento non rimborsabile entro 48h dalla prenotazione.',          en:'Non-refundable payment within 48h of booking.',           de:'Nicht erstattungsfähige Zahlung innerhalb 48h.',          pl:'Bezzwrotna płatność w ciągu 48h od rezerwacji.' },
  2: { it:'50% subito, saldo all\'arrivo. Cancellazione parzialmente rimborsabile.', en:'50% now, balance at arrival. Partially refundable.',  de:'50% jetzt, Rest bei Ankunft. Teilweise erstattungsfähig.', pl:'50% teraz, reszta przy przyjeździe. Częściowo zwrotna.' },
  3: { it:'Cancellazione gratuita fino a 60 giorni prima dell\'arrivo.',       en:'Free cancellation up to 60 days before arrival.',         de:'Kostenlose Stornierung bis 60 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 60 dni przed przyjazdem.' },
  4: { it:'Cancellazione gratuita fino a 45 giorni prima dell\'arrivo.',       en:'Free cancellation up to 45 days before arrival.',         de:'Kostenlose Stornierung bis 45 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 45 dni przed przyjazdem.' },
  5: { it:'Cancellazione gratuita fino a 30 giorni prima dell\'arrivo.',       en:'Free cancellation up to 30 days before arrival.',         de:'Kostenlose Stornierung bis 30 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 30 dni przed prijazdem.' },
  6: { it:'Cancellazione gratuita fino a 5 giorni prima dell\'arrivo.',        en:'Free cancellation up to 5 days before arrival.',          de:'Kostenlose Stornierung bis 5 Tage vor Ankunft.',          pl:'Bezpłatne anulowanie do 5 dni przed prijazdem.' },
};

const SUPPORTED_LOCALES = ['it', 'en', 'de', 'pl'] as const;
const PAY_INSTALL_NOTE: Record<string, (n: number) => string> = {
  it: (n) => `3 rate da €${n} · senza interessi · tramite PayPal`,
  en: (n) => `3 payments of €${n} · no interest · via PayPal`,
  de: (n) => `3 Raten à €${n} · zinsfrei · über PayPal`,
  pl: (n) => `3 raty po €${n} · bez odsetek · przez PayPal`,
};

// ─── Mock upsell items ────────────────────────────────────────────────────────
// TODO: sostituire con chiamata API Beds24 quando gli upsell saranno configurati
// Upsell items caricati dinamicamente da /api/upsells — vedi useEffect sotto.

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
function formatDate(ymd: string, locale: string) {
  return new Date(ymd + 'T00:00:00').toLocaleDateString(
    locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
}
function parseDeposit(str?: string): number | null {
  const m = str?.match(/CUSTOMSTAYFEE\s+(\d+)\s+SECURITYDEPOSIT/);
  return m ? Number(m[1]) : null;
}

// ─── Componente principale ────────────────────────────────────────────────────
interface Props { locale?: string; }

export default function WizardStep2({ locale = 'it' }: Props) {
  const loc = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'it';
  const t         = getTranslations(loc as Locale).components.wizardStep2;
  const tSidebar  = getTranslations(loc as Locale).components.wizardSidebar;
  const OFFER_NAMES = getTranslations(loc as Locale).shared.offerNames as Record<string, string>;
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRoom = searchParams.get('from') === 'room';

  const {
    numAdult, numChild, childrenAges,
    checkIn, checkOut,
    selectedRoomId, selectedOfferId,
    cachedOffers,
    selectedExtras, setExtraQuantity,
    paymentMethod, setPaymentMethod,
    voucherCode, setVoucherCode,
    guestFirstName, guestLastName, guestEmail,
    guestPhone, guestCountry, guestArrivalTime, guestComments,
    setGuestField, setCurrentStep, prevStep, nextStep,
    discountedPrice, setDiscountedPrice,
    propertyConfig,
  } = useWizardStore();

  const [error, setError]                     = useState<string | null>(null);
  const [upsellItems, setUpsellItems]          = useState<SelectedExtra[]>([]);
  const [voucherInput, setVoucherInput]        = useState(voucherCode);
  const [summaryOpen, setSummaryOpen]          = useState(true);
  const [voucherError, setVoucherError]        = useState<string | null>(null);
  const [voucherApplied, setVoucherApplied]    = useState(false);
  const [coverUrl, setCoverUrl]                = useState<string | null>(null);

  // ── Dati calcolati ─────────────────────────────────────────────────────────
  const room = getRoomData(selectedRoomId);

  function handleBack() {
    if (fromRoom && room?.slug) {
      router.push(`/${locale}/residenze/${room.slug}?from=wizard`);
    } else {
      prevStep();
    }
  }
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;

  const roomOffers = cachedOffers?.find((ro: any) => ro.roomId === selectedRoomId);
  const offer = roomOffers?.offers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerPrice: number = offer?.price ?? 0;
  const offerName = OFFER_NAMES[String(selectedOfferId ?? 0)] ?? offer?.offerName ?? '';
  const cancelPolicy = CANCEL_POLICY[selectedOfferId ?? 0]?.[loc] ?? '';
  const depositFromOffer = parseDeposit(offer?.offerDescription ?? offer?.description ?? '');
  const depositAmount = depositFromOffer ?? room?.securityDeposit ?? null;
  const perNight = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;

  const touristTax = calculateTouristTax(numAdult, childrenAges, nights);
  const basePrice  = discountedPrice !== null ? discountedPrice : offerPrice;

  // ── Totale extras selezionati ──────────────────────────────────────────────
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price * e.quantity, 0);

  const total         = basePrice + touristTax + extrasTotal;
  // PayPal in 3 rate: si applica all'importo effettivamente addebitato (acconto
  // per offerte parzialmente rimborsabili). Per le flex il radio PayPal è
  // comunque nascosto (isFlexOffer → solo Stripe con capture=false).
  // Nota: `amountToChargeDisplay` è definito più sotto — temporaneamente uso
  // total come fallback, poi lo sovrascrivo dopo averlo calcolato.
  let installment = Math.round(total / 3);

  // Lettura dinamica bookingType dalla config Beds24 (cachata in store).
  // Fallback sicuro: se la config non è ancora caricata, nessuna offerta è
  // considerata flex → il wizard si comporta come prima della patch.
  const offerConfig = findOffer(propertyConfig, selectedRoomId, selectedOfferId);
  const isFlexOffer = isFlexBookingType(offerConfig?.bookingType);
  // Su flex PayPal ora salva solo il conto (vault) — info utente, non warning.
  const showPaypalFlexVaultInfo = paymentMethod === 'paypal' && isFlexOffer;
  const showStripeFlexInfo      = paymentMethod === 'stripe' && isFlexOffer;

  const formValid = guestFirstName.trim() && guestLastName.trim()
    && guestEmail.trim() && guestEmail.includes('@');

  // ── PayPal su offerte flex è supportato via vault save ──────────────────
  // (lib/paypal + /api/paypal-setup-token). Nessun charge al momento del
  // salvataggio quindi niente commissione 3.4% al refund se l'ospite cancella
  // entro la scadenza della cancellazione gratuita.

  // ── Pre-carica script PayPal SDK v6 quando utente seleziona PayPal ───────
  // Lo script v6 core è universale (sandbox vs live si sceglie dal sottodominio).
  // Per evitare NEXT_PUBLIC_PAYPAL_MODE, facciamo una fetch leggera al client-token
  // endpoint solo al prefetch: scopriamo la mode e carichiamo lo script giusto.
  useEffect(() => {
    if (paymentMethod !== 'paypal') return;
    if (document.getElementById('paypal-sdk-script')) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/paypal-client-token', { method: 'POST' });
        const data = await res.json();
        if (cancelled || !res.ok) return;
        const mode   = data.mode === 'sandbox' ? 'sandbox' : 'live';
        const host   = mode === 'sandbox' ? 'www.sandbox.paypal.com' : 'www.paypal.com';
        const script = document.createElement('script');
        script.id    = 'paypal-sdk-script';
        script.src   = `https://${host}/web-sdk/v6/core`;
        script.async = true;
        document.head.appendChild(script);
      } catch {
        // prefetch fallito — Step3 riproverà al mount con messaggi d'errore utente
      }
    })();
    return () => { cancelled = true; };
  }, [paymentMethod]);

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
      .catch(() => {}); // silenzioso — se fallisce la sezione resta nascosta
  }, [selectedRoomId]);

  // ── Carica foto cover ────────────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    fetchCoversCached().then(covers => {
      const url = covers?.[room.cloudinaryFolder];
      if (url) setCoverUrl(url);
    });
  }, [room?.cloudinaryFolder]);

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

  // ── Vai a Step3 ─────────────────────────────────────────────────────────
  function handleVediRiepilogo() {
    if (!formValid) return;
    if (voucherInput.trim()) {
      setVoucherCode(voucherInput.trim());
    }
    nextStep();
  }

  // ── Sidebar content ──────────────────────────────────────────────────────
  const sideBasePrice = discountedPrice !== null ? discountedPrice : offerPrice;
  const totalDisplay  = sideBasePrice + touristTax + extrasTotal;

  // Importo da pagare ORA (acconto). Dipende dal bookingType dell'offerta:
  // - 100% per offerte non rimborsabili
  // - 50% (o quanto configurato su Beds24) per parzialmente rimborsabili
  // - 0 per offerte flex (carta salvata, nessun addebito oggi)
  // Fallback a totalDisplay se propertyConfig non è ancora caricato.
  const propertyCfg = findPropertyByRoom(propertyConfig, selectedRoomId);
  const amountToChargeDisplay = computeDepositAmount(totalDisplay, offerConfig, propertyCfg);
  const isPartialDeposit = !isFlexOffer && amountToChargeDisplay > 0 && amountToChargeDisplay < totalDisplay;

  // Aggiorna rate PayPal sull'importo effettivo (acconto invece di totale)
  installment = Math.round(amountToChargeDisplay / 3);

  // Etichetta e importo del radio Stripe "Paga tutto ora / acconto / salva carta"
  const stripeRadioLabel = isFlexOffer
    ? t.paySaveCard
    : isPartialDeposit
      ? t.payDeposit
      : t.payFull;
  const stripeRadioAmount = isFlexOffer ? null : amountToChargeDisplay;
  const stripeRadioNote = isFlexOffer
    ? t.paySaveCardNote
    : isPartialDeposit
      ? `${t.payDepositNote} ${fmt(totalDisplay - amountToChargeDisplay)}`
      : null;

  const SidebarContent = () => (
    <div>
      {/* Foto + nome */}
      {room && (
        <div className="wizard-step2-mobile__hero">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={room.name}
              className="wizard-step2-mobile__hero-img"
            />
          ) : (
            <div className="wizard-step2-mobile__hero-placeholder">
              <i className="bi bi-house-fill" aria-hidden="true" />
            </div>
          )}
          <div className="wizard-step2-mobile__hero-info">
            <p className="wizard-step2-mobile__hero-name">{room.name}</p>
            <p className="wizard-step2-mobile__hero-type">{room.type}</p>
          </div>
        </div>
      )}

      {/* Consumi energetici */}
      <div className="wizard-step2-mobile__energy">
        <p className="wizard-step2-mobile__energy-title">
          <i className="bi bi-lightning-fill me-1" aria-hidden="true" />
          {t.energyTitle}
        </p>
        <p className="wizard-step2-mobile__energy-text">{ENERGY_BOX[locale] ?? ENERGY_BOX.it}</p>
      </div>

      <div className="wizard-step2-mobile__divider" />

      {/* Voucher */}
      <p className="wizard-step2-mobile__section-label">{t.voucher}</p>
      <div className="wizard-step2-mobile__voucher-row">
        <input
          type="text"
          value={voucherInput}
          onChange={e => { setVoucherInput(e.target.value); if (voucherApplied) { setVoucherApplied(false); setDiscountedPrice(null); setVoucherCode(''); } }}
          placeholder="es. ESTATE2026"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`wizard-step2-mobile__voucher-input${voucherApplied ? ' is-applied' : ''}`}
        />
        <button
          onClick={handleApplyVoucher}
          disabled={!voucherInput.trim()}
          className={`wizard-step2-mobile__voucher-btn${voucherApplied ? ' is-applied' : ''}`}
        >
          {voucherApplied ? (
            <>
              <i className="bi bi-check-lg me-1" aria-hidden="true" />
              {tSidebar.voucherApplied}
            </>
          ) : t.voucherApply}
        </button>
      </div>
      {voucherError && <p className="wizard-step2-mobile__voucher-error">{voucherError}</p>}

      <div className="wizard-step2-mobile__divider" />

      {/* Date + Modifica */}
      <SideRow
        label={t.dates}
        value={checkIn && checkOut ? `${formatDate(checkIn, locale)} – ${formatDate(checkOut, locale)}` : '—'}
        onEdit={() => setCurrentStep(2)}
        editLabel={t.edit}
      />
      {nights > 0 && <p className="wizard-step2-mobile__nights-sub">{nights} {nights === 1 ? t.night : t.nights}</p>}

      {/* Ospiti + Modifica */}
      <SideRow
        label={t.guests}
        value={`${numAdult} ${t.adults}${numChild > 0 ? `, ${numChild} ${t.children}` : ''}`}
        onEdit={() => setCurrentStep(1)}
        editLabel={t.edit}
      />

      <div className="wizard-step2-mobile__divider" />

      {/* Dettagli prezzo */}
      <p className="wizard-step2-mobile__section-label">{t.priceDetail}</p>
      {offerPrice > 0 && perNight > 0 && (
        <div className="wizard-step2-mobile__price-row">
          <span>{nights} {nights === 1 ? t.night : t.nights} × {fmt(perNight)}</span>
          <span className={voucherApplied ? 'wizard-step2-mobile__price-row-strike' : ''}>
            {fmt(offerPrice)}
          </span>
        </div>
      )}

      {/* Riga sconto voucher */}
      {voucherApplied && discountedPrice !== null && (
        <div className="wizard-step2-mobile__discount-row">
          <span className="wizard-step2-mobile__discount-label">
            <i className="bi bi-tag-fill me-1" aria-hidden="true" />
            Sconto ({voucherCode})
          </span>
          <span className="wizard-step2-mobile__discount-value">− {fmt(offerPrice - discountedPrice)}</span>
        </div>
      )}

      {/* Righe extras selezionati */}
      {selectedExtras.map(extra => (
        <div key={extra.id} className="wizard-step2-mobile__price-row">
          <span>{extra.name[loc] ?? extra.name.it}{extra.quantity > 1 ? ` ×${extra.quantity}` : ''}</span>
          <span>+{fmt(extra.price * extra.quantity)}</span>
        </div>
      ))}

      {/* Stepper upsell — visibile in sidebar desktop e accordion mobile */}
      {upsellItems.length > 0 && (
        <>
          <div className="wizard-step2-mobile__divider wizard-step2-mobile__divider--sm" />
          <p className="wizard-step2-mobile__section-label">{t.sec2title}</p>
          <div className="wizard-step2-mobile__extras-list">
            {upsellItems.map(item => {
              const sel = selectedExtras.find(e => e.id === item.id);
              const qty = sel?.quantity ?? 0;
              const MAX_QTY = 4;
              return (
                <div
                  key={item.id}
                  className={`wizard-step2-mobile__extra-item${qty > 0 ? ' is-selected' : ''}`}
                >
                  <span className="wizard-step2-mobile__extra-icon" aria-hidden="true">
                    <i className="bi bi-bag-plus-fill" />
                  </span>
                  <div className="wizard-step2-mobile__extra-info">
                    <p className="wizard-step2-mobile__extra-name">
                      {item.name[loc] ?? item.name.it}
                    </p>
                    <p className="wizard-step2-mobile__extra-price-unit">
                      +{fmt(item.price)} / unità
                    </p>
                  </div>
                  {/* Stepper */}
                  <div className="wizard-step2-mobile__extra-stepper">
                    <button
                      onClick={() => setExtraQuantity(item, qty - 1)}
                      disabled={qty === 0}
                      className={`wizard-step2-mobile__extra-stepper-btn${qty > 0 ? ' is-active-minus' : ''}`}
                    >−</button>
                    <span className={`wizard-step2-mobile__extra-qty${qty > 0 ? ' is-active' : ''}`}>{qty}</span>
                    <button
                      onClick={() => setExtraQuantity(item, qty + 1)}
                      disabled={qty >= MAX_QTY}
                      className={`wizard-step2-mobile__extra-stepper-btn${qty < MAX_QTY ? ' is-active-plus' : ' is-disabled-plus'}`}
                    >+</button>
                  </div>
                  <span
                    aria-hidden={qty === 0}
                    className={`wizard-step2-mobile__extra-total${qty === 0 ? ' is-hidden' : ''}`}
                  >
                    {fmt(item.price * Math.max(qty, 1))}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {touristTax > 0 && (
        <div className="wizard-step2-mobile__price-row">
          <span>{t.touristTax}</span>
          <span>{fmt(touristTax)}</span>
        </div>
      )}

      {/* Totale */}
      <div className="wizard-step2-mobile__total-row">
        <span className="wizard-step2-mobile__total-label">{t.total}</span>
        <div className="wizard-step2-mobile__total-wrap">
          {voucherApplied && discountedPrice !== null && (
            <span className="wizard-step2-mobile__total-old">
              {fmt(offerPrice + touristTax + extrasTotal)}
            </span>
          )}
          <span className="wizard-step2-mobile__total-new">{fmt(totalDisplay)}</span>
        </div>
      </div>
      {touristTax > 0 && (
        <p className="wizard-step2-mobile__tourist-tax-note">{formatTouristTaxNote(t.touristTaxNote)}</p>
      )}

      {/* Deposito cauzionale */}
      {depositAmount && (
        <div className="wizard-step2-mobile__deposit">
          <p className="wizard-step2-mobile__deposit-title">
            <i className="bi bi-shield-lock-fill me-1" aria-hidden="true" />
            {t.depositTitle}
          </p>
          <p className="wizard-step2-mobile__deposit-text">
            {(DEPOSIT_BOX[locale] ?? DEPOSIT_BOX.it)(depositAmount)}
          </p>
        </div>
      )}

      {/* Politica cancellazione */}
      {cancelPolicy && (
        <>
          <div className="wizard-step2-mobile__divider" />
          <p className="wizard-step2-mobile__section-label">{t.cancelPolicy}</p>
          <p className="wizard-step2-mobile__cancel-text">{cancelPolicy}</p>
        </>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="wizard-step2">
      <h2 className="section-title-main">{t.title}</h2>

      <div className="wizard-step2__layout">

        {/* ── Colonna sinistra: form ── */}
        <div className="wizard-step2__main">

          {/* Mobile: accordion riepilogo */}
          <div className="wizard-step2__summary-accordion">
            <button
              onClick={() => setSummaryOpen(o => !o)}
              className="wizard-step2__summary-accordion-btn"
            >
              <span>{t.summaryTitle} — {fmt(totalDisplay)}</span>
              <span className={`wizard-step2__summary-accordion-chevron${summaryOpen ? ' is-open' : ''}`}>›</span>
            </button>
            {summaryOpen && (
              <div className="wizard-step2__summary-accordion-body">
                <SidebarContent />
              </div>
            )}
          </div>

          {/* Sezione 1: Pagamento */}
          <div className="step2-section-card">
            <div className="step2-section-header">
              <div className="step2-section-number">1</div>
              <p className="step2-section-title">{t.sec1title.replace('1. ', '')}</p>
            </div>

            <label
              className={`step2-radio-row${paymentMethod === 'stripe' ? ' is-selected' : ''}`}
              onClick={() => setPaymentMethod('stripe')}
            >
              <div className="step2-radio-dot">
                {paymentMethod === 'stripe' && <div className="step2-radio-dot-inner" />}
              </div>
              <div>
                <p className="step2-radio-label">
                  {stripeRadioLabel}
                  {stripeRadioAmount !== null && ` · ${fmt(stripeRadioAmount)}`}
                </p>
                {stripeRadioNote && (
                  <p className="step2-radio-note">{stripeRadioNote}</p>
                )}
              </div>
            </label>

            <label
              className={`step2-radio-row${paymentMethod === 'paypal' ? ' is-selected' : ''}`}
              onClick={() => setPaymentMethod('paypal')}
            >
              <div className="step2-radio-dot">
                {paymentMethod === 'paypal' && <div className="step2-radio-dot-inner" />}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <p className="step2-radio-label">{t.payInstall}</p>
                  <span className="step2-paypal-chip">PayPal</span>
                </div>
                <p className="step2-radio-note">
                  {isFlexOffer
                    ? (t as any).paypalFlexVaultNote ?? t.paypalFlexNote
                    : (PAY_INSTALL_NOTE[loc]?.(installment) ?? '')}
                </p>
              </div>
            </label>

            {showPaypalFlexVaultInfo && (
              <div className="banner banner--success banner--with-icon">
                <i className="bi bi-shield-lock" aria-hidden="true"></i>
                <span>{(t as any).paypalFlexVaultNote ?? t.paypalFlexNote}</span>
              </div>
            )}

            {showStripeFlexInfo && (
              <div className="banner banner--success banner--with-icon">
                <i className="bi bi-credit-card-2-back" aria-hidden="true"></i>
                <span>{t.stripeFlexNote}</span>
              </div>
            )}
          </div>


          {/* Sezione 2: Dati ospite */}
          <div className="step2-section-card">
            <div className="step2-section-header">
              <div className="step2-section-number">2</div>
              <p className="step2-section-title">{t.sec3title.replace('2. ', '')}</p>
            </div>

            <div className="step2-form-grid-2">
              <Field label={t.firstName} value={guestFirstName} onChange={v => setGuestField('guestFirstName', v)} autoComplete="given-name" />
              <Field label={t.lastName}  value={guestLastName}  onChange={v => setGuestField('guestLastName', v)}  autoComplete="family-name" />
            </div>
            <Field label={t.email}   value={guestEmail}   onChange={v => setGuestField('guestEmail', v)}   type="email"   autoComplete="email" />
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

          {/* Errore */}
          {error && (
            <div className="banner banner--error">
              <p className="banner__title">{t.errTitle}</p>
              <p className="banner__text">{error}</p>
            </div>
          )}

          {/* CTA — mostra totale aggiornato */}
          <button
            onClick={handleVediRiepilogo}
            disabled={!formValid}
            className="btn btn--primary step2-cta"
          >
            {isFlexOffer
              ? t.vediRiepilogoFlex
              : `${t.vediRiepilogo} → ${fmt(amountToChargeDisplay || totalDisplay)}`}
          </button>

          <p className="step2-terms">
            {t.terms}{' '}
            <a href={`/${locale}/condizioni`} target="_blank" rel="noopener noreferrer">{t.termsLink}</a>
          </p>
          <button onClick={handleBack} className="step2-back-link">
            {t.back}
          </button>
        </div>

        {/* ── Sidebar destra (desktop) — usa BookingSidebar con slot voucher+extras ── */}
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
                    placeholder={tSidebar.voucherPlaceholder}
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
                        {tSidebar.voucherApplied}
                      </>
                    ) : t.voucherApply}
                  </button>
                </div>
                {voucherError && <p className="voucher-block__error">{voucherError}</p>}
              </>
            }
            step2ExtrasSlot={upsellItems.length > 0 ? (
              <>
                <p className="label-uppercase-muted">{t.sec2title}</p>
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
              </>
            ) : null}
          />
        </div>
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SideRow({ label, value, onEdit, editLabel }: { label: string; value: string; onEdit: () => void; editLabel: string }) {
  return (
    <div className="wizard-step2-mobile__side-row">
      <div>
        <p className="wizard-step2-mobile__side-row-label">{label}</p>
        <p className="wizard-step2-mobile__side-row-value">{value}</p>
      </div>
      <button
        onClick={onEdit}
        className="wizard-step2-mobile__side-row-edit"
      >
        {editLabel}
      </button>
    </div>
  );
}

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

