'use client';
import { useState, useEffect } from 'react';
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

type Sezione = {
  icon:    IconName;
  title:   string;
  desc:    string;
  color:   string;
  href?:   string;
  action?: () => Promise<void> | void;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [cacheBusy, setCacheBusy] = useState(false);
  const [cacheMsg,  setCacheMsg]  = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
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

  async function invalidateCloudinary() {
    if (cacheBusy) return;
    setCacheBusy(true); setCacheMsg(null);
    try {
      const res  = await fetch('/api/cloudinary/invalidate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Errore');
      setCacheMsg({ kind: 'ok', text: `Cache svuotata (${data.redisKeysDeleted}/${data.redisKeysScanned} chiavi Redis). Le nuove foto appariranno alla prossima visita.` });
    } catch (err) {
      setCacheMsg({ kind: 'err', text: `Errore: ${(err as Error).message}` });
    } finally {
      setCacheBusy(false);
    }
  }

  if (authed === null) {
    return <div className="text-center text-muted py-5">Caricamento…</div>;
  }
  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  const sezioni: Sezione[] = [
    {
      icon: 'check-circle-fill',
      title: 'Check-in online',
      desc: 'Gestisci le richieste di self check-in degli ospiti. Approva, rifiuta, invia link deposito Stripe, messaggia con l\'ospite.',
      href: '/admin/checkin',
      color: 'var(--color-primary)',
    },
    {
      icon: 'file-earmark-image',
      title: 'Preventivi',
      desc: 'Crea offerte personalizzate con sconti per voce, condividi un link valido 48h. Il cliente blocca l\'offerta pagando online o via bonifico.',
      href: '/admin/preventivi',
      color: '#dc2626',
    },
    {
      icon: 'moon-stars-fill',
      title: 'Biancheria',
      desc: 'Calcolo automatico della biancheria per ogni check-in nel periodo. Configurabile da admin o ospite; totali aggregati per periodo.',
      href: '/admin/biancheria',
      color: '#0284c7',
    },
    {
      icon: 'brush-fill',
      title: 'Pulizie',
      desc: 'Alert giornalieri per livello di rischio (CRITICO / ALTO / NORMALE) e tabella movimenti ordinabile per partenze, arrivi e ore di lavoro.',
      href: '/admin/pulizie',
      color: '#16a34a',
    },
    {
      icon: 'calendar-x-fill',
      title: 'Buchi',
      desc: 'Finestre libere inferiori a 7 notti nei prossimi 12 mesi. Filtra per mese e ordina per numero di notti.',
      href: '/admin/buchi',
      color: '#9333ea',
    },
    {
      icon: 'arrow-clockwise',
      title: cacheBusy ? 'Aggiornamento in corso…' : 'Aggiorna foto sito',
      desc: 'Dopo aver caricato nuove foto su Cloudinary, clicca qui per farle apparire sul sito. Svuota le cache (Redis + Next.js).',
      action: invalidateCloudinary,
      color: '#ea580c',
    },
  ];

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1400 }}>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold mb-0"><Icon name="house-fill" className="me-1" /> Admin</h1>
          <p className="small text-muted mb-0">LivingApple — Pannello di gestione</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
      </div>

      {/* Card sezioni */}
      <div className="d-flex flex-column gap-3">
        {sezioni.map(s => (
          <button
            key={s.href ?? s.title}
            onClick={() => s.action ? s.action() : router.push(s.href!)}
            disabled={s.action ? cacheBusy : false}
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

      {cacheMsg && (
        <div
          className={`alert ${cacheMsg.kind === 'ok' ? 'alert-success' : 'alert-danger'} mt-3 mb-0`}
          role="alert"
        >
          <Icon name={cacheMsg.kind === 'ok' ? 'check-circle-fill' : 'exclamation-triangle-fill'} className="me-2" />
          {cacheMsg.text}
        </div>
      )}
    </div>
  );
}
