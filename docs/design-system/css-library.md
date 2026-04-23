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
