'use client';

import { useState } from 'react';

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
    PENDING:  { label: tC.statusPending,  modifier: 'pending',  icon: 'bi-hourglass-split' },
    APPROVED: { label: tC.statusApproved, modifier: 'approved', icon: 'bi-check-circle-fill' },
    REJECTED: { label: tC.statusRejected, modifier: 'rejected', icon: 'bi-x-circle-fill' },
  } as const;
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
    <div className="guest-section">
      <div className="section-header">
        <i className="bi bi-house-fill section-header__icon" aria-hidden="true" />
        <h3 className="section-header__title">{tC.title}</h3>
      </div>

      {/* Badge status */}
      <div className={`status-badge status-badge--${st.modifier} status-badge--mb`}>
        <i className={`bi ${st.icon}`} aria-hidden="true" />
        <span>{st.label}</span>
      </div>

      {/* Motivo rifiuto */}
      {checkin.status === 'REJECTED' && checkin.rejectReason && (
        <div className="checkin-section__reject">
          <strong>{tC.rejectPrefix}</strong>
          <span>{checkin.rejectReason}</span>
          <p className="checkin-section__reject-note">{tC.rejectNote}</p>
        </div>
      )}

      {/* CTA wizard */}
      {checkin.status === 'PENDING' && (
        <a
          href={`/${locale}/self-checkin/wizard`}
          className="btn-cta-orange"
        >
          <i className="bi bi-clipboard-fill me-1" aria-hidden="true" />
          {tC.wizardBtn}
        </a>
      )}

      {/* Thread messaggi */}
      <div className="mt-4">
        <p className="checkin-section__messages-title">
          <i className="bi bi-chat-fill me-1" aria-hidden="true" />
          {tC.messagesTitle}
        </p>

        {messages.length === 0 ? (
          <p className="checkin-section__no-messages">{tC.noMessages}</p>
        ) : (
          <div className="checkin-section__messages">
            {messages.map((m, i) => (
              <div key={i} className={`checkin-section__msg checkin-section__msg--${m.from}`}>
                <div className="checkin-section__msg-bubble">
                  {m.text}
                </div>
                <p className="checkin-section__msg-time">
                  {m.from === 'guest' ? tC.youLabel : tC.hostLabel} · {new Date(m.time).toLocaleString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="checkin-section__send-row">
          <input
            type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={tC.messagePlaceholder}
            className="checkin-section__input"
          />
          <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="checkin-section__send-btn">
            {sending ? tC.sending : tC.sendBtn}
          </button>
        </div>
        {sendError && <p className="checkin-section__send-error">{sendError}</p>}
      </div>
    </div>
  );
}
