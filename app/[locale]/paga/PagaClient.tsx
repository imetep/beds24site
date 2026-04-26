'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PROPERTIES } from '@/config/properties';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

// ─── UI translations ──────────────────────────────────────────────────────────

const UI: Record<string, Record<string, string>> = {
  it: {
    title: 'Riepilogo prenotazione', subtitle: 'Verifica i dettagli e procedi al pagamento',
    apartment: 'Appartamento', dates: 'Date', guests: 'Ospiti',
    night: 'notte', nights: 'notti', adults: 'adulti', children: 'bambini',
    guestData: 'Dati ospite', name: 'Nome', email: 'Email',
    priceDetail: 'Dettaglio prezzo', totalBooking: 'Totale prenotazione',
    deposit: 'Acconto richiesto', remaining: 'Saldo residuo',
    touristTax: 'Imposta di soggiorno',
    payBtn: 'Paga acconto', paying: 'Elaborazione...', paid: 'Pagamento completato',
    paypalLoading: 'Caricamento PayPal...', payingPaypal: 'Elaborazione PayPal...',
    loading: 'Caricamento prenotazione...', notFound: 'Prenotazione non trovata.',
    errTitle: 'Errore', chooseMethod: 'Metodo di pagamento',
    energy: 'Consumi energetici a consumo — contatori in ogni abitazione',
    energyLink: 'Tariffe e consigli →', energyHref: '/it/utenze',
    deposit_info: 'Deposito cauzionale: verrà richiesto separatamente',
    depositLink: 'Come funziona il deposito →', depositHref: '/it/deposito',
  },
  en: {
    title: 'Booking summary', subtitle: 'Check the details and proceed to payment',
    apartment: 'Apartment', dates: 'Dates', guests: 'Guests',
    night: 'night', nights: 'nights', adults: 'adults', children: 'children',
    guestData: 'Guest details', name: 'Name', email: 'Email',
    priceDetail: 'Price breakdown', totalBooking: 'Total booking',
    deposit: 'Deposit requested', remaining: 'Remaining balance',
    touristTax: 'Tourist tax',
    payBtn: 'Pay deposit', paying: 'Processing...', paid: 'Payment completed',
    paypalLoading: 'Loading PayPal...', payingPaypal: 'Processing PayPal...',
    loading: 'Loading booking...', notFound: 'Booking not found.',
    errTitle: 'Error', chooseMethod: 'Payment method',
    energy: 'Energy billed by actual usage — meters in each unit',
    energyLink: 'Rates and tips →', energyHref: '/en/utilities',
    deposit_info: 'Security deposit: will be requested separately',
    depositLink: 'How it works →', depositHref: '/en/deposito',
  },
  de: {
    title: 'Buchungsübersicht', subtitle: 'Details prüfen und zur Zahlung fortfahren',
    apartment: 'Unterkunft', dates: 'Daten', guests: 'Gäste',
    night: 'Nacht', nights: 'Nächte', adults: 'Erwachsene', children: 'Kinder',
    guestData: 'Gastdaten', name: 'Name', email: 'E-Mail',
    priceDetail: 'Preisdetails', totalBooking: 'Gesamtpreis',
    deposit: 'Angeforderter Anzahlung', remaining: 'Restbetrag',
    touristTax: 'Kurtaxe',
    payBtn: 'Anzahlung bezahlen', paying: 'Verarbeitung...', paid: 'Zahlung abgeschlossen',
    paypalLoading: 'PayPal wird geladen...', payingPaypal: 'PayPal wird verarbeitet...',
    loading: 'Buchung wird geladen...', notFound: 'Buchung nicht gefunden.',
    errTitle: 'Fehler', chooseMethod: 'Zahlungsmethode',
    energy: 'Energiekosten nach Verbrauch — Zähler in jeder Einheit',
    energyLink: 'Tarife und Tipps →', energyHref: '/de/energie',
    deposit_info: 'Kaution: wird separat angefordert',
    depositLink: 'So funktioniert sie →', depositHref: '/de/deposito',
  },
  pl: {
    title: 'Podsumowanie rezerwacji', subtitle: 'Sprawdź szczegóły i przejdź do płatności',
    apartment: 'Apartament', dates: 'Daty', guests: 'Goście',
    night: 'noc', nights: 'nocy', adults: 'dorośli', children: 'dzieci',
    guestData: 'Dane gościa', name: 'Imię', email: 'E-mail',
    priceDetail: 'Szczegóły ceny', totalBooking: 'Łączna rezerwacja',
    deposit: 'Wymagana zaliczka', remaining: 'Pozostałe saldo',
    touristTax: 'Opłata turystyczna',
    payBtn: 'Zapłać zaliczkę', paying: 'Przetwarzanie...', paid: 'Płatność zakończona',
    paypalLoading: 'Ładowanie PayPal...', payingPaypal: 'Przetwarzanie PayPal...',
    loading: 'Ładowanie rezerwacji...', notFound: 'Rezerwacja nie znaleziona.',
    errTitle: 'Błąd', chooseMethod: 'Metoda płatności',
    energy: 'Koszty energii według zużycia — liczniki w każdym lokalu',
    energyLink: 'Taryfy i wskazówki →', energyHref: '/pl/media',
    deposit_info: 'Kaucja: zostanie pobrana oddzielnie',
    depositLink: 'Jak działa →', depositHref: '/pl/deposito',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

function formatDate(ymd: string, locale: string) {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
}

// ─── Componente principale ────────────────────────────────────────────────────

interface BookingInfo {
  bookId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  numAdult: number;
  numChild: number;
  guestName: string;
  guestEmail: string;
  price: number;
  status: string;
  offerId: number;
  roomName: string;
}

interface Props { locale: string; }

export default function PagaClient({ locale }: Props) {
  const t = UI[locale] ?? UI.it;
  const tSidebar = getTranslations(locale as Locale).components.wizardSidebar;
  const searchParams = useSearchParams();
  const bookId  = searchParams.get('bookId') ?? '';
  const pct     = Number(searchParams.get('pct') ?? '100');
  const validPct = Math.min(100, Math.max(1, pct));

  const [booking,       setBooking]       = useState<BookingInfo | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [phase,         setPhase]         = useState<'ready' | 'paying' | 'done'>('ready');
  const [payMethod,     setPayMethod]     = useState<'stripe' | 'paypal'>('stripe');
  const [paypalReady,   setPaypalReady]   = useState(false);
  const [coverUrl,      setCoverUrl]      = useState<string | null>(null);
  const sdkInstanceRef   = useRef<any>(null);
  const paypalSessionRef = useRef<any>(null);

  // Carica dati prenotazione da Beds24
  useEffect(() => {
    if (!bookId) { setLoading(false); setError('bookId mancante'); return; }
    fetch(`/api/booking-info?bookId=${bookId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) throw new Error(data.error ?? 'Errore');
        setBooking(data.booking);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookId]);

  // Carica cover Cloudinary dell'unità (stessa logica di WizardStep3 / BookingSidebar)
  useEffect(() => {
    if (!booking) { setCoverUrl(null); return; }
    const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === booking.roomId);
    if (!room?.cloudinaryFolder) { setCoverUrl(null); return; }
    fetchCoversCached().then(covers => setCoverUrl(covers?.[room.cloudinaryFolder] ?? null));
  }, [booking]);

  // Carica PayPal SDK v6 + crea session one-time
  useEffect(() => {
    if (payMethod !== 'paypal' || !booking) return;

    let cancelled = false;
    (async () => {
      try {
        const tkRes  = await fetch('/api/paypal-client-token', { method: 'POST' });
        const tkData = await tkRes.json();
        if (cancelled || !tkRes.ok || !tkData.clientToken) return;

        const host = tkData.mode === 'sandbox' ? 'www.sandbox.paypal.com' : 'www.paypal.com';
        const src  = `https://${host}/web-sdk/v6/core`;
        const existing = document.getElementById('paypal-sdk-script') as HTMLScriptElement | null;
        if (!existing || existing.src !== src) {
          if (existing) existing.remove();
          const script = document.createElement('script');
          script.id    = 'paypal-sdk-script';
          script.src   = src;
          script.async = true;
          await new Promise<void>((resolve, reject) => {
            script.onload  = () => resolve();
            script.onerror = () => reject(new Error('load failed'));
            document.body.appendChild(script);
          });
        }
        if (cancelled) return;

        const paypal = (window as any).paypal;
        if (!paypal?.createInstance) return;
        // v6 one-time: clientId è sufficiente. clientToken JWT serve solo
        // per componenti avanzati (Fastlane) non usati in /paga.
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) return;
        const instance = await paypal.createInstance({
          clientId,
          components: ['paypal-payments'],
          pageType:   'checkout',
        });
        if (cancelled) return;
        sdkInstanceRef.current = instance;

        const depositAmount = Math.round(booking.price * validPct / 100 * 100) / 100;

        paypalSessionRef.current = instance.createPayPalOneTimePaymentSession({
          onApprove: async (data: { orderId: string }) => {
            setPhase('paying');
            try {
              const res = await fetch('/api/paypal-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderID:   data.orderId,
                  bookingId: booking.bookId,
                  amount:    depositAmount,
                }),
              });
              const d = await res.json();
              if (!res.ok || !d.ok) throw new Error(d.error ?? 'capture failed');
              setPhase('done');
            } catch (e: any) {
              setError(e.message ?? 'Errore PayPal');
              setPhase('ready');
            }
          },
          onCancel: () => setPhase('ready'),
          onError:  () => setError('Errore PayPal. Riprova.'),
        });

        setPaypalReady(true);
      } catch {
        setError('Impossibile caricare PayPal.');
      }
    })();

    return () => { cancelled = true; };
  }, [payMethod, booking, validPct]);

  async function handlePayPalClick() {
    if (!booking || !paypalSessionRef.current) return;
    const depositAmount = Math.round(booking.price * validPct / 100 * 100) / 100;

    const createOrderPromise = (async () => {
      const res = await fetch('/api/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.bookId, amount: depositAmount }),
      });
      const d = await res.json();
      if (!res.ok || !d.orderID) throw new Error(d.error ?? 'order failed');
      // v6 vuole un oggetto { orderId }, non la stringa diretta
      return { orderId: d.orderID as string };
    })();

    try {
      await paypalSessionRef.current.start(
        { presentationMode: 'auto' },
        createOrderPromise,
      );
    } catch (e: any) {
      setError(e?.message ?? 'Errore PayPal');
    }
  }

  async function handleStripe() {
    if (!booking) return;
    setPhase('paying');
    const depositAmount = Math.round(booking.price * validPct / 100 * 100) / 100;
    try {
      const res = await fetch('/api/stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:   booking.bookId,
          amount:      depositAmount,
          offerId:     booking.offerId,
          locale,
          description: `LivingApple · ${booking.roomName} · ${booking.checkIn} → ${booking.checkOut}`,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      window.location.href = d.url;
    } catch (e: any) {
      setError(e.message);
      setPhase('ready');
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-loading page-loading--tall">
      <div className="page-loading__spinner" />
      {t.loading}
    </div>
  );

  if (error && !booking) return (
    <div className="page-state">
      <div className="page-state__icon page-state__icon--lg page-state__icon--error">
        <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
      </div>
      <h2 className="page-state__title page-state__title--error">{t.errTitle}</h2>
      <p className="page-state__text">{error}</p>
    </div>
  );

  if (!booking) return null;

  const nights = calcNights(booking.checkIn, booking.checkOut);
  const perNight = nights > 0 ? Math.round(booking.price / nights) : 0;
  const depositAmount = Math.round(booking.price * validPct / 100 * 100) / 100;
  const remaining = Math.round((booking.price - depositAmount) * 100) / 100;
  const room = PROPERTIES.flatMap(p => p.rooms).find(r => r.roomId === booking.roomId);

  // ── Done ───────────────────────────────────────────────────────────────────
  if (phase === 'done') return (
    <div className="page-state">
      <div className="page-state__icon page-state__icon--xl page-state__icon--success">
        <i className="bi bi-check-circle-fill" aria-hidden="true" />
      </div>
      <h2 className="page-state__title page-state__title--success">{t.paid}</h2>
      <p className="page-state__text">{booking.guestName} · {booking.guestEmail}</p>
    </div>
  );

  return (
    <div className="wizard-step3">
      <h2 className="section-title-main">{t.title}</h2>
      <p className="wizard-step3__subtitle">{t.subtitle}</p>

      {/* Card 1 — Riepilogo soggiorno + prezzo */}
      <div className="card-info">

        {/* Hero foto full-width + nome + meta (typeLabel · sqm · people) — pattern BookingSidebar wizardstep2 */}
        {coverUrl && (
          <div className="booking-sidebar__hero">
            <img
              src={coverUrl}
              alt={room?.name ?? booking.roomName ?? ''}
              className="booking-sidebar__hero-img"
              loading="lazy"
            />
          </div>
        )}
        <p className="section-title-secondary">{room?.name ?? booking.roomName ?? '—'}</p>
        {room && (
          <p className="label-metadata">
            {room.type === 'monolocale' ? tSidebar.typeMonolocale
              : room.type === 'villa' ? tSidebar.typeVilla
              : tSidebar.typeAppartamento}
            {' · '}{room.sqm} {tSidebar.sqm}
            {' · '}{room.maxPeople} {tSidebar.people}
          </p>
        )}

        <hr className="divider-horizontal" />

        {/* Dati chiave: Date (con notti come suffisso) / Ospiti — niente duplicazione */}
        <dl className="wizard-step3__data-grid">
          <dt>{t.dates}</dt>
          <dd>
            {formatDate(booking.checkIn, locale)} – {formatDate(booking.checkOut, locale)}
            {nights > 0 && ` · ${nights} ${nights === 1 ? t.night : t.nights}`}
          </dd>
          <dt>{t.guests}</dt>
          <dd>{booking.numAdult} {t.adults}{booking.numChild > 0 ? `, ${booking.numChild} ${t.children}` : ''}</dd>
        </dl>

        <hr className="divider-horizontal" />

        {/* Dettaglio prezzo */}
        <p className="label-uppercase-muted">{t.priceDetail}</p>
        <div className="wizard-step3__price-rows">
          <div className="layout-row-between">
            <span>{nights} {nights === 1 ? t.night : t.nights} × {fmt(perNight)}/{nights === 1 ? t.night : t.nights}</span>
            <span>{fmt(booking.price)}</span>
          </div>
        </div>

        {/* Totale prenotazione (arancione brand --color-text-accent, allineato a sidebar/wizard-step3/sticky-bar — vedi commit b4be8c6 T1 M3) */}
        <div className="wizard-step3__total-row">
          <span className="wizard-step3__total-label">{t.totalBooking}</span>
          <span className="wizard-step3__total-value">{fmt(booking.price)}</span>
        </div>

        {/* Acconto + saldo (solo se pct < 100) */}
        {validPct < 100 && (
          <>
            <div className="wizard-step3__total-row">
              <span className="wizard-step3__total-label">{t.deposit} ({validPct}%)</span>
              <span className="wizard-step3__total-value">{fmt(depositAmount)}</span>
            </div>
            <p className="wizard-step3__total-note">{t.remaining}: {fmt(remaining)}</p>
          </>
        )}
      </div>

      {/* Card 2 — Dati ospite (compatta, allineata a wizard-step3 ordine) */}
      <div className="card-info">
        <p className="label-uppercase-muted">{t.guestData}</p>
        <p className="wizard-step3__guest-name">{booking.guestName}</p>
        <p className="wizard-step3__guest-meta">{booking.guestEmail}</p>
      </div>

      {/* Banner consumi (info) */}
      <div className="banner banner--info banner--with-icon">
        <i className="bi bi-lightning-fill" aria-hidden="true" />
        <div>
          <p className="banner__title">{t.energy}</p>
          <a href={t.energyHref} target="_blank" rel="noopener noreferrer" className="banner__link">{t.energyLink}</a>
        </div>
      </div>

      {/* Banner deposito cauzionale (warning) */}
      <div className="banner banner--warning banner--with-icon banner--mb">
        <i className="bi bi-shield-lock-fill" aria-hidden="true" />
        <div>
          <p className="banner__title">{t.deposit_info}</p>
          <a href={t.depositHref} target="_blank" rel="noopener noreferrer" className="banner__link">{t.depositLink}</a>
        </div>
      </div>

      {/* Metodo di pagamento */}
      <p className="label-uppercase-muted">{t.chooseMethod}</p>
      <div className="paga-method-grid">
        {(['stripe', 'paypal'] as const).map(m => (
          <button
            key={m}
            onClick={() => setPayMethod(m)}
            className={`paga-method-btn${payMethod === m ? ' is-active' : ''}`}
            type="button"
          >
            {m === 'stripe' ? (
              <>
                <i className="bi bi-credit-card-fill me-1" aria-hidden="true" />
                Carta
              </>
            ) : (
              <>
                <i className="bi bi-paypal me-1" aria-hidden="true" />
                PayPal
              </>
            )}
          </button>
        ))}
      </div>

      {/* Errore inline sopra al CTA */}
      {error && (
        <div className="banner banner--error banner--mb">
          <p className="banner__title">{t.errTitle}</p>
          <p className="banner__text">{error}</p>
        </div>
      )}

      {/* CTA Stripe */}
      {payMethod === 'stripe' && (
        <button
          onClick={handleStripe}
          disabled={phase === 'paying'}
          className="btn btn--primary wizard-step3__cta"
          type="button"
        >
          {phase === 'paying' ? (
            <>
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              {t.paying}
            </>
          ) : (
            <>
              <i className="bi bi-credit-card-fill" aria-hidden="true" />
              {t.payBtn} · {fmt(depositAmount)}
            </>
          )}
        </button>
      )}

      {/* PayPal SDK v6 */}
      {payMethod === 'paypal' && (
        <div className="wizard-step3__paypal-wrapper">
          {!paypalReady && phase !== 'paying' && (
            <div className="wizard-step3__paypal-loading">
              <i className="bi bi-hourglass-split me-1" aria-hidden="true" />
              {t.paypalLoading}
            </div>
          )}
          {paypalReady && phase !== 'paying' && (
            <button
              onClick={handlePayPalClick}
              className="wizard-step3__paypal-v6-btn"
              type="button"
            >
              <i className="bi bi-paypal" aria-hidden="true"></i>
              <span>{t.payBtn} · {fmt(depositAmount)}</span>
            </button>
          )}
          {phase === 'paying' && (
            <div className="wizard-step3__paypal-loading">
              <i className="bi bi-hourglass-split me-1" aria-hidden="true" />
              {t.payingPaypal}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
