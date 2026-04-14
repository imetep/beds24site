/**
 * lib/bedConfig.ts
 *
 * FONTE DI VERITÀ: Configurazione fisica dei letti per appartamento.
 *
 * Questo file alimenta:
 *  1. Il configuratore letti nel portale ospiti (/guest/portal → sezione letti)
 *  2. Il calcolo della biancheria (esportazione CSV dal pannello admin)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUANDO AGGIORNARE QUESTO FILE
 * ─────────────────────────────────────────────────────────────────────────────
 * Ogni volta che cambia la dotazione fisica dei letti in un appartamento
 * (acquisto, sostituzione, rimozione). Non toccare la logica dei componenti.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIANTI LETTO — comportamento UI e biancheria
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  variant      toggle ospite     motivo
 *  ──────────   ──────────────    ────────────────────────────────────────────
 *  standard     no                letto fisso, nessuna scelta
 *  sommier      sì ↔ 2 singoli   matrimoniale divisibile in 2 singoli
 *  impilabile   sì ↔ 2 pavimento 1 singolo in struttura → 2 letti a pavimento
 *  estraibile   sì ↔ aperto      2° letto nascosto sotto, estraibile
 *  pavimento    sì (posizione)    singolo basso spostabile (lenzuola invariate)
 *  castello     no                fisso, non separabile — solo nota info
 *  poltrona     no                si apre a letto singolo — attivazione per click sull'icona
 *  divano       no                divano letto
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE SU LETTI PARTICOLARI — leggere prima di modificare
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * STARK C4 (roomId 107773):
 *   Letto trasformabile: singolo 80×200 → matrimoniale 160×200.
 *
 * SMITH C3 (roomId 107851):
 *   Stessa struttura di Stark C4 (160×200 → 2×80×200 possibile),
 *   MA ha il materasso matrimoniale fisso sopra → variant: 'standard'.
 *   Quando si rimuove il materasso fisso e si passa ai 2 singoli:
 *   → cambiare variant → 'sommier', usare SOMMIER_160_OPTIONS (come Stark C4).
 *
 * RENETTA C3 (roomId 107849):
 *   1 unità impilabile: chiusa = 1 singolo, aperta = 2 letti a ~23cm da terra.
 *
 * KISSABEL C2 (roomId 432215):
 *   1 unità impilabile (1 → 2 a pavimento).
 *
 * KISSABEL C4 (roomId 432215):
 *   2 unità impilabili (2 → 4 a pavimento).
 *
 * SERGENTE C4 (roomId 507514):
 *   Il letto a pavimento qui è un singolo basso spostabile (non impilabile).
 *   variant: 'pavimento' — toggle posizione, lenzuola invariate.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'it' | 'en' | 'de' | 'pl'
export type ML = Record<Locale, string>

export type BedVariant =
  | 'standard'
  | 'sommier'
  | 'impilabile'
  | 'estraibile'
  | 'pavimento'
  | 'castello'
  | 'poltrona'
  | 'divano'

export type BedBaseType = 'matrimoniale' | 'singolo' | 'divano'

export interface ConfigOption {
  label: ML
  linenType: 'matrimoniale' | 'singolo' | 'none'
  linenCount: number
}

export interface Bed {
  id: string
  baseType: BedBaseType
  variant: BedVariant
  dimensions?: string
  canConfigure: boolean
  configOptions?: { closed: ConfigOption; open: ConfigOption }
  note?: ML
  showNoteAlways?: boolean  // nota visibile anche quando il letto non è selezionato
  iconStates?: { A: BedBaseType; B?: BedBaseType }
  defaultLinenType: 'matrimoniale' | 'singolo' | 'none'
  defaultLinenCount: number
}

export interface Room {
  id: string
  label: ML
  beds: Bed[]
}

export interface ApartmentBedConfig {
  roomId: number
  propertyId: number
  name: string
  rooms: Room[]
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTE PREDEFINITE PER VARIANTE
// ─────────────────────────────────────────────────────────────────────────────

const NOTES: Partial<Record<BedVariant, ML>> = {
  sommier: {
    it: 'Letto sommier configurabile: matrimoniale oppure 2 singoli. Comunicateci la vostra preferenza.',
    en: 'Configurable sommier: use as a double or split into 2 singles. Let us know your preference.',
    de: 'Konfigurierbares Sommier-Bett: als Doppel- oder 2 Einzelbetten. Teilen Sie uns Ihre Präferenz mit.',
    pl: 'Konfigurowalne łóżko sommier: małżeńskie lub 2 pojedyncze. Podaj swoją preferencję.',
  },
  impilabile: {
    it: 'Letto singolo su struttura. Si apre in 2 letti a pavimento. Dite pure come lo volete.',
    en: 'Single bed on frame. Opens into 2 floor-level beds. Let us know your preference.',
    de: 'Einzelbett auf Gestell. Lässt sich in 2 Bodenmatratzen umwandeln. Teilen Sie uns Ihre Wahl mit.',
    pl: 'Łóżko pojedyncze na stelażu. Rozkłada się na 2 materace na podłodze. Podaj swoją preferencję.',
  },
  estraibile: {
    it: 'Sotto questo letto è nascosto un secondo letto singolo estraibile. Comunicateci se volete che sia preparato.',
    en: 'A pull-out single bed is stored underneath. Let us know if you would like it made up.',
    de: 'Unter diesem Bett verbirgt sich ein ausziehbares Einzelbett. Geben Sie uns Bescheid, ob es vorbereitet werden soll.',
    pl: 'Pod tym łóżkiem ukryte jest wysuwane łóżko pojedyncze. Daj nam znać, czy chcesz, żeby było pościelone.',
  },
  pavimento: {
    it: 'Letto singolo basso. Può essere spostato nella stanza secondo le vostre preferenze.',
    en: 'Low-profile single bed. It can be moved around the room to suit your preferences.',
    de: 'Niedriges Einzelbett. Es kann nach Ihren Wünschen im Zimmer umgestellt werden.',
    pl: 'Niskie łóżko pojedyncze. Można je przestawiać po pokoju według własnych upodobań.',
  },
  castello: {
    it: 'Letti a castello fissi, non separabili.',
    en: 'Fixed bunk beds, cannot be separated.',
    de: 'Fest montierte Etagenbetten, nicht trennbar.',
    pl: 'Stałe łóżka piętrowe, nie do rozdzielenia.',
  },
  poltrona: {
    it: 'Poltrona che si apre a letto singolo.',
    en: 'Armchair that unfolds into a single bed.',
    de: 'Sessel, der sich zu einem Einzelbett ausklappen lässt.',
    pl: 'Fotel rozkładany na pojedyncze łóżko.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG OPTIONS PER TIPO
// ─────────────────────────────────────────────────────────────────────────────

const SOMMIER_180: { closed: ConfigOption; open: ConfigOption } = {
  closed: {
    label: { it: 'Matrimoniale (180×200)', en: 'Double (180×200)', de: 'Doppelbett (180×200)', pl: 'Podwójne (180×200)' },
    linenType: 'matrimoniale', linenCount: 1,
  },
  open: {
    label: { it: '2 singoli (90×200 ciascuno)', en: '2 singles (90×200 each)', de: '2 Einzelbetten (je 90×200)', pl: '2 pojedyncze (po 90×200)' },
    linenType: 'singolo', linenCount: 2,
  },
}

const SOMMIER_160: { closed: ConfigOption; open: ConfigOption } = {
  closed: {
    label: { it: 'Matrimoniale (160×200)', en: 'Double (160×200)', de: 'Doppelbett (160×200)', pl: 'Podwójne (160×200)' },
    linenType: 'matrimoniale', linenCount: 1,
  },
  open: {
    label: { it: '2 singoli (80×200 ciascuno)', en: '2 singles (80×200 each)', de: '2 Einzelbetten (je 80×200)', pl: '2 pojedyncze (po 80×200)' },
    linenType: 'singolo', linenCount: 2,
  },
}

const IMPILABILE_OPTS: { closed: ConfigOption; open: ConfigOption } = {
  closed: {
    label: { it: '1 singolo (in struttura)', en: '1 single (on frame)', de: '1 Einzelbett (auf Gestell)', pl: '1 pojedyncze (na stelażu)' },
    linenType: 'singolo', linenCount: 1,
  },
  open: {
    label: { it: '2 a pavimento', en: '2 floor beds', de: '2 Bodenmatratzen', pl: '2 materace na podłodze' },
    linenType: 'singolo', linenCount: 2,
  },
}

const ESTRAIBILE_OPTS: { closed: ConfigOption; open: ConfigOption } = {
  closed: {
    label: { it: 'Chiuso (non usato)', en: 'Closed (not used)', de: 'Eingezogen (nicht genutzt)', pl: 'Złożone (nieużywane)' },
    linenType: 'none', linenCount: 0,
  },
  open: {
    label: { it: 'Aperto (2° letto pronto)', en: 'Open (2nd bed ready)', de: 'Ausgezogen (2. Bett bereit)', pl: 'Otwarte (2. łóżko gotowe)' },
    linenType: 'singolo', linenCount: 1,
  },
}


// Opzioni toggle poltrona (sì/no)
const POLTRONA_OPTS: { closed: ConfigOption; open: ConfigOption } = {
  closed: {
    label: { it: 'Non aperta (0 posti)', en: 'Closed (0 places)', de: 'Eingeklappt (0 Plätze)', pl: 'Złożona (0 miejsc)' },
    linenType: 'none', linenCount: 0,
  },
  open: {
    label: { it: 'Aperta (1 posto)', en: 'Open (1 place)', de: 'Ausgeklappt (1 Platz)', pl: 'Rozłożona (1 miejsce)' },
    linenType: 'singolo', linenCount: 1,
  },
}

// Opzioni custom estraibile PinkLady C3 (roomId 107848):
// il letto estraibile qui funziona come secondo letto affiancato → label più umane
const ESTRAIBILE_PINKLADY_C3: { closed: ConfigOption; open: ConfigOption } = {
  closed: {
    label: { it: '1 singolo (1 persona)', en: '1 single (1 person)', de: '1 Einzelbett (1 Person)', pl: '1 pojedyncze (1 osoba)' },
    linenType: 'singolo', linenCount: 0,
  },
  open: {
    label: { it: '2 posti (affiancati)', en: '2 places (side by side)', de: '2 Plätze (nebeneinander)', pl: '2 miejsca (obok siebie)' },
    linenType: 'singolo', linenCount: 1,
  },
}

const PAVIMENTO_OPTS: { closed: ConfigOption; open: ConfigOption } = {
  closed: {
    label: { it: 'Vicini', en: 'Together', de: 'Zusammen', pl: 'Razem' },
    linenType: 'singolo', linenCount: 1,
  },
  open: {
    label: { it: 'Separati nella stanza', en: 'Apart in the room', de: 'Getrennt im Zimmer', pl: 'Oddzielnie w pokoju' },
    linenType: 'singolo', linenCount: 1,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function std(id: string, base: BedBaseType, dim?: string): Bed {
  return {
    id, baseType: base, variant: 'standard', dimensions: dim,
    canConfigure: false,
    defaultLinenType: base === 'singolo' ? 'singolo' : 'matrimoniale',
    defaultLinenCount: 1,
  }
}

function sommier(id: string, opts: typeof SOMMIER_180, dim: string): Bed {
  return {
    id, baseType: 'matrimoniale', variant: 'sommier', dimensions: dim,
    canConfigure: true, configOptions: opts, note: NOTES.sommier,
    defaultLinenType: 'matrimoniale', defaultLinenCount: 1,
  }
}

function impilabile(id: string): Bed {
  return {
    id, baseType: 'singolo', variant: 'impilabile',
    canConfigure: true, configOptions: IMPILABILE_OPTS, note: NOTES.impilabile,
    defaultLinenType: 'singolo', defaultLinenCount: 1,
  }
}

function estraibile(id: string): Bed {
  return {
    id, baseType: 'singolo', variant: 'estraibile',
    canConfigure: true, configOptions: ESTRAIBILE_OPTS, note: NOTES.estraibile,
    defaultLinenType: 'none', defaultLinenCount: 0,
  }
}

function pavimento(id: string): Bed {
  return {
    id, baseType: 'singolo', variant: 'pavimento',
    canConfigure: true, configOptions: PAVIMENTO_OPTS, note: NOTES.pavimento,
    defaultLinenType: 'singolo', defaultLinenCount: 1,
  }
}

function castello(id: string): Bed {
  return {
    id, baseType: 'singolo', variant: 'castello',
    canConfigure: false, note: NOTES.castello,
    defaultLinenType: 'singolo', defaultLinenCount: 1,
  }
}

function poltrona(id: string): Bed {
  return {
    id, baseType: 'singolo', variant: 'poltrona',
    canConfigure: false, note: NOTES.poltrona,
    defaultLinenType: 'singolo', defaultLinenCount: 1,
  }
}

function divano(id: string, base: 'matrimoniale' | 'singolo' = 'matrimoniale', note?: ML): Bed {
  return {
    id, baseType: 'divano', variant: 'divano',
    canConfigure: false, note,
    showNoteAlways: note != null,
    defaultLinenType: base, defaultLinenCount: 1,
  }
}

function cam(n: number): ML {
  return { it: `Camera ${n}`, en: `Bedroom ${n}`, de: `Schlafzimmer ${n}`, pl: `Sypialnia ${n}` }
}
const SOGGIORNO: ML = { it: 'Soggiorno', en: 'Living room', de: 'Wohnzimmer', pl: 'Salon' }

function room(id: string, label: ML, beds: Bed[]): Room {
  return { id, label, beds }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAZIONI APPARTAMENTI
// ─────────────────────────────────────────────────────────────────────────────

// Letto trasformabile (singolo 80x200 → matrimoniale 160x200)
const PINKLADY_C3_OPTS: { closed: ConfigOption; open: ConfigOption } = {
  closed: {
    label: { it: '1 singolo (1 persona)', en: '1 single (1 person)', de: '1 Einzelbett (1 Person)', pl: '1 pojedyncze (1 osoba)' },
    linenType: 'singolo', linenCount: 1,
  },
  open: {
    label: { it: 'Matrimoniale (2 posti)', en: 'Double bed (2 places)', de: 'Doppelbett (2 Plätze)', pl: 'Podwójne (2 miejsca)' },
    linenType: 'matrimoniale', linenCount: 1,
  },
}

function trasformabile(id: string): Bed {
  return {
    id, baseType: 'singolo', variant: 'sommier',
    canConfigure: true, configOptions: PINKLADY_C3_OPTS,
    iconStates: { A: 'singolo', B: 'matrimoniale' },
    note: {
      it: 'Singolo configurabile in matrimoniale.',
      en: 'Single bed, configurable as a double.',
      de: 'Einzelbett, als Doppelbett konfigurierbar.',
      pl: 'Łóżko pojedyncze, konfigurowalne jako małżeńskie.',
    },
    defaultLinenType: 'singolo', defaultLinenCount: 1,
  }
}


const NOTE_NON_OSCURABILE: ML = {
  it: 'Lo spazio non è oscurabile.',
  en: 'This area cannot be darkened.',
  de: 'Dieser Bereich kann nicht verdunkelt werden.',
  pl: 'Przestrzeń nie może być zaciemniona.',
}

const SPAZI_COMUNI: ML = { it: 'Spazi comuni', en: 'Common areas', de: 'Gemeinschaftsbereiche', pl: 'Części wspólne' }

const BED_CONFIGS: ApartmentBedConfig[] = [

  // ── LIVINGAPPLE campagna (propertyId 46487) ───────────────────────────────

  {
    roomId: 107773, propertyId: 46487, name: 'Stark',
    rooms: [
      room('107773_c1', cam(1), [std('107773_c1_b1', 'matrimoniale', '160x200'), poltrona('107773_c1_b2')]),
      room('107773_c2', cam(2), [sommier('107773_c2_b1', SOMMIER_180, '180x200')]),
      room('107773_c3', cam(3), [std('107773_c3_b1', 'matrimoniale')]),
      room('107773_c4', cam(4), [trasformabile('107773_c4_b1')]),
      room('107773_sv', SOGGIORNO, [divano('107773_sv_b1', 'matrimoniale', NOTE_NON_OSCURABILE)]),
    ],
  },

  {
    roomId: 107799, propertyId: 46487, name: 'Idared',
    rooms: [
      room('107799_c1', cam(1), [std('107799_c1_b1', 'matrimoniale')]),
      room('107799_c2', cam(2), [
        std('107799_c2_b1', 'singolo'),
        std('107799_c2_b2', 'singolo'),
        estraibile('107799_c2_b3'),
        estraibile('107799_c2_b4'),
      ]),
    ],
  },

  {
    roomId: 107846, propertyId: 46487, name: 'Delicious',
    rooms: [
      room('107846_c1', cam(1), [std('107846_c1_b1', 'matrimoniale')]),
      room('107846_c2', cam(2), [
        std('107846_c2_b1', 'singolo'),
        std('107846_c2_b2', 'singolo'),
        estraibile('107846_c2_b3'),
        estraibile('107846_c2_b4'),
      ]),
    ],
  },

  {
    roomId: 107847, propertyId: 46487, name: 'Fuji',
    rooms: [
      room('107847_c1', cam(1), [std('107847_c1_b1', 'matrimoniale'), poltrona('107847_c1_b2')]),
      room('107847_c2', cam(2), [sommier('107847_c2_b1', SOMMIER_180, '180x200')]),
      room('107847_c3', cam(3), [std('107847_c3_b1', 'matrimoniale')]),
      room('107847_sv', SOGGIORNO, [divano('107847_sv_b1', 'matrimoniale', NOTE_NON_OSCURABILE)]),
    ],
  },

  {
    roomId: 107848, propertyId: 46487, name: 'PinkLady',
    rooms: [
      room('107848_c1', cam(1), [std('107848_c1_b1', 'matrimoniale'), poltrona('107848_c1_b2')]),
      room('107848_c2', cam(2), [sommier('107848_c2_b1', SOMMIER_180, '180x200')]),
      room('107848_c3', cam(3), [std('107848_c3_b1', 'singolo'), estraibile('107848_c3_b2')]),
      room('107848_sv', SOGGIORNO, [
        divano('107848_sv_b1', 'matrimoniale', NOTE_NON_OSCURABILE), divano('107848_sv_b2'), divano('107848_sv_b3', 'singolo'),
      ]),
    ],
  },

  {
    roomId: 107849, propertyId: 46487, name: 'Renetta',
    rooms: [
      room('107849_c1', cam(1), [sommier('107849_c1_b1', SOMMIER_180, '180x200')]),
      room('107849_c2', cam(2), [
        sommier('107849_c2_b1', SOMMIER_180, '180x200'),
        std('107849_c2_b2', 'singolo'),
        estraibile('107849_c2_b3'),
      ]),
      room('107849_c3', cam(3), [impilabile('107849_c3_b1')]),
      room('107849_sv', SOGGIORNO, [divano('107849_sv_b1', 'matrimoniale', NOTE_NON_OSCURABILE), divano('107849_sv_b2')]),
    ],
  },

  {
    roomId: 107851, propertyId: 46487, name: 'Smith',
    rooms: [
      room('107851_c1', cam(1), [std('107851_c1_b1', 'matrimoniale'), poltrona('107851_c1_b2')]),
      room('107851_c2', cam(2), [std('107851_c2_b1', 'singolo'), std('107851_c2_b2', 'singolo')]),
      room('107851_c3', cam(3), [
        // NOTE IMPORTANTE: struttura 160×200 predisposta per 2×80×200,
        // MA al momento ha materasso matrimoniale fisso → variant standard.
        // Per passare a 2 singoli: cambiare in sommier('107851_c3_b1', SOMMIER_160, '160x200')
        std('107851_c3_b1', 'matrimoniale', '160x200'),
      ]),
      room('107851_sv', SOGGIORNO, [divano('107851_sv_b1', 'matrimoniale', NOTE_NON_OSCURABILE)]),
    ],
  },

  {
    roomId: 198030, propertyId: 46487, name: 'Annurca',
    rooms: [
      room('198030_c1', cam(1), [std('198030_c1_b1', 'matrimoniale')]),
      room('198030_sv', SOGGIORNO, [divano('198030_sv_b1')]),
    ],
  },

  {
    roomId: 432215, propertyId: 46487, name: 'Kissabel',
    rooms: [
      room('432215_c1', cam(1), [std('432215_c1_b1', 'matrimoniale')]),
      room('432215_c2', cam(2), [
        std('432215_c2_b1', 'matrimoniale'),
        // 1 singolo OPPURE 2 a pavimento
        impilabile('432215_c2_b2'),
      ]),
      room('432215_c3', cam(3), [std('432215_c3_b1', 'matrimoniale')]),
      room('432215_c4', cam(4), [
        // 2 singoli standard OPPURE 4 a pavimento: 2 unità impilabili
        impilabile('432215_c4_b1'),
        impilabile('432215_c4_b2'),
      ]),
      room('432215_sv', SPAZI_COMUNI, [divano('432215_sv_b1')]),
    ],
  },

  {
    roomId: 507514, propertyId: 46487, name: 'Sergente',
    rooms: [
      room('507514_c1', cam(1), [std('507514_c1_b1', 'matrimoniale')]),
      room('507514_c2', cam(2), [std('507514_c2_b1', 'matrimoniale'), std('507514_c2_b2', 'singolo')]),
      room('507514_c3', cam(3), [std('507514_c3_b1', 'singolo'), std('507514_c3_b2', 'singolo')]),
      room('507514_c4', cam(4), [
        std('507514_c4_b1', 'singolo'),
        std('507514_c4_b2', 'singolo'),
        pavimento('507514_c4_b3'),  // singolo basso spostabile (non impilabile)
        castello('507514_c4_b4'),
      ]),
      room('507514_sv', SOGGIORNO, [divano('507514_sv_b1', 'matrimoniale', NOTE_NON_OSCURABILE), divano('507514_sv_b2')]),
    ],
  },

  // ── LIVINGAPPLE BEACH (propertyId 46871) ─────────────────────────────────

  {
    roomId: 108607, propertyId: 46871, name: 'Gala',
    rooms: [
      room('108607_c1', cam(1), [std('108607_c1_b1', 'matrimoniale')]),
      room('108607_c2', cam(2), [
        std('108607_c2_b1', 'singolo'),
        std('108607_c2_b2', 'singolo'),
        poltrona('108607_c2_b3'),
      ]),
    ],
  },

  {
    roomId: 108612, propertyId: 46871, name: 'Rubens',
    rooms: [
      room('108612_c1', cam(1), [std('108612_c1_b1', 'matrimoniale'), poltrona('108612_c1_b2')]),
      room('108612_c2', cam(2), [std('108612_c2_b1', 'singolo'), std('108612_c2_b2', 'singolo')]),
    ],
  },

  {
    roomId: 108613, propertyId: 46871, name: 'Braeburn',
    rooms: [
      room('108613_c1', cam(1), [std('108613_c1_b1', 'matrimoniale')]),
      room('108613_c2', cam(2), [std('108613_c2_b1', 'singolo'), std('108613_c2_b2', 'singolo')]),
      room('108613_sv', SOGGIORNO, [divano('108613_sv_b1')]),
    ],
  },

  // ── CHERRY HOUSE (propertyId 47410) ──────────────────────────────────────

  {
    roomId: 109685, propertyId: 47410, name: 'Cherry',
    rooms: [
      room('109685_c1', cam(1), [std('109685_c1_b1', 'matrimoniale')]),
      room('109685_sv', SPAZI_COMUNI, [divano('109685_sv_b1', 'matrimoniale', NOTE_NON_OSCURABILE)]),
    ],
  },

  {
    roomId: 113528, propertyId: 47410, name: 'Mulberry',
    rooms: [
      room('113528_c1', cam(1), [std('113528_c1_b1', 'matrimoniale'), poltrona('113528_c1_b2')]),
      room('113528_c2', cam(2), [trasformabile('113528_c2_b1')]),
    ],
  },

  // ── IL MARE IN GIARDINO (propertyId 48556) ────────────────────────────────

  {
    roomId: 112982, propertyId: 48556, name: 'Ciclamino',
    rooms: [
      room('112982_c1', cam(1), [std('112982_c1_b1', 'matrimoniale')]),
      room('112982_c2', cam(2), [impilabile('112982_c2_b1')]),
      room('112982_sv', SOGGIORNO, [divano('112982_sv_b1')]),
    ],
  },

  {
    roomId: 113880, propertyId: 48556, name: 'Fiordaliso',
    rooms: [
      room('113880_c1', cam(1), [std('113880_c1_b1', 'matrimoniale')]),
      room('113880_c2', cam(2), [impilabile('113880_c2_b1')]),
      room('113880_sv', SOGGIORNO, [divano('113880_sv_b1')]),
    ],
  },

  {
    roomId: 113881, propertyId: 48556, name: 'Lavanda',
    rooms: [
      room('113881_c1', cam(1), [std('113881_c1_b1', 'matrimoniale')]),
      room('113881_c2', cam(2), [std('113881_c2_b1', 'matrimoniale')]),
      room('113881_sv', SOGGIORNO, [divano('113881_sv_b1')]),
    ],
  },

  {
    roomId: 113882, propertyId: 48556, name: 'Narciso',
    rooms: [
      room('113882_c1', cam(1), [std('113882_c1_b1', 'matrimoniale')]),
      room('113882_c2', cam(2), [trasformabile('113882_c2_b1')]),
      room('113882_sv', SOGGIORNO, [divano('113882_sv_b1')]),
    ],
  },

  {
    roomId: 113883, propertyId: 48556, name: 'Orchidea',
    rooms: [
      room('113883_c1', cam(1), [std('113883_c1_b1', 'matrimoniale')]),
      room('113883_c2', cam(2), [std('113883_c2_b1', 'singolo'), std('113883_c2_b2', 'singolo')]),
      room('113883_sv', SOGGIORNO, [divano('113883_sv_b1')]),
    ],
  },

  {
    roomId: 113884, propertyId: 48556, name: 'Primula',
    rooms: [
      room('113884_c1', cam(1), [std('113884_c1_b1', 'matrimoniale')]),
      room('113884_c2', cam(2), [impilabile('113884_c2_b1')]),
      room('113884_c3', cam(3), [std('113884_c3_b1', 'matrimoniale')]),
    ],
  },

  {
    roomId: 113885, propertyId: 48556, name: 'Mughetto',
    rooms: [
      room('113885_sv', SOGGIORNO, [std('113885_sv_b1', 'matrimoniale')]),
    ],
  },

  {
    roomId: 113887, propertyId: 48556, name: 'Viola',
    rooms: [
      room('113887_c1', cam(1), [std('113887_c1_b1', 'matrimoniale')]),
      room('113887_c2', cam(2), [std('113887_c2_b1', 'matrimoniale')]),
      room('113887_sv', SOGGIORNO, [divano('113887_sv_b1')]),
    ],
  },

  {
    roomId: 179295, propertyId: 48556, name: 'Peonia',
    rooms: [
      room('179295_c1', cam(1), [std('179295_c1_b1', 'matrimoniale')]),
      room('179295_sv', SOGGIORNO, [divano('179295_sv_b1')]),
    ],
  },

  // ── VILLA PATRIZIA (propertyId 190754) ───────────────────────────────────

  {
    roomId: 411401, propertyId: 190754, name: 'Villa Patrizia',
    rooms: [
      room('411401_c1', cam(1), [std('411401_c1_b1', 'matrimoniale'), std('411401_c1_b2', 'singolo')]),
      room('411401_c2', cam(2), [std('411401_c2_b1', 'matrimoniale'), std('411401_c2_b2', 'singolo')]),
      room('411401_sv', SPAZI_COMUNI, [divano('411401_sv_b1', 'matrimoniale', NOTE_NON_OSCURABILE)]),
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS — API pubblica del modulo
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG_MAP = new Map<number, ApartmentBedConfig>(
  BED_CONFIGS.map(c => [c.roomId, c])
)

export function getBedConfig(roomId: number): ApartmentBedConfig | null {
  return CONFIG_MAP.get(roomId) ?? null
}

export function getBedConfigsByProperty(propertyId: number): ApartmentBedConfig[] {
  return BED_CONFIGS.filter(c => c.propertyId === propertyId)
}

/**
 * Restituisce il numero di posti letto effettivi dato lo stato dei toggle.
 * Usato per verificare la corrispondenza con numGuests.
 */
export function calcTotalSlots(
  roomId: number,
  choices: Record<string, 'closed' | 'open'>
): number {
  const config = getBedConfig(roomId)
  if (!config) return 0
  let total = 0
  for (const room of config.rooms) {
    for (const bed of room.beds) {
      const choice = choices[bed.id] ?? 'closed'
      if (bed.variant === 'estraibile') {
        total += choice === 'open' ? 1 : 0
      } else if (bed.variant === 'poltrona') {
        total += choice === 'open' ? 1 : 0
      } else if (bed.variant === 'impilabile') {
        total += choice === 'open' ? 2 : 1
      } else if (bed.variant === 'castello') {
        total += 1   // solo il posto sopraelevato — il basso è già contato come standard
      } else if (bed.baseType === 'matrimoniale') {
        total += 2
      } else if (bed.baseType === 'divano') {
        total += bed.defaultLinenType === 'matrimoniale' ? 2 : 1
      } else {
        total += 1
      }
    }
  }
  return total
}

/**
 * Calcola set di biancheria dato lo stato dei toggle scelto dall'ospite.
 * Usato dall'export CSV admin.
 */
export function calcLinenSets(
  roomId: number,
  choices: Record<string, 'closed' | 'open'>
): { matrimoniale: number; singolo: number } {
  const config = getBedConfig(roomId)
  if (!config) return { matrimoniale: 0, singolo: 0 }
  let matrimoniale = 0, singolo = 0
  for (const room of config.rooms) {
    for (const bed of room.beds) {
      if (bed.canConfigure && bed.configOptions) {
        const opt = bed.configOptions[choices[bed.id] ?? 'closed']
        if (opt.linenType === 'matrimoniale') matrimoniale += opt.linenCount
        else if (opt.linenType === 'singolo') singolo += opt.linenCount
      } else {
        if (bed.defaultLinenType === 'matrimoniale') matrimoniale += bed.defaultLinenCount
        else if (bed.defaultLinenType === 'singolo') singolo += bed.defaultLinenCount
      }
    }
  }
  return { matrimoniale, singolo }
}

export interface LinenResult {
  // Lenzuola
  lenzMatrimoniali: number   // set copri-materasso matrimoniale (2 lenzuola)
  lenzSingoli:      number   // set copri-materasso singolo (2 lenzuola)
  federe:           number   // federe sacco/cuscino
  // Asciugamani (= persone totali)
  persone:          number
  // Culle (gestite separatamente)
  culle:            number
}

function bedLinen(bed: Bed, state: 'A' | 'B'): { matrim: number; singoli: number; federe: number; persone: number } {
  // Impilabile B = stesso di A (1 persona, 1 singolo)
  const effectiveState = (bed.variant === 'impilabile' && state === 'B') ? 'A' : state

  // Sommier B (2 singoli, 2 persone)
  if (bed.variant === 'sommier' && effectiveState === 'B') {
    return { matrim: 0, singoli: 4, federe: 2, persone: 2 }
  }

  // Trasformabile B (matrimoniale, 2 persone)
  if (bed.variant === 'sommier' && effectiveState === 'A' && bed.iconStates?.A === 'singolo') {
    // trasformabile stato A = singolo
    return { matrim: 0, singoli: 2, federe: 1, persone: 1 }
  }

  // Matrimoniale (standard, sommier A, trasformabile B, divano matrim)
  if (bed.baseType === 'matrimoniale' ||
      (bed.variant === 'divano' && bed.defaultLinenType === 'matrimoniale') ||
      (bed.variant === 'sommier' && effectiveState === 'A')) {
    return { matrim: 2, singoli: 0, federe: 2, persone: 2 }
  }

  // Tutti i singoli: singolo std, estraibile, impilabile A/B, poltrona,
  //                  divano singolo, castello, pavimento, trasformabile A
  return { matrim: 0, singoli: 2, federe: 1, persone: 1 }
}

export function calcLinenSetsFromBedStates(
  roomId: number,
  bedStates: Record<string, 'off' | 'A' | 'B'>,
  cribs = 0
): LinenResult {
  const config = getBedConfig(roomId)
  if (!config) return { lenzMatrimoniali: 0, lenzSingoli: 0, federe: 0, persone: 0, culle: cribs }

  let lenzMatrimoniali = 0
  let lenzSingoli      = 0
  let federe           = 0
  let persone          = 0

  for (const room of config.rooms) {
    for (const bed of room.beds) {
      const state = bedStates[bed.id] ?? 'off'
      if (state === 'off') continue
      const l = bedLinen(bed, state)
      lenzMatrimoniali += l.matrim
      lenzSingoli      += l.singoli
      federe           += l.federe
      persone          += l.persone
    }
  }

  return { lenzMatrimoniali, lenzSingoli, federe, persone, culle: cribs }
}

export default BED_CONFIGS
