'use client';

/**
 * AdminStrutture — gestione anagrafica delle case (mapping 1:1 a Beds24 room).
 *
 * Funzionalità:
 *   - Lista case (filtro: includi archiviate)
 *   - Crea casa
 *   - Modifica completa: nome, roomId, indirizzo, note, keybox, foto URL,
 *     dotazioni tecniche, voci N/A per ruolo
 *   - Archivia / Riattiva (soft-delete)
 *   - Elimina (hard, con conferma)
 *
 * Usa /api/admin/strutture[/...].
 */

import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { Casa, DotazioneTecnica, VoceNonApplicabile } from '@/lib/case-types';
import type { ChecklistMaster, ChecklistVoce } from '@/lib/checklist-types';
import { RUOLI, RUOLO_LABEL, type Ruolo } from '@/lib/operatori-types';

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
          <p className="text-muted small mb-3">Strutture — LivingApple</p>
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

// ─── Selettore Voci NA per ruolo (lazy load master) ─────────────────────────

function SelettoreVociNA({ ruolo, vociNA, onChange }: {
  ruolo:    Ruolo;
  vociNA:   VoceNonApplicabile[];
  onChange: (next: VoceNonApplicabile[]) => void;
}) {
  const [master, setMaster] = useState<ChecklistMaster | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setErr('');
      try {
        const res = await fetch(`/api/admin/checklist/${ruolo}`);
        if (!res.ok) {
          setErr(res.status === 404
            ? `Carica prima la checklist "${RUOLO_LABEL[ruolo]}" da /admin/checklist`
            : 'Errore caricamento');
          return;
        }
        const data = await res.json();
        if (!cancelled) setMaster(data.master as ChecklistMaster);
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [ruolo]);

  if (loading) return <p className="small text-muted my-2">Caricamento voci…</p>;
  if (err)     return <p className="small text-warning my-2">⚠ {err}</p>;
  if (!master) return null;

  const setNA = new Set(vociNA.filter(v => v.ruolo === ruolo).map(v => v.voceId));

  function toggle(voce: ChecklistVoce) {
    const isNA = setNA.has(voce.id);
    if (isNA) {
      onChange(vociNA.filter(v => !(v.ruolo === ruolo && v.voceId === voce.id)));
    } else {
      onChange([...vociNA, { ruolo, voceId: voce.id }]);
    }
  }

  // Raggruppa per ambiente
  const byAmbiente = new Map<string, ChecklistVoce[]>();
  for (const v of master.voci) {
    const arr = byAmbiente.get(v.ambiente) ?? [];
    arr.push(v);
    byAmbiente.set(v.ambiente, arr);
  }

  return (
    <div>
      <p className="small text-muted mb-2">
        Clicca le voci che <b>non si applicano</b> a questa casa (es. niente piscina).
        Saranno escluse dalla checklist al momento del turnover.
      </p>
      {Array.from(byAmbiente.entries()).map(([amb, voci]) => (
        <div key={amb} className="mb-3">
          <p className="small fw-bold text-uppercase text-muted mb-1" style={{ letterSpacing: '0.06em' }}>
            {amb}
          </p>
          <div className="d-flex flex-wrap gap-1">
            {voci.map(v => {
              const na = setNA.has(v.id);
              return (
                <button key={v.id}
                  type="button"
                  onClick={() => toggle(v)}
                  className="btn btn-sm"
                  title={v.dettaglio}
                  style={{
                    border: na ? '2px solid #dc2626' : '1px solid var(--color-border)',
                    borderRadius: 6,
                    background: na ? '#fee2e2' : 'var(--color-bg)',
                    color: na ? '#7f1d1d' : 'var(--color-text)',
                    fontWeight: na ? 600 : 400,
                    fontSize: 12,
                    textDecoration: na ? 'line-through' : 'none',
                  }}>
                  {v.id} · {v.attivita}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Modale modifica/creazione casa ──────────────────────────────────────────

interface DraftCasa {
  nome:          string;
  beds24RoomId:  string;       // tenuto come stringa nell'input, convertito al save
  indirizzo:     string;
  note:          string;
  keybox:        string;
  fotoUrls:      string[];
  dotazioni:     DotazioneTecnica[];
  vociNonApplicabili: VoceNonApplicabile[];
  archiviata:    boolean;
}

function emptyDraft(): DraftCasa {
  return {
    nome: '', beds24RoomId: '', indirizzo: '', note: '', keybox: '',
    fotoUrls: [], dotazioni: [], vociNonApplicabili: [], archiviata: false,
  };
}

function casaToDraft(c: Casa): DraftCasa {
  return {
    nome:               c.nome,
    beds24RoomId:       String(c.beds24RoomId),
    indirizzo:          c.indirizzo ?? '',
    note:               c.note ?? '',
    keybox:             c.keybox ?? '',
    fotoUrls:           [...c.fotoUrls],
    dotazioni:          c.dotazioni.map(d => ({ ...d })),
    vociNonApplicabili: c.vociNonApplicabili.map(v => ({ ...v })),
    archiviata:         c.archiviata,
  };
}

function CasaModal({ casa, onClose, onSaved }: {
  casa:    Casa | null;     // null = nuova
  onClose: () => void;
  onSaved: (c: Casa) => void;
}) {
  const [draft, setDraft] = useState<DraftCasa>(casa ? casaToDraft(casa) : emptyDraft());
  const [tab, setTab] = useState<'base' | 'foto' | 'dotazioni' | 'voci'>('base');
  const [vociRuolo, setVociRuolo] = useState<Ruolo>('pulizie');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  async function save() {
    if (busy) return;
    if (!draft.nome.trim()) { setErr('Nome richiesto'); return; }
    const roomId = parseInt(draft.beds24RoomId, 10);
    if (!Number.isFinite(roomId) || roomId <= 0) {
      setErr('beds24RoomId richiesto (intero positivo)'); return;
    }

    setBusy(true); setErr('');
    const payload = {
      nome:                draft.nome.trim(),
      beds24RoomId:        roomId,
      indirizzo:           draft.indirizzo.trim() || undefined,
      note:                draft.note.trim() || undefined,
      keybox:              draft.keybox.trim() || undefined,
      fotoUrls:            draft.fotoUrls.filter(u => u.trim() !== ''),
      dotazioni:           draft.dotazioni.filter(d => d.chiave.trim() !== ''),
      vociNonApplicabili:  draft.vociNonApplicabili,
      archiviata:          draft.archiviata,
    };

    try {
      const url = casa ? `/api/admin/strutture/${casa.id}` : '/api/admin/strutture';
      const method = casa ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error ?? `Errore ${res.status}`); return; }
      onSaved(data.casa as Casa);
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-card-custom modal-card-custom--wide" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="fs-5 fw-bold mb-0">
            {casa ? `Modifica: ${casa.nome}` : 'Nuova casa'}
          </p>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <Icon name="x-lg" />
          </button>
        </div>

        <ul className="nav nav-tabs mb-3">
          {([
            { k: 'base',      l: 'Base' },
            { k: 'foto',      l: `Foto (${draft.fotoUrls.length})` },
            { k: 'dotazioni', l: `Dotazioni (${draft.dotazioni.length})` },
            { k: 'voci',      l: `Voci N/A (${draft.vociNonApplicabili.length})` },
          ] as const).map(t => (
            <li key={t.k} className="nav-item">
              <button className={`nav-link ${tab === t.k ? 'active' : ''}`}
                onClick={() => setTab(t.k)}>
                {t.l}
              </button>
            </li>
          ))}
        </ul>

        {/* TAB Base ----------------------------------------------------- */}
        {tab === 'base' && (
          <div>
            <label className="small fw-semibold text-muted">Nome casa</label>
            <input className="form-control mb-2" placeholder="Bilo Mare"
              value={draft.nome} onChange={e => setDraft({ ...draft, nome: e.target.value })} />

            <label className="small fw-semibold text-muted">Beds24 Room ID</label>
            <input type="number" className="form-control mb-2" placeholder="107773"
              value={draft.beds24RoomId}
              onChange={e => setDraft({ ...draft, beds24RoomId: e.target.value })} />

            <label className="small fw-semibold text-muted">Indirizzo</label>
            <textarea className="form-control mb-2" rows={2}
              value={draft.indirizzo}
              onChange={e => setDraft({ ...draft, indirizzo: e.target.value })} />

            <label className="small fw-semibold text-muted">Note d&apos;accesso (parcheggio, citofono, regole)</label>
            <textarea className="form-control mb-2" rows={3}
              value={draft.note}
              onChange={e => setDraft({ ...draft, note: e.target.value })} />

            <label className="small fw-semibold text-muted">Keybox (posizione + codice)</label>
            <input className="form-control mb-2" placeholder="Cancello sx, codice 4729"
              value={draft.keybox}
              onChange={e => setDraft({ ...draft, keybox: e.target.value })} />

            <div className="form-check mb-3">
              <input id="archiviata" type="checkbox" className="form-check-input"
                checked={draft.archiviata}
                onChange={e => setDraft({ ...draft, archiviata: e.target.checked })} />
              <label htmlFor="archiviata" className="form-check-label small">
                Archiviata (nascosta dall&apos;operatività ma conservata per storico)
              </label>
            </div>
          </div>
        )}

        {/* TAB Foto ----------------------------------------------------- */}
        {tab === 'foto' && (
          <div>
            <p className="small text-muted">
              URL Cloudinary delle foto della casa. Carica le foto su Cloudinary, copia gli URL e incollali qui.
            </p>
            {draft.fotoUrls.map((url, i) => (
              <div key={i} className="d-flex gap-2 mb-2">
                <input className="form-control" value={url}
                  onChange={e => {
                    const next = [...draft.fotoUrls]; next[i] = e.target.value;
                    setDraft({ ...draft, fotoUrls: next });
                  }} />
                <button className="btn btn-outline-danger" onClick={() => {
                  setDraft({ ...draft, fotoUrls: draft.fotoUrls.filter((_, j) => j !== i) });
                }}><Icon name="trash" /></button>
              </div>
            ))}
            <button className="btn btn-outline-secondary btn-sm"
              onClick={() => setDraft({ ...draft, fotoUrls: [...draft.fotoUrls, ''] })}>
              <Icon name="camera-fill" className="me-1" /> Aggiungi URL foto
            </button>
          </div>
        )}

        {/* TAB Dotazioni ------------------------------------------------ */}
        {tab === 'dotazioni' && (
          <div>
            <p className="small text-muted">
              Dotazioni tecniche e info utili (caldaia, contatori, Wi-Fi password, ecc.).
            </p>
            {draft.dotazioni.map((d, i) => (
              <div key={i} className="d-flex gap-2 mb-2">
                <input className="form-control" placeholder="Chiave (es. Wi-Fi password)"
                  style={{ maxWidth: 250 }}
                  value={d.chiave}
                  onChange={e => {
                    const next = [...draft.dotazioni];
                    next[i] = { ...next[i], chiave: e.target.value };
                    setDraft({ ...draft, dotazioni: next });
                  }} />
                <input className="form-control" placeholder="Valore"
                  value={d.valore}
                  onChange={e => {
                    const next = [...draft.dotazioni];
                    next[i] = { ...next[i], valore: e.target.value };
                    setDraft({ ...draft, dotazioni: next });
                  }} />
                <button className="btn btn-outline-danger" onClick={() => {
                  setDraft({ ...draft, dotazioni: draft.dotazioni.filter((_, j) => j !== i) });
                }}><Icon name="trash" /></button>
              </div>
            ))}
            <button className="btn btn-outline-secondary btn-sm"
              onClick={() => setDraft({ ...draft, dotazioni: [...draft.dotazioni, { chiave: '', valore: '' }] })}>
              <Icon name="sliders" className="me-1" /> Aggiungi dotazione
            </button>
          </div>
        )}

        {/* TAB Voci NA -------------------------------------------------- */}
        {tab === 'voci' && (
          <div>
            <div className="d-flex gap-1 flex-wrap mb-3">
              <span className="small fw-semibold text-muted me-2 align-self-center">Ruolo:</span>
              {RUOLI.map(r => (
                <button key={r}
                  className="btn btn-sm"
                  onClick={() => setVociRuolo(r)}
                  style={{
                    border: vociRuolo === r ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    borderRadius: 999,
                    background: vociRuolo === r ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                    color: vociRuolo === r ? 'var(--color-primary)' : 'var(--color-text)',
                    fontWeight: vociRuolo === r ? 600 : 400,
                  }}>
                  {RUOLO_LABEL[r]}
                </button>
              ))}
            </div>
            <SelettoreVociNA ruolo={vociRuolo}
              vociNA={draft.vociNonApplicabili}
              onChange={vociNonApplicabili => setDraft({ ...draft, vociNonApplicabili })} />
          </div>
        )}

        {err && <p className="small text-danger mb-2 mt-2">{err}</p>}

        <div className="d-flex gap-2 justify-content-end mt-3 pt-3 border-top">
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Annulla</button>
          <button className="btn btn-success fw-bold" onClick={save} disabled={busy}>
            {busy ? 'Salvataggio…' : (casa ? 'Salva modifiche' : 'Crea casa')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card casa ───────────────────────────────────────────────────────────────

function CasaCard({ casa, onEdit, onArchive, onDelete }: {
  casa:      Casa;
  onEdit:    () => void;
  onArchive: () => void;
  onDelete:  () => void;
}) {
  return (
    <div className="card shadow-sm mb-2"
      style={{ background: casa.archiviata ? 'var(--color-bg-muted)' : 'var(--color-bg)' }}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <p className="fw-bold fs-6 mb-0">
              <Icon name="house-fill" className="me-1" /> {casa.nome}
              {casa.archiviata && <span className="badge bg-secondary ms-2">archiviata</span>}
            </p>
            <p className="small text-muted mb-1">
              Beds24 roomId: <code>{casa.beds24RoomId}</code>
            </p>
            {casa.indirizzo && (
              <p className="small text-muted mb-0">
                <Icon name="geo-alt-fill" className="me-1" /> {casa.indirizzo}
              </p>
            )}
            <div className="d-flex gap-2 flex-wrap mt-1">
              {casa.fotoUrls.length > 0 && (
                <span className="badge bg-light text-secondary">
                  <Icon name="camera-fill" /> {casa.fotoUrls.length}
                </span>
              )}
              {casa.dotazioni.length > 0 && (
                <span className="badge bg-light text-secondary">
                  <Icon name="sliders" /> {casa.dotazioni.length} dotazioni
                </span>
              )}
              {casa.vociNonApplicabili.length > 0 && (
                <span className="badge bg-light text-secondary">
                  <Icon name="ban" /> {casa.vociNonApplicabili.length} voci N/A
                </span>
              )}
            </div>
          </div>
          <div className="d-flex gap-1 flex-wrap justify-content-end">
            <button className="btn btn-outline-secondary btn-sm" onClick={onEdit}>
              <Icon name="pencil-fill" />
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={onArchive}
              title={casa.archiviata ? 'Riattiva' : 'Archivia'}>
              <Icon name={casa.archiviata ? 'arrow-clockwise' : 'box-fill'} />
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={onDelete}>
              <Icon name="trash" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminStrutture() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [case_, setCase]    = useState<Casa[]>([]);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Casa | 'new' | null>(null);

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/admin/strutture${showArchived ? '?archived=1' : ''}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setCase(data.case as Casa[]);
    } finally { setLoading(false); }
  }, [showArchived]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  async function toggleArchive(casa: Casa) {
    const res = await fetch(`/api/admin/strutture/${casa.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archiviata: !casa.archiviata }),
    });
    if (res.ok) load();
  }

  async function eliminaCasa(casa: Casa) {
    if (!confirm(`Eliminare definitivamente la casa "${casa.nome}"?`)) return;
    const res = await fetch(`/api/admin/strutture/${casa.id}`, { method: 'DELETE' });
    if (res.ok) setCase(case_.filter(c => c.id !== casa.id));
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0"><Icon name="house-fill" className="me-1" /> Strutture</h1>
          <p className="small text-muted mb-0">{case_.length} case</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
            <Icon name="arrow-clockwise" /> Aggiorna
          </button>
          <button className="btn btn-success btn-sm fw-bold" onClick={() => setEditing('new')}>
            <Icon name="house-fill" className="me-1" /> Nuova casa
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      <div className="form-check mb-3">
        <input id="showArch" type="checkbox" className="form-check-input"
          checked={showArchived}
          onChange={e => setShowArchived(e.target.checked)} />
        <label htmlFor="showArch" className="form-check-label small text-muted">
          Includi case archiviate
        </label>
      </div>

      {!loading && case_.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-4">
            <p className="text-muted mb-0">Nessuna casa. Clicca &quot;Nuova casa&quot; per iniziare.</p>
          </div>
        </div>
      )}

      {case_.map(c => (
        <CasaCard key={c.id} casa={c}
          onEdit={() => setEditing(c)}
          onArchive={() => toggleArchive(c)}
          onDelete={() => eliminaCasa(c)} />
      ))}

      {editing && (
        <CasaModal
          casa={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}
