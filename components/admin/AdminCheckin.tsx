'use client';
import { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/Icon';

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING:  { cls: 'bg-warning-subtle text-warning-emphasis', label: 'In attesa' },
    APPROVED: { cls: 'bg-success-subtle text-success-emphasis', label: 'Approvato' },
    REJECTED: { cls: 'bg-danger-subtle text-danger-emphasis',   label: 'Rifiutato' },
  };
  const s = map[status] ?? { cls: 'bg-light text-secondary', label: status };
  return (
    <span className={`badge rounded-pill fw-bold ${s.cls}`}>
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
    <div className="container" style={{ maxWidth: 360 }}>
      <div className="card shadow-sm mt-5">
        <div className="card-body p-4">
          <p className="fs-4 fw-bold mb-1"><Icon name="lock-fill" className="me-1" /> Admin</p>
          <p className="text-muted small mb-3">Pannello gestione check-in</p>
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          {err && <p className="small text-danger mb-2">{err}</p>}
          <button className="btn btn-success fw-bold w-100" onClick={login} disabled={busy}>
            {busy ? 'Accesso…' : 'Accedi'}
          </button>
        </div>
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
      <span className="small fw-semibold text-muted text-uppercase d-block mb-1">Messaggi con l'ospite</span>

      {/* Thread */}
      <div
        className="border rounded-3 bg-light d-flex flex-column gap-2 p-3 mb-2"
        style={{ maxHeight: 300, overflowY: 'auto' }}
      >
        {messages.length === 0 && (
          <p className="small text-muted text-center mb-0">
            Nessun messaggio ancora
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === 'host' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}
          >
            <div
              className="small"
              style={{
                background: m.from === 'host' ? 'var(--color-primary)' : '#fff',
                color: m.from === 'host' ? '#fff' : '#111',
                border: m.from === 'host' ? 'none' : '0.5px solid #e5e7eb',
                borderRadius: m.from === 'host' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '8px 12px', lineHeight: 1.5,
              }}
            >
              {m.text}
            </div>
            <p
              className="text-muted mb-0 mt-1 mx-1"
              style={{ fontSize: 10, textAlign: m.from === 'host' ? 'right' : 'left' }}
            >
              {m.from === 'host' ? 'Tu' : 'Ospite'} · {new Date(m.time).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input risposta */}
      <div className="d-flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Rispondi all'ospite… (Invio per inviare)"
          rows={2}
          className="form-control form-control-sm"
          style={{ resize: 'none' }}
        />
        <button
          className="btn btn-primary align-self-end"
          onClick={send}
          disabled={busy || !text.trim()}
        >
          {busy ? '…' : 'Invia'}
        </button>
      </div>
      {err && <p className="small text-danger mt-1 mb-0">{err}</p>}
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

    rows.push([q('SELF CHECK-IN — LivingApple'), '', '', '', '', '', '', '', ''].join(','));
    rows.push([q('Prenotazione'), q('#' + selected.bookId), '', '', '', '', '', '', ''].join(','));
    rows.push([q('Struttura'), q(selected.roomName), '', '', '', '', '', '', ''].join(','));
    rows.push([q('Check-in'), q(selected.checkIn), '', '', '', '', '', '', ''].join(','));
    rows.push([q('Check-out'), q(selected.checkOut), '', '', '', '', '', '', ''].join(','));
    rows.push('');

    rows.push([q('CAPOGRUPPO'), '', '', '', '', '', '', '', ''].join(','));
    rows.push([q('Cognome'), q('Nome'), q('Data nascita'), q('Luogo nascita'), q('Cittadinanza'), q('Sesso'), q('Tipo doc'), q('N. doc'), q('Luogo rilascio')].join(','));
    rows.push([q(c.lastName), q(c.firstName), q(c.birthDate), q(c.birthPlace), q(c.citizenship), q(c.gender === 'M' ? 'Maschio' : 'Femmina'), q(c.docType), q(c.docNumber), q(c.docIssuePlace)].join(','));

    if (selected.altri?.length > 0) {
      rows.push('');
      rows.push([q('ALTRI OSPITI'), '', '', '', '', '', '', ''].join(','));
      rows.push([q('Tipo'), q('Cognome'), q('Nome'), q('Data nascita'), q('Luogo nascita'), q('Cittadinanza'), q('Sesso'), ''].join(','));
      selected.altri.forEach((a: any) => {
        rows.push([q(a.guestType), q(a.lastName), q(a.firstName), q(a.birthDate), q(a.birthPlace), q(a.citizenship), q(a.gender === 'M' ? 'Maschio' : 'Femmina'), ''].join(','));
      });
    }

    rows.push('');
    rows.push([q('Firma digitale'), q(selected.signature), '', '', '', '', '', '', ''].join(','));
    rows.push([q('Generato'), q(new Date().toLocaleString('it-IT')), '', '', '', '', '', '', ''].join(','));

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

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => { setAuthed(true); loadList(); }} />;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1400 }}>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 fw-bold mb-0">Check-in online</h1>
          <p className="small text-muted mb-0">{items.length} richieste totali</p>
        </div>
        <div className="d-flex gap-2">
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={loadList}>↻ Aggiorna</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      <div
        className="d-grid gap-3"
        style={{ gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr' }}
      >

        {/* Lista richieste */}
        <div>
          {loading && <p className="small text-muted">Caricamento…</p>}
          {!loading && items.length === 0 && (
            <div className="card">
              <div className="card-body text-center py-5">
                <p className="text-muted mb-0">Nessuna richiesta ancora</p>
              </div>
            </div>
          )}
          {items.map(item => {
            const isSel = selected?.bookId === item.bookId;
            return (
              <div
                key={item.bookId}
                onClick={() => !item.cancelled && loadDetail(item.bookId)}
                className="card mb-2"
                style={{
                  cursor: item.cancelled ? 'default' : 'pointer',
                  border: isSel ? '1.5px solid #006CB7' : '0.5px solid #e5e7eb',
                  background: item.cancelled ? '#fafafa' : isSel ? '#EEF5FC' : '#fff',
                  opacity: item.cancelled ? 0.6 : 1,
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <p className={`fw-bold mb-0 ${item.cancelled ? 'text-muted' : ''}`}>{item.guestName}</p>
                    <div className="d-flex gap-1 align-items-center flex-wrap">
                      {item.cancelled && (
                        <span className="badge rounded-pill bg-secondary">Cancellata</span>
                      )}
                      {!item.cancelled && item.unreadGuest > 0 && (
                        <span className="badge rounded-pill bg-danger">{item.unreadGuest} msg</span>
                      )}
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  <p className="small text-secondary mb-1">#{item.bookId} — {item.roomName}</p>
                  <p className="small text-muted mb-1">
                    {item.checkIn} → {item.checkOut}
                    {(item.numAdult > 0 || item.numChild > 0) && (
                      <span className="ms-2">
                        · {item.numAdult} adult{item.numAdult === 1 ? 'o' : 'i'}
                        {item.numChild > 0 && ` + ${item.numChild} bambin${item.numChild === 1 ? 'o' : 'i'}`}
                      </span>
                    )}
                  </p>
                  <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                    {new Date(item.createdAt).toLocaleString('it-IT')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dettaglio */}
        {selected && (
          <div>
            <div className="card">
              <div className="card-body p-3">
                {/* Header dettaglio */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <p className="fs-6 fw-bold mb-1">#{selected.bookId}</p>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-danger btn-sm" onClick={doDelete}><Icon name="trash" className="me-1" /> Elimina</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={generateCsv}>⬇ Scarica .csv</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
                  </div>
                </div>

                {/* Tab Info / Messaggi */}
                <ul className="nav nav-tabs mb-3">
                  {(['info', 'letti', 'msg'] as const).map(tab => (
                    <li key={tab} className="nav-item">
                      <button
                        className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === 'info' ? 'Dati ospite' : tab === 'letti' ? '🛏 Letti & Biancheria' : (
                          <span>
                            Messaggi
                            {selected.messages?.filter(m => m.from === 'guest').length > 0 && (
                              <span className="badge bg-danger rounded-pill ms-1">
                                {selected.messages.filter(m => m.from === 'guest').length}
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* ── TAB INFO ── */}
                {activeTab === 'info' && (
                  <>
                    <span className="small fw-semibold text-muted text-uppercase d-block mb-1">Struttura</span>
                    <p className="mb-3">{selected.roomName} — {selected.checkIn} → {selected.checkOut}</p>

                    <span className="small fw-semibold text-muted text-uppercase d-block mb-1">Capogruppo</span>
                    <div className="bg-light rounded p-3 mb-3">
                      {(() => {
                        const c = selected.capogruppo;
                        return (
                          <>
                            <p className="fw-semibold mb-1">{c.lastName} {c.firstName}</p>
                            <p className="small text-secondary mb-1">📅 {c.birthDate} — 📍 {c.birthPlace}</p>
                            <p className="small text-secondary mb-1">🌍 {c.citizenship} — {c.gender === 'M' ? 'Maschio' : 'Femmina'}</p>
                            <p className="small text-secondary mb-1">🪪 {c.docType} n° {c.docNumber} — rl. {c.docIssuePlace}</p>
                            <p className="small text-primary mb-0">✉️ {c.email}</p>
                          </>
                        );
                      })()}
                    </div>

                    {selected.altri?.length > 0 && (
                      <>
                        <span className="small fw-semibold text-muted text-uppercase d-block mb-1">
                          Altri ospiti ({selected.altri.length})
                        </span>
                        {selected.altri.map((a: any, i: number) => (
                          <div key={i} className="bg-light rounded p-2 mb-2">
                            <p className="small fw-semibold mb-1">
                              {a.guestType} — {a.lastName} {a.firstName}
                            </p>
                            <p className="small text-muted mb-0">{a.birthDate} — {a.birthPlace} — {a.citizenship}</p>
                          </div>
                        ))}
                      </>
                    )}

                    {selected.docs?.length > 0 && (
                      <>
                        <span className="small fw-semibold text-muted text-uppercase d-block mb-1">Documenti</span>
                        <div className="d-flex gap-2 flex-wrap mb-3">
                          {selected.docs.map((d, i) => {
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
                              <a
                                key={i}
                                href={cloudinaryUrl(d.publicId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="badge bg-primary-subtle text-primary-emphasis text-decoration-none"
                                style={{ fontSize: 12 }}
                              >
                                📎 {docLabel} ↗
                              </a>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <span className="small fw-semibold text-muted text-uppercase d-block mb-1">Firma digitale</span>
                    <p className="fst-italic mb-3">"{selected.signature}"</p>

                    {/* Deposito cauzionale */}
                    {selected.status === 'PENDING' && !feedback && (
                      <div className="alert alert-warning mb-3" style={{ background: '#FFF9E6', borderColor: '#FDE68A' }}>
                        <p className="fw-bold mb-2" style={{ color: '#713f12' }}>
                          🔐 Deposito cauzionale
                        </p>

                        {!depositUrl ? (
                          <>
                            <div className="d-flex gap-2 align-items-center mb-2">
                              <span className="small" style={{ color: '#854F0B' }}>Importo €</span>
                              <input
                                type="number"
                                value={depositInput}
                                onChange={e => setDepositInput(e.target.value)}
                                placeholder={depositAmount ? String(depositAmount) : 'es. 300'}
                                className="form-control form-control-sm"
                                style={{ width: 90, borderColor: '#FDE68A' }}
                              />
                              {depositAmount === null && (
                                <span className="small text-muted">inserisci manualmente</span>
                              )}
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
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
                            <p className="small text-muted mt-2 mb-0">
                              Genera il link di pagamento e mandalo all'ospite via WhatsApp.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="small fw-semibold mb-2" style={{ color: '#854F0B' }}>
                              ✅ Link generato — importo € {depositInput}
                            </p>
                            <div className="d-flex gap-2 align-items-center mb-2">
                              <code
                                className="flex-fill bg-white border rounded px-2 py-1"
                                style={{ fontSize: 11, borderColor: '#FDE68A !important', color: '#713f12', wordBreak: 'break-all' }}
                              >
                                {depositUrl}
                              </code>
                              <button
                                className="btn btn-outline-secondary btn-sm text-nowrap"
                                onClick={() => {
                                  navigator.clipboard.writeText(depositUrl!);
                                  setDepositCopied(true);
                                  setTimeout(() => setDepositCopied(false), 2000);
                                }}>
                                {depositCopied ? '✓ Copiato' : 'Copia'}
                              </button>
                            </div>
                            <button
                              className="btn btn-primary btn-sm mb-2"
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
                            <div>
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                style={{ fontSize: 11 }}
                                onClick={() => { setDepositUrl(null); setDepositInput(depositAmount ? String(depositAmount) : ''); }}>
                                Rigenera link
                              </button>
                            </div>
                          </>
                        )}

                        <label className="form-check d-flex gap-2 mt-3">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={stripeChecked}
                            onChange={e => setStripe(e.target.checked)}
                          />
                          <span className="small" style={{ color: '#713f12' }}>
                            Ho verificato su Stripe Dashboard che la pre-autorizzazione è attiva.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Riporta a PENDING */}
                    {(selected.status === 'APPROVED' || selected.status === 'REJECTED') && !feedback && (
                      <button
                        className="btn btn-outline-secondary btn-sm w-100 mt-2"
                        onClick={() => doAction('reset')}
                        disabled={actionBusy}>
                        ↩ Riporta a "In attesa"
                      </button>
                    )}

                    {/* Feedback */}
                    {feedback && (
                      <div className="alert alert-success py-2 mb-3">
                        <p className="small mb-0">{feedback}</p>
                      </div>
                    )}

                    {/* Azioni */}
                    {selected.status === 'PENDING' && !feedback && (
                      <>
                        {!showReject ? (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success fw-bold flex-fill"
                              onClick={() => doAction('approve')}
                              disabled={actionBusy || !stripeChecked}
                              title={!stripeChecked ? 'Verifica prima la pre-autorizzazione Stripe' : ''}>
                              {actionBusy ? '…' : '✓ Approva'}
                            </button>
                            <button
                              className="btn btn-danger fw-bold flex-fill"
                              onClick={() => setShowReject(true)}
                              disabled={actionBusy}>
                              ✕ Rifiuta
                            </button>
                          </div>
                        ) : (
                          <div>
                            <textarea
                              placeholder="Motivo del rifiuto (opzionale)"
                              value={rejectNote}
                              onChange={e => setRejectNote(e.target.value)}
                              className="form-control mb-2"
                              style={{ minHeight: 80, resize: 'vertical' }}
                            />
                            <div className="d-flex gap-2">
                              <button className="btn btn-outline-secondary flex-fill" onClick={() => setShowReject(false)}>Annulla</button>
                              <button
                                className="btn btn-danger fw-bold"
                                style={{ flex: 2 }}
                                onClick={() => doAction('reject')}
                                disabled={actionBusy}>
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
                      <p className="small text-muted">Nessuna configurazione letti salvata dall'ospite.</p>
                    ) : (
                      <>
                        {bedData.config.rooms.map((room: any) => {
                          const roomLabel = room.label?.it ?? room.id;
                          return (
                            <div key={room.id} className="bg-light rounded p-2 mb-2">
                              <p className="small fw-bold text-uppercase text-primary mb-2" style={{ letterSpacing: '0.05em' }}>{roomLabel}</p>
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
                                  <div
                                    key={bed.id}
                                    className={`d-flex justify-content-between small ${state === 'off' ? 'text-muted' : ''}`}
                                  >
                                    <span>{bedName}</span>
                                    <span className={state !== 'off' ? 'fw-semibold' : ''}>{label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}

                        <div className="rounded p-2 mb-2 border" style={{ background: '#FFF8EC', borderColor: '#FCAF1A' }}>
                          <p className="small fw-semibold mb-0">🍼 Culle richieste: {bedData.cribs ?? 0}</p>
                        </div>

                        {bedData.linen && (
                          <>
                            <span className="small fw-semibold text-muted text-uppercase d-block mb-1">Biancheria calcolata</span>
                            <div
                              className="d-grid gap-2 mb-3"
                              style={{ gridTemplateColumns: '1fr 1fr' }}
                            >
                              {[
                                { label: 'Lenz. matrimoniali', val: bedData.linen.lenzMatrimoniali },
                                { label: 'Lenz. singoli',      val: bedData.linen.lenzSingoli },
                                { label: 'Federe',             val: bedData.linen.federe },
                                { label: 'Asciugamani (pers.)',val: bedData.linen.persone },
                                { label: 'Culle',              val: bedData.linen.culle },
                              ].map(({ label: l, val: v }) => (
                                <div key={l} className="bg-light rounded border p-2">
                                  <p className="small text-muted fw-semibold text-uppercase mb-0">{l}</p>
                                  <p className="fs-4 fw-bold text-primary mb-0">{v}</p>
                                </div>
                              ))}
                            </div>

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
                              className="btn btn-primary fw-bold w-100"
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
          </div>
        )}
      </div>
    </div>
  );
}
