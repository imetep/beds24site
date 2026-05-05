'use client';

/**
 * AdminTelegram — pagina di setup e diagnostica dell'integrazione Telegram.
 *
 * Funzionalità:
 *   - Stato webhook (URL atteso vs registrato, last_error_message)
 *   - Bottone "Registra webhook" (idempotente, da usare dopo deploy)
 *   - Stato admin chatId (env vs Redis vs nessuno)
 *   - Bottone "Genera link admin" → modale con deeplink copiabile
 */

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';

interface WebhookStatus {
  info: {
    url:                    string;
    has_custom_certificate: boolean;
    pending_update_count:   number;
    last_error_date?:       number;
    last_error_message?:    string;
  } | null;
  expectedUrl:    string | null;
  botUsername:    string | undefined;
  adminChatIdSet: boolean;
}

interface AdminChatIdStatus {
  adminChatId: string | null;
  source:      'env' | 'kv' | null;
}

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
    if (res.ok) onLogin();
    else setErr('Password errata');
    setBusy(false);
  }
  return (
    <div className="container" style={{ maxWidth: 360 }}>
      <div className="card shadow-sm mt-5">
        <div className="card-body p-4">
          <p className="fs-4 fw-bold mb-1"><Icon name="lock-fill" className="me-1" /> Admin</p>
          <p className="text-muted small mb-3">Telegram — LivingApple</p>
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

// ─── Modale link admin ───────────────────────────────────────────────────────

function AdminLinkModal({ onClose }: { onClose: () => void }) {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/telegram/registra-admin', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? 'Errore'); return; }
      setLink(data.deeplink);
    } finally { setBusy(false); }
  }, []);

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
          <p className="fs-5 fw-bold mb-0">Link registrazione admin</p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>
        <p className="small text-muted">
          Apri questo link sul tuo Telegram (sul dispositivo dove vuoi ricevere le notifiche).
          Cliccando, il bot saprà chi sei e da quel momento riceverai qui le segnalazioni
          e i messaggi di &quot;Lavoro terminato&quot; degli operatori.
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
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminTelegram() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [webhook, setWebhook] = useState<WebhookStatus | null>(null);
  const [chatIdStatus, setChatIdStatus] = useState<AdminChatIdStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, cRes] = await Promise.all([
        fetch('/api/admin/telegram/setup'),
        fetch('/api/admin/telegram/registra-admin'),
      ]);
      if (wRes.ok) setWebhook(await wRes.json());
      if (cRes.ok) setChatIdStatus(await cRes.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  async function registraWebhook() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/telegram/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setMsg({ kind: 'err', text: data?.error ?? 'Errore' }); return; }
      setMsg({ kind: 'ok', text: `Webhook registrato: ${data.url}` });
      load();
    } finally { setBusy(false); }
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 800 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0">
            <Icon name="chat-fill" className="me-1" /> Telegram
          </h1>
          <p className="small text-muted mb-0">Setup notifiche & OTP operatori</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
            <Icon name="arrow-clockwise" /> Aggiorna
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.kind === 'ok' ? 'alert-success' : 'alert-danger'} py-2 small`}>
          <Icon name={msg.kind === 'ok' ? 'check-circle-fill' : 'exclamation-circle-fill'} className="me-1" />
          {msg.text}
        </div>
      )}

      {/* Stato webhook */}
      <div className="card shadow-sm mb-3">
        <div className="card-body p-3">
          <p className="fw-bold mb-2"><Icon name="link-45deg" className="me-1" /> Webhook bot</p>
          {webhook && (
            <>
              <p className="small mb-1">
                <b>URL atteso:</b> <code>{webhook.expectedUrl ?? '— NEXT_PUBLIC_BASE_URL non settato —'}</code>
              </p>
              <p className="small mb-1">
                <b>URL registrato:</b>{' '}
                {webhook.info?.url ? (
                  <code>{webhook.info.url}</code>
                ) : (
                  <span className="text-warning">non registrato</span>
                )}
              </p>
              {webhook.info && (
                <p className="small mb-1">
                  <b>Bot:</b> @{webhook.botUsername} ·
                  <b className="ms-1">Updates pendenti:</b> {webhook.info.pending_update_count}
                </p>
              )}
              {webhook.info?.last_error_message && (
                <p className="small text-danger mb-1">
                  <Icon name="exclamation-circle-fill" className="me-1" />
                  Ultimo errore: {webhook.info.last_error_message}
                </p>
              )}
              <button className="btn btn-primary btn-sm fw-bold mt-2"
                onClick={registraWebhook} disabled={busy}>
                <Icon name="arrow-clockwise" className="me-1" />
                {busy ? 'Registrazione…' : 'Registra/aggiorna webhook'}
              </button>
              <p className="small text-muted mt-2 mb-0 fst-italic">
                Va eseguito una sola volta dopo il primo deploy in produzione.
                In sviluppo locale fallisce (Telegram esige HTTPS pubblico).
              </p>
            </>
          )}
        </div>
      </div>

      {/* Stato admin chatId */}
      <div className="card shadow-sm mb-3">
        <div className="card-body p-3">
          <p className="fw-bold mb-2"><Icon name="person-fill" className="me-1" /> Notifiche admin</p>
          {chatIdStatus && (
            <>
              {chatIdStatus.adminChatId ? (
                <p className="small mb-2">
                  <Icon name="check-circle-fill" className="text-success me-1" />
                  Admin chatId registrato (<code>{chatIdStatus.adminChatId}</code>),
                  fonte: <b>{chatIdStatus.source === 'env' ? 'variabile ambiente' : 'Redis'}</b>.
                </p>
              ) : (
                <p className="small text-warning mb-2">
                  <Icon name="exclamation-triangle-fill" className="me-1" />
                  Nessun admin chatId. Le notifiche segnalazioni e &quot;Lavoro terminato&quot; non vengono inviate.
                  Genera un link e cliccalo dal tuo Telegram per registrarti.
                </p>
              )}
              <button className="btn btn-primary btn-sm fw-bold"
                onClick={() => setShowLinkModal(true)}>
                <Icon name="chat-fill" className="me-1" />
                Genera link registrazione admin
              </button>
            </>
          )}
        </div>
      </div>

      {showLinkModal && <AdminLinkModal onClose={() => { setShowLinkModal(false); load(); }} />}
    </div>
  );
}
