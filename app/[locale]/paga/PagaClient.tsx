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
    deposit_info: '🔐 Deposito cauzionale: verrà richiesto separatamente',
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
    deposit_info: '🔐 Security deposit: will be requested separately',
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
    deposit_info: '🔐 Kaution: wird separat angefordert',
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
    deposit_info: '🔐 Kaucja: zostanie pobrana oddzielnie',
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
  const paypalRef = useRef<HTMLDivElement>(null);

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

  // Carica PayPal SDK
  useEffect(() => {
    if (payMethod !== 'paypal' || !booking) return;
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId || document.getElementById('paypal-sdk')) { setPaypalReady(true); return; }
    const script = document.createElement('script');
    script.id  = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
    script.onload = () => {
      mountPayPal();
      setPaypalReady(true);
    };
    document.body.appendChild(script);
  }, [payMethod, booking]);

  function mountPayPal() {
    if (!booking || !paypalRef.current) return;
    const depositAmount = Math.round(booking.price * validPct / 100 * 100) / 100;
    const win = window as any;
    if (!win.paypal) return;
    win.paypal.Buttons({
      createOrder: async () => {
        const res = await fetch('/api/paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.bookId, amount: depositAmount, locale }),
        });
        const d = await res.json();
        if (!d.ok) throw new Error(d.error);
        return d.orderId;
      },
      onApprove: async (data: any) => {
        setPhase('paying');
        const res = await fetch('/api/paypal-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID, bookingId: booking.bookId, amount: depositAmount }),
        });
        const d = await res.json();
        if (!d.ok) throw new Error(d.error);
        setPhase('done');
      },
      onError: () => setError('Errore PayPal. Riprova.'),
    }).render(paypalRef.current);
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
      <div style={{ width: 22, height: 22, border: '2px solid #eee', borderTop: '2px solid #1E73BE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>{t.title}</h2>
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
        <div style={{ height: 1, background: '#e5e7eb', margin: '12px 0' }} />
        <PriceRow label={t.totalBooking} value={fmt(booking.price)} bold />
        {validPct < 100 && (
          <>
            <div style={{ height: 1, background: '#e5e7eb', margin: '12px 0' }} />
            <PriceRow label={`${t.deposit} (${validPct}%)`} value={fmt(depositAmount)} highlight />
            <PriceRow label={t.remaining} value={fmt(remaining)} dimmed />
          </>
        )}
      </div>

      {/* Info box */}
      <div style={{ ...card, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>{t.energy}</p>
        <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{t.deposit_info}</p>
      </div>

      {/* Metodo di pagamento */}
      <div style={card}>
        <p style={labelStyle}>{t.chooseMethod}</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {(['stripe', 'paypal'] as const).map(m => (
            <button key={m} onClick={() => setPayMethod(m)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${payMethod === m ? '#1E73BE' : '#e5e7eb'}`,
                background: payMethod === m ? '#EEF5FC' : '#fff',
                fontWeight: 600, fontSize: 14, color: payMethod === m ? '#1E73BE' : '#555',
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
              background: phase === 'paying' ? '#e0e0e0' : '#FCAF1A',
              color: phase === 'paying' ? '#999' : '#fff',
              cursor: phase === 'paying' ? 'not-allowed' : 'pointer',
              boxShadow: phase === 'paying' ? 'none' : '0 4px 14px rgba(252,175,26,0.4)',
            }}>
            {phase === 'paying' ? `⏳ ${t.paying}` : `💳 ${t.payBtn} · ${fmt(depositAmount)}`}
          </button>
        )}

        {/* Bottone PayPal */}
        {payMethod === 'paypal' && (
          <div>
            {!paypalReady && (
              <div style={{ width: '100%', padding: '18px', borderRadius: 14, background: '#f0f4f8', textAlign: 'center', fontSize: 14, color: '#888' }}>
                ⏳ {t.paypalLoading}
              </div>
            )}
            <div ref={paypalRef} style={{ display: paypalReady && phase !== 'paying' ? 'block' : 'none' }} />
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
      {label ? <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, flexShrink: 0, minWidth: 100 }}>{label}</span> : <span />}
      <span style={{ fontSize: 13, color: dimmed ? '#9ca3af' : '#111', textAlign: 'right', lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function PriceRow({ label, value, bold, highlight, dimmed }: { label: string; value: string; bold?: boolean; highlight?: boolean; dimmed?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 14, color: dimmed ? '#9ca3af' : highlight ? '#1E73BE' : '#444', fontWeight: bold || highlight ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold || highlight ? 800 : 600, color: dimmed ? '#9ca3af' : highlight ? '#1E73BE' : '#111' }}>{value}</span>
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
