'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const UI: Record<string, Record<string, string>> = {
  it: {
    title:      'Prenotazione confermata!',
    sub:        'Grazie! Il tuo pagamento è andato a buon fine.',
    sub2:       'Riceverai una email di conferma a breve.',
    bookNum:    'Numero prenotazione',
    back:       'Torna alle Residenze',
    pending:    'La tua carta è stata salvata.',
    pending2:   'Riceverai una email di conferma. L\'importo verrà addebitato automaticamente secondo la politica di cancellazione scelta.',
    confirming: 'Stiamo finalizzando la tua prenotazione...',
    confirmErr: 'Prenotazione ricevuta. Se non ricevi la conferma entro 5 minuti, contattaci.',
  },
  en: {
    title:      'Booking confirmed!',
    sub:        'Thank you! Your payment was successful.',
    sub2:       'You will receive a confirmation email shortly.',
    bookNum:    'Booking number',
    back:       'Back to Residences',
    pending:    'Your card has been saved.',
    pending2:   'You will receive a confirmation email. The amount will be charged automatically according to your chosen cancellation policy.',
    confirming: 'Finalising your booking...',
    confirmErr: 'Booking received. If you don\'t receive a confirmation within 5 minutes, please contact us.',
  },
  de: {
    title:      'Buchung bestätigt!',
    sub:        'Vielen Dank! Ihre Zahlung war erfolgreich.',
    sub2:       'Sie erhalten in Kürze eine Bestätigungs-E-Mail.',
    bookNum:    'Buchungsnummer',
    back:       'Zurück zu Residenzen',
    pending:    'Ihre Karte wurde gespeichert.',
    pending2:   'Sie erhalten eine Bestätigungs-E-Mail. Der Betrag wird automatisch gemäß Ihrer gewählten Stornierungsrichtlinie abgebucht.',
    confirming: 'Buchung wird abgeschlossen...',
    confirmErr: 'Buchung erhalten. Wenn Sie keine Bestätigung innerhalb von 5 Minuten erhalten, kontaktieren Sie uns.',
  },
  pl: {
    title:      'Rezerwacja potwierdzona!',
    sub:        'Dziękujemy! Płatność zakończona sukcesem.',
    sub2:       'Wkrótce otrzymasz e-mail z potwierdzeniem.',
    bookNum:    'Numer rezerwacji',
    back:       'Powrót do Rezydencji',
    pending:    'Twoja karta została zapisana.',
    pending2:   'Otrzymasz e-mail z potwierdzeniem. Kwota zostanie automatycznie pobrana zgodnie z wybraną polityką anulowania.',
    confirming: 'Finalizujemy Twoją rezerwację...',
    confirmErr: 'Rezerwacja odebrana. Jeśli nie otrzymasz potwierdzenia w ciągu 5 minut, skontaktuj się z nami.',
  },
};

interface Props { locale: string; }

export default function SuccessContent({ locale }: Props) {
  const t      = UI[locale] ?? UI.it;
  const params = useSearchParams();

  const bookingIdParam = params.get('bookingId');
  const sessionId      = params.get('session_id');
  const isPaypal       = params.get('paypal') === '1';
  // Flow vault save (Flex o Rimborsabile con 50% upfront): anche questo è
  // già confermato lato server (/api/paypal-confirm-vault* scrive gli
  // invoice items e setta status 'new'). Non chiamare stripe-confirm.
  const isPaypalVault  = params.get('paypal-vault') === '1';

  // Per Stripe: conferma asincrona via /api/stripe-confirm
  const [confirming,    setConfirming]    = useState(false);
  const [confirmDone,   setConfirmDone]   = useState(false);
  const [confirmError,  setConfirmError]  = useState(false);
  const [isCardSaved,   setIsCardSaved]   = useState(false);

  useEffect(() => {
    // Flow PayPal (capture immediata o vault save): già confermato lato server
    if (isPaypal || isPaypalVault) return;

    // Nessun session_id: carta salvata (offerte 3-6, capture=false)
    // In questo caso Beds24 non ha ancora ricevuto lo status confirmed
    // ma lo faremo ugualmente con la chiamata stripe-confirm
    if (!sessionId) {
      setIsCardSaved(true);
      // Anche per carta salvata, aggiorniamo lo status Beds24 → confirmed
      // se abbiamo i dati in sessionStorage
    }

    // Leggi i dati salvati da WizardStep3 prima del redirect Stripe
    let stored: any = null;
    try {
      const raw = sessionStorage.getItem('stripe_pending');
      if (raw) stored = JSON.parse(raw);
    } catch {
      // sessionStorage non disponibile
    }

    const bookingId = stored?.bookingId ?? bookingIdParam;
    if (!bookingId) return;

    // Chiama stripe-confirm per:
    // 1. Verificare che la sessione sia pagata (o carta salvata)
    // 2. Aggiornare Beds24 status → confirmed
    // 3. Aggiungere invoiceItems (solo per pagamento immediato)
    setConfirming(true);

    fetch('/api/stripe-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId:      sessionId ?? '',          // vuoto per carta salvata
        bookingId:      Number(bookingId),
        capture:        stored?.capture ?? false,
        accommodation:  stored?.accommodation ?? 0,
        touristTax:     stored?.touristTax ?? 0,
        discountAmount: stored?.discountAmount ?? 0,
        voucherCode:    stored?.voucherCode ?? null,
        extras:         Array.isArray(stored?.extras) ? stored.extras : [],
      }),
    })
      .then(r => r.json())
      .then(result => {
        if (result.ok) {
          // Successo: pulizia sessionStorage
          try { sessionStorage.removeItem('stripe_pending'); } catch {}
          setIsCardSaved(result.cardSaved === true);
          setConfirmDone(true);
        } else {
          console.error('[SuccessContent] stripe-confirm error:', result.error);
          setConfirmError(true);
          setConfirmDone(true);
        }
      })
      .catch(e => {
        console.error('[SuccessContent] stripe-confirm fetch error:', e);
        setConfirmError(true);
        setConfirmDone(true);
      })
      .finally(() => setConfirming(false));

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Determina il bookingId da mostrare
  let storedBookingId: string | null = bookingIdParam;
  try {
    const raw = sessionStorage.getItem('stripe_pending');
    if (raw) {
      const d = JSON.parse(raw);
      if (d.bookingId) storedBookingId = String(d.bookingId);
    }
  } catch {}
  const displayBookingId = bookingIdParam ?? storedBookingId;

  // ── Spinner: conferma in corso ─────────────────────────────────────────────
  if (confirming) {
    return (
      <div style={{
        textAlign: 'center', padding: '3rem 1.5rem',
        maxWidth: 520, margin: '0 auto', fontFamily: 'sans-serif',
      }}>
        <div style={{
          width: 48, height: 48, margin: '0 auto 24px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #1E73BE',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }} />
        <p style={{ fontSize: 16, color: '#555', margin: 0 }}>{t.confirming}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Contenuto principale ───────────────────────────────────────────────────
  return (
    <div style={{
      textAlign: 'center', padding: '3rem 1.5rem',
      maxWidth: 520, margin: '0 auto', fontFamily: 'sans-serif',
    }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>
        {isCardSaved ? '🔐' : '🎉'}
      </div>

      <h1 style={{
        fontSize: 28, fontWeight: 800,
        color: 'var(--color-primary)', margin: '0 0 12px',
        lineHeight: 1.2,
      }}>
        {t.title}
      </h1>

      <p style={{ fontSize: 16, color: '#555', margin: '0 0 6px', lineHeight: 1.5 }}>
        {isCardSaved ? t.pending : t.sub}
      </p>

      <p style={{ fontSize: 14, color: confirmError ? '#e67e22' : '#888', margin: '0 0 28px', lineHeight: 1.5 }}>
        {confirmError ? t.confirmErr : isCardSaved ? t.pending2 : t.sub2}
      </p>

      {displayBookingId && (
        <div style={{
          background: '#EEF5FC',
          border: '2px solid #1E73BE',
          borderRadius: 14,
          padding: '16px 28px',
          display: 'inline-block',
          marginBottom: 36,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t.bookNum}
          </p>
          <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)', letterSpacing: 3 }}>
            {displayBookingId}
          </span>
        </div>
      )}

      <br />

      <a
        href={`/${locale}/residenze`}
        style={{
          display: 'inline-block',
          padding: '14px 36px',
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 15,
          textDecoration: 'none',
        }}
      >
        {t.back}
      </a>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
