'use client';

import { useState } from 'react';

const C = {
  blue:       'var(--color-primary)',
  blueLight:  '#EEF5FC',
  orange:     '#FCAF1A',
  text:       '#111111',
  textMid:    '#555555',
  textMuted:  '#888888',
  border:     '#e5e7eb',
  bg:         '#f9fafb',
  success:    '#16a34a',
  successBg:  '#f0fdf4',
  error:      '#c0392b',
  errorBg:    '#fef2f2',
  orangePale: '#FFF8EC',
  orangeDark: '#B07820',
};

interface Message { from: 'host' | 'guest'; text: string; time: string; }
interface CheckinData { status: 'PENDING' | 'APPROVED' | 'REJECTED'; rejectReason: string | null; messages: Message[]; }
interface Props { locale: string; t: any; bookId: string; checkin: CheckinData; }

export default function CheckinSection({ locale, t, bookId, checkin }: Props) {
  const tC = t.checkin;
  const [messages, setMessages]   = useState<Message[]>(checkin.messages);
  const [newMsg, setNewMsg]       = useState('');
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState('');

  const statusConfig = {
    PENDING:  { label: tC.statusPending,  color: C.orangeDark, bg: C.orangePale, icon: '⏳' },
    APPROVED: { label: tC.statusApproved, color: C.success,    bg: C.successBg,  icon: '✅' },
    REJECTED: { label: tC.statusRejected, color: C.error,      bg: C.errorBg,    icon: '❌' },
  };
  const st = statusConfig[checkin.status] ?? statusConfig.PENDING;

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setSending(true); setSendError('');
    try {
      const res  = await fetch('/api/checkin/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId, message: newMsg.trim() }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setSendError(d.error ?? 'Errore.'); setSending(false); return; }
      const data = await res.json();
      setMessages(data.messages ?? [...messages, { from: 'guest' as const, text: newMsg.trim(), time: new Date().toISOString() }]);
      setNewMsg('');
    } catch { setSendError(tC.errorNetwork); }
    setSending(false);
  };

  return (
    <div className="bg-white border shadow-sm" style={sectionCard}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <span style={{ fontSize: '1.1rem' }}>🏠</span>
        <h3 className="m-0 fw-bold" style={{ fontSize: '1rem', color: C.text }}>{tC.title}</h3>
      </div>

      {/* Badge status */}
      <div
        className="d-inline-flex align-items-center gap-2 mb-3 rounded-pill"
        style={{ padding: '0.4rem 0.9rem', background: st.bg }}
      >
        <span>{st.icon}</span>
        <span className="fw-bold" style={{ fontSize: '0.85rem', color: st.color }}>{st.label}</span>
      </div>

      {/* Motivo rifiuto */}
      {checkin.status === 'REJECTED' && checkin.rejectReason && (
        <div
          className="mb-3"
          style={{ background: C.errorBg, border: '1px solid #fecaca', borderRadius: 10, padding: '0.9rem 1rem', fontSize: '0.88rem', lineHeight: 1.6 }}
        >
          <strong style={{ color: C.error }}>{tC.rejectPrefix}</strong>
          <span style={{ color: C.error }}>{checkin.rejectReason}</span>
          <p className="mt-2 mb-0" style={{ color: C.textMuted, fontSize: '0.82rem' }}>{tC.rejectNote}</p>
        </div>
      )}

      {/* CTA wizard */}
      {checkin.status === 'PENDING' && (
        <a
          href={`/${locale}/self-checkin/wizard`}
          className="d-block fw-bold text-center text-decoration-none mb-2"
          style={btnOrange}
        >📋 {tC.wizardBtn}</a>
      )}

      {/* Thread messaggi */}
      <div className="mt-4">
        <p
          className="fw-bold text-uppercase mb-2"
          style={{ fontSize: '0.82rem', color: C.textMid, letterSpacing: '0.05em' }}
        >
          💬 {tC.messagesTitle}
        </p>

        {messages.length === 0 ? (
          <p className="fst-italic" style={{ color: C.textMuted, fontSize: '0.875rem' }}>{tC.noMessages}</p>
        ) : (
          <div
            className="d-flex flex-column gap-2 mb-3"
            style={{ maxHeight: 280, overflowY: 'auto' }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === 'guest' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div style={{ background: m.from === 'guest' ? C.blueLight : C.bg, border: `1px solid ${m.from === 'guest' ? '#bfdbfe' : C.border}`, borderRadius: m.from === 'guest' ? '14px 14px 3px 14px' : '14px 14px 14px 3px', padding: '0.6rem 0.9rem', fontSize: '0.875rem', color: C.text, lineHeight: 1.5 }}>
                  {m.text}
                </div>
                <p
                  className="mb-0"
                  style={{ marginTop: '0.2rem', fontSize: '0.71rem', color: C.textMuted, textAlign: m.from === 'guest' ? 'right' : 'left' }}
                >
                  {m.from === 'guest' ? tC.youLabel : tC.hostLabel} · {new Date(m.time).toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="d-flex gap-2">
          <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={tC.messagePlaceholder}
            className="flex-fill"
            style={{ padding: '0.65rem 0.9rem', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: '0.9rem', outline: 'none', color: C.text }} />
          <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
            className="fw-bold border-0"
            style={{ padding: '0.65rem 1.1rem', background: sending || !newMsg.trim() ? '#e0e0e0' : C.orange, color: sending || !newMsg.trim() ? C.textMid : C.text, borderRadius: 9, cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
            {sending ? tC.sending : tC.sendBtn}
          </button>
        </div>
        {sendError && <p className="mb-0" style={{ marginTop: '0.4rem', color: C.error, fontSize: '0.82rem' }}>{sendError}</p>}
      </div>
    </div>
  );
}

const sectionCard: React.CSSProperties = { borderRadius: 16, padding: '1.5rem' };
const btnOrange: React.CSSProperties   = { padding: '0.8rem 1.25rem', background: '#FCAF1A', color: '#111111', borderRadius: 10, fontSize: '0.92rem' };
