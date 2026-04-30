'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApartmentBedConfig, Bed, BedBaseType, BedVariant } from '@/lib/bedConfig';
import { Icon } from '@/components/ui/Icon';

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
  // Colori SVG dinamici (active vs idle) — non migrabili a token CSS perché
  // si applicano agli attributi fill/stroke del SVG, non a style CSS.
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
  const isWide = icon === 'matrimoniale' || icon === 'sommier_b' || icon === 'impilabile_b' || icon === 'divano';
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`bed-chip ${isActive ? 'is-active' : ''} ${isWide ? 'bed-chip--wide' : ''}`}
    >
      {isSommier && displayState === 'A' && (
        <span className="bed-chip__star">
          <Icon name="star-fill" />
        </span>
      )}
      <BedIcon variant={icon} active={isActive} />
      <span className="bed-chip__label">{label}</span>
      {isActive && slots > 0 && (
        <span className="bed-chip__slots">
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
    <div onClick={() => onCardClick(room.id)} className={`bed-room-card ${confirmed ? 'is-confirmed' : ''}`}>
      {confirmed && (
        <div className="bed-room-card__check">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3 3 7-7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
      <p className="bed-room-card__label">{label}</p>

      {/* Letti */}
      <div className="bed-room-card__beds">
        {room.beds.map((bed: Bed) => {
          const state = bedStates[bed.id] ?? 'off';
          if (hasTwoChips(bed)) {
            // DUE chip affiancati — scelta esclusiva
            return (
              <div key={bed.id} className="bed-room-card__chip-pair">
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
        <p key={bed.id} className="bed-room-card__note">
          <Icon name="info-circle" className="me-1" />
          {bed.note![lc] ?? bed.note!.it}
        </p>
      ))}

      {!confirmed && (
        <p className="bed-room-card__hint">{t.confirmHint}</p>
      )}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ confirmed, total, t }: { confirmed: number; total: number; t: any }) {
  const pct = total === 0 ? 0 : Math.round((confirmed / total) * 100);
  const done = confirmed === total;
  return (
    <div className="bed-progress">
      <div className="bed-progress__row">
        <p className={`bed-progress__label ${done ? 'is-done' : ''}`}>
          {done ? (
            <>
              <Icon name="check-circle-fill" className="me-1" />
              {t.allConfirmed}
            </>
          ) : `${confirmed} ${t.progressOf} ${total} ${t.progressLabel}`}
        </p>
        <p className="bed-progress__pct">{pct}%</p>
      </div>
      <div className="bed-progress__bar">
        {/* Larghezza dinamica calcolata a runtime — eccezione style legittima */}
        <div className={`bed-progress__fill ${done ? 'is-done' : ''}`} style={{ width: `${pct}%` }}/>
      </div>
    </div>
  );
}

// ─── Contatore persone ────────────────────────────────────────────────────────
function PersonCounter({ current, total, lc }: { current: number; total: number; lc: LC }) {
  if (total === 0) return null;
  const tooFew = current < total;
  const exact  = current === total;
  const modifier = tooFew ? 'low' : exact ? 'exact' : 'neutral';
  const text: Record<LC, string> = {
    it: `${current} ${current === 1 ? 'posto' : 'posti'} su ${total} ospiti${tooFew ? ` — mancano ${total - current}` : ''}`,
    en: `${current} of ${total} ${total === 1 ? 'guest' : 'guests'} placed${tooFew ? ` — ${total - current} more needed` : ''}`,
    de: `${current} von ${total} ${total === 1 ? 'Gast' : 'Gästen'}${tooFew ? ` — noch ${total - current} fehlend` : ''}`,
    pl: `${current} z ${total} ${total === 1 ? 'gościa' : 'gości'}${tooFew ? ` — brakuje ${total - current}` : ''}`,
  };
  return (
    <div className={`person-counter person-counter--${modifier}`}>
      <span className="person-counter__text">
        <Icon name="door-closed-fill" className="me-1" />
        {text[lc]}
        {exact && <Icon name="check-lg" className="ms-1" />}
      </span>
    </div>
  );
}

// ─── Culla ───────────────────────────────────────────────────────────────────
function CribSection({ cribs, onChange, t }: { cribs: number; onChange: (n: number) => void; t: any }) {
  return (
    <div className="crib-section">
      <p className="crib-section__title">
        <Icon name="egg-fill" className="me-1" />
        {t.cribTitle}
      </p>
      <p className="crib-section__desc">{t.cribDesc}</p>
      <div className="crib-section__choices">
        {[{ n: 0, l: t.cribNo }, { n: 1, l: t.crib1 }, { n: 2, l: t.crib2 }].map(({ n, l }) => (
          <button key={n} onClick={() => onChange(n)} className={`crib-section__btn ${cribs === n ? 'is-active' : ''}`}>{l}</button>
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

  if (status === 'loading') return (
    <div className="guest-section">
      <p className="bed-config-portal__hint">{t.loading}</p>
    </div>
  );
  if (!config) return null;

  return (
    <div className="guest-section">
      <div className="section-header">
        <Icon name="door-closed-fill" className="section-header__icon" />
        <h3 className="section-header__title">{t.title}</h3>
      </div>
      <p className="bed-config-portal__subtitle">{t.subtitle}</p>
      <ProgressBar confirmed={confirmedCount} total={totalRooms} t={t} />
      <div className="bed-config-portal__rooms">
        {config.rooms.map((room: any) => (
          <RoomCard key={room.id} room={room} lc={lc} bedStates={bedStates} roomTouched={roomTouched[room.id] ?? false} onBedClick={handleBedClick} onCardClick={handleCardClick} t={t} />
        ))}
      </div>
      <PersonCounter current={currentSlots} total={numGuests} lc={lc} />
      <CribSection cribs={cribs} onChange={n => { setCribs(n); setStatus('idle'); }} t={t} />
      <div className="bed-config-portal__footer">
        <button onClick={save} disabled={!allConfirmed || status === 'saving' || status === 'saved'}
          className={`bed-section__save ${status === 'saved' ? 'is-saved' : ''}`}>
          {status === 'saving' ? t.saving : status === 'saved' ? (
            <>
              <Icon name="check-lg" className="me-1" />
              {t.saved}
            </>
          ) : t.save}
        </button>
        {status === 'error' && <span className="bed-config-portal__error">{t.errorSave}</span>}
        {!allConfirmed && status !== 'saved' && <span className="bed-config-portal__hint">{t.saveHint}</span>}
      </div>
    </div>
  );
}
