'use client';
import { useState, useEffect, useCallback } from 'react';
import type { ApartmentBedConfig, Bed } from '@/lib/bedConfig';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function parseYMD(ymd: string): Date { const [y,m,d] = ymd.split('-').map(Number); return new Date(y, m-1, d); }
function addDays(ymd: string, n: number): string { const d = parseYMD(ymd); d.setDate(d.getDate()+n); return toYMD(d.getFullYear(), d.getMonth(), d.getDate()); }
function addMonths(year: number, month: number, delta: number) {
  const m = month + delta;
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
      setOpen(false);
    }
  }

  const rangeEnd = phase === 'to' ? (hover ?? to) : to;

  function renderMonth(year: number, month: number) {
    const cells = buildCells(year, month);
    return (
      <div style={{ flex: 1, minWidth: 210 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(28px, 1fr))', marginBottom: 4 }}>
          {DAYS_IT.map(d => (
            <div key={d} className="text-center small fw-semibold text-muted pb-1">{d}</div>
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

  const navBtnClass = (disabled: boolean) =>
    `btn btn-link p-0 px-2 fs-4 fw-light ${disabled ? 'text-muted' : 'text-dark'}`;

  return (
    <div>
      {/* Pill trigger */}
      <button
        onClick={() => { setOpen(o => !o); setPhase('from'); }}
        className={`btn d-inline-flex align-items-center gap-2 ${open ? 'border-primary' : 'border'}`}
        style={{
          background: open ? '#EEF5FC' : '#fff',
          marginBottom: open ? 12 : 0,
        }}
      >
        <i className="bi bi-calendar-event"></i>
        <span>
          <span className="fw-bold text-primary">{fmtPill(from)}</span>
          <span className="text-muted mx-2">→</span>
          <span className="fw-bold text-primary">{fmtPill(to)}</span>
        </span>
        <span
          className="small text-muted ms-1"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >▼</span>
      </button>

      {/* Calendario */}
      {open && (
        <div
          className="border rounded-4 bg-white"
          style={{ padding: isDesktop ? '20px 28px 24px' : '16px 12px 20px', overflowX: 'auto' }}
        >
          <p className="small text-muted mb-2">
            {phase === 'from' ? (
              <><i className="bi bi-calendar-event me-1"></i> Seleziona la data di inizio</>
            ) : (
              <><i className="bi bi-calendar-event me-1"></i> Seleziona la data di fine</>
            )}
          </p>
          {isDesktop ? (
            <>
              <div className="d-flex align-items-center mb-3">
                <button onClick={() => { if (!isPrevDisabled) { const p = addMonths(viewYear, viewMonth, -1); setViewYear(p.year); setViewMonth(p.month); } }}
                  disabled={isPrevDisabled} className={navBtnClass(isPrevDisabled)}>‹</button>
                <div className="flex-fill text-center fw-bold">
                  {MONTHS_IT[viewMonth]} {viewYear}
                </div>
                <div style={{ width: 1, flexShrink: 0, margin: '0 20px' }} />
                <div className="flex-fill text-center fw-bold">
                  {MONTHS_IT[second.month]} {second.year}
                </div>
                <button onClick={() => { const n = addMonths(viewYear, viewMonth, 1); setViewYear(n.year); setViewMonth(n.month); }}
                  className={navBtnClass(false)}>›</button>
              </div>
              <div className="d-flex" style={{ gap: 40 }}>
                {renderMonth(viewYear, viewMonth)}
                <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />
                {renderMonth(second.year, second.month)}
              </div>
            </>
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <button onClick={() => { if (!isPrevDisabled) { const p = addMonths(viewYear, viewMonth, -1); setViewYear(p.year); setViewMonth(p.month); } }}
                  disabled={isPrevDisabled} className={navBtnClass(isPrevDisabled)}>‹</button>
                <span className="fw-bold">{MONTHS_IT[viewMonth]} {viewYear}</span>
                <button onClick={() => { const n = addMonths(viewYear, viewMonth, 1); setViewYear(n.year); setViewMonth(n.month); }}
                  className={navBtnClass(false)}>›</button>
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
    guest:   { cls: 'bg-success-subtle text-success-emphasis',   label: '👤 Ospite' },
    admin:   { cls: 'bg-primary-subtle text-primary-emphasis',   label: '👑 Admin'  },
    default: { cls: 'bg-warning-subtle text-warning-emphasis',   label: '⚙️ Auto'  },
  };
  const s = map[source];
  return (
    <span className={`badge rounded-pill ${s.cls}`}>
      {s.label}
    </span>
  );
}

function LinenSummary({ linen }: { linen: LinenResult }) {
  const items = [
    { icon: '🛏', val: linen.lenzMatrimoniali, label: 'lenz.matr', title: 'Lenzuola matrimoniali' },
    { icon: '🛌', val: linen.lenzSingoli,      label: 'lenz.sing', title: 'Lenzuola singole' },
    { icon: '🪶', val: linen.federe,           label: 'federe',    title: 'Federe sacco cuscino' },
    { icon: '🧻', val: linen.persone,          label: 'viso',      title: 'Asciugamano viso' },
    { icon: '🧻', val: linen.persone,          label: 'bidet',     title: 'Asciugamano bidet' },
    { icon: '🚿', val: linen.persone,          label: 'telo doc.', title: 'Telo doccia' },
    { icon: '🟫', val: linen.scendibagno ?? 1, label: 'scendib.',  title: 'Scendibagno spugna' },
  ];
  return (
    <div className="d-flex gap-2 flex-wrap mt-2">
      {items.map((item, i) => (
        <span
          key={i}
          title={item.title}
          className="d-inline-flex align-items-center gap-1 bg-light rounded px-2 py-1 small"
        >
          <span>{item.icon}</span>
          <b>{item.val}</b>
          <span className="text-muted">{item.label}</span>
        </span>
      ))}
      {linen.culle > 0 && (
        <span className="d-inline-flex align-items-center gap-1 bg-light rounded px-2 py-1 small">
          🚼 <b>{linen.culle}</b> <span className="text-muted">culle</span>
        </span>
      )}
    </div>
  );
}

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
      className="btn d-flex flex-column align-items-center gap-1 p-2"
      style={{
        minWidth: 88,
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
      <span
        className={`text-center ${isActive ? 'fw-bold text-primary' : 'text-muted'}`}
        style={{ fontSize: '0.72rem', lineHeight: 1.3, maxWidth: 100 }}
      >
        {label}
      </span>
      {isActive && slots > 0 && (
        <span
          className="text-primary bg-white border border-primary-subtle rounded-pill px-2"
          style={{ fontSize: '0.65rem' }}
        >
          {slots === 1 ? '1p' : `${slots}p`}
        </span>
      )}
      {disabled && (
        <span
          className="position-absolute top-0 end-0 bg-light text-muted rounded px-1 m-1"
          style={{ fontSize: 10 }}
        >fisso</span>
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
    <div className="container" style={{ maxWidth: 360 }}>
      <div className="card shadow-sm mt-5">
        <div className="card-body p-4">
          <p className="fs-4 fw-bold mb-1"><i className="bi bi-lock-fill me-1"></i> Admin</p>
          <p className="text-muted small mb-3">Biancheria — LivingApple</p>
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

  function toggleExpand(item: BiancheriaItem) {
    if (expanded === item.bookId) {
      setExpanded(null);
      return;
    }
    setExpanded(item.bookId);
    setSaveMsg('');
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

      const correctedLinen = data.linen
        ? { ...data.linen, persone: item.numAdult + item.numChild }
        : null;

      const updated = items.map(i =>
        i.bookId === item.bookId
          ? { ...i, bedStates: editStates, cribs: editCribs, linen: correctedLinen, source: 'admin' as const }
          : i,
      );
      setItems(updated);

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

  async function exportXlsx() {
    const XLSX = await import('xlsx');

    const sourceLabel = (s: BiancheriaItem['source']) =>
      s === 'guest' ? 'ospite' : s === 'admin' ? 'admin' : 'auto';

    const dataRows: BiancheriaItem[] = items.filter(i => i.hasConfig && i.linen);
    const firstDataRow = 4;
    const lastDataRow  = firstDataRow + dataRows.length - 1;

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

    const totRow = lastDataRow + 1;
    const cols   = ['E', 'F', 'G', 'H', 'I', 'J', 'K'];

    ws[`A${totRow}`] = { v: 'TOTALE', t: 's' };
    for (const col of cols) {
      ws[`${col}${totRow}`] = { f: `SUM(${col}${firstDataRow}:${col}${lastDataRow})`, t: 'n' };
    }

    const hdrRow = totRow + 3;
    ws[`D${hdrRow}`] = { v: 'articolo',           t: 's' };
    ws[`E${hdrRow}`] = { v: 'tot necessario',      t: 's' };
    ws[`F${hdrRow}`] = { v: 'magazzino',           t: 's' };
    ws[`G${hdrRow}`] = { v: 'subtotale',           t: 's' };
    ws[`H${hdrRow}`] = { v: 'maggiorazione',       t: 's' };
    ws[`I${hdrRow}`] = { v: 'arrotonda e ordina',  t: 's' };

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
      { wch: 12 }, { wch: 11 }, { wch: 16 }, { wch: 14 },
      { wch: 22 }, { wch: 18 }, { wch: 22 },
      { wch: 20 }, { wch: 24 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Calcolo biancheria');
    XLSX.writeFile(wb, `biancheria_${from}_${to}.xlsx`);
  }

  if (authed === null) {
    return <div className="text-center text-muted py-5">Caricamento…</div>;
  }
  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  const byDate: Record<string, BiancheriaItem[]> = {};
  for (const item of items) {
    if (!byDate[item.arrival]) byDate[item.arrival] = [];
    byDate[item.arrival].push(item);
  }

  return (
    <div className="container py-4 pb-5" style={{ maxWidth: 1400 }}>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 fw-bold mb-0"><i className="bi bi-moon-stars-fill me-1"></i> Biancheria</h1>
          <p className="small text-muted mb-0">Calcolo per check-in nel periodo</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>↻ Aggiorna</button>
          <button
            className="btn btn-success btn-sm fw-bold"
            onClick={exportXlsx}
            disabled={items.length === 0}
            title="Esporta lista biancheria in Excel">
            📥 XLSX
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      {/* Filtro date */}
      <div className="card mb-3">
        <div className="card-body p-3 d-flex align-items-start justify-content-between gap-3 flex-wrap">
          <RangeCalendar from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
          <button
            className="btn btn-primary align-self-start"
            onClick={load} disabled={loading}>
            {loading ? 'Caricamento…' : <><i className="bi bi-search me-1"></i> Carica</>}
          </button>
        </div>
      </div>

      {/* Totali aggregati */}
      {totals && items.length > 0 && (
        <div className="card mb-3" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div className="card-body p-3">
            <p className="small fw-bold text-uppercase mb-2" style={{ color: '#0369a1', letterSpacing: '0.06em' }}>
              Totale — {items.filter(i => i.hasConfig).length} appartamenti
            </p>
            <div className="d-flex gap-4 flex-wrap fw-bold" style={{ color: '#0c4a6e' }}>
              <span>🛏 {totals.lenzMatrimoniali} lenz.matr</span>
              <span>🛌 {totals.lenzSingoli} lenz.sing</span>
              <span>🪶 {totals.federe} federe</span>
              <span>🧻 {totals.persone} viso</span>
              <span>🧻 {totals.persone} bidet</span>
              <span>🚿 {totals.persone} telo doccia</span>
              {totals.culle > 0 && <span>🚼 {totals.culle} culle</span>}
            </div>
          </div>
        </div>
      )}

      {/* Magazzino */}
      {items.length > 0 && (
        <div className="card mb-3">
          <div className="card-body p-3">
            <p className="small fw-bold text-uppercase text-secondary mb-3" style={{ letterSpacing: '0.06em' }}>
              🏪 Magazzino disponibile
            </p>
            <div
              className="d-grid gap-2"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
            >
              {ARTICOLI.map(key => (
                <label
                  key={key}
                  className="d-flex align-items-center justify-content-between gap-2 bg-light rounded px-2 py-1 small text-secondary"
                >
                  <span>{ARTICOLI_LABEL[key]}</span>
                  <input
                    type="number"
                    min={0}
                    value={magazzino[key]}
                    onChange={e => setMagazzino(prev => ({ ...prev, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="form-control form-control-sm text-end"
                    style={{ width: 60 }}
                  />
                </label>
              ))}
            </div>
            <p className="small text-muted fst-italic mt-2 mb-0">
              I valori vengono sottratti dal totale nell'export XLSX. Si azzerano ad ogni ricaricamento della pagina.
            </p>
          </div>
        </div>
      )}

      {/* Errore */}
      {error && (
        <p className="small text-danger mb-2">{error}</p>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && !error && (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-0">Nessun check-in nel periodo selezionato</p>
          </div>
        </div>
      )}

      {/* Lista per data */}
      {Object.entries(byDate).map(([date, dayItems]) => (
        <div key={date}>

          {/* Separatore data */}
          <div className="d-flex align-items-center gap-2 mt-4 mb-2">
            <span className="small fw-bold text-secondary text-nowrap">
              📅 Check-in {fmtDate(date)}
            </span>
            <div className="flex-fill border-top" />
          </div>

          {dayItems.map(item => (
            <div key={item.bookId}>

              {/* Card prenotazione */}
              <div
                onClick={() => toggleExpand(item)}
                className="card shadow-sm"
                style={{
                  cursor:     'pointer',
                  border:     expanded === item.bookId ? '1.5px solid #1E73BE' : '0.5px solid #e5e7eb',
                  background: expanded === item.bookId ? '#EEF5FC' : '#fff',
                  marginBottom: expanded === item.bookId ? 0 : 10,
                  borderBottomLeftRadius:  expanded === item.bookId ? 0 : undefined,
                  borderBottomRightRadius: expanded === item.bookId ? 0 : undefined,
                }}
              >
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="flex-fill">
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="fs-6 fw-bold">{item.roomName}</span>
                        <SourceBadge source={item.source} />
                        {!item.hasConfig && (
                          <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">Config N/D</span>
                        )}
                      </div>
                      <p className="small text-muted mb-1">
                        {item.guestName}
                        {' · '}{item.numAdult} adult{item.numAdult === 1 ? 'o' : 'i'}
                        {item.numChild > 0 ? ` + ${item.numChild} bambin${item.numChild === 1 ? 'o' : 'i'}` : ''}
                        {' · '}fino al {fmtDate(item.departure)}
                      </p>
                      {item.linen && <LinenSummary linen={
                        expanded === item.bookId && item.config
                          ? {
                              ...calcLinenSetsFromBedStates(item.roomId, editStates, editCribs),
                              persone: item.numAdult + item.numChild,
                            }
                          : item.linen
                      } />}
                      {!item.hasConfig && (
                        <p className="small text-muted mb-0 mt-1">
                          Appartamento senza configurazione letti
                        </p>
                      )}
                    </div>
                    <span
                      className={item.hasConfig ? 'text-muted' : 'text-light'}
                      style={{
                        fontSize: 18,
                        transform: expanded === item.bookId ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    >▾</span>
                  </div>
                </div>
              </div>

              {/* Pannello espanso — Config N/D */}
              {expanded === item.bookId && !item.config && (
                <div
                  className="card mb-2"
                  style={{
                    background: '#fffbeb',
                    borderColor: '#fde68a',
                    borderTop: 'none',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  }}
                >
                  <div className="card-body p-3">
                    <p className="fw-semibold mb-1" style={{ color: '#92400e' }}>
                      ⚠️ Configurazione letti non disponibile
                    </p>
                    <p className="small mb-1" style={{ color: '#78350f' }}>
                      Questo appartamento non è ancora censito in <code>lib/bedConfig.ts</code>. Il calcolo biancheria non è possibile.
                    </p>
                    <p className="small mt-2 mb-0" style={{ color: '#a16207' }}>
                      Prenotazione #{item.bookId} · {item.numAdult} adult{item.numAdult === 1 ? 'o' : 'i'}
                      {item.numChild > 0 ? ` + ${item.numChild} bambin${item.numChild === 1 ? 'o' : 'i'}` : ''}
                      {' · '}{fmtDate(item.arrival)} → {fmtDate(item.departure)}
                    </p>
                  </div>
                </div>
              )}

              {/* Pannello configurazione espanso */}
              {expanded === item.bookId && item.config && (
                <div
                  className="card mb-2"
                  style={{
                    background: '#f9fafb',
                    borderTop: 'none',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  }}
                >
                  <div className="card-body p-3">

                    {/* Stanze — box orizzontali scrollabili */}
                    <div
                      className="d-flex gap-2 pb-2 mb-3"
                      style={{ overflowX: 'auto', scrollbarWidth: 'thin' }}
                    >
                      {item.config.rooms.map((room: any) => {
                        let matrim = 0, singoli = 0, federe = 0;
                        for (const bed of room.beds) {
                          const isFixed = bed.variant === 'standard' || bed.variant === 'castello';
                          const state = editStates[bed.id] ?? (isFixed ? 'A' : 'off');
                          if (state === 'off') continue;
                          const eff = (bed.variant === 'impilabile' && state === 'B') ? 'A' : state;
                          if (bed.variant === 'sommier' && eff === 'B') { singoli += 4; federe += 2; }
                          else if (bed.variant === 'sommier' && eff === 'A' && bed.iconStates?.A === 'singolo') { singoli += 2; federe += 1; }
                          else if (bed.baseType === 'matrimoniale' || (bed.variant === 'divano' && bed.defaultLinenType === 'matrimoniale') || (bed.variant === 'sommier' && eff === 'A')) { matrim += 2; federe += 2; }
                          else { singoli += 2; federe += 1; }
                        }
                        const hasLinen = matrim > 0 || singoli > 0;
                        return (
                          <div
                            key={room.id}
                            className="bg-white rounded-3 border p-2 d-flex flex-column gap-2 flex-shrink-0"
                            style={{ minWidth: 160, maxWidth: 220 }}
                          >
                            <p className="small fw-bold text-uppercase text-secondary mb-0" style={{ letterSpacing: '0.06em' }}>
                              {room.label.it}
                            </p>
                            <div className="d-flex flex-column gap-2">
                              {room.beds.map((bed: Bed) => {
                                const state = editStates[bed.id] ?? 'off';
                                const isFixed = bed.variant === 'standard' || bed.variant === 'castello';
                                const isTwoChips = bed.variant === 'sommier' || bed.variant === 'impilabile';

                                const bedLinenLabel = (st: 'A' | 'B' | 'off'): string => {
                                  if (st === 'off') return '';
                                  if (bed.variant === 'impilabile' && st === 'B') return '4 lenz. sing · 2 federe';
                                  const eff = st;
                                  if (bed.variant === 'sommier' && eff === 'B') return '4 lenz. sing · 2 federe';
                                  if (bed.variant === 'sommier' && eff === 'A' && bed.iconStates?.A === 'singolo') return '2 lenz. sing · 1 federa';
                                  if (bed.variant === 'pavimento') return '4 lenz. sing · 2 federe';
                                  if (bed.baseType === 'matrimoniale' || (bed.variant === 'divano' && bed.defaultLinenType === 'matrimoniale') || (bed.variant === 'sommier' && eff === 'A')) return '2 lenz. matrim · 2 federe';
                                  return '2 lenz. sing · 1 federa';
                                };

                                if (isTwoChips) {
                                  return (
                                    <div key={bed.id} className="d-flex flex-column gap-1">
                                      {(['A', 'B'] as const).map(ds => {
                                        const active = state === ds;
                                        const ll = active ? bedLinenLabel(ds) : '';
                                        return (
                                          <div key={ds}>
                                            <AdminBedChip bed={bed} displayState={ds}
                                              isActive={active} label={bedChipLabel(bed, ds)}
                                              slots={bedSlots(bed, ds)}
                                              onClick={() => handleBedChange(bed.id, state === ds ? 'off' : ds)} />
                                            {ll && <p className="text-primary fw-semibold text-center mb-0 mt-1" style={{ fontSize: 11 }}>{ll}</p>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }
                                if (isFixed) {
                                  const isOn = (editStates[bed.id] ?? 'A') !== 'off';
                                  const ll = isOn ? bedLinenLabel('A') : '';
                                  return (
                                    <div key={bed.id}>
                                      <AdminBedChip bed={bed} displayState="A"
                                        isActive={isOn} label={singleChipLabel(bed, isOn ? 'A' : 'off')}
                                        slots={bedSlots(bed, 'A')}
                                        onClick={() => handleBedChange(bed.id, isOn ? 'off' : 'A')} />
                                      {ll && <p className="text-primary fw-semibold text-center mb-0 mt-1" style={{ fontSize: 11 }}>{ll}</p>}
                                    </div>
                                  );
                                }
                                const isOn = state === 'A';
                                const ll = isOn ? bedLinenLabel('A') : '';
                                return (
                                  <div key={bed.id}>
                                    <AdminBedChip bed={bed} displayState="A"
                                      isActive={isOn} label={singleChipLabel(bed, state)}
                                      slots={bedSlots(bed, 'A')}
                                      onClick={() => handleBedChange(bed.id, isOn ? 'off' : 'A')} />
                                    {ll && <p className="text-primary fw-semibold text-center mb-0 mt-1" style={{ fontSize: 11 }}>{ll}</p>}
                                  </div>
                                );
                              })}
                            </div>
                            {hasLinen && (
                              <div className="border-top pt-2 small text-secondary d-flex flex-column gap-1">
                                {matrim > 0 && <span>🛏 {matrim/2} matr · 🪶 {federe} federe</span>}
                                {singoli > 0 && <span>🛌 {singoli/2} sing</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Culle */}
                    <div className="pt-2 border-top mb-3">
                      <p className="small fw-bold text-uppercase text-muted mb-2" style={{ letterSpacing: '0.06em' }}>
                        🚼 Culle
                      </p>
                      <div className="d-flex gap-2">
                        {[0, 1, 2].map(n => {
                          const active = editCribs === n;
                          return (
                            <button
                              key={n}
                              onClick={() => { setEditCribs(n); setSaveMsg(''); }}
                              className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Azioni */}
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <button
                        className="btn btn-success btn-sm fw-bold"
                        onClick={() => saveOverride(item)}
                        disabled={saving}>
                        {saving ? 'Salvataggio…' : '💾 Salva configurazione'}
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => resetToDefault(item)}>
                        ↺ Ripristina default
                      </button>
                      {saveMsg && (
                        <span className={`small ${saveMsg.startsWith('✅') ? 'text-success' : 'text-danger'}`}>
                          {saveMsg}
                        </span>
                      )}
                    </div>
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
