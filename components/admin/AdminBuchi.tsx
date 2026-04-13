'use client';
import { useState, useEffect } from 'react';

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

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 12,
  border: '0.5px solid #e5e7eb', padding: '16px 18px', marginBottom: 10,
};
const btnSec: React.CSSProperties = {
  padding: '8px 14px', fontSize: 13,
  background: 'none', color: '#6b7280',
  border: '0.5px solid #d1d5db', borderRadius: 8, cursor: 'pointer',
};
const btnG: React.CSSProperties = {
  padding: '10px 20px', fontSize: 14, fontWeight: 700,
  background: '#16a34a', color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer',
};

function colorNotti(n: number): { bg: string; color: string } {
  if (n <= 2) return { bg: '#FEE2E2', color: '#7f1d1d' };
  if (n <= 4) return { bg: '#FEF3C7', color: '#78350f' };
  return { bg: '#FEF9C3', color: '#713f12' };
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
    <div style={{ maxWidth: 360, margin: '80px auto', padding: '0 20px' }}>
      <div style={{ ...card, padding: '28px 24px' }}>
        <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111' }}>🔒 Admin</p>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>Pannello buchi</p>
        <input
          type="password" placeholder="Password"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{
            width: '100%', padding: '10px 12px', fontSize: 15,
            border: '1px solid #d1d5db', borderRadius: 8,
            marginBottom: 10, boxSizing: 'border-box',
          }}
        />
        {err && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 8 }}>{err}</p>}
        <button style={{ ...btnG, width: '100%', opacity: busy ? 0.6 : 1 }}
          onClick={login} disabled={busy}>
          {busy ? 'Accesso…' : 'Accedi'}
        </button>
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

  if (authed === null) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Caricamento…</div>;
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

  const thStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 12px', textAlign: 'left', fontWeight: 600,
    color: active ? '#1E73BE' : '#6b7280',
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
    borderBottom: '1px solid #e5e7eb',
    cursor: active ? 'pointer' : 'default',
    userSelect: 'none', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>🕳️ Buchi</h1>
          {data && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
              {data.totalePrenotazioni} prenotazioni · aggiornato {new Date(data.lastUpdated).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin" style={{ ...btnSec, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>← Admin</a>
          <button style={btnSec} onClick={refresh} disabled={loading}>{loading ? '…' : '↻ Aggiorna'}</button>
          <button style={btnSec} onClick={logout}>Esci</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '0.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', margin: '12px 0', fontSize: 13, color: '#7f1d1d' }}>
          ❌ {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          Caricamento prenotazioni da Beds24…
        </div>
      )}

      {data && (
        <>
          {buchi.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '40px 20px', marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 28 }}>✅</p>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: '#16a34a', fontWeight: 600 }}>
                Nessun buco trovato
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
                Non ci sono finestre libere inferiori a 7 notti nei prossimi 12 mesi.
              </p>
            </div>
          ) : (
            <>
              {/* Filtri */}
              <div style={{ display: 'flex', gap: 10, margin: '16px 0', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={filtroMese}
                  onChange={e => setFiltroMese(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: 13, border: '0.5px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
                >
                  {mesi.map(m => <option key={m} value={m}>{mesiFmt[m]}</option>)}
                </select>

                <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
                  {sorted.length} buch{sorted.length === 1 ? 'o' : 'i'}
                </span>
              </div>

              {/* Tabella */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={thStyle(false)}>Property</th>
                      <th style={thStyle(false)}>Stanza</th>
                      <th style={thStyle(false)}>Libera dal</th>
                      <th style={thStyle(false)}>Libera al</th>
                      <th
                        style={thStyle(true)}
                        onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                      >
                        Notti {sortDir === 'asc' ? '↑' : '↓'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((b, i) => {
                      const { bg, color } = colorNotti(b.notti);
                      return (
                        <tr key={i} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', color: '#4b5563', fontSize: 12 }}>{b.property}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111' }}>{b.roomName}</td>
                          <td style={{ padding: '10px 12px', color: '#4b5563' }}>{fmtDate(b.liberaDal)}</td>
                          <td style={{ padding: '10px 12px', color: '#4b5563' }}>{fmtDate(b.liberaAl)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              background: bg, color, fontWeight: 700,
                              padding: '3px 10px', borderRadius: 20, fontSize: 12,
                            }}>
                              {b.notti} {b.notti === 1 ? 'notte' : 'notti'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
