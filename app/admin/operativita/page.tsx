'use client';

/**
 * /admin/operativita — hub di tutte le pagine relative alla gestione operatori
 * e turnover (Operatori, Strutture, Checklist, Smistamento, Segnalazioni,
 * Telegram). Stesso pattern visuale della home /admin: card cliccabili.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';

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
          <p className="fs-4 fw-bold mb-1"><Icon name="lock-fill" className="me-1" /> Admin</p>
          <p className="text-muted small mb-3">Area operatori — LivingApple</p>
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

interface Sezione {
  icon:  IconName;
  title: string;
  desc:  string;
  href:  string;
  color: string;
}

const SEZIONI: Sezione[] = [
  {
    icon: 'people-fill',
    title: 'Operatori',
    desc: 'Crea e gestisci operatori (pulizie, manutentore, giardiniere, receptionist). Credenziali, ruoli, deeplink Telegram per OTP/notifiche.',
    href: '/admin/operatori',
    color: '#0ea5e9',
  },
  {
    icon: 'house-door-fill',
    title: 'Strutture',
    desc: 'Anagrafica delle case: mapping Beds24, foto, keybox, dotazioni tecniche, voci checklist non applicabili (no piscina/BBQ/giardino) per ruolo.',
    href: '/admin/strutture',
    color: '#84cc16',
  },
  {
    icon: 'card-list',
    title: 'Checklist',
    desc: 'Carica le checklist dei 4 ruoli da file .xlsx. Rimpiazzare la master non tocca i turnover già compilati (snapshot congelato).',
    href: '/admin/checklist',
    color: '#a855f7',
  },
  {
    icon: 'brush-fill',
    title: 'Smistamento',
    desc: 'Pannello giornaliero per assegnare turnover e accoglienze, sincronizzare le partenze/arrivi da Beds24 e confermare "Casa pronta".',
    href: '/admin/smistamento',
    color: '#0891b2',
  },
  {
    icon: 'exclamation-triangle-fill',
    title: 'Segnalazioni',
    desc: 'Inbox delle segnalazioni inviate dagli operatori. Triage manuale: crea task manutenzione, risolvi direttamente o ignora.',
    href: '/admin/segnalazioni',
    color: '#dc2626',
  },
  {
    icon: 'chat-fill',
    title: 'Telegram',
    desc: 'Setup webhook del bot operatori, registrazione admin per ricevere notifiche, stato delle integrazioni Telegram.',
    href: '/admin/telegram',
    color: '#06b6d4',
  },
];

export default function AdminOperativitaPage() {
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

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold mb-0">
            <Icon name="people-fill" className="me-1" /> Area operatori
          </h1>
          <p className="small text-muted mb-0">
            LivingApple — Gestione operatori, strutture, turnover e segnalazioni
          </p>
        </div>
        <div className="d-flex gap-2">
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      <div className="d-flex flex-column gap-3">
        {SEZIONI.map(s => (
          <button
            key={s.href}
            onClick={() => router.push(s.href)}
            className="card text-start border-0 shadow-sm p-3"
          >
            <div className="d-flex align-items-start gap-3">
              <span style={{ color: s.color }}>
                <Icon name={s.icon} size={40} />
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
