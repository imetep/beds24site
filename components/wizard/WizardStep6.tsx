'use client';

import { useState } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { PROPERTIES } from '@/config/properties';

// ─── Testi fissi 4 lingue ─────────────────────────────────────────────────────
const ENERGY_BOX: Record<string, string> = {
  it: 'I consumi energetici vengono conteggiati in base all\'utilizzo reale, tramite contatori presenti in ogni abitazione. Non si tratta di un costo aggiuntivo per guadagno, ma di una misura per evitare sprechi.',
  en: 'Energy consumption is calculated based on actual usage, measured through meters installed in each accommodation. This is not an additional charge for profit, but a measure to prevent energy waste.',
  de: 'Der Energieverbrauch wird auf Grundlage des tatsächlichen Verbrauchs berechnet und über in jeder Unterkunft installierte Zähler erfasst. Dabei handelt es sich nicht um eine zusätzliche Gebühr zur Gewinnerzielung, sondern um eine Maßnahme zur Vermeidung von Energieverschwendung.',
  pl: 'Zużycie energii jest rozliczane na podstawie rzeczywistego wykorzystania, mierzonego przez liczniki zainstalowane w każdym obiekcie. Nie jest to dodatkowa opłata w celu osiągnięcia zysku, lecz środek mający na celu zapobieganie marnotrawstwu energii.',
};

const DEPOSIT_BOX: Record<string, (n: number) => string> = {
  it: (n) => `Questo alloggio richiede un deposito cauzionale di €${n}. Il pagamento verrà riscosso separatamente dal proprietario prima dell'arrivo o al momento del check-in.`,
  en: (n) => `This accommodation requires a security deposit of €${n}. Payment will be collected separately by the host before arrival or at check-in.`,
  de: (n) => `Diese Unterkunft erfordert eine Kaution von €${n}. Die Zahlung wird separat vom Gastgeber vor der Ankunft oder beim Check-in erhoben.`,
  pl: (n) => `To zakwaterowanie wymaga kaucji w wysokości €${n}. Płatność zostanie pobrana oddzielnie przez gospodarza przed przyjazdem lub przy zameldowaniu.`,
};

const UI: Record<string, Record<string, string>> = {
  it: {
    title: 'Riepilogo e conferma',
    sectionSummary: 'Il tuo soggiorno',
    sectionGuest: 'I tuoi dati',
    sectionExtras: 'Costi aggiuntivi',
    apartment: 'Appartamento',
    checkin: 'Check-in', checkout: 'Check-out',
    guests: 'Ospiti', adults: 'adulti', children: 'bambini',
    rate: 'Tariffa',
    price: 'Prezzo soggiorno',
    touristTax: 'Imposta di soggiorno',
    touristTaxNote: 'Scauri (LT) · €2/persona/notte · max 10 notti · esenti under 12',
    total: 'Totale stimato',
    firstName: 'Nome *', lastName: 'Cognome *',
    email: 'Email *', phone: 'Telefono',
    country: 'Paese', arrivalTime: 'Ora di arrivo prevista',
    comments: 'Richieste speciali',
    voucher: 'Codice promozionale (opzionale)',
    voucherApply: 'Applica',
    energyTitle: '⚡ Consumi energetici',
    depositTitle: '🔐 Deposito cauzionale',
    confirm: 'Conferma prenotazione',
    back: '← Indietro',
    terms: 'Confermando accetti le',
    termsLink: 'condizioni generali',
    loading: 'Invio prenotazione...',
    errTitle: 'Errore nella prenotazione',
    night: 'notte', nights: 'notti',
    night1: 'notte', nightN: 'notti',
  },
  en: {
    title: 'Summary & confirmation',
    sectionSummary: 'Your stay',
    sectionGuest: 'Your details',
    sectionExtras: 'Additional costs',
    apartment: 'Apartment',
    checkin: 'Check-in', checkout: 'Check-out',
    guests: 'Guests', adults: 'adults', children: 'children',
    rate: 'Rate',
    price: 'Stay price',
    touristTax: 'Tourist tax',
    touristTaxNote: 'Scauri (LT) · €2/person/night · max 10 nights · under 12 exempt',
    total: 'Estimated total',
    firstName: 'First name *', lastName: 'Last name *',
    email: 'Email *', phone: 'Phone',
    country: 'Country', arrivalTime: 'Expected arrival time',
    comments: 'Special requests',
    voucher: 'Promotional code (optional)',
    voucherApply: 'Apply',
    energyTitle: '⚡ Energy consumption',
    depositTitle: '🔐 Security deposit',
    confirm: 'Confirm booking',
    back: '← Back',
    terms: 'By confirming you accept the',
    termsLink: 'terms and conditions',
    loading: 'Sending booking...',
    errTitle: 'Booking error',
    night: 'night', nights: 'nights',
    night1: 'night', nightN: 'nights',
  },
  de: {
    title: 'Zusammenfassung & Bestätigung',
    sectionSummary: 'Ihr Aufenthalt',
    sectionGuest: 'Ihre Daten',
    sectionExtras: 'Zusätzliche Kosten',
    apartment: 'Unterkunft',
    checkin: 'Check-in', checkout: 'Check-out',
    guests: 'Gäste', adults: 'Erwachsene', children: 'Kinder',
    rate: 'Tarif',
    price: 'Aufenthaltspreis',
    touristTax: 'Kurtaxe',
    touristTaxNote: 'Scauri (LT) · €2/Person/Nacht · max. 10 Nächte · Kinder unter 12 befreit',
    total: 'Geschätzter Gesamtbetrag',
    firstName: 'Vorname *', lastName: 'Nachname *',
    email: 'E-Mail *', phone: 'Telefon',
    country: 'Land', arrivalTime: 'Voraussichtliche Ankunftszeit',
    comments: 'Besondere Wünsche',
    voucher: 'Aktionscode (optional)',
    voucherApply: 'Anwenden',
    energyTitle: '⚡ Energieverbrauch',
    depositTitle: '🔐 Kaution',
    confirm: 'Buchung bestätigen',
    back: '← Zurück',
    terms: 'Mit der Bestätigung akzeptieren Sie die',
    termsLink: 'Allgemeinen Geschäftsbedingungen',
    loading: 'Buchung wird gesendet...',
    errTitle: 'Buchungsfehler',
    night: 'Nacht', nights: 'Nächte',
    night1: 'Nacht', nightN: 'Nächte',
  },
  pl: {
    title: 'Podsumowanie i potwierdzenie',
    sectionSummary: 'Twój pobyt',
    sectionGuest: 'Twoje dane',
    sectionExtras: 'Dodatkowe koszty',
    apartment: 'Apartament',
    checkin: 'Zameldowanie', checkout: 'Wymeldowanie',
    guests: 'Goście', adults: 'dorośli', children: 'dzieci',
    rate: 'Taryfa',
    price: 'Cena pobytu',
    touristTax: 'Opłata turystyczna',
    touristTaxNote: 'Scauri (LT) · €2/osoba/noc · maks. 10 nocy · dzieci poniżej 12 lat zwolnione',
    total: 'Szacowany łączny koszt',
    firstName: 'Imię *', lastName: 'Nazwisko *',
    email: 'E-mail *', phone: 'Telefon',
    country: 'Kraj', arrivalTime: 'Przewidywana godzina przyjazdu',
    comments: 'Specjalne życzenia',
    voucher: 'Kod promocyjny (opcjonalnie)',
    voucherApply: 'Zastosuj',
    energyTitle: '⚡ Zużycie energii',
    depositTitle: '🔐 Kaucja',
    confirm: 'Potwierdź rezerwację',
    back: '← Wstecz',
    terms: 'Potwierdzając akceptujesz',
    termsLink: 'ogólne warunki',
    loading: 'Wysyłanie rezerwacji...',
    errTitle: 'Błąd rezerwacji',
    night: 'noc', nights: 'nocy',
    night1: 'noc', nightN: 'nocy',
  },
};

const OFFER_NAMES: Record<number, Record<string, string>> = {
  1: { it: 'Non Rimborsabile',          en: 'Non-Refundable',         de: 'Nicht erstattungsfähig',   pl: 'Bezzwrotna' },
  2: { it: 'Parzialmente Rimborsabile', en: 'Partially Refundable',   de: 'Teilw. erstattungsfähig',  pl: 'Częściowo zwrotna' },
  3: { it: 'Flessibile 60 gg',          en: 'Flexible 60 days',       de: 'Flexibel 60 Tage',         pl: 'Elastyczna 60 dni' },
  4: { it: 'Flessibile 45 gg',          en: 'Flexible 45 days',       de: 'Flexibel 45 Tage',         pl: 'Elastyczna 45 dni' },
  5: { it: 'Flessibile 30 gg',          en: 'Flexible 30 days',       de: 'Flexibel 30 Tage',         pl: 'Elastyczna 30 dni' },
  6: { it: 'Flessibile 5 gg',           en: 'Flexible 5 days',        de: 'Flexibel 5 Tage',          pl: 'Elastyczna 5 dni' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoomName(roomId: number | null): string {
  if (!roomId) return '';
  for (const p of PROPERTIES) {
    const r = p.rooms.find(x => x.roomId === roomId);
    if (r) return r.name;
  }
  return String(roomId);
}

function calcNights(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function formatDate(ymd: string, locale: string) {
  const d = new Date(ymd + 'T00:00:00');
  return d.toLocaleDateString(locale === 'it' ? 'it-IT' : locale === 'de' ? 'de-DE' : locale === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function parseDeposit(offerDesc?: string): number | null {
  if (!offerDesc) return null;
  const match = offerDesc.match(/CUSTOMSTAYFEE\s+(\d+)\s+SECURITYDEPOSIT/);
  return match ? Number(match[1]) : null;
}

// ─── Conferma Prenotazione ────────────────────────────────────────────────────
function ConfirmationScreen({ bookId, locale, onReset }: { bookId: string; locale: string; onReset: () => void }) {
  const msgs: Record<string, { title: string; sub: string; id: string; back: string }> = {
    it: { title: '🎉 Prenotazione confermata!', sub: 'Riceverai una email di conferma a breve. Numero prenotazione:', id: 'ID', back: 'Torna alle Residenze' },
    en: { title: '🎉 Booking confirmed!',       sub: 'You will receive a confirmation email shortly. Booking number:', id: 'ID', back: 'Back to Residences' },
    de: { title: '🎉 Buchung bestätigt!',        sub: 'Sie erhalten in Kürze eine Bestätigungs-E-Mail. Buchungsnummer:', id: 'ID', back: 'Zurück zu Residenzen' },
    pl: { title: '🎉 Rezerwacja potwierdzona!', sub: 'Wkrótce otrzymasz e-mail z potwierdzeniem. Numer rezerwacji:', id: 'ID', back: 'Powrót do Rezydencji' },
  };
  const m = msgs[locale] ?? msgs.it;
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1E73BE', margin: '0 0 12px' }}>{m.title}</h2>
      <p style={{ fontSize: 15, color: '#555', margin: '0 0 20px' }}>{m.sub}</p>
      <div style={{ background: '#EEF5FC', border: '2px solid #1E73BE', borderRadius: 12, padding: '16px 24px', display: 'inline-block', marginBottom: 28 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#1E73BE', letterSpacing: 2 }}>{bookId}</span>
      </div>
      <br />
      <a href={`/${locale}/residenze`} style={{ display: 'inline-block', padding: '12px 28px', background: '#1E73BE', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
        {m.back}
      </a>
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────
interface Props { locale?: string; }

export default function WizardStep6({ locale = 'it' }: Props) {
  const t = UI[locale] ?? UI.it;
  const loc = locale in UI ? locale : 'it';

  const {
    numAdult, numChild, numUnder12,
    checkIn, checkOut,
    selectedRoomId, selectedOfferId,
    cachedOffers,
    voucherCode, setVoucherCode,
    guestFirstName, guestLastName, guestEmail,
    guestPhone, guestCountry, guestArrivalTime, guestComments,
    setGuestField, prevStep, reset,
  } = useWizardStore();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [bookId, setBookId]         = useState<string | null>(null);
  const [voucherInput, setVoucherInput] = useState(voucherCode);

  // ── Dati calcolati ─────────────────────────────────────────────────────────
  const roomName = getRoomName(selectedRoomId);
  const nights   = checkIn && checkOut ? calcNights(checkIn, checkOut) : 0;

  // Trova offerta selezionata tra le cached
  const selectedOffer = cachedOffers?.find((o: any) => o.offerId === selectedOfferId)
    ?? cachedOffers?.flatMap((ro: any) => ro.offers ?? []).find((o: any) => o.offerId === selectedOfferId);
  const offerPrice: number = selectedOffer?.price ?? 0;
  const offerName: string  = OFFER_NAMES[selectedOfferId ?? 0]?.[loc] ?? selectedOffer?.offerName ?? '';

  // Cauzione da stringa CUSTOMSTAYFEE
  const depositAmount = parseDeposit(selectedOffer?.offerDescription ?? selectedOffer?.description ?? '');

  // Imposta di soggiorno: min(nights,10) × (numAdult - numUnder12) × 2
  const taxableNights  = Math.min(nights, 10);
  const taxableAdults  = Math.max(0, numAdult - numUnder12);
  const touristTax     = taxableNights * taxableAdults * 2;

  const total = offerPrice + touristTax;

  // ── Validazione form ───────────────────────────────────────────────────────
  const formValid = guestFirstName.trim() && guestLastName.trim() && guestEmail.trim() && guestEmail.includes('@');

  // ── Submit prenotazione ───────────────────────────────────────────────────
  async function handleConfirm() {
    if (!formValid || !selectedRoomId || !checkIn || !checkOut) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:         selectedRoomId,
          checkIn,
          checkOut,
          numAdult,
          numChild,
          offerId:        selectedOfferId,
          voucherCode:    voucherCode || undefined,
          guestFirstName: guestFirstName.trim(),
          guestName:      guestLastName.trim(),
          guestEmail:     guestEmail.trim(),
          guestPhone:     guestPhone.trim() || undefined,
          guestCountry:   guestCountry.trim() || undefined,
          guestArrivalTime: guestArrivalTime.trim() || undefined,
          guestComments:  guestComments.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      reset(); // svuota lo store
      setBookId(data.bookId);
    } catch (e: any) {
      setError(e.message ?? 'Errore sconosciuto');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Conferma avvenuta ──────────────────────────────────────────────────────
  if (bookId) {
    return <ConfirmationScreen bookId={bookId} locale={locale} onReset={reset} />;
  }

  // ── Render principale ──────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: 21, fontWeight: 700, color: '#1E73BE', margin: '0 0 20px' }}>{t.title}</h2>

      {/* ── Riepilogo soggiorno ── */}
      <section style={card}>
        <h3 style={sectionTitle}>{t.sectionSummary}</h3>

        <Row label={t.apartment} value={<strong style={{ color: '#1E73BE' }}>{roomName}</strong>} />
        {checkIn  && <Row label={t.checkin}  value={formatDate(checkIn,  locale)} />}
        {checkOut && <Row label={t.checkout} value={formatDate(checkOut, locale)} />}
        <Row label={t.guests} value={`${numAdult} ${t.adults}${numChild > 0 ? `, ${numChild} ${t.children}` : ''}`} />
        {nights > 0 && <Row label="" value={`${nights} ${nights === 1 ? t.night1 : t.nightN}`} muted />}
        {offerName && <Row label={t.rate} value={offerName} />}
      </section>

      {/* ── Costi ── */}
      <section style={card}>
        <h3 style={sectionTitle}>{t.sectionExtras}</h3>

        {offerPrice > 0 && <Row label={t.price} value={fmt(offerPrice)} bold />}

        {touristTax > 0 && (
          <>
            <Row label={t.touristTax} value={fmt(touristTax)} bold />
            <p style={{ fontSize: 12, color: '#888', margin: '-6px 0 8px', lineHeight: 1.4 }}>{t.touristTaxNote}</p>
          </>
        )}

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{t.total}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1E73BE' }}>{fmt(total)}</span>
        </div>
        {depositAmount && (
          <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0' }}>
            + {depositAmount ? fmt(depositAmount) : ''} {locale === 'it' ? 'cauzione (rimborsabile)' : 'deposit (refundable)'}
          </p>
        )}
      </section>

      {/* ── Voucher ── */}
      <section style={{ ...card, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={voucherInput}
          onChange={e => setVoucherInput(e.target.value)}
          placeholder={t.voucher}
          style={inputStyle}
        />
        <button
          onClick={() => setVoucherCode(voucherInput.trim())}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #1E73BE', background: '#fff', color: '#1E73BE', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {t.voucherApply}
        </button>
      </section>

      {/* ── Box Consumi Energetici ── */}
      <section style={{ ...infoBox, borderColor: '#d1d5db', background: '#f9fafb' }}>
        <p style={infoTitle}>{t.energyTitle}</p>
        <p style={infoText}>{ENERGY_BOX[locale] ?? ENERGY_BOX.it}</p>
      </section>

      {/* ── Box Deposito Cauzionale (solo se presente) ── */}
      {depositAmount && (
        <section style={{ ...infoBox, borderColor: '#fcd34d', background: '#fffbeb' }}>
          <p style={infoTitle}>{t.depositTitle}</p>
          <p style={infoText}>{(DEPOSIT_BOX[locale] ?? DEPOSIT_BOX.it)(depositAmount)}</p>
        </section>
      )}

      {/* ── Form dati ospite ── */}
      <section style={card}>
        <h3 style={sectionTitle}>{t.sectionGuest}</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>{t.firstName}</label>
            <input style={inputStyle} value={guestFirstName} onChange={e => setGuestField('guestFirstName', e.target.value)} autoComplete="given-name" />
          </div>
          <div>
            <label style={labelStyle}>{t.lastName}</label>
            <input style={inputStyle} value={guestLastName} onChange={e => setGuestField('guestLastName', e.target.value)} autoComplete="family-name" />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>{t.email}</label>
          <input style={inputStyle} type="email" value={guestEmail} onChange={e => setGuestField('guestEmail', e.target.value)} autoComplete="email" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>{t.phone}</label>
            <input style={inputStyle} type="tel" value={guestPhone} onChange={e => setGuestField('guestPhone', e.target.value)} autoComplete="tel" />
          </div>
          <div>
            <label style={labelStyle}>{t.country}</label>
            <input style={inputStyle} value={guestCountry} onChange={e => setGuestField('guestCountry', e.target.value)} autoComplete="country-name" />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>{t.arrivalTime}</label>
          <input style={inputStyle} type="time" value={guestArrivalTime} onChange={e => setGuestField('guestArrivalTime', e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>{t.comments}</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={guestComments}
            onChange={e => setGuestField('guestComments', e.target.value)}
          />
        </div>
      </section>

      {/* ── Errore ── */}
      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#c0392b', fontWeight: 600, fontSize: 14 }}>{t.errTitle}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{error}</p>
        </div>
      )}

      {/* ── CTA Conferma ── */}
      <button
        onClick={handleConfirm}
        disabled={!formValid || submitting}
        style={{
          width: '100%', padding: '16px', borderRadius: 12, border: 'none',
          fontSize: 17, fontWeight: 800, marginBottom: 10,
          background: (formValid && !submitting) ? '#FCAF1A' : '#e0e0e0',
          color:      (formValid && !submitting) ? '#fff'    : '#999',
          cursor:     (formValid && !submitting) ? 'pointer' : 'not-allowed',
          transition: 'background 0.15s',
        }}
      >
        {submitting ? t.loading : `${t.confirm} · ${fmt(total)}`}
      </button>

      {/* Terms */}
      <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', margin: '0 0 16px' }}>
        {t.terms}{' '}
        <a href={`/${locale}/condizioni`} style={{ color: '#1E73BE' }} target="_blank" rel="noopener noreferrer">
          {t.termsLink}
        </a>
      </p>

      <button onClick={prevStep} style={{ background: 'none', border: 'none', color: '#1E73BE', fontSize: 14, cursor: 'pointer', padding: 0 }}>
        {t.back}
      </button>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function Row({ label, value, bold, muted }: { label: string; value: React.ReactNode; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 500, color: muted ? '#bbb' : '#222', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

// ─── Stili ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 14, padding: '16px 18px',
  marginBottom: 14,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  margin: '0 0 12px',
};
const infoBox: React.CSSProperties = {
  border: '1px solid', borderRadius: 12,
  padding: '12px 16px', marginBottom: 14,
};
const infoTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 6px',
};
const infoText: React.CSSProperties = {
  fontSize: 13, color: '#555', margin: 0, lineHeight: 1.6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 14,
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  outline: 'none', boxSizing: 'border-box',
  background: '#fff', color: '#111',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#6b7280', marginBottom: 4,
};
