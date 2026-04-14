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

// ── Stili ─────────────────────────────────────────────────────────────────────
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

const RISCHIO_CONFIG = {
  CRITICO: { bg: '#FEE2E2', color: '#7f1d1d', border: '#fca5a5', emoji: '🔴', label: 'CRITICO' },
  ALTO:    { bg: '#FEF3C7', color: '#78350f', border: '#fcd34d', emoji: '🟠', label: 'ALTO'    },
  NORMALE: { bg: '#F0FDF4', color: '#14532d', border: '#86efac', emoji: '🟢', label: 'NORMALE' },
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

// ── Login ─────────────────────────────────────────────────────────────────────
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
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>Pannello pulizie</p>
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
      <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Nessuna partenza nei prossimi 12 mesi.</p>
      </div>
    );
  }

  const nCritico = pulizie.filter(p => p.rischio === 'CRITICO').length;
  const nAlto    = pulizie.filter(p => p.rischio === 'ALTO').length;

  return (
    <div>
      {/* Sommario rischi */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'CRITICO', value: nCritico, bg: '#FEE2E2', color: '#7f1d1d' },
          { label: 'ALTO',    value: nAlto,    bg: '#FEF3C7', color: '#78350f' },
          { label: 'NORMALE', value: pulizie.length - nCritico - nAlto, bg: '#F0FDF4', color: '#14532d' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '8px 16px' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filtroMese}
          onChange={e => setFiltroMese(e.target.value)}
          style={{ padding: '7px 12px', fontSize: 13, border: '0.5px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
        >
          {mesi.map(m => <option key={m} value={m}>{mesiFmt[m]}</option>)}
        </select>

        <select
          value={filtroRischio}
          onChange={e => setFiltroRischio(e.target.value as any)}
          style={{ padding: '7px 12px', fontSize: 13, border: '0.5px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
        >
          <option value="Tutti">Tutti i livelli</option>
          <option value="CRITICO">Solo CRITICO</option>
          <option value="ALTO">Solo ALTO</option>
        </select>

        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
          {filtered.length} giorn{filtered.length === 1 ? 'o' : 'i'}
        </span>
      </div>

      {filtered.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '30px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Nessun giorno per il filtro selezionato.</p>
        </div>
      )}

      {filtered.map((day, i) => {
        const cfg = RISCHIO_CONFIG[day.rischio];
        return (
          <div key={i} style={{ ...card, border: `1px solid ${cfg.border}`, background: cfg.bg }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>
                {fmtDate(day.date)}
              </p>
              <span style={{
                background: cfg.color, color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
              }}>
                {cfg.emoji} {cfg.label}
              </span>
            </div>

            {/* Metriche */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Partenze',    value: day.departures.length, emoji: '✈️' },
                { label: 'Arrivi',      value: day.arrivals.length,   emoji: '🏠' },
                { label: 'Ore lavoro',  value: fmtMinuti(day.minutiTotali), emoji: '⏱️' },
              ].map(m => (
                <div key={m.label} style={{
                  background: 'rgba(255,255,255,0.7)', borderRadius: 8,
                  padding: '8px 14px', minWidth: 90,
                }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: cfg.color }}>
                    {m.emoji} {m.value}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Partenze */}
            {day.departures.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Partenze
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {day.departures.map((r, j) => (
                    <span key={j} style={{
                      background: 'rgba(255,255,255,0.8)', border: `0.5px solid ${cfg.border}`,
                      borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#111',
                    }}>
                      {r.roomName} <span style={{ color: '#9ca3af' }}>{fmtMinuti(r.minuti)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Arrivi */}
            {day.arrivals.length > 0 && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Arrivi stesso giorno
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {day.arrivals.map((r, j) => (
                    <span key={j} style={{
                      background: 'rgba(255,255,255,0.5)', borderRadius: 6,
                      padding: '3px 10px', fontSize: 12, color: '#4b5563',
                      border: '0.5px solid #d1d5db',
                    }}>
                      {r.roomName}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

  const thStyle = (key: SortKey): React.CSSProperties => ({
    padding: '10px 12px', textAlign: 'left', fontWeight: 600,
    color: sortKey === key ? '#1E73BE' : '#6b7280',
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
    borderBottom: '1px solid #e5e7eb', cursor: 'pointer',
    userSelect: 'none', whiteSpace: 'nowrap',
  });

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '';

  if (movimenti.length === 0) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Nessun movimento nei prossimi 12 mesi.</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
        {movimenti.length} giorni con movimenti · clicca le colonne per ordinare · passa il mouse su una riga per i dettagli
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={thStyle('date')}     onClick={() => toggleSort('date')}>Data{arrow('date')}</th>
              <th style={thStyle('partenze')} onClick={() => toggleSort('partenze')}>✈️ Partenze{arrow('partenze')}</th>
              <th style={thStyle('arrivi')}   onClick={() => toggleSort('arrivi')}>🏠 Arrivi{arrow('arrivi')}</th>
              <th style={thStyle('minuti')}   onClick={() => toggleSort('minuti')}>⏱️ Ore lavoro{arrow('minuti')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr
                key={i}
                style={{ borderBottom: '0.5px solid #f3f4f6', position: 'relative', background: hoveredRow === i ? '#f0f9ff' : 'transparent' }}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Tooltip ancorato alla cella data */}
                <td style={{ padding: '10px 12px', color: '#111', fontWeight: 500, position: 'relative' }}>
                  {fmtDate(m.date)}
                  {hoveredRow === i && (() => {
                    const setPartenze  = new Set(m.casePartenze);
                    const setArrivi    = new Set(m.caseArrivi);
                    const soloArrivi   = m.caseArrivi.filter(c => !setPartenze.has(c));
                    const soloPartenze = m.casePartenze.filter(c => !setArrivi.has(c));
                    const entrambe     = m.casePartenze.filter(c => setArrivi.has(c));
                    return (
                      <div style={{
                        position: 'absolute', left: 0, top: '110%',
                        background: '#1f2937', color: '#fff', borderRadius: 10,
                        padding: '10px 14px', zIndex: 100, minWidth: 200,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        pointerEvents: 'none',
                      }}>
                        {entrambe.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              🔄 Arrivi e Partenze
                            </p>
                            {entrambe.map((c, j) => (
                              <p key={j} style={{ margin: '2px 0', fontSize: 12, color: '#fbbf24' }}>{c}</p>
                            ))}
                          </div>
                        )}
                        {soloPartenze.length > 0 && (
                          <div style={{ marginBottom: soloArrivi.length > 0 ? 10 : 0 }}>
                            <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ✈️ Partenze
                            </p>
                            {soloPartenze.map((c, j) => (
                              <p key={j} style={{ margin: '2px 0', fontSize: 12, color: '#fca5a5' }}>{c}</p>
                            ))}
                          </div>
                        )}
                        {soloArrivi.length > 0 && (
                          <div>
                            <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              🏠 Arrivi
                            </p>
                            {soloArrivi.map((c, j) => (
                              <p key={j} style={{ margin: '2px 0', fontSize: 12, color: '#86efac' }}>{c}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: m.partenze >= 6 ? '#FEE2E2' : m.partenze >= 3 ? '#FEF3C7' : '#f3f4f6',
                    color: m.partenze >= 6 ? '#7f1d1d' : m.partenze >= 3 ? '#78350f' : '#374151',
                    fontWeight: 700, padding: '2px 10px', borderRadius: 20, fontSize: 12,
                  }}>
                    {m.partenze}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: m.arrivi >= 6 ? '#FEE2E2' : m.arrivi >= 3 ? '#FEF3C7' : '#f3f4f6',
                    color: m.arrivi >= 6 ? '#7f1d1d' : m.arrivi >= 3 ? '#78350f' : '#374151',
                    fontWeight: 700, padding: '2px 10px', borderRadius: 20, fontSize: 12,
                  }}>
                    {m.arrivi}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: '#4b5563' }}>{fmtMinuti(m.minuti)}</td>
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

  if (authed === null) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => { setAuthed(true); refresh(); }} />;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>🧹 Pulizie</h1>
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

      {!data && !loading && !error && (
        <div style={{ ...card, textAlign: 'center', padding: '40px', marginTop: 20 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Nessun dato. Clicca Aggiorna.</p>
        </div>
      )}

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          Caricamento prenotazioni da Beds24…
        </div>
      )}

      {data && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', margin: '16px 0 20px' }}>
            {([
              { key: 'alert',     label: `Alert (${data.pulizie.length})` },
              { key: 'movimenti', label: `Movimenti (${data.movimenti.length})` },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px', fontSize: 14, fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.key ? '2px solid #1E73BE' : '2px solid transparent',
                  color: activeTab === tab.key ? '#1E73BE' : '#6b7280',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'alert'     && <TabAlert     pulizie={data.pulizie} />}
          {activeTab === 'movimenti' && <TabMovimenti movimenti={data.movimenti} />}
        </>
      )}
    </div>
  );
}
