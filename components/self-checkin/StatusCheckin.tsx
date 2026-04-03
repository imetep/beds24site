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

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: Record<string, string>; icon: string }> = {
  PENDING: {
    bg: '#FEF9C3', color: '#713f12',
    label: { it: 'In attesa di approvazione', en: 'Awaiting approval' },
    icon: '⏳',
  },
  APPROVED: {
    bg: '#DCFCE7', color: '#14532d',
    label: { it: 'Approvata', en: 'Approved' },
    icon: '✅',
  },
  REJECTED: {
    bg: '#FEE2E2', color: '#7f1d1d',
    label: { it: 'Non approvata', en: 'Not approved' },
    icon: '❌',
  },
};

export default function StatusCheckin({ locale }: { locale: Locale }) {
  const isEn = locale === 'en';

  // ── Login con bookingId ────────────────────────────────────────────────────
  const [bookIdInput, setBookIdInput] = useState('');
  const [data, setData]               = useState<StatusData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState('');

  // Legge bookId dalla URL se presente
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
        setErr(isEn ? 'Request not found. Check your booking number.' : 'Richiesta non trovata. Verifica il numero di prenotazione.');
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setErr(isEn ? 'Connection error. Try again.' : 'Errore di connessione. Riprova.');
    }
    setLoading(false);
  }

  // ── Thread messaggi ────────────────────────────────────────────────────────
  const [msgText, setMsgText]   = useState('');
  const [sending, setSending]   = useState(false);
  const [msgErr, setMsgErr]     = useState('');
  const bottomRef               = useRef<HTMLDivElement>(null);

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
      setMsgErr(isEn ? 'Error sending message. Try again.' : 'Errore invio messaggio. Riprova.');
    }
    setSending(false);
  }

  // ── UI: form ricerca ───────────────────────────────────────────────────────
  if (!data) return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          {isEn ? 'Track your request' : 'Segui la tua richiesta'}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          {isEn
            ? 'Enter your booking number to check the status and send messages.'
            : 'Inserisci il numero di prenotazione per controllare lo stato e inviare messaggi.'}
        </p>
      </div>

      <div style={card}>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>{isEn ? 'Booking number' : 'Numero prenotazione'}</label>
          <input style={inp} type="number" inputMode="numeric"
            placeholder={isEn ? 'e.g. 84750124' : 'es. 84750124'}
            value={bookIdInput}
            onChange={e => { setBookIdInput(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && loadStatus()} />
        </div>
        {err && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{err}</p>}
        <button style={{ ...btnP, opacity: (loading || !bookIdInput.trim()) ? 0.6 : 1 }}
          onClick={() => loadStatus()} disabled={loading || !bookIdInput.trim()}>
          {loading
            ? (isEn ? 'Loading…' : 'Caricamento…')
            : (isEn ? 'View status' : 'Vedi stato')}
        </button>
      </div>

      {/* Link contatti */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 16 }}>
        {isEn ? 'Need help? ' : 'Hai bisogno di aiuto? '}
        <a href="https://wa.me/393283131500" style={{ color: '#1E73BE' }}>WhatsApp</a>
        {' · '}
        <a href="mailto:contattolivingapple@gmail.com" style={{ color: '#1E73BE' }}>Email</a>
      </p>
    </div>
  );

  // ── UI: dashboard status ───────────────────────────────────────────────────
  const sc     = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.PENDING;
  const lang   = isEn ? 'en' : 'it';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#9ca3af' }}>
            {isEn ? 'Booking' : 'Prenotazione'} #{data.bookId}
          </p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>{data.guestName}</h1>
        </div>
        <button style={{ ...btnS, fontSize: 13 }}
          onClick={() => { setData(null); setBookIdInput(''); }}>
          {isEn ? 'Change' : 'Cambia'}
        </button>
      </div>

      {/* Status badge */}
      <div style={{ ...card, background: sc.bg, border: `1px solid ${sc.color}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{sc.icon}</span>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: sc.color }}>
              {sc.label[lang]}
            </p>
            {data.status === 'PENDING' && (
              <p style={{ margin: 0, fontSize: 13, color: sc.color, opacity: 0.8 }}>
                {isEn ? 'We will review your documents within 24 hours.' : 'Verificheremo i tuoi documenti entro 24 ore.'}
              </p>
            )}
            {data.status === 'APPROVED' && (
              <p style={{ margin: 0, fontSize: 13, color: sc.color, opacity: 0.8 }}>
                {isEn ? 'You will be contacted for the video verification on arrival.' : 'Sarai contattato per la videochiamata di verifica all\'arrivo.'}
              </p>
            )}
            {data.status === 'REJECTED' && data.rejectReason && (
              <p style={{ margin: 0, fontSize: 13, color: sc.color, opacity: 0.8 }}>
                {isEn ? 'Reason: ' : 'Motivo: '}{data.rejectReason}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info prenotazione */}
      <div style={card}>
        <p style={{ margin: '0 0 10px', ...lbl }}>{isEn ? 'Booking details' : 'Dettagli prenotazione'}</p>
        <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151' }}>
          <strong>{isEn ? 'Property' : 'Struttura'}:</strong> {data.roomName}
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151' }}>
          <strong>Check-in:</strong> {data.checkIn}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
          <strong>Check-out:</strong> {data.checkOut}
        </p>
      </div>

      {/* Thread messaggi */}
      <div style={card}>
        <p style={{ margin: '0 0 14px', ...lbl }}>
          {isEn ? 'Messages' : 'Messaggi'}
          {data.messages.length > 0 && (
            <span style={{ marginLeft: 8, background: '#1E73BE', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
              {data.messages.length}
            </span>
          )}
        </p>

        {/* Storico */}
        <div style={{
          minHeight: 80, maxHeight: 300, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 10,
          marginBottom: 14, padding: 4,
        }}>
          {data.messages.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
              {isEn ? 'No messages yet.' : 'Nessun messaggio ancora.'}
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
              <p style={{
                margin: '3px 4px 0', fontSize: 11, color: '#9ca3af',
                textAlign: m.from === 'guest' ? 'right' : 'left',
              }}>
                {m.from === 'guest' ? (isEn ? 'You' : 'Tu') : 'LivingApple'}
                {' · '}
                {new Date(m.time).toLocaleString(isEn ? 'en-GB' : 'it-IT', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input messaggio */}
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isEn ? 'Write a message… (Enter to send)' : 'Scrivi un messaggio… (Invio per inviare)'}
            rows={2}
            style={{
              flex: 1, padding: '10px 12px', fontSize: 14,
              border: '1.5px solid #e5e7eb', borderRadius: 10,
              resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
          <button
            style={{ ...btnS, background: '#1E73BE', color: '#fff', border: 'none',
              alignSelf: 'flex-end', padding: '10px 16px', opacity: (sending || !msgText.trim()) ? 0.6 : 1 }}
            onClick={sendMessage} disabled={sending || !msgText.trim()}>
            {sending ? '…' : (isEn ? 'Send' : 'Invia')}
          </button>
        </div>
        {msgErr && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626' }}>{msgErr}</p>}
      </div>

      {/* Contatti */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
        {isEn ? 'Need urgent help? ' : 'Hai bisogno di aiuto urgente? '}
        <a href="https://wa.me/393283131500" style={{ color: '#1E73BE' }}>WhatsApp</a>
        {' · '}
        <a href="mailto:contattolivingapple@gmail.com" style={{ color: '#1E73BE' }}>Email</a>
      </p>
    </div>
  );
}
