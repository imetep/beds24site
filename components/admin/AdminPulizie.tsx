'use client';
import { useState, useEffect } from 'react';

interface DepartureRoom {
  roomId:   number;
  roomName: string;
  property: string;
  mq:       number;
  minuti:   number;
}

interface ArrivalRoom {
  roomId:   number;
  roomName: string;
  property: string;
}

interface PuliziaDay {
  date:         string;
  departures:   DepartureRoom[];
  arrivals:     ArrivalRoom[];
  minutiTotali: number;
  rischio:      'CRITICO' | 'ALTO' | 'NORMALE';
}

interface Movimento {
  date:         string;
  partenze:     number;
  arrivi:       number;
  minuti:       number;
  casePartenze: string[];
  caseArrivi:   string[];
}

interface OperativoData {
  pulizie:            PuliziaDay[];
  movimenti:          Movimento[];
  totalePrenotazioni: number;
  lastUpdated:        string;
}

const RISCHIO_CONFIG = {
  CRITICO: { cardBg: '#FEE2E2', cardBorder: '#fca5a5', badge: 'bg-danger',  dot: '🔴', label: 'CRITICO', textColor: '#7f1d1d' },
  ALTO:    { cardBg: '#FEF3C7', cardBorder: '#fcd34d', badge: 'bg-warning text-dark', dot: '🟠', label: 'ALTO',    textColor: '#78350f' },
  NORMALE: { cardBg: '#F0FDF4', cardBorder: '#86efac', badge: 'bg-success', dot: '🟢', label: 'NORMALE', textColor: '#14532d' },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function fmtMinuti(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
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
          <p className="fs-4 fw-bold mb-1"><i className="bi bi-lock-fill me-1"></i> Admin</p>
          <p className="text-muted small mb-3">Pannello pulizie</p>
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          {err && <p className="small text-danger mb-2">{err}</p>}
          <button className="btn btn-success fw-bold w-100" onClick={login} disabled={busy}>
            {busy ? 'Accesso…' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Alert ─────────────────────────────────────────────────────────────────
function TabAlert({ pulizie }: { pulizie: PuliziaDay[] }) {
  const [filtroMese, setFiltroMese] = useState('Tutti');
  const [filtroRischio, setFiltroRischio] = useState<'Tutti' | 'CRITICO' | 'ALTO'>('Tutti');

  const mesi = ['Tutti', ...Array.from(new Set(
    pulizie.map(p => p.date.slice(0, 7))
  )).sort()];

  const mesiFmt: Record<string, string> = {};
  for (const m of mesi) {
    if (m === 'Tutti') { mesiFmt[m] = 'Tutti i mesi'; continue; }
    const [y, mo] = m.split('-');
    mesiFmt[m] = new Date(Number(y), Number(mo) - 1, 1)
      .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  const filtered = pulizie.filter(p => {
    if (filtroMese !== 'Tutti' && p.date.slice(0, 7) !== filtroMese) return false;
    if (filtroRischio !== 'Tutti' && p.rischio !== filtroRischio) return false;
    return true;
  });

  if (pulizie.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <p className="small text-muted mb-0">Nessuna partenza nei prossimi 12 mesi.</p>
        </div>
      </div>
    );
  }

  const nCritico = pulizie.filter(p => p.rischio === 'CRITICO').length;
  const nAlto    = pulizie.filter(p => p.rischio === 'ALTO').length;

  return (
    <div>
      {/* Sommario rischi */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { label: 'CRITICO', value: nCritico, bg: 'bg-danger-subtle',  tx: 'text-danger-emphasis' },
          { label: 'ALTO',    value: nAlto,    bg: 'bg-warning-subtle', tx: 'text-warning-emphasis' },
          { label: 'NORMALE', value: pulizie.length - nCritico - nAlto, bg: 'bg-success-subtle', tx: 'text-success-emphasis' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded px-3 py-2`}>
            <p className={`fs-4 fw-bold mb-0 ${s.tx}`}>{s.value}</p>
            <p className="small text-muted mb-0">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <select
          className="form-select form-select-sm w-auto"
          value={filtroMese}
          onChange={e => setFiltroMese(e.target.value)}
        >
          {mesi.map(m => <option key={m} value={m}>{mesiFmt[m]}</option>)}
        </select>

        <select
          className="form-select form-select-sm w-auto"
          value={filtroRischio}
          onChange={e => setFiltroRischio(e.target.value as any)}
        >
          <option value="Tutti">Tutti i livelli</option>
          <option value="CRITICO">Solo CRITICO</option>
          <option value="ALTO">Solo ALTO</option>
        </select>

        <span className="small text-muted ms-auto">
          {filtered.length} giorn{filtered.length === 1 ? 'o' : 'i'}
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-4">
            <p className="small text-muted mb-0">Nessun giorno per il filtro selezionato.</p>
          </div>
        </div>
      )}

      {filtered.map((day, i) => {
        const cfg = RISCHIO_CONFIG[day.rischio];
        return (
          <div
            key={i}
            className="card mb-2"
            style={{ background: cfg.cardBg, borderColor: cfg.cardBorder }}
          >
            <div className="card-body p-3">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="fw-bold fs-6 mb-0">{fmtDate(day.date)}</p>
                <span className={`badge rounded-pill ${cfg.badge}`}>
                  {cfg.dot} {cfg.label}
                </span>
              </div>

              {/* Metriche */}
              <div className="d-flex gap-3 mb-3 flex-wrap">
                {[
                  { label: 'Partenze',    value: String(day.departures.length), emoji: '✈️' },
                  { label: 'Arrivi',      value: String(day.arrivals.length),   emoji: '🏠' },
                  { label: 'Ore lavoro',  value: fmtMinuti(day.minutiTotali),   emoji: '⏱️' },
                ].map(m => (
                  <div
                    key={m.label}
                    className="rounded px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.7)', minWidth: 90 }}
                  >
                    <p className="fs-5 fw-bold mb-0" style={{ color: cfg.textColor }}>
                      {m.emoji} {m.value}
                    </p>
                    <p className="small text-muted mb-0">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Partenze */}
              {day.departures.length > 0 && (
                <div className="mb-2">
                  <span className="text-uppercase small text-muted fw-semibold">
                    Partenze
                  </span>
                  <div className="d-flex gap-2 flex-wrap mt-1">
                    {day.departures.map((r, j) => (
                      <span
                        key={j}
                        className="badge border rounded px-2 py-1"
                        style={{ background: 'rgba(255,255,255,0.8)', borderColor: cfg.cardBorder, color: '#111' }}
                      >
                        {r.roomName} <span className="text-muted ms-1">{fmtMinuti(r.minuti)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Arrivi */}
              {day.arrivals.length > 0 && (
                <div>
                  <span className="text-uppercase small text-muted fw-semibold">
                    Arrivi stesso giorno
                  </span>
                  <div className="d-flex gap-2 flex-wrap mt-1">
                    {day.arrivals.map((r, j) => (
                      <span
                        key={j}
                        className="badge border rounded text-secondary px-2 py-1"
                        style={{ background: 'rgba(255,255,255,0.5)' }}
                      >
                        {r.roomName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab Movimenti ─────────────────────────────────────────────────────────────
type SortKey = 'date' | 'partenze' | 'arrivi' | 'minuti';

function TabMovimenti({ movimenti }: { movimenti: Movimento[] }) {
  const [sortKey, setSortKey]   = useState<SortKey>('date');
  const [sortAsc, setSortAsc]   = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...movimenti].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const thClass = (key: SortKey) =>
    `text-uppercase small ${sortKey === key ? 'text-primary' : 'text-muted'}`;

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '';

  if (movimenti.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <p className="small text-muted mb-0">Nessun movimento nei prossimi 12 mesi.</p>
        </div>
      </div>
    );
  }

  const badgeClass = (n: number) => {
    if (n >= 6) return 'bg-danger-subtle text-danger-emphasis';
    if (n >= 3) return 'bg-warning-subtle text-warning-emphasis';
    return 'bg-light text-dark';
  };

  return (
    <div>
      <p className="small text-secondary mb-3">
        {movimenti.length} giorni con movimenti · clicca le colonne per ordinare · passa il mouse su una riga per i dettagli
      </p>
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead className="table-light">
            <tr>
              <th className={thClass('date')}     style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('date')}>Data{arrow('date')}</th>
              <th className={thClass('partenze')} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('partenze')}>✈️ Partenze{arrow('partenze')}</th>
              <th className={thClass('arrivi')}   style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('arrivi')}>🏠 Arrivi{arrow('arrivi')}</th>
              <th className={thClass('minuti')}   style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('minuti')}>⏱️ Ore lavoro{arrow('minuti')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr
                key={i}
                className={hoveredRow === i ? 'table-primary' : ''}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Tooltip ancorato alla cella data */}
                <td className="fw-medium position-relative">
                  {fmtDate(m.date)}
                  {hoveredRow === i && (() => {
                    const setPartenze  = new Set(m.casePartenze);
                    const setArrivi    = new Set(m.caseArrivi);
                    const soloArrivi   = m.caseArrivi.filter(c => !setPartenze.has(c));
                    const soloPartenze = m.casePartenze.filter(c => !setArrivi.has(c));
                    const entrambe     = m.casePartenze.filter(c => setArrivi.has(c));
                    return (
                      <div
                        className="position-absolute text-white rounded-3 shadow-lg p-3"
                        style={{
                          left: 0, top: '110%',
                          background: '#1f2937', zIndex: 100,
                          minWidth: 200, pointerEvents: 'none',
                        }}
                      >
                        {entrambe.length > 0 && (
                          <div className="mb-2">
                            <p className="small fw-bold text-uppercase mb-1" style={{ color: '#fbbf24', letterSpacing: '0.05em' }}>
                              🔄 Arrivi e Partenze
                            </p>
                            {entrambe.map((c, j) => (
                              <p key={j} className="mb-0 small" style={{ color: '#fbbf24' }}>{c}</p>
                            ))}
                          </div>
                        )}
                        {soloPartenze.length > 0 && (
                          <div className={soloArrivi.length > 0 ? 'mb-2' : ''}>
                            <p className="small fw-bold text-uppercase mb-1 text-muted">✈️ Partenze</p>
                            {soloPartenze.map((c, j) => (
                              <p key={j} className="mb-0 small" style={{ color: '#fca5a5' }}>{c}</p>
                            ))}
                          </div>
                        )}
                        {soloArrivi.length > 0 && (
                          <div>
                            <p className="small fw-bold text-uppercase mb-1 text-muted">🏠 Arrivi</p>
                            {soloArrivi.map((c, j) => (
                              <p key={j} className="mb-0 small" style={{ color: '#86efac' }}>{c}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td>
                  <span className={`badge rounded-pill ${badgeClass(m.partenze)}`}>
                    {m.partenze}
                  </span>
                </td>
                <td>
                  <span className={`badge rounded-pill ${badgeClass(m.arrivi)}`}>
                    {m.arrivi}
                  </span>
                </td>
                <td className="text-secondary">{fmtMinuti(m.minuti)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function AdminPulizie() {
  const [authed, setAuthed]   = useState<boolean | null>(null);
  const [data, setData]       = useState<OperativoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [activeTab, setActiveTab] = useState<'alert' | 'movimenti'>('alert');

  useEffect(() => {
    fetch('/api/admin/operativo')
      .then(r => {
        setAuthed(r.ok);
        if (r.ok) return r.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(() => setAuthed(false));
  }, []);

  async function refresh() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/operativo');
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => { setAuthed(true); refresh(); }} />;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1400 }}>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h1 className="h4 fw-bold mb-0"><i className="bi bi-brush-fill me-1"></i> Pulizie</h1>
          {data && (
            <p className="small text-muted mb-0">
              {data.totalePrenotazioni} prenotazioni · aggiornato {new Date(data.lastUpdated).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="d-flex gap-2">
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={refresh} disabled={loading}>{loading ? '…' : '↻ Aggiorna'}</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 my-3 small">
          <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card mt-4">
          <div className="card-body text-center py-5">
            <p className="small text-muted mb-0">Nessun dato. Clicca Aggiorna.</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center text-muted py-5 small">
          Caricamento prenotazioni da Beds24…
        </div>
      )}

      {data && (
        <>
          {/* Tabs */}
          <ul className="nav nav-tabs my-3">
            {([
              { key: 'alert',     label: `Alert (${data.pulizie.length})` },
              { key: 'movimenti', label: `Movimenti (${data.movimenti.length})` },
            ] as const).map(tab => (
              <li key={tab.key} className="nav-item">
                <button
                  className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          {activeTab === 'alert'     && <TabAlert     pulizie={data.pulizie} />}
          {activeTab === 'movimenti' && <TabMovimenti movimenti={data.movimenti} />}
        </>
      )}
    </div>
  );
}
