# CSS Pattern Audit — Wizard + Scheda Abitazione

**Data:** 2026-04-19
**Stato:** 🟢 ratificato — decisioni §10 chiuse, input diretto per Sessione 1
**Scope:** 17 file target del [migration plan](./migration-plan.md), ~413 `style={{}}` inline da classificare
**Output uso:** input diretto per la libreria CSS della Sessione 1

---

## Sommario pattern identificati

| Categoria | # pattern unici |
|---|---|
| Bottoni / CTA | 4 |
| Card | 4 |
| Banner / alert | 6 |
| Badge | 5 |
| Label / micro-label | 3 |
| Section title / heading | 3 |
| Divider / separatore | 2 |
| Layout ricorrenti | 7 |
| **Totale pattern strutturali** | **34** |

Oltre ai pattern strutturali, emergono **~20 colori hex hardcoded** (§9) e **5 dubbi di nomenclatura/accorpamento** (§10) da risolvere con l'utente.

---

## 1. Pattern bottoni / CTA

### 1.1 `btn-cta-primary` — arancione pieno
- **Ruolo**: CTA primario (Continua, Prenota, Conferma, Paga)
- **Look**: sfondo `#FCAF1A`, testo `#fff`, border-radius 10-12px, padding 15-18px, font-weight bold, font-size 14-17px
- **Stato disabled**: background `#e0e0e0`, testo `#999`, cursor `not-allowed`
- **File**: `WizardStep1`, `WizardStep2`, `WizardStep3`, `BookingPanel`, `StickyBookingBar`, `RoomCard`
- **Frequenza**: 20+ istanze
- **Frammento rappresentativo**:
  ```jsx
  <button style={{
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    background: canContinue ? '#FCAF1A' : '#e0e0e0',
    color: canContinue ? '#fff' : '#999',
    cursor: canContinue ? 'pointer' : 'not-allowed',
    border: 'none',
    fontWeight: 'bold'
  }} disabled={!canContinue}>
    {t.continua}
  </button>
  ```

### 1.2 `btn-secondary-outline` — blu con bordo
- **Ruolo**: azione secondaria (Modifica, Indietro, Annulla)
- **Look**: border 1.5px solid `var(--color-primary)`, background `#fff`, testo `var(--color-primary)`, font-weight 600, border-radius 8-10px, padding 8-12px
- **File**: `WizardStep1`, `WizardStep2`, `WizardStep3`, `BookingPanel`
- **Frequenza**: 8+ istanze
- **Frammento rappresentativo**:
  ```jsx
  <button style={{
    border: '1px solid #1E73BE',
    background: '#fff',
    color: 'var(--color-primary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 8,
    padding: '4px 10px'
  }}>
    {editLabel}
  </button>
  ```

### 1.3 `btn-ghost` — testo puro, nessun background
- **Ruolo**: link interno, azione terziaria
- **Look**: background `none`, testo `var(--color-primary)`, font-size 12-14px, font-weight 600, border none
- **File**: `WizardStep1`, `WizardStep3`
- **Frequenza**: 5+

### 1.4 `btn-stepper` — circolare +/- per quantità
- **Ruolo**: incremento/decremento ospiti, tariffe
- **Look**: 44×44px (touch target), border-radius 50%, border 1.5px solid (variabile stato), background bianco o `var(--color-primary)`, font-size 18px, font-weight 700
- **File**: `WizardStep2`, `BookingPanel`
- **Frequenza**: 12+
- **Frammento rappresentativo**:
  ```jsx
  <button style={{
    width: 'var(--touch-target)',
    height: 'var(--touch-target)',
    borderRadius: '50%',
    border: `1.5px solid ${qty > 0 ? 'var(--color-primary)' : '#d1d5db'}`,
    background: qty > 0 ? 'var(--color-primary)' : '#fff',
    color: qty > 0 ? '#fff' : '#999',
    fontSize: 18,
    fontWeight: 700
  }}>
    {qty > 0 ? '+' : '−'}
  </button>
  ```

---

## 2. Pattern card

### 2.1 `card-offer` — selezione tariffa/appartamento
- **Ruolo**: card cliccabile per scelta con stati (normal, selected, disabled)
- **Look normal**: border 1.5px solid `#e5e7eb`, background `#fff`, border-radius 10-12px, padding 10-16px, transition `all 0.12s`
- **Look selected**: border 2px solid `var(--color-primary)`, background `#EEF5FC`
- **Look disabled**: `opacity: 0.4`, cursor default
- **File**: `WizardStep1`, `WizardStep2`, `BookingPanel`
- **Frequenza**: 15+
- **Frammento rappresentativo**:
  ```jsx
  <button style={{
    width: '100%',
    border: isPicked ? '2px solid #1E73BE' : '1.5px solid #e5e7eb',
    background: isPicked ? '#EEF5FC' : '#fff',
    borderRadius: 10,
    padding: '10px 14px',
    cursor: avail ? 'pointer' : 'default',
    opacity: avail ? 1 : 0.4,
    transition: 'all 0.12s'
  }}>
  ```

### 2.2 `card-info` — contenitore informazioni statico
- **Ruolo**: box bianco con bordo neutro per raggruppare info non interattive
- **Look**: border 1px solid `#e5e7eb`, border-radius 16px (`--radius-lg`), padding 16px, background `#fff`, box-shadow `0 2px 8px rgba(0,0,0,0.06)` opzionale
- **File**: `WizardStep2`, `WizardStep3`, `ThingsToKnow`, `BookingPanel`
- **Frequenza**: 10+

### 2.3 `card-summary-highlight` — riepilogo evidenziato (prezzo totale)
- **Ruolo**: card con sfondo blu pastello per rendere evidente il totale o un summary
- **Look**: background `#EEF5FC`, border-radius 12px, padding 14-16px, display flex justify-content space-between, border 1px solid `#b5d4f4` opzionale
- **File**: `WizardStep3`, `BookingSummary` (primitivo esistente)
- **Frequenza**: 2-3

### 2.4 `card-room-bed` — configurazione singolo letto
- **Ruolo**: card piccola rigida per mostrare un letto con eventuale badge "configurabile"
- **Look**: 200×220px, border-radius 12px, border 0.5-2px solid (`#e5e7eb` o `#FCAF1A`), padding 14px, background `#fff`, `box-sizing: border-box`
- **File**: `BedConfigDisplay`
- **Frequenza**: 1 pattern, N istanze dinamiche

---

## 3. Pattern banner / alert / notice

### 3.1 `banner-info-blue` — consumi energetici, info neutre
- **Look**: background `#f0f7ff`, border 1px solid `#bfdbfe`, border-radius 10px, padding 12-14px, testo titolo `#1e40af` font-weight 700, body `#374151`
- **File**: `WizardStep2` (energybox)
- **Frequenza**: 2
- **Frammento rappresentativo**:
  ```jsx
  <div style={{
    background: '#f0f7ff',
    border: '1px solid #bfdbfe',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 14
  }}>
    <p style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', margin: '0 0 5px' }}>
      ⚡ {t.energyTitle}
    </p>
  ```

### 3.2 `banner-warning-amber` — cauzione, depositi, avvertimenti
- **Look**: background `#fffbeb`, border 1-1.5px solid `#fcd34d`, border-radius 8-10px, padding 10-14px, testo `#92400e` / `#92610a`
- **File**: `WizardStep2` (deposit, paypal-warning)
- **Frequenza**: 2

### 3.3 `banner-accent-orange` — policy cancellazione, info piscina
- **Look**: background `#FFF8EC`, border 1px solid `#FCAF1A` (o border-left 4px), border-radius 8px, padding `var(--space-base)`, testo `#B07820`
- **File**: `WizardStep1` (pool-info), `WizardStep3` (cancelpolicy)
- **Frequenza**: 2

### 3.4 `banner-success-green` — voucher applicato, successo
- **Look**: background `#f0fdf4`, border 1px solid `#bbf7d0`, border-radius 8px, padding 6-8px, testo `#16a34a` font-weight 600
- **File**: `WizardStep2`
- **Frequenza**: 2

### 3.5 `banner-error-red` — errore generico (pattern emergente ma già parzialmente coperto da `.ui-field` in globals)
- **Look**: background `#fff5f5`, border 1px solid `#f5c6cb`, testo `#c0392b`
- **File**: `WizardStep2` (errore Stripe)
- **Frequenza**: 1-2

### 3.6 `banner-with-icon` (variante layout)
- **Look**: display flex align-items flex-start gap 8px, icon/emoji a sinistra, testo a destra. Combinabile con i 5 pattern cromatici sopra
- **Frequenza**: ricorrente

**⚠️ Osservazione architetturale**: invece di 5-6 banner separati, converrebbe **1 pattern base `.banner` + 4-5 modifier cromatici** (`.banner--info`, `.banner--warning`, `.banner--accent`, `.banner--success`, `.banner--error`) + 1 modifier strutturale `.banner--with-icon`. Vedi §10 caso F per decisione.

---

## 4. Pattern badge

### 4.1 `badge-floor-overlay` — pillola scura su foto
- **Ruolo**: label "Piano terra/rialzato/..." in overlay su immagine
- **Look**: background `rgba(0,0,0,0.55)`, testo `#fff`, font-size 11px, font-weight 600, padding 3-10px, border-radius 20px (pill), position absolute
- **File**: `WizardStep1`, `RoomCard`
- **Frequenza**: 3

### 4.2 `badge-selected` — stato "scelto"
- **Look**: background `#dbeafe`, border-radius 4-20px (pill), padding 2-8px, testo `var(--color-primary)`, font-size 11-13px, font-weight 600
- **File**: `WizardStep1`, `WizardStep2`, `BookingPanel`
- **Frequenza**: 8+

### 4.3 `badge-feature-chip` — tag dettagli (letti, bagni, ospiti)
- **Look**: background `#f5f5f5`, border 0.5px solid `#e5e7eb`, border-radius 6px, padding 3-8px, testo `#555`, font-size 11px, inline-block
- **File**: `WizardStep1`, `RoomCard`
- **Frequenza**: 5+

### 4.4 `badge-configurabile` — chip giallo/arancione per feature dinamica
- **Look**: background `#FCAF1A` o `#FFF8EC`, testo `#4a2f00` o `#B07820`, font-size 10px, font-weight 600, padding 2-8px, border-radius 6px
- **File**: `BedConfigDisplay`
- **Frequenza**: 1 pattern, N istanze

### 4.5 `badge-warning-amber` — avvertimento compatto (es. "non oscurabile")
- **Look**: background `#fde8a0`, border-radius 20px (pill), padding 2-8px, testo `#B07820`, font-size 10px, width fit-content
- **File**: `BedConfigDisplay`
- **Frequenza**: sporadica

---

## 5. Pattern label / micro-label

### 5.1 `label-uppercase-muted` — etichetta sezione piccola
- **Look**: font-size 11-13px, font-weight 600-700, text-transform uppercase, color `#6b7280` / `#374151`, letter-spacing 0.05-0.08em, margin-bottom 8-12px
- **File**: `WizardStep1`, `WizardStep2`, `WizardStep3`, `BookingPanel`
- **Frequenza**: 15+

### 5.2 `label-metadata` — testo grigio ausiliario
- **Look**: font-size 12-13px, color `#888` / `#9ca3af`, font-weight 400-500
- **File**: diffuso (20+ istanze)

### 5.3 `label-row-between` — label + valore allineati ai bordi
- **Look**: display flex justify-content space-between, label muted a sinistra, valore scuro font-weight 600 a destra
- **File**: `WizardStep2`, `WizardStep3`, `BookingPanel`
- **Frequenza**: 10+

---

## 6. Pattern section title / heading

### 6.1 `section-title-main` — h2 di pagina
- **Look**: font-size 22-26px, font-weight 700-800, color `var(--color-primary)` o `#222`, margin-bottom 20-24px
- **File**: `WizardStep1`, `WizardStep2`, `page.tsx`
- **Frequenza**: 5+

### 6.2 `section-title-secondary` — h3 sottosezione
- **Look**: font-size 16-18px, font-weight 700, color `var(--color-primary)` o `#111`, margin-bottom 12-16px
- **File**: `BookingPanel`, `WizardStep3`, `page.tsx`
- **Frequenza**: 10+

### 6.3 `hint-text` — testo ausiliario piccolissimo
- **Look**: font-size 11-12px, color `#9ca3af`, font-weight 400, margin-top 2-4px
- **File**: `WizardStep2`, `WizardStep3`, `BookingPanel`
- **Frequenza**: 5+

---

## 7. Pattern separatori / divider

### 7.1 `divider-horizontal` — linea di separazione standalone
- **Look**: `height: 1px`, `background: #e5e7eb`, `margin: 12-14px 0`
- **File**: `WizardSidebar`, `WizardStep2`, `WizardStep3`
- **Frequenza**: 10+
- **Frammento**:
  ```jsx
  <div style={{ height: 1, background: '#e5e7eb', margin: '14px 0' }} />
  ```

### 7.2 `divider-border-bottom` — bordo inferiore su elemento
- **Look**: `border-bottom: 1px solid #e5e7eb`, padding-bottom 12-14px, margin-bottom 12-14px
- **File**: `BookingPanel`, `WizardStep2`, `ThingsToKnow`
- **Frequenza**: 8+

---

## 8. Pattern layout ricorrenti

### 8.1 `layout-row-between` — flex riga con estremi
- **Look**: `display: flex`, `justify-content: space-between`, `align-items: flex-start/center/baseline`, `gap: 8-12px`
- **Frequenza**: 20+

### 8.2 `layout-grid-2col` — griglia 2 colonne (responsive)
- **Look**: `display: grid`, `grid-template-columns: 1fr 1fr`, gap 10px; collassa a 1 colonna su mobile
- **File**: `WizardStep2`, `BookingPanel`
- **Frequenza**: 5+

### 8.3 `layout-form-field` — input + label verticale
- **Look**: container div, label 12px font-weight 600 color `#6b7280` margin-bottom 4px, input width 100% padding 9-12px border 1.5px `#e5e7eb`
- **File**: `WizardStep2`, `BookingPanel`
- **Frequenza**: 10+

### 8.4 `layout-accordion-toggle` — header cliccabile + contenuto collassabile
- **Look**: button width 100% flex space-between, contenuto condizionato al click
- **File**: `WizardStep2`, `ThingsToKnow`
- **Frequenza**: 3

### 8.5 `layout-sticky-mobile-bar` — barra fissa in basso su mobile
- **Look**: `position: fixed`, `bottom 0, left 0, right 0`, background `#fff`, border-top, z-index 50-200, hidden su desktop
- **File**: `WizardStep1`, `StickyBookingBar`
- **Frequenza**: 3

### 8.6 `layout-sidebar-desktop` — pannello laterale sticky
- **Look**: width 250-380px, flex-shrink 0, position sticky top 90px, background `#f9fafb`, border-radius 16px, padding 20-24px, hidden su mobile
- **File**: `WizardSidebar`, `WizardStep2`
- **Frequenza**: 2

### 8.7 `layout-fullscreen-overlay` — fullscreen gallery/lightbox
- **Look**: position fixed inset 0, background scuro (`#1a1a1a` / `#2a2a2a`), z-index altissimo, scrollLock via `position: fixed` sul body
- **File**: `PhotoLightbox`, `PhotoCarousel`
- **Frequenza**: 2 (pattern specialistico)

---

## 9. Colori hex hardcoded — mappa token

| Hex | Contesto | Token esistente | Azione |
|---|---|---|---|
| `#FCAF1A` | CTA, accent brand | `var(--color-cta)` | ✅ usa token |
| `#1E73BE` | Primario (testo link, border) | `var(--color-primary)` | ✅ usa token |
| `#e5e7eb` | Border neutro | `var(--color-border)` | ✅ usa token |
| `#f9fafb` | Background muted | `var(--color-bg-muted)` | ✅ usa token |
| `#EEF5FC` | Highlight blu | `var(--color-primary-soft)` | ✅ usa token (verificare se esiste) |
| `#FFF8EC` | Arancione pallido (policy) | ❌ **nuovo** | `--color-accent-soft` |
| `#fcd34d` | Giallo warning/cauzione | ❌ **nuovo** | `--color-warning-border` |
| `#fffbeb` | Crema warning bg | ❌ **nuovo** | `--color-warning-bg` |
| `#f0f7ff` | Azzurro info bg | ❌ **nuovo** | `--color-info-bg` |
| `#bfdbfe` | Azzurro info border | ❌ **nuovo** | `--color-info-border` |
| `#1e40af` | Azzurro info testo | ❌ **nuovo** | `--color-info-text` |
| `#f0fdf4` | Verde success bg | ❌ **nuovo** | `--color-success-bg` |
| `#bbf7d0` | Verde success border | ❌ **nuovo** | `--color-success-border` |
| `#16a34a` | Verde success testo | `var(--color-success)` | ✅ (verificare) |
| `#fff5f5` | Rosa errore bg | ❌ **nuovo** | `--color-error-bg` |
| `#f5c6cb` | Rosa errore border | ❌ **nuovo** | `--color-error-border` |
| `#c0392b` / `#dc2626` | Rosso errore | `var(--color-error)` | ✅ usa token |
| `#B07820` / `#92610a` / `#92400e` | Testo warning scuro | ❌ **nuovo** | `--color-warning-text` (unificare?) |
| `#888` / `#9ca3af` | Muted testo | `var(--color-text-muted)` | ✅ usa token |
| `#555` / `#6b7280` / `#374151` | Label / testo secondario | `var(--color-text-label)` | ✅ usa token |
| `#111` / `#222` | Testo scuro | `var(--color-text)` | ✅ usa token |
| `rgba(0,0,0,0.55)` / `rgba(0,0,0,0.06)` | Overlay / shadow | ❌ **nuovo** | `--color-overlay-*` |
| `#fff` / `#ffffff` | Bianco puro | `var(--color-surface)` o `--color-white` | verificare esistenza |
| `#f0f4f8` | Placeholder foto | ❌ **nuovo** | `--color-photo-placeholder` |
| `#1a1a1a` / `#2a2a2a` | Dark gallery/lightbox | ❌ **nuovo** | `--color-overlay-dark` |
| `#dbeafe` | Badge selected bg | ❌ **nuovo** (o `--color-primary-soft`) | chiarire |

**Stima token nuovi da aggiungere**: ~12-15 (concentrati su stati semantici warning/info/success/error + overlay).

---

## 10. Decisioni ratificate (2026-04-19)

Tutte le scelte sono state prese insieme all'utente applicando best practice. Queste diventano la **spec** per la Sessione 1 (libreria CSS).

### ✅ Caso A — Bottoni: 1 base `.btn` + modifier BEM
```css
.btn { /* cursor, transition, font-family, base radius */ }
.btn--primary   { /* arancio pieno, padding grande */ }
.btn--secondary { /* blu outline, padding medio */ }
.btn--ghost     { /* testo puro, no bg no border */ }
.btn--stepper   { /* 44×44, radius 50% */ }
```
**HTML**: `<button className="btn btn--primary">`
**Motivo**: stesso layout base, cambia solo la "faccia". Caso canonico BEM.

### ✅ Caso B — Badge: 5 classi separate (nessuna base condivisa)
```css
.badge-selected       { /* pill blu, stato selezione */ }
.badge-feature        { /* tag grigio, attributo info */ }
.badge-overlay        { /* pill nera, su foto */ }
.badge-configurabile  { /* chip giallo/arancio, feature dinamica */ }
.badge-warning-chip   { /* pill ambra, avvertimento compatto */ }
```
**HTML**: `<span className="badge-selected">`
**Motivo**: semantica e forme diverse (pill vs tag vs overlay). Forzare una base comune creerebbe combinazioni inutili.

### ✅ Caso C — Card opzione: 1 classe `.card-option`, no varianti (YAGNI)
```css
.card-option { /* card cliccabile, stati via :hover e .is-selected */ }
.card-option.is-selected { /* border primary, bg #EEF5FC */ }
.card-option.is-disabled { /* opacity 0.4 */ }
```
**Motivo**: oggi esiste solo la versione radio (pagamento). La checkbox non c'è. Se servirà, si aggiunge un modifier.

### ✅ Caso D — Input errore: riuso `.ui-field-input.is-error` esistente
Nessuna nuova classe. Durante la migrazione sostituire:
```jsx
// prima
<input style={{ borderColor: err ? '#f97316' : undefined }} />
// dopo
<input className={`ui-field-input ${err ? 'is-error' : ''}`} />
```
**Motivo**: la classe esiste già da quando è stato fatto FormField. Riuso sempre preferibile a doppione.

### ✅ Caso E — Banner: 1 base `.banner` + 5 modifier cromatici
```css
.banner              { /* padding, radius, layout base */ }
.banner--info        { /* bg azzurro, border blu pastello, testo blu scuro */ }
.banner--warning     { /* bg crema, border amber, testo warning */ }
.banner--accent      { /* bg arancio pallido, border brand */ }
.banner--success     { /* bg verde pallido, border verde, testo verde scuro */ }
.banner--error       { /* bg rosa, border rosa, testo rosso */ }
.banner--with-icon   { /* flex align-items flex-start gap 8px (opzionale) */ }
```
**HTML**: `<div className="banner banner--warning banner--with-icon">`
**Motivo**: layout identico, cambia solo il colore. Caso canonico BEM.

### ✅ Caso F — Naming: BEM per i nuovi pattern
- Nuovi pattern di questa migrazione: **BEM** (`.block`, `.block__element`, `.block--modifier`)
- Classi esistenti (`.ui-field-input`, `.services-grid`, ecc.): **lasciate intatte** per non rompere nulla
- Le due convenzioni convivono. Nessun rinominamento "bonus".

### ✅ Caso G — `--color-warning` separato da `--color-cta` (decisione D.Y)
```css
/* prima */
--color-cta: #FCAF1A;
--color-warning: #FCAF1A;     /* duplicato */
--color-brand-accent: #FCAF1A; /* duplicato */

/* dopo */
--color-cta: #FCAF1A;           /* resta invariato — "clicca qui" */
--color-brand-accent: #FCAF1A;  /* resta invariato — identità brand */
--color-warning: #F59E0B;       /* nuovo — "attenzione", più giallo */
```
**Motivo**: CTA e warning hanno significati semantici diversi. Colori diversi per significati diversi. I banner warning oggi usano già toni giallo-pallido (#FFF8EC, #fcd34d), la separazione è coerente con lo stato di fatto.

### ✅ Caso H — Blu selezione: unificare su `#EEF5FC`, deprecare `#dbeafe`
```css
--color-primary-soft: #EEF5FC;  /* unico token per tutti gli stati "selected" */
/* #dbeafe: eliminato — chiunque lo usi passa a var(--color-primary-soft) */
```
**Motivo**: evitare micro-variazioni cromatiche non intenzionali. Unificare sul tono più leggero che funziona sia per bg grandi (card) sia per pillole (badge).

### Token nuovi da aggiungere in `globals.css` (Sessione 1)

```css
/* stati semantici */
--color-warning: #F59E0B;           /* nuovo, vedi Caso G */
--color-warning-bg: #fffbeb;
--color-warning-border: #fcd34d;
--color-warning-text: #92400e;

--color-info-bg: #f0f7ff;
--color-info-border: #bfdbfe;
--color-info-text: #1e40af;

--color-success-bg: #f0fdf4;
--color-success-border: #bbf7d0;
--color-success-text: #16a34a;

--color-error-bg: #fff5f5;
--color-error-border: #f5c6cb;
--color-error-text: #c0392b;

--color-accent-soft: #FFF8EC;        /* arancio pallido per banner accent */
--color-accent-text: #B07820;

/* overlay / utility */
--color-overlay-dark: rgba(0,0,0,0.55);
--color-overlay-gallery: #1a1a1a;
--color-photo-placeholder: #f0f4f8;
```

---

## 11. Rischi / alert per sessioni successive

### ⚠️ Sessione 11 (AvailabilityCalendar) — calcoli JS + CSS grid intrecciati
Il layout del calendario si basa su `buildCells`, `toYMD`, `diffNights`. Modificare CSS di celle o grid può rompere la logica di highlight range. **Testare disponibilità real + selezione range dopo ogni commit.**

### ⚠️ Sessione 10 (PhotoLightbox/PhotoCarousel) — scrollLock non standard
Usano `document.body.style.position = 'fixed'` + top negativo per bloccare scroll su iOS Safari (overflow:hidden non funziona). **Non toccare gli style applicati al body durante il fullscreen.**

### ⚠️ Sessione 5 (WizardStep2) — PayPal SDK caricato dinamicamente
Container `#paypal-button-container` deve restare render-stabile. Se CSS cambia mentre lo script si carica, i bottoni PayPal possono non renderizzarsi. **Mantenere contenitore intatto durante loading.**

### ⚠️ Sessione 5-6 (WizardStep2/3) — logica Stripe non va toccata
Il piano è esplicito (§10 — "Non tocca il contenuto / logica"). Solo CSS. **Se serve toccare una handler, stop e chiedi.**

### ⚠️ Sessione 8 (BedConfigDisplay) — badge in position absolute + overflow hidden
Card-bed ha `overflow: hidden` ma il badge è `position: absolute top: -1`. Su mobile stretto il badge può essere tagliato. **Screenshot mobile obbligatorio.**

### ⚠️ Sessione 7 (page.tsx) — griglia servizi già in CSS class
`.services-grid` è già in `globals.css`. Non rifattorizzare, solo eliminare inline residui. **Verificare regressione servizi su tutte le property (46487, 46871).**

### ⚠️ Decisioni colore (§6 del piano) da chiudere PRIMA di procedere
- **D.Y** (`--color-warning` distinto): risolvere prima Sessione 1 (libreria)
- **D.X** (unificare blu logo/sito): risolvere prima Sessione 7 (scheda abitazione usa `--color-primary` intensivamente)

---

## 12. Prossimi passi

1. ✅ Decisioni §10 ratificate (2026-04-19)
2. ✅ Decisione D.Y (separare `--color-warning`) ratificata → vedi Caso G
3. ⏳ **Sessione 1** — scrittura classi BEM in `globals.css` + nuovi token + `docs/design-system/css-library.md`
4. ⏳ **Sessioni 2+** — migrazione file per file, una alla volta

### Decisione ancora aperta (non bloccante per Sessione 1)

- **D.X del piano** — unificare `#006cb7` (logo blue) con `#1E73BE` (`--color-primary`)?
  Da risolvere **prima della Sessione 7** (scheda abitazione usa `--color-primary` intensivamente). Durante le Sessioni 1-6 del wizard non è bloccante.

---

## 13. File letti integralmente (checklist)

### Wizard (5 file)
- [x] `components/wizard/Wizard.tsx`
- [x] `components/wizard/WizardSidebar.tsx`
- [x] `components/wizard/WizardStep1.tsx`
- [x] `components/wizard/WizardStep2.tsx`
- [x] `components/wizard/WizardStep3.tsx`

### Scheda abitazione (12 file)
- [x] `app/[locale]/residenze/[slug]/page.tsx`
- [x] `components/residenze/RoomCard.tsx`
- [x] `components/residenze/PropertyMap.tsx`
- [x] `components/residenze/ThingsToKnow.tsx`
- [x] `components/residenze/StickyBookingBar.tsx`
- [x] `components/residenze/CardPhotoGallery.tsx`
- [x] `components/residenze/BedConfigDisplay.tsx`
- [x] `components/residenze/BookingPanel.tsx`
- [x] `components/residenze/PhotoLightbox.tsx`
- [x] `components/residenze/PhotoCarousel.tsx`
- [x] `components/residenze/AvailabilityCalendar.tsx`
- [x] `components/residenze/FotoGalleryClient.tsx`
