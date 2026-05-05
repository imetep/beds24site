'use client';

/**
 * OpLogin — pagina di login operatori (solo username + password).
 *
 * Per scelta UX (utenti con dimestichezza tech limitata) NON c'è OTP via
 * Telegram: gli operatori usano credenziali classiche e foto/messaggi
 * extra restano su WhatsApp. Telegram resta in uso solo lato admin per
 * ricevere notifiche di segnalazioni e "Lavoro terminato".
 *
 * Dopo successo, redirect a /op/dashboard.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

export default function OpLogin() {
  const router = useRouter();

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 420 }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <p className="fs-4 fw-bold mb-1">
            <Icon name="person-fill" className="me-1" /> Area Operatori
          </p>
          <p className="small text-muted mb-3">LivingApple</p>

          <PasswordLogin onLogged={() => router.push('/op/dashboard')} />
        </div>
      </div>
    </div>
  );
}

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
