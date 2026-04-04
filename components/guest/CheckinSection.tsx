'use client';

import { useState } from 'react';

const C = {
  blue:       '#1E73BE',
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
    <div style={sectionCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.1rem' }}>🏠</span>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.text }}>{tC.title}</h3>
      </div>

      {/* Badge status */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.9rem', borderRadius: '20px', background: st.bg, marginBottom: '1.1rem' }}>
        <span>{st.icon}</span>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: st.color }}>{st.label}</span>
      </div>

      {/* Motivo rifiuto */}
      {checkin.status === 'REJECTED' && checkin.rejectReason && (
        <div style={{ background: C.errorBg, border: '1px solid #fecaca', borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
          <strong style={{ color: C.error }}>{tC.rejectPrefix}</strong>
          <span style={{ color: C.error }}>{checkin.rejectReason}</span>
          <p style={{ margin: '0.5rem 0 0', color: C.textMuted, fontSize: '0.82rem' }}>{tC.rejectNote}</p>
        </div>
      )}

      {/* CTA wizard */}
      {checkin.status === 'PENDING' && (
        <a href={`/${locale}/self-checkin/wizard`} style={btnOrange}>📋 {tC.wizardBtn}</a>
      )}

      {/* Thread messaggi */}
      <div style={{ marginTop: '1.5rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          💬 {tC.messagesTitle}
        </p>

        {messages.length === 0 ? (
          <p style={{ color: C.textMuted, fontSize: '0.875rem', fontStyle: 'italic' }}>{tC.noMessages}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === 'guest' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div style={{ background: m.from === 'guest' ? C.blueLight : C.bg, border: `1px solid ${m.from === 'guest' ? '#bfdbfe' : C.border}`, borderRadius: m.from === 'guest' ? '14px 14px 3px 14px' : '14px 14px 14px 3px', padding: '0.6rem 0.9rem', fontSize: '0.875rem', color: C.text, lineHeight: 1.5 }}>
                  {m.text}
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.71rem', color: C.textMuted, textAlign: m.from === 'guest' ? 'right' : 'left' }}>
                  {m.from === 'guest' ? tC.youLabel : tC.hostLabel} · {new Date(m.time).toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={tC.messagePlaceholder}
            style={{ flex: 1, padding: '0.65rem 0.9rem', border: `1.5px solid ${C.border}`, borderRadius: '9px', fontSize: '0.9rem', outline: 'none', color: C.text }} />
          <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
            style={{ padding: '0.65rem 1.1rem', background: sending || !newMsg.trim() ? '#e0e0e0' : C.orange, color: sending || !newMsg.trim() ? C.textMid : C.text, border: 'none', borderRadius: '9px', fontWeight: 700, cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
            {sending ? tC.sending : tC.sendBtn}
          </button>
        </div>
        {sendError && <p style={{ margin: '0.4rem 0 0', color: C.error, fontSize: '0.82rem' }}>{sendError}</p>}
      </div>
    </div>
  );
}

const sectionCard: React.CSSProperties = { background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' };
const btnOrange: React.CSSProperties   = { display: 'block', padding: '0.8rem 1.25rem', background: '#FCAF1A', color: '#111111', borderRadius: '10px', fontWeight: 700, fontSize: '0.92rem', textDecoration: 'none', textAlign: 'center', marginBottom: '0.5rem' };
