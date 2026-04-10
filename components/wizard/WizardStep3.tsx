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
    paying:        'Creazione prenotazione...',
    payingPaypal:  'Elaborazione PayPal...',
    back:          '← Modifica dati',
    errTitle:      'Errore',
    errBack:       'Torna indietro e riprova',
    perNight:      '/notte',
    voucher:       'Codice sconto',
    paypalLoading: 'Caricamento PayPal...',
  },
  en: {
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
    paying:        'Creating booking...',
    payingPaypal:  'Processing PayPal...',
    back:          '← Edit details',
    errTitle:      'Error',
    errBack:       'Go back and try again',
    perNight:      '/night',
    voucher:       'Discount code',
    paypalLoading: 'Loading PayPal...',
  },
  de: {
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
    paying:        'Buchung wird erstellt...',
    payingPaypal:  'PayPal wird verarbeitet...',
    back:          '← Daten bearbeiten',
    errTitle:      'Fehler',
    errBack:       'Zurück und erneut versuchen',
    perNight:      '/Nacht',
    voucher:       'Rabattcode',
    paypalLoading: 'PayPal wird geladen...',
  },
  pl: {
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
    paying:        'Tworzenie rezerwacji...',
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
    numAdult, numChild, childrenAges,
    checkIn, checkOut,
    selectedRoomId, selectedOfferId,
    cachedOffers,
    selectedExtras,
    voucherCode,
    paymentMethod,
    guestFirstName, guestLastName, guestEmail,
    guestPhone, guestCountry, guestArrivalTime, guestComments,
    pendingBookId, invoiceAmount,
    discountedPrice,
    setPendingBooking,
    prevStep, reset,
  } = useWizardStore();

  // ✅ Fase iniziale 'ready': Step3 è solo riepilogo, nessuna API al mount
  const [phase, setPhase]   = useState<'ready' | 'error' | 'paying'>('ready');
  const [error, setError]   = useState<string | null>(null);

  // PayPal SDK
  const [paypalReady, setPaypalReady]         = useState(false);
  const paypalContainerRef                    = useRef<HTMLDivElement>(null);
  const paypalButtonsRendered                 = useRef(false);
  // ✅ Ref per bookId creato durante il flusso PayPal
  const createdBookIdRef                      = useRef<number | null>(null);

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
  const offerName       = OFFER_NAMES[selectedOfferId ?? 0]?.[loc] ?? offer?.offerName ?? '';
  const cancelPolicy    = CANCEL_POLICY[selectedOfferId ?? 0]?.[loc] ?? '';

  const realPrice      = discountedPrice !== null ? discountedPrice : offerPrice;
  const hasDiscount    = discountedPrice !== null && discountedPrice < offerPrice;
  const discountAmount = hasDiscount ? offerPrice - discountedPrice! : 0;
  const extrasTotal    = (selectedExtras ?? []).reduce((sum: number, e: any) => sum + e.price * (e.quantity ?? 1), 0);
  const total          = realPrice + touristTax + extrasTotal;

  // ── Crea booking su Beds24 — chiamata solo al click del bottone Paga ──────
  // Restituisce il bookId oppure null se errore (setPhase('error') già chiamato)
  async function createBooking(): Promise<number | null> {
    if (!selectedRoomId || !checkIn || !checkOut) {
      setError('Dati mancanti. Torna indietro e riprova.');
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
      setError(e.message ?? 'Errore sconosciuto');
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
  // selezionato PayPal — qui aspettiamo solo che sia pronto
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
    script.onerror = () => setError('Impossibile caricare PayPal. Riprova o usa la carta.');
    document.head.appendChild(script);
  }, [paymentMethod]);

  // ── Renderizza i bottoni PayPal quando SDK è pronto ───────────────────────
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
        // Crea il booking su Beds24
        const bookId = await createBooking();
        if (!bookId) throw new Error('Errore creazione prenotazione');

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
          throw new Error(data.error ?? 'Errore creazione ordine PayPal');
        }
        return data.orderID;
      },

      // Utente ha approvato il pagamento su PayPal
      onApprove: async (data: { orderID: string }) => {
        setPhase('paying');
        const bookId = createdBookIdRef.current;
        if (!bookId) {
          setError('Errore: prenotazione non trovata');
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
          if (!res.ok || !result.ok) throw new Error(result.error ?? 'Errore cattura PayPal');

          reset();
          const origin = window.location.origin;
          window.location.href = `${origin}/${locale}/prenota/successo?bookingId=${bookId}&paypal=1`;

        } catch (e: any) {
          setError(e.message ?? 'Errore PayPal');
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
        setError('Errore PayPal. Riprova o usa la carta.');
        setPhase('ready');
        paypalButtonsRendered.current = false;
      },

      // Utente ha chiuso il popup PayPal senza pagare
      onCancel: () => {
        // Se il booking era stato creato, cancellalo
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
      setError(e.message ?? 'Errore sconosciuto');
      setPhase('ready');
    }
  }

  // ── Errore (dati mancanti) ─────────────────────────────────────────────────
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
        <div style={{ ...card, background: '#FFF8EC', border: '1px solid #fcd34d', borderLeft: '4px solid #FCAF1A' }}>
          <p style={{ ...labelStyle, color: '#B07820' }}>{t.cancelPolicy}</p>
          <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.6 }}>{cancelPolicy}</p>
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

        {/* Righe extras selezionati */}
        {(selectedExtras ?? []).map((extra: any) => (
          <PriceRow
            key={extra.id}
            label={`${extra.name[loc] ?? extra.name.it}${(extra.quantity ?? 1) > 1 ? ` ×${extra.quantity}` : ''}`}
            value={`+${fmt(extra.price * (extra.quantity ?? 1))}`}
          />
        ))}

        {touristTax > 0 && <PriceRow label={t.touristTax} value={fmt(touristTax)} />}
        {touristTax > 0 && <p style={{ fontSize: 11, color: '#9ca3af', margin: '-4px 0 12px' }}>{t.touristNote}</p>}

        <div style={{ height: 1, background: '#e5e7eb', margin: '12px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EEF5FC', borderRadius: 12, padding: '14px 16px', marginTop: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{t.total}</span>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#1E73BE', letterSpacing: '-0.02em' }}>{fmt(total)}</span>
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

      {/* Errore inline (dopo tentativo di pagamento fallito) */}
      {error && phase === 'ready' && (
        <div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#c0392b', fontWeight: 600, fontSize: 14 }}>{t.errTitle}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{error}</p>
        </div>
      )}

      {/* ── CTA: Stripe o PayPal ── */}
      {paymentMethod === 'stripe' ? (
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
        <div style={{ marginBottom: 12 }}>
          {!paypalReady && (
            <div style={{
              width: '100%', padding: '18px', borderRadius: 14,
              background: '#f0f4f8', textAlign: 'center',
              fontSize: 14, color: '#888',
            }}>
              ⏳ {t.paypalLoading}
            </div>
          )}
          <div
            ref={paypalContainerRef}
            id="paypal-button-container"
            style={{ display: paypalReady && phase !== 'paying' ? 'block' : 'none' }}
          />
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
  fontSize: 11, fontWeight: 700, color: '#1E73BE',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px',
};
