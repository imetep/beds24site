'use client';

/**
 * AdminOperatori — gestione operatori dal pannello admin.
 *
 * Funzionalità:
 *   - Lista operatori con filtro ruolo
 *   - Crea operatore (form modale)
 *   - Modifica info (display name, username, ruoli, attivo)
 *   - Reset password
 *   - Genera deeplink Telegram (per onboarding bot)
 *   - Disattiva / Riattiva
 *   - Elimina
 *
 * Usa /api/admin/* (admin-gated cookie ADMIN_PASSWORD).
 */

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { RUOLI, RUOLO_LABEL, type Ruolo } from '@/lib/operatori-types';

// ─── Tipi vista ──────────────────────────────────────────────────────────────

interface OperatoreView {
  id:                    string;
  username:              string;
  displayName:           string;
  ruoli:                 Ruolo[];
  chatIdTelegram:        number | null;
  telegramRegisteredAt:  number | null;
  attivo:                boolean;
  createdAt:             number;
  updatedAt:             number;
}

// ─── Login form (riusato da pattern AdminPulizie) ───────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [pwd,  setPwd]  = useState('');
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true); setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) onLogin();
    else setErr('Password errata');
    setBusy(false);
  }

  return (
    <div className="container" style={{ maxWidth: 360 }}>
      <div className="card shadow-sm mt-5">
        <div className="card-body p-4">
          <p className="fs-4 fw-bold mb-1"><Icon name="lock-fill" className="me-1" /> Admin</p>
          <p className="text-muted small mb-3">Operatori — LivingApple</p>
          <input type="password" className="form-control mb-2" placeholder="Password"
            value={pwd} onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()} />
          {err && <p className="small text-danger mb-2">{err}</p>}
          <button className="btn btn-success fw-bold w-100" onClick={login} disabled={busy}>
            {busy ? 'Accesso…' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chip di selezione ruolo ────────────────────────────────────────────────

function ChipsRuoli({ value, onChange }: {
  value:    Ruolo[];
  onChange: (next: Ruolo[]) => void;
}) {
  return (
    <div className="d-flex flex-wrap gap-2">
      {RUOLI.map(r => {
        const active = value.includes(r);
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(active ? value.filter(x => x !== r) : [...value, r])}
            className="btn btn-sm"
            style={{
              border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              borderRadius: 999,
              background: active ? 'var(--color-primary-soft)' : 'var(--color-bg)',
              color: active ? 'var(--color-primary)' : 'var(--color-text)',
              fontWeight: active ? 600 : 400,
            }}
          >
            {RUOLO_LABEL[r]}
          </button>
        );
      })}
    </div>
  );
}

// ─── Modal creazione operatore ──────────────────────────────────────────────

function NuovoOperatoreModal({ onClose, onCreated }: {
  onClose:   () => void;
  onCreated: (op: OperatoreView) => void;
}) {
  const [username,    setUsername]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const [ruoli,       setRuoli]       = useState<Ruolo[]>([]);
  const [password,    setPassword]    = useState('');
  const [err,         setErr]         = useState('');
  const [busy,        setBusy]        = useState(false);

  async function submit() {
    if (busy) return;
    if (!displayName.trim()) { setErr('Inserisci il nome visualizzato'); return; }
    if (!username.trim())    { setErr('Inserisci uno username (3-30 caratteri minuscoli + numeri + trattino)'); return; }
    if (ruoli.length === 0)  { setErr('Seleziona almeno un ruolo'); return; }
    if (password.length < 6) { setErr('Password minima 6 caratteri'); return; }
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/operatori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, ruoli, password, attivo: true }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? `Errore ${res.status}`); return; }
      onCreated(data.operatore as OperatoreView);
      onClose();
    } catch {
      setErr('Errore di rete');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="fs-5 fw-bold mb-0">Nuovo operatore</p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>

        <label className="small fw-semibold text-muted">Nome visualizzato</label>
        <input className="form-control mb-2" placeholder="Maria Rossi"
          value={displayName} onChange={e => setDisplayName(e.target.value)} />

        <label className="small fw-semibold text-muted">Username (per login)</label>
        <input className="form-control mb-2" placeholder="maria-rossi"
          value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />

        <label className="small fw-semibold text-muted">Ruoli</label>
        <div className="mb-2"><ChipsRuoli value={ruoli} onChange={setRuoli} /></div>

        <label className="small fw-semibold text-muted">Password (≥6 caratteri)</label>
        <input type="password" className="form-control mb-2"
          value={password} onChange={e => setPassword(e.target.value)} />

        {err && <p className="small text-danger mb-2">{err}</p>}

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annulla</button>
          <button className="btn btn-success fw-bold" onClick={submit} disabled={busy}>
            {busy ? 'Creazione…' : 'Crea operatore'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal reset password ────────────────────────────────────────────────────

function ResetPasswordModal({ op, onClose, onDone }: {
  op:      OperatoreView;
  onClose: () => void;
  onDone:  () => void;
}) {
  const [pwd, setPwd]   = useState('');
  const [err, setErr]   = useState('');
  const [msg, setMsg]   = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (pwd.length < 6) { setErr('Min 6 caratteri'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      const res = await fetch(`/api/admin/operatori/${op.id}/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: pwd }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? 'Errore'); return; }
      setMsg('Password aggiornata. Comunicala all\'operatore.');
      setTimeout(() => { onDone(); onClose(); }, 1500);
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="fs-5 fw-bold mb-0">Reset password — {op.displayName}</p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>
        <label className="small fw-semibold text-muted">Nuova password</label>
        <input type="text" className="form-control mb-2"
          value={pwd} onChange={e => setPwd(e.target.value)} placeholder="≥6 caratteri" />
        <p className="small text-muted">Le sessioni esistenti restano attive fino a scadenza naturale (90gg).</p>
        {err && <p className="small text-danger mb-2">{err}</p>}
        {msg && <p className="small text-success mb-2">{msg}</p>}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annulla</button>
          <button className="btn btn-warning fw-bold" onClick={submit} disabled={busy}>
            {busy ? 'Salvataggio…' : 'Imposta password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal deeplink Telegram ────────────────────────────────────────────────

function TelegramLinkModal({ op, onClose }: {
  op:      OperatoreView;
  onClose: () => void;
}) {
  const [link, setLink] = useState('');
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true); setErr('');
    try {
      const res = await fetch(`/api/admin/operatori/${op.id}/telegram-link`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? 'Errore'); return; }
      setLink(data.deeplink);
    } finally { setBusy(false); }
  }, [op.id]);

  useEffect(() => { generate(); }, [generate]);

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-card-custom" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="fs-5 fw-bold mb-0">Link Telegram — {op.displayName}</p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>
        <p className="small text-muted">
          Condividi questo link con l&apos;operatore (WhatsApp, SMS, email). Cliccandolo verrà aperta
          la chat con il bot Telegram, e la sua identità verrà collegata automaticamente.
          Valido 7 giorni, single-use.
        </p>
        {busy && <p className="small text-muted">Generazione…</p>}
        {err  && <p className="small text-danger">{err}</p>}
        {link && (
          <div className="d-flex gap-2">
            <input className="form-control" readOnly value={link} />
            <button className="btn btn-primary" onClick={copy}>
              {copied ? <><Icon name="check-lg" /> Copiato</> : 'Copia'}
            </button>
          </div>
        )}
        <div className="d-flex gap-2 justify-content-between mt-3">
          <button className="btn btn-outline-secondary" onClick={generate} disabled={busy}>
            <Icon name="arrow-clockwise" className="me-1" /> Rigenera
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}

// ─── Card operatore ──────────────────────────────────────────────────────────

function OperatoreCard({ op, onUpdate, onDelete, onResetPwd, onTelegram }: {
  op:         OperatoreView;
  onUpdate:   (updated: OperatoreView) => void;
  onDelete:   () => void;
  onResetPwd: () => void;
  onTelegram: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    displayName: op.displayName,
    username:    op.username,
    ruoli:       op.ruoli,
    attivo:      op.attivo,
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  async function save() {
    if (saving) return;
    setSaving(true); setErr('');
    try {
      const res = await fetch(`/api/admin/operatori/${op.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? 'Errore'); return; }
      onUpdate(data.operatore);
      setEditing(false);
    } finally { setSaving(false); }
  }

  return (
    <div className="card shadow-sm mb-2" style={{ background: op.attivo ? 'var(--color-bg)' : 'var(--color-bg-muted)' }}>
      <div className="card-body p-3">
        {!editing ? (
          <>
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <p className="fw-bold fs-6 mb-0">
                  <Icon name="person-fill" className="me-1" /> {op.displayName}
                  {!op.attivo && <span className="badge bg-secondary ms-2">disattivato</span>}
                </p>
                <p className="small text-muted mb-1">
                  username: <code>{op.username}</code>
                </p>
                <div className="d-flex flex-wrap gap-1 mb-1">
                  {op.ruoli.map(r => (
                    <span key={r} className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
                      {RUOLO_LABEL[r]}
                    </span>
                  ))}
                </div>
                {op.chatIdTelegram ? (
                  <p className="small text-success mb-0">
                    <Icon name="chat-fill" className="me-1" /> Telegram registrato
                  </p>
                ) : (
                  <p className="small text-muted mb-0">
                    <Icon name="chat-fill" className="me-1" /> Telegram non collegato
                  </p>
                )}
              </div>
              <div className="d-flex gap-1 flex-wrap justify-content-end">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(true)}>
                  <Icon name="pencil-fill" />
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={onTelegram}>
                  <Icon name="chat-fill" />
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={onResetPwd}>
                  <Icon name="lock-fill" />
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={onDelete}>
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between mb-2">
              <p className="fw-bold mb-0">Modifica operatore</p>
              <button className="btn btn-link p-0 text-secondary" onClick={() => setEditing(false)}>
                <Icon name="x-lg" />
              </button>
            </div>
            <label className="small fw-semibold text-muted">Nome visualizzato</label>
            <input className="form-control form-control-sm mb-2" value={draft.displayName}
              onChange={e => setDraft({ ...draft, displayName: e.target.value })} />
            <label className="small fw-semibold text-muted">Username</label>
            <input className="form-control form-control-sm mb-2" value={draft.username}
              onChange={e => setDraft({ ...draft, username: e.target.value.toLowerCase() })} />
            <label className="small fw-semibold text-muted">Ruoli</label>
            <div className="mb-2">
              <ChipsRuoli value={draft.ruoli} onChange={ruoli => setDraft({ ...draft, ruoli })} />
            </div>
            <div className="form-check mb-3">
              <input id={`attivo-${op.id}`} type="checkbox" className="form-check-input"
                checked={draft.attivo}
                onChange={e => setDraft({ ...draft, attivo: e.target.checked })} />
              <label htmlFor={`attivo-${op.id}`} className="form-check-label small">
                Operatore attivo
              </label>
            </div>
            {err && <p className="small text-danger">{err}</p>}
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)} disabled={saving}>
                Annulla
              </button>
              <button className="btn btn-success btn-sm fw-bold" onClick={save} disabled={saving}>
                {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminOperatori() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [ops,    setOps]    = useState<OperatoreView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [filtro,  setFiltro]  = useState<'Tutti' | Ruolo>('Tutti');

  const [showNew,        setShowNew]        = useState(false);
  const [resettingPwd,   setResettingPwd]   = useState<OperatoreView | null>(null);
  const [tgFor,          setTgFor]          = useState<OperatoreView | null>(null);

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/operatori');
      if (!res.ok) { setError('Errore caricamento'); return; }
      const data = await res.json();
      setOps(data.operatori as OperatoreView[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  async function eliminaOperatore(op: OperatoreView) {
    if (!confirm(`Eliminare l'operatore "${op.displayName}"? Operazione irreversibile.`)) return;
    const res = await fetch(`/api/admin/operatori/${op.id}`, { method: 'DELETE' });
    if (res.ok) setOps(ops.filter(o => o.id !== op.id));
  }

  function aggiornaOperatore(updated: OperatoreView) {
    setOps(ops.map(o => o.id === updated.id ? updated : o));
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed)         return <LoginForm onLogin={() => setAuthed(true)} />;

  const opsFiltrati = filtro === 'Tutti'
    ? ops
    : ops.filter(o => o.ruoli.includes(filtro));

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0"><Icon name="people-fill" className="me-1" /> Operatori</h1>
          <p className="small text-muted mb-0">{ops.length} operatori · {ops.filter(o => o.attivo).length} attivi</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a href="/admin/operativita" className="btn btn-outline-secondary btn-sm">← Area operatori</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
            <Icon name="arrow-clockwise" /> Aggiorna
          </button>
          <button className="btn btn-success btn-sm fw-bold" onClick={() => setShowNew(true)}>
            <Icon name="person-fill" className="me-1" /> Nuovo operatore
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      {/* Filtro ruolo */}
      <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
        <span className="small fw-semibold text-muted me-1">Filtra ruolo:</span>
        {(['Tutti', ...RUOLI] as const).map(f => {
          const active = filtro === f;
          return (
            <button key={f}
              onClick={() => setFiltro(f)}
              className="btn btn-sm"
              style={{
                border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: 999,
                background: active ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                color: active ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: active ? 600 : 400,
              }}>
              {f === 'Tutti' ? 'Tutti' : RUOLO_LABEL[f]}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger py-2 small">
          <Icon name="exclamation-circle-fill" className="me-1" /> {error}
        </div>
      )}

      {!loading && opsFiltrati.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-4">
            <p className="text-muted mb-0">
              {ops.length === 0
                ? 'Nessun operatore. Clicca "Nuovo operatore" per iniziare.'
                : 'Nessun operatore con questo filtro.'}
            </p>
          </div>
        </div>
      )}

      {opsFiltrati.map(op => (
        <OperatoreCard key={op.id}
          op={op}
          onUpdate={aggiornaOperatore}
          onDelete={() => eliminaOperatore(op)}
          onResetPwd={() => setResettingPwd(op)}
          onTelegram={() => setTgFor(op)}
        />
      ))}

      {showNew && (
        <NuovoOperatoreModal
          onClose={() => setShowNew(false)}
          onCreated={(op) => setOps([op, ...ops])}
        />
      )}
      {resettingPwd && (
        <ResetPasswordModal op={resettingPwd}
          onClose={() => setResettingPwd(null)}
          onDone={() => {}} />
      )}
      {tgFor && <TelegramLinkModal op={tgFor} onClose={() => setTgFor(null)} />}
    </div>
  );
}
