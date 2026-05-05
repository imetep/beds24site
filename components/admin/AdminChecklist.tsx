'use client';

/**
 * AdminChecklist — gestione delle 4 master checklist (pulizie, manutentore,
 * giardiniere, receptionist) tramite upload di file xlsx.
 *
 * Per ogni ruolo:
 *   - Mostra stato corrente (n. voci, file, data import)
 *   - Permette di caricare/sostituire un xlsx
 *   - Mostra warnings dell'ultimo import
 *   - Permette di cancellare la master
 *
 * Le istanze già compilate (turnover) non sono toccate dal re-import.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { RUOLI, RUOLO_LABEL, type Ruolo } from '@/lib/operatori-types';

interface MasterSummary {
  ruolo:        Ruolo;
  voci:         number;
  importedAt:   number | null;
  importedFrom: string | null;
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
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
          <p className="text-muted small mb-3">Checklist — LivingApple</p>
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

// ─── Card singolo ruolo ──────────────────────────────────────────────────────

function RuoloCard({ summary, onUploaded, onDeleted }: {
  summary:    MasterSummary;
  onUploaded: (newSummary: MasterSummary, warnings: string[]) => void;
  onDeleted:  () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function upload(file: File) {
    if (busy) return;
    setBusy(true); setWarnings([]); setError('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('ruolo', summary.ruolo);

    try {
      const res = await fetch('/api/admin/checklist', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.master) {
        setError(
          (data?.errors?.length ? data.errors.join(' · ') : data?.error) ??
          `Errore ${res.status}`,
        );
        if (Array.isArray(data?.warnings)) setWarnings(data.warnings);
        return;
      }
      onUploaded(data.master as MasterSummary, data.warnings ?? []);
      setWarnings(data.warnings ?? []);
    } catch {
      setError('Errore di rete');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function elimina() {
    if (!confirm(`Cancellare la master "${RUOLO_LABEL[summary.ruolo]}"? Le istanze già compilate restano.`)) return;
    const res = await fetch(`/api/admin/checklist?ruolo=${summary.ruolo}`, { method: 'DELETE' });
    if (res.ok) onDeleted();
  }

  const caricato = summary.voci > 0 && summary.importedAt;

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div>
            <p className="fw-bold fs-6 mb-0">
              <Icon name="card-list" className="me-1" />
              {RUOLO_LABEL[summary.ruolo]}
            </p>
            {caricato ? (
              <p className="small text-success mb-0">
                {summary.voci} voci caricate
                {summary.importedFrom && <> · file <code>{summary.importedFrom}</code></>}
                {summary.importedAt && <> · {fmtDate(summary.importedAt)}</>}
              </p>
            ) : (
              <p className="small text-muted mb-0">Nessuna checklist caricata</p>
            )}
          </div>

          {caricato && (
            <button className="btn btn-outline-danger btn-sm" onClick={elimina}>
              <Icon name="trash" />
            </button>
          )}
        </div>

        <div className="d-flex gap-2 align-items-center flex-wrap mt-2">
          <input ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="form-control form-control-sm"
            style={{ maxWidth: 320 }}
            disabled={busy}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          {busy && <span className="small text-muted">Caricamento…</span>}
        </div>

        {error && (
          <div className="alert alert-danger py-2 mt-2 mb-0 small">
            <Icon name="exclamation-circle-fill" className="me-1" /> {error}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="alert alert-warning py-2 mt-2 mb-0 small">
            <Icon name="exclamation-triangle-fill" className="me-1" />
            <b>Avvisi import:</b>
            <ul className="mb-0 mt-1 ps-3">
              {warnings.slice(0, 8).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
              {warnings.length > 8 && <li>… e altri {warnings.length - 8} avvisi</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminChecklist() {
  const [authed, setAuthed]   = useState<boolean | null>(null);
  const [summary, setSummary] = useState<Record<Ruolo, MasterSummary> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/checklist');
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data.summary as Record<Ruolo, MasterSummary>);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0"><Icon name="card-list" className="me-1" /> Checklist</h1>
          <p className="small text-muted mb-0">Carica un file .xlsx per ruolo</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a href="/admin/operativita" className="btn btn-outline-secondary btn-sm">← Area operatori</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
            <Icon name="arrow-clockwise" /> Aggiorna
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      <div className="alert alert-info py-2 small">
        <Icon name="info-circle-fill" className="me-1" />
        Schema xlsx atteso: 11 colonne con header <code>ID</code>, <code>Ambiente</code>,
        <code> Attività</code>, <code>Dettaglio operativo</code>, <code>Frequenza</code>,
        <code> Priorità</code>, <code>Stato</code>, <code>Foto richiesta</code>,
        <code> Controllo finale</code>, <code>Note ditta</code>,
        <code> Segnalazione/manutenzione</code>. Le righe sopra l&apos;header sono ignorate.
        Re-uploadare sostituisce la master ma non tocca le istanze già compilate.
      </div>

      {summary && RUOLI.map(r => (
        <RuoloCard key={r}
          summary={summary[r]}
          onUploaded={(s) => setSummary({ ...summary, [r]: s })}
          onDeleted={() => setSummary({ ...summary, [r]: { ruolo: r, voci: 0, importedAt: null, importedFrom: null } })}
        />
      ))}
    </div>
  );
}
