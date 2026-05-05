'use client';

/**
 * AdminSegnalazioni — Inbox segnalazioni con triage manuale (decisione 6).
 *
 * Funzionalità:
 *   - Lista segnalazioni aperte (default) ordinate per gravità + recenza
 *   - Filtri: stato, gravità
 *   - Per ogni segnalazione, azioni rapide:
 *       (a) Crea task manutenzione — modale con scelta operatore, data, ruolo
 *       (b) Marca risolta (con campo "Azione effettuata" opzionale)
 *       (c) Ignora
 *       (d) In triage (lascia per dopo)
 */

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  GRAVITA, STATI_SEGNALAZIONE,
  type Segnalazione, type Gravita, type StatoSegnalazione,
} from '@/lib/segnalazioni-types';
import { RUOLI, RUOLO_LABEL, type Ruolo } from '@/lib/operatori-types';

interface SegnalazioneEnriched extends Omit<Segnalazione, 'segnalataDa'> {
  casa:        { id: string; nome: string; beds24RoomId: number } | null;
  segnalataDa: { id: string; displayName: string; ruoli: Ruolo[] } | null;
}

interface OperatoreLite {
  id:          string;
  displayName: string;
  ruoli:       Ruolo[];
}

const GRAVITA_CONF: Record<Gravita, { bg: string; color: string; border: string }> = {
  Critica: { bg: '#fee2e2', color: '#7f1d1d', border: '#dc2626' },
  Alta:    { bg: '#fef3c7', color: '#78350f', border: '#ca8a04' },
  Media:   { bg: '#dbeafe', color: '#1e3a8a', border: 'var(--color-primary)' },
  Bassa:   { bg: '#dcfce7', color: '#14532d', border: '#16a34a' },
};

const STATO_CONF: Record<StatoSegnalazione, { label: string; bg: string }> = {
  'aperta':       { label: 'Aperta',       bg: '#dc2626' },
  'in-triage':    { label: 'In triage',    bg: '#ca8a04' },
  'task-creato':  { label: 'Task creato',  bg: '#0284c7' },
  'risolta':      { label: 'Risolta',      bg: '#16a34a' },
  'ignorata':     { label: 'Ignorata',     bg: '#6b7280' },
};

function fmtDataOra(ms: number): string {
  return new Date(ms).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────

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
          <p className="text-muted small mb-3">Segnalazioni — LivingApple</p>
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

// ─── Modale crea task ────────────────────────────────────────────────────────

function CreaTaskModal({ seg, operatori, onClose, onCreated }: {
  seg:       SegnalazioneEnriched;
  operatori: OperatoreLite[];
  onClose:   () => void;
  onCreated: () => void;
}) {
  const [ruolo, setRuolo] = useState<Ruolo>('manutentore');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [operatoreId, setOperatoreId] = useState('');
  const [conChecklist, setConChecklist] = useState(false);
  const [descrizione, setDescrizione] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const opsCompatibili = operatori.filter(o => o.ruoli.includes(ruolo));

  async function submit() {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch(`/api/admin/segnalazioni/${seg.id}/crea-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruolo, data, operatoreId: operatoreId || undefined, conChecklist, descrizione }),
      });
      if (!res.ok) { const d = await res.json(); setErr(d?.error ?? 'Errore'); return; }
      onCreated();
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="fs-5 fw-bold mb-0">Crea task da segnalazione</p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>

        <div className="alert alert-secondary py-2 small mb-3">
          <b>{seg.casa?.nome ?? 'Casa ?'}</b>
          <span className="ms-2 badge" style={{ background: GRAVITA_CONF[seg.gravita].border, color: '#fff', fontSize: 10 }}>
            {seg.gravita}
          </span>
          <p className="mb-0 mt-1">{seg.descrizione}</p>
        </div>

        <label className="small fw-semibold text-muted">Ruolo</label>
        <div className="d-flex gap-1 mb-2">
          {(['manutentore', 'giardiniere'] as const).map(r => (
            <button key={r}
              className="btn btn-sm"
              onClick={() => setRuolo(r)}
              style={{
                border: ruolo === r ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: 999,
                background: ruolo === r ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                color: ruolo === r ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: ruolo === r ? 600 : 400,
              }}>
              {RUOLO_LABEL[r]}
            </button>
          ))}
        </div>

        <label className="small fw-semibold text-muted">Data scadenza</label>
        <input type="date" className="form-control form-control-sm mb-2"
          value={data} onChange={e => setData(e.target.value)} />

        <label className="small fw-semibold text-muted">Assegna a (opzionale)</label>
        <select className="form-select form-select-sm mb-2"
          value={operatoreId}
          onChange={e => setOperatoreId(e.target.value)}>
          <option value="">— Lascia da assegnare —</option>
          {opsCompatibili.map(o => (
            <option key={o.id} value={o.id}>{o.displayName}</option>
          ))}
        </select>
        {opsCompatibili.length === 0 && (
          <p className="small text-warning">Nessun operatore con ruolo {RUOLO_LABEL[ruolo]}</p>
        )}

        <div className="form-check mb-2">
          <input id="conChecklist" type="checkbox" className="form-check-input"
            checked={conChecklist}
            onChange={e => setConChecklist(e.target.checked)} />
          <label htmlFor="conChecklist" className="form-check-label small">
            Includi checklist completa del ruolo (richiede master caricata)
          </label>
        </div>

        <label className="small fw-semibold text-muted">Note admin (opzionali)</label>
        <textarea className="form-control mb-2" rows={2}
          placeholder="Es. urgente, prima dell'arrivo del prossimo ospite"
          value={descrizione}
          onChange={e => setDescrizione(e.target.value)} />

        {err && <p className="small text-danger mb-2">{err}</p>}

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annulla</button>
          <button className="btn btn-success fw-bold" onClick={submit} disabled={busy}>
            {busy ? 'Creazione…' : 'Crea task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale risolvi ──────────────────────────────────────────────────────────

function RisolviModal({ seg, onClose, onDone }: {
  seg:     SegnalazioneEnriched;
  onClose: () => void;
  onDone:  () => void;
}) {
  const [azione, setAzione] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch(`/api/admin/segnalazioni/${seg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'risolta', azioneEffettuata: azione }),
      });
      if (!res.ok) { const d = await res.json(); setErr(d?.error ?? 'Errore'); return; }
      onDone();
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="fs-5 fw-bold mb-0">Marca come risolta</p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>
        <p className="small text-muted">{seg.descrizione}</p>
        <label className="small fw-semibold text-muted">Azione effettuata (opzionale)</label>
        <textarea className="form-control mb-2" rows={3}
          placeholder="Es. sostituito faretto bagno"
          value={azione}
          onChange={e => setAzione(e.target.value)} />
        {err && <p className="small text-danger mb-2">{err}</p>}
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annulla</button>
          <button className="btn btn-success fw-bold" onClick={submit} disabled={busy}>
            {busy ? 'Salvataggio…' : 'Risolto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card segnalazione ───────────────────────────────────────────────────────

function SegnalazioneCard({ seg, onTriage, onIgnora, onCrea, onRisolvi }: {
  seg:       SegnalazioneEnriched;
  onTriage:  () => void;
  onIgnora:  () => void;
  onCrea:    () => void;
  onRisolvi: () => void;
}) {
  const grv = GRAVITA_CONF[seg.gravita];
  const stato = STATO_CONF[seg.stato];
  const isAperta = seg.stato === 'aperta' || seg.stato === 'in-triage';

  return (
    <div className="card shadow-sm mb-2"
      style={{ background: isAperta ? grv.bg : 'var(--color-bg)', borderColor: grv.border, borderLeftWidth: 4 }}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div className="flex-fill">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
              <span className="badge" style={{ background: grv.border, color: '#fff' }}>
                {seg.gravita}
              </span>
              <span className="badge" style={{ background: stato.bg, color: '#fff' }}>
                {stato.label}
              </span>
              <span className="small text-muted">{fmtDataOra(seg.createdAt)}</span>
            </div>
            <p className="fw-bold mb-1" style={{ color: grv.color }}>
              {seg.casa?.nome ?? 'Casa sconosciuta'}
              {seg.voceId && (
                <span className="ms-2 small fw-normal text-muted">voce {seg.voceId}</span>
              )}
            </p>
            <p className="mb-1">{seg.descrizione}</p>
            {seg.segnalataDa && (
              <p className="small text-muted mb-1">
                Da: {seg.segnalataDa.displayName}
              </p>
            )}
            {seg.azioneEffettuata && (
              <p className="small mb-1">
                <b>Azione:</b> {seg.azioneEffettuata}
              </p>
            )}
            {seg.notaAdmin && (
              <p className="small mb-1 text-secondary"><b>Note admin:</b> {seg.notaAdmin}</p>
            )}
          </div>

          {isAperta && (
            <div className="d-flex flex-column gap-1" style={{ minWidth: 200 }}>
              <button className="btn btn-success btn-sm fw-bold" onClick={onCrea}>
                <Icon name="card-list" className="me-1" /> Crea task
              </button>
              <button className="btn btn-outline-success btn-sm" onClick={onRisolvi}>
                <Icon name="check-circle-fill" className="me-1" /> Risolto
              </button>
              <div className="d-flex gap-1">
                {seg.stato !== 'in-triage' && (
                  <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={onTriage}>
                    Triage
                  </button>
                )}
                <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={onIgnora}>
                  Ignora
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminSegnalazioni() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [segs, setSegs] = useState<SegnalazioneEnriched[]>([]);
  const [operatori, setOperatori] = useState<OperatoreLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroStato,   setFiltroStato]   = useState<'aperte' | StatoSegnalazione | 'tutte'>('aperte');
  const [filtroGravita, setFiltroGravita] = useState<Gravita | 'tutte'>('tutte');
  const [creandoTask,   setCreandoTask]   = useState<SegnalazioneEnriched | null>(null);
  const [risolvendo,    setRisolvendo]    = useState<SegnalazioneEnriched | null>(null);

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroStato !== 'aperte' && filtroStato !== 'tutte') {
        params.set('stato', filtroStato);
      } else if (filtroStato === 'tutte') {
        params.set('stato', STATI_SEGNALAZIONE.join(','));
      }
      if (filtroGravita !== 'tutte') params.set('gravita', filtroGravita);
      const [segsRes, opsRes] = await Promise.all([
        fetch(`/api/admin/segnalazioni${params.size > 0 ? '?' + params : ''}`),
        fetch('/api/admin/operatori'),
      ]);
      if (segsRes.ok) {
        const data = await segsRes.json();
        setSegs(data.segnalazioni ?? []);
      }
      if (opsRes.ok) {
        const data = await opsRes.json();
        setOperatori(data.operatori ?? []);
      }
    } finally { setLoading(false); }
  }, [filtroStato, filtroGravita]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  async function patchStato(seg: SegnalazioneEnriched, stato: StatoSegnalazione) {
    await fetch(`/api/admin/segnalazioni/${seg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato }),
    });
    load();
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  const apertaCount = segs.filter(s => s.stato === 'aperta' || s.stato === 'in-triage').length;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0">
            <Icon name="exclamation-triangle-fill" className="me-1" /> Segnalazioni
          </h1>
          <p className="small text-muted mb-0">
            {apertaCount} aperte · {segs.length} mostrate
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a href="/admin/operativita" className="btn btn-outline-secondary btn-sm">← Area operatori</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
            <Icon name="arrow-clockwise" /> Aggiorna
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      {/* Filtri */}
      <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
        <label className="small fw-semibold text-muted">Stato:</label>
        <select className="form-select form-select-sm w-auto"
          value={filtroStato}
          onChange={e => setFiltroStato(e.target.value as 'aperte' | StatoSegnalazione | 'tutte')}>
          <option value="aperte">Aperte (default)</option>
          <option value="tutte">Tutte</option>
          {STATI_SEGNALAZIONE.map(s => (
            <option key={s} value={s}>{STATO_CONF[s].label}</option>
          ))}
        </select>

        <label className="small fw-semibold text-muted ms-2">Gravità:</label>
        <select className="form-select form-select-sm w-auto"
          value={filtroGravita}
          onChange={e => setFiltroGravita(e.target.value as Gravita | 'tutte')}>
          <option value="tutte">Tutte</option>
          {GRAVITA.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {!loading && segs.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-0">
              <Icon name="check-circle-fill" className="me-1" />
              Nessuna segnalazione con questo filtro.
            </p>
          </div>
        </div>
      )}

      {segs.map(s => (
        <SegnalazioneCard key={s.id} seg={s}
          onTriage={() => patchStato(s, 'in-triage')}
          onIgnora={() => { if (confirm('Marcare come ignorata?')) patchStato(s, 'ignorata'); }}
          onCrea={() => setCreandoTask(s)}
          onRisolvi={() => setRisolvendo(s)} />
      ))}

      {creandoTask && (
        <CreaTaskModal seg={creandoTask} operatori={operatori}
          onClose={() => setCreandoTask(null)}
          onCreated={() => load()} />
      )}
      {risolvendo && (
        <RisolviModal seg={risolvendo}
          onClose={() => setRisolvendo(null)}
          onDone={() => load()} />
      )}
    </div>
  );
}
