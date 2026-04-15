'use client';
import { useState, useEffect, useRef } from 'react';

// ─── Tipi ─────────────────────────────────────────────────────────────────────
interface CheckinSummary {
  bookId:      number;
  roomName:    string;
  checkIn:     string;
  checkOut:    string;
  guestName:   string;
  email:       string;
  status:      string;
  createdAt:   string;
  numAdult:    number;
  numChild:    number;
  cancelled:   boolean;
  unreadGuest: number;
}

interface Message {
  from: 'host' | 'guest';
  text: string;
  time: string;
}

interface CheckinDetail {
  bookId:       number;
  roomName:     string;
  checkIn:      string;
  checkOut:     string;
  capogruppo:   any;
  altri:        any[];
  docs:         { label: string; publicId: string }[];
  signature:    string;
  status:       string;
  createdAt:    string;
  rejectReason?: string;
  messages:     Message[];
}

// ─── Stili ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12,
  border: '0.5px solid #e5e7eb', padding: '16px 18px', marginBottom: 10,
};
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 3,
};
const val: React.CSSProperties = { fontSize: 14, color: '#111', marginBottom: 10 };
const btnG: React.CSSProperties = {
  padding: '10px 20px', fontSize: 14, fontWeight: 700,
  background: '#16a34a', color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer',
};
const btnR: React.CSSProperties = {
  padding: '10px 20px', fontSize: 14, fontWeight: 700,
  background: '#dc2626', color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer',
};
const btnSec: React.CSSProperties = {
  padding: '8px 14px', fontSize: 13,
  background: 'none', color: '#6b7280',
  border: '0.5px solid #d1d5db', borderRadius: 8, cursor: 'pointer',
};
const btnBlue: React.CSSProperties = {
  padding: '8px 16px', fontSize: 13, fontWeight: 600,
  background: '#1E73BE', color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:  { bg: '#FEF9C3', color: '#713f12', label: 'In attesa' },
    APPROVED: { bg: '#DCFCE7', color: '#14532d', label: 'Approvato' },
    REJECTED: { bg: '#FEE2E2', color: '#7f1d1d', label: 'Rifiutato' },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20 }}>
      {s.label}
    </span>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [pwd, setPwd]   = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true); setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) { onLogin(); }
    else { setErr('Password errata'); }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: '0 20px' }}>
      <div style={{ ...card, padding: '28px 24px' }}>
        <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111' }}>🔒 Admin</p>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>Pannello gestione check-in</p>
        <input
          type="password" placeholder="Password"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ width: '100%', padding: '10px 12px', fontSize: 15, border: '1px solid #d1d5db',
            borderRadius: 8, marginBottom: 10, boxSizing: 'border-box' }}
        />
        {err && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 8 }}>{err}</p>}
        <button style={{ ...btnG, width: '100%', opacity: busy ? 0.6 : 1 }}
          onClick={login} disabled={busy}>
          {busy ? 'Accesso…' : 'Accedi'}
        </button>
      </div>
    </div>
  );
}

// ─── Thread messaggi ──────────────────────────────────────────────────────────
function MessageThread({ messages, bookId, onNewMessage }: {
  messages: Message[];
  bookId: number;
  onNewMessage: (msgs: Message[]) => void;
}) {
  const [text, setText]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');
  const bottomRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    setBusy(true); setErr('');
    const res = await fetch('/api/admin/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, action: 'reply', message: text }),
    });
    if (res.ok) {
      const data = await res.json();
      onNewMessage(data.messages);
      setText('');
    } else {
      setErr('Errore invio messaggio');
    }
    setBusy(false);
  }

  return (
    <div>
      <span style={lbl}>Messaggi con l'ospite</span>

      {/* Thread */}
      <div style={{
        border: '0.5px solid #e5e7eb', borderRadius: 10,
        maxHeight: 300, overflowY: 'auto',
        padding: '12px', marginBottom: 10,
        background: '#f9fafb',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
            Nessun messaggio ancora
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'host' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}>
            <div style={{
              background: m.from === 'host' ? '#1E73BE' : '#fff',
              color: m.from === 'host' ? '#fff' : '#111',
              border: m.from === 'host' ? 'none' : '0.5px solid #e5e7eb',
              borderRadius: m.from === 'host' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
            }}>
              {m.text}
            </div>
            <p style={{
              margin: '2px 4px 0',
              fontSize: 10, color: '#9ca3af',
              textAlign: m.from === 'host' ? 'right' : 'left',
            }}>
              {m.from === 'host' ? 'Tu' : 'Ospite'} · {new Date(m.time).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input risposta */}
      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Rispondi all'ospite… (Invio per inviare)"
          rows={2}
          style={{
            flex: 1, padding: '8px 12px', fontSize: 13,
            border: '1px solid #d1d5db', borderRadius: 8,
            resize: 'none', boxSizing: 'border-box',
          }}
        />
        <button style={{ ...btnBlue, alignSelf: 'flex-end', opacity: busy ? 0.6 : 1 }}
          onClick={send} disabled={busy || !text.trim()}>
          {busy ? '…' : 'Invia'}
        </button>
      </div>
      {err && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{err}</p>}
    </div>
  );
}

// ─── Pannello principale ──────────────────────────────────────────────────────
export default function AdminCheckin() {
  const [authed, setAuthed]         = useState<boolean | null>(null);
  const [items, setItems]           = useState<CheckinSummary[]>([]);
  const [selected, setSelected]     = useState<CheckinDetail | null>(null);
  const [loading, setLoading]       = useState(false);
  const [actionBusy, setAction]     = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback]     = useState('');
  const [activeTab, setActiveTab]   = useState<'info' | 'msg' | 'letti'>('info');
  const [bedData,    setBedData]     = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => { setAuthed(r.ok); if (r.ok) loadList(); })
      .catch(() => setAuthed(false));
  }, []);

  async function loadList() {
    setLoading(true);
    const res = await fetch('/api/admin/checkin');
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    setLoading(false);
  }

  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [depositInput, setDepositInput]   = useState('');
  const [depositUrl, setDepositUrl]       = useState<string | null>(null);
  const [depositBusy, setDepositBusy]     = useState(false);
  const [depositCopied, setDepositCopied] = useState(false);
  const [depositEmailSent, setDepositEmailSent] = useState(false);
  const [depositEmailBusy, setDepositEmailBusy] = useState(false);
  const [stripeChecked, setStripe]        = useState(false);
  const [copied, setCopied]               = useState(false);

  async function loadDetail(bookId: number) {
    const res = await fetch(`/api/admin/checkin?id=${bookId}`);
    if (res.ok) {
      const data = await res.json();
      setSelected(data.data);
      setShowReject(false);
      setRejectNote('');
      setFeedback('');
      setStripe(false);
      setCopied(false);
      setDepositUrl(null);
      setDepositBusy(false);
      setDepositCopied(false);
      setDepositEmailSent(false);
      setDepositEmailBusy(false);
      setActiveTab('info');
      setBedData(null);
      // Carica configurazione letti
      fetch(`/api/portal/beds?adminBookId=${bookId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setBedData(d); })
        .catch(() => {});
    }
    const b24 = await fetch(`/api/booking-info?bookId=${bookId}`);
    if (b24.ok) {
      const b24data = await b24.json();
      const dep = b24data.booking?.depositAmount ?? null;
      setDepositAmount(dep);
      setDepositInput(dep ? String(dep) : '');
    }
    // Legge eventuale deposito già creato
    const depRes = await fetch(`/api/admin/deposit?bookId=${bookId}`);
    if (depRes.ok) {
      const depData = await depRes.json();
      if (depData.deposit?.url) setDepositUrl(depData.deposit.url);
    }
  }

  async function doAction(action: 'approve' | 'reject' | 'reset') {
    if (!selected) return;
    setAction(true);
    const res = await fetch('/api/admin/checkin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: selected.bookId, action, reason: rejectNote }),
    });
    if (res.ok) {
      const data = await res.json();
      if (action === 'reset') {
        setFeedback('');
        setStripe(false);
        setSelected(s => s ? { ...s, status: 'PENDING' } : null);
      } else {
        setFeedback(action === 'approve' ? '✅ Approvato — email inviata all\'ospite' : '❌ Rifiutato — email inviata all\'ospite');
        setSelected(s => s ? { ...s, status: data.status } : null);
      }
      loadList();
    }
    setAction(false);
    setShowReject(false);
  }

  function handleNewMessages(msgs: Message[]) {
    setSelected(s => s ? { ...s, messages: msgs } : null);
    loadList();
  }

  async function doDelete() {
    if (!selected) return;
    const ok = window.confirm(`Eliminare definitivamente la richiesta #${selected.bookId}?

Operazione irreversibile.`);
    if (!ok) return;
    const res = await fetch(`/api/admin/checkin?id=${selected.bookId}`, { method: 'DELETE' });
    if (res.ok) { setSelected(null); loadList(); }
    else { alert('Errore eliminazione'); }
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  function generateCsv() {
    if (!selected) return;
    const c = selected.capogruppo;
    const q = (v: string) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows: string[] = [];

    // Intestazione documento
    rows.push([q('SELF CHECK-IN — LivingApple'), '', '', '', '', '', '', '', ''].join(','));
    rows.push([q('Prenotazione'), q('#' + selected.bookId), '', '', '', '', '', '', ''].join(','));
    rows.push([q('Struttura'), q(selected.roomName), '', '', '', '', '', '', ''].join(','));
    rows.push([q('Check-in'), q(selected.checkIn), '', '', '', '', '', '', ''].join(','));
    rows.push([q('Check-out'), q(selected.checkOut), '', '', '', '', '', '', ''].join(','));
    rows.push('');

    // Capogruppo
    rows.push([q('CAPOGRUPPO'), '', '', '', '', '', '', '', ''].join(','));
    rows.push([q('Cognome'), q('Nome'), q('Data nascita'), q('Luogo nascita'), q('Cittadinanza'), q('Sesso'), q('Tipo doc'), q('N. doc'), q('Luogo rilascio')].join(','));
    rows.push([q(c.lastName), q(c.firstName), q(c.birthDate), q(c.birthPlace), q(c.citizenship), q(c.gender === 'M' ? 'Maschio' : 'Femmina'), q(c.docType), q(c.docNumber), q(c.docIssuePlace)].join(','));

    // Altri ospiti
    if (selected.altri?.length > 0) {
      rows.push('');
      rows.push([q('ALTRI OSPITI'), '', '', '', '', '', '', ''].join(','));
      rows.push([q('Tipo'), q('Cognome'), q('Nome'), q('Data nascita'), q('Luogo nascita'), q('Cittadinanza'), q('Sesso'), ''].join(','));
      selected.altri.forEach((a: any) => {
        rows.push([q(a.guestType), q(a.lastName), q(a.firstName), q(a.birthDate), q(a.birthPlace), q(a.citizenship), q(a.gender === 'M' ? 'Maschio' : 'Femmina'), ''].join(','));
      });
    }

    // Firma e data
    rows.push('');
    rows.push([q('Firma digitale'), q(selected.signature), '', '', '', '', '', '', ''].join(','));
    rows.push([q('Generato'), q(new Date().toLocaleString('it-IT')), '', '', '', '', '', '', ''].join(','));

    // BOM per Excel italiano
    const bom  = '\uFEFF';
    const blob = new Blob([bom + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'checkin_' + selected.bookId + '_' + c.lastName + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

    function cloudinaryUrl(publicId: string) {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dsnlduczj'}/image/upload/${publicId}`;
  }

  if (authed === null) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => { setAuthed(true); loadList(); }} />;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 60px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Check-in online</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>{items.length} richieste totali</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin" style={{ ...btnSec, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>← Admin</a>
          <button style={btnSec} onClick={loadList}>↻ Aggiorna</button>
          <button style={btnSec} onClick={logout}>Esci</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: 16 }}>

        {/* Lista richieste */}
        <div>
          {loading && <p style={{ fontSize: 13, color: '#9ca3af' }}>Caricamento…</p>}
          {!loading && items.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>Nessuna richiesta ancora</p>
            </div>
          )}
          {items.map(item => (
            <div key={item.bookId}
              onClick={() => !item.cancelled && loadDetail(item.bookId)}
              style={{
                ...card, cursor: item.cancelled ? 'default' : 'pointer',
                border: selected?.bookId === item.bookId ? '1.5px solid #1E73BE' : '0.5px solid #e5e7eb',
                background: item.cancelled ? '#fafafa' : selected?.bookId === item.bookId ? '#EEF5FC' : '#fff',
                opacity: item.cancelled ? 0.6 : 1,
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: item.cancelled ? '#9ca3af' : '#111' }}>{item.guestName}</p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {item.cancelled && (
                    <span style={{ background: '#6b7280', color: '#fff', fontSize: 10,
                      fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                      Cancellata
                    </span>
                  )}
                  {!item.cancelled && item.unreadGuest > 0 && (
                    <span style={{ background: '#dc2626', color: '#fff', fontSize: 10,
                      fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                      {item.unreadGuest} msg
                    </span>
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#4b5563' }}>#{item.bookId} — {item.roomName}</p>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: '#6b7280' }}>
                {item.checkIn} → {item.checkOut}
                {(item.numAdult > 0 || item.numChild > 0) && (
                  <span style={{ marginLeft: 8 }}>
                    · {item.numAdult} adult{item.numAdult === 1 ? 'o' : 'i'}
                    {item.numChild > 0 && ` + ${item.numChild} bambin${item.numChild === 1 ? 'o' : 'i'}`}
                  </span>
                )}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                {new Date(item.createdAt).toLocaleString('it-IT')}
              </p>
            </div>
          ))}
        </div>

        {/* Dettaglio */}
        {selected && (
          <div>
            <div style={card}>
              {/* Header dettaglio */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#111' }}>
                    #{selected.bookId}
                  </p>
                  <StatusBadge status={selected.status} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...btnSec, color: "#dc2626", borderColor: "#fca5a5" }} onClick={doDelete}>🗑 Elimina</button>
                  <button style={btnSec} onClick={generateCsv}>⬇ Scarica .csv</button>
                  <button style={btnSec} onClick={() => setSelected(null)}>✕</button>
                </div>
              </div>

              {/* Tab Info / Messaggi */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
                {(['info', 'letti', 'msg'] as const).map(tab => (
                  <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '7px 16px', fontSize: 13, fontWeight: 600,
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: activeTab === tab ? '2px solid #1E73BE' : '2px solid transparent',
                      color: activeTab === tab ? '#1E73BE' : '#6b7280',
                    }}>
                    {tab === 'info' ? 'Dati ospite' : tab === 'letti' ? '🛏 Letti & Biancheria' : (
                      <span>
                        Messaggi
                        {selected.messages?.filter(m => m.from === 'guest').length > 0 && (
                          <span style={{ marginLeft: 6, background: '#dc2626', color: '#fff',
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>
                            {selected.messages.filter(m => m.from === 'guest').length}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── TAB INFO ── */}
              {activeTab === 'info' && (
                <>
                  {/* Struttura */}
                  <span style={lbl}>Struttura</span>
                  <p style={val}>{selected.roomName} — {selected.checkIn} → {selected.checkOut}</p>

                  {/* Capogruppo */}
                  <span style={lbl}>Capogruppo</span>
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
                    {(() => {
                      const c = selected.capogruppo;
                      return (
                        <>
                          <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: '#111' }}>{c.lastName} {c.firstName}</p>
                          <p style={{ margin: '0 0 2px', fontSize: 13, color: '#4b5563' }}>📅 {c.birthDate} — 📍 {c.birthPlace}</p>
                          <p style={{ margin: '0 0 2px', fontSize: 13, color: '#4b5563' }}>🌍 {c.citizenship} — {c.gender === 'M' ? 'Maschio' : 'Femmina'}</p>
                          <p style={{ margin: '0 0 2px', fontSize: 13, color: '#4b5563' }}>🪪 {c.docType} n° {c.docNumber} — rl. {c.docIssuePlace}</p>
                          <p style={{ margin: 0, fontSize: 13, color: '#1E73BE' }}>✉️ {c.email}</p>
                        </>
                      );
                    })()}
                  </div>

                  {/* Altri ospiti */}
                  {selected.altri?.length > 0 && (
                    <>
                      <span style={lbl}>Altri ospiti ({selected.altri.length})</span>
                      {selected.altri.map((a: any, i: number) => (
                        <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#111' }}>
                            {a.guestType} — {a.lastName} {a.firstName}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{a.birthDate} — {a.birthPlace} — {a.citizenship}</p>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Documenti */}
                  {selected.docs?.length > 0 && (
                    <>
                      <span style={lbl}>Documenti</span>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        {selected.docs.map((d, i) => {
                          // Converte etichetta tecnica in nome leggibile
                          let docLabel = d.label;
                          if (d.label === 'capogruppo_front') docLabel = `${selected.capogruppo?.lastName} ${selected.capogruppo?.firstName} — Fronte`;
                          else if (d.label === 'capogruppo_back') docLabel = `${selected.capogruppo?.lastName} ${selected.capogruppo?.firstName} — Retro`;
                          else {
                            const m = d.label.match(/altro_(\d+)_front/);
                            if (m) {
                              const idx = parseInt(m[1]);
                              const a = selected.altri?.[idx];
                              docLabel = a ? `${a.lastName} ${a.firstName} — Fronte` : d.label.replace(/_/g, ' ');
                            }
                          }
                          return (
                            <a key={i} href={cloudinaryUrl(d.publicId)} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 12, color: '#1E73BE', background: '#EEF5FC',
                                padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>
                              📎 {docLabel} ↗
                            </a>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Firma */}
                  <span style={lbl}>Firma digitale</span>
                  <p style={{ ...val, fontStyle: 'italic' }}>"{selected.signature}"</p>

                  {/* Deposito cauzionale */}
                  {selected.status === 'PENDING' && !feedback && (
                    <div style={{ background: '#FFF9E6', border: '0.5px solid #FDE68A', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#713f12' }}>
                        🔐 Deposito cauzionale
                      </p>

                      {!depositUrl ? (
                        <>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#854F0B' }}>Importo €</span>
                            <input
                              type="number"
                              value={depositInput}
                              onChange={e => setDepositInput(e.target.value)}
                              placeholder={depositAmount ? String(depositAmount) : 'es. 300'}
                              style={{ width: 80, padding: '6px 8px', fontSize: 13, border: '1px solid #FDE68A',
                                borderRadius: 6, background: '#fff' }}
                            />
                            {depositAmount === null && (
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>inserisci manualmente</span>
                            )}
                          </div>
                          <button
                            style={{ ...btnBlue, opacity: (depositBusy || !depositInput) ? 0.6 : 1, fontSize: 13 }}
                            disabled={depositBusy || !depositInput}
                            onClick={async () => {
                              setDepositBusy(true);
                              const res = await fetch('/api/admin/deposit', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bookId: selected.bookId, amount: depositInput }),
                              });
                              const data = await res.json();
                              if (data.url) setDepositUrl(data.url);
                              else alert('Errore: ' + (data.error ?? 'sconosciuto'));
                              setDepositBusy(false);
                            }}>
                            {depositBusy ? 'Generazione…' : 'Genera link Stripe'}
                          </button>
                          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9ca3af' }}>
                            Genera il link di pagamento e mandalo all'ospite via WhatsApp.
                          </p>
                        </>
                      ) : (
                        <>
                          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#854F0B', fontWeight: 600 }}>
                            ✅ Link generato — importo € {depositInput}
                          </p>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                            <code style={{ fontSize: 11, background: '#fff', border: '0.5px solid #FDE68A',
                              borderRadius: 4, padding: '4px 8px', color: '#713f12', flex: 1, wordBreak: 'break-all' }}>
                              {depositUrl}
                            </code>
                            <button
                              style={{ ...btnSec, fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                              onClick={() => {
                                navigator.clipboard.writeText(depositUrl!);
                                setDepositCopied(true);
                                setTimeout(() => setDepositCopied(false), 2000);
                              }}>
                              {depositCopied ? '✓ Copiato' : 'Copia'}
                            </button>
                          </div>
                          <button
                            style={{ ...btnBlue, fontSize: 13, marginBottom: 8,
                              opacity: (depositEmailBusy || depositEmailSent) ? 0.6 : 1 }}
                            disabled={depositEmailBusy || depositEmailSent}
                            onClick={async () => {
                              setDepositEmailBusy(true);
                              const res = await fetch('/api/admin/deposit', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bookId: selected.bookId }),
                              });
                              const data = await res.json();
                              if (res.ok) {
                                setDepositEmailSent(true);
                                handleNewMessages(data.messages);
                              } else {
                                alert('Errore: ' + (data.error ?? 'sconosciuto'));
                              }
                              setDepositEmailBusy(false);
                            }}>
                            {depositEmailBusy ? 'Invio…' : depositEmailSent ? '✓ Email inviata' : '✉️ Invia link via email'}
                          </button>
                          <button
                            style={{ ...btnSec, fontSize: 11 }}
                            onClick={() => { setDepositUrl(null); setDepositInput(depositAmount ? String(depositAmount) : ''); }}>
                            Rigenera link
                          </button>
                        </>
                      )}

                      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={stripeChecked} onChange={e => setStripe(e.target.checked)}
                          style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16 }} />
                        <span style={{ fontSize: 13, color: '#713f12', lineHeight: 1.5 }}>
                          Ho verificato su Stripe Dashboard che la pre-autorizzazione è attiva.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Riporta a PENDING */}
                  {(selected.status === 'APPROVED' || selected.status === 'REJECTED') && !feedback && (
                    <button
                      style={{ ...btnSec, width: '100%', marginTop: 8, fontSize: 12 }}
                      onClick={() => doAction('reset')}
                      disabled={actionBusy}>
                      ↩ Riporta a "In attesa"
                    </button>
                  )}

                  {/* Feedback */}
                  {feedback && (
                    <div style={{ background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: 8,
                      padding: '10px 14px', marginBottom: 14 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#15803d' }}>{feedback}</p>
                    </div>
                  )}

                  {/* Azioni */}
                  {selected.status === 'PENDING' && !feedback && (
                    <>
                      {!showReject ? (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button style={{ ...btnG, flex: 1, opacity: (actionBusy || !stripeChecked) ? 0.5 : 1 }}
                            onClick={() => doAction('approve')} disabled={actionBusy || !stripeChecked}
                            title={!stripeChecked ? 'Verifica prima la pre-autorizzazione Stripe' : ''}>
                            {actionBusy ? '…' : '✓ Approva'}
                          </button>
                          <button style={{ ...btnR, flex: 1, opacity: actionBusy ? 0.6 : 1 }}
                            onClick={() => setShowReject(true)} disabled={actionBusy}>
                            ✕ Rifiuta
                          </button>
                        </div>
                      ) : (
                        <div>
                          <textarea
                            placeholder="Motivo del rifiuto (opzionale)"
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', fontSize: 14,
                              border: '1px solid #d1d5db', borderRadius: 8,
                              marginBottom: 10, boxSizing: 'border-box', minHeight: 80, resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button style={{ ...btnSec, flex: 1 }} onClick={() => setShowReject(false)}>Annulla</button>
                            <button style={{ ...btnR, flex: 2, opacity: actionBusy ? 0.6 : 1 }}
                              onClick={() => doAction('reject')} disabled={actionBusy}>
                              {actionBusy ? '…' : 'Conferma rifiuto'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}


              {/* ── TAB LETTI & BIANCHERIA ── */}
              {activeTab === 'letti' && (
                <div>
                  {!bedData || !bedData.config ? (
                    <p style={{ color: '#9ca3af', fontSize: 13 }}>Nessuna configurazione letti salvata dall'ospite.</p>
                  ) : (
                    <>
                      {/* Configurazione camere */}
                      {bedData.config.rooms.map((room: any) => {
                        const roomLabel = room.label?.it ?? room.id;
                        return (
                          <div key={room.id} style={{ marginBottom: 12, padding: '10px 14px', background: '#f9fafb', borderRadius: 8 }}>
                            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#1E73BE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{roomLabel}</p>
                            {room.beds.map((bed: any) => {
                              const state = bedData.bedStates?.[bed.id] ?? 'off';
                              const label = state === 'off'
                                ? '— non usato'
                                : state === 'A'
                                  ? (bed.configOptions?.closed?.label?.it ?? (bed.baseType === 'matrimoniale' ? 'Matrimoniale' : 'Singolo'))
                                  : (bed.configOptions?.open?.label?.it ?? 'Config. B');
                              const bedName = bed.variant === 'sommier' ? 'Sommier'
                                : bed.variant === 'impilabile' ? 'Impilabile'
                                : bed.variant === 'estraibile' ? 'Estraibile'
                                : bed.variant === 'poltrona' ? 'Poltrona letto'
                                : bed.variant === 'divano' ? 'Divano letto'
                                : bed.variant === 'castello' ? 'Castello'
                                : bed.variant === 'pavimento' ? 'A pavimento'
                                : bed.baseType === 'matrimoniale' ? 'Matrimoniale'
                                : 'Singolo';
                              return (
                                <div key={bed.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: state === 'off' ? '#9ca3af' : '#111', marginBottom: 2 }}>
                                  <span>{bedName}</span>
                                  <span style={{ fontWeight: state !== 'off' ? 600 : 400 }}>{label}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {/* Culle */}
                      <div style={{ marginBottom: 12, padding: '8px 14px', background: '#FFF8EC', borderRadius: 8, border: '1px solid #FCAF1A' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>🍼 Culle richieste: {bedData.cribs ?? 0}</p>
                      </div>

                      {/* Calcolo biancheria */}
                      {bedData.linen && (
                        <>
                          <span style={lbl}>Biancheria calcolata</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            {[
                              { label: 'Lenz. matrimoniali', val: bedData.linen.lenzMatrimoniali },
                              { label: 'Lenz. singoli',      val: bedData.linen.lenzSingoli },
                              { label: 'Federe',             val: bedData.linen.federe },
                              { label: 'Asciugamani (pers.)',val: bedData.linen.persone },
                              { label: 'Culle',              val: bedData.linen.culle },
                            ].map(({ label: l, val: v }) => (
                              <div key={l} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 12px', border: '1px solid #e5e7eb' }}>
                                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{l}</p>
                                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1E73BE' }}>{v}</p>
                              </div>
                            ))}
                          </div>

                          {/* Export CSV */}
                          <button
                            onClick={() => {
                              const rows = [
                                ['Campo', 'Valore'],
                                ['BookId', selected.bookId],
                                ['Check-in', selected.checkIn],
                                ['Check-out', selected.checkOut],
                                ['Struttura', selected.roomName],
                                ['Lenzuola matrimoniali', bedData.linen.lenzMatrimoniali],
                                ['Lenzuola singole', bedData.linen.lenzSingoli],
                                ['Federe', bedData.linen.federe],
                                ['Asciugamani (persone)', bedData.linen.persone],
                                ['Culle', bedData.linen.culle],
                              ];
                              const csv = rows.map(r => r.join(',')).join('\n');
                              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url; a.download = `${selected.bookId}_biancheria.csv`;
                              a.click(); URL.revokeObjectURL(url);
                            }}
                            style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 700, background: '#1E73BE', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                          >
                            ⬇ Esporta CSV biancheria
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── TAB MESSAGGI ── */}
              {activeTab === 'msg' && (
                <MessageThread
                  messages={selected.messages ?? []}
                  bookId={selected.bookId}
                  onNewMessage={handleNewMessages}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
