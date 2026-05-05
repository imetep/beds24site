'use client';

/**
 * OpLogin — pagina di login operatori con dual-mode:
 *
 *   1. Username + password (default)
 *   2. Username + OTP via Telegram (richiede registrazione precedente
 *      del bot tramite deeplink fornito dall'admin)
 *
 * Dopo successo, redirect a /op/dashboard.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

type Tab = 'password' | 'telegram';

export default function OpLogin() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('password');

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 420 }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <p className="fs-4 fw-bold mb-1">
            <Icon name="person-fill" className="me-1" /> Area Operatori
          </p>
          <p className="small text-muted mb-3">LivingApple</p>

          <ul className="nav nav-tabs mb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {([
              { k: 'password', l: 'Password' },
              { k: 'telegram', l: 'Codice Telegram' },
            ] as const).map(t => (
              <li key={t.k} className="nav-item">
                <button className={`nav-link ${tab === t.k ? 'active' : ''}`}
                  onClick={() => setTab(t.k)}>
                  {t.l}
                </button>
              </li>
            ))}
          </ul>

          {tab === 'password' && <PasswordLogin onLogged={() => router.push('/op/dashboard')} />}
          {tab === 'telegram' && <TelegramLogin onLogged={() => router.push('/op/dashboard')} />}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Password ───────────────────────────────────────────────────────────

function PasswordLogin({ onLogged }: { onLogged: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  async function login() {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/op/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? 'Credenziali non valide'); return; }
      onLogged();
    } catch {
      setErr('Errore di rete');
    } finally { setBusy(false); }
  }

  return (
    <div>
      <label className="small fw-semibold text-muted">Username</label>
      <input className="form-control mb-2" autoFocus
        value={username}
        onChange={e => setUsername(e.target.value.toLowerCase())}
        onKeyDown={e => e.key === 'Enter' && login()} />

      <label className="small fw-semibold text-muted">Password</label>
      <input type="password" className="form-control mb-2"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && login()} />

      {err && <p className="small text-danger mb-2">{err}</p>}

      <button className="btn btn-success fw-bold w-100" onClick={login} disabled={busy}>
        {busy ? 'Accesso…' : 'Entra'}
      </button>

      <p className="small text-muted text-center mt-3 mb-0">
        Hai dimenticato la password? Chiedi all&apos;admin di resettarla.
      </p>
    </div>
  );
}

// ─── Tab Telegram OTP ───────────────────────────────────────────────────────

function TelegramLogin({ onLogged }: { onLogged: () => void }) {
  const [step, setStep] = useState<'username' | 'codice'>('username');
  const [username, setUsername] = useState('');
  const [codice,   setCodice]   = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const [info, setInfo] = useState('');

  async function richiediCodice() {
    if (busy) return;
    if (!username.trim()) { setErr('Inserisci lo username'); return; }
    setBusy(true); setErr(''); setInfo('');
    try {
      const res = await fetch('/api/op/otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? 'Errore'); return; }
      setStep('codice');
      setInfo(data.sent
        ? 'Codice inviato sul tuo Telegram. Inseriscilo qui sotto.'
        : 'Se l\'utente esiste e ha Telegram registrato, riceverai un codice.');
    } finally { setBusy(false); }
  }

  async function verifica() {
    if (busy) return;
    if (!codice.trim()) { setErr('Inserisci il codice'); return; }
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/op/otp-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          codice:   codice.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data?.tentativiRimasti != null
          ? ` (${data.tentativiRimasti} tentativi rimasti)` : '';
        setErr((data?.error ?? 'Codice errato') + detail);
        return;
      }
      onLogged();
    } finally { setBusy(false); }
  }

  return (
    <div>
      {step === 'username' && (
        <>
          <label className="small fw-semibold text-muted">Username</label>
          <input className="form-control mb-2" autoFocus
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            onKeyDown={e => e.key === 'Enter' && richiediCodice()} />
          <p className="small text-muted">
            Riceverai un codice di 6 cifre nel bot Telegram dell&apos;area operatori.
            Devi essere già registrato (clicca prima il link che ti ha mandato l&apos;admin).
          </p>
          {err && <p className="small text-danger mb-2">{err}</p>}
          <button className="btn btn-success fw-bold w-100" onClick={richiediCodice} disabled={busy}>
            {busy ? 'Invio…' : 'Invia codice'}
          </button>
        </>
      )}

      {step === 'codice' && (
        <>
          {info && <div className="alert alert-info py-2 small mb-2">{info}</div>}
          <label className="small fw-semibold text-muted">Codice (6 cifre)</label>
          <input className="form-control mb-2 fs-4 text-center fw-bold" autoFocus
            inputMode="numeric" maxLength={6}
            value={codice}
            onChange={e => setCodice(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && verifica()} />
          {err && <p className="small text-danger mb-2">{err}</p>}
          <button className="btn btn-success fw-bold w-100" onClick={verifica} disabled={busy}>
            {busy ? 'Verifica…' : 'Conferma codice'}
          </button>
          <button className="btn btn-link w-100 mt-2" onClick={() => { setStep('username'); setErr(''); setInfo(''); }}>
            ← Cambia username
          </button>
        </>
      )}
    </div>
  );
}
