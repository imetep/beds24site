'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PROPERTIES } from '@/config/properties';

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
    payBtn: 'Paga acconto', paying: 'Elaborazione...', paid: 'Pagamento completato ✓',
    paypalLoading: 'Caricamento PayPal...', payingPaypal: 'Elaborazione PayPal...',
    loading: 'Caricamento prenotazione...', notFound: 'Prenotazione non trovata.',
    errTitle: 'Errore', chooseMethod: 'Metodo di pagamento',
    energy: '⚡ Consumi energetici a consumo — contatori in ogni abitazione',
    energyLink: 'Tariffe e consigli →', energyHref: '/it/utenze',
    deposit_info: '🔐 Deposito cauzionale: verrà richiesto separatamente',
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
    payBtn: 'Pay deposit', paying: 'Processing...', paid: 'Payment completed ✓',
    paypalLoading: 'Loading PayPal...', payingPaypal: 'Processing PayPal...',
    loading: 'Loading booking...', notFound: 'Booking not found.',
    errTitle: 'Error', chooseMethod: 'Payment method',
    energy: '⚡ Energy billed by actual usage — meters in each unit',
    energyLink: 'Rates and tips →', energyHref: '/en/utilities',
    deposit_info: '🔐 Security deposit: will be requested separately',
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
    payBtn: 'Anzahlung bezahlen', paying: 'Verarbeitung...', paid: 'Zahlung abgeschlossen ✓',
    paypalLoading: 'PayPal wird geladen...', payingPaypal: 'PayPal wird verarbeitet...',
    loading: 'Buchung wird geladen...', notFound: 'Buchung nicht gefunden.',
    errTitle: 'Fehler', chooseMethod: 'Zahlungsmethode',
    energy: '⚡ Energiekosten nach Verbrauch — Zähler in jeder Einheit',
    energyLink: 'Tarife und Tipps →', energyHref: '/de/energie',
    deposit_info: '🔐 Kaution: wird separat angefordert',
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
    payBtn: 'Zapłać zaliczkę', paying: 'Przetwarzanie...', paid: 'Płatność zakończona ✓',
    paypalLoading: 'Ładowanie PayPal...', payingPaypal: 'Przetwarzanie PayPal...',
    loading: 'Ładowanie rezerwacji...', notFound: 'Rezerwacja nie znaleziona.',
    errTitle: 'Błąd', chooseMethod: 'Metoda płatności',
    energy: '⚡ Koszty energii według zużycia — liczniki w każdym lokalu',
    energyLink: 'Taryfy i wskazówki →', energyHref: '/pl/media',
    deposit_info: '🔐 Kaucja: zostanie pobrana oddzielnie',
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 12, color: '#aaa' }}>
      <div style={{ width: 22, height: 22, border: '2px solid var(--color-border)', borderTop: '2px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      {t.loading}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error && !booking) return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#c0392b' }}>{t.errTitle}</h2>
      <p style={{ color: '#888', fontSize: 14 }}>{error}</p>
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
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{t.paid}</h2>
      <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>{booking.guestName} · {booking.guestEmail}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'sans-serif', padding: '0 2px' }}>

      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 4px' }}>{t.title}</h2>
      <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>{t.subtitle}</p>

      {/* Card appartamento + date */}
      <div style={card}>
        <Row label={t.apartment} value={room?.name ?? booking.roomName ?? '—'} />
        <Row label={t.dates} value={`${formatDate(booking.checkIn, locale)} → ${formatDate(booking.checkOut, locale)}`} />
        <Row label="" value={`${nights} ${nights === 1 ? t.night : t.nights}`} dimmed />
        <Row label={t.guests} value={`${booking.numAdult} ${t.adults}${booking.numChild > 0 ? `, ${booking.numChild} ${t.children}` : ''}`} />
      </div>

      {/* Dati ospite */}
      <div style={card}>
        <p style={labelStyle}>{t.guestData}</p>
        <Row label={t.name}  value={booking.guestName} />
        <Row label={t.email} value={booking.guestEmail} />
      </div>

      {/* Dettaglio prezzo */}
      <div style={card}>
        <p style={labelStyle}>{t.priceDetail}</p>
        <PriceRow label={`${nights} ${nights === 1 ? t.night : t.nights} × ${fmt(perNight)}/${nights === 1 ? t.night : t.nights}`} value={fmt(booking.price)} />
        <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
        <PriceRow label={t.totalBooking} value={fmt(booking.price)} bold />
        {validPct < 100 && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
            <PriceRow label={`${t.deposit} (${validPct}%)`} value={fmt(depositAmount)} highlight />
            <PriceRow label={t.remaining} value={fmt(remaining)} dimmed />
          </>
        )}
      </div>

      {/* Info box */}
      <div style={{ ...card, background: 'var(--color-bg-muted)', border: '1px solid var(--color-border)' }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#555' }}>{t.energy}</p>
        <a href={t.energyHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: 8, fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>{t.energyLink}</a>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#555' }}>{t.deposit_info}</p>
        <a href={t.depositHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>{t.depositLink}</a>
      </div>

      {/* Metodo di pagamento */}
      <div style={card}>
        <p style={labelStyle}>{t.chooseMethod}</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {(['stripe', 'paypal'] as const).map(m => (
            <button key={m} onClick={() => setPayMethod(m)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${payMethod === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: payMethod === m ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                fontWeight: 600, fontSize: 14, color: payMethod === m ? 'var(--color-primary)' : '#555',
              }}>
              {m === 'stripe' ? '💳 Carta' : '🅿️ PayPal'}
            </button>
          ))}
        </div>

        {/* Errore */}
        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ margin: 0, color: '#c0392b', fontWeight: 600, fontSize: 14 }}>{t.errTitle}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{error}</p>
          </div>
        )}

        {/* Bottone Stripe */}
        {payMethod === 'stripe' && (
          <button onClick={handleStripe} disabled={phase === 'paying'}
            style={{
              width: '100%', padding: '18px', borderRadius: 14, border: 'none',
              fontSize: 18, fontWeight: 900,
              background: phase === 'paying' ? '#e0e0e0' : 'var(--color-cta)',
              color: phase === 'paying' ? '#999' : 'var(--color-on-dark)',
              cursor: phase === 'paying' ? 'not-allowed' : 'pointer',
              boxShadow: phase === 'paying' ? 'none' : '0 4px 14px rgba(252,175,26,0.4)',
            }}>
            {phase === 'paying' ? `⏳ ${t.paying}` : `💳 ${t.payBtn} · ${fmt(depositAmount)}`}
          </button>
        )}

        {/* Bottone PayPal (SDK v6) */}
        {payMethod === 'paypal' && (
          <div>
            {!paypalReady && phase !== 'paying' && (
              <div style={{ width: '100%', padding: '18px', borderRadius: 14, background: '#f0f4f8', textAlign: 'center', fontSize: 14, color: '#888' }}>
                ⏳ {t.paypalLoading}
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
              <div style={{ width: '100%', padding: '18px', borderRadius: 14, background: '#e0e0e0', textAlign: 'center', fontSize: 14, color: '#999', fontWeight: 600 }}>
                ⏳ {t.payingPaypal}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value, dimmed }: { label: string; value: string; dimmed?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 }}>
      {label ? <span style={{ fontSize: 13, color: 'var(--color-text-label)', fontWeight: 600, flexShrink: 0, minWidth: 100 }}>{label}</span> : <span />}
      <span style={{ fontSize: 13, color: dimmed ? 'var(--color-text-muted)' : 'var(--color-text)', textAlign: 'right', lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function PriceRow({ label, value, bold, highlight, dimmed }: { label: string; value: string; bold?: boolean; highlight?: boolean; dimmed?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 14, color: dimmed ? 'var(--color-text-muted)' : highlight ? 'var(--color-primary)' : '#444', fontWeight: bold || highlight ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold || highlight ? 800 : 600, color: dimmed ? 'var(--color-text-muted)' : highlight ? 'var(--color-primary)' : 'var(--color-text)' }}>{value}</span>
    </div>
  );
}

const card: React.CSSProperties = {
  border: '1px solid var(--color-border)', borderRadius: 16,
  padding: '20px 22px', marginBottom: 16, background: 'var(--color-bg)',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px',
};
