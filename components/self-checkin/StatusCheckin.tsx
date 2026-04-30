'use client';
import { useState, useEffect, useRef } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';
import { Icon, type IconName } from '@/components/ui/Icon';

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

  const statusLabels: Record<string, { label: string; note: string; modifier: string; icon: IconName }> = {
    PENDING:  { label: t.statusPending,  note: t.pendingNote,  modifier: 'pending',  icon: 'hourglass-split' },
    APPROVED: { label: t.statusApproved, note: t.approvedNote, modifier: 'approved', icon: 'check-circle-fill' },
    REJECTED: { label: t.statusRejected, note: '',             modifier: 'rejected', icon: 'x-circle-fill' },
  };

  // ── Form ricerca ─────────────────────────────────────────────────────────
  if (!data) return (
    <div className="page-container page-top pb-5">
      <div className="status-checkin__hero">
        <div className="status-checkin__hero-icon">
          <Icon name="search" />
        </div>
        <h1 className="status-checkin__hero-title">{t.pageTitle}</h1>
        <p className="status-checkin__hero-sub">{t.pageSubtitle}</p>
      </div>
      <div className="status-checkin__card">
        <div className="form-row__full">
          <label className="ui-field-label ui-field-label--uppercase">{t.bookingLabel}</label>
          <input className="ui-field-input" type="number" inputMode="numeric"
            placeholder={t.bookingPh}
            value={bookIdInput}
            onChange={e => { setBookIdInput(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && loadStatus()} />
        </div>
        {err && <p className="checkin-wizard__inline-error">{err}</p>}
        <button className={`checkin-wizard__primary-btn ${(loading || !bookIdInput.trim()) ? 'is-loading' : ''}`}
          onClick={() => loadStatus()} disabled={loading || !bookIdInput.trim()}>
          {loading ? t.loading : t.viewBtn}
        </button>
      </div>
      <p className="status-checkin__support">
        {t.needHelp}{' '}
        <a href="https://wa.me/393283131500" className="status-checkin__support-link">WhatsApp</a>
        {' · '}
        <a href="mailto:contattolivingapple@gmail.com" className="status-checkin__support-link">Email</a>
      </p>
    </div>
  );

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const sc = statusLabels[data.status] ?? statusLabels.PENDING;

  return (
    <div className="page-container page-top pb-5">

      <div className="status-checkin__header">
        <div>
          <p className="status-checkin__header-meta">
            {t.booking} #{data.bookId}
          </p>
          <h1 className="status-checkin__header-name">{data.guestName}</h1>
        </div>
        <button className="status-checkin__change-btn"
          onClick={() => { setData(null); setBookIdInput(''); }}>
          {t.change}
        </button>
      </div>

      <div className={`status-banner status-banner--${sc.modifier}`}>
        <Icon name={sc.icon} className="status-banner__icon" />
        <div>
          <p className="status-banner__title">{sc.label}</p>
          {data.status === 'REJECTED' && data.rejectReason
            ? <p className="status-banner__note">{t.rejectedReason}{data.rejectReason}</p>
            : sc.note
              ? <p className="status-banner__note">{sc.note}</p>
              : null
          }
        </div>
      </div>

      <div className="status-checkin__card">
        <p className="ui-field-label ui-field-label--uppercase">{t.details}</p>
        <p className="checkin-wizard__summary-line"><strong>{t.property}:</strong> {data.roomName}</p>
        <p className="checkin-wizard__summary-line"><strong>Check-in:</strong> {data.checkIn}</p>
        <p className="checkin-wizard__summary-line"><strong>Check-out:</strong> {data.checkOut}</p>
      </div>

      <div className="status-checkin__card">
        <p className="ui-field-label ui-field-label--uppercase">
          {t.messages}
          {data.messages.length > 0 && (
            <span className="status-checkin__msg-count">{data.messages.length}</span>
          )}
        </p>
        <div className="status-checkin__messages">
          {data.messages.length === 0 && (
            <p className="status-checkin__no-messages">{t.noMessages}</p>
          )}
          {data.messages.map((m, i) => (
            <div key={i} className={`status-checkin__msg status-checkin__msg--${m.from}`}>
              <div className="status-checkin__msg-bubble">{m.text}</div>
              <p className="status-checkin__msg-time">
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
        <div className="status-checkin__send-row">
          <textarea
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={t.msgPh}
            rows={2}
            className="status-checkin__send-textarea"
          />
          <button
            className="status-checkin__send-btn"
            onClick={sendMessage} disabled={sending || !msgText.trim()}>
            {sending ? t.sending : t.send}
          </button>
        </div>
        {msgErr && <p className="status-checkin__send-error">{msgErr}</p>}
      </div>

      <p className="status-checkin__support">
        {t.urgentHelp}{' '}
        <a href="https://wa.me/393283131500" className="status-checkin__support-link">WhatsApp</a>
        {' · '}
        <a href="mailto:contattolivingapple@gmail.com" className="status-checkin__support-link">Email</a>
      </p>
    </div>
  );
}
