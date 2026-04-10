'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import type { SelectedExtra } from '@/store/wizard-store';
import { PROPERTIES, getPropertyForRoom } from '@/config/properties';

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

const OFFER_NAMES: Record<number, Record<string,string>> = {
  1: { it:'Non Rimborsabile',          en:'Non-Refundable',        de:'Nicht erstattungsfähig',  pl:'Bezzwrotna' },
  2: { it:'Parzialmente Rimborsabile', en:'Partially Refundable',  de:'Teilw. erstattungsfähig', pl:'Częściowo zwrotna' },
  3: { it:'Flessibile 60 gg',          en:'Flexible 60 days',      de:'Flexibel 60 Tage',        pl:'Elastyczna 60 dni' },
  4: { it:'Flessibile 45 gg',          en:'Flexible 45 days',      de:'Flexibel 45 Tage',        pl:'Elastyczna 45 dni' },
  5: { it:'Flessibile 30 gg',          en:'Flexible 30 days',      de:'Flexibel 30 Tage',        pl:'Elastyczna 30 dni' },
  6: { it:'Flessibile 5 gg',           en:'Flexible 5 days',       de:'Flexibel 5 Tage',         pl:'Elastyczna 5 dni' },
};

const CANCEL_POLICY: Record<number, Record<string,string>> = {
  1: { it:'Pagamento non rimborsabile entro 48h dalla prenotazione.',          en:'Non-refundable payment within 48h of booking.',           de:'Nicht erstattungsfähige Zahlung innerhalb 48h.',          pl:'Bezzwrotna płatność w ciągu 48h od rezerwacji.' },
  2: { it:'50% subito, saldo all\'arrivo. Cancellazione parzialmente rimborsabile.', en:'50% now, balance at arrival. Partially refundable.',  de:'50% jetzt, Rest bei Ankunft. Teilweise erstattungsfähig.', pl:'50% teraz, reszta przy przyjeździe. Częściowo zwrotna.' },
  3: { it:'Cancellazione gratuita fino a 60 giorni prima dell\'arrivo.',       en:'Free cancellation up to 60 days before arrival.',         de:'Kostenlose Stornierung bis 60 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 60 dni przed przyjazdem.' },
  4: { it:'Cancellazione gratuita fino a 45 giorni prima dell\'arrivo.',       en:'Free cancellation up to 45 days before arrival.',         de:'Kostenlose Stornierung bis 45 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 45 dni przed przyjazdem.' },
  5: { it:'Cancellazione gratuita fino a 30 giorni prima dell\'arrivo.',       en:'Free cancellation up to 30 days before arrival.',         de:'Kostenlose Stornierung bis 30 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 30 dni przed prijazdem.' },
  6: { it:'Cancellazione gratuita fino a 5 giorni prima dell\'arrivo.',        en:'Free cancellation up to 5 days before arrival.',          de:'Kostenlose Stornierung bis 5 Tage vor Ankunft.',          pl:'Bezpłatne anulowanie do 5 dni przed prijazdem.' },
};

const UI: Record<string, Record<string, string>> = {
  it: {
    title: 'Conferma e paga',
    back: '← Indietro',
    sec1title: '1. Come vuoi pagare?',
    sec2title: '2. Servizi extra (opzionale)',
    sec2sub: 'Aggiungi servizi alla tua prenotazione',
    sec3title: '2. I tuoi dati',
    payFull: 'Paga tutto ora',
    payInstall: 'Paga in 3 rate con PayPal',
    firstName: 'Nome *', lastName: 'Cognome *', email: 'Email *',
    phone: 'Telefono', country: 'Paese', arrivalTime: 'Ora di arrivo prevista',
    comments: 'Richieste speciali',
    confirm: 'Conferma prenotazione',
    loading: 'Invio in corso...',
    errTitle: 'Errore nella prenotazione',
    terms: 'Confermando accetti le',
    termsLink: 'condizioni generali',
    cancelPolicy: 'Politica di cancellazione',
    dates: 'Date', guests: 'Ospiti',
    edit: 'Modifica',
    priceDetail: 'Dettagli del prezzo',
    perNight: 'a notte',
    nights: 'notti', night: 'notte',
    total: 'Totale',
    touristTax: 'Imposta di soggiorno',
    touristTaxNote: '€2/pers/notte · max 10 notti · esenti under 12',
    voucher: 'Codice promozionale',
    voucherApply: 'Applica',
    energyTitle: 'Consumi energetici',
    depositTitle: 'Deposito cauzionale',
    adults: 'adulti', children: 'bambini',
    summaryTitle: 'Il tuo soggiorno',
    paypalFlexNote: 'Con PayPal il pagamento viene addebitato subito.',
    vediRiepilogo: 'Vedi riepilogo finale',
  },
  en: {
    title: 'Confirm and pay',
    back: '← Back',
    sec1title: '1. How do you want to pay?',
    sec2title: '2. Optional extras',
    sec2sub: 'Add services to your booking',
    sec3title: '2. Your details',
    payFull: 'Pay in full now',
    payInstall: 'Pay in 3 installments with PayPal',
    firstName: 'First name *', lastName: 'Last name *', email: 'Email *',
    phone: 'Phone', country: 'Country', arrivalTime: 'Expected arrival time',
    comments: 'Special requests',
    confirm: 'Confirm booking',
    loading: 'Sending...',
    errTitle: 'Booking error',
    terms: 'By confirming you accept the',
    termsLink: 'terms and conditions',
    cancelPolicy: 'Cancellation policy',
    dates: 'Dates', guests: 'Guests',
    edit: 'Edit',
    priceDetail: 'Price details',
    perNight: 'per night',
    nights: 'nights', night: 'night',
    total: 'Total',
    touristTax: 'Tourist tax',
    touristTaxNote: '€2/pers/night · max 10 nights · under 12 exempt',
    voucher: 'Promotional code',
    voucherApply: 'Apply',
    energyTitle: 'Energy consumption',
    depositTitle: 'Security deposit',
    adults: 'adults', children: 'children',
    summaryTitle: 'Your stay',
    paypalFlexNote: 'With PayPal, payment is charged immediately.',
    vediRiepilogo: 'View booking summary',
  },
  de: {
    title: 'Bestätigen und bezahlen',
    back: '← Zurück',
    sec1title: '1. Wie möchten Sie bezahlen?',
    sec2title: '2. Optionale Extras',
    sec2sub: 'Zusatzleistungen zur Buchung hinzufügen',
    sec3title: '2. Ihre Daten',
    payFull: 'Jetzt vollständig bezahlen',
    payInstall: 'In 3 Raten mit PayPal bezahlen',
    firstName: 'Vorname *', lastName: 'Nachname *', email: 'E-Mail *',
    phone: 'Telefon', country: 'Land', arrivalTime: 'Voraussichtliche Ankunftszeit',
    comments: 'Besondere Wünsche',
    confirm: 'Buchung bestätigen',
    loading: 'Wird gesendet...',
    errTitle: 'Buchungsfehler',
    terms: 'Mit der Bestätigung akzeptieren Sie die',
    termsLink: 'Allgemeinen Geschäftsbedingungen',
    cancelPolicy: 'Stornierungsbedingungen',
    dates: 'Daten', guests: 'Gäste',
    edit: 'Ändern',
    priceDetail: 'Preisdetails',
    perNight: 'pro Nacht',
    nights: 'Nächte', night: 'Nacht',
    total: 'Gesamt',
    touristTax: 'Kurtaxe',
    touristTaxNote: '€2/Pers/Nacht · max. 10 Nächte · Kinder unter 12 befreit',
    voucher: 'Aktionscode',
    voucherApply: 'Anwenden',
    energyTitle: 'Energieverbrauch',
    depositTitle: 'Kaution',
    adults: 'Erwachsene', children: 'Kinder',
    summaryTitle: 'Ihr Aufenthalt',
    paypalFlexNote: 'Bei PayPal wird der Betrag sofort belastet.',
    vediRiepilogo: 'Buchungsübersicht anzeigen',
  },
  pl: {
    title: 'Potwierdź i zapłać',
    back: '← Wstecz',
    sec1title: '1. Jak chcesz zapłacić?',
    sec2title: '2. Opcjonalne dodatki',
    sec2sub: 'Dodaj usługi do rezerwacji',
    sec3title: '2. Twoje dane',
    payFull: 'Zapłać teraz w całości',
    payInstall: 'Zapłać w 3 ratach przez PayPal',
    firstName: 'Imię *', lastName: 'Nazwisko *', email: 'E-mail *',
    phone: 'Telefon', country: 'Kraj', arrivalTime: 'Przewidywana godzina przyjazdu',
    comments: 'Specjalne życzenia',
    confirm: 'Potwierdź rezerwację',
    loading: 'Wysyłanie...',
    errTitle: 'Błąd rezerwacji',
    terms: 'Potwierdzając akceptujesz',
    termsLink: 'ogólne warunki',
    cancelPolicy: 'Polityka anulowania',
    dates: 'Daty', guests: 'Goście',
    edit: 'Zmień',
    priceDetail: 'Szczegóły ceny',
    perNight: 'za noc',
    nights: 'nocy', night: 'noc',
    total: 'Łącznie',
    touristTax: 'Opłata turystyczna',
    touristTaxNote: '€2/os./noc · maks. 10 nocy · dzieci poniżej 12 lat zwolnione',
    voucher: 'Kod promocyjny',
    voucherApply: 'Zastosuj',
    energyTitle: 'Zużycie energii',
    depositTitle: 'Kaucja',
    adults: 'dorośli', children: 'dzieci',
    summaryTitle: 'Twój pobyt',
    paypalFlexNote: 'W przypadku PayPal płatność jest naliczana natychmiast.',
    vediRiepilogo: 'Zobacz podsumowanie',
  },
};
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
  const t   = UI[locale] ?? UI.it;
  const loc = locale in UI ? locale : 'it';
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
  const offerName = OFFER_NAMES[selectedOfferId ?? 0]?.[loc] ?? offer?.offerName ?? '';
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
    fetch('/api/cloudinary?covers=true')
      .then(r => r.json())
      .then(data => {
        const url = data?.covers?.[room.cloudinaryFolder];
        if (url) setCoverUrl(url);
      })
      .catch(() => {});
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
        setVoucherError('Codice non valido');
        setVoucherCode('');
      }
    } catch {
      setVoucherError('Errore verifica codice');
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
          style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${voucherApplied ? '#16a34a' : '#1E73BE'}`, background: voucherApplied ? '#16a34a' : '#fff', color: voucherApplied ? '#fff' : '#1E73BE', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                  border: `1.5px solid ${qty > 0 ? '#1E73BE' : '#e5e7eb'}`,
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
                        width: 28, height: 28, borderRadius: '50%',
                        border: `1.5px solid ${qty > 0 ? '#1E73BE' : '#d1d5db'}`,
                        background: '#fff', color: qty > 0 ? '#1E73BE' : '#ccc',
                        fontSize: 16, fontWeight: 700, cursor: qty > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', lineHeight: 1,
                      }}
                    >−</button>
                    <span style={{
                      width: 28, textAlign: 'center', fontSize: 14, fontWeight: 700,
                      color: qty > 0 ? '#1E73BE' : '#999',
                    }}>{qty}</span>
                    <button
                      onClick={() => setExtraQuantity(item, qty + 1)}
                      disabled={qty >= MAX_QTY}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: `1.5px solid ${qty < MAX_QTY ? '#1E73BE' : '#d1d5db'}`,
                        background: qty < MAX_QTY ? '#1E73BE' : '#f5f5f5',
                        color: qty < MAX_QTY ? '#fff' : '#ccc',
                        fontSize: 16, fontWeight: 700, cursor: qty < MAX_QTY ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', lineHeight: 1,
                      }}
                    >+</button>
                  </div>
                  {qty > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1E73BE', flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
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
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1E73BE' }}>{fmt(totalDisplay)}</span>
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
    <div style={{ fontFamily: 'sans-serif', background: '#f9fafb', minHeight: '100vh', margin: '-24px -16px', padding: '24px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 16px' }}>{t.title}</h2>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* ── Colonna sinistra: form ── */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 560 }}>

          {/* Mobile: accordion riepilogo */}
          <div className="step6-mobile-summary" style={{ display: 'none', border: '1px solid #e5e7eb', borderRadius: 14, marginBottom: 20, overflow: 'hidden' }}>
            <button
              onClick={() => setSummaryOpen(o => !o)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#111' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1E73BE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>1</span>
              </div>
              <p style={{ ...sectionTitle, margin: 0 }}>{t.sec1title.replace('1. ', '')}</p>
            </div>

            <label style={radioRow(paymentMethod === 'stripe')} onClick={() => setPaymentMethod('stripe')}>
              <div style={radioOuter(paymentMethod === 'stripe')}>
                {paymentMethod === 'stripe' && <div style={radioInner} />}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>{t.payFull}</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>{fmt(totalDisplay)}</p>
              </div>
            </label>

            <label style={radioRow(paymentMethod === 'paypal')} onClick={() => setPaymentMethod('paypal')}>
              <div style={radioOuter(paymentMethod === 'paypal')}>
                {paymentMethod === 'paypal' && <div style={radioInner} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>{t.payInstall}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#003087', background: '#e8f0fb', padding: '2px 8px', borderRadius: 4 }}>PayPal</span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>
                  {PAY_INSTALL_NOTE[loc]?.(installment) ?? ''}
                </p>
              </div>
            </label>

            {showPaypalFlexWarning && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginTop: 4, fontSize: 13, color: '#92400e' }}>
                ⚠️ {t.paypalFlexNote}
              </div>
            )}
          </div>


          {/* Sezione 2: Dati ospite */}
          <div style={sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1E73BE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>2</span>
              </div>
              <p style={{ ...sectionTitle, margin: 0 }}>{t.sec3title.replace('2. ', '')}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label={t.firstName} value={guestFirstName} onChange={v => setGuestField('guestFirstName', v)} autoComplete="given-name" />
              <Field label={t.lastName}  value={guestLastName}  onChange={v => setGuestField('guestLastName', v)}  autoComplete="family-name" />
            </div>
            <Field label={t.email}   value={guestEmail}   onChange={v => setGuestField('guestEmail', v)}   type="email"   autoComplete="email" style={{ marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label={t.phone}   value={guestPhone}   onChange={v => setGuestField('guestPhone', v)}   type="tel" autoComplete="tel" />
              <Field label={t.country} value={guestCountry} onChange={v => setGuestField('guestCountry', v)} autoComplete="country-name" />
            </div>
            <Field label={t.arrivalTime} value={guestArrivalTime} onChange={v => setGuestField('guestArrivalTime', v)} type="time" style={{ marginBottom: 10 }} />
            <div style={{ marginBottom: 0 }}>
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
            <div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
              <p style={{ margin: 0, color: '#c0392b', fontWeight: 600, fontSize: 14 }}>{t.errTitle}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{error}</p>
            </div>
          )}

          {/* CTA — mostra totale aggiornato */}
          <button
            onClick={handleVediRiepilogo}
            disabled={!formValid}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              fontSize: 17, fontWeight: 800, marginBottom: 10,
              background: formValid ? '#FCAF1A' : '#e0e0e0',
              color: formValid ? '#fff' : '#999',
              cursor: formValid ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {`${t.vediRiepilogo} → ${fmt(totalDisplay)}`}
          </button>

          <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', margin: '0 0 12px' }}>
            {t.terms}{' '}
            <a href={`/${locale}/condizioni`} style={{ color: '#1E73BE' }} target="_blank" rel="noopener noreferrer">{t.termsLink}</a>
          </p>
          <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#1E73BE', fontSize: 14, cursor: 'pointer', padding: 0, display: 'block' }}>
            {t.back}
          </button>
        </div>

        {/* ── Sidebar destra (desktop) ── */}
        <div className="step6-sidebar" style={{ width: 380, flexShrink: 0, border: '1px solid #e5e7eb', borderRadius: 16, padding: '22px 24px', position: 'sticky', top: 90, alignSelf: 'flex-start' }}>
          <SidebarContent />
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .step6-sidebar { display: none !important; }
          .step6-mobile-summary { display: block !important; }
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
        style={{ fontSize: 12, fontWeight: 600, color: '#111', background: 'none', border: '1px solid #ccc', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, marginLeft: 8, textDecoration: 'underline' }}
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
  border: '1px solid #e5e7eb', borderRadius: 14,
  padding: '20px', marginBottom: 16,
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
  border: `2px solid ${active ? '#1E73BE' : '#e5e7eb'}`,
  borderRadius: 12, background: active ? '#EEF5FC' : '#fff',
  transition: 'all 0.15s',
});
const radioOuter = (active: boolean): React.CSSProperties => ({
  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
  border: `2px solid ${active ? '#1E73BE' : '#ccc'}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#fff',
});
const radioInner: React.CSSProperties = {
  width: 10, height: 10, borderRadius: '50%', background: '#1E73BE',
};
