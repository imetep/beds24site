'use client'

/**
 * components/residenze/BedConfigDisplay.tsx
 *
 * Sezione "Dove dormirete" — scheda pubblica appartamento.
 * Mostra la configurazione fisica dei letti leggendo bedConfig.ts.
 *
 * READ-ONLY: nessun toggle, nessuna chiamata API, nessun Redis.
 * Il componente è puramente informativo.
 *
 * Inserimento in page.tsx: dopo la sezione "Descrizione", prima di "Servizi".
 *
 * Props:
 *   roomId  — ID Beds24 della stanza (chiave in bedConfig)
 *   locale  — lingua corrente
 */

import { getBedConfig } from '@/lib/bedConfig'
import { getTranslations } from '@/lib/i18n'
import type { Locale, Room, Bed } from '@/lib/bedConfig'

type UIShape = {
  sectionTitle: string
  configNote: string
  nonOscurabile: string
  optional: string
  configurabile: string
  or: string
  scroll: string
}

// ─────────────────────────────────────────────────────────────────────────────
// BED LABEL — testo breve per ogni tipo di letto
// ─────────────────────────────────────────────────────────────────────────────

function bedLabel(bed: Bed, locale: Locale): string {
  const labels: Record<string, Record<Locale, string>> = {
    'matrimoniale-standard':  { it: 'Matrimoniale', en: 'Double bed', de: 'Doppelbett', pl: 'Łóżko małżeńskie' },
    'singolo-standard':       { it: 'Singolo', en: 'Single bed', de: 'Einzelbett', pl: 'Łóżko pojedyncze' },
    'sommier':                { it: 'Sommier', en: 'Divan bed', de: 'Sommier', pl: 'Sommier' },
    'trasformabile':          { it: 'Letto trasformabile', en: 'Configurable bed', de: 'Verwandelbares Bett', pl: 'Łóżko przekształcalne' },
    'impilabile':             { it: 'Letto impilabile', en: 'Stacking bed', de: 'Stapelbett', pl: 'Łóżko składane' },
    'estraibile':             { it: 'Letto estraibile', en: 'Pull-out bed', de: 'Ausziehbett', pl: 'Łóżko wysuwane' },
    'pavimento':              { it: 'Letto a pavimento', en: 'Floor bed', de: 'Bodenbett', pl: 'Materac na podłodze' },
    'castello':               { it: 'Letti a castello', en: 'Bunk beds', de: 'Etagenbett', pl: 'Łóżko piętrowe' },
    'poltrona':               { it: 'Poltrona letto', en: 'Sofa chair bed', de: 'Sessel-Bett', pl: 'Fotel rozkładany' },
    'divano-matrimoniale':    { it: 'Divano letto', en: 'Sofa bed (double)', de: 'Schlafsofa (Doppel)', pl: 'Sofa (podwójna)' },
    'divano-singolo':         { it: 'Divano letto singolo', en: 'Sofa bed (single)', de: 'Schlafsofa (Einzel)', pl: 'Sofa (pojedyncza)' },
  }

  if (bed.variant === 'divano') {
    const key = bed.defaultLinenType === 'matrimoniale' ? 'divano-matrimoniale' : 'divano-singolo'
    return labels[key]?.[locale] ?? ''
  }
  // trasformabile: variant === 'sommier' con iconStates.A === 'singolo'
  if (bed.variant === 'sommier' && bed.iconStates?.A === 'singolo') {
    return labels['trasformabile']?.[locale] ?? ''
  }
  if (bed.variant === 'sommier' || bed.variant === 'impilabile' || bed.variant === 'estraibile'
    || bed.variant === 'pavimento' || bed.variant === 'castello' || bed.variant === 'poltrona') {
    return labels[bed.variant]?.[locale] ?? ''
  }
  // standard
  const key = `${bed.baseType}-standard`
  return labels[key]?.[locale] ?? ''
}

// ─────────────────────────────────────────────────────────────────────────────
// SHORT LABEL — versione abbreviata per le pill (max ~15 char)
// ─────────────────────────────────────────────────────────────────────────────

function shortLabel(label: string): string {
  return label
    .replace('Matrimoniale (180×200)', 'Matrimoniale')
    .replace('Matrimoniale (160×200)', 'Matrimoniale')
    .replace('2 singoli (90×200 ciascuno)', '2 singoli')
    .replace('2 singoli (80×200 ciascuno)', '2 singoli')
    .replace('1 singolo (in struttura)', '1 in struttura')
    .replace('2 a pavimento', '2 a terra')
    .replace('Matrimoniale (2 posti)', 'Matrimoniale')
    .replace('Double bed (2 places)', 'Double')
    .replace('Doppelbett (2 Plätze)', 'Doppelbett')
    .replace('Podwójne (2 miejsca)', 'Podwójne')
    .replace('1 singolo (1 persona)', '1 singolo')
    .replace('1 single (1 person)', '1 single')
    .replace('1 Einzelbett (1 Person)', '1 Einzelbett')
    .replace('1 pojedyncze (1 osoba)', '1 pojedyncze')
    .replace('1 singolo (in struttura)', '1 in struttura')
    .replace('1 single (on frame)', '1 on frame')
    .replace('1 Einzelbett (auf Gestell)', '1 auf Gestell')
    .replace('1 pojedyncze (na stelażu)', '1 na stelażu')
    .replace('Double (180×200)', 'Double')
    .replace('Double (160×200)', 'Double')
    .replace('2 singles (90×200 each)', '2 singles')
    .replace('2 singles (80×200 each)', '2 singles')
    .replace('Doppelbett (180×200)', 'Doppelbett')
    .replace('Doppelbett (160×200)', 'Doppelbett')
    .replace('2 Einzelbetten (je 90×200)', '2 Einzelbetten')
    .replace('2 Einzelbetten (je 80×200)', '2 Einzelbetten')
    .replace('Podwójne (180×200)', 'Podwójne')
    .replace('Podwójne (160×200)', 'Podwójne')
    .replace('2 pojedyncze (po 90×200)', '2 pojedyncze')
    .replace('2 pojedyncze (po 80×200)', '2 pojedyncze')
}


// ─────────────────────────────────────────────────────────────────────────────
// BED ICON — SVG inline semplice per ogni variante
// ─────────────────────────────────────────────────────────────────────────────

function BedIcon({ bed }: { bed: Bed }) {
  const blue = '#1E73BE'
  const blueFill = '#EEF5FC'
  const orange = '#FCAF1A'
  const orangeFill = '#FFF8EC'

  // Matrimoniale standard / sommier (stato A)
  if (bed.baseType === 'matrimoniale' && (bed.variant === 'standard' || bed.variant === 'sommier')) {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1" y="11" width="34" height="14" rx="2" stroke={blue} strokeWidth="1.5" fill={blueFill} />
        <rect x="2" y="1" width="14" height="11" rx="1.5" fill={blueFill} stroke={blue} strokeWidth="1.2" />
        <rect x="20" y="1" width="14" height="11" rx="1.5" fill={blueFill} stroke={blue} strokeWidth="1.2" />
      </svg>
    )
  }

  // Singolo standard
  if (bed.baseType === 'singolo' && bed.variant === 'standard') {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1" y="11" width="34" height="14" rx="2" stroke={blue} strokeWidth="1.5" fill={blueFill} />
        <rect x="10" y="1" width="16" height="11" rx="1.5" fill={blueFill} stroke={blue} strokeWidth="1.2" />
      </svg>
    )
  }

  // Sommier con iconStates A=singolo (trasformabile)
  if (bed.variant === 'sommier' && bed.iconStates?.A === 'singolo') {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1" y="11" width="34" height="14" rx="2" stroke={orange} strokeWidth="1.5" fill={orangeFill} />
        <rect x="10" y="1" width="16" height="11" rx="1.5" fill={orangeFill} stroke={orange} strokeWidth="1.2" />
        <text x="18" y="22" textAnchor="middle" fontSize="8" fill={orange} fontWeight="500">↔</text>
      </svg>
    )
  }

  // Impilabile
  if (bed.variant === 'impilabile') {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1" y="14" width="34" height="11" rx="2" stroke={orange} strokeWidth="1.5" fill={orangeFill} />
        <rect x="1" y="4" width="34" height="11" rx="2" stroke={orange} strokeWidth="1.2" fill="white" strokeDasharray="3 2" />
        <text x="18" y="22" textAnchor="middle" fontSize="7" fill={orange}>1→2</text>
      </svg>
    )
  }

  // Estraibile
  if (bed.variant === 'estraibile') {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1" y="6" width="34" height="12" rx="2" stroke={blue} strokeWidth="1.5" fill={blueFill} />
        <rect x="5" y="17" width="26" height="8" rx="1.5" stroke={orange} strokeWidth="1.2" fill={orangeFill} strokeDasharray="3 2" />
        <text x="18" y="23" textAnchor="middle" fontSize="6" fill={orange}>+ 1</text>
      </svg>
    )
  }

  // Poltrona
  if (bed.variant === 'poltrona') {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <path d="M6 14 C6 8 10 4 18 4 C26 4 30 8 30 14 L30 22 C30 23 29 24 28 24 L8 24 C7 24 6 23 6 22 Z" stroke={orange} strokeWidth="1.5" fill={orangeFill} />
        <line x1="6" y1="17" x2="30" y2="17" stroke={orange} strokeWidth="1" />
        <text x="18" y="22" textAnchor="middle" fontSize="7" fill={orange}>+ 1</text>
      </svg>
    )
  }

  // Divano
  if (bed.variant === 'divano') {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <path d="M3 12 C3 12 7 6 18 6 C29 6 33 12 33 12 L33 22 C33 23 32 24 31 24 L5 24 C4 24 3 23 3 22 Z" stroke={orange} strokeWidth="1.5" fill={orangeFill} />
        <line x1="3" y1="17" x2="33" y2="17" stroke={orange} strokeWidth="1" />
      </svg>
    )
  }

  // Castello
  if (bed.variant === 'castello') {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1" y="13" width="34" height="12" rx="2" stroke={blue} strokeWidth="1.5" fill={blueFill} />
        <rect x="1" y="1" width="34" height="12" rx="2" stroke={blue} strokeWidth="1.2" fill={blueFill} />
        <line x1="1" y1="13" x2="35" y2="13" stroke={blue} strokeWidth="1" />
      </svg>
    )
  }

  // Pavimento
  if (bed.variant === 'pavimento') {
    return (
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1" y="10" width="34" height="14" rx="2" stroke={orange} strokeWidth="1.5" fill={orangeFill} />
        <rect x="10" y="10" width="16" height="10" rx="1" fill={orangeFill} stroke={orange} strokeWidth="1" />
      </svg>
    )
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM CARD
// ─────────────────────────────────────────────────────────────────────────────

function RoomCard({ room, locale, ui }: { room: Room; locale: Locale; ui: UIShape }) {
  // Una camera è configurabile se almeno un letto ha canConfigure o è un divano/poltrona
  const hasConfigurable = room.beds.some(
    b => b.canConfigure || b.variant === 'poltrona' || b.variant === 'divano'
  )
  // Una camera ha l'avviso non-oscurabile se almeno un letto ha showNoteAlways
  const hasNonOscurabile = room.beds.some(b => b.showNoteAlways)
  // Il sommier ha opzione esclusiva (variante con due scelte)
  const hasSommier = room.beds.some(b => b.variant === 'sommier')
  // La camera contiene divani (sempre opzionali — mostrano il badge anche senza canConfigure)
  const hasDivano = room.beds.some(b => b.variant === 'divano')

  return (
    <div
      className="bed-card bg-white d-flex flex-column gap-2 flex-shrink-0 position-relative"
      style={{
        border: hasSommier ? '2px solid #FCAF1A' : '0.5px solid #e5e7eb',
        borderRadius: 12,
        padding: '14px 14px 12px',
        width: 200,
        height: 220,
        boxSizing: 'border-box',
      }}
    >
      {/* Badge */}
      {hasSommier && (
        <div
          className="position-absolute fw-semibold"
          style={{
            top: -1, right: 10,
            background: '#FCAF1A', color: '#4a2f00',
            fontSize: 10, padding: '2px 8px',
            borderRadius: '0 0 6px 6px', letterSpacing: '0.03em',
          }}
        >
          {ui.configurabile}
        </div>
      )}
      {!hasSommier && (hasConfigurable || hasDivano) && (
        <div
          className="position-absolute fw-medium"
          style={{
            top: -1, right: 10,
            background: '#FFF8EC', color: '#B07820',
            border: '0.5px solid #fcd87a', borderTop: 'none',
            fontSize: 10, padding: '2px 8px',
            borderRadius: '0 0 6px 6px',
          }}
        >
          + {ui.optional}
        </div>
      )}

      {/* Room label */}
      <div
        className="fw-semibold text-uppercase"
        style={{ fontSize: 11, color: '#888', letterSpacing: '0.05em' }}
      >
        {room.label[locale]}
      </div>

      {/* Beds */}
      <div className="d-flex flex-column gap-2">
        {room.beds.map(bed => (
          <div key={bed.id} className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center gap-2">
              <BedIcon bed={bed} />
              <span className="text-dark" style={{ fontSize: 12, lineHeight: 1.3 }}>
                {bedLabel(bed, locale)}
              </span>
            </div>

            {/* Sommier: due pill esclusivi */}
            {bed.variant === 'sommier' && bed.configOptions && (
              <div className="d-flex flex-column align-items-start mt-1" style={{ gap: 3 }}>
                <span
                  className="fw-medium rounded-pill"
                  style={{
                    background: '#EEF5FC', border: '0.5px solid #1E73BE',
                    padding: '2px 8px', fontSize: 10, color: '#1E73BE',
                  }}
                >
                  {shortLabel(bed.configOptions.closed.label[locale])}
                </span>
                <span className="ps-1" style={{ fontSize: 10, color: '#aaa' }}>{ui.or}</span>
                <span
                  className="rounded-pill"
                  style={{
                    background: '#f5f5f5', border: '0.5px solid #e5e7eb',
                    padding: '2px 8px', fontSize: 10, color: '#555',
                  }}
                >
                  {shortLabel(bed.configOptions.open.label[locale])}
                </span>
              </div>
            )}

            {/* Impilabile: stessa logica pill */}
            {bed.variant === 'impilabile' && bed.configOptions && (
              <div className="d-flex flex-column align-items-start mt-1" style={{ gap: 3 }}>
                <span
                  className="fw-medium rounded-pill"
                  style={{
                    background: '#EEF5FC', border: '0.5px solid #1E73BE',
                    padding: '2px 8px', fontSize: 10, color: '#1E73BE',
                  }}
                >
                  {shortLabel(bed.configOptions.closed.label[locale])}
                </span>
                <span className="ps-1" style={{ fontSize: 10, color: '#aaa' }}>{ui.or}</span>
                <span
                  className="rounded-pill"
                  style={{
                    background: '#f5f5f5', border: '0.5px solid #e5e7eb',
                    padding: '2px 8px', fontSize: 10, color: '#555',
                  }}
                >
                  {shortLabel(bed.configOptions.open.label[locale])}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Non oscurabile */}
      {hasNonOscurabile && (
        <div
          className="rounded-pill"
          style={{
            fontSize: 10, color: '#B07820', background: '#fde8a0',
            padding: '2px 8px', width: 'fit-content',
          }}
        >
          {ui.nonOscurabile}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  roomId: number
  locale: Locale
}

export default function BedConfigDisplay({ roomId, locale }: Props) {
  const config = getBedConfig(roomId)
  const ui = getTranslations(locale).components.bedConfigDisplay

  // Se non c'è config per questa room, non renderizzare nulla
  if (!config) return null

  // Mostrare la sezione solo se c'è almeno qualcosa di non-fisso:
  // letti configurabili, poltrona, estraibile, divano (opzionale).
  // Esclusi: solo letti matrimoniali/singoli standard fissi (niente da scegliere).
  const hasAnythingToShow = config.rooms.some(r =>
    r.beds.some(b =>
      b.canConfigure ||
      b.variant === 'poltrona' ||
      b.variant === 'estraibile' ||
      b.variant === 'divano'
    )
  )
  if (!hasAnythingToShow) return null

  return (
    <div className="mb-4">
      {/* Section title — stesso stile degli altri h2 in page.tsx */}
      <h2 className="fs-4 fw-bold mb-3" style={{ color: '#222' }}>
        {ui.sectionTitle}
      </h2>

      {/* Cards — grid uniforme su desktop, scroll orizzontale su mobile */}
      <div
        className="bed-config-scroll bed-scroll-container d-flex flex-nowrap align-items-stretch gap-2 pb-1"
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {config.rooms.map(room => (
          <RoomCard key={room.id} room={room} locale={locale} ui={ui} />
        ))}
      </div>

      {/* Scroll hint — visibile solo su mobile via CSS */}
      <div className="bed-scroll-hint-mobile">
        <span style={{ fontSize: 11, color: '#1E73BE' }}>{ui.scroll}</span>
      </div>

      {/* Nota config portale */}
      <div
        className="d-flex align-items-start gap-2 mt-3 px-3 py-2 rounded"
        style={{
          background: '#EEF5FC',
          border: '0.5px solid #b5d4f4',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0" style={{ marginTop: 1 }} aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="6.5" stroke="#1E73BE" strokeWidth="1" />
          <text x="7.5" y="11.5" textAnchor="middle" fontSize="8" fill="#1E73BE" fontWeight="600">i</text>
        </svg>
        <span style={{ fontSize: 12, color: '#0c447c', lineHeight: 1.6 }}>
          {ui.configNote}
        </span>
      </div>
    </div>
  )
}
