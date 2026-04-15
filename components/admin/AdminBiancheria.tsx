'use client';
import { useState, useEffect, useCallback } from 'react';
import type { ApartmentBedConfig, Bed, BedVariant } from '@/lib/bedConfig';
import { calcDefaultBedStates, calcLinenSetsFromBedStates } from '@/lib/bedConfig';

// ─── Tipi ─────────────────────────────────────────────────────────────────────

type BedState = 'off' | 'A' | 'B';

interface LinenResult {
  lenzMatrimoniali: number;
  lenzSingoli:      number;
  federe:           number;
  persone:          number;
  scendibagno?:     number;
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

// defaultBedStates → calcDefaultBedStates in lib/bedConfig.ts (guest-count aware)

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
      <div style={{ flex: 1, minWidth: 210 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(28px, 1fr))', marginBottom: 4 }}>
          {DAYS_IT.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#bbb', paddingBottom: 4 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(28px, 1fr))', gap: 2 }}>
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
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: isDesktop ? '20px 28px 24px' : '16px 12px 20px', background: '#fff', overflowX: 'auto' }}>
          {/* Hint fase */}
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9ca3af' }}>
            {phase === 'from' ? '📅 Seleziona la data di inizio' : '📅 Seleziona la data di fine'}
          </p>
          {/* Navigazione + mesi — struttura unica allineata */}
          {isDesktop ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <button onClick={() => { if (!isPrevDisabled) { const p = addMonths(viewYear, viewMonth, -1); setViewYear(p.year); setViewMonth(p.month); } }}
                  disabled={isPrevDisabled} style={navBtn(isPrevDisabled)}>‹</button>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#111' }}>
                  {MONTHS_IT[viewMonth]} {viewYear}
                </div>
                <div style={{ width: 1, background: 'transparent', flexShrink: 0, margin: '0 20px' }} />
                <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#111' }}>
                  {MONTHS_IT[second.month]} {second.year}
                </div>
                <button onClick={() => { const n = addMonths(viewYear, viewMonth, 1); setViewYear(n.year); setViewMonth(n.month); }}
                  style={navBtn(false)}>›</button>
              </div>
              <div style={{ display: 'flex', gap: 40 }}>
                {renderMonth(viewYear, viewMonth)}
                <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />
                {renderMonth(second.year, second.month)}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <button onClick={() => { if (!isPrevDisabled) { const p = addMonths(viewYear, viewMonth, -1); setViewYear(p.year); setViewMonth(p.month); } }}
                  disabled={isPrevDisabled} style={navBtn(isPrevDisabled)}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{MONTHS_IT[viewMonth]} {viewYear}</span>
                <button onClick={() => { const n = addMonths(viewYear, viewMonth, 1); setViewYear(n.year); setViewMonth(n.month); }}
                  style={navBtn(false)}>›</button>
              </div>
              {renderMonth(viewYear, viewMonth)}
            </>
          )}
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
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#374151', marginTop: 6 }}>
      <span title="Lenzuola matrimoniali">🛏 <b>{linen.lenzMatrimoniali}</b> lenz.matr</span>
      <span title="Lenzuola singole">🛌 <b>{linen.lenzSingoli}</b> lenz.sing</span>
      <span title="Federe sacco cuscino">🪶 <b>{linen.federe}</b> federe</span>
      <span title="Asciugamano viso">🧻 <b>{linen.persone}</b> viso</span>
      <span title="Asciugamano bidet">🧻 <b>{linen.persone}</b> bidet</span>
      <span title="Telo doccia">🚿 <b>{linen.persone}</b> telo doccia</span>
      <span title="Scendibagno spugna">🟫 <b>{linen.scendibagno ?? 1}</b> scendibagno</span>
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
// ─── Componenti visivi letti (stesso stile portale ospiti) ───────────────────

type IconVariant = 'singolo' | 'matrimoniale' | 'sommier_b' | 'impilabile_b' |
                   'poltrona_off' | 'poltrona_on' | 'castello' | 'divano' |
                   'estraibile' | 'pavimento';

function resolveIcon(bed: Bed, displayState: 'A' | 'B'): IconVariant {
  if (bed.iconStates) {
    const t = displayState === 'A' ? bed.iconStates.A : (bed.iconStates.B ?? bed.iconStates.A);
    return t === 'matrimoniale' ? 'matrimoniale' : 'singolo';
  }
  if (bed.variant === 'sommier')    return displayState === 'B' ? 'sommier_b'    : 'matrimoniale';
  if (bed.variant === 'impilabile') return displayState === 'B' ? 'impilabile_b' : 'singolo';
  if (bed.variant === 'poltrona')   return displayState === 'A' ? 'poltrona_on'  : 'poltrona_off';
  if (bed.variant === 'castello')   return 'castello';
  if (bed.variant === 'divano' || bed.baseType === 'divano') return 'divano';
  if (bed.variant === 'estraibile') return 'estraibile';
  if (bed.variant === 'pavimento')  return 'pavimento';
  if (bed.baseType === 'matrimoniale') return 'matrimoniale';
  return 'singolo';
}

function bedSlots(bed: Bed, state: BedState): number {
  if (state === 'off') return 0;
  if (state === 'B') {
    if (bed.variant === 'impilabile') return 2;
    if (bed.variant === 'sommier') return 2;
    return 0;
  }
  if (bed.variant === 'sommier') return bed.iconStates?.A === 'singolo' ? 1 : 2;
  if (bed.variant === 'impilabile') return 1;
  if (bed.variant === 'castello')   return 1;
  if (bed.variant === 'estraibile') return 1;
  if (bed.variant === 'poltrona')   return 1;
  if (bed.variant === 'pavimento')  return 1;
  if (bed.baseType === 'matrimoniale') return 2;
  if (bed.baseType === 'divano') return bed.defaultLinenType === 'matrimoniale' ? 2 : 1;
  return 1;
}

function bedChipLabel(bed: Bed, displayState: 'A' | 'B'): string {
  if (bed.configOptions) {
    const opt = displayState === 'A' ? bed.configOptions.closed : bed.configOptions.open;
    return opt.label.it;
  }
  if (bed.baseType === 'matrimoniale') return `Matrimoniale${bed.dimensions ? ` (${bed.dimensions})` : ''}`;
  if (bed.baseType === 'divano')       return 'Divano letto';
  return `Singolo${bed.dimensions ? ` (${bed.dimensions})` : ''}`;
}

function singleChipLabel(bed: Bed, state: BedState): string {
  if (bed.variant === 'standard' || bed.variant === 'castello') {
    if (bed.baseType === 'matrimoniale') return `Matrimoniale${bed.dimensions ? ` (${bed.dimensions})` : ''}`;
    return `Singolo${bed.dimensions ? ` (${bed.dimensions})` : ''}`;
  }
  if (bed.canConfigure && bed.configOptions) {
    return state === 'A' ? bed.configOptions.open.label.it : bed.configOptions.closed.label.it;
  }
  return bed.baseType;
}

function AdminBedIcon({ variant, active }: { variant: IconVariant; active: boolean }) {
  const fill   = active ? '#DBEAFE' : '#E5E7EB';
  const stroke = active ? '#1E73BE' : '#9CA3AF';
  const pil    = active ? '#93C5FD' : '#D1D5DB';

  if (variant === 'poltrona_off') return (
    <svg width="48" height="44" viewBox="0 0 48 44" fill="none">
      <rect x="2" y="16" width="44" height="26" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2"/>
      <rect x="2" y="2"  width="44" height="18" rx="3" fill={pil}  stroke={stroke} strokeWidth="1.2"/>
      <rect x="2" y="2"  width="9"  height="40" rx="3" fill={pil}  stroke={stroke} strokeWidth="1.2"/>
      <rect x="37" y="2" width="9"  height="40" rx="3" fill={pil}  stroke={stroke} strokeWidth="1.2"/>
    </svg>
  );
  if (variant === 'poltrona_on') return (
    <svg width="48" height="52" viewBox="0 0 48 52" fill="none">
      <rect x="2" y="22" width="44" height="28" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2"/>
      <rect x="3" y="2"  width="20" height="22" rx="2" fill={pil}/>
      <rect x="25" y="2" width="20" height="22" rx="2" fill={pil}/>
    </svg>
  );
  if (variant === 'castello') return (
    <svg width="48" height="58" viewBox="0 0 48 58" fill="none">
      <rect x="2" y="2"  width="38" height="26" rx="3" fill={fill}   stroke={stroke} strokeWidth="1.2"/>
      <rect x="3" y="4"  width="16" height="14" rx="2" fill={pil}/>
      <rect x="2" y="30" width="38" height="26" rx="3" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.2"/>
      <rect x="3" y="32" width="16" height="14" rx="2" fill="#D1D5DB"/>
      <line x1="40" y1="2"  x2="40" y2="56" stroke={stroke} strokeWidth="2.5"/>
      <line x1="46" y1="2"  x2="46" y2="56" stroke={stroke} strokeWidth="2.5"/>
      <line x1="40" y1="10" x2="46" y2="10" stroke={stroke} strokeWidth="2"/>
      <line x1="40" y1="20" x2="46" y2="20" stroke={stroke} strokeWidth="2"/>
      <line x1="40" y1="38" x2="46" y2="38" stroke={stroke} strokeWidth="2"/>
      <line x1="40" y1="50" x2="46" y2="50" stroke={stroke} strokeWidth="2"/>
    </svg>
  );
  if (variant === 'divano') return (
    <svg width="86" height="44" viewBox="0 0 86 44" fill="none">
      <rect x="2" y="14" width="82" height="28" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2"/>
      <rect x="2" y="2"  width="82" height="18" rx="3" fill={pil}  stroke={stroke} strokeWidth="1.2"/>
    </svg>
  );
  if (variant === 'sommier_b' || variant === 'impilabile_b') return (
    <svg width="86" height="52" viewBox="0 0 86 52" fill="none">
      <rect x="2"  y="22" width="38" height="28" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2"/>
      <rect x="3"  y="2"  width="16" height="22" rx="2" fill={pil}/>
      <rect x="46" y="22" width="38" height="28" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2"/>
      <rect x="47" y="2"  width="16" height="22" rx="2" fill={pil}/>
    </svg>
  );
  if (variant === 'matrimoniale') return (
    <svg width="86" height="52" viewBox="0 0 86 52" fill="none">
      <rect x="2" y="22" width="82" height="28" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2"/>
      <rect x="3" y="2"  width="36" height="22" rx="2" fill={pil}/>
      <rect x="47" y="2" width="36" height="22" rx="2" fill={pil}/>
    </svg>
  );
  return (
    <svg width="48" height="52" viewBox="0 0 48 52" fill="none">
      <rect x="2" y="22" width="44" height="28" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2"/>
      <rect x="3" y="2"  width="42" height="22" rx="2" fill={pil}/>
    </svg>
  );
}

function AdminBedChip({ bed, displayState, isActive, label, slots, onClick, disabled }: {
  bed: Bed; displayState: 'A' | 'B'; isActive: boolean;
  label: string; slots: number;
  onClick?: () => void; disabled?: boolean;
}) {
  const icon = resolveIcon(bed, displayState);
  const isWide = ['matrimoniale', 'sommier_b', 'impilabile_b', 'divano'].includes(icon);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '10px 8px', minWidth: 88,
        border: isActive ? '2px solid #1E73BE' : '1px solid #e5e7eb',
        borderRadius: 12,
        background: isActive ? '#DBEAFE' : disabled ? '#f9fafb' : '#fff',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all .15s',
        flex: isWide ? 1 : 'none',
        position: 'relative',
      }}
    >
      <AdminBedIcon variant={icon} active={isActive} />
      <span style={{
        fontSize: '0.72rem', fontWeight: isActive ? 700 : 400,
        color: isActive ? '#1E73BE' : '#888888',
        textAlign: 'center', lineHeight: 1.3, maxWidth: 100,
      }}>
        {label}
      </span>
      {isActive && slots > 0 && (
        <span style={{
          fontSize: '0.65rem', color: '#1E73BE',
          background: '#fff', border: '1px solid #93C5FD',
          borderRadius: 10, padding: '1px 6px',
        }}>
          {slots === 1 ? '1p' : `${slots}p`}
        </span>
      )}
      {disabled && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          fontSize: 10, background: '#f3f4f6', color: '#6b7280',
          padding: '1px 5px', borderRadius: 4,
        }}>fisso</span>
      )}
    </button>
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

  // Magazzino — valori manuali prima dell'export, reset ad ogni caricamento pagina
  const ARTICOLI = ['lenzMatrimoniali', 'lenzSingoli', 'federe', 'viso', 'bidet', 'telodoccia', 'scendibagno'] as const;
  type ArticoloKey = typeof ARTICOLI[number];
  const ARTICOLI_LABEL: Record<ArticoloKey, string> = {
    lenzMatrimoniali: 'Lenzuolo matrimoniale',
    lenzSingoli:      'Lenzuolo singolo',
    federe:           'Federa sacco cuscino',
    viso:             'Asciugamano viso',
    bidet:            'Asciugamano bidet',
    telodoccia:       'Telo doccia',
    scendibagno:      'Scendibagno spugna',
  };
  const [magazzino, setMagazzino] = useState<Record<ArticoloKey, number>>({
    lenzMatrimoniali: 0, lenzSingoli: 0, federe: 0,
    viso: 0, bidet: 0, telodoccia: 0, scendibagno: 0,
  });

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
    setEditStates(calcDefaultBedStates(item.config, item.numAdult + item.numChild));
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
          numGuests: item.numAdult + item.numChild,
          bedStates: editStates,
          cribs:     editCribs,
        }),
      });
      if (!res.ok) { setSaveMsg('❌ Errore nel salvataggio'); return; }
      const data = await res.json();

      // Correggi persone (asciugamani) = ospiti reali, non posti letto
      const correctedLinen = data.linen
        ? { ...data.linen, persone: item.numAdult + item.numChild }
        : null;

      // Aggiorna la lista locale
      const updated = items.map(i =>
        i.bookId === item.bookId
          ? { ...i, bedStates: editStates, cribs: editCribs, linen: correctedLinen, source: 'admin' as const }
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

    const dataRows: BiancheriaItem[] = items.filter(i => i.hasConfig && i.linen);
    const firstDataRow = 4;
    const lastDataRow  = firstDataRow + dataRows.length - 1;

    // Colonne: A=arrivo B=nr persone C=casa D=prenotazione nr
    //          E=lenz matrim F=lenz sing G=federe H=ascig viso
    //          I=ascig bidet J=telo doccia K=scendibagno L=note

    const wsData: (string | number | Date | null)[][] = [
      ['importazione del', new Date()],
      ['maggiorazione manuale del biancheria', 0.2],
      [
        'arrivo', 'nr persone', 'casa', 'prenotazione nr',
        'lenzuolo matrimoniale', 'LENZUOLO SINGOLO', 'FEDERA SACCO cuscino',
        'ASCIUGAMANO VISO', 'ASCIUGAMANO BIDET SPUGNA', 'TELO DOCCIA', 'SCENDIBAGNO SPUGNA',
        'Note',
      ],
    ];

    for (const item of dataRows) {
      const { lenzMatrimoniali, lenzSingoli, federe, persone, culle, scendibagno } = item.linen!;
      const note = [
        sourceLabel(item.source),
        culle > 0 ? `${culle} culle` : null,
      ].filter(Boolean).join(' · ');
      wsData.push([
        item.arrival, item.numAdult + item.numChild, item.roomName, item.bookId,
        lenzMatrimoniali, lenzSingoli, federe,
        persone, persone, persone,
        scendibagno ?? 1,
        note,
      ]);
    }

    for (const item of items.filter(i => !i.hasConfig)) {
      wsData.push([item.arrival, item.numAdult + item.numChild, item.roomName, item.bookId,
        null, null, null, null, null, null, null, 'Config N/D']);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ── Riga TOTALE ──────────────────────────────────────────────────────────
    const totRow = lastDataRow + 1;
    const cols   = ['E', 'F', 'G', 'H', 'I', 'J', 'K'];

    ws[`A${totRow}`] = { v: 'TOTALE', t: 's' };
    for (const col of cols) {
      ws[`${col}${totRow}`] = { f: `SUM(${col}${firstDataRow}:${col}${lastDataRow})`, t: 'n' };
    }

    // ── Sezione 2 — Magazzino e ordine ───────────────────────────────────────
    // Intestazioni (2 righe di spazio)
    const hdrRow = totRow + 3;
    ws[`D${hdrRow}`] = { v: 'articolo',           t: 's' };
    ws[`E${hdrRow}`] = { v: 'tot necessario',      t: 's' };
    ws[`F${hdrRow}`] = { v: 'magazzino',           t: 's' };
    ws[`G${hdrRow}`] = { v: 'subtotale',           t: 's' };
    ws[`H${hdrRow}`] = { v: 'maggiorazione',       t: 's' };
    ws[`I${hdrRow}`] = { v: 'arrotonda e ordina',  t: 's' };

    // Mappa colonne totale → chiave magazzino
    const colMap: Array<{ col: string; label: string; key: ArticoloKey }> = [
      { col: 'E', label: 'lenzuolo matrimoniale',    key: 'lenzMatrimoniali' },
      { col: 'F', label: 'LENZUOLO SINGOLO',         key: 'lenzSingoli'      },
      { col: 'G', label: 'FEDERA SACCO cuscino',     key: 'federe'           },
      { col: 'H', label: 'ASCIUGAMANO VISO',         key: 'viso'             },
      { col: 'I', label: 'ASCIUGAMANO BIDET SPUGNA', key: 'bidet'            },
      { col: 'J', label: 'TELO DOCCIA',              key: 'telodoccia'       },
      { col: 'K', label: 'SCENDIBAGNO SPUGNA',       key: 'scendibagno'      },
    ];

    colMap.forEach(({ col, label, key }, idx) => {
      const r = hdrRow + 1 + idx;
      ws[`D${r}`] = { v: label,                             t: 's' };
      ws[`E${r}`] = { f: `${col}${totRow}`,                t: 'n' };
      ws[`F${r}`] = { v: magazzino[key],                   t: 'n' };
      ws[`G${r}`] = { f: `E${r}-F${r}`,                   t: 'n' };
      ws[`H${r}`] = { f: `(G${r}*$B$2)+G${r}`,            t: 'n' };
      ws[`I${r}`] = { f: `ROUND(H${r}/5,0)*5`,            t: 'n' };
    });

    const lastSecRow = hdrRow + colMap.length;
    ws['!ref'] = `A1:L${lastSecRow}`;

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
            <span>🛏 {totals.lenzMatrimoniali} lenz.matr</span>
            <span>🛌 {totals.lenzSingoli} lenz.sing</span>
            <span>🪶 {totals.federe} federe</span>
            <span>🧻 {totals.persone} viso</span>
            <span>🧻 {totals.persone} bidet</span>
            <span>🚿 {totals.persone} telo doccia</span>
            {totals.culle > 0 && <span>🚼 {totals.culle} culle</span>}
          </div>
        </div>
      )}

      {/* Magazzino — input prima dell'export */}
      {items.length > 0 && (
        <div style={{ ...card, marginBottom: 20 }}>
          <p style={{
            margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#374151',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            🏪 Magazzino disponibile
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {ARTICOLI.map(key => (
              <label key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 8, fontSize: 13, color: '#374151',
                background: '#f9fafb', borderRadius: 8, padding: '6px 10px',
              }}>
                <span>{ARTICOLI_LABEL[key]}</span>
                <input
                  type="number" min={0} value={magazzino[key]}
                  onChange={e => setMagazzino(prev => ({ ...prev, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                  style={{
                    width: 60, padding: '4px 6px', fontSize: 13, textAlign: 'right',
                    border: '1px solid #d1d5db', borderRadius: 6,
                  }}
                />
              </label>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
            I valori vengono sottratti dal totale nell'export XLSX. Si azzerano ad ogni ricaricamento della pagina.
          </p>
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
                    {item.linen && <LinenSummary linen={
                      // Quando il pannello è aperto: ricalcola in tempo reale da editStates
                      // Quando è chiuso: usa il linen salvato dall'API
                      expanded === item.bookId && item.config
                        ? {
                            ...calcLinenSetsFromBedStates(item.roomId, editStates, editCribs),
                            persone: item.numAdult + item.numChild,
                          }
                        : item.linen
                    } />}
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

                  {/* Stanze — box orizzontali scrollabili */}
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    overflowX: 'auto',
                    paddingBottom: 8,
                    marginBottom: 12,
                    scrollbarWidth: 'thin',
                  }}>
                    {item.config.rooms.map((room: any) => {
                      let matrim = 0, singoli = 0, federe = 0;
                      for (const bed of room.beds) {
                        const state = editStates[bed.id] ?? 'off';
                        if (state === 'off') continue;
                        const eff = (bed.variant === 'impilabile' && state === 'B') ? 'A' : state;
                        if (bed.variant === 'sommier' && eff === 'B') { singoli += 4; federe += 2; }
                        else if (bed.variant === 'sommier' && eff === 'A' && bed.iconStates?.A === 'singolo') { singoli += 2; federe += 1; }
                        else if (bed.baseType === 'matrimoniale' || (bed.variant === 'divano' && bed.defaultLinenType === 'matrimoniale') || (bed.variant === 'sommier' && eff === 'A')) { matrim += 2; federe += 2; }
                        else { singoli += 2; federe += 1; }
                      }
                      const hasLinen = matrim > 0 || singoli > 0;
                      return (
                        <div key={room.id} style={{
                          minWidth: 160, maxWidth: 220, flexShrink: 0,
                          background: '#fff', borderRadius: 10,
                          border: '0.5px solid #e5e7eb',
                          padding: '10px 12px',
                          display: 'flex', flexDirection: 'column', gap: 6,
                        }}>
                          <p style={{
                            margin: 0, fontSize: 10, fontWeight: 700, color: '#6b7280',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>{room.label.it}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {room.beds.map((bed: Bed) => {
                              const state = editStates[bed.id] ?? 'off';
                              const isFixed = bed.variant === 'standard' || bed.variant === 'castello';
                              const isTwoChips = bed.variant === 'sommier' || bed.variant === 'impilabile';
                              if (isTwoChips) return (
                                <div key={bed.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {(['A', 'B'] as const).map(ds => (
                                    <AdminBedChip key={ds} bed={bed} displayState={ds}
                                      isActive={state === ds} label={bedChipLabel(bed, ds)}
                                      slots={bedSlots(bed, ds)} onClick={() => handleBedChange(bed.id, ds)} />
                                  ))}
                                </div>
                              );
                              if (isFixed) return (
                                <AdminBedChip key={bed.id} bed={bed} displayState="A"
                                  isActive={true} label={singleChipLabel(bed, 'A')}
                                  slots={bedSlots(bed, 'A')} disabled={true} />
                              );
                              const isOn = state === 'A';
                              return (
                                <AdminBedChip key={bed.id} bed={bed} displayState="A"
                                  isActive={isOn} label={singleChipLabel(bed, state)}
                                  slots={bedSlots(bed, 'A')}
                                  onClick={() => handleBedChange(bed.id, isOn ? 'off' : 'A')} />
                              );
                            })}
                          </div>
                          {hasLinen && (
                            <div style={{
                              marginTop: 4, paddingTop: 6,
                              borderTop: '0.5px solid #e5e7eb',
                              fontSize: 11, color: '#374151',
                              display: 'flex', flexDirection: 'column', gap: 2,
                            }}>
                              {matrim > 0 && <span>🛏 {matrim/2} matr · 🪶 {federe} federe</span>}
                              {singoli > 0 && <span>🛌 {singoli/2} sing</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

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
