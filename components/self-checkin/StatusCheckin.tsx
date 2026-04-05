'use client';
import { useState, useEffect, useRef } from 'react';
import type { Locale } from '@/config/i18n';

interface Message {
  from: 'host' | 'guest';
  text: string;
  time: string;
}

interface StatusData {
  bookId:       number;
  roomName:     string;
  checkIn:      string;
  checkOut:     string;
  status:       string;
  rejectReason: string | null;
  guestName:    string;
  messages:     Message[];
  createdAt:    string;
  updatedAt:    string | null;
}

// ─── Stili ────────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 16,
  border: '1.5px solid #e5e7eb', borderRadius: 10,
  background: '#fafafa', color: '#111', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#6b7280',
  display: 'block', marginBottom: 5,
  letterSpacing: '0.04em', textTransform: 'uppercase',
};
const btnP: React.CSSProperties = {
  padding: '12px 20px', fontSize: 15, fontWeight: 700,
  background: '#1E73BE', color: '#fff', border: 'none',
  borderRadius: 10, cursor: 'pointer', width: '100%',
};
const btnS: React.CSSProperties = {
  padding: '10px 16px', fontSize: 14, background: '#fff', color: '#374151',
  border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
};
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 14, padding: '20px', marginBottom: 16,
};

// ─── Traduzioni ───────────────────────────────────────────────────────────────
const T: Record<Locale, {
  pageTitle: string; pageSubtitle: string;
  bookingLabel: string; bookingPh: string;
  viewBtn: string; loading: string;
  notFound: string; connErr: string;
  needHelp: string;
  booking: string; details: string; property: string;
  change: string; messages: string; noMessages: string;
  msgPh: string; send: string; sending: string; msgErr: string;
  urgentHelp: string;
  pendingNote: string; approvedNote: string; rejectedReason: string;
  statusPending: string; statusApproved: string; statusRejected: string;
  you: string;
  dateLocale: string;
}> = {
  it: {
    pageTitle:     'Segui la tua richiesta',
    pageSubtitle:  'Inserisci il numero di prenotazione per controllare lo stato e inviare messaggi.',
    bookingLabel:  'Numero prenotazione',
    bookingPh:     'es. 84750124',
    viewBtn:       'Vedi stato',
    loading:       'Caricamento…',
    notFound:      'Richiesta non trovata. Verifica il numero di prenotazione.',
    connErr:       'Errore di connessione. Riprova.',
    needHelp:      'Hai bisogno di aiuto?',
    booking:       'Prenotazione',
    details:       'Dettagli prenotazione',
    property:      'Struttura',
    change:        'Cambia',
    messages:      'Messaggi',
    noMessages:    'Nessun messaggio ancora.',
    msgPh:         'Scrivi un messaggio… (Invio per inviare)',
    send:          'Invia',
    sending:       '…',
    msgErr:        'Errore invio messaggio. Riprova.',
    urgentHelp:    'Hai bisogno di aiuto urgente?',
    pendingNote:   'Verificheremo i tuoi documenti entro 24 ore.',
    approvedNote:  'Sarai contattato per la videochiamata di verifica all\'arrivo.',
    rejectedReason:'Motivo: ',
    statusPending:  'In attesa di approvazione',
    statusApproved: 'Approvata',
    statusRejected: 'Non approvata',
    you:           'Tu',
    dateLocale:    'it-IT',
  },
  en: {
    pageTitle:     'Track your request',
    pageSubtitle:  'Enter your booking number to check the status and send messages.',
    bookingLabel:  'Booking number',
    bookingPh:     'e.g. 84750124',
    viewBtn:       'View status',
    loading:       'Loading…',
    notFound:      'Request not found. Check your booking number.',
    connErr:       'Connection error. Try again.',
    needHelp:      'Need help?',
    booking:       'Booking',
    details:       'Booking details',
    property:      'Property',
    change:        'Change',
    messages:      'Messages',
    noMessages:    'No messages yet.',
    msgPh:         'Write a message… (Enter to send)',
    send:          'Send',
    sending:       '…',
    msgErr:        'Error sending message. Try again.',
    urgentHelp:    'Need urgent help?',
    pendingNote:   'We will review your documents within 24 hours.',
    approvedNote:  'You will be contacted for the video verification on arrival.',
    rejectedReason:'Reason: ',
    statusPending:  'Awaiting approval',
    statusApproved: 'Approved',
    statusRejected: 'Not approved',
    you:           'You',
    dateLocale:    'en-GB',
  },
  de: {
    pageTitle:     'Anfrage verfolgen',
    pageSubtitle:  'Geben Sie Ihre Buchungsnummer ein, um den Status zu prüfen und Nachrichten zu senden.',
    bookingLabel:  'Buchungsnummer',
    bookingPh:     'z.B. 84750124',
    viewBtn:       'Status ansehen',
    loading:       'Wird geladen…',
    notFound:      'Anfrage nicht gefunden. Überprüfen Sie Ihre Buchungsnummer.',
    connErr:       'Verbindungsfehler. Bitte versuchen Sie es erneut.',
    needHelp:      'Brauchen Sie Hilfe?',
    booking:       'Buchung',
    details:       'Buchungsdetails',
    property:      'Unterkunft',
    change:        'Ändern',
    messages:      'Nachrichten',
    noMessages:    'Noch keine Nachrichten.',
    msgPh:         'Nachricht schreiben… (Enter zum Senden)',
    send:          'Senden',
    sending:       '…',
    msgErr:        'Fehler beim Senden. Bitte versuchen Sie es erneut.',
    urgentHelp:    'Dringende Hilfe benötigt?',
    pendingNote:   'Wir prüfen Ihre Dokumente innerhalb von 24 Stunden.',
    approvedNote:  'Sie werden für die Video-Verifizierung bei der Ankunft kontaktiert.',
    rejectedReason:'Grund: ',
    statusPending:  'Wartet auf Genehmigung',
    statusApproved: 'Genehmigt',
    statusRejected: 'Nicht genehmigt',
    you:           'Sie',
    dateLocale:    'de-DE',
  },
  pl: {
    pageTitle:     'Śledź swoją prośbę',
    pageSubtitle:  'Wpisz numer rezerwacji, aby sprawdzić status i wysyłać wiadomości.',
    bookingLabel:  'Numer rezerwacji',
    bookingPh:     'np. 84750124',
    viewBtn:       'Sprawdź status',
    loading:       'Ładowanie…',
    notFound:      'Prośba nie znaleziona. Sprawdź numer rezerwacji.',
    connErr:       'Błąd połączenia. Spróbuj ponownie.',
    needHelp:      'Potrzebujesz pomocy?',
    booking:       'Rezerwacja',
    details:       'Szczegóły rezerwacji',
    property:      'Obiekt',
    change:        'Zmień',
    messages:      'Wiadomości',
    noMessages:    'Brak wiadomości.',
    msgPh:         'Napisz wiadomość… (Enter aby wysłać)',
    send:          'Wyślij',
    sending:       '…',
    msgErr:        'Błąd wysyłania wiadomości. Spróbuj ponownie.',
    urgentHelp:    'Potrzebujesz pilnej pomocy?',
    pendingNote:   'Sprawdzimy Twoje dokumenty w ciągu 24 godzin.',
    approvedNote:  'Zostaniesz skontaktowany w sprawie weryfikacji wideo przy przyjeździe.',
    rejectedReason:'Powód: ',
    statusPending:  'Oczekuje na zatwierdzenie',
    statusApproved: 'Zatwierdzona',
    statusRejected: 'Niezatwierdzona',
    you:           'Ty',
    dateLocale:    'pl-PL',
  },
};

export default function StatusCheckin({ locale }: { locale: Locale }) {
  const t = T[locale] ?? T.it;

  const [bookIdInput, setBookIdInput] = useState('');
  const [data, setData]               = useState<StatusData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const id  = url.searchParams.get('bookId');
    if (id) { setBookIdInput(id); loadStatus(id); }
  }, []);

  async function loadStatus(id?: string) {
    const bookId = (id ?? bookIdInput).trim();
    if (!bookId) return;
    setLoading(true); setErr('');
    try {
      const res  = await fetch(`/api/checkin/status?bookId=${bookId}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(t.notFound); setData(null);
      } else {
        setData(json);
      }
    } catch {
      setErr(t.connErr);
    }
    setLoading(false);
  }

  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [msgErr, setMsgErr]   = useState('');
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  async function sendMessage() {
    if (!msgText.trim() || !data) return;
    setSending(true); setMsgErr('');
    try {
      const res  = await fetch('/api/checkin/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: data.bookId, message: msgText.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error();
      setData(d => d ? { ...d, messages: json.messages } : d);
      setMsgText('');
    } catch {
      setMsgErr(t.msgErr);
    }
    setSending(false);
  }

  const statusLabels: Record<string, { label: string; note: string; bg: string; color: string; icon: string }> = {
    PENDING:  { label: t.statusPending,  note: t.pendingNote,  bg: '#FEF9C3', color: '#713f12', icon: '⏳' },
    APPROVED: { label: t.statusApproved, note: t.approvedNote, bg: '#DCFCE7', color: '#14532d', icon: '✅' },
    REJECTED: { label: t.statusRejected, note: '',             bg: '#FEE2E2', color: '#7f1d1d', icon: '❌' },
  };

  // ── Form ricerca ─────────────────────────────────────────────────────────
  if (!data) return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          {t.pageTitle}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{t.pageSubtitle}</p>
      </div>
      <div style={card}>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>{t.bookingLabel}</label>
          <input style={inp} type="number" inputMode="numeric"
            placeholder={t.bookingPh}
            value={bookIdInput}
            onChange={e => { setBookIdInput(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && loadStatus()} />
        </div>
        {err && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{err}</p>}
        <button style={{ ...btnP, opacity: (loading || !bookIdInput.trim()) ? 0.6 : 1 }}
          onClick={() => loadStatus()} disabled={loading || !bookIdInput.trim()}>
          {loading ? t.loading : t.viewBtn}
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 16 }}>
        {t.needHelp}{' '}
        <a href="https://wa.me/393283131500" style={{ color: '#1E73BE' }}>WhatsApp</a>
        {' · '}
        <a href="mailto:contattolivingapple@gmail.com" style={{ color: '#1E73BE' }}>Email</a>
      </p>
    </div>
  );

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const sc = statusLabels[data.status] ?? statusLabels.PENDING;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 80px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#9ca3af' }}>
            {t.booking} #{data.bookId}
          </p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>{data.guestName}</h1>
        </div>
        <button style={{ ...btnS, fontSize: 13 }}
          onClick={() => { setData(null); setBookIdInput(''); }}>
          {t.change}
        </button>
      </div>

      <div style={{ ...card, background: sc.bg, border: `1px solid ${sc.color}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{sc.icon}</span>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: sc.color }}>
              {sc.label}
            </p>
            {data.status === 'REJECTED' && data.rejectReason
              ? <p style={{ margin: 0, fontSize: 13, color: sc.color, opacity: 0.8 }}>{t.rejectedReason}{data.rejectReason}</p>
              : sc.note
                ? <p style={{ margin: 0, fontSize: 13, color: sc.color, opacity: 0.8 }}>{sc.note}</p>
                : null
            }
          </div>
        </div>
      </div>

      <div style={card}>
        <p style={{ margin: '0 0 10px', ...lbl }}>{t.details}</p>
        <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151' }}>
          <strong>{t.property}:</strong> {data.roomName}
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151' }}>
          <strong>Check-in:</strong> {data.checkIn}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
          <strong>Check-out:</strong> {data.checkOut}
        </p>
      </div>

      <div style={card}>
        <p style={{ margin: '0 0 14px', ...lbl }}>
          {t.messages}
          {data.messages.length > 0 && (
            <span style={{ marginLeft: 8, background: '#1E73BE', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
              {data.messages.length}
            </span>
          )}
        </p>
        <div style={{ minHeight: 80, maxHeight: 300, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, padding: 4 }}>
          {data.messages.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
              {t.noMessages}
            </p>
          )}
          {data.messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === 'guest' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                background: m.from === 'guest' ? '#1E73BE' : '#f3f4f6',
                color: m.from === 'guest' ? '#fff' : '#111',
                borderRadius: m.from === 'guest' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '10px 14px', fontSize: 14, lineHeight: 1.5,
              }}>
                {m.text}
              </div>
              <p style={{ margin: '3px 4px 0', fontSize: 11, color: '#9ca3af',
                textAlign: m.from === 'guest' ? 'right' : 'left' }}>
                {m.from === 'guest' ? t.you : 'LivingApple'}
                {' · '}
                {new Date(m.time).toLocaleString(t.dateLocale, {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={t.msgPh}
            rows={2}
            style={{ flex: 1, padding: '10px 12px', fontSize: 14,
              border: '1.5px solid #e5e7eb', borderRadius: 10,
              resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <button
            style={{ ...btnS, background: '#1E73BE', color: '#fff', border: 'none',
              alignSelf: 'flex-end', padding: '10px 16px',
              opacity: (sending || !msgText.trim()) ? 0.6 : 1 }}
            onClick={sendMessage} disabled={sending || !msgText.trim()}>
            {sending ? t.sending : t.send}
          </button>
        </div>
        {msgErr && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626' }}>{msgErr}</p>}
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
        {t.urgentHelp}{' '}
        <a href="https://wa.me/393283131500" style={{ color: '#1E73BE' }}>WhatsApp</a>
        {' · '}
        <a href="mailto:contattolivingapple@gmail.com" style={{ color: '#1E73BE' }}>Email</a>
      </p>
    </div>
  );
}
