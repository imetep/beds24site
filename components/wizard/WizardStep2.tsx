'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import type { SelectedExtra } from '@/store/wizard-store';
import { PROPERTIES, getPropertyForRoom } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
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

// Offerte Flex (3-6): con PayPal il pagamento è immediato — avvisa l'utente
const FLEX_OFFER_IDS = [3, 4, 5, 6];

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
      router.push(`/${locale}/residenze/${room.slug}`);
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

  const taxableNights = Math.min(nights, 10);
  const childrenTaxable = (childrenAges ?? []).filter((a: number) => a >= 12).length;
  const taxableAdults   = numAdult + childrenTaxable;
  const touristTax    = taxableNights * taxableAdults * 2;
  const basePrice     = discountedPrice !== null ? discountedPrice : offerPrice;

  // ── Totale extras selezionati ──────────────────────────────────────────────
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price * e.quantity, 0);

  const total         = basePrice + touristTax + extrasTotal;
  const installment   = Math.round(total / 3);

  const isFlexOffer = selectedOfferId !== null && FLEX_OFFER_IDS.includes(selectedOfferId);
  const showPaypalFlexWarning = paymentMethod === 'paypal' && isFlexOffer;

  const formValid = guestFirstName.trim() && guestLastName.trim()
    && guestEmail.trim() && guestEmail.includes('@');

  // ── Pre-carica script PayPal SDK quando utente seleziona PayPal ──────────
  useEffect(() => {
    if (paymentMethod !== 'paypal') return;
    if (document.getElementById('paypal-sdk-script')) return;
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) return;
    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture`;
    script.async = true;
    document.head.appendChild(script);
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

  const SidebarContent = () => (
    <div>
      {/* Foto + nome */}
      {room && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={room.name}
              style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: 100, background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏠</div>
          )}
          <div style={{ padding: '10px 4px 0' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>{room.name}</p>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{room.type}</p>
          </div>
        </div>
      )}

      {/* ⚡ Consumi energetici */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', margin: '0 0 5px' }}>⚡ {t.energyTitle}</p>
        <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{ENERGY_BOX[locale] ?? ENERGY_BOX.it}</p>
      </div>

      <div style={divider} />

      {/* Voucher */}
      <p style={sideLabel}>{t.voucher}</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          type="text"
          value={voucherInput}
          onChange={e => { setVoucherInput(e.target.value); if (voucherApplied) { setVoucherApplied(false); setDiscountedPrice(null); setVoucherCode(''); } }}
          placeholder="es. ESTATE2026"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{ flex: 1, padding: '8px 10px', fontSize: 13, border: `1.5px solid ${voucherApplied ? '#16a34a' : '#e5e7eb'}`, borderRadius: 8, outline: 'none' }}
        />
        <button
          onClick={handleApplyVoucher}
          disabled={!voucherInput.trim()}
          style={{ padding: '8px 14px', minHeight: 'var(--touch-target)', borderRadius: 8, border: `1.5px solid ${voucherApplied ? '#16a34a' : 'var(--color-primary)'}`, background: voucherApplied ? '#16a34a' : '#fff', color: voucherApplied ? '#fff' : 'var(--color-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {voucherApplied ? '✓ Applicato' : t.voucherApply}
        </button>
      </div>
      {voucherError && <p style={{ fontSize: 12, color: '#e74c3c', margin: '4px 0 8px' }}>{voucherError}</p>}

      <div style={divider} />

      {/* Date + Modifica */}
      <SideRow
        label={t.dates}
        value={checkIn && checkOut ? `${formatDate(checkIn, locale)} – ${formatDate(checkOut, locale)}` : '—'}
        onEdit={() => setCurrentStep(2)}
        editLabel={t.edit}
      />
      {nights > 0 && <p style={{ fontSize: 12, color: '#9ca3af', margin: '-8px 0 12px' }}>{nights} {nights === 1 ? t.night : t.nights}</p>}

      {/* Ospiti + Modifica */}
      <SideRow
        label={t.guests}
        value={`${numAdult} ${t.adults}${numChild > 0 ? `, ${numChild} ${t.children}` : ''}`}
        onEdit={() => setCurrentStep(1)}
        editLabel={t.edit}
      />

      <div style={divider} />

      {/* Dettagli prezzo */}
      <p style={sideLabel}>{t.priceDetail}</p>
      {offerPrice > 0 && perNight > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#444', marginBottom: 6 }}>
          <span>{nights} {nights === 1 ? t.night : t.nights} × {fmt(perNight)}</span>
          <span style={{ textDecoration: voucherApplied ? 'line-through' : 'none', color: voucherApplied ? '#aaa' : '#444' }}>
            {fmt(offerPrice)}
          </span>
        </div>
      )}

      {/* Riga sconto voucher */}
      {voucherApplied && discountedPrice !== null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, background: '#f0fdf4', borderRadius: 8, padding: '6px 8px', border: '1px solid #bbf7d0' }}>
          <span style={{ color: '#16a34a', fontWeight: 600 }}>🏷️ Sconto ({voucherCode})</span>
          <span style={{ color: '#16a34a', fontWeight: 700 }}>− {fmt(offerPrice - discountedPrice)}</span>
        </div>
      )}

      {/* Righe extras selezionati */}
      {selectedExtras.map(extra => (
        <div key={extra.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#444', marginBottom: 6 }}>
          <span>{extra.name[loc] ?? extra.name.it}{extra.quantity > 1 ? ` ×${extra.quantity}` : ''}</span>
          <span>+{fmt(extra.price * extra.quantity)}</span>
        </div>
      ))}

      {/* Stepper upsell — visibile in sidebar desktop e accordion mobile */}
      {upsellItems.length > 0 && (
        <>
          <div style={{ height: 1, background: '#e5e7eb', margin: '10px 0 10px' }} />
          <p style={{ ...sideLabel, marginBottom: 8 }}>{t.sec2title}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {upsellItems.map(item => {
              const sel = selectedExtras.find(e => e.id === item.id);
              const qty = sel?.quantity ?? 0;
              const MAX_QTY = 4;
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  border: `1.5px solid ${qty > 0 ? 'var(--color-primary)' : '#e5e7eb'}`,
                  borderRadius: 10,
                  background: qty > 0 ? '#EEF5FC' : '#fafafa',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>🛏️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>
                      {item.name[loc] ?? item.name.it}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: '#888' }}>
                      +{fmt(item.price)} / unità
                    </p>
                  </div>
                  {/* Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                    <button
                      onClick={() => setExtraQuantity(item, qty - 1)}
                      disabled={qty === 0}
                      style={{
                        width: 'var(--touch-target)', height: 'var(--touch-target)', borderRadius: '50%',
                        border: `1.5px solid ${qty > 0 ? 'var(--color-primary)' : '#d1d5db'}`,
                        background: '#fff', color: qty > 0 ? 'var(--color-primary)' : '#ccc',
                        fontSize: 18, fontWeight: 700, cursor: qty > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', lineHeight: 1,
                      }}
                    >−</button>
                    <span style={{
                      width: 32, textAlign: 'center', fontSize: 15, fontWeight: 700,
                      color: qty > 0 ? 'var(--color-primary)' : '#999',
                    }}>{qty}</span>
                    <button
                      onClick={() => setExtraQuantity(item, qty + 1)}
                      disabled={qty >= MAX_QTY}
                      style={{
                        width: 'var(--touch-target)', height: 'var(--touch-target)', borderRadius: '50%',
                        border: `1.5px solid ${qty < MAX_QTY ? 'var(--color-primary)' : '#d1d5db'}`,
                        background: qty < MAX_QTY ? 'var(--color-primary)' : '#f5f5f5',
                        color: qty < MAX_QTY ? '#fff' : '#ccc',
                        fontSize: 18, fontWeight: 700, cursor: qty < MAX_QTY ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', lineHeight: 1,
                      }}
                    >+</button>
                  </div>
                  {qty > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                      {fmt(item.price * qty)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {touristTax > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#444', marginBottom: 6 }}>
          <span>{t.touristTax}</span>
          <span>{fmt(touristTax)}</span>
        </div>
      )}

      {/* Totale */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{t.total}</span>
        <div style={{ textAlign: 'right' }}>
          {voucherApplied && discountedPrice !== null && (
            <span style={{ fontSize: 13, color: '#aaa', textDecoration: 'line-through', marginRight: 8 }}>
              {fmt(offerPrice + touristTax + extrasTotal)}
            </span>
          )}
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>{fmt(totalDisplay)}</span>
        </div>
      </div>
      {touristTax > 0 && (
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>{t.touristTaxNote}</p>
      )}

      {/* Deposito cauzionale */}
      {depositAmount && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#92610a', margin: '0 0 5px' }}>🔐 {t.depositTitle}</p>
          <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.5 }}>
            {(DEPOSIT_BOX[locale] ?? DEPOSIT_BOX.it)(depositAmount)}
          </p>
        </div>
      )}

      {/* Politica cancellazione */}
      {cancelPolicy && (
        <>
          <div style={divider} />
          <p style={sideLabel}>{t.cancelPolicy}</p>
          <p style={{ fontSize: 13, color: '#444', margin: '0 0 4px', lineHeight: 1.5 }}>{cancelPolicy}</p>
        </>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-vh-100" style={{ fontFamily: 'sans-serif' }}>
      <h2 className="fw-bold text-dark mb-3" style={{ fontSize: 22 }}>{t.title}</h2>

      <div className="d-flex align-items-start" style={{ gap: 32 }}>

        {/* ── Colonna sinistra: form ── */}
        <div className="flex-fill min-w-0" style={{ maxWidth: 'var(--container-sm)' }}>

          {/* Mobile: accordion riepilogo */}
          <div
            className="wizard-summary-mobile border mb-4 overflow-hidden"
            style={{ display: 'none', borderRadius: 14 }}
          >
            <button
              onClick={() => setSummaryOpen(o => !o)}
              className="w-100 d-flex justify-content-between align-items-center px-3 py-3 fw-semibold text-dark border-0"
              style={{ background: '#f9fafb', fontSize: 14, cursor: 'pointer' }}
            >
              <span>{t.summaryTitle} — {fmt(totalDisplay)}</span>
              <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: summaryOpen ? 'rotate(180deg)' : 'none' }}>›</span>
            </button>
            {summaryOpen && (
              <div style={{ padding: '0 16px 16px' }}>
                <SidebarContent />
              </div>
            )}
          </div>

          {/* Sezione 1: Pagamento */}
          <div style={sectionCard}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 28, height: 28, background: 'var(--color-primary)' }}
              >
                <span className="text-white fw-bolder" style={{ fontSize: 13 }}>1</span>
              </div>
              <p style={{ ...sectionTitle, margin: 0 }}>{t.sec1title.replace('1. ', '')}</p>
            </div>

            <label style={radioRow(paymentMethod === 'stripe')} onClick={() => setPaymentMethod('stripe')}>
              <div style={radioOuter(paymentMethod === 'stripe')}>
                {paymentMethod === 'stripe' && <div style={radioInner} />}
              </div>
              <div>
                <p className="m-0 fw-semibold text-dark" style={{ fontSize: 15 }}>{t.payFull}</p>
                <p className="mb-0" style={{ marginTop: 2, fontSize: 13, color: '#888' }}>{fmt(totalDisplay)}</p>
              </div>
            </label>

            <label style={radioRow(paymentMethod === 'paypal')} onClick={() => setPaymentMethod('paypal')}>
              <div style={radioOuter(paymentMethod === 'paypal')}>
                {paymentMethod === 'paypal' && <div style={radioInner} />}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <p className="m-0 fw-semibold text-dark" style={{ fontSize: 15 }}>{t.payInstall}</p>
                  <span
                    className="fw-bold"
                    style={{ fontSize: 12, color: '#003087', background: '#e8f0fb', padding: '2px 8px', borderRadius: 4 }}
                  >PayPal</span>
                </div>
                <p className="mb-0" style={{ marginTop: 2, fontSize: 13, color: '#888' }}>
                  {PAY_INSTALL_NOTE[loc]?.(installment) ?? ''}
                </p>
              </div>
            </label>

            {showPaypalFlexWarning && (
              <div
                className="border"
                style={{ background: '#fffbeb', borderColor: '#fcd34d', borderRadius: 8, padding: '10px 14px', marginTop: 4, fontSize: 13, color: '#92400e' }}
              >
                ⚠️ {t.paypalFlexNote}
              </div>
            )}
          </div>


          {/* Sezione 2: Dati ospite */}
          <div style={sectionCard}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 28, height: 28, background: 'var(--color-primary)' }}
              >
                <span className="text-white fw-bolder" style={{ fontSize: 13 }}>2</span>
              </div>
              <p style={{ ...sectionTitle, margin: 0 }}>{t.sec3title.replace('2. ', '')}</p>
            </div>

            <div className="d-grid mb-2" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label={t.firstName} value={guestFirstName} onChange={v => setGuestField('guestFirstName', v)} autoComplete="given-name" />
              <Field label={t.lastName}  value={guestLastName}  onChange={v => setGuestField('guestLastName', v)}  autoComplete="family-name" />
            </div>
            <Field label={t.email}   value={guestEmail}   onChange={v => setGuestField('guestEmail', v)}   type="email"   autoComplete="email" style={{ marginBottom: 10 }} />
            <div className="d-grid mb-2" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label={t.phone}   value={guestPhone}   onChange={v => setGuestField('guestPhone', v)}   type="tel" autoComplete="tel" />
              <Field label={t.country} value={guestCountry} onChange={v => setGuestField('guestCountry', v)} autoComplete="country-name" />
            </div>
            <Field label={t.arrivalTime} value={guestArrivalTime} onChange={v => setGuestField('guestArrivalTime', v)} type="time" style={{ marginBottom: 10 }} />
            <div className="mb-0">
              <label style={labelStyle}>{t.comments}</label>
              <textarea
                value={guestComments}
                onChange={e => setGuestField('guestComments', e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Errore */}
          {error && (
            <div
              className="border mb-3"
              style={{ background: '#fff5f5', borderColor: '#f5c6cb', borderRadius: 10, padding: '12px 16px' }}
            >
              <p className="m-0 fw-semibold" style={{ color: '#c0392b', fontSize: 14 }}>{t.errTitle}</p>
              <p className="mb-0" style={{ marginTop: 4, fontSize: 13, color: '#888' }}>{error}</p>
            </div>
          )}

          {/* CTA — mostra totale aggiornato */}
          <button
            onClick={handleVediRiepilogo}
            disabled={!formValid}
            className="w-100 fw-bolder border-0 mb-2"
            style={{
              padding: 16, borderRadius: 12,
              fontSize: 17,
              background: formValid ? '#FCAF1A' : '#e0e0e0',
              color: formValid ? '#fff' : '#999',
              cursor: formValid ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {`${t.vediRiepilogo} → ${fmt(totalDisplay)}`}
          </button>

          <p className="text-center mb-3" style={{ fontSize: 12, color: '#aaa' }}>
            {t.terms}{' '}
            <a href={`/${locale}/condizioni`} style={{ color: 'var(--color-primary)' }} target="_blank" rel="noopener noreferrer">{t.termsLink}</a>
          </p>
          <button
            onClick={handleBack}
            className="btn d-block p-0"
            style={{ color: 'var(--color-primary)', fontSize: 14, minHeight: 'var(--touch-target)' }}
          >
            {t.back}
          </button>
        </div>

        {/* ── Sidebar destra (desktop) — usa BookingSidebar con slot voucher+extras ── */}
        <div className="wizard-summary-sidebar flex-shrink-0">
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
                    {voucherApplied ? tSidebar.voucherApplied : t.voucherApply}
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
                        <span className="extras-catalog__item-icon">🛏️</span>
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
                        {qty > 0 && (
                          <span className="extras-catalog__item-total">
                            {fmt(item.price * qty)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .wizard-summary-sidebar { display: none !important; }
          .wizard-summary-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SideRow({ label, value, onEdit, editLabel }: { label: string; value: string; onEdit: () => void; editLabel: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{value}</p>
      </div>
      <button
        onClick={onEdit}
        style={{ fontSize: 12, fontWeight: 600, color: '#111', background: 'none', border: '1px solid #ccc', borderRadius: 8, padding: '4px 10px', minHeight: 'var(--touch-target)', minWidth: 'var(--touch-target)', cursor: 'pointer', flexShrink: 0, marginLeft: 8, textDecoration: 'underline' }}
      >
        {editLabel}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', autoComplete, style: extraStyle }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; autoComplete?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={extraStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        style={inputStyle}
      />
    </div>
  );
}

// ─── Stili ────────────────────────────────────────────────────────────────────
const sectionCard: React.CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-base)', marginBottom: 'var(--space-base)',
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};
const sectionTitle: React.CSSProperties = {
  fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 16px',
};
const divider: React.CSSProperties = {
  height: 1, background: '#e5e7eb', margin: '14px 0',
};
const sideLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  margin: '0 0 8px',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 14,
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  outline: 'none', boxSizing: 'border-box', color: '#111',
};
const radioRow = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'flex-start', gap: 14,
  padding: '14px', marginBottom: 8, cursor: 'pointer',
  border: `2px solid ${active ? 'var(--color-primary)' : '#e5e7eb'}`,
  borderRadius: 12, background: active ? '#EEF5FC' : '#fff',
  transition: 'all 0.15s',
});
const radioOuter = (active: boolean): React.CSSProperties => ({
  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
  border: `2px solid ${active ? 'var(--color-primary)' : '#ccc'}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#fff',
});
const radioInner: React.CSSProperties = {
  width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)',
};
