'use client';

/**
 * OpTurnover — pagina di lavoro su un singolo task con checklist.
 *
 * Funzionalità:
 *   - Mostra info task + casa (indirizzo, keybox, dotazioni)
 *   - Lista voci checklist raggruppate per ambiente
 *   - Spunta voce → PATCH immediata
 *   - Apri segnalazione su singola voce o sul task in generale
 *   - "Lavoro terminato" → POST /lavoro-terminato (notifica admin)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import type { Casa } from '@/lib/case-types';
import type { Task } from '@/lib/task-types';
import type { Segnalazione, Gravita } from '@/lib/segnalazioni-types';
import { GRAVITA } from '@/lib/segnalazioni-types';
import type { VoceSnapshot, VoceIstanza } from '@/lib/checklist-types';

interface ApiResponse {
  task:          Task;
  casa:          Casa | null;
  segnalazioni:  Segnalazione[];
}

const PRIORITA_BG: Record<string, string> = {
  Critica: '#fee2e2',
  Alta:    '#fef3c7',
  Media:   '#f0f9ff',
  Bassa:   '#f0fdf4',
};
const PRIORITA_BORDER: Record<string, string> = {
  Critica: '#fca5a5',
  Alta:    '#fcd34d',
  Media:   '#bae6fd',
  Bassa:   '#86efac',
};

export default function OpTurnover() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const taskId = params.id;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [segnalandoVoce, setSegnalandoVoce] = useState<VoceSnapshot | 'task' | null>(null);
  const [savingTerm, setSavingTerm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const res = await fetch(`/api/op/turnover/${taskId}`);
    if (res.status === 401) { router.replace('/op'); return; }
    if (res.status === 403) { setError('Questo task non è assegnato a te'); setLoading(false); return; }
    if (res.status === 404) { setError('Task non trovato'); setLoading(false); return; }
    if (!res.ok) { setError(`Errore ${res.status}`); setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }, [taskId, router]);

  useEffect(() => { load(); }, [load]);

  // Toggle spunta voce
  async function toggleSpunta(voce: VoceSnapshot, currentSpuntata: boolean) {
    if (!data) return;
    // Optimistic update
    const newStati = data.task.checklist!.stati.map(s =>
      s.voceId === voce.id ? { ...s, spuntata: !currentSpuntata, spuntataAt: !currentSpuntata ? Date.now() : undefined } : s,
    );
    setData({
      ...data,
      task: { ...data.task, checklist: { ...data.task.checklist!, stati: newStati } },
    });
    // PATCH
    const res = await fetch(`/api/op/turnover/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vociUpdate: [{ voceId: voce.id, spuntata: !currentSpuntata }] }),
    });
    if (!res.ok) {
      // rollback
      setError('Errore aggiornamento');
      load();
    } else {
      const updated = await res.json();
      setData(d => d ? { ...d, task: updated.task } : d);
    }
  }

  async function lavoroTerminato() {
    if (!data || savingTerm) return;
    if (!confirm('Confermi che hai terminato il lavoro? L\'admin riceverà una notifica.')) return;
    setSavingTerm(true);
    try {
      const res = await fetch(`/api/op/turnover/${taskId}/lavoro-terminato`, { method: 'POST' });
      if (!res.ok) { const e = await res.json(); setError(e?.error ?? 'Errore'); return; }
      load();
    } finally { setSavingTerm(false); }
  }

  if (loading)        return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (error)          return <Errore message={error} />;
  if (!data)          return null;

  const { task, casa, segnalazioni } = data;
  const checklist = task.checklist;
  const isChiuso = task.stato === 'completato' || task.stato === 'annullato';
  const isTerminato = task.stato === 'lavoro-terminato';

  // Raggruppa voci per ambiente
  const stateByVoceId = new Map(checklist?.stati.map(s => [s.voceId, s]));
  const byAmbiente = new Map<string, VoceSnapshot[]>();
  if (checklist) {
    for (const s of checklist.snapshots) {
      const arr = byAmbiente.get(s.ambiente) ?? [];
      arr.push(s);
      byAmbiente.set(s.ambiente, arr);
    }
  }

  const totale = checklist?.snapshots.length ?? 0;
  const fatte = checklist?.stati.filter(s => s.spuntata).length ?? 0;
  const pct = totale > 0 ? Math.round((fatte / totale) * 100) : 0;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 700 }}>
      <button className="btn btn-link p-0 mb-2" onClick={() => router.push('/op/dashboard')}>
        ← I miei task
      </button>

      {/* Header */}
      <div className="card shadow-sm mb-3">
        <div className="card-body p-3">
          <p className="fw-bold fs-5 mb-1">
            <Icon name="house-fill" className="me-1" /> {casa?.nome ?? task.titolo}
          </p>
          <p className="small text-muted mb-2">{task.titolo} · {task.data}</p>

          {/* Orari ospite */}
          {(task.oraPartenzaOspite || task.oraArrivoProssimo || task.prossimoArrivo) && (
            <div className="bg-light rounded px-2 py-2 mb-2 small">
              {task.oraPartenzaOspite && (
                <p className="mb-1">
                  <Icon name="clock" className="me-1" />
                  <b>Check-out ospite uscente:</b> {task.oraPartenzaOspite}
                </p>
              )}
              {task.prossimoArrivo && (
                <p className="mb-0">
                  <Icon name="person-fill" className="me-1" />
                  <b>Prossimo ospite:</b> {task.prossimoArrivo.guestName} ·
                  arriva il {task.prossimoArrivo.date}
                  {task.oraArrivoProssimo && <> alle <b>{task.oraArrivoProssimo}</b></>}
                  {' · '}{task.prossimoArrivo.numAdult} adult{task.prossimoArrivo.numAdult === 1 ? 'o' : 'i'}
                  {task.prossimoArrivo.numChild > 0 && ` + ${task.prossimoArrivo.numChild} bambin${task.prossimoArrivo.numChild === 1 ? 'o' : 'i'}`}
                </p>
              )}
              {!task.prossimoArrivo && task.oraPartenzaOspite && (
                <p className="mb-0 text-muted fst-italic">
                  Nessun arrivo programmato dopo questo check-out — la casa resta vuota.
                </p>
              )}
            </div>
          )}

          {casa?.indirizzo && (
            <p className="small mb-1"><Icon name="geo-alt-fill" className="me-1" /> {casa.indirizzo}</p>
          )}
          {casa?.keybox && (
            <p className="small mb-1"><Icon name="lock-fill" className="me-1" /> {casa.keybox}</p>
          )}
          {casa?.note && (
            <p className="small text-muted mb-1">{casa.note}</p>
          )}
          {casa && casa.dotazioni.length > 0 && (
            <details className="small text-muted mt-2">
              <summary>Dotazioni tecniche ({casa.dotazioni.length})</summary>
              <ul className="ps-3 mb-0 mt-1">
                {casa.dotazioni.map((d, i) => (
                  <li key={i}><b>{d.chiave}:</b> {d.valore}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      {/* Biancheria da preparare (solo task pulizie) */}
      {task.ruoloRichiesto === 'pulizie' && task.biancheriaProssimo && task.prossimoArrivo && (
        <div className="card shadow-sm mb-3" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div className="card-body p-3">
            <p className="small fw-bold text-uppercase mb-2"
              style={{ color: '#0369a1', letterSpacing: '0.06em' }}>
              <Icon name="moon-stars-fill" className="me-1" />
              Biancheria da preparare per il prossimo ospite
            </p>
            {task.biancheriaProssimo.hasConfig ? (
              <div className="d-flex gap-2 flex-wrap" style={{ color: '#0c4a6e' }}>
                <BiancheriaChip n={task.biancheriaProssimo.lenzMatrimoniali} label="lenz. matrimoniali" />
                <BiancheriaChip n={task.biancheriaProssimo.lenzSingoli}      label="lenz. singole" />
                <BiancheriaChip n={task.biancheriaProssimo.federe}           label="federe" />
                <BiancheriaChip n={task.biancheriaProssimo.persone}          label="asciugamani viso" />
                <BiancheriaChip n={task.biancheriaProssimo.persone}          label="asciugamani bidet" />
                <BiancheriaChip n={task.biancheriaProssimo.persone}          label="teli doccia" />
                <BiancheriaChip n={task.biancheriaProssimo.scendibagno ?? 1} label="scendibagno" />
                {task.biancheriaProssimo.culle > 0 && (
                  <BiancheriaChip n={task.biancheriaProssimo.culle} label="culle" />
                )}
              </div>
            ) : (
              <p className="small text-warning mb-0">
                Configurazione letti non ancora censita per questa casa — chiedi all&apos;admin quanti set servono.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Progress + stato */}
      <div className="card shadow-sm mb-3">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <p className="small fw-semibold mb-0 text-secondary">
              {fatte} / {totale} voci spuntate
            </p>
            <StatoBadge stato={task.stato} />
          </div>
          <div style={{ height: 8, background: 'var(--color-bg-muted)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: pct === 100 ? '#16a34a' : 'var(--color-primary)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>

      {/* Segnalazioni esistenti */}
      {segnalazioni.length > 0 && (
        <div className="card shadow-sm mb-3" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="card-body p-3">
            <p className="fw-semibold small mb-2" style={{ color: '#92400e' }}>
              <Icon name="exclamation-triangle-fill" className="me-1" />
              {segnalazioni.length} segnalazion{segnalazioni.length === 1 ? 'e' : 'i'}
            </p>
            {segnalazioni.map(s => (
              <div key={s.id} className="small mb-1" style={{ color: '#78350f' }}>
                <b>[{s.gravita}]</b> {s.descrizione}
                {s.voceId && <span className="ms-1 text-muted">(voce {s.voceId})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {isChiuso && (
        <div className="alert alert-info py-2 small">
          Task in stato <b>{task.stato}</b>: non più modificabile.
        </div>
      )}

      {/* Voci checklist */}
      {checklist && Array.from(byAmbiente.entries()).map(([ambiente, voci]) => (
        <div key={ambiente} className="mb-4">
          <p className="small fw-bold text-uppercase text-secondary mb-2"
            style={{ letterSpacing: '0.06em' }}>
            {ambiente}
          </p>
          {voci.map(voce => {
            const stato = stateByVoceId.get(voce.id);
            const spuntata = stato?.spuntata ?? false;
            const haSegnalazione = !!stato?.segnalazioneId;
            return (
              <VoceRow key={voce.id}
                voce={voce}
                stato={stato!}
                disabled={isChiuso || isTerminato}
                onToggle={() => toggleSpunta(voce, spuntata)}
                onSegnala={() => setSegnalandoVoce(voce)}
                haSegnalazione={haSegnalazione}
              />
            );
          })}
        </div>
      ))}

      {/* Footer azioni */}
      <div className="d-flex flex-column gap-2 mt-4 pt-3 border-top">
        <button className="btn btn-outline-warning"
          onClick={() => setSegnalandoVoce('task')}
          disabled={isChiuso}>
          <Icon name="exclamation-triangle-fill" className="me-1" />
          Apri segnalazione generica
        </button>

        {!isChiuso && !isTerminato && (
          <button className="btn btn-success btn-lg fw-bold"
            onClick={lavoroTerminato} disabled={savingTerm}>
            {savingTerm ? 'Invio…' : (
              <><Icon name="check-circle-fill" className="me-1" /> Lavoro terminato</>
            )}
          </button>
        )}

        {isTerminato && (
          <div className="alert alert-info py-2 mb-0 small">
            <Icon name="check-circle-fill" className="me-1" />
            Lavoro terminato comunicato all&apos;admin. In attesa di conferma &quot;Casa pronta&quot;.
          </div>
        )}
      </div>

      {segnalandoVoce && (
        <SegnalazioneModal
          taskId={taskId}
          voce={segnalandoVoce === 'task' ? null : segnalandoVoce}
          onClose={() => setSegnalandoVoce(null)}
          onCreated={() => { setSegnalandoVoce(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Voce row ────────────────────────────────────────────────────────────────

function VoceRow({ voce, stato, disabled, onToggle, onSegnala, haSegnalazione }: {
  voce:           VoceSnapshot;
  stato:          VoceIstanza;
  disabled:       boolean;
  onToggle:       () => void;
  onSegnala:      () => void;
  haSegnalazione: boolean;
}) {
  const bg = PRIORITA_BG[voce.priorita] ?? '#fff';
  const border = PRIORITA_BORDER[voce.priorita] ?? 'var(--color-border)';
  const spuntata = stato.spuntata;

  return (
    <div className="card mb-2"
      style={{ background: spuntata ? 'var(--color-bg-muted)' : bg, borderColor: border }}>
      <div className="card-body p-3">
        <div className="d-flex gap-3 align-items-start">
          <input type="checkbox"
            className="form-check-input mt-1 flex-shrink-0"
            style={{ width: 24, height: 24, cursor: disabled ? 'default' : 'pointer' }}
            checked={spuntata}
            disabled={disabled}
            onChange={onToggle} />
          <div className="flex-fill" onClick={() => !disabled && onToggle()}
            style={{ cursor: disabled ? 'default' : 'pointer' }}>
            <p className={`fw-semibold mb-1 ${spuntata ? 'text-decoration-line-through text-muted' : ''}`}>
              <span className="badge me-2"
                style={{ fontSize: 9, background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-subtle)' }}>
                {voce.id}
              </span>
              {voce.attivita}
              {voce.priorita === 'Critica' && (
                <span className="badge ms-2" style={{ background: '#dc2626', color: '#fff', fontSize: 10 }}>
                  CRITICA
                </span>
              )}
              {voce.fotoRichiesta && (
                <span className="badge ms-1 bg-light text-secondary" style={{ fontSize: 10 }}>
                  <Icon name="camera-fill" /> foto
                </span>
              )}
            </p>
            <p className={`small mb-0 ${spuntata ? 'text-muted' : 'text-secondary'}`}>{voce.dettaglio}</p>
            {voce.fotoRichiesta && !spuntata && (
              <p className="small fst-italic text-muted mt-1 mb-0">
                Promemoria: invia la foto sul gruppo Telegram/WhatsApp.
              </p>
            )}
          </div>
          <button className="btn btn-sm btn-outline-warning flex-shrink-0"
            onClick={onSegnala}
            disabled={disabled}
            title="Segnala un problema su questa voce">
            <Icon name="exclamation-triangle-fill" />
            {haSegnalazione && <span className="ms-1 small">!</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale segnalazione ─────────────────────────────────────────────────────

function SegnalazioneModal({ taskId, voce, onClose, onCreated }: {
  taskId:    string;
  voce:      VoceSnapshot | null;
  onClose:   () => void;
  onCreated: () => void;
}) {
  const [descrizione, setDescrizione] = useState('');
  const [gravita, setGravita] = useState<Gravita>('Media');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Pre-compila gravità da priorità voce
  useEffect(() => {
    if (voce?.priorita === 'Critica') setGravita('Alta');
    else if (voce?.priorita === 'Alta') setGravita('Media');
  }, [voce]);

  async function submit() {
    if (busy) return;
    if (!descrizione.trim()) { setErr('Descrizione richiesta'); return; }
    setBusy(true); setErr('');
    try {
      const res = await fetch(`/api/op/turnover/${taskId}/segnalazione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voceId:      voce?.id,
          descrizione: descrizione.trim(),
          gravita,
        }),
      });
      if (!res.ok) { const d = await res.json(); setErr(d?.error ?? 'Errore'); return; }
      onCreated();
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="fs-5 fw-bold mb-0">
            <Icon name="exclamation-triangle-fill" className="me-1" />
            Segnala un problema
          </p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>

        {voce && (
          <div className="alert alert-secondary py-2 small mb-3">
            <b>Voce:</b> {voce.id} · {voce.attivita}
          </div>
        )}

        <label className="small fw-semibold text-muted">Gravità</label>
        <div className="d-flex gap-1 flex-wrap mb-3">
          {GRAVITA.map(g => {
            const active = gravita === g;
            const colors: Record<Gravita, { bg: string; border: string; color: string }> = {
              Critica: { bg: '#fee2e2', border: '#dc2626', color: '#7f1d1d' },
              Alta:    { bg: '#fef3c7', border: '#ca8a04', color: '#78350f' },
              Media:   { bg: '#f0f9ff', border: 'var(--color-primary)', color: 'var(--color-primary)' },
              Bassa:   { bg: '#f0fdf4', border: '#16a34a', color: '#14532d' },
            };
            const c = colors[g];
            return (
              <button key={g}
                className="btn btn-sm"
                onClick={() => setGravita(g)}
                style={{
                  border: active ? `2px solid ${c.border}` : '1px solid var(--color-border)',
                  borderRadius: 999,
                  background: active ? c.bg : 'var(--color-bg)',
                  color: active ? c.color : 'var(--color-text-subtle)',
                  fontWeight: active ? 600 : 400,
                }}>
                {g}
              </button>
            );
          })}
        </div>

        <label className="small fw-semibold text-muted">Descrizione</label>
        <textarea className="form-control mb-2" rows={4}
          placeholder="Descrivi il problema in modo chiaro (cosa, dove, eventuali misure di emergenza già prese)"
          value={descrizione}
          onChange={e => setDescrizione(e.target.value)} />

        <p className="small text-muted">
          L&apos;admin riceverà una notifica Telegram immediata
          {gravita === 'Critica' || gravita === 'Alta' ? ' con suono.' : ' silenziosa.'}
          {' '}Per inviare foto, usa Telegram/WhatsApp.
        </p>

        {err && <p className="small text-danger mb-2">{err}</p>}

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annulla</button>
          <button className="btn btn-warning fw-bold" onClick={submit} disabled={busy}>
            {busy ? 'Invio…' : 'Invia segnalazione'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Biancheria chip (visualizzazione singolo articolo) ────────────────────

function BiancheriaChip({ n, label }: { n: number; label: string }) {
  return (
    <span className="d-inline-flex align-items-center gap-1 bg-white rounded px-2 py-1"
      style={{ border: '1px solid #bae6fd', minWidth: 100 }}>
      <span className="fw-bold fs-5" style={{ color: '#0369a1' }}>{n}</span>
      <span className="small text-muted">{label}</span>
    </span>
  );
}

// ─── Stato badge ─────────────────────────────────────────────────────────────

function StatoBadge({ stato }: { stato: Task['stato'] }) {
  const m: Record<Task['stato'], { label: string; bg: string }> = {
    'da-assegnare':     { label: 'Da assegnare',     bg: '#6b7280' },
    'assegnato':        { label: 'Assegnato',        bg: 'var(--color-primary)' },
    'in-corso':         { label: 'In corso',         bg: '#0284c7' },
    'lavoro-terminato': { label: 'Lavoro terminato', bg: '#ca8a04' },
    'completato':       { label: 'Completato',       bg: '#16a34a' },
    'annullato':        { label: 'Annullato',        bg: '#dc2626' },
  };
  const c = m[stato];
  return <span className="badge" style={{ background: c.bg, color: '#fff' }}>{c.label}</span>;
}

// ─── Errore ──────────────────────────────────────────────────────────────────

function Errore({ message }: { message: string }) {
  return (
    <div className="container page-top pb-5" style={{ maxWidth: 600 }}>
      <div className="alert alert-danger">
        <Icon name="exclamation-circle-fill" className="me-1" />
        {message}
      </div>
      <a href="/op/dashboard" className="btn btn-outline-secondary">← Torna ai miei task</a>
    </div>
  );
}
