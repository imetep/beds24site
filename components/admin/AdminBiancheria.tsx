'use client';
import { useState, useEffect, useCallback } from 'react';
import type { ApartmentBedConfig, Bed, BedVariant } from '@/lib/bedConfig';

// ─── Tipi ─────────────────────────────────────────────────────────────────────

type BedState = 'off' | 'A' | 'B';

interface LinenResult {
  lenzMatrimoniali: number;
  lenzSingoli:      number;
  federe:           number;
  persone:          number;
  culle:            number;
}

interface BiancheriaItem {
  bookId:    number;
  roomId:    number;
  roomName:  string;
  arrival:   string;
  departure: string;
  guestName: string;
  numAdult:  number;
  numChild:  number;
  source:    'guest' | 'admin' | 'default';
  hasConfig: boolean;
  linen:     LinenResult | null;
  bedStates: Record<string, BedState>;
  cribs:     number;
  config:    ApartmentBedConfig | null;
}

// ─── Stili ────────────────────────────────────────────────────────────────────

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
  padding: '8px 16px', fontSize: 13, fontWeight: 700,
  background: '#16a34a', color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer',
};
const btnBlue: React.CSSProperties = {
  padding: '8px 16px', fontSize: 13, fontWeight: 600,
  background: '#1E73BE', color: '#fff', border: 'none',
  borderRadius: 8, cursor: 'pointer',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

/** Genera bedStates di default dalla config:
 *  estraibile/poltrona → off (non preparati)
 *  tutto il resto      → A  (configurazione base)
 */
function defaultBedStates(config: ApartmentBedConfig): Record<string, BedState> {
  const states: Record<string, BedState> = {};
  for (const room of config.rooms) {
    for (const bed of room.beds) {
      states[bed.id] =
        bed.variant === 'estraibile' || bed.variant === 'poltrona' ? 'off' : 'A';
    }
  }
  return states;
}

// ─── Helpers calendario ───────────────────────────────────────────────────────

function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function parseYMD(ymd: string): Date { const [y,m,d] = ymd.split('-').map(Number); return new Date(y, m-1, d); }
function addDays(ymd: string, n: number): string { const d = parseYMD(ymd); d.setDate(d.getDate()+n); return toYMD(d.getFullYear(), d.getMonth(), d.getDate()); }
function addMonths(year: number, month: number, delta: number) {
  let m = month + delta;
  return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
}
function buildCells(year: number, month: number): (number|null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const cells: (number|null)[] = Array(offset).fill(null);
  for (let d = 1; d <= new Date(year, month+1, 0).getDate(); d++) cells.push(d);
  return cells;
}

const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const DAYS_IT   = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];
const navBtn = (disabled: boolean): React.CSSProperties => ({
  background: 'none', border: 'none', fontSize: 28, lineHeight: 1,
  cursor: disabled ? 'default' : 'pointer',
  color: disabled ? '#ddd' : '#333', padding: '0 8px', fontWeight: 300, flexShrink: 0,
});

// ─── RangeCalendar ────────────────────────────────────────────────────────────

function RangeCalendar({ from, to, onChange }: {
  from: string; to: string;
  onChange: (from: string, to: string) => void;
}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [phase,     setPhase]     = useState<'from'|'to'>('from');
  const [hover,     setHover]     = useState<string|null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [open,      setOpen]      = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function handleDay(ymd: string) {
    if (ymd < todayYMD) return;
    if (phase === 'from') {
      onChange(ymd, addDays(ymd, 7));
      setPhase('to');
    } else {
      if (ymd <= from) return;
      onChange(from, ymd);
      setPhase('from');
      setOpen(false); // chiude automaticamente quando il range è completo
    }
  }

  const rangeEnd = phase === 'to' ? (hover ?? to) : to;

  function renderMonth(year: number, month: number) {
    const cells = buildCells(year, month);
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#111' }}>
          {MONTHS_IT[month]} {year}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {DAYS_IT.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#bbb', paddingBottom: 4 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ height: 36 }} />;
            const ymd     = toYMD(year, month, day);
            const isPast  = ymd < todayYMD;
            const isFrom  = ymd === from;
            const isTo    = ymd === to;
            const isToday = ymd === todayYMD;
            const inRange = from && rangeEnd && ymd > from && ymd < rangeEnd;

            let bg = 'transparent';
            let color = isPast ? '#ccc' : '#222';
            let fontWeight: number = isToday ? 700 : 400;
            let borderRadius = '6px';

            if (isFrom || isTo) {
              bg = '#1E73BE'; color = '#fff'; fontWeight = 700;
              borderRadius = isFrom ? '6px 0 0 6px' : '0 6px 6px 0';
            } else if (inRange) {
              bg = '#EEF5FC'; borderRadius = '0';
            } else if (hover === ymd && phase === 'to' && ymd > from) {
              bg = '#f0f7ff';
            }

            return (
              <div key={i} onClick={() => !isPast && handleDay(ymd)}
                onMouseEnter={() => setHover(ymd)} onMouseLeave={() => setHover(null)}
                style={{
                  height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight, userSelect: 'none',
                  cursor: isPast ? 'default' : 'pointer',
                  borderRadius, color, background: bg, opacity: isPast ? 0.4 : 1,
                  transition: 'background 0.1s', position: 'relative',
                }}>
                {day}
                {isToday && !isFrom && !isTo && (
                  <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#1E73BE' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const isPrevDisabled = toYMD(viewYear, viewMonth, 1) <= toYMD(today.getFullYear(), today.getMonth(), 1);
  const second = addMonths(viewYear, viewMonth, 1);

  const fmtPill = (ymd: string) =>
    new Date(ymd + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      {/* Pill trigger — sempre visibile */}
      <button
        onClick={() => { setOpen(o => !o); setPhase('from'); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
          border: open ? '1.5px solid #1E73BE' : '1px solid #d1d5db',
          background: open ? '#EEF5FC' : '#fff',
          marginBottom: open ? 12 : 0,
          fontSize: 14, fontWeight: 500, color: '#374151',
          transition: 'border 0.15s, background 0.15s',
        }}>
        <span style={{ fontSize: 16 }}>📅</span>
        <span>
          <span style={{ fontWeight: 700, color: '#1E73BE' }}>{fmtPill(from)}</span>
          <span style={{ color: '#9ca3af', margin: '0 6px' }}>→</span>
          <span style={{ fontWeight: 700, color: '#1E73BE' }}>{fmtPill(to)}</span>
        </span>
        <span style={{
          fontSize: 11, color: '#9ca3af',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s', marginLeft: 2,
        }}>▼</span>
      </button>

      {/* Calendario — visibile solo se open */}
      {open && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: isDesktop ? '20px 28px 24px' : '16px 12px 20px', background: '#fff' }}>
          {/* Hint fase */}
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9ca3af' }}>
            {phase === 'from' ? '📅 Seleziona la data di inizio' : '📅 Seleziona la data di fine'}
          </p>
          {/* Navigazione */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={() => { if (!isPrevDisabled) { const p = addMonths(viewYear, viewMonth, -1); setViewYear(p.year); setViewMonth(p.month); } }}
              disabled={isPrevDisabled} style={navBtn(isPrevDisabled)}>‹</button>
            {isDesktop ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{MONTHS_IT[viewMonth]} {viewYear}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{MONTHS_IT[second.month]} {second.year}</span>
              </div>
            ) : (
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111', flex: 1, textAlign: 'center' }}>{MONTHS_IT[viewMonth]} {viewYear}</span>
            )}
            <button onClick={() => { const n = addMonths(viewYear, viewMonth, 1); setViewYear(n.year); setViewMonth(n.month); }}
              style={navBtn(false)}>›</button>
          </div>
          {/* Mesi */}
          <div style={{ display: 'flex', gap: isDesktop ? 40 : 0 }}>
            {renderMonth(viewYear, viewMonth)}
            {isDesktop && (
              <>
                <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />
                {renderMonth(second.year, second.month)}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: BiancheriaItem['source'] }) {
  const map = {
    guest:   { bg: '#DCFCE7', color: '#15803d', label: '👤 Ospite' },
    admin:   { bg: '#EEF5FC', color: '#1E73BE', label: '👑 Admin'  },
    default: { bg: '#FEF9C3', color: '#713f12', label: '⚙️ Auto'  },
  };
  const s = map[source];
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function LinenSummary({ linen }: { linen: LinenResult }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: '#374151', marginTop: 6 }}>
      <span>🛏 <b>{linen.lenzMatrimoniali}</b> matr</span>
      <span>🛌 <b>{linen.lenzSingoli}</b> sing</span>
      <span>🪶 <b>{linen.federe}</b> federe</span>
      <span>🧺 <b>{linen.persone}</b> asciug</span>
      {linen.culle > 0 && <span>🚼 <b>{linen.culle}</b> culle</span>}
    </div>
  );
}

/**
 * Riga per un singolo letto nel pannello di configurazione admin.
 *
 * Logica stati:
 *  - standard/castello/divano      → fisso, sempre A, non modificabile
 *  - poltrona (canConfigure false) → toggle semplice off ↔ A
 *  - estraibile (canConfigure true)→ toggle off ↔ A  (off=chiuso, A=aperto)
 *  - sommier/impilabile/pavimento  → toggle A ↔ B   (A=chiuso, B=aperto)
 *  - trasformabile (sommier+iconStates.A=singolo) → toggle A ↔ B
 */
function BedRow({
  bed,
  state,
  onChange,
}: {
  bed: Bed;
  state: BedState;
  onChange: (bedId: string, newState: BedState) => void;
}) {
  const variant = bed.variant as BedVariant;

  // ── Fissi: standard, castello, divano ──────────────────────────────────────
  const STATIC: BedVariant[] = ['standard', 'castello', 'divano'];
  if (STATIC.includes(variant)) {
    let label =
      variant === 'divano'   ? `Divano letto (${bed.defaultLinenType})` :
      variant === 'castello' ? 'Letto a castello' :
      bed.baseType === 'matrimoniale'
        ? `Matrimoniale${bed.dimensions ? ` (${bed.dimensions})` : ''}`
        : `Singolo${bed.dimensions ? ` (${bed.dimensions})` : ''}`;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{label}</span>
        <span style={{
          fontSize: 11, background: '#f3f4f6', color: '#6b7280',
          padding: '2px 8px', borderRadius: 6,
        }}>Fisso</span>
      </div>
    );
  }

  // ── Poltrona: toggle off / A (non usa configOptions) ──────────────────────
  if (variant === 'poltrona') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#374151', minWidth: 80 }}>Poltrona letto</span>
        {(['off', 'A'] as BedState[]).map(s => {
          const active = state === s;
          const lbl    = s === 'off' ? 'Non aperta' : 'Aperta (1 posto)';
          return (
            <button key={s} onClick={() => onChange(bed.id, s)} style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
              border:      active ? '1.5px solid #1E73BE' : '1px solid #d1d5db',
              background:  active ? '#EEF5FC' : '#fff',
              color:       active ? '#1E73BE' : '#6b7280',
              fontWeight:  active ? 700 : 400,
            }}>{lbl}</button>
          );
        })}
      </div>
    );
  }

  // ── Configurable con configOptions ─────────────────────────────────────────
  if (!bed.canConfigure || !bed.configOptions) return null;

  // estraibile: off = chiuso, A = aperto
  // tutti gli altri (sommier, impilabile, pavimento, trasformabile): A = chiuso, B = aperto
  const isOffClosed = variant === 'estraibile';

  const closedState: BedState = isOffClosed ? 'off' : 'A';
  const openState:   BedState = isOffClosed ? 'A'   : 'B';

  const closedLabel = bed.configOptions.closed.label.it;
  const openLabel   = bed.configOptions.open.label.it;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
      {[
        { s: closedState, lbl: closedLabel, color: '#1E73BE', bg: '#EEF5FC' },
        { s: openState,   lbl: openLabel,   color: '#16a34a', bg: '#DCFCE7' },
      ].map(({ s, lbl, color, bg }) => {
        const active = state === s;
        return (
          <button key={s} onClick={() => onChange(bed.id, s)} style={{
            padding: '4px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
            border:     active ? `1.5px solid ${color}` : '1px solid #d1d5db',
            background: active ? bg   : '#fff',
            color:      active ? color : '#6b7280',
            fontWeight: active ? 700   : 400,
          }}>{lbl}</button>
        );
      })}
    </div>
  );
}

// ─── LoginForm ────────────────────────────────────────────────────────────────

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
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>Biancheria — LivingApple</p>
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
        <button
          style={{ ...btnG, width: '100%', opacity: busy ? 0.6 : 1 }}
          onClick={login} disabled={busy}>
          {busy ? 'Accesso…' : 'Accedi'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminBiancheria() {
  const [authed,  setAuthed]  = useState<boolean | null>(null);
  const [items,   setItems]   = useState<BiancheriaItem[]>([]);
  const [totals,  setTotals]  = useState<LinenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const def7Str  = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(todayStr);
  const [to,   setTo]   = useState(def7Str);

  // Stato card espansa
  const [expanded,   setExpanded]   = useState<number | null>(null);
  const [editStates, setEditStates] = useState<Record<string, BedState>>({});
  const [editCribs,  setEditCribs]  = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');

  // Verifica auth all'avvio
  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setExpanded(null); setSaveMsg('');
    try {
      const res = await fetch(`/api/admin/biancheria?from=${from}&to=${to}`);
      if (!res.ok) { setError('Errore nel caricamento dei dati'); return; }
      const data = await res.json();
      setItems(data.items ?? []);
      setTotals(data.totals ?? null);
    } catch {
      setError('Errore di rete');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  // ── Gestione espansione card ────────────────────────────────────────────────

  function toggleExpand(item: BiancheriaItem) {
    if (expanded === item.bookId) {
      setExpanded(null);
      return;
    }
    setExpanded(item.bookId);
    setSaveMsg('');
    // Inizializza edit solo se ha config
    if (item.config) {
      setEditStates({ ...item.bedStates });
      setEditCribs(item.cribs);
    }
  }

  function handleBedChange(bedId: string, newState: BedState) {
    setEditStates(prev => ({ ...prev, [bedId]: newState }));
    setSaveMsg('');
  }

  function resetToDefault(item: BiancheriaItem) {
    if (!item.config) return;
    setEditStates(defaultBedStates(item.config));
    setEditCribs(0);
    setSaveMsg('');
  }

  async function saveOverride(item: BiancheriaItem) {
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch('/api/admin/biancheria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId:    item.bookId,
          roomId:    item.roomId,
          bedStates: editStates,
          cribs:     editCribs,
        }),
      });
      if (!res.ok) { setSaveMsg('❌ Errore nel salvataggio'); return; }
      const data = await res.json();

      // Aggiorna la lista locale
      const updated = items.map(i =>
        i.bookId === item.bookId
          ? { ...i, bedStates: editStates, cribs: editCribs, linen: data.linen, source: 'admin' as const }
          : i,
      );
      setItems(updated);

      // Ricalcola totali
      const withConfig = updated.filter(i => i.hasConfig && i.linen);
      setTotals({
        lenzMatrimoniali: withConfig.reduce((s, i) => s + (i.linen?.lenzMatrimoniali ?? 0), 0),
        lenzSingoli:      withConfig.reduce((s, i) => s + (i.linen?.lenzSingoli      ?? 0), 0),
        federe:           withConfig.reduce((s, i) => s + (i.linen?.federe           ?? 0), 0),
        persone:          withConfig.reduce((s, i) => s + (i.linen?.persone          ?? 0), 0),
        culle:            withConfig.reduce((s, i) => s + (i.linen?.culle            ?? 0), 0),
      });

      setSaveMsg('✅ Configurazione salvata');
    } catch {
      setSaveMsg('❌ Errore di rete');
    } finally {
      setSaving(false);
    }
  }

  // ── Export XLSX ────────────────────────────────────────────────────────────

  async function exportXlsx() {
    const XLSX = await import('xlsx');

    const sourceLabel = (s: BiancheriaItem['source']) =>
      s === 'guest' ? 'ospite' : s === 'admin' ? 'admin' : 'auto';

    // Righe dati (dalla riga 4 in poi)
    const dataRows: BiancheriaItem[] = items.filter(i => i.hasConfig && i.linen);
    const firstDataRow = 4;
    const lastDataRow  = firstDataRow + dataRows.length - 1;

    // ── Struttura foglio ──────────────────────────────────────────────────────
    // Colonne: A=arrivo B=nr persone C=casa D=prenotazione nr
    //          E=lenz matrim F=lenz sing G=federe H=ascig viso
    //          I=ascig bidet J=telo spugna K=scendibagno L=note

    const wsData: (string | number | Date | null)[][] = [
      // Riga 1 — metadati
      ['importazione del', new Date()],
      // Riga 2 — maggiorazione (B2 = 0.1, usato dalle formule come $B$2)
      ['maggiorazione manuale del biancheria', 0.1],
      // Riga 3 — intestazioni
      [
        'arrivo', 'nr persone', 'casa', 'prenotazione nr',
        'lenzuolo matrimoniale', 'LENZUOLO SINGOLO', 'FEDERA SACCO cuscino',
        'ASCIUGAMANO VISO', 'ASCIUGAMANO BIDET SPUGNA', 'TELO SPUGNA', 'SCENDIBAGNO SPUGNA',
        'Note',
      ],
    ];

    // Righe prenotazioni
    for (const item of dataRows) {
      const { lenzMatrimoniali, lenzSingoli, federe, persone, culle } = item.linen!;
      const note = [
        sourceLabel(item.source),
        culle > 0 ? `${culle} culle` : null,
      ].filter(Boolean).join(' · ');

      wsData.push([
        item.arrival,
        item.numAdult + item.numChild,   // nr persone
        item.roomName,
        item.bookId,
        lenzMatrimoniali,
        lenzSingoli,
        federe,
        persone,  // asciugamano viso
        persone,  // asciugamano bidet spugna
        persone,  // telo spugna
        persone,  // scendibagno spugna
        note,
      ]);
    }

    // Righe senza config (solo informative, senza valori numerici)
    for (const item of items.filter(i => !i.hasConfig)) {
      wsData.push([item.arrival, item.numAdult + item.numChild, item.roomName, item.bookId,
        null, null, null, null, null, null, null, 'Config N/D']);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ── 3 righe riepilogo con formule ────────────────────────────────────────
    // TOTALE (riga dopo l'ultima data row)
    const totRow  = lastDataRow + 1;
    const maggRow = totRow + 1;
    const arroRow = maggRow + 1;

    const cols = ['E', 'F', 'G', 'H', 'I', 'J', 'K'];

    ws[`A${totRow}`]  = { v: 'TOTALE', t: 's' };
    ws[`D${maggRow}`] = { v: 'maggiorazione', t: 's' };
    ws[`D${arroRow}`] = { v: 'arrotondamento', t: 's' };

    for (const col of cols) {
      // TOTALE: =SUM(E4:Eultima)
      ws[`${col}${totRow}`]  = { f: `SUM(${col}${firstDataRow}:${col}${lastDataRow})`, t: 'n' };
      // maggiorazione: =(E_tot*$B$2)+E_tot
      ws[`${col}${maggRow}`] = { f: `(${col}${totRow}*$B$2)+${col}${totRow}`, t: 'n' };
      // arrotondamento al 5 più vicino: =ROUND(E_magg/5,0)*5
      ws[`${col}${arroRow}`] = { f: `ROUND(${col}${maggRow}/5,0)*5`, t: 'n' };
    }

    // Aggiorna range foglio
    ws['!ref'] = `A1:L${arroRow}`;

    // Larghezze colonne
    ws['!cols'] = [
      { wch: 12 }, // A arrivo
      { wch: 11 }, // B nr persone
      { wch: 16 }, // C casa
      { wch: 14 }, // D prenotazione nr
      { wch: 22 }, // E lenzuolo matrimoniale
      { wch: 18 }, // F lenzuolo singolo
      { wch: 22 }, // G federa sacco
      { wch: 20 }, // H asciugamano viso
      { wch: 24 }, // I asciugamano bidet
      { wch: 14 }, // J telo spugna
      { wch: 20 }, // K scendibagno
      { wch: 20 }, // L note
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Calcolo biancheria');
    XLSX.writeFile(wb, `biancheria_${from}_${to}.xlsx`);
  }

  // ── Render guards ──────────────────────────────────────────────────────────

  if (authed === null) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Caricamento…</div>;
  }
  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  // ── Raggruppa per data di arrivo ───────────────────────────────────────────

  const byDate: Record<string, BiancheriaItem[]> = {};
  for (const item of items) {
    if (!byDate[item.arrival]) byDate[item.arrival] = [];
    byDate[item.arrival].push(item);
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>🛏 Biancheria</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Calcolo per check-in nel periodo</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin" style={{ ...btnSec, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>← Admin</a>
          <button style={btnSec} onClick={load} disabled={loading}>↻ Aggiorna</button>
          <button
            style={{ ...btnG, opacity: items.length === 0 ? 0.4 : 1 }}
            onClick={exportXlsx}
            disabled={items.length === 0}
            title="Esporta lista biancheria in Excel">
            📥 XLSX
          </button>
          <button style={btnSec} onClick={logout}>Esci</button>
        </div>
      </div>

      {/* Filtro date */}
      <div style={{ ...card, marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <RangeCalendar from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <button
          style={{ ...btnBlue, opacity: loading ? 0.6 : 1, alignSelf: 'flex-start' }}
          onClick={load} disabled={loading}>
          {loading ? 'Caricamento…' : '🔍 Carica'}
        </button>
      </div>

      {/* Totali aggregati */}
      {totals && items.length > 0 && (
        <div style={{ ...card, background: '#f0f9ff', border: '0.5px solid #bae6fd', marginBottom: 20 }}>
          <p style={{
            margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#0369a1',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Totale — {items.filter(i => i.hasConfig).length} appartamenti
          </p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 15, fontWeight: 700, color: '#0c4a6e' }}>
            <span>🛏 {totals.lenzMatrimoniali} matrimoniali</span>
            <span>🛌 {totals.lenzSingoli} singoli</span>
            <span>🪶 {totals.federe} federe</span>
            <span>🧺 {totals.persone} asciugamani</span>
            {totals.culle > 0 && <span>🚼 {totals.culle} culle</span>}
          </div>
        </div>
      )}

      {/* Errore */}
      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</p>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && !error && (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>
            Nessun check-in nel periodo selezionato
          </p>
        </div>
      )}

      {/* Lista per data */}
      {Object.entries(byDate).map(([date, dayItems]) => (
        <div key={date}>

          {/* Separatore data */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 8px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
              📅 Check-in {fmtDate(date)}
            </span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          {dayItems.map(item => (
            <div key={item.bookId}>

              {/* Card prenotazione */}
              <div
                onClick={() => toggleExpand(item)}
                style={{
                  ...card,
                  cursor:     'pointer',
                  border:     expanded === item.bookId ? '1.5px solid #1E73BE' : '0.5px solid #e5e7eb',
                  background: expanded === item.bookId ? '#EEF5FC' : '#fff',
                  marginBottom: expanded === item.bookId ? 0 : 10,
                  borderBottomLeftRadius:  expanded === item.bookId ? 0 : 12,
                  borderBottomRightRadius: expanded === item.bookId ? 0 : 12,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{item.roomName}</span>
                      <SourceBadge source={item.source} />
                      {!item.hasConfig && (
                        <span style={{
                          fontSize: 11, background: '#fee2e2', color: '#7f1d1d',
                          padding: '2px 8px', borderRadius: 20,
                        }}>Config N/D</span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, color: '#6b7280' }}>
                      {item.guestName}
                      {' · '}{item.numAdult} adult{item.numAdult === 1 ? 'o' : 'i'}
                      {item.numChild > 0 ? ` + ${item.numChild} bambin${item.numChild === 1 ? 'o' : 'i'}` : ''}
                      {' · '}fino al {fmtDate(item.departure)}
                    </p>
                    {item.linen && <LinenSummary linen={item.linen} />}
                    {!item.hasConfig && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>
                        Appartamento senza configurazione letti
                      </p>
                    )}
                  </div>
                  {item.hasConfig && (
                    <span style={{
                      fontSize: 18, color: '#9ca3af',
                      transform: expanded === item.bookId ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      marginTop: 2,
                    }}>▾</span>
                  )}
                  {!item.hasConfig && (
                    <span style={{
                      fontSize: 18, color: '#d1d5db',
                      transform: expanded === item.bookId ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      marginTop: 2,
                    }}>▾</span>
                  )}
                </div>
              </div>

              {/* Pannello espanso — Config N/D */}
              {expanded === item.bookId && !item.config && (
                <div style={{
                  ...card,
                  background: '#fffbeb',
                  border: '0.5px solid #fde68a',
                  borderTop: 'none',
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  marginBottom: 10,
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                    ⚠️ Configurazione letti non disponibile
                  </p>
                  <p style={{ margin: '0 0 4px', fontSize: 13, color: '#78350f' }}>
                    Questo appartamento non è ancora censito in <code>lib/bedConfig.ts</code>. Il calcolo biancheria non è possibile.
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#a16207' }}>
                    Prenotazione #{item.bookId} · {item.numAdult} adult{item.numAdult === 1 ? 'o' : 'i'}
                    {item.numChild > 0 ? ` + ${item.numChild} bambin${item.numChild === 1 ? 'o' : 'i'}` : ''}
                    {' · '}{fmtDate(item.arrival)} → {fmtDate(item.departure)}
                  </p>
                </div>
              )}

              {/* Pannello configurazione espanso */}
              {expanded === item.bookId && item.config && (
                <div style={{
                  ...card,
                  background: '#f9fafb',
                  borderTop: 'none',
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  marginBottom: 10,
                }}>

                  {/* Stanze e letti */}
                  {item.config.rooms.map(room => (
                    <div key={room.id} style={{ marginBottom: 14 }}>
                      <p style={{
                        margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {room.label.it}
                      </p>
                      {room.beds.map(bed => (
                        <BedRow
                          key={bed.id}
                          bed={bed}
                          state={editStates[bed.id] ?? 'off'}
                          onChange={handleBedChange}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Culle */}
                  <div style={{ paddingTop: 10, borderTop: '0.5px solid #e5e7eb', marginBottom: 14 }}>
                    <p style={{
                      margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>🚼 Culle</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[0, 1, 2].map(n => {
                        const active = editCribs === n;
                        return (
                          <button
                            key={n}
                            onClick={() => { setEditCribs(n); setSaveMsg(''); }}
                            style={{
                              padding: '4px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
                              border:      active ? '1.5px solid #1E73BE' : '1px solid #d1d5db',
                              background:  active ? '#EEF5FC' : '#fff',
                              color:       active ? '#1E73BE' : '#6b7280',
                              fontWeight:  active ? 700 : 400,
                            }}>
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Azioni */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      style={{ ...btnG, opacity: saving ? 0.6 : 1 }}
                      onClick={() => saveOverride(item)}
                      disabled={saving}>
                      {saving ? 'Salvataggio…' : '💾 Salva configurazione'}
                    </button>
                    <button style={btnSec} onClick={() => resetToDefault(item)}>
                      ↺ Ripristina default
                    </button>
                    {saveMsg && (
                      <span style={{
                        fontSize: 13,
                        color: saveMsg.startsWith('✅') ? '#15803d' : '#dc2626',
                      }}>
                        {saveMsg}
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
