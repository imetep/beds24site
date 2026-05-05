'use client';

/**
 * AdminSmistamento — pannello smistamento giornaliero dei turnover.
 *
 * Funzionalità:
 *   - Filtro data (default oggi → +14g)
 *   - Bottone "Sincronizza Beds24" per generare turnover mancanti
 *   - Lista turnover ordinati per data → stato → casa
 *   - Per ogni turnover:
 *       - assegnazione operatore (dropdown solo operatori con ruolo pulizie)
 *       - bottone "Casa pronta!" (per stato lavoro-terminato)
 *       - link al dettaglio task (per vedere checklist + segnalazioni)
 */

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Casa } from '@/lib/case-types';
import type { Task } from '@/lib/task-types';
import type { Ruolo } from '@/lib/operatori-types';

interface OperatoreLite {
  id:          string;
  displayName: string;
  ruoli:       Ruolo[];
}

interface CasaLite {
  id:           string;
  nome:         string;
  beds24RoomId: number;
}

interface TaskEnriched extends Task {
  casa:      CasaLite | null;
  operatore: OperatoreLite | null;
}

interface SyncResult {
  creati:           number;
  esistenti:        number;
  senzaCasa:        number;
  senzaMaster:      number;
  caseArchiviate:   number;
  totaleProcessate: number;
}

function fmtData(ymd: string): string {
  const d = new Date(ymd + 'T12:00:00');
  return d.toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'short',
  });
}

function todayYMD(): string { return new Date().toISOString().slice(0, 10); }
function plusDaysYMD(d: number): string {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

const STATO_CONF: Record<Task['stato'], { label: string; bg: string; color: string }> = {
  'da-assegnare':     { label: 'Da assegnare',     bg: '#fee2e2', color: '#7f1d1d' },
  'assegnato':        { label: 'Assegnato',        bg: '#dbeafe', color: '#1e3a8a' },
  'in-corso':         { label: 'In corso',         bg: '#fef3c7', color: '#78350f' },
  'lavoro-terminato': { label: 'Lavoro terminato', bg: '#fef3c7', color: '#78350f' },
  'completato':       { label: 'Completato',       bg: '#dcfce7', color: '#14532d' },
  'annullato':        { label: 'Annullato',        bg: '#f5f5f5', color: '#525252' },
};

// ─── LoginForm ───────────────────────────────────────────────────────────────

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
          <p className="text-muted small mb-3">Smistamento — LivingApple</p>
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

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminSmistamento() {
  const [authed,   setAuthed]   = useState<boolean | null>(null);
  const [tasks,    setTasks]    = useState<TaskEnriched[]>([]);
  const [operatori, setOperatori] = useState<OperatoreLite[]>([]);
  const [from,     setFrom]     = useState(todayYMD());
  const [to,       setTo]       = useState(plusDaysYMD(14));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [syncing,  setSyncing]  = useState(false);
  const [syncMsg,  setSyncMsg]  = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [tasksRes, opsRes] = await Promise.all([
        fetch(`/api/admin/turnover?from=${from}&to=${to}`),
        fetch('/api/admin/operatori'),
      ]);
      if (!tasksRes.ok) { setError('Errore caricamento task'); return; }
      const taskData = await tasksRes.json();
      setTasks(taskData.tasks ?? []);
      if (opsRes.ok) {
        const opData = await opsRes.json();
        setOperatori(opData.operatori ?? []);
      }
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  async function sync() {
    if (syncing) return;
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await fetch('/api/admin/turnover/sync', { method: 'POST' });
      const data: SyncResult & { error?: string } = await res.json();
      if (!res.ok) { setSyncMsg(`Errore: ${data?.error ?? res.status}`); return; }
      const parts: string[] = [];
      parts.push(`${data.creati} creati`);
      if (data.esistenti)      parts.push(`${data.esistenti} esistenti`);
      if (data.senzaCasa)      parts.push(`${data.senzaCasa} senza casa censita`);
      if (data.caseArchiviate) parts.push(`${data.caseArchiviate} case archiviate`);
      if (data.senzaMaster)    parts.push(`${data.senzaMaster} senza master pulizie`);
      setSyncMsg(`Sync OK: ${parts.join(' · ')}`);
      load();
    } finally { setSyncing(false); }
  }

  async function assign(taskId: string, operatoreId: string) {
    if (!operatoreId) {
      // unassign
      await fetch(`/api/admin/turnover/${taskId}/assign`, { method: 'DELETE' });
    } else {
      await fetch(`/api/admin/turnover/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatoreId }),
      });
    }
    load();
  }

  async function casaPronta(taskId: string) {
    if (!confirm('Confermare "Casa pronta"? Il turnover verrà chiuso.')) return;
    const res = await fetch(`/api/admin/turnover/${taskId}/complete`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json();
      alert(d?.error ?? 'Errore');
      return;
    }
    load();
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  // Operatori filtrati per ruolo pulizie
  const opPulizie = operatori.filter(o => o.ruoli.includes('pulizie'));

  // Raggruppa per data
  const byDate = new Map<string, TaskEnriched[]>();
  for (const t of tasks) {
    const arr = byDate.get(t.data) ?? [];
    arr.push(t);
    byDate.set(t.data, arr);
  }
  const dateOrdinate = Array.from(byDate.keys()).sort();

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0"><Icon name="brush-fill" className="me-1" /> Smistamento turnover</h1>
          <p className="small text-muted mb-0">{tasks.length} turnover nel periodo</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-primary btn-sm" onClick={sync} disabled={syncing}>
            <Icon name="arrow-clockwise" /> {syncing ? 'Sync…' : 'Sincronizza Beds24'}
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
            <Icon name="arrow-clockwise" /> Aggiorna
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      {syncMsg && (
        <div className={`alert ${syncMsg.startsWith('Errore') ? 'alert-danger' : 'alert-success'} py-2 small`}>
          <Icon name={syncMsg.startsWith('Errore') ? 'exclamation-circle-fill' : 'check-circle-fill'} className="me-1" />
          {syncMsg}
        </div>
      )}

      {/* Range data */}
      <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
        <label className="small fw-semibold text-muted">Da</label>
        <input type="date" className="form-control form-control-sm" style={{ maxWidth: 160 }}
          value={from} onChange={e => setFrom(e.target.value)} />
        <label className="small fw-semibold text-muted">A</label>
        <input type="date" className="form-control form-control-sm" style={{ maxWidth: 160 }}
          value={to} onChange={e => setTo(e.target.value)} />
      </div>

      {opPulizie.length === 0 && (
        <div className="alert alert-warning py-2 small">
          <Icon name="exclamation-triangle-fill" className="me-1" />
          Nessun operatore con ruolo &quot;pulizie&quot;. Crea gli operatori in <a href="/admin/operatori">/admin/operatori</a>.
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2 small">{error}</div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-4">
            <p className="text-muted mb-2">Nessun turnover nel periodo.</p>
            <button className="btn btn-outline-primary btn-sm" onClick={sync} disabled={syncing}>
              <Icon name="arrow-clockwise" className="me-1" />
              Sincronizza ora
            </button>
          </div>
        </div>
      )}

      {dateOrdinate.map(data => (
        <div key={data} className="mb-4">
          <p className="small fw-bold text-uppercase text-secondary mb-2"
            style={{ letterSpacing: '0.06em' }}>
            <Icon name="calendar-event" className="me-1" /> {fmtData(data)}
            <span className="ms-2 text-muted fw-normal">({byDate.get(data)!.length})</span>
          </p>

          {byDate.get(data)!.map(t => {
            const stato = STATO_CONF[t.stato];
            return (
              <div key={t.id} className="card shadow-sm mb-2">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                    <div className="flex-fill">
                      <p className="fw-bold mb-0">
                        <Icon name="house-fill" className="me-1" />
                        {t.casa?.nome ?? `Room ${t.casa?.beds24RoomId ?? '?'}`}
                      </p>
                      {t.descrizione && (
                        <p className="small text-muted mb-1">{t.descrizione}</p>
                      )}
                      <span className="badge"
                        style={{ background: stato.bg, color: stato.color, marginRight: 8 }}>
                        {stato.label}
                      </span>
                      {t.beds24BookId && (
                        <span className="small text-muted">Beds24 #{t.beds24BookId}</span>
                      )}
                    </div>

                    <div className="d-flex flex-column gap-1 align-items-stretch" style={{ minWidth: 240 }}>
                      <select className="form-select form-select-sm"
                        value={t.operatoreId ?? ''}
                        onChange={e => assign(t.id, e.target.value)}
                        disabled={t.stato === 'completato' || t.stato === 'annullato'}>
                        <option value="">— Non assegnato —</option>
                        {opPulizie.map(o => (
                          <option key={o.id} value={o.id}>{o.displayName}</option>
                        ))}
                      </select>

                      {t.stato === 'lavoro-terminato' && (
                        <button className="btn btn-success btn-sm fw-bold"
                          onClick={() => casaPronta(t.id)}>
                          <Icon name="check-circle-fill" className="me-1" />
                          Casa pronta
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
