'use client';
import { useState, useEffect, useRef } from 'react';
import { getTranslations } from '@/lib/i18n';
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
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  borderRadius: 10, cursor: 'pointer', width: '100%',
};
const btnS: React.CSSProperties = {
  padding: '10px 16px', fontSize: 14, background: '#fff', color: '#374151',
  border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
};
const card: React.CSSProperties = {
  borderRadius: 14, padding: 20,
};


export default function StatusCheckin({ locale }: { locale: Locale }) {
  const t = getTranslations(locale).components.statusCheckin;

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
    <div className="page-container py-5">
      <div className="text-center mb-4">
        <div className="mb-2" style={{ fontSize: 40 }}>🔍</div>
        <h1 className="fw-bold mb-1" style={{ fontSize: 22, color: '#111' }}>
          {t.pageTitle}
        </h1>
        <p className="m-0" style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{t.pageSubtitle}</p>
      </div>
      <div className="bg-white border mb-3" style={card}>
        <div className="mb-3">
          <label style={lbl}>{t.bookingLabel}</label>
          <input style={inp} type="number" inputMode="numeric"
            placeholder={t.bookingPh}
            value={bookIdInput}
            onChange={e => { setBookIdInput(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && loadStatus()} />
        </div>
        {err && <p className="mb-2" style={{ fontSize: 13, color: '#dc2626' }}>{err}</p>}
        <button style={{ ...btnP, opacity: (loading || !bookIdInput.trim()) ? 0.6 : 1 }}
          onClick={() => loadStatus()} disabled={loading || !bookIdInput.trim()}>
          {loading ? t.loading : t.viewBtn}
        </button>
      </div>
      <p className="text-center mt-3" style={{ fontSize: 13, color: '#9ca3af' }}>
        {t.needHelp}{' '}
        <a href="https://wa.me/393283131500" style={{ color: 'var(--color-primary)' }}>WhatsApp</a>
        {' · '}
        <a href="mailto:contattolivingapple@gmail.com" style={{ color: 'var(--color-primary)' }}>Email</a>
      </p>
    </div>
  );

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const sc = statusLabels[data.status] ?? statusLabels.PENDING;

  return (
    <div className="page-container pt-4 pb-5">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="mb-1" style={{ fontSize: 13, color: '#9ca3af' }}>
            {t.booking} #{data.bookId}
          </p>
          <h1 className="m-0 fw-bold" style={{ fontSize: 20, color: '#111' }}>{data.guestName}</h1>
        </div>
        <button style={{ ...btnS, fontSize: 13 }}
          onClick={() => { setData(null); setBookIdInput(''); }}>
          {t.change}
        </button>
      </div>

      <div className="mb-3" style={{ ...card, background: sc.bg, border: `1px solid ${sc.color}30` }}>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 24 }}>{sc.icon}</span>
          <div>
            <p className="fw-bold mb-1" style={{ fontSize: 16, color: sc.color }}>
              {sc.label}
            </p>
            {data.status === 'REJECTED' && data.rejectReason
              ? <p className="m-0" style={{ fontSize: 13, color: sc.color, opacity: 0.8 }}>{t.rejectedReason}{data.rejectReason}</p>
              : sc.note
                ? <p className="m-0" style={{ fontSize: 13, color: sc.color, opacity: 0.8 }}>{sc.note}</p>
                : null
            }
          </div>
        </div>
      </div>

      <div className="bg-white border mb-3" style={card}>
        <p className="mb-2" style={lbl}>{t.details}</p>
        <p className="mb-1" style={{ fontSize: 14, color: '#374151' }}>
          <strong>{t.property}:</strong> {data.roomName}
        </p>
        <p className="mb-1" style={{ fontSize: 14, color: '#374151' }}>
          <strong>Check-in:</strong> {data.checkIn}
        </p>
        <p className="m-0" style={{ fontSize: 14, color: '#374151' }}>
          <strong>Check-out:</strong> {data.checkOut}
        </p>
      </div>

      <div className="bg-white border mb-3" style={card}>
        <p className="mb-3" style={lbl}>
          {t.messages}
          {data.messages.length > 0 && (
            <span
              className="ms-2 fw-bold text-white rounded-pill"
              style={{ background: 'var(--color-primary)', fontSize: 10, padding: '2px 7px' }}
            >
              {data.messages.length}
            </span>
          )}
        </p>
        <div
          className="d-flex flex-column gap-2 mb-3 p-1"
          style={{ minHeight: 80, maxHeight: 300, overflowY: 'auto' }}
        >
          {data.messages.length === 0 && (
            <p className="text-center m-0 py-3" style={{ fontSize: 13, color: '#9ca3af' }}>
              {t.noMessages}
            </p>
          )}
          {data.messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === 'guest' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                background: m.from === 'guest' ? 'var(--color-primary)' : '#f3f4f6',
                color: m.from === 'guest' ? '#fff' : '#111',
                borderRadius: m.from === 'guest' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '10px 14px', fontSize: 14, lineHeight: 1.5,
              }}>
                {m.text}
              </div>
              <p className="mb-0" style={{ marginTop: 3, marginLeft: 4, marginRight: 4, fontSize: 11, color: '#9ca3af',
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
        <div className="d-flex gap-2">
          <textarea
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={t.msgPh}
            rows={2}
            className="flex-fill"
            style={{ padding: '10px 12px', fontSize: 14,
              border: '1.5px solid #e5e7eb', borderRadius: 10,
              resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <button
            className="align-self-end border-0 text-white"
            style={{ ...btnS, background: 'var(--color-primary)', color: '#fff',
              padding: '10px 16px',
              opacity: (sending || !msgText.trim()) ? 0.6 : 1 }}
            onClick={sendMessage} disabled={sending || !msgText.trim()}>
            {sending ? t.sending : t.send}
          </button>
        </div>
        {msgErr && <p className="mb-0" style={{ marginTop: 6, fontSize: 12, color: '#dc2626' }}>{msgErr}</p>}
      </div>

      <p className="text-center" style={{ fontSize: 13, color: '#9ca3af' }}>
        {t.urgentHelp}{' '}
        <a href="https://wa.me/393283131500" style={{ color: 'var(--color-primary)' }}>WhatsApp</a>
        {' · '}
        <a href="mailto:contattolivingapple@gmail.com" style={{ color: 'var(--color-primary)' }}>Email</a>
      </p>
    </div>
  );
}
