'use client';

import { useSearchParams } from 'next/navigation';

const UI: Record<string, Record<string, string>> = {
  it: {
    title:   'Prenotazione confermata!',
    sub:     'Grazie! Il tuo pagamento è andato a buon fine.',
    sub2:    'Riceverai una email di conferma a breve.',
    bookNum: 'Numero prenotazione',
    back:    'Torna alle Residenze',
    pending: 'La tua carta è stata salvata.',
    pending2:'Riceverai una email di conferma. L\'importo verrà addebitato automaticamente secondo la politica di cancellazione scelta.',
  },
  en: {
    title:   'Booking confirmed!',
    sub:     'Thank you! Your payment was successful.',
    sub2:    'You will receive a confirmation email shortly.',
    bookNum: 'Booking number',
    back:    'Back to Residences',
    pending: 'Your card has been saved.',
    pending2:'You will receive a confirmation email. The amount will be charged automatically according to your chosen cancellation policy.',
  },
  de: {
    title:   'Buchung bestätigt!',
    sub:     'Vielen Dank! Ihre Zahlung war erfolgreich.',
    sub2:    'Sie erhalten in Kürze eine Bestätigungs-E-Mail.',
    bookNum: 'Buchungsnummer',
    back:    'Zurück zu Residenzen',
    pending: 'Ihre Karte wurde gespeichert.',
    pending2:'Sie erhalten eine Bestätigungs-E-Mail. Der Betrag wird automatisch gemäß Ihrer gewählten Stornierungsrichtlinie abgebucht.',
  },
  pl: {
    title:   'Rezerwacja potwierdzona!',
    sub:     'Dziękujemy! Płatność zakończona sukcesem.',
    sub2:    'Wkrótce otrzymasz e-mail z potwierdzeniem.',
    bookNum: 'Numer rezerwacji',
    back:    'Powrót do Rezydencji',
    pending: 'Twoja karta została zapisana.',
    pending2:'Otrzymasz e-mail z potwierdzeniem. Kwota zostanie automatycznie pobrana zgodnie z wybraną polityką anulowania.',
  },
};

interface Props { locale: string; }

export default function SuccessContent({ locale }: Props) {
  const t = UI[locale] ?? UI.it;
  const params = useSearchParams();
  const bookingId  = params.get('bookingId');
  const sessionId  = params.get('session_id');

  // Se c'è session_id ma non bookingId → redirect strano, mostriamo comunque successo
  // Se c'è bookingId ma non session_id → carta salvata (capture:false, offerte 3-6)
  const isCardSaved = !!bookingId && !sessionId;

  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem 1.5rem',
      maxWidth: 520,
      margin: '0 auto',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>
        {isCardSaved ? '🔐' : '🎉'}
      </div>

      <h1 style={{
        fontSize: 28, fontWeight: 800,
        color: '#1E73BE', margin: '0 0 12px',
        lineHeight: 1.2,
      }}>
        {t.title}
      </h1>

      <p style={{ fontSize: 16, color: '#555', margin: '0 0 6px', lineHeight: 1.5 }}>
        {isCardSaved ? t.pending : t.sub}
      </p>
      <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px', lineHeight: 1.5 }}>
        {isCardSaved ? t.pending2 : t.sub2}
      </p>

      {bookingId && (
        <div style={{
          background: '#EEF5FC',
          border: '2px solid #1E73BE',
          borderRadius: 14,
          padding: '16px 28px',
          display: 'inline-block',
          marginBottom: 36,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#1E73BE', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t.bookNum}
          </p>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#1E73BE', letterSpacing: 3 }}>
            {bookingId}
          </span>
        </div>
      )}

      <br />

      <a
        href={`/${locale}/residenze`}
        style={{
          display: 'inline-block',
          padding: '14px 36px',
          background: '#1E73BE',
          color: '#fff',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 15,
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
      >
        {t.back}
      </a>
    </div>
  );
}
