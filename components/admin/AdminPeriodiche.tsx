'use client';

/**
 * AdminPeriodiche — calendario scadenze degli interventi periodici.
 *
 * Per ogni casa × voce-master con frequenza ≠ "Ogni turnover", mostra:
 *   - data prossima scadenza (calcolata da ultimaEsecuzione + frequenza)
 *   - badge "Scaduta da X giorni" se overdue
 *   - badge "Già schedulata" se c'è un task pendente non ancora chiuso
 *   - bottone "Schedula" → modale con data e operatore opzionale
 *
 * Filtri: ruolo, casa, mostra/nascondi A richiesta, mostra/nascondi
 * scadute oltre N giorni.
 */

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { ScadenzaPeriodica } from '@/lib/periodiche-types';
import type { Frequenza } from '@/lib/checklist-types';
import { RUOLI, RUOLO_LABEL, type Ruolo } from '@/lib/operatori-types';

interface OperatoreLite {
  id:          string;
  displayName: string;
  ruoli:       Ruolo[];
}

const FREQ_BG: Record<Frequenza, string> = {
  'Ogni turnover': '#f5f5f5',
  'Settimanale':   '#fef3c7',
  'Mensile':       '#dbeafe',
  'Stagionale':    '#dcfce7',
  'A richiesta':   '#f3e8ff',
};

function fmtData(ymd: number): string {
  return new Date(ymd).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
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
          <p className="text-muted small mb-3">Periodiche — LivingApple</p>
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

// ─── Modale schedula ────────────────────────────────────────────────────────

function ScheduleModal({ scadenza, operatori, onClose, onScheduled }: {
  scadenza:    ScadenzaPeriodica;
  operatori:   OperatoreLite[];
  onClose:     () => void;
  onScheduled: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const proposeData = scadenza.isOverdue
    ? today
    : new Date(scadenza.prossimaScadenzaAt).toISOString().slice(0, 10);

  const [data, setData] = useState(proposeData);
  const [operatoreId, setOperatoreId] = useState('');
  const [noteAdmin, setNoteAdmin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const opsCompatibili = operatori.filter(o => o.ruoli.includes(scadenza.ruolo));

  async function submit() {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/periodiche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casaId:      scadenza.casaId,
          ruolo:       scadenza.ruolo,
          voceId:      scadenza.voceId,
          data,
          operatoreId: operatoreId || undefined,
          noteAdmin,
        }),
      });
      if (!res.ok) { const d = await res.json(); setErr(d?.error ?? 'Errore'); return; }
      onScheduled();
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="fs-5 fw-bold mb-0">Schedula intervento</p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>

        <div className="alert alert-secondary py-2 small mb-3">
          <p className="fw-bold mb-1">{scadenza.casaNome} · {scadenza.voceAttivita}</p>
          <p className="mb-1 text-muted">
            <span className="badge me-2"
              style={{ background: FREQ_BG[scadenza.frequenza], color: '#222', fontSize: 10 }}>
              {scadenza.frequenza}
            </span>
            {RUOLO_LABEL[scadenza.ruolo]} · voce {scadenza.voceId}
          </p>
          <p className="mb-0 small">{scadenza.voceDettaglio}</p>
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
          <p className="small text-warning mb-2">
            Nessun operatore con ruolo {RUOLO_LABEL[scadenza.ruolo]}
          </p>
        )}

        <label className="small fw-semibold text-muted">Note admin (opzionali)</label>
        <textarea className="form-control mb-2" rows={2}
          placeholder="Es. portare attrezzi specifici, prima dell'arrivo del prossimo ospite"
          value={noteAdmin}
          onChange={e => setNoteAdmin(e.target.value)} />

        {err && <p className="small text-danger mb-2">{err}</p>}

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annulla</button>
          <button className="btn btn-success fw-bold" onClick={submit} disabled={busy}>
            {busy ? 'Schedulo…' : 'Schedula task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card scadenza ───────────────────────────────────────────────────────────

function ScadenzaCard({ scadenza, onSchedula }: {
  scadenza:   ScadenzaPeriodica;
  onSchedula: () => void;
}) {
  const overdue = scadenza.isOverdue;
  const giorni = scadenza.giorniAllaScadenza;
  const pendente = !!scadenza.taskPendenteId;

  let scadenzaLabel: string;
  let scadenzaColor: string;
  if (pendente) {
    scadenzaLabel = `Schedulata per ${scadenza.taskPendenteData}`;
    scadenzaColor = '#0284c7';
  } else if (scadenza.frequenza === 'A richiesta') {
    scadenzaLabel = scadenza.ultimaEsecuzioneAt
      ? `Ultima: ${fmtData(scadenza.ultimaEsecuzioneAt)}`
      : 'Mai eseguita';
    scadenzaColor = '#6b7280';
  } else if (overdue) {
    scadenzaLabel = giorni === 0 ? 'Scaduta oggi' : `Scaduta da ${Math.abs(giorni)} giorn${Math.abs(giorni) === 1 ? 'o' : 'i'}`;
    scadenzaColor = '#dc2626';
  } else if (giorni <= 7) {
    scadenzaLabel = giorni === 0 ? 'In scadenza oggi' : `Tra ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`;
    scadenzaColor = '#ca8a04';
  } else {
    scadenzaLabel = `Tra ${giorni} giorni`;
    scadenzaColor = '#16a34a';
  }

  return (
    <div className="card shadow-sm mb-2"
      style={{
        borderLeft: `4px solid ${scadenzaColor}`,
        background: pendente ? 'var(--color-bg-muted)' : 'var(--color-bg)',
      }}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div className="flex-fill">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
              <span className="badge"
                style={{ background: FREQ_BG[scadenza.frequenza], color: '#222', fontSize: 10 }}>
                {scadenza.frequenza}
              </span>
              <span className="badge text-uppercase"
                style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontSize: 10 }}>
                {RUOLO_LABEL[scadenza.ruolo]}
              </span>
              <span className="small fw-semibold" style={{ color: scadenzaColor }}>
                {scadenzaLabel}
              </span>
            </div>
            <p className="fw-bold mb-1">
              <Icon name="house-fill" className="me-1" />
              {scadenza.casaNome}
              <span className="ms-2 text-secondary">· {scadenza.voceAttivita}</span>
            </p>
            <p className="small text-muted mb-1">{scadenza.voceDettaglio}</p>
            <p className="small text-muted mb-0" style={{ fontSize: 11 }}>
              {scadenza.voceAmbiente} · voce {scadenza.voceId}
              {scadenza.ultimaEsecuzioneAt && (
                <> · ultima: {fmtData(scadenza.ultimaEsecuzioneAt)}</>
              )}
            </p>
          </div>

          <div className="d-flex flex-column gap-1" style={{ minWidth: 140 }}>
            {pendente ? (
              <span className="badge bg-info-subtle text-info-emphasis">
                Già schedulata
              </span>
            ) : (
              <button className="btn btn-success btn-sm fw-bold" onClick={onSchedula}>
                <Icon name="calendar-event" className="me-1" />
                Schedula
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminPeriodiche() {
  const [authed,    setAuthed]    = useState<boolean | null>(null);
  const [scadenze,  setScadenze]  = useState<ScadenzaPeriodica[]>([]);
  const [operatori, setOperatori] = useState<OperatoreLite[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const [filtroRuolo,    setFiltroRuolo]    = useState<'tutti' | Ruolo>('tutti');
  const [filtroFrequenza, setFiltroFrequenza] = useState<'tutte' | Frequenza>('tutte');
  const [soloOverdue,    setSoloOverdue]    = useState(false);
  const [hideOnRequest,  setHideOnRequest]  = useState(false);
  const [scheduling,     setScheduling]     = useState<ScadenzaPeriodica | null>(null);

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [scadRes, opsRes] = await Promise.all([
        fetch('/api/admin/periodiche'),
        fetch('/api/admin/operatori'),
      ]);
      if (!scadRes.ok) { setError('Errore caricamento'); return; }
      const data = await scadRes.json();
      setScadenze(data.scadenze ?? []);
      if (opsRes.ok) {
        const opData = await opsRes.json();
        setOperatori(opData.operatori ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  const filtered = scadenze.filter(s => {
    if (filtroRuolo !== 'tutti' && s.ruolo !== filtroRuolo) return false;
    if (filtroFrequenza !== 'tutte' && s.frequenza !== filtroFrequenza) return false;
    if (soloOverdue && !s.isOverdue) return false;
    if (hideOnRequest && s.frequenza === 'A richiesta') return false;
    return true;
  });

  const overdueCount = scadenze.filter(s => s.isOverdue && s.frequenza !== 'A richiesta').length;
  const pendingCount = scadenze.filter(s => s.taskPendenteId).length;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0">
            <Icon name="calendar-range" className="me-1" /> Periodiche
          </h1>
          <p className="small text-muted mb-0">
            {scadenze.length} scadenze totali · {overdueCount} scadute · {pendingCount} schedulate
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

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* Filtri ruolo */}
      <div className="d-flex gap-1 flex-wrap mb-2">
        <span className="small fw-semibold text-muted me-1 align-self-center">Ruolo:</span>
        {(['tutti', ...RUOLI] as const).map(r => {
          const active = filtroRuolo === r;
          return (
            <button key={r}
              className="btn btn-sm"
              onClick={() => setFiltroRuolo(r as 'tutti' | Ruolo)}
              style={{
                border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: 999,
                background: active ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                color: active ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: active ? 600 : 400,
              }}>
              {r === 'tutti' ? 'Tutti' : RUOLO_LABEL[r as Ruolo]}
            </button>
          );
        })}
      </div>

      {/* Filtri frequenza + flag */}
      <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
        <span className="small fw-semibold text-muted">Frequenza:</span>
        <select className="form-select form-select-sm w-auto"
          value={filtroFrequenza}
          onChange={e => setFiltroFrequenza(e.target.value as 'tutte' | Frequenza)}>
          <option value="tutte">Tutte</option>
          <option value="Settimanale">Settimanale</option>
          <option value="Mensile">Mensile</option>
          <option value="Stagionale">Stagionale</option>
          <option value="A richiesta">A richiesta</option>
        </select>

        <div className="form-check ms-2">
          <input id="solo-overdue" type="checkbox" className="form-check-input"
            checked={soloOverdue} onChange={e => setSoloOverdue(e.target.checked)} />
          <label htmlFor="solo-overdue" className="form-check-label small">Solo scadute</label>
        </div>
        <div className="form-check">
          <input id="hide-onrequest" type="checkbox" className="form-check-input"
            checked={hideOnRequest} onChange={e => setHideOnRequest(e.target.checked)} />
          <label htmlFor="hide-onrequest" className="form-check-label small">Nascondi &quot;A richiesta&quot;</label>
        </div>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-0">
              <Icon name="check-circle-fill" className="me-1" />
              Nessuna scadenza con questi filtri.
            </p>
          </div>
        </div>
      )}

      {filtered.map(s => (
        <ScadenzaCard key={`${s.casaId}:${s.ruolo}:${s.voceId}`}
          scadenza={s}
          onSchedula={() => setScheduling(s)} />
      ))}

      {scheduling && (
        <ScheduleModal scadenza={scheduling} operatori={operatori}
          onClose={() => setScheduling(null)}
          onScheduled={load} />
      )}
    </div>
  );
}
