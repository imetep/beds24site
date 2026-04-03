'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12,
  border: '0.5px solid #e5e7eb', padding: '28px 24px',
};
const btnG: React.CSSProperties = {
  padding: '10px 20px', fontSize: 14, fontWeight: 700,
  background: '#16a34a', color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer',
};
const btnSec: React.CSSProperties = {
  padding: '8px 14px', fontSize: 13,
  background: 'none', color: '#6b7280',
  border: '0.5px solid #d1d5db', borderRadius: 8, cursor: 'pointer',
};

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
    <div style={{ maxWidth: 360, margin: '80px auto', padding: '0 20px' }}>
      <div style={{ ...card }}>
        <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111' }}>🔒 Admin</p>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>Pannello di gestione LivingApple</p>
        <input
          type="password" placeholder="Password"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{
            width: '100%', padding: '10px 12px', fontSize: 15,
            border: '1px solid #d1d5db', borderRadius: 8,
            marginBottom: 10, boxSizing: 'border-box',
          }}
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
    return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Caricamento…</div>;
  }
  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  const sezioni = [
    {
      icon: '✅',
      title: 'Check-in online',
      desc: 'Gestisci le richieste di self check-in degli ospiti. Approva, rifiuta, invia link deposito Stripe, messaggia con l\'ospite.',
      href: '/admin/checkin',
      color: '#1E73BE',
    },
    {
      icon: '🗓️',
      title: 'Operativo',
      desc: 'Analizza buchi tra prenotazioni (< 7 notti) e pianifica le pulizie con livello di rischio giornaliero per tutte le proprietà.',
      href: '/admin/operativo',
      color: '#16a34a',
    },
  ];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111' }}>🏠 Admin</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9ca3af' }}>LivingApple — Pannello di gestione</p>
        </div>
        <button style={btnSec} onClick={logout}>Esci</button>
      </div>

      {/* Card sezioni */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sezioni.map(s => (
          <button
            key={s.href}
            onClick={() => router.push(s.href)}
            style={{
              ...card,
              display: 'flex', alignItems: 'flex-start', gap: 20,
              cursor: 'pointer', border: 'none', textAlign: 'left',
              transition: 'box-shadow 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <span style={{ fontSize: 36, lineHeight: 1 }}>{s.icon}</span>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: s.color }}>{s.title}</p>
              <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
