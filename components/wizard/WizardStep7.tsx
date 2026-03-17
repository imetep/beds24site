'use client';

import { useState, useEffect, useRef } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';

const OFFER_NAMES: Record<number, Record<string, string>> = {
  1: { it:'Non Rimborsabile',          en:'Non-Refundable',        de:'Nicht erstattungsfähig',  pl:'Bezzwrotna' },
  2: { it:'Parzialmente Rimborsabile', en:'Partially Refundable',  de:'Teilw. erstattungsfähig', pl:'Częściowo zwrotna' },
  3: { it:'Flessibile 60 gg',          en:'Flexible 60 days',      de:'Flexibel 60 Tage',        pl:'Elastyczna 60 dni' },
  4: { it:'Flessibile 45 gg',          en:'Flexible 45 days',      de:'Flexibel 45 Tage',        pl:'Elastyczna 45 dni' },
  5: { it:'Flessibile 30 gg',          en:'Flexible 30 days',      de:'Flexibel 30 Tage',        pl:'Elastyczna 30 dni' },
  6: { it:'Flessibile 5 gg',           en:'Flexible 5 days',       de:'Flexibel 5 Tage',         pl:'Elastyczna 5 dni' },
};

const CANCEL_POLICY: Record<number, Record<string, string>> = {
  1: { it:'Pagamento non rimborsabile entro 48h dalla prenotazione.',                   en:'Non-refundable payment within 48h of booking.',           de:'Nicht erstattungsfähige Zahlung innerhalb 48h.',          pl:'Bezzwrotna płatność w ciągu 48h od rezerwacji.' },
  2: { it:'50% subito, saldo all\'arrivo. Cancellazione parzialmente rimborsabile.',    en:'50% now, balance at arrival. Partially refundable.',       de:'50% jetzt, Rest bei Ankunft. Teilweise erstattungsfähig.', pl:'50% teraz, reszta przy przyjeździe. Częściowo zwrotna.' },
  3: { it:'Cancellazione gratuita fino a 60 giorni prima dell\'arrivo.',                en:'Free cancellation up to 60 days before arrival.',          de:'Kostenlose Stornierung bis 60 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 60 dni przed przyjazdem.' },
  4: { it:'Cancellazione gratuita fino a 45 giorni prima dell\'arrivo.',                en:'Free cancellation up to 45 days before arrival.',          de:'Kostenlose Stornierung bis 45 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 45 dni przed przyjazdem.' },
  5: { it:'Cancellazione gratuita fino a 30 giorni prima dell\'arrivo.',                en:'Free cancellation up to 30 days before arrival.',          de:'Kostenlose Stornierung bis 30 Tage vor Ankunft.',         pl:'Bezpłatne anulowanie do 30 dni przed przyjazdem.' },
  6: { it:'Cancellazione gratuita fino a 5 giorni prima dell\'arrivo.',                 en:'Free cancellation up to 5 days before arrival.',           de:'Kostenlose Stornierung bis 5 Tage vor Ankunft.',          pl:'Bezpłatne anulowanie do 5 dni przed przyjazdem.' },
};

const UI: Record<string, Record<string, string>> = {
  it: {
    loadingTitle:  'Stiamo verificando la disponibilità...',
    loadingSub:    'Un momento, stiamo calcolando il prezzo finale con il tuo codice sconto.',
    title:         'Riepilogo prenotazione',
    subtitle:      'Controlla i dettagli e procedi al pagamento',
    apartment:     'Appartamento',
    dates:         'Date soggiorno',
    guests:        'Ospiti',
    adults:        'adulti',
    children:      'bambini',
    nights:        'notti',
    night:         'notte',
    rate:          'Tariffa',
    cancelPolicy:  'Politica di cancellazione',
    priceDetail:   'Dettaglio prezzo',
    basePrice:     'Soggiorno',
    discount:      'Sconto voucher',
    touristTax:    'Imposta di soggiorno',
    touristNote:   '€2/pers/notte · max 10 notti · esenti under 12',
    total:         'TOTALE',
    guestData:     'Dati ospite',
    name:          'Nome',
    email:         'Email',
    phone:         'Telefono',
    country:       'Paese',
    arrival:       'Ora arrivo',
    notes:         'Richieste speciali',
    payBtn:        'Conferma e paga con Carta',
    payBtnPaypal:  'Paga con PayPal',
    paying:        'Reindirizzamento al pagamento...',
    payingPaypal:  'Elaborazione PayPal...',
    back:          '← Modifica dati',
    errTitle:      'Errore',
    errBack:       'Torna indietro e riprova',
    perNight:      '/notte',
    voucher:       'Codice sconto',
    paypalLoading: 'Caricamento PayPal...',
  },
  en: {
    loadingTitle:  'Checking availability...',
    loadingSub:    'One moment, we\'re calculating your final price with the discount code.',
    title:         'Booking summary',
    subtitle:      'Check the details and proceed to payment',
    apartment:     'Apartment',
    dates:         'Stay dates',
    guests:        'Guests',
    adults:        'adults',
    children:      'children',
    nights:        'nights',
    night:         'night',
    rate:          'Rate',
    cancelPolicy:  'Cancellation policy',
    priceDetail:   'Price breakdown',
    basePrice:     'Accommodation',
    discount:      'Voucher discount',
    touristTax:    'Tourist tax',
    touristNote:   '€2/pers/night · max 10 nights · under 12 exempt',
    total:         'TOTAL',
    guestData:     'Guest details',
    name:          'Name',
    email:         'Email',
    phone:         'Phone',
    country:       'Country',
    arrival:       'Arrival time',
    notes:         'Special requests',
    payBtn:        'Confirm and pay by Card',
    payBtnPaypal:  'Pay with PayPal',
    paying:        'Redirecting to payment...',
    payingPaypal:  'Processing PayPal...',
    back:          '← Edit details',
    errTitle:      'Error',
    errBack:       'Go back and try again',
    perNight:      '/night',
    voucher:       'Discount code',
    paypalLoading: 'Loading PayPal...',
  },
  de: {
    loadingTitle:  'Verfügbarkeit wird geprüft...',
    loadingSub:    'Einen Moment, wir berechnen Ihren Endpreis mit dem Rabattcode.',
    title:         'Buchungsübersicht',
    subtitle:      'Details prüfen und zur Zahlung fortfahren',
    apartment:     'Unterkunft',
    dates:         'Aufenthaltsdaten',
    guests:        'Gäste',
    adults:        'Erwachsene',
    children:      'Kinder',
    nights:        'Nächte',
    night:         'Nacht',
    rate:          'Tarif',
    cancelPolicy:  'Stornierungsbedingungen',
    priceDetail:   'Preisdetails',
    basePrice:     'Unterkunft',
    discount:      'Gutscheinrabatt',
    touristTax:    'Kurtaxe',
    touristNote:   '€2/Pers/Nacht · max. 10 Nächte · Kinder unter 12 befreit',
    total:         'GESAMT',
    guestData:     'Gastdaten',
    name:          'Name',
    email:         'E-Mail',
    phone:         'Telefon',
    country:       'Land',
    arrival:       'Ankunftszeit',
    notes:         'Besondere Wünsche',
    payBtn:        'Bestätigen und mit Karte bezahlen',
    payBtnPaypal:  'Mit PayPal bezahlen',
    paying:        'Weiterleitung zur Zahlung...',
    payingPaypal:  'PayPal wird verarbeitet...',
    back:          '← Daten bearbeiten',
    errTitle:      'Fehler',
    errBack:       'Zurück und erneut versuchen',
    perNight:      '/Nacht',
    voucher:       'Rabattcode',
    paypalLoading: 'PayPal wird geladen...',
  },
  pl: {
    loadingTitle:  'Sprawdzamy dostępność...',
    loadingSub:    'Chwilę, obliczamy ostateczną cenę z kodem rabatowym.',
    title:         'Podsumowanie rezerwacji',
    subtitle:      'Sprawdź szczegóły i przejdź do płatności',
    apartment:     'Apartament',
    dates:         'Daty pobytu',
    guests:        'Goście',
    adults:        'dorośli',
    children:      'dzieci',
    nights:        'nocy',
    night:         'noc',
    rate:          'Taryfa',
    cancelPolicy:  'Polityka anulowania',
    priceDetail:   'Szczegóły ceny',
    basePrice:     'Zakwaterowanie',
    discount:      'Zniżka voucher',
    touristTax:    'Opłata turystyczna',
    touristNote:   '€2/os./noc · maks. 10 nocy · dzieci poniżej 12 lat zwolnione',
    total:         'ŁĄCZNIE',
    guestData:     'Dane gościa',
    name:          'Imię i nazwisko',
    email:         'E-mail',
    phone:         'Telefon',
    country:       'Kraj',
    arrival:       'Godzina przyjazdu',
    notes:         'Specjalne życzenia',
    payBtn:        'Potwierdź i zapłać kartą',
    payBtnPaypal:  'Zapłać przez PayPal',
    paying:        'Przekierowanie do płatności...',
    payingPaypal:  'Przetwarzanie PayPal...',
    back:          '← Edytuj dane',
    errTitle:      'Błąd',
    errBack:       'Wróć i spróbuj ponownie',
    perNight:      '/noc',
    voucher:       'Kod rabatowy',
    paypalLoading: 'Ładowanie PayPal...',
  },
};

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
    { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
  );
}

interface Props { locale?: string; }

export default function WizardStep7({ locale = 'it' }: Props) {
  const t   = UI[locale] ?? UI.it;
  const loc = locale in UI ? locale : 'it';

  const {
    numAdult, numChild, numUnder12,
    checkIn, checkOut,
    selectedRoomId, selectedOfferId,
    cachedOffers,
    voucherCode,
    paymentMethod,       // ← leggiamo dal store
    guestFirstName, guestLastName, guestEmail,
    guestPhone, guestCountry, guestArrivalTime, guestComments,
    pendingBookId, invoiceAmount,
    discountedPrice,
    setPendingBooking,
    prevStep, reset,
  } = useWizardStore();

  // Tre stati principali: 'loading' | 'ready' | 'error' | 'paying'
  const [phase, setPhase]         = useState<'loading' | 'ready' | 'error' | 'paying'>('loading');
  const [error, setError]         = useState<string | null>(null);
  const createdRef                = useRef(false); // evita doppia chiamata in StrictMode

  // PayPal SDK
  const [paypalReady, setPaypalReady]   = useState(false);
  const paypalContainerRef              = useRef<HTMLDivElement>(null);
  const paypalButtonsRendered           = useRef(false); // evita doppio render dei bottoni

  const room   = getRoomData(selectedRoomId);
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;

  const offer = cachedOffers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerPrice: number = offer?.price ?? 0;

  const taxableNights  = Math.min(nights, 10);
  const taxableAdults  = Math.max(0, numAdult - numUnder12);
  const touristTax     = taxableNights * taxableAdults * 2;
  const perNight       = nights > 0 && offerPrice > 0 ? Math.round(offerPrice / nights) : 0;
  const offerName      = OFFER_NAMES[selectedOfferId ?? 0]?.[loc] ?? offer?.offerName ?? '';
  const cancelPolicy   = CANCEL_POLICY[selectedOfferId ?? 0]?.[loc] ?? '';

  const realPrice      = discountedPrice !== null ? discountedPrice : offerPrice;
  const hasDiscount    = discountedPrice !== null && discountedPrice < offerPrice;
  const discountAmount = hasDiscount ? offerPrice - discountedPrice! : 0;
  const total          = realPrice + touristTax;

  // ── Crea booking all'entrata nello step ───────────────────────────────────
  useEffect(() => {
    if (createdRef.current) return;
    if (pendingBookId) { setPhase('ready'); return; }
    createdRef.current = true;
    createBooking();
  }, []);

  async function createBooking() {
    if (!selectedRoomId || !checkIn || !checkOut) {
      setError('Dati mancanti. Torna indietro e riprova.');
      setPhase('error');
      return;
    }
    setPhase('loading');
    try {
      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:           selectedRoomId,
          checkIn, checkOut,
          numAdult, numChild,
          offerId:          selectedOfferId,
          voucherCode:      voucherCode || undefined,
          guestFirstName:   guestFirstName.trim(),
          guestName:        guestLastName.trim(),
          guestEmail:       guestEmail.trim(),
          guestPhone:       guestPhone.trim() || undefined,
          guestCountry:     guestCountry.trim() || undefined,
          guestArrivalTime: guestArrivalTime.trim() || undefined,
          guestComments:    guestComments.trim() || undefined,
        }),
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok || !bookData.ok) throw new Error(bookData.error ?? `HTTP ${bookRes.status}`);

      setPendingBooking(bookData.bookId, bookData.invoiceAmount ?? null);
      setPhase('ready');

    } catch (e: any) {
      setError(e.message ?? 'Errore sconosciuto');
      setPhase('error');
    }
  }

  // ── Carica PayPal SDK dinamicamente (solo se paymentMethod === 'paypal') ──
  useEffect(() => {
    if (paymentMethod !== 'paypal') return;
    // Evita di caricare lo script due volte
    if (document.getElementById('paypal-sdk-script')) {
      setPaypalReady(true);
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.error('[PayPal] NEXT_PUBLIC_PAYPAL_CLIENT_ID non configurato');
      return;
    }
    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture`;
    script.onload = () => setPaypalReady(true);
    script.onerror = () => setError('Impossibile caricare PayPal. Riprova o usa la carta.');
    document.head.appendChild(script);
  }, [paymentMethod]);

  // ── Renderizza i bottoni PayPal quando SDK pronto + booking creato ─────────
  useEffect(() => {
    if (!paypalReady) return;
    if (phase !== 'ready') return;
    if (!pendingBookId) return;
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

      // Crea ordine PayPal sul nostro server
      createOrder: async () => {
        const res = await fetch('/api/paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount:      total,
            bookingId:   pendingBookId,
            description: `LivingApple · ${room?.name ?? ''} · ${checkIn} → ${checkOut}`,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.orderID) {
          throw new Error(data.error ?? 'Errore creazione ordine PayPal');
        }
        return data.orderID;
      },

      // Guest ha approvato — cattura il pagamento
      onApprove: async (data: { orderID: string }) => {
        setPhase('paying');
        try {
          const res = await fetch('/api/paypal-capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderID:   data.orderID,
              bookingId: pendingBookId,
            }),
          });
          const result = await res.json();
          if (!res.ok || !result.ok) throw new Error(result.error ?? 'Errore cattura PayPal');

          // Successo: redirect alla pagina di conferma
          reset();
          const origin = window.location.origin;
          window.location.href = `${origin}/${locale}/prenota/successo?bookingId=${pendingBookId}&paypal=1`;

        } catch (e: any) {
          setError(e.message ?? 'Errore PayPal');
          setPhase('ready');
          paypalButtonsRendered.current = false; // consente re-render dei bottoni
        }
      },

      // Errore PayPal (es. popup chiuso, errore di rete)
      onError: (err: any) => {
        console.error('[PayPal] onError:', err);
        setError('Errore PayPal. Riprova o usa la carta.');
        setPhase('ready');
        paypalButtonsRendered.current = false;
      },

      // Guest ha chiuso il popup senza pagare — non è un errore, non fare nulla
      onCancel: () => {
        paypalButtonsRendered.current = false;
      },

    }).render(paypalContainerRef.current);

  }, [paypalReady, phase, pendingBookId, total]);

  // ── Torna indietro — cancella il booking pendente ─────────────────────────
  async function handleBack() {
    if (pendingBookId) {
      fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: pendingBookId }),
      }).catch(() => {});
      setPendingBooking(null, null);
    }
    prevStep();
  }

  // ── Paga con Stripe ───────────────────────────────────────────────────────
  async function handlePagaStripe() {
    if (!pendingBookId) return;
    setPhase('paying');
    try {
      const stripeRes = await fetch('/api/stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:   pendingBookId,
          amount:      total,
          offerId:     selectedOfferId,
          locale,
          description: `LivingApple · ${room?.name ?? ''} · ${checkIn} → ${checkOut}`,
        }),
      });
      const stripeData = await stripeRes.json();
      if (!stripeRes.ok || !stripeData.ok) throw new Error(stripeData.error ?? `HTTP ${stripeRes.status}`);

      reset();
      window.location.href = stripeData.url;

    } catch (e: any) {
      setError(e.message ?? 'Errore sconosciuto');
      setPhase('ready');
    }
  }

  // ── Loading (creazione booking) ────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <div style={{
          width: 44, height: 44,
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #1E73BE',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Errore (creazione booking fallita) ─────────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', fontFamily: 'sans-serif', padding: '0 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#c0392b', margin: '0 0 10px' }}>{t.errTitle}</h2>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px', lineHeight: 1.6 }}>{error}</p>
        <button
          onClick={handleBack}
          style={{ padding: '12px 28px', borderRadius: 10, border: '1.5px solid #1E73BE', background: '#fff', color: '#1E73BE', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {t.errBack}
        </button>
      </div>
    );
  }

  // ── Riepilogo ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'sans-serif', padding: '0 2px' }}>

      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>{t.title}</h2>
      <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>{t.subtitle}</p>

      {/* Card appartamento + date */}
      <div style={card}>
        <Row label={t.apartment} value={room?.name ?? '—'} />
        {checkIn && checkOut && (
          <Row label={t.dates} value={`${formatDate(checkIn, locale)} → ${formatDate(checkOut, locale)}`} />
        )}
        {nights > 0 && <Row label="" value={`${nights} ${nights === 1 ? t.night : t.nights}`} dimmed />}
        <Row label={t.guests} value={`${numAdult} ${t.adults}${numChild > 0 ? `, ${numChild} ${t.children}` : ''}`} />
        <Row label={t.rate} value={offerName} />
      </div>

      {/* Politica cancellazione */}
      {cancelPolicy && (
        <div style={{ ...card, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <p style={labelStyle}>{t.cancelPolicy}</p>
          <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.6 }}>{cancelPolicy}</p>
        </div>
      )}

      {/* Dettaglio prezzo */}
      <div style={card}>
        <p style={labelStyle}>{t.priceDetail}</p>

        <PriceRow
          label={`${nights} ${nights === 1 ? t.night : t.nights} × ${fmt(perNight)}${t.perNight}`}
          value={fmt(offerPrice)}
        />

        {hasDiscount && (
          <PriceRow
            label={`✓ ${t.discount}${voucherCode ? ` (${voucherCode})` : ''}`}
            value={`− ${fmt(discountAmount)}`}
            green
          />
        )}

        {touristTax > 0 && <PriceRow label={t.touristTax} value={fmt(touristTax)} />}
        {touristTax > 0 && <p style={{ fontSize: 11, color: '#9ca3af', margin: '-4px 0 12px' }}>{t.touristNote}</p>}

        <div style={{ height: 1, background: '#e5e7eb', margin: '12px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{t.total}</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#1E73BE' }}>{fmt(total)}</span>
        </div>

        {hasDiscount && (
          <p style={{ fontSize: 12, color: '#27ae60', margin: '6px 0 0', textAlign: 'right', fontWeight: 600 }}>
            Hai risparmiato {fmt(discountAmount)} 🎉
          </p>
        )}
      </div>

      {/* Dati ospite */}
      <div style={card}>
        <p style={labelStyle}>{t.guestData}</p>
        <Row label={t.name}  value={`${guestFirstName} ${guestLastName}`} />
        <Row label={t.email} value={guestEmail} />
        {guestPhone       && <Row label={t.phone}   value={guestPhone} />}
        {guestCountry     && <Row label={t.country} value={guestCountry} />}
        {guestArrivalTime && <Row label={t.arrival} value={guestArrivalTime} />}
        {guestComments    && <Row label={t.notes}   value={guestComments} />}
      </div>

      {/* Errore pagamento (mostrato in fase 'ready' dopo un tentativo fallito) */}
      {error && phase === 'ready' && (
        <div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#c0392b', fontWeight: 600, fontSize: 14 }}>{t.errTitle}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{error}</p>
        </div>
      )}

      {/* ── CTA: Stripe o PayPal ── */}
      {paymentMethod === 'stripe' ? (
        // ── Bottone Stripe (comportamento invariato) ──
        <button
          onClick={handlePagaStripe}
          disabled={phase === 'paying'}
          style={{
            width: '100%', padding: '18px', borderRadius: 14, border: 'none',
            fontSize: 18, fontWeight: 900, marginBottom: 12,
            background: phase === 'paying' ? '#e0e0e0' : '#FCAF1A',
            color: phase === 'paying' ? '#999' : '#fff',
            cursor: phase === 'paying' ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            boxShadow: phase === 'paying' ? 'none' : '0 4px 14px rgba(252,175,26,0.4)',
            letterSpacing: '0.02em',
          }}
        >
          {phase === 'paying'
            ? `⏳ ${t.paying}`
            : `💳 ${t.payBtn} · ${fmt(total)}`
          }
        </button>
      ) : (
        // ── Bottone PayPal (SDK dinamico) ──
        <div style={{ marginBottom: 12 }}>
          {/* Mostra spinner mentre SDK carica */}
          {!paypalReady && (
            <div style={{
              width: '100%', padding: '18px', borderRadius: 14,
              background: '#f0f4f8', textAlign: 'center',
              fontSize: 14, color: '#888',
            }}>
              ⏳ {t.paypalLoading}
            </div>
          )}
          {/* Div dove PayPal SDK monta i suoi bottoni */}
          <div
            ref={paypalContainerRef}
            id="paypal-button-container"
            style={{ display: paypalReady && phase !== 'paying' ? 'block' : 'none' }}
          />
          {/* Spinner durante la cattura del pagamento */}
          {phase === 'paying' && (
            <div style={{
              width: '100%', padding: '18px', borderRadius: 14,
              background: '#e0e0e0', textAlign: 'center',
              fontSize: 14, color: '#999', fontWeight: 600,
            }}>
              ⏳ {t.payingPaypal}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleBack}
        disabled={phase === 'paying'}
        style={{ background: 'none', border: 'none', color: '#1E73BE', fontSize: 14, cursor: 'pointer', padding: 0 }}
      >
        {t.back}
      </button>

    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Row({ label, value, dimmed }: { label: string; value: string; dimmed?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 }}>
      {label
        ? <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, flexShrink: 0, minWidth: 100 }}>{label}</span>
        : <span />
      }
      <span style={{ fontSize: 13, color: dimmed ? '#9ca3af' : '#111', textAlign: 'right', lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function PriceRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 14, color: green ? '#27ae60' : '#444' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: green ? '#27ae60' : '#111' }}>{value}</span>
    </div>
  );
}

const card: React.CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: 16,
  padding: '20px 22px', marginBottom: 16, background: '#fff',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px',
};
