# Libreria CSS — riferimento classi Sessione 1

**Data:** 2026-04-19
**Stato:** 🟢 attiva — input per Sessioni 2+ del [migration plan](../ux/migration-plan.md)
**Spec:** [css-pattern-audit.md §10](../ux/css-pattern-audit.md)
**File sorgente:** [`app/globals.css`](../../app/globals.css)

Questa libreria è l'output della **Sessione 1** del migration plan: ~34 classi BEM + 16 token nuovi scritti in `globals.css`. Le sessioni successive (2–12) migrano i 17 file del scope Fase B usando **queste classi** (nessun nuovo CSS locale, nessuna classe ad-hoc).

---

## 1. Come si usa

### Regole d'uso

1. **Cerca qui prima di inventare classi**. Ogni pattern della Fase B è già mappato. Se un pattern sembra mancare, non inventare — torna al [css-pattern-audit](../ux/css-pattern-audit.md) e segnala.
2. **BEM strict**: `.block`, `.block__element`, `.block--modifier`. Stati via `.is-*` (`.is-selected`, `.is-disabled`, `.is-active`).
3. **Combina modifier con spazio**, non trattini: `<div className="banner banner--warning banner--with-icon">`.
4. **Token sempre via `var(--color-*)` / `var(--space-*)`**. Mai hex hardcoded in componenti. Se il token manca, aggiungilo in `globals.css` **prima** di usarlo.
5. **Classi esistenti (`.ui-field-*`, `.services-grid`, `.bed-*`) non si rinominano**. Convivono con la nuova convenzione BEM (Caso F dell'audit).

### Workflow sessione di migrazione

```
1. Leggi il file da migrare integralmente
2. Per ogni style={{...}} trovato:
   a. Mappa a una classe qui sotto
   b. Sostituisci style={{...}} → className="..."
   c. Hex hardcoded → var(--color-*)
   d. Numero magico → var(--space-*) / var(--radius-*) / var(--text-*)
3. Solo valori dinamici (es. width: ${progress}%) restano inline — commenta il perché
4. npx tsc --noEmit
5. Commit atomico
```

---

## 2. Token design nuovi (Sessione 1)

### Stati semantici
Tutti i banner/alert hanno triple `bg/border/text` per coerenza cromatica.

| Token | Valore | Uso |
|---|---|---|
| `--color-warning` | `#F59E0B` | **[Cambiato]** era `#FCAF1A`. Ora distinto da CTA (Caso G) |
| `--color-warning-bg` | `#fffbeb` | Sfondo banner warning |
| `--color-warning-border` | `#fcd34d` | Bordo banner warning |
| `--color-warning-text` | `#92400e` | Testo su sfondo warning |
| `--color-info-bg` | `#f0f7ff` | Sfondo banner info (neutro/energetico) |
| `--color-info-border` | `#bfdbfe` | Bordo banner info |
| `--color-info-text` | `#1e40af` | Testo su sfondo info |
| `--color-success-bg` | `#f0fdf4` | Sfondo banner success |
| `--color-success-border` | `#bbf7d0` | Bordo banner success |
| `--color-success-text` | alias `--color-success` (`#16a34a`) | Testo success |
| `--color-error-bg` | `#fff5f5` | Sfondo banner errore |
| `--color-error-border` | `#f5c6cb` | Bordo banner errore |
| `--color-error-text` | alias `--color-danger` (`#c0392b`) | Testo errore |

### Accent brand (non-warning arancio)
| Token | Valore | Uso |
|---|---|---|
| `--color-brand-accent` | alias `--color-cta` (`#FCAF1A`) | Identità brand (logo, bordi accent) |
| `--color-accent-soft` | `#FFF8EC` | Sfondo banner policy / info piscina (arancio pallido) |
| `--color-accent-text` | `#B07820` | Testo scuro su `--color-accent-soft` |

### Overlay / utility
| Token | Valore | Uso |
|---|---|---|
| `--color-overlay-dark` | `rgba(0,0,0,0.55)` | Badge scuro su foto, sfumature |
| `--color-overlay-gallery` | `#1a1a1a` | Fondo lightbox / gallery fullscreen |
| `--color-photo-placeholder` | `#f0f4f8` | Bg mentre le foto caricano |

### Note di deprecazione
- `#dbeafe` — **non usare**. Qualunque selezione blu passa a `var(--color-primary-soft)` (Caso H).
- `var(--color-warning)` per CTA — **mai**. Usa `var(--color-cta)`. Le pagine fuori scope erano state fixate nei commit `9fc6a84` e `09ca5f9`.

---

## 3. Classi — riferimento completo

### 3.1 Bottoni (Caso A — 1 base + 4 modifier)

| Classe | Ruolo | Token usati |
|---|---|---|
| `.btn` | Base: cursore, transition, focus-ring, stato disabled | `--radius-sm`, `--focus-ring` |
| `.btn--primary` | CTA piena arancione (Continua, Prenota, Conferma, Paga) | `--color-cta`, `--color-on-dark`, `--radius-md`, `--touch-target` |
| `.btn--secondary` | Azione secondaria blu outline (Modifica, Indietro, Annulla) | `--color-primary`, `--color-primary-soft` |
| `.btn--ghost` | Link inline / azione terziaria | `--color-primary` |
| `.btn--stepper` | +/- circolare per quantità. Con `.is-active` diventa primary-filled | `--touch-target`, `--radius-pill`, `--color-border` |

**Esempi JSX:**

```jsx
<button className="btn btn--primary" disabled={!canContinue}>
  {t.continua}
</button>

<button className="btn btn--secondary">{t.modifica}</button>

<button className="btn btn--ghost">{t.seeDetails}</button>

<button className={`btn btn--stepper ${qty > 0 ? 'is-active' : ''}`}>
  {qty > 0 ? '+' : '−'}
</button>
```

**Disabled**: sia `:disabled` (HTML) sia `.is-disabled` (classe) funzionano — usare quello appropriato al contesto (`disabled` per `<button>`, `.is-disabled` per elementi non nativi).

### 3.2 Card (Caso C)

| Classe | Ruolo | Token usati |
|---|---|---|
| `.card-option` | Card cliccabile per scelta (radio-like). Stati via `.is-selected`, `.is-disabled` | `--color-border`, `--color-primary`, `--color-primary-soft`, `--radius-md` |
| `.card-info` | Box statico bianco con bordo neutro | `--color-bg`, `--color-border`, `--radius-lg` |
| `.card-info--elevated` | Modifier: aggiunge `--shadow-md` | `--shadow-md` |
| `.card-summary-highlight` | Riga riepilogo evidenziata blu pastello (totale, voucher) | `--color-primary-soft`, `--radius-md` |
| `.card-room-bed` | Card configurazione letto (200×220px). `.is-configurable` → bordo arancio | `--color-border`, `--color-cta`, `--radius-md` |

**Esempi:**

```jsx
<button
  className={`card-option ${picked ? 'is-selected' : ''} ${!avail ? 'is-disabled' : ''}`}
  disabled={!avail}
>
  {content}
</button>

<div className="card-info card-info--elevated">{summary}</div>

<div className="card-summary-highlight">
  <span>Totale</span>
  <strong>€{total}</strong>
</div>
```

**Nota scope**: oggi esiste solo la variante radio (pagamento). Se emerge una checkbox in futuro, si aggiunge un modifier `.card-option--checkbox` — non si crea una classe nuova.

### 3.3 Banner (Caso E — 1 base + 5 modifier cromatici)

| Classe | Ruolo |
|---|---|
| `.banner` | Base: padding, radius, font-size, line-height |
| `.banner--info` | Azzurro (consumi energetici, info neutre) |
| `.banner--warning` | Giallo (cauzione, depositi, avvertimenti) |
| `.banner--accent` | Arancio pallido (policy cancellazione, info piscina) |
| `.banner--success` | Verde (voucher applicato, successo) |
| `.banner--error` | Rosa (errore Stripe, errore generico) |
| `.banner--with-icon` | Modifier layout: flex + gap per icon/emoji |
| `.banner--stack` | Modifier layout: flex-column centrato (es. errore step 1 con titolo + testo + retry stacked) |

**Esempi:**

```jsx
<div className="banner banner--warning banner--with-icon">
  <span>⚠️</span>
  <div>
    <p className="banner-title">Cauzione richiesta</p>
    <p>Verrà addebitata al check-in.</p>
  </div>
</div>

<div className="banner banner--info">
  <strong>⚡ Consumi energetici</strong>
  <p>Inclusi nel prezzo fino a 10 kWh/giorno.</p>
</div>
```

### 3.4 Badge (Caso B — 5 classi separate, nessuna base condivisa)

| Classe | Ruolo | Quando |
|---|---|---|
| `.badge-selected` | Pill blu "selezionato" | Card residenza scelta, pagamento scelto |
| `.badge-feature` | Tag grigio neutro | Letti, bagni, ospiti, metratura |
| `.badge-overlay` | Pill scura in `position: absolute` | Label "Piano terra" su foto |
| `.badge-configurabile` | Chip arancio pieno | Letto configurabile su carousel letti |
| `.badge-configurabile--soft` | Modifier: tinta arancio pallido | Variante meno aggressiva |
| `.badge-warning-chip` | Pill ambra "non oscurabile" | Avvertimenti compatti su card letto |

**Esempi:**

```jsx
<span className="badge-selected">✓ Scelto</span>
<span className="badge-feature">2 bagni</span>
<span className="badge-overlay">Piano terra</span>
<span className="badge-configurabile">Configurabile</span>
<span className="badge-warning-chip">Non oscurabile</span>
```

**Perché non una base condivisa?** Le forme (pill vs tag vs overlay) e semantiche (selezione vs info vs warning vs accent) sono abbastanza diverse che forzarle in un pattern BEM unico creerebbe combinazioni inutili o contorte.

### 3.5 Label / micro-label

| Classe | Ruolo |
|---|---|
| `.label-uppercase-muted` | Etichetta sezione piccola (`SEZIONE`, `I TUOI DATI`) |
| `.label-metadata` | Testo grigio ausiliario (note di dettaglio) |
| `.label-row-between` | Riga con label a sx e valore a dx (allineati ai bordi) |
| `.label-row-between__label` | Elemento label (font-size xs, muted) |
| `.label-row-between__value` | Elemento valore (font-size sm, bold, text-right) |

**Esempi:**

```jsx
<p className="label-uppercase-muted">I tuoi dati</p>
<span className="label-metadata">Incluso nella tariffa</span>

<div className="label-row-between">
  <span className="label-row-between__label">Tassa di soggiorno</span>
  <span className="label-row-between__value">€5,00</span>
</div>
```

### 3.6 Section title / heading

| Classe | Ruolo | Font-size |
|---|---|---|
| `.section-title-main` | H2 di pagina (titolo principale dello step/sezione) | `--text-xl` (22px) |
| `.section-title-secondary` | H3 sottosezione | `--text-lg` (18px) |
| `.hint-text` | Testo ausiliario piccolissimo sotto un campo/valore | `--text-xs` (12px) |

**Esempi:**

```jsx
<h2 className="section-title-main">Scegli la tariffa</h2>
<h3 className="section-title-secondary">Dati ospite</h3>
<p className="hint-text">Il prezzo include pulizie finali.</p>
```

### 3.7 Divider / separatore

| Classe | Ruolo |
|---|---|
| `.divider-horizontal` | Linea standalone (`<hr>` o `<div>`) tra blocchi |
| `.divider-border-bottom` | Bordo inferiore su elemento (padding-bottom + margin-bottom) |

**Esempi:**

```jsx
<hr className="divider-horizontal" />
<div className="divider-horizontal" />  {/* se serve un non-semantic hr */}

<section className="divider-border-bottom">
  {content}
</section>
```

### 3.8 Wizard container (pattern specifico `/prenota`)

| Classe | Ruolo | Token usati |
|---|---|---|
| `.wizard-container` | Shell di pagina: `max-width --container-lg`, padding responsive (più laterale ≥768px) | `--container-lg`, `--space-lg`, `--space-base`, `--space-xl` |
| `.wizard-container__layout` | Riga flex sidebar + main, `gap --space-xl` | `--space-xl` |
| `.wizard-container__main` | Colonna main (`flex:1`, `min-width:0`, `max-width --container-sm`) | `--container-sm` |
| `.wizard-container__main--full` | Modifier: `max-width: none` (usato su step 2/3 dove il main prende tutto) | — |
| `.wizard-container__sidebar` | Wrapper sidebar: `display:none` mobile, `block` ≥768px | — |
| `.wizard-loading` | Stato "Caricamento..." centrato verticalmente (min-height 40vh) | `--color-text-muted`, `--text-md`, `--space-md` |
| `.wizard-loading-spinner` | Spinner circolare 22×22 con rotazione `wizard-spin` 0.8s | `--color-border`, `--color-primary`, `--radius-pill` |

**Esempio:**

```jsx
<div className="wizard-container">
  <Stepper ... />
  <div className="wizard-container__layout">
    <div className={`wizard-container__main ${fullWidth ? 'wizard-container__main--full' : ''}`}>
      {stepContent}
    </div>
    {showSidebar && (
      <div className="wizard-container__sidebar">
        <WizardSidebar ... />
      </div>
    )}
  </div>
</div>
```

**Nota scope**: queste classi sono **specifiche del wizard** (un'istanza nel sito). Vivono nella libreria perché la regola è "zero CSS locale", non perché siano pattern generici. Se emergeranno altri container a 2 colonne, si valuterà se generalizzare.

### 3.9 Layout ricorrenti

| Classe | Ruolo |
|---|---|
| `.layout-row-between` | Flex riga con estremi (`space-between`, `align-items: center` di default) |
| `.layout-row-between--start` | Modifier: `align-items: flex-start` |
| `.layout-row-between--baseline` | Modifier: `align-items: baseline` |
| `.layout-grid-2col` | Griglia 2 colonne su desktop, 1 su mobile (breakpoint 640px) |
| `.layout-form-field` | Container verticale per label + input + hint |
| `.layout-accordion-toggle` | Button a tutta larghezza per header accordion |
| `.layout-sticky-mobile-bar` | Barra fissa in basso, hidden su desktop (≥768px) |
| `.layout-sidebar-desktop` | Pannello laterale sticky, hidden su mobile (<768px) |
| `.layout-fullscreen-overlay` | Posizione fissa edge-to-edge per lightbox/gallery |

**Esempi:**

```jsx
<div className="layout-row-between">
  <span>Totale</span>
  <strong>€420</strong>
</div>

<div className="layout-grid-2col">
  <FormField label="Nome" />
  <FormField label="Cognome" />
</div>

<div className="layout-sticky-mobile-bar">
  <button className="btn btn--primary">Prenota</button>
</div>
```

### 3.10 WizardStep1 — scelta residenza (Sessione 4)

Pattern specifici dello step 1 del wizard `/prenota`. Ogni sottoblocco è autonomo; nessuna base condivisa perché i pattern sono contestuali.

**Riassunto prenotazione (in cima allo step)**

| Classe | Ruolo |
|---|---|
| `.card-info--compact` | Modifier di `.card-info`: padding e margin-bottom ridotti a `--space-md` (per box riassunto date) |
| `.step1-summary__dates` | Riga date "8 apr – 15 apr" (`text-base`, 700, nero) |
| `.step1-summary__meta` | Sottoriga "7 notti · 2 adulti, 1 bambino (5a)" (`text-sm`, muted) |
| `.step1-summary__edit-btn` | Bottone "modifica" icona freccia (touch-target, no background) |

**Filter bar** (riga scrollabile orizzontale sotto il titolo)

| Classe | Ruolo |
|---|---|
| `.step1-filter-bar` | Container: flex + `overflow-x:auto`, scrollbar nascosta |
| `.step1-filter-btn` | Bottone "Filtri" pill, bordo nero; con `.is-active` diventa arancio (`--color-cta`) — audit §1.3 |
| `.step1-filter-btn__count` | Badge conteggio dentro il bottone (tondo 20×20, `--color-accent-text`) |
| `.step1-filter-chip` | Chip filtro attivo (blu pastello, con "×" per rimuovere) |
| `.step1-filter-chip__x` | Glifo × dentro il chip |

**Filter modal** (bottom-sheet mobile / centered desktop)

| Classe | Ruolo |
|---|---|
| `.filter-modal__overlay` | Overlay nero 50% (fixed inset:0, z-300) |
| `.filter-modal__panel` | Contenitore base (flex column, hidden overflow) |
| `.filter-modal__panel--bottom-sheet` | Modifier mobile: ancorato in basso, 85vh, radius top |
| `.filter-modal__panel--centered` | Modifier desktop: centrato, 560px, radius-lg |
| `.filter-modal__header` | Header fisso con X, titolo, reset |
| `.filter-modal__close-btn` | Bottone X tondo 32px |
| `.filter-modal__clear-btn` | Link "reset" sottolineato a destra |
| `.filter-modal__body` | Body scrollabile (`overflow-y: scroll`) |
| `.filter-modal__body-spacer` | Spacer in fondo al body (evita che l'ultimo elemento tocchi il footer) |
| `.filter-modal__section` | Sezione filtro (padding top/bottom) |
| `.filter-modal__section-title` | Titolo sezione ("Ordina per", "Piscina", ecc.) — **non uppercase** per coerenza col modale |
| `.filter-modal__divider` | Divider tra sezioni (alternativa a `.divider-horizontal` senza margin) |
| `.filter-modal__radio-row` | Riga radio list (sort), con `.is-active` il testo diventa blu + bold |
| `.filter-modal__radio-label` | Label testo della riga |
| `.filter-modal__radio-dot` | Cerchio radio custom 20×20; con `.is-active` sul parent si riempie di blu |
| `.filter-modal__radio-dot-inner` | Pallino interno bianco (visibile solo quando `.is-active`) |
| `.filter-modal__pills` | Container dei pill filter (flex wrap) |
| `.filter-pill` | Pill filter generico (mare, piscina, tipo, camere); `.is-active` → blu selezionato |
| `.filter-modal__footer` | Footer fisso con CTA "Applica" |

**Nota**: il CTA "Applica" usa `.btn .btn--primary` (no classe dedicata). Il banner info piscina aperta usa `.banner .banner--accent .banner--with-icon` (audit §1.4, già in libreria §3.3).

**Loading & empty states**

| Classe | Ruolo |
|---|---|
| `.step1-loading` | Container centrato verticalmente |
| `.step1-loading__spinner` | Spinner 38×38 (grande, dedicato; `.wizard-loading-spinner` è 22×22 per intro wizard) |
| `.step1-loading__label` | Testo "Caricamento tariffe..." |
| `.step1-empty-state` | Box "nessun risultato" (bg muted, radius-md) |

**Room card VRBO** (verticale mobile, 3 colonne ≥768px)

| Classe | Ruolo |
|---|---|
| `.step1-room-card` | Card base; con `.is-selected` bordo blu + glow azzurrino |
| `.step1-room-card__row` | Flex column (mobile) / flex row (desktop ≥768px) |
| `.step1-room-card__photo` | Colonna foto (180px alto mobile, 220px largo desktop) |
| `.step1-room-card__photo-link` | Wrapper cliccabile per router.push(/residenze/slug) |
| `.step1-room-card__photo-img` | `<img>` cover della residenza |
| `.step1-room-card__photo-placeholder` | Fallback quando Cloudinary non ha la cover |
| `.step1-room-card__floor` | Posizionamento del `.badge-overlay` sopra la foto (top/left 10px) |
| `.step1-room-card__details` | Colonna centrale: nome + chip metadati |
| `.step1-room-card__name` | Nome residenza (`text-lg` 700 blu) |
| `.step1-room-card__meta-chips` | Wrapper flex-wrap per i `.badge-feature` (camere, mq, piscina, location) |
| `.step1-room-card__offers` | Colonna tariffe |

**Offer option** (bottone tariffa nella colonna destra della card)

| Classe | Ruolo |
|---|---|
| `.step1-offer-option` | Bottone base; con `.is-selected` bordo blu + background `--color-primary-soft`; `:disabled` → opacity 0.4 |
| `.step1-offer-option__info` | Colonna sinistra: nome + descrizione |
| `.step1-offer-option__name-row` | Riga nome + tag "selezionata" |
| `.step1-offer-option__name` | Nome tariffa (text-sm, 700) |
| `.step1-offer-option__selected-tag` | Tag "selezionata" blu |
| `.step1-offer-option__desc` | Descrizione offerta (11px, muted) |
| `.step1-offer-option__unavail` | "Non disponibile" rosso error |
| `.step1-offer-option__price-col` | Colonna destra prezzo (text-align right) |
| `.step1-offer-option__price` | Prezzo totale 19px 800 blu |
| `.step1-offer-option__per-night` | Prezzo per notte (11px muted) |
| `.step1-offer-option__total-label` | Label "totale" minuscola (10px muted) |
| `.step1-offer-expand-btn` | Bottone "Vedi tutte le tariffe ▾" / "Meno ▴" (solo desktop con più offerte) |

**Back link**

| Classe | Ruolo |
|---|---|
| `.step1-back-link` | Link "← Indietro" sotto la lista (blu, padding generoso per non sovrapporsi alla sticky CTA mobile) |

**CTA finale**: il bottone "Continua" usa `.layout-sticky-mobile-bar` (wrapper) + `.btn .btn--primary` (bottone). Nessuna classe custom.

### 3.11 WizardStep2 — pagamento + dati ospite (Sessione 5)

Pattern specifici dello step 2 del wizard `/prenota`. Copre la colonna form sinistra + accordion mobile header. Il `SidebarContent` legacy e il sub-component `SideRow` (usati solo dall'accordion mobile) **restano fuori scope** — saranno migrati nella futura sessione mobile dedicata.

**Layout + accordion mobile**

| Classe | Ruolo |
|---|---|
| `.wizard-step2` | Root wrapper (min-height 100vh) |
| `.wizard-step2__layout` | Flex row: form + sidebar desktop (gap `--space-xl`) |
| `.wizard-step2__main` | Colonna form: `flex:1`, `max-width --container-sm` (680px) |
| `.wizard-step2__sidebar` | Wrapper sidebar desktop; `display:none` ≤767px |
| `.wizard-step2__summary-accordion` | Cappuccio accordion mobile; `display:block` ≤767px |
| `.wizard-step2__summary-accordion-btn` | Header cliccabile accordion (totale + chevron) |
| `.wizard-step2__summary-accordion-chevron` | Chevron; con `.is-open` ruota 180° |
| `.wizard-step2__summary-accordion-body` | Body accordion (padding, contiene `<SidebarContent />` legacy) |

**Section card** (audit §2.3–§2.4)

| Classe | Ruolo |
|---|---|
| `.step2-section-card` | Card bianca con `--shadow-sm` (audit §2.3) |
| `.step2-section-header` | Flex: number badge + title |
| `.step2-section-number` | Cerchio blu 28×28 con numero "1"/"2" (fw 800) |
| `.step2-section-title` | Titolo sezione `--text-md` (15px, audit §2.4 ridotto da 17) |

**Radio pagamento**

| Classe | Ruolo |
|---|---|
| `.step2-radio-row` | Card radio metodo pagamento; con `.is-selected` bordo blu + bg primary-soft |
| `.step2-radio-dot` | Cerchio radio 20×20; bordo blu quando il parent è `.is-selected` |
| `.step2-radio-dot-inner` | Pallino interno blu 10×10 (visibile solo quando selezionato) |
| `.step2-radio-label` | Label metodo (Stripe / PayPal) |
| `.step2-radio-note` | Testo descrittivo sotto la label (grigio) |
| `.step2-paypal-chip` | Chip "PayPal" brand (navy su light blue) — colori marchio, non token |

**Form**

| Classe | Ruolo |
|---|---|
| `.step2-form-grid-2` | Grid 2 colonne sempre (nome/cognome, telefono/paese) |
| *(riuso)* `.ui-field-wrapper` / `.ui-field-label` / `.ui-field-input` / `.ui-field-textarea` | Campi form — già in libreria (§ UI primitive) |

**CTA + footer**

| Classe | Ruolo |
|---|---|
| `.step2-cta` | Modifier di `.btn .btn--primary`: padding/font boost (`--text-lg`, fw 800) per il "Vedi riepilogo" |
| `.step2-terms` | Testo "Termini e condizioni" centrato sotto CTA |
| `.step2-back-link` | Link "Indietro" sotto i termini |

**Errore**: usa `.banner .banner--error` (già in libreria §3.3).

### 3.12 Scheda abitazione — parte statica (Sessione 7)

Pattern della pagina `/[locale]/residenze/[slug]` + card list + mappa + accordion "Cose da sapere" + sticky CTA.

**Page shell**

| Classe | Ruolo |
|---|---|
| `.room-page` | Main container scheda: `max-width --container-page` (1100), padding responsive con safe-area 120px bottom per sticky CTA |
| `.room-page__meta` | Sottotitolo distance + floor (text-xs muted) |
| `.room-page__description` | Testo descrizione lunga (text-subtle, line-height relaxed, white-space pre-line) |
| `.room-feature-card__num` | Numero grande dentro card feature (text-lg bold primary) |
| `.room-services__item` | Row servizio (icon + label, text-base) |
| `.room-services__icon` | Icona servizio (text-lg primary) |

**PropertyMap**

| Classe | Ruolo |
|---|---|
| `.room-map__title` | H2 mappa con emoji |
| `.room-map__frame` | Wrapper iframe con bordo + shadow + radius-lg |

**ThingsToKnow (accordion)**

| Classe | Ruolo |
|---|---|
| `.things-to-know` | Card accordion (radius-lg, border, overflow hidden) |
| `.things-to-know__header` | Button header blu pieno (text-lg, bianco su `--color-primary`) |
| `.things-to-know__body` | Container corpo espanso |
| `.things-to-know__body p` | line-height 1.6 su tutti i paragrafi interni (selettore contestuale) |

**StickyBookingBar**

| Classe | Ruolo |
|---|---|
| `.sticky-booking-bar` | Bar fissa bottom (z 200, transform translateY(100%) di default, transition) |
| `.sticky-booking-bar.is-visible` | Stato visibile: transform 0 + pointer-events auto |
| `.sticky-booking-bar__inner` | Container max-width-page, flex tra info e CTA |
| `.sticky-booking-bar__info` | Colonna sinistra (flex-1, min-w-0 per truncate) |
| `.sticky-booking-bar__name` | Nome residenza (text-sm fw 700 truncate) |
| `.sticky-booking-bar__price` | Prezzo totale (text-md fw 700 primary) |
| `.sticky-booking-bar__price-suffix` | Suffisso "totale" (text-xs muted) |

### 3.13 BedConfigDisplay + CardPhotoGallery (Sessione 8)

Estensioni dei pattern card residenza (letti) e gallery foto (cover + lightbox).

**BedConfigDisplay** — riusa `.card-room-bed` (§3.2) e `.badge-warning-chip` (§3.4) già in libreria. Classi aggiuntive:

| Classe | Ruolo |
|---|---|
| `.bed-card__badge-top` | Badge "Configurabile" pieno arancio (top-right della card) |
| `.bed-card__badge-top--soft` | Variante soft (bg `--color-accent-soft`) |
| `.bed-card__room-label` | Label uppercase della camera (es. "CAMERA 1") |
| `.bed-card__bed-label` | Testo descrittivo del letto |
| `.bed-option-pills` | Container flex-column delle due opzioni sommier/impilabile |
| `.bed-option-pill` | Pill primary (blu — opzione corrente) |
| `.bed-option-pill--secondary` | Pill grigio (opzione alternativa) |
| `.bed-option-separator` | "OR" / "oppure" tra le due opzioni |
| `.bed-config__scroll` | Flex horizontal scroll mobile |
| `.bed-config__scroll-hint-text` | Testo hint "scrolla" mobile |
| `.bed-config__note` | Box info "configurabile al portale" (fondo sezione) |
| `.bed-config__note-icon` / `.bed-config__note-text` | Elementi interni box |

**CardPhotoGallery** (cover cliccabile verso la scheda residenza)

| Classe | Ruolo |
|---|---|
| `.card-gallery` | Wrapper cover 220px bg grigio (Link alla scheda) |
| `.card-gallery__img` | Img cover object-fit cover con hover scale 1.04 (via selettore `:hover` del parent) |
| `.card-gallery__no-photo` | Placeholder "Foto in arrivo" centrato |

**Nota storica**: `CardPhotoGallery.tsx` aveva originariamente anche una modalità "lightbox fullscreen" attivata quando `linkHref` era omesso, con le relative classi `.lightbox__*`. Era dead code (nessuno la invocava mai) e duplicava il lightbox vero di `PhotoCarousel.tsx` (Sessione 10, ramo desktop fullscreen). Rimossa nel cleanup di Sessione 8 (commit `9677c53` per il TSX, commit cleanup CSS per le classi).

**Token aggiunti**: `--container-page: 1100px` (nuovo, usato da `.room-page` e `.sticky-booking-bar__inner`).

### 3.14 PhotoCarousel + AvailabilityCalendar (Sessione 10+11)

Pattern gallery foto (preview desktop + preview touch + lightbox fullscreen) e calendario disponibilità. Tutto il lightbox è costruito sopra `.layout-fullscreen-overlay` (Sessione 1).

> **Nota**: la Sessione 10 è stata originariamente pianificata per `PhotoCarousel + PhotoLightbox`. `PhotoLightbox.tsx` è stato successivamente rimosso perché dead code orfano (commit `93e11b0`, cleanup post-Session 12). Le classi dedicate a `PhotoLightbox` (`.photo-preview-grid--2`, `.lightbox-photo--centered`, `.lightbox-photo-centered-wrap`, `.lightbox-arrow--sm`, `.lightbox-arrow--left/--right`, `.lightbox-dots-bar`, `.lightbox--touch-lock`, `.photo-dots--dark`) sono state rimosse nel commit `4e938bb`. Quanto segue documenta solo lo stato attuale.

**Photo preview (PhotoCarousel)**

| Classe | Ruolo |
|---|---|
| `.photo-preview--touch` | Container foto singola touch (aspect 4:3, max-h 60vh, cursor pointer) |
| `.photo-preview--touch__img` | Img cover absolute inset 0 |
| `.photo-preview-grid` | Griglia desktop base (radius-lg, height 420, cursor pointer) |
| `.photo-preview-grid--5` | Modifier: `2fr 1fr 1fr` (PhotoCarousel, hero + 4 tile) |
| `.photo-preview-grid__hero` | Cella hero (`grid-row: 1/3`) con hover scale 1.03 sull'img figlio |
| `.photo-preview-grid__cell` | Cella tile secondaria con hover scale 1.05 sull'img figlio |
| `.photo-preview-grid__cell-empty` | Placeholder grigio scuro quando `photos[i]` mancante |
| `.photo-preview-grid__img` | Img cover con transition 0.4s ease |
| `.photo-count-badge` | Pill overlay scura bottom-right con icon camera + count (mobile) |
| `.photo-count-badge--prominent` | Modifier desktop: padding maggiorato, posizione più distante dal bordo |

**Navigazione carousel touch (solo PhotoCarousel)**

| Classe | Ruolo |
|---|---|
| `.photo-nav-tap-zone` | Area invisibile 60px laterale (`position:absolute, z-index:2`) |
| `.photo-nav-tap-zone--left` / `--right` | Posizionamento e padding interno |
| `.photo-nav-mini` | Pill round 36×36 traslucida scura con chevron |

**Dot indicators (PhotoCarousel)**

| Classe | Ruolo |
|---|---|
| `.photo-dots` | Container flex center gap 6 |
| `.photo-dots__dot` | Dot base 8×8 grigio (`#d1d5db`) |
| `.photo-dots__dot.is-active` | Attivo → width 20 + bg `--color-primary` |
| `.photo-dots__dot.is-edge` | Dot sentinella ai bordi (width 5) |

**Lightbox fullscreen (PhotoCarousel desktop)**

| Classe | Ruolo |
|---|---|
| *(riuso)* `.layout-fullscreen-overlay` | Base (fixed inset 0, z-modal, bg `--color-overlay-gallery`) |
| `.lightbox-photo` | Img fullscreen absolute inset 0 object-contain |
| `.lightbox-topbar` | Barra superiore absolute con gradient `rgba(0,0,0,0.72) → transparent` |
| `.lightbox-topbar__title` | Nome residenza (white, fw 600, text-md) |
| `.lightbox-topbar__actions` | Flex gap tra counter e close |
| `.lightbox-topbar__counter` | "N / total" (white 70%, text-base) |
| `.lightbox-close-btn` | Bottone round touch-target, bg translucent + border |
| `.lightbox-arrow` | Bottone frecce circolare absolute middle (bg translucent + blur) |
| `.lightbox-arrow--lg` | 52×52, font 22 |
| `.lightbox-arrow--left-lg` / `--right-lg` | Posizione laterale offset `--space-base` |
| `.lightbox-thumbs` | Strip thumbnail bottom con gradient dark-to-transparent |
| `.lightbox-thumbs--center` | Modifier: `justify-content: center` (≤ 10 foto) |
| `.lightbox-thumbs--scroll` | Modifier: `justify-content: flex-start` (> 10 foto, scroll x) |
| `.lightbox-thumb` | Thumb bottone 56×40 radius 5 opacity 0.5 |
| `.lightbox-thumb.is-active` | Bordo `--color-cta` + opacity 1 |
| `.lightbox-thumb__img` | Img cover dentro thumb |

**AvailabilityCalendar**

Legenda e cards:

| Classe | Ruolo |
|---|---|
| `.avail-legend` | Flex gap `--space-lg` |
| `.avail-legend__item` | Riga icon+label (text-xs) |
| `.avail-legend__item--muted` | Modifier color `--color-text-muted` |
| `.avail-legend__free` | Quadratino 24×24 con bordo, "15" dentro (gg libero) |
| `.avail-legend__busy` | "15" strike-through grigio (gg occupato) |
| `.avail-date-cards-row` | Flex gap + mb-md |
| `.avail-date-card` | Button card CI/CO (border + shadow-sm + radius 14 + padding md) |
| `.avail-date-card.is-active` | Bordo primary + bg `--color-info-bg` |
| `.avail-date-card__icon-calendar` | SVG color `--color-primary` (usa `stroke="currentColor"`) |
| `.avail-date-card__icon-chevron` | SVG color `#bbb` |
| `.avail-date-card__body` | Colonna centrale flex 1 |
| `.avail-date-card__label` | "CHECK-IN" uppercase letter-spacing |
| `.avail-date-card__value` | Data (text-base fw 600 truncate) |
| `.avail-date-card__value.is-placeholder` | Color `#bbb` per il trattino "—" |
| `.avail-date-clear-btn` | Bottone "✕" align-self center (clear date) |
| `.avail-hint` | Testo istruzione "seleziona check-in/out" (text-sm muted) |

Calendario:

| Classe | Ruolo |
|---|---|
| `.avail-cal` | Frame bianco + border + radius-lg + padding responsive (mobile 16/12; desktop ≥640px 20/28) |
| `.avail-cal__header` | Flex between row con nav buttons + titoli |
| `.avail-cal__nav-btn` | Button freccia `‹`/`›` (font 28 fw 300 no-bg) |
| `.avail-cal__nav-btn.is-disabled` / `:disabled` | Color `#ddd` + cursor default |
| `.avail-cal__titles-desktop` | Container 2 titoli mese (desktop) |
| `.avail-cal__month-title` | Titolo "Aprile 2026" (text-md fw 700) |
| `.avail-cal__month-title--mobile` | Modifier flex-1 + text-center (1 solo titolo mobile) |
| `.avail-cal__months` | Flex dei mesi (gap 0 mobile, 40 desktop) |
| `.avail-cal__month` | Singolo mese (flex-1 min-w-0) |
| `.avail-cal__divider` | Linea verticale 1px `#f0f0f0` tra i 2 mesi desktop |
| `.avail-cal__weekdays` | Grid 7 col per header L/M/M/G/V/S/D |
| `.avail-cal__weekday` | Sigla giorno (font 11 fw 600 color `#bbb`) |
| `.avail-cal__days` | Grid 7 col gap 2 per le celle |
| `.avail-cal__day-empty` | Cella vuota (solo height 36) |
| `.avail-cal__day` | Cella base (h 36, radius 6, fw 400) |
| `.avail-cal__day.is-past` | Opacity 0.4 + color `#ccc` |
| `.avail-cal__day.is-occupied` | Line-through + color `#ccc` |
| `.avail-cal__day.is-today` | Fw 700 |
| `.avail-cal__day.is-clickable` | Cursor pointer |
| `.avail-cal__day.is-check-in` | Bg primary + bianco + radius `6px 0 0 6px` |
| `.avail-cal__day.is-check-out` | Bg primary + bianco + radius `0 6px 6px 0` |
| `.avail-cal__day.is-in-range` | Bg `--color-primary-soft` + radius 0 (**T7 applicato**: era `#EEF5FC` letterale) |
| `.avail-cal__day.is-hover-range` | Bg `--color-info-bg` (hover preview dates) |
| `.avail-cal__today-dot` | Pallino 4×4 primary sotto il numero "oggi" |

**Riusi**:
- `.banner .banner--accent .banner--with-icon` + `.banner__title` / `.banner__text` (min-stay box) — Sessione 1
- `.wizard-loading` + `.wizard-loading-spinner` (spinner caricamento) — Sessione 1
- `.section-title-main` (titolo "Disponibilità") — Sessione 1
- `.layout-fullscreen-overlay` (base lightbox) — Sessione 1

**Emoji sostituite con Bootstrap Icons** (memoria utente):
- 📷 → `<i className="bi bi-camera-fill" />` (count foto su preview)
- 🌙 → `<i className="bi bi-moon-stars-fill" />` (min-stay banner)

**Nessun token nuovo**: l'intera sessione ha riusato i token esistenti (`--color-primary-soft`, `--color-overlay-dark`, `--color-cta`, `--color-info-bg`, `--radius-*`, `--space-*`, `--touch-target`, `--text-*`, `--z-modal`). Gli rgba rimasti hardcoded (`rgba(255,255,255,0.13)` su controls traslucidi del lightbox, `rgba(0,0,0,0.72)` sui gradient overlay) sono valori una-tantum contestuali al lightbox e non rientrano nel design system semantico.

### 3.15 FotoGalleryClient (Sessione 12)

Pagina dedicata `/[locale]/residenze/[slug]/foto`. Due modalità mutualmente esclusive basate su orientamento schermo: **portrait** (layout verticale standard) e **landscape immersivo** (fullscreen YouTube-style con Fullscreen API iOS).

**⚠️ Banner compatibilità iOS** — pattern isolato, non condiviso:

| Classe | Ruolo |
|---|---|
| `.fotogallery-ios-banner` | Sticky top z-200 su `--color-primary`, visibile solo a Chrome iOS (CriOS) / Firefox iOS (FxiOS) |
| `.fotogallery-ios-banner__content` | Colonna sinistra (icon + testo) |
| `.fotogallery-ios-banner__emoji` | Wrapper per emoji 📷 **mantenuta intenzionalmente** (non sostituita con Bootstrap Icon) per minimizzare rischi cross-browser |
| `.fotogallery-ios-banner__text` | Testo bianco fw 500 text-sm |
| `.fotogallery-ios-banner__actions` | Colonna destra (bottone + X) |
| `.fotogallery-ios-banner__safari-btn` | Pill bianca con testo primary "Apri in Safari" |
| `.fotogallery-ios-banner__close` | Bottone X 28×28 bg `rgba(white, 0.20)` |

**Nota design**: questo banner NON usa `.banner --info/--warning/--accent` del design system semantico perché ha sfondo brand (primary blu) e comportamento sticky. Pattern isolato contestuale.

**Page shell portrait**

| Classe | Ruolo |
|---|---|
| `.fotogallery-page` | Wrapper bg bianco min-height 100vh |

**Topbar sticky (back + nome + scroll residenze)**

| Classe | Ruolo |
|---|---|
| `.fotogallery-topbar` | Sticky top z-100, bianco + border-bottom + shadow-sm |
| `.fotogallery-topbar__title-row` | Riga 1: flex con back button + titolo + sottotitolo |
| `.fotogallery-topbar__back-btn` | Cerchio 40×40 bg grigio chiaro con freccia ← |
| `.fotogallery-topbar__title` | Nome residenza (fw 700, 16px, text-base) |
| `.fotogallery-topbar__subtitle` | "N foto" (text-xs muted) |
| `.fotogallery-topbar__rooms-scroll` | Riga 2: flex horizontal scroll-snap x mandatory, scrollbar nascosta (webkit + firefox + IE) |

**Room thumbnail scroll (selettore altre residenze)**

| Classe | Ruolo |
|---|---|
| `.fotogallery-room-thumb` | Link flex-shrink-0 |
| `.fotogallery-room-thumb.is-active` | Applica bordo primary + outline shadow al `.__frame` |
| `.fotogallery-room-thumb__frame` | Container 110×74 con bordo 2px transparent (hover target) |
| `.fotogallery-room-thumb__img` | Img cover (quando coverUrl presente) |
| `.fotogallery-room-thumb__empty` | Placeholder grigio (quando coverUrl mancante) |
| `.fotogallery-room-thumb__gradient` | Gradient bottom 55% dal dark al trasparente |
| `.fotogallery-room-thumb__label` | Nome residenza white fw 700 centrato bottom con textShadow |

**Lista foto verticale + hint**

| Classe | Ruolo |
|---|---|
| `.fotogallery-photos-list` | Wrapper lista (sotto `.page-container` riuso) |
| `.fotogallery-photo-item` | Singolo wrapper foto (aspect 4/3, bg #f0f0f0, margin-bottom 4) |
| `.fotogallery-photo-item--first` | Modifier `position: relative` per ospitare il rotate hint |
| `.fotogallery-photo-item__img` | Img cover + loading eager sui primi 3 |
| `.fotogallery-empty` | Fallback "Nessuna foto disponibile." centrato |
| `.fotogallery-rotate-hint` | Pill scura traslucida sticky bottom center con backdrop blur |
| `.fotogallery-rotate-hint__text` | Testo "Gira il telefono per la galleria immersiva" |
| `.fotogallery-rotate-hint__icon` | SVG custom `currentColor` (non Bootstrap Icon: grafica funzionale `rotate` + `landscape` tablet) |

**Back link in fondo**

| Classe | Ruolo |
|---|---|
| `.fotogallery-back-link-wrap` | Wrapper text-center con padding top |
| `.fotogallery-back-link` | Pill outline 1.5px primary + testo primary |

**Landscape immersivo (YouTube-style)**

| Classe | Ruolo |
|---|---|
| `.fotogallery-immersive` | Container fullscreen (fixed 0/0, z 9999, bg nero puro `#000`). **width/height inline**: valori DINAMICI `frozenW/frozenH` congelati al primo `orientationchange` per evitare riapparizione toolbar iOS |
| `.fotogallery-immersive.is-controls-hidden` | `cursor: none` quando i controls YouTube sono nascosti |
| `.fotogallery-immersive__img` | Foto absolute contain full-container |
| `.fotogallery-immersive__controls` | Overlay controls (opacity 1, transition 0.3s ease, pointer-events auto) |
| `.fotogallery-immersive__controls.is-hidden` | Opacity 0 + pointer-events none (auto-hide 3s o tap toggle) |
| `.fotogallery-immersive__gradient-top` | Gradient dark 90px da top |
| `.fotogallery-immersive__gradient-bottom` | Gradient dark 90px da bottom |
| `.fotogallery-immersive__title` | Nome residenza top-left con `env(safe-area-inset-top/left)` + textShadow drop |
| `.fotogallery-immersive__counter` | "N / total" top-right con safe-area + textShadow |
| `.fotogallery-immersive__arrow` | Freccia 48×48 round bianca traslucida + blur (NON riusa `.lightbox-arrow`: offset safe-area specifici + dimensione custom) |
| `.fotogallery-immersive__arrow--left` / `--right` | Posizionamento laterale middle con safe-area |
| `.fotogallery-immersive__progress` | Container progress bar bottom center con safe-area-inset-bottom |
| `.fotogallery-immersive__progress-dot` | Rettangolino 6×4 passivo `rgba(white, 0.35)` (YouTube-style, NON rotondo come `.photo-dots`) |
| `.fotogallery-immersive__progress-dot.is-active` | 20×4 bg `--color-cta` (arancione) |

**Nessun token nuovo** in Session 12: riuso di `--color-primary`, `--color-on-dark`, `--color-border`, `--color-cta`, `--color-bg`, `--color-text`, `--color-text-muted`, `--radius-pill`, `--radius-md`, `--space-*`, `--text-*`, `--shadow-sm`. Hardcoded deliberati contestuali: `#000` puro (fullscreen nero, distinto da `--color-overlay-gallery` #1a1a1a), `#f5f5f5` / `#f0f0f0` / `#d1d5db` / `#888` (grigi neutri fotogallery, stesso spettro di `.card-gallery`), `rgba(255,255,255,0.20)` / `0.15` / `0.25` / `0.85` / `0.90` (trasparenze overlay non semantiche), `rgba(0,0,0,0.62)` / `0.72` / `0.75` (gradient overlay).

**T2 applicato**: `#006CB7` letterale su `.fotogallery-room-thumb.is-active` (border + box-shadow) e `.fotogallery-back-link` (border + color) → `var(--color-primary)`.

**Emoji**: 📷 **mantenuta** nel solo banner iOS come eccezione documentata (compatibilità cross-browser), le restanti icone usano SVG custom funzionali (non sostituibili con `bi-*` perché trasmettono una rotazione specifica).

---

## 4. Come decidere se creare una nuova classe

Durante una sessione di migrazione può emergere un pattern che sembra non coperto. Flowchart di decisione:

```
1. È una variante cromatica di un pattern esistente?
   ├─ SÌ → aggiungi un modifier (`.block--variant`), non una nuova base.
   └─ NO → prosegui.

2. Esiste già una classe con semantica equivalente (anche se non bellissima)?
   ├─ SÌ → riusala. No doppioni.
   └─ NO → prosegui.

3. Il pattern compare in ≥2 file del scope Fase B?
   ├─ SÌ → creane una nuova classe in globals.css. Documentala qui.
   └─ NO (appare 1 sola volta)
       ├─ Se è complesso → classe comunque, meglio averla nominata.
       └─ Se è banale (1-2 properties) → tienilo inline, ma via token.

4. Se dubbio → STOP e chiedi all'utente. Non inventare.
```

---

## 5. Regole di stato (`.is-*`)

Stati visivi si esprimono con classi `.is-*` **combinate** con la classe base:

| Stato | Classi | Esempio |
|---|---|---|
| Selezionato | `.is-selected` | `<div className="card-option is-selected">` |
| Disabilitato | `.is-disabled` | `<div className="card-option is-disabled">` |
| Attivo / on | `.is-active` | `<button className="btn btn--stepper is-active">` |
| Loading | (TBD) | — |
| Errore input | `.is-error` | `<input className="ui-field-input is-error">` (classe esistente) |

**Perché `.is-*` e non `.block--state`?** Gli stati sono orthogonali alla variante visiva e spesso vanno applicati dinamicamente. Separarli evita combinazioni esplose tipo `.btn--primary--disabled--loading`.

---

## 6. Checklist per ogni sessione di migrazione

Prima del commit:

- [ ] **Zero `style={{}}` inline** nel file (salvo valori dinamici, commentati)
- [ ] **Zero hex hardcoded** (tutto via `var(--color-*)`)
- [ ] **Zero numeri magici** (tutto via `var(--space-*)`, `var(--radius-*)`, `var(--text-*)`)
- [ ] Ogni classe usata esiste **in questo doc** (o è stata aggiunta **prima** qui + `globals.css`)
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] Diff pulito: solo sostituzioni. Niente refactor logica "bonus"
- [ ] Commit atomico: 1 file JSX = 1 commit. Se tocchi anche `globals.css` per nuovi pattern, altro commit

---

## 7. Cosa NON fa questa libreria

- ❌ Non tocca `.ui-field-*`, `.ui-stepper-*`, `.ui-booking-summary-*` (primitivi già esistenti, vanno bene)
- ❌ Non introduce nomenclatura Tailwind (`.mt-4`, `.flex`): solo utility semantiche (`.layout-row-between`)
- ❌ Non copre pattern fuori scope (self-checkin, admin, guest portal): quelli si migreranno in Fase 3 opportunistica
- ❌ Non è un "design system completo": copre solo ciò che serve ai 17 file target

---

## 8. Riferimenti

- [migration-plan.md](../ux/migration-plan.md) — piano completo
- [css-pattern-audit.md](../ux/css-pattern-audit.md) — spec d'ingresso (§10 decisioni)
- [ux-audit.md](../ux-audit.md) — audit UX generale del sito
- [wizard-visual-audit.md](../ux/wizard-visual-audit.md) — patch visive da applicare nelle Sessioni 2–6
- [audit-primitivi.md](./audit-primitivi.md) — audit Button/Card/FormField (primitivi React esistenti)

---

## 9. Changelog

### 2026-04-24 — Cleanup post-Session 12 — delete PhotoLightbox (v1.7)
- Rimosso `components/residenze/PhotoLightbox.tsx` (235 righe, commit `93e11b0`):
  era dead code orfano dal 2026-03-29 (in `commit 559e7fb` page.tsx ha sostituito
  `import PhotoLightbox` con `import PhotoCarousel` ma il file era rimasto nel repo).
  Nessun consumer (grep `.tsx/.ts/.js/.jsx/.mdx/.json`).
- Rimosse 9 classi CSS orfane da `app/globals.css` (commit `4e938bb`, 46 righe):
  `.photo-preview-grid--2`, `.lightbox-photo--centered`, `.lightbox-photo-centered-wrap`,
  `.lightbox-arrow--sm`, `.lightbox-arrow--left`, `.lightbox-arrow--right`,
  `.lightbox-dots-bar`, `.lightbox--touch-lock`, `.photo-dots--dark`.
- Classi CONSERVATE (condivise/riusate da PhotoCarousel): `.photo-preview-grid--5`,
  `.lightbox-photo` (base), `.lightbox-topbar` + `__title`/`__actions`/`__counter`,
  `.lightbox-close-btn`, `.lightbox-arrow` + `--lg` + `--left-lg`/`--right-lg`,
  `.lightbox-thumbs` + `--center`/`--scroll`, `.lightbox-thumb` + `.is-active`
  + `__img`, `.photo-dots` + `__dot` + `.is-active`/`.is-edge`.
- §3.14 aggiornato: rinominato in "PhotoCarousel + AvailabilityCalendar", nota
  storica sul delete + rimossi i riferimenti alle 9 classi cancellate.
- `components/residenze/CardPhotoGallery.tsx:18` e changelog v1.4: commento
  "lightbox vero vive in PhotoLightbox.tsx" → "PhotoCarousel.tsx (ramo desktop
  fullscreen)".
- Zero impatto visivo (classi non avevano consumer vivi).

### 2026-04-24 — Sessione 12 — FotoGalleryClient (v1.6)
- Aggiunto §3.15 con ~32 classi BEM per la pagina `/foto` (portrait + landscape
  immersivo).
- Banner iOS (CriOS/FxiOS): 7 classi isolate (`.fotogallery-ios-banner`
  + `__content`/`__emoji`/`__text`/`__actions`/`__safari-btn`/`__close`).
  Pattern isolato, non riusa `.banner` semantico (sfondo brand `--color-primary`
  + sticky behavior). **Eccezione deliberata**: emoji 📷 mantenuta (non
  sostituita con Bootstrap Icon) per minimizzare rischi cross-browser su
  ambienti iOS già problematici.
- Portrait (~17 classi): `.fotogallery-page`, `.fotogallery-topbar`
  + `__title-row`/`__back-btn`/`__title`/`__subtitle`/`__rooms-scroll`,
  `.fotogallery-room-thumb` + `.is-active` + `__frame`/`__img`/`__empty`
  /`__gradient`/`__label`, `.fotogallery-photos-list`, `.fotogallery-photo-item`
  + `--first`/`__img`, `.fotogallery-empty`, `.fotogallery-rotate-hint`
  + `__text`/`__icon`, `.fotogallery-back-link-wrap` + `.fotogallery-back-link`.
- Landscape immersivo (~13 classi): `.fotogallery-immersive` (width/height
  dinamici inline con frozenW/frozenH iOS fix) + `.is-controls-hidden`,
  `__img`, `__controls` + `.is-hidden`, `__gradient-top`/`__gradient-bottom`,
  `__title`/`__counter`, `__arrow` + `--left`/`--right` (48×48 dedicate,
  non riusa `.lightbox-arrow`), `__progress` + `__progress-dot` + `.is-active`
  (YouTube-style, rettangolari 6×4 / 20×4, active `--color-cta`).
- **T2 applicato**: `#006CB7` su `.fotogallery-room-thumb.is-active` (border
  + shadow) e `.fotogallery-back-link` (border + color) → `var(--color-primary)`.
- Nessun token nuovo. Hardcoded deliberati documentati (`#000` puro per
  fullscreen nero, grigi `#f5f5f5`/`#f0f0f0`/`#d1d5db`/`#888` non-semantic,
  rgba overlay non token).
- SVG custom del rotate hint: sostituito `stroke="rgba(255,255,255,0.90)"`
  letterale → `stroke="currentColor"` + `.fotogallery-rotate-hint__icon
  { color: rgba(255,255,255,0.90) }`.

### 2026-04-24 — Sessioni 10+11 — Gallery + lightbox + calendar (v1.5)
- Aggiunto §3.14 con ~45 classi BEM nuove:
  preview foto (`.photo-preview--touch`, `.photo-preview-grid` + `--5`/`--2`
  + `__hero`/`__cell`/`__img`), badge count (`.photo-count-badge`
  + `--prominent`), navigazione carousel touch (`.photo-nav-tap-zone`
  + `--left`/`--right`, `.photo-nav-mini`), dot indicators unificati
  (`.photo-dots` + `__dot` + `--dark` + `.is-active`/`.is-edge`),
  lightbox fullscreen (`.lightbox-photo` + `--centered` + wrapper,
  `.lightbox-topbar` + `__title`/`__actions`/`__counter`,
  `.lightbox-close-btn`, `.lightbox-arrow` + `--sm`/`--lg`
  + `--left`/`--right`(`-lg`), `.lightbox-thumbs` + `--center`/`--scroll`,
  `.lightbox-thumb` + `__img` + `.is-active`, `.lightbox-dots-bar`),
  touch-lock modifier (`.lightbox--touch-lock`).
- Calendar: `.avail-legend` + `__item`/`__free`/`__busy`, `.avail-date-card`
  + `__icon-calendar`/`__icon-chevron`/`__body`/`__label`/`__value`
  + `.is-active`/`.is-placeholder`, `.avail-date-clear-btn`, `.avail-hint`,
  `.avail-cal` + `__header`/`__nav-btn`/`__titles-desktop`/`__month-title`
  + `--mobile`/`__months`/`__month`/`__divider`/`__weekdays`/`__weekday`
  /`__days`/`__day-empty`/`__day` + 8 stati (`.is-past/.is-occupied/.is-today
  /.is-clickable/.is-check-in/.is-check-out/.is-in-range/.is-hover-range`)
  + `__today-dot`.
- Riusi: `.banner .banner--accent .banner--with-icon` + `.banner__title/__text`
  (min-stay), `.wizard-loading` + `.wizard-loading-spinner` (spinner),
  `.section-title-main`, `.layout-fullscreen-overlay`.
- Emoji sostituite con Bootstrap Icons (📷 → `bi-camera-fill`, 🌙 →
  `bi-moon-stars-fill`).
- **T7 applicato**: `#EEF5FC` letterale di `AvailabilityCalendar.tsx:192`
  ora va via token `--color-primary-soft` in `.avail-cal__day.is-in-range`.
- Nessun token nuovo.

### 2026-04-23 — Sessioni 7+8 — Scheda abitazione statica (v1.4)
- Aggiunti §3.12 "Scheda abitazione statica" e §3.13 "BedConfigDisplay +
  CardPhotoGallery" con ~35 classi BEM nuove:
  page shell (`.room-page__*`, `.room-feature-card__num`, `.room-services__*`),
  map (`.room-map__*`), accordion (`.things-to-know__*`), sticky bar
  (`.sticky-booking-bar[.is-visible] + __*`), bed-card extras
  (`.bed-card__badge-top`, `.bed-card__room-label[--pushed]`,
  `.bed-option-pill(s)`, `.bed-config__*`), gallery cover (`.card-gallery`
  + `.card-gallery__img` + `.card-gallery__no-photo`), modifier utilitario
  `.badge-overlay--corner-tl`.
- **Dead code cleanup**: rimosse ~15 classi `.lightbox__*` e
  `.card-gallery--clickable` inizialmente aggiunte in commit `8278a74` ma
  rese non necessarie dal rimuovere la modalità lightbox di
  `CardPhotoGallery.tsx` (era dead code). Il lightbox vero vive in
  `PhotoCarousel.tsx` (Sessione 10, ramo desktop fullscreen).
- Riusi: `.card-room-bed` (§3.2), `.badge-warning-chip` (§3.4), `.badge-overlay`
  (§3.4), `.services-grid` (§3.8 pre-esistente).
- Token nuovo: `--container-page: 1100px` per max-width scheda residenza.

### 2026-04-23 — Sessione 5 — WizardStep2.tsx (v1.3)
- Aggiunto §3.11 "WizardStep2 — pagamento + dati ospite" con ~20 classi BEM:
  layout (`.wizard-step2__*`), accordion mobile (cappuccio), section card
  (`.step2-section-*`), radio pagamento (`.step2-radio-*`, `.step2-paypal-chip`),
  form grid (`.step2-form-grid-2`), CTA boost (`.step2-cta`), termini
  (`.step2-terms`), back link (`.step2-back-link`).
- Applicate patch visive audit §2.2 (titolo via `.section-title-main` fw 800),
  §2.3 (card shadow `var(--shadow-sm)`), §2.4 (section title 17→15), §2.5
  (CTA via `.btn .btn--primary`), §2.6 (`#FCAF1A` via `var(--color-cta)`
  implicito nel `.btn--primary`).
- Sub-component `Field` riusa i primitivi `.ui-field-*` esistenti.
- `SidebarContent` legacy + `SideRow` NON migrati (mobile accordion, spec
  §7 wizard-sidebar-design).

### 2026-04-23 — Sessione 4 — WizardStep1.tsx (v1.2)
- Aggiunto §3.10 "WizardStep1 — scelta residenza" con ~40 classi BEM nuove:
  summary compatto (`.card-info--compact`, `.step1-summary__*`), filter bar
  (`.step1-filter-bar`, `.step1-filter-btn`, `.step1-filter-chip`), filter modal
  (`.filter-modal__*`, `.filter-pill`), loading/empty state (`.step1-loading__*`,
  `.step1-empty-state`), room card VRBO (`.step1-room-card__*`) e offer option
  (`.step1-offer-option__*`).
- Applicate patch visive audit §1.2 (`.step1-room-card` usa `var(--shadow-sm)`),
  §1.3 (filter button attivo via `var(--color-cta)` invece di `#FCAF1A`
  hardcoded), §1.4 (banner piscina aperta via `.banner .banner--accent` già in
  libreria, non più box inline).
- Nessun nuovo token: tutto mappato su quelli di Sessione 1.

### 2026-04-19 — Sessione 2 — Wizard.tsx (v1.1)
- Aggiunte 4 classi BEM + 1 modifier al blocco `.wizard-container` (`__layout`, `__main`, `__main--full`, `__sidebar`), documentate in §3.8.
- Conferma d'uso di `.wizard-container`, `.wizard-loading`, `.wizard-loading-spinner` (già scritte in Sessione 1, ora usate).
- Rinumerato §3.8 "Layout ricorrenti" → §3.9 per far spazio al wizard container come §3.8.

### 2026-04-19 — Sessione 1 (v1.0)
- Prima release. 34 classi BEM + 16 token nuovi. Cambio `--color-warning` a `#F59E0B`.
- Fix preventivi fuori scope: `PagaClient.tsx` e `HomeSearch.tsx` passati da `--color-warning` a `--color-cta` (allineamento semantico).
