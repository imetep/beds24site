'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="card shadow-sm mt-5 mx-auto">
        <div className="card-body p-4">
          <p className="fs-4 fw-bold mb-1"><i className="bi bi-lock-fill me-1"></i> Admin</p>
          <p className="text-muted small mb-3">Pannello di gestione LivingApple</p>
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          {err && <p className="small text-danger mb-2">{err}</p>}
          <button
            className="btn btn-success fw-bold w-100"
            onClick={login}
            disabled={busy}
          >
            {busy ? 'Accesso…' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  if (authed === null) {
    return <div className="text-center text-muted py-5">Caricamento…</div>;
  }
  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  const sezioni = [
    {
      icon: 'bi-check-circle-fill',
      title: 'Check-in online',
      desc: 'Gestisci le richieste di self check-in degli ospiti. Approva, rifiuta, invia link deposito Stripe, messaggia con l\'ospite.',
      href: '/admin/checkin',
      color: '#1E73BE',
    },
    {
      icon: 'bi-moon-stars-fill',
      title: 'Biancheria',
      desc: 'Calcolo automatico della biancheria per ogni check-in nel periodo. Configurabile da admin o ospite; totali aggregati per periodo.',
      href: '/admin/biancheria',
      color: '#0284c7',
    },
    {
      icon: 'bi-brush-fill',
      title: 'Pulizie',
      desc: 'Alert giornalieri per livello di rischio (CRITICO / ALTO / NORMALE) e tabella movimenti ordinabile per partenze, arrivi e ore di lavoro.',
      href: '/admin/pulizie',
      color: '#16a34a',
    },
    {
      icon: 'bi-calendar-x-fill',
      title: 'Buchi',
      desc: 'Finestre libere inferiori a 7 notti nei prossimi 12 mesi. Filtra per mese e ordina per numero di notti.',
      href: '/admin/buchi',
      color: '#9333ea',
    },
  ];

  return (
    <div className="container py-4 pb-5" style={{ maxWidth: 1400 }}>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold mb-0"><i className="bi bi-house-fill me-1"></i> Admin</h1>
          <p className="small text-muted mb-0">LivingApple — Pannello di gestione</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
      </div>

      {/* Card sezioni */}
      <div className="d-flex flex-column gap-3">
        {sezioni.map(s => (
          <button
            key={s.href}
            onClick={() => router.push(s.href)}
            className="card text-start border-0 shadow-sm p-3"
          >
            <div className="d-flex align-items-start gap-3">
              <span className="fs-1" style={{ color: s.color }}>
                <i className={`bi ${s.icon}`}></i>
              </span>
              <div>
                <p className="fw-bold fs-5 mb-1" style={{ color: s.color }}>{s.title}</p>
                <p className="text-secondary mb-0">{s.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
