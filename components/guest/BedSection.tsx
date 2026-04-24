'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApartmentBedConfig, Bed, BedBaseType, BedVariant } from '@/lib/bedConfig';

const C = {
  blue:       'var(--color-primary)',
  blueLight:  '#DBEAFE',
  blueMid:    '#93C5FD',
  orange:     '#FCAF1A',
  orangeDark: '#B07820',
  text:       '#111111',
  textMid:    '#555555',
  textMuted:  '#888888',
  border:     '#e5e7eb',
  bg:         '#f9fafb',
  success:    '#16a34a',
  gray:       '#9ca3af',
};

type LC = 'it' | 'en' | 'de' | 'pl';
type BedState = 'off' | 'A' | 'B';

// Letti che mostrano DUE chip affiancati (scelta esclusiva tra stato A e B)
function hasTwoChips(bed: Bed): boolean {
  return bed.variant === 'sommier' || bed.variant === 'impilabile';
}

// Posti letto per ogni stato
function slotsForState(bed: Bed, state: BedState): number {
  if (state === 'off') return 0;
  if (state === 'B') {
    if (bed.variant === 'impilabile') return 2;
    if (bed.variant === 'sommier') {
      // trasformabile (iconStates A=singolo): stato B = matrimoniale = 2 posti
      return 2;
    }
    return 0;
  }
  // stato A
  if (bed.variant === 'sommier') {
    // trasformabile: A=singolo → 1 posto; sommier normale: A=matrimoniale → 2
    if (bed.iconStates?.A === 'singolo') return 1;
    return 2;
  }
  if (bed.variant === 'impilabile')    return 1;
  if (bed.variant === 'castello')      return 1;
  if (bed.variant === 'estraibile')    return 1;
  if (bed.variant === 'poltrona')      return 1;
  if (bed.variant === 'pavimento')     return 1;
  if (bed.baseType === 'matrimoniale') return 2;
  if (bed.baseType === 'divano')       return bed.defaultLinenType === 'matrimoniale' ? 2 : 1;
  return 1;
}

// Quale baseType visualizzare per ogni chip
function iconTypeForChip(bed: Bed, displayState: 'A' | 'B'): BedBaseType {
  if (bed.iconStates) {
    return displayState === 'A' ? bed.iconStates.A : (bed.iconStates.B ?? bed.iconStates.A);
  }
  if (bed.variant === 'sommier')    return 'matrimoniale'; // entrambi i chip mostrano versioni diverse del matrimoniale
  return bed.baseType;
}

// Label per ogni chip
function chipLabel(bed: Bed, displayState: 'A' | 'B', lc: LC): string {
  if (bed.configOptions) {
    const opt = displayState === 'A' ? bed.configOptions.closed : bed.configOptions.open;
    return opt.label[lc] ?? opt.label.it;
  }
  const fallback: Record<BedBaseType, Record<LC, string>> = {
    matrimoniale: { it: 'Matrimoniale', en: 'Double',   de: 'Doppelbett', pl: 'Małżeńskie' },
    singolo:      { it: 'Singolo',      en: 'Single',   de: 'Einzelbett', pl: 'Pojedyncze' },
    divano:       { it: 'Divano',       en: 'Sofa bed', de: 'Schlafsofa', pl: 'Kanapa'     },
  };
  return fallback[bed.baseType]?.[lc] ?? bed.baseType;
}

// Label letto singolo (non configurabile)
function singleBedLabel(bed: Bed, state: BedState, lc: LC): string {
  const L: Record<string, Record<LC, string>> = {
    poltrona_off: { it: 'Poltrona letto',  en: 'Armchair bed', de: 'Schlafsessel', pl: 'Fotel'         },
    poltrona_on:  { it: 'Poltrona aperta', en: 'Open armchair',de: 'Ausgeklappt',  pl: 'Fotel otwarty' },
    divano:       { it: 'Divano letto',    en: 'Sofa bed',      de: 'Schlafsofa',  pl: 'Kanapa'        },
    castello:     { it: 'Castello (sopra)',en: 'Bunk (top)',    de: 'Oben (Etage)', pl: 'Piętro (góra)' },
    estr_off:     { it: 'Estraibile',      en: 'Pull-out',      de: 'Ausziehbar',  pl: 'Wysuwane'      },
    estr_on:      { it: 'Aperto (+1)',     en: 'Open (+1)',      de: 'Ausgezogen',  pl: 'Otwarte (+1)'  },
    pavimento:    { it: 'A pavimento',     en: 'Floor bed',     de: 'Bodenbett',   pl: 'Na podłodze'   },
    matrim:       { it: 'Matrimoniale',    en: 'Double bed',    de: 'Doppelbett',  pl: 'Małżeńskie'    },
    singolo:      { it: 'Singolo',         en: 'Single',        de: 'Einzelbett',  pl: 'Pojedyncze'    },
  };
  if (bed.variant === 'poltrona')   return (state === 'off' ? L.poltrona_off : L.poltrona_on)[lc];
  if (bed.variant === 'castello')   return L.castello[lc];
  if (bed.variant === 'estraibile') return (state === 'off' ? L.estr_off : L.estr_on)[lc];
  if (bed.variant === 'pavimento')  return L.pavimento[lc];
  if (bed.baseType === 'divano')    return L.divano[lc];
  if (bed.baseType === 'matrimoniale') return L.matrim[lc];
  return L.singolo[lc];
}

// ─── SVG icona letto ──────────────────────────────────────────────────────────
type IconVariant = 'singolo' | 'matrimoniale' | 'sommier_b' | 'impilabile_b' |
                   'poltrona_off' | 'poltrona_on' | 'castello' | 'divano' |
                   'estraibile' | 'pavimento';

function resolveIcon(bed: Bed, displayState: 'A' | 'B'): IconVariant {
  // Trasformabile e altri con iconStates
  if (bed.iconStates) {
    const t = displayState === 'A' ? bed.iconStates.A : (bed.iconStates.B ?? bed.iconStates.A);
    return t === 'matrimoniale' ? 'matrimoniale' : 'singolo';
  }
  if (bed.variant === 'sommier')    return displayState === 'B' ? 'sommier_b'    : 'matrimoniale';
  if (bed.variant === 'impilabile') return displayState === 'B' ? 'impilabile_b' : 'singolo';
  if (bed.variant === 'poltrona')   return 'poltrona_off';
  if (bed.variant === 'castello')   return 'castello';
  if (bed.variant === 'divano' || bed.baseType === 'divano') return 'divano';
  if (bed.variant === 'estraibile') return 'estraibile';
  if (bed.variant === 'pavimento')  return 'pavimento';
  if (bed.baseType === 'matrimoniale') return 'matrimoniale';
  return 'singolo';
}

function BedIcon({ variant, active }: { variant: IconVariant; active: boolean }) {
  const fill   = active ? '#DBEAFE' : '#E5E7EB';
  const stroke = active ? 'var(--color-primary)' : '#9CA3AF';
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
  // singolo / estraibile / pavimento
  return (
    <svg width="48" height="52" viewBox="0 0 48 52" fill="none">
      <rect x="2" y="22" width="44" height="28" rx="3" fill={fill} stroke={stroke} strokeWidth="1.2"/>
      <rect x="3" y="2"  width="42" height="22" rx="2" fill={pil}/>
    </svg>
  );
}

// ─── Chip letto cliccabile ────────────────────────────────────────────────────
function BedChip({ bed, displayState, isActive, label, slots, onClick, isSommier }: {
  bed: Bed; displayState: 'A' | 'B'; isActive: boolean;
  label: string; slots: number; onClick: () => void; isSommier?: boolean;
}) {
  const icon = resolveIcon(bed, displayState);
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        padding: '10px 8px', minWidth: '88px',
        border: isActive ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
        borderRadius: '12px', background: isActive ? C.blueLight : '#fff',
        cursor: 'pointer', transition: 'all .15s', position: 'relative',
        flex: (icon === 'matrimoniale' || icon === 'sommier_b' || icon === 'impilabile_b' || icon === 'divano') ? '1' : 'none',
      }}
    >
      {isSommier && displayState === 'A' && (
        <span style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '0.6rem', fontWeight: 700, background: '#FFF3CD', color: C.orangeDark, border: `1px solid ${C.orange}`, borderRadius: '3px', padding: '1px 4px' }}>⭐</span>
      )}
      <BedIcon variant={icon} active={isActive} />
      <span style={{ fontSize: '0.72rem', fontWeight: isActive ? 700 : 400, color: isActive ? C.blue : C.textMuted, textAlign: 'center', lineHeight: 1.3, maxWidth: '100px' }}>
        {label}
      </span>
      {isActive && slots > 0 && (
        <span style={{ fontSize: '0.65rem', color: C.blue, background: '#fff', border: `1px solid ${C.blueMid}`, borderRadius: '10px', padding: '1px 6px' }}>
          {slots === 1 ? '1p' : `${slots}p`}
        </span>
      )}
    </button>
  );
}

// ─── Card camera ──────────────────────────────────────────────────────────────
function RoomCard({ room, lc, bedStates, roomTouched, onBedClick, onCardClick, t }: {
  room: any; lc: LC; bedStates: Record<string, BedState>;
  roomTouched: boolean;
  onBedClick: (bedId: string, bed: Bed, target: 'A' | 'B') => void;
  onCardClick: (roomId: string) => void;
  t: any;
}) {
  const label = room.label[lc] ?? room.label.it;
  const anyActive = room.beds.some((b: Bed) => (bedStates[b.id] ?? 'off') !== 'off');
  const allOff    = room.beds.every((b: Bed) => (bedStates[b.id] ?? 'off') === 'off');
  const confirmed = roomTouched || anyActive || allOff;

  return (
    <div
      onClick={() => onCardClick(room.id)}
      style={{
        background: confirmed ? '#F0F9FF' : '#fff',
        border: confirmed ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
        borderRadius: '14px', padding: '1rem',
        transition: 'all .2s', position: 'relative',
      }}
    >
      {confirmed && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3 3 7-7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: confirmed ? C.blue : C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>

      {/* Letti */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {room.beds.map((bed: Bed) => {
          const state = bedStates[bed.id] ?? 'off';
          if (hasTwoChips(bed)) {
            // DUE chip affiancati — scelta esclusiva
            return (
              <div key={bed.id} style={{ display: 'flex', gap: '6px', width: '100%' }}>
                {(['A', 'B'] as const).map(ds => (
                  <BedChip
                    key={ds}
                    bed={bed}
                    displayState={ds}
                    isActive={state === ds}
                    label={chipLabel(bed, ds, lc)}
                    slots={slotsForState(bed, ds)}
                    onClick={() => onBedClick(bed.id, bed, ds)}
                    isSommier={bed.variant === 'sommier' && !bed.iconStates}
                  />
                ))}
              </div>
            );
          }
          // UN chip on/off
          return (
            <BedChip
              key={bed.id}
              bed={bed}
              displayState="A"
              isActive={state === 'A'}
              label={singleBedLabel(bed, state, lc)}
              slots={slotsForState(bed, 'A')}
              onClick={() => onBedClick(bed.id, bed, 'A')}
            />
          );
        })}
      </div>

      {/* Note: sempre visibili se showNoteAlways, altrimenti solo se letto attivo */}
      {room.beds.filter((b: Bed) => b.note && (
        (b as any).showNoteAlways || (bedStates[b.id] ?? 'off') !== 'off'
      )).map((bed: Bed) => (
        <p key={bed.id} style={{ margin: '8px 0 0', fontSize: '0.74rem', color: C.textMuted, lineHeight: 1.4 }}>
          ℹ️ {bed.note![lc] ?? bed.note!.it}
        </p>
      ))}

      {!confirmed && (
        <p style={{ margin: '10px 0 0', fontSize: '0.74rem', color: C.textMuted, fontStyle: 'italic' }}>{t.confirmHint}</p>
      )}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ confirmed, total, t }: { confirmed: number; total: number; t: any }) {
  const pct = total === 0 ? 0 : Math.round((confirmed / total) * 100);
  const done = confirmed === total;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: done ? C.success : C.textMid, fontWeight: done ? 700 : 400 }}>
          {done ? (
            <>
              <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
              {t.allConfirmed}
            </>
          ) : `${confirmed} ${t.progressOf} ${total} ${t.progressLabel}`}
        </p>
        <p style={{ margin: 0, fontSize: '0.78rem', color: C.textMuted }}>{pct}%</p>
      </div>
      <div style={{ height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '3px', background: done ? C.success : C.blue, width: `${pct}%`, transition: 'width .3s' }}/>
      </div>
    </div>
  );
}

// ─── Contatore persone ────────────────────────────────────────────────────────
function PersonCounter({ current, total, lc }: { current: number; total: number; lc: LC }) {
  if (total === 0) return null;
  const tooFew = current < total;
  const exact  = current === total;
  const color  = tooFew ? C.orangeDark : exact ? C.success : C.textMid;
  const bg     = tooFew ? '#FFF8EC' : exact ? '#f0fdf4' : C.bg;
  const bdr    = tooFew ? C.orange : exact ? '#86efac' : C.border;
  const text: Record<LC, string> = {
    it: `${current} ${current === 1 ? 'posto' : 'posti'} su ${total} ospiti${tooFew ? ` — mancano ${total - current}` : ''}`,
    en: `${current} of ${total} ${total === 1 ? 'guest' : 'guests'} placed${tooFew ? ` — ${total - current} more needed` : ''}`,
    de: `${current} von ${total} ${total === 1 ? 'Gast' : 'Gästen'}${tooFew ? ` — noch ${total - current} fehlend` : ''}`,
    pl: `${current} z ${total} ${total === 1 ? 'gościa' : 'gości'}${tooFew ? ` — brakuje ${total - current}` : ''}`,
  };
  return (
    <div style={{ padding: '9px 12px', background: bg, border: `1px solid ${bdr}`, borderRadius: '10px', marginBottom: '1rem' }}>
      <span style={{ fontSize: '0.84rem', fontWeight: tooFew || exact ? 700 : 400, color }}>
        <i className="bi bi-door-closed-fill me-1" aria-hidden="true" />
        {text[lc]}
        {exact && <i className="bi bi-check-lg ms-1" aria-hidden="true" />}
      </span>
    </div>
  );
}

// ─── Culla ───────────────────────────────────────────────────────────────────
function CribSection({ cribs, onChange, t }: { cribs: number; onChange: (n: number) => void; t: any }) {
  return (
    <div style={{ marginBottom: '1.25rem', padding: '1rem', background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}` }}>
      <p style={{ margin: '0 0 3px', fontSize: '0.88rem', fontWeight: 700, color: C.text }}>🍼 {t.cribTitle}</p>
      <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.5 }}>{t.cribDesc}</p>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[{ n: 0, l: t.cribNo }, { n: 1, l: t.crib1 }, { n: 2, l: t.crib2 }].map(({ n, l }) => (
          <button key={n} onClick={() => onChange(n)} style={{ flex: 1, padding: '7px 4px', fontSize: '0.8rem', fontWeight: cribs === n ? 700 : 400, border: cribs === n ? `2px solid ${C.blue}` : `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', background: cribs === n ? C.blueLight : '#fff', color: cribs === n ? C.blue : C.textMid, transition: 'all .15s' }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function BedSection({ locale, t, numGuests }: { locale: string; t: any; numGuests: number }) {
  const lc = (locale as LC) ?? 'it';
  const [config,      setConfig]      = useState<ApartmentBedConfig | null>(null);
  const [bedStates,   setBedStates]   = useState<Record<string, BedState>>({});
  const [roomTouched, setRoomTouched] = useState<Record<string, boolean>>({});
  const [cribs,       setCribs]       = useState(0);
  const [status,      setStatus]      = useState<'loading'|'idle'|'saving'|'saved'|'error'>('loading');
  const [mobile,      setMobile]      = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/beds', { cache: 'no-store' });
      if (!res.ok) { setStatus('idle'); return; }
      const data = await res.json();
      if (data.config) { setConfig(data.config); setBedStates(data.bedStates ?? {}); setRoomTouched(data.roomTouched ?? {}); setCribs(data.cribs ?? 0); }
      setStatus('idle');
    } catch { setStatus('idle'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBedClick = (bedId: string, bed: Bed, target: 'A' | 'B') => {
    setBedStates(prev => {
      const current = prev[bedId] ?? 'off';
      return { ...prev, [bedId]: current === target ? 'off' : target };
    });
    if (config) {
      for (const room of config.rooms) {
        if (room.beds.some((b: Bed) => b.id === bedId)) {
          setRoomTouched(prev => ({ ...prev, [room.id]: true }));
          break;
        }
      }
    }
    setStatus('idle');
  };

  const handleCardClick = (roomId: string) => {
    setRoomTouched(prev => ({ ...prev, [roomId]: true }));
    setStatus('idle');
  };

  const save = async () => {
    setStatus('saving');
    try {
      // Espandi bedStates includendo tutti i letti (anche quelli non toccati = off)
      const fullBedStates: Record<string, BedState> = {};
      if (config) {
        for (const room of config.rooms) {
          for (const bed of room.beds) {
            fullBedStates[bed.id] = bedStates[bed.id] ?? 'off';
          }
        }
      }
      const res = await fetch('/api/portal/beds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bedStates: fullBedStates, roomTouched, cribs }) });
      setStatus(res.ok ? 'saved' : 'error');
    } catch { setStatus('error'); }
  };

  const totalRooms     = config?.rooms.length ?? 0;
  const confirmedCount = config ? config.rooms.filter((r: any) =>
    roomTouched[r.id] ||
    r.beds.some((b: Bed) => (bedStates[b.id] ?? 'off') !== 'off') ||
    r.beds.every((b: Bed) => (bedStates[b.id] ?? 'off') === 'off')
  ).length : 0;
  const allConfirmed   = config !== null && confirmedCount === totalRooms;
  const currentSlots   = config ? config.rooms.flatMap((r: any) => r.beds).reduce((s: number, b: Bed) => s + slotsForState(b, bedStates[b.id] ?? 'off'), 0) : 0;

  if (status === 'loading') return <div className="bg-white border shadow-sm" style={card}><p className="m-0" style={{ color: C.textMuted, fontSize: '0.84rem' }}>{t.loading}</p></div>;
  if (!config) return null;

  return (
    <div className="bg-white border shadow-sm" style={card}>
      <div className="d-flex align-items-center gap-2 mb-1">
        <span style={{ fontSize: '1.1rem' }}>🛏</span>
        <h3 className="m-0 fw-bold" style={{ fontSize: '1rem', color: C.text }}>{t.title}</h3>
      </div>
      <p className="mb-3" style={{ fontSize: '0.84rem', color: C.textMid, lineHeight: 1.6 }}>{t.subtitle}</p>
      <ProgressBar confirmed={confirmedCount} total={totalRooms} t={t} />
      <div className="d-grid mb-3" style={{ gridTemplateColumns: mobile ? '1fr' : 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {config.rooms.map((room: any) => (
          <RoomCard key={room.id} room={room} lc={lc} bedStates={bedStates} roomTouched={roomTouched[room.id] ?? false} onBedClick={handleBedClick} onCardClick={handleCardClick} t={t} />
        ))}
      </div>
      <PersonCounter current={currentSlots} total={numGuests} lc={lc} />
      <CribSection cribs={cribs} onChange={n => { setCribs(n); setStatus('idle'); }} t={t} />
      <div className="d-flex align-items-center gap-3">
        <button onClick={save} disabled={!allConfirmed || status === 'saving' || status === 'saved'}
          className="text-white fw-bold border-0"
          style={{ background: status === 'saved' ? C.success : allConfirmed ? C.blue : C.gray, borderRadius: 10, padding: '0.65rem 1.5rem', fontSize: '0.88rem', cursor: !allConfirmed || status === 'saving' || status === 'saved' ? 'not-allowed' : 'pointer', transition: 'background .2s' }}>
          {status === 'saving' ? t.saving : status === 'saved' ? `✓ ${t.saved}` : t.save}
        </button>
        {status === 'error' && <span style={{ fontSize: '0.82rem', color: '#dc2626' }}>{t.errorSave}</span>}
        {!allConfirmed && status !== 'saved' && <span style={{ fontSize: '0.8rem', color: C.textMuted }}>{t.saveHint}</span>}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { borderRadius: 16, padding: '1.5rem' };
