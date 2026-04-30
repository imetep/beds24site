'use client';
import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';

interface Buco {
  roomId:    number;
  roomName:  string;
  property:  string;
  liberaDal: string;
  liberaAl:  string;
  notti:     number;
}

interface OperativoData {
  buchi:              Buco[];
  totalePrenotazioni: number;
  lastUpdated:        string;
}

function colorNotti(n: number): string {
  if (n <= 2) return 'bg-danger-subtle text-danger-emphasis';
  if (n <= 4) return 'bg-warning-subtle text-warning-emphasis';
  return 'bg-warning-subtle text-warning-emphasis';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
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
          <p className="text-muted small mb-3">Pannello buchi</p>
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

type SortDir = 'asc' | 'desc';

export default function AdminBuchi() {
  const [authed, setAuthed]   = useState<boolean | null>(null);
  const [data, setData]       = useState<OperativoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Filtri e ordinamento
  const [filtroMese, setFiltroMese]   = useState('Tutti');
  const [sortDir, setSortDir]         = useState<SortDir>('asc');

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

  const buchi = data?.buchi ?? [];

  // Mesi disponibili
  const mesi = ['Tutti', ...Array.from(new Set(
    buchi.map(b => b.liberaDal.slice(0, 7))
  )).sort()];

  const mesiFmt: Record<string, string> = {};
  for (const m of mesi) {
    if (m === 'Tutti') { mesiFmt[m] = 'Tutti i mesi'; continue; }
    const [y, mo] = m.split('-');
    mesiFmt[m] = new Date(Number(y), Number(mo) - 1, 1)
      .toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  // Filtra per mese
  const filtered = buchi.filter(b =>
    filtroMese === 'Tutti' || b.liberaDal.slice(0, 7) === filtroMese
  );

  // Ordina per notti
  const sorted = [...filtered].sort((a, b) =>
    sortDir === 'asc' ? a.notti - b.notti : b.notti - a.notti
  );

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1400 }}>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h1 className="h4 fw-bold mb-0"><Icon name="calendar-x-fill" className="me-1" /> Buchi</h1>
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
          <Icon name="exclamation-circle-fill" className="me-1" /> {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-muted py-5 small">
          Caricamento prenotazioni da Beds24…
        </div>
      )}

      {data && (
        <>
          {buchi.length === 0 ? (
            <div className="card mt-3">
              <div className="card-body text-center py-5">
                <p className="mb-2"><Icon name="check-circle-fill" size={40} className="text-success" /></p>
                <p className="fs-6 text-success fw-semibold mb-1">Nessun buco trovato</p>
                <p className="small text-muted mb-0">
                  Non ci sono finestre libere inferiori a 7 notti nei prossimi 12 mesi.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Filtri */}
              <div className="d-flex gap-2 my-3 flex-wrap align-items-center">
                <select
                  className="form-select form-select-sm w-auto"
                  value={filtroMese}
                  onChange={e => setFiltroMese(e.target.value)}
                >
                  {mesi.map(m => <option key={m} value={m}>{mesiFmt[m]}</option>)}
                </select>

                <span className="small text-muted ms-auto">
                  {sorted.length} buch{sorted.length === 1 ? 'o' : 'i'}
                </span>
              </div>

              {/* Tabella */}
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase small text-muted">Property</th>
                      <th className="text-uppercase small text-muted">Stanza</th>
                      <th className="text-uppercase small text-muted">Libera dal</th>
                      <th className="text-uppercase small text-muted">Libera al</th>
                      <th
                        className="text-uppercase small text-primary"
                        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                        onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                      >
                        Notti {sortDir === 'asc' ? '↑' : '↓'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((b, i) => (
                      <tr key={i}>
                        <td className="small text-secondary">{b.property}</td>
                        <td className="fw-semibold">{b.roomName}</td>
                        <td className="text-secondary">{fmtDate(b.liberaDal)}</td>
                        <td className="text-secondary">{fmtDate(b.liberaAl)}</td>
                        <td>
                          <span className={`badge rounded-pill ${colorNotti(b.notti)}`}>
                            {b.notti} {b.notti === 1 ? 'notte' : 'notti'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
