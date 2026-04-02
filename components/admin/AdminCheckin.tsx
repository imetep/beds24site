'use client';
import { useState, useEffect } from 'react';

// ─── Tipi ─────────────────────────────────────────────────────────────────────
interface CheckinSummary {
  bookId:    number;
  roomName:  string;
  checkIn:   string;
  checkOut:  string;
  guestName: string;
  email:     string;
  status:    string;
  createdAt: string;
}

interface CheckinDetail {
  bookId:      number;
  roomName:    string;
  checkIn:     string;
  checkOut:    string;
  capogruppo:  any;
  altri:       any[];
  docs:        { label: string; publicId: string }[];
  signature:   string;
  status:      string;
  createdAt:   string;
  rejectReason?: string;
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

// ─── Pannello principale ──────────────────────────────────────────────────────
export default function AdminCheckin() {
  const [authed, setAuthed]       = useState<boolean | null>(null);
  const [items, setItems]         = useState<CheckinSummary[]>([]);
  const [selected, setSelected]   = useState<CheckinDetail | null>(null);
  const [loading, setLoading]     = useState(false);
  const [actionBusy, setAction]   = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback]   = useState('');

  // Verifica sessione
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
    }
    // Fetch deposito da Beds24
    const b24 = await fetch(`/api/booking-info?bookId=${bookId}`);
    if (b24.ok) {
      const b24data = await b24.json();
      const dep = b24data.booking?.depositAmount ?? null;
      setDepositAmount(dep);
      setDepositInput(dep ? String(dep) : '');
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

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  function cloudinaryUrl(publicId: string) {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dsnlduczj'}/image/upload/${publicId}`;
  }

  if (authed === null) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => { setAuthed(true); loadList(); }} />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 60px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Check-in online</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>{items.length} richieste totali</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
              onClick={() => loadDetail(item.bookId)}
              style={{
                ...card, cursor: 'pointer',
                border: selected?.bookId === item.bookId ? '1.5px solid #1E73BE' : '0.5px solid #e5e7eb',
                background: selected?.bookId === item.bookId ? '#EEF5FC' : '#fff',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>{item.guestName}</p>
                <StatusBadge status={item.status} />
              </div>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#4b5563' }}>#{item.bookId} — {item.roomName}</p>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: '#6b7280' }}>{item.checkIn} → {item.checkOut}</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#111' }}>
                    #{selected.bookId}
                  </p>
                  <StatusBadge status={selected.status} />
                </div>
                <button style={btnSec} onClick={() => setSelected(null)}>✕</button>
              </div>

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
                    {selected.docs.map((d, i) => (
                      <a key={i} href={cloudinaryUrl(d.publicId)} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#1E73BE', background: '#EEF5FC',
                          padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>
                        📎 {d.label.replace('_', ' ')} ↗
                      </a>
                    ))}
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
                    🔐 Deposito cauzionale — da inviare all'ospite
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
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
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>non trovato su Beds24 — inserisci manualmente</span>
                    )}
                  </div>
                  {depositInput && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 11, background: '#fff', border: '0.5px solid #FDE68A',
                        borderRadius: 4, padding: '4px 8px', color: '#713f12', flex: 1, wordBreak: 'break-all' }}>
                        beds24.com/bookpay.php?bookid={selected.bookId}&g=st&capture=0&pay={depositInput}
                      </code>
                      <button
                        style={{ ...btnSec, fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `https://beds24.com/bookpay.php?bookid=${selected.bookId}&g=st&capture=0&pay=${depositInput}`
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}>
                        {copied ? '✓ Copiato' : 'Copia link'}
                      </button>
                    </div>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9ca3af' }}>
                    Invia questo link all'ospite via WhatsApp prima di approvare.
                  </p>

                  {/* Checkbox Stripe */}
                  <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={stripeChecked} onChange={e => setStripe(e.target.checked)}
                      style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: '#713f12', lineHeight: 1.5 }}>
                      Ho verificato su Stripe Dashboard che la pre-autorizzazione è attiva per questa prenotazione.
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

              {/* Azioni — solo se PENDING */}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
