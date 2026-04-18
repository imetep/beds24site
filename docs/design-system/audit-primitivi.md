# Audit primitivi UI — Button / Card / FormField

Data: 2026-04-18
Scope: `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/FormField.tsx`

Obiettivo: stabilire **stato reale** dei 3 primitivi, **adozione in produzione**, **gap** rispetto al riferimento UX scelto (Booking.com) e priorità di intervento.

---

## 1. Stato attuale dei primitivi

### 1.1 `Button.tsx`

| Aspetto | Stato |
| --- | --- |
| Props esposte | `variant`, `size`, `fullWidth`, `disabled`, `style`, + tutte le `ButtonHTMLAttributes` |
| Varianti | `primary` (arancione `--color-warning`), `secondary` (bordato blu), `ghost` (testo) |
| Sizes | `sm` (8×14 / 13px), `md` (10×18 / 14px), `lg` (14×20 / 15px) |
| Stati default/disabled | ✅ (solo via `disabled` prop: bg `#e0e0e0`, text `#999`) |
| Stato `:hover` | ❌ nessuno stile dedicato |
| Stato `:active` | ❌ assente |
| Stato `:focus-visible` | ❌ assente — **gap accessibilità critico** |
| Stato `loading` | ❌ nessuna prop/spinner |
| Stato `destructive`/`danger` | ❌ assente |
| Icona (leading/trailing) | ❌ non supportato |
| `type` default | `"submit"` (default nativo) — rischio submit accidentali in form |
| Touch target | ✅ `minHeight: var(--touch-target)` = 44px |
| a11y | Solo contratto `<button>` nativo; nessun `aria-busy`/`aria-disabled` |

### 1.2 `Card.tsx`

| Aspetto | Stato |
| --- | --- |
| Props esposte | `padding`, `radius`, `shadow` (boolean), `background`, `borderColor`, `className`, `style` |
| Varianti semantiche | ❌ nessuna (niente `interactive`, `elevated`, `outlined`) |
| Padding | `sm`/`md`/`base`/`lg` mappati su `--space-*` |
| Radius | `sm`/`md`/`lg` mappati su `--radius-*` |
| Shadow | boolean on/off — valore hardcoded `0 2px 8px rgba(0,0,0,0.06)`, **non tokenizzato** |
| Stato interattivo | ❌ niente `onClick`/`href`/hover lift, niente `role="button"` |
| Slot header/footer/media | ❌ solo `children` unico |
| a11y | Nessuna semantica; se usata come click target richiede lavoro esterno |

### 1.3 `FormField.tsx`

| Aspetto | Stato |
| --- | --- |
| Props esposte | `label`, `error`, `hint`, `as` (`input`/`textarea`/`select`), + HTMLAttributes del nativo |
| Varianti | Solo per tipo di elemento; **nessuna variante di size/density** |
| Stati supportati | default, error (bordo `#dc2626` hardcoded, messaggio) |
| Stato disabled | ❌ nessuno stile dedicato (solo ciò che fa il browser) |
| Stato `:focus` | ❌ `outline: 'none'` senza sostituto → **regressione a11y** |
| Slot icona (leading/trailing) | ❌ assente |
| Clearable / password toggle | ❌ assente |
| Helper text | ✅ `hint` (mutuamente esclusivo con `error`) |
| Touch target | ✅ `minHeight: var(--touch-target)` |
| Associazione label↔input | ❌ **nessun `htmlFor`/`id` autogenerato** → il click sul label non focalizza l'input, screen reader non leggono la relazione |
| `aria-invalid` in error | ❌ assente |
| `aria-describedby` per hint/error | ❌ assente |

---

## 2. Adozione in produzione

Misurata con Grep su `components/` e `app/`.

| Primitivo | Import fuori da README | Verdetto |
| --- | --- | --- |
| `Button` | **0** | mai usato |
| `Card`   | **0** | mai usato |
| `FormField` | **0** | mai usato |

In parallelo, uso di pattern "raw":

| Pattern bypass | Occorrenze | File |
| --- | --- | --- |
| `<button>` nativo | **171** | 36 file |
| `<input>` nativo | **34** | 12 file |
| `style={{…}}` inline | **1.199** | 53 file |
| Classi Bootstrap `btn-primary/secondary/outline/…` | **50** | 11 file (prevalentemente area admin) |
| `form-control` / `form-select` / `form-check` | **15** | 6 file (`admin/*`, `BookingPanel.tsx`) |
| `minHeight: var(--touch-target)` **duplicato** fuori dai primitivi | **15** in 6 file | `WizardStep1/2`, `GuestLogin`, `WizardCheckin` … |
| `background: var(--color-warning)` per CTA (stessa scelta di Button primary) | 1 file (`HomeSearch.tsx`) | CTA principale home |

**Conclusione adozione: 0%.** I primitivi sono stati creati ma *mai integrati*. Il README indica i candidati alla migrazione (Wizard, BookingPanel, GuestLogin, ChangeRequestWizard) ma la migrazione non è mai partita.

Area più "inquinata" da Bootstrap raw: **admin** (`AdminCheckin`, `AdminBiancheria`, `AdminPulizie`, `AdminBuchi`, `app/admin/page.tsx`) — usa ancora `btn btn-*` e `form-control` classici.

---

## 3. Gap vs Booking.com (riferimento UX)

Densità target: compatta (testi 13–14 px, padding verticale 8–12 px, nessuna "airiness").

### 3.1 Button — cosa manca

| Feature Booking.com | Presente? | Note |
| --- | --- | --- |
| Variante `primary` CTA (blu pieno) | ✅ simile (ma qui arancione = `--color-warning`; naming incoerente) | il token "warning" per un CTA primario confonde |
| Variante `secondary` (bordato) | ✅ | ok |
| Variante `tertiary`/`ghost` (testo) | ✅ (`ghost`) | ok ma no hover |
| Variante `destructive`/`danger` | ❌ | manca per "Annulla prenotazione", "Elimina" |
| Variante `link` (underline, inline) | ❌ | spesso usato inline nei testi |
| Size `xs`/chip | ❌ | Booking usa bottoni 28–32 px per chip/filtri |
| Icon-only button | ❌ | con `aria-label` obbligato |
| Icona leading/trailing | ❌ | pattern frequente su "Continua →", "← Indietro" |
| Stato `loading` con spinner inline | ❌ | usato su submit form |
| Stato `:hover`/`:active` definiti | ❌ | attualmente solo `transition: opacity` — debole |
| `:focus-visible` ring | ❌ | requisito WCAG 2.4.7 |
| `aria-busy` durante loading | ❌ | |

### 3.2 Card — cosa manca

| Feature Booking.com | Presente? | Note |
| --- | --- | --- |
| Elevation scale (0/1/2/3) | ❌ | solo `shadow: boolean` binario |
| Variante `interactive` (hover lift + cursor) | ❌ | |
| Variante con immagine (media slot top/left) | ❌ | pattern room-card standard Booking |
| Slot header / footer | ❌ | |
| Padding `none` (per card edge-to-edge con media) | ❌ | |
| Radius `pill` o asimmetrici | ❌ | esiste `--radius-pill` nei token ma non esposto |
| Borderless (solo shadow) | ❌ | border sempre presente |
| Stato selected (bordo primary) | ❌ | utile in selezione offerte/stanze |

### 3.3 FormField — cosa manca

| Feature Booking.com | Presente? | Note |
| --- | --- | --- |
| Associazione `<label htmlFor>` + `id` autogen | ❌ | **bug a11y** |
| Label flottante (placeholder che sale) | ❌ | pattern search/filtri Booking |
| Size compatta (`sm`) per filtri | ❌ | |
| Icon slot leading (ricerca, calendario) | ❌ | |
| Icon/action trailing (clear, mostra password, dropdown) | ❌ | |
| Counter caratteri | ❌ | utile su textarea (es. note prenotazione) |
| Stato `success` (bordo verde) | ❌ | feedback validazione progressiva |
| Stato `:focus` visibile (ring) | ❌ | `outline: none` senza sostituto |
| `aria-invalid` + `aria-describedby` su error/hint | ❌ | critico screen reader |
| Gestione `marginBottom` override | ❌ | wrapper applica `--space-md` fisso |
| Token errore (`--color-error`) | ❌ | `#dc2626` hardcoded |

---

## 4. Bug rilevati nei primitivi

Segnalati ma **non fixati** (constraint dell'audit).

1. **FormField — label non associata all'input** ([`FormField.tsx:67`](components/ui/FormField.tsx:67)). Manca `htmlFor`/`id`. Click su label non focalizza; AT non leggono il rapporto. Impatto: WCAG 1.3.1 / 4.1.2.
2. **FormField — `outline: none` senza focus alternativo** ([`FormField.tsx:42`](components/ui/FormField.tsx:42)). Regressione rispetto al browser default. WCAG 2.4.7.
3. **FormField — spread props include `label`/`error`/`hint`** ([`FormField.tsx:69`](components/ui/FormField.tsx:69)). Queste props vanno a finire come attributi HTML sul nativo (`<input label="…">`): React emette warning *"Unknown DOM property"*.
4. **FormField — error state usa `aria-invalid` mancante e colore hardcoded** (`#dc2626`, [`FormField.tsx:40`](components/ui/FormField.tsx:40), [`FormField.tsx:55`](components/ui/FormField.tsx:55)). Non tokenizzato.
5. **Button — variante `primary` mappata su `--color-warning`** ([`Button.tsx:34`](components/ui/Button.tsx:34)). Naming semantico incoerente: il colore CTA dovrebbe essere un token `--color-cta` o `--color-accent`, non "warning".
6. **Button — nessun `:focus-visible` style** ([`Button.tsx:50`](components/ui/Button.tsx:50)). Focus indicator perso quando si tolgono gli outline di default del browser (che non vengono tolti ora, ma saranno tolti appena si aggiunge hover via CSS). WCAG 2.4.7.
7. **Button — disabled colors hardcoded** (`#e0e0e0` / `#999`, [`Button.tsx:34-35`](components/ui/Button.tsx:34)). Bypassa i token.
8. **Button — `type` non di default `"button"`** ([`Button.tsx:51`](components/ui/Button.tsx:51)). Dentro `<form>` un `<button>` senza `type` fa submit — rischio concreto in wizard e login.
9. **Card — shadow hardcoded** ([`Card.tsx:48`](components/ui/Card.tsx:48)). Non tokenizzato, impossibile mantenere coerenza.
10. **Card — non supporta `onClick`/semantica interattiva** ma non lo documenta. Sviluppatori cascheranno in pattern `<div onClick>` senza `role`/`tabindex`.

---

## 5. Raccomandazioni prioritizzate (top 5 per ROI)

Ordinate per rapporto *impatto / sforzo*. L'ipotesi di fondo è che il vero problema **non è la mancanza di feature**, ma la **non-adozione** dei primitivi: moltiplicare le varianti prima di avere adozione peggiora il problema.

### 1) Fix accessibilità di `FormField` (bloccante)
**Perché:** 3 bug a11y (label scollegata, focus rimosso, spread DOM-unsafe) su un primitivo a uso massivo. Rischio legale/UX reale.
**Come:** autogen `id` con `useId()`, `htmlFor` sulla label, destrutturazione pulita di `label`/`error`/`hint` prima dello spread, `aria-invalid`/`aria-describedby`, focus ring via token.
**Sforzo:** S (1 file, no breaking change sull'interfaccia pubblica).
**Sblocca:** la migrazione di `WizardStep2`, `WizardCheckin`, `GuestLogin` (170+ usi `<input>` + 34 `<input>` nativi).

### 2) Rinominare `--color-warning` → token CTA + allineare `Button` primary
**Perché:** la variante "primary" che attinge a un token chiamato "warning" è contro-intuitiva e blocca psicologicamente gli sviluppatori dal fidarsi del primitivo. Coerenza semantica = precondizione per adozione.
**Come:** introdurre `--color-cta` (uguale a `#FCAF1A`) accanto a `--color-warning`, usare `--color-cta` in `Button` primary e nelle CTA di `HomeSearch`.
**Sforzo:** S (token + 2 file). Zero impatto visivo.
**Sblocca:** nomenclatura pulita per estendere con `danger` dopo.

### 3) Migrazione pilota: `GuestLogin.tsx` a `Button` + `FormField`
**Perché:** `GuestLogin` ha 1 `<input>` nativo + 3 `minHeight: var(--touch-target)` duplicati + palette colori custom locale (`const C = { … }`). È il candidato **più piccolo e isolato** tra quelli del README. Serve come proof-of-concept per dimostrare che i primitivi funzionano prima di estenderli.
**Come:** PR dedicata, swap 1:1, screenshot before/after mobile.
**Sforzo:** M. ROI: risultato visibile, riduce duplicazione "touch target" del 25%.
**Sblocca:** decisione "servono ancora feature? o i primitivi attuali coprono il caso reale?" — risposta basata su evidenza, non su ipotesi.

### 4) Aggiungere variante `danger` a `Button` (dopo #2)
**Perché:** cercando nel codice, non c'è una CTA rossa oggi — ma `ChangeRequestWizard`, `GuestPortal`, `DepositSection` useranno a breve "Annulla" / "Rimuovi" (14 usi di `ChangeRequestWizard.tsx` già con `<button>` raw). Posticipare significa nuovi style inline a raffica.
**Come:** variante `danger` con token `--color-danger` (nuovo, es. `#c0392b` già presente come variabile locale in `GuestLogin`).
**Sforzo:** S. **Prerequisito:** #2 per coerenza naming.

### 5) `Card` → aggiungere variante `interactive` (hover lift + `as`/`onClick`)
**Perché:** le card cliccabili sono il pattern #1 nei risultati di ricerca residenze (`RoomCard.tsx`, `ResidenzaSlider.tsx`, `CardPhotoGallery.tsx`). Senza variante interactive, continueremo a trovare `<div onClick>` non accessibili. 13 file usano `card` Bootstrap oggi.
**Come:** prop `as="button"` opzionale, hover shadow step, `role`/`tabindex` automatici. Tokenizzare anche le shadow (`--shadow-1`, `--shadow-2`) ora che si tocca il file.
**Sforzo:** M.

### Cosa NON fare ora

- **Non** aggiungere `loading`, `icon slot`, `label flottante`, `clearable`, `size xs/chip` finché l'adozione è 0. Rischio: sovraingegnerizzare primitivi che nessuno usa. Rivalutare dopo la prima migrazione reale (#3).
- **Non** toccare l'area admin in questa fase: usa Bootstrap raw, è il 60% dei bypass `form-control`/`btn-*`, ma è interna, basso traffico e le estetiche compatte di Bootstrap ci vanno vicine all'obiettivo "densità Booking". Migrazione admin va fatta in blocco quando i primitivi avranno `size="sm"` e `density="compact"`.

---

## 6. Appendice — note sui token CSS

Tokens già esposti in [`app/globals.css`](app/globals.css) (linee 13–50): `--color-primary`, `--color-warning`, `--space-xs/sm/md/base/lg/xl`, `--radius-sm/md/lg/pill`, `--touch-target` (44px), `--text-xs/sm/base/md/lg/xl`.

Mancano e sono **riferiti da codice di produzione** (quindi hardcoded oggi):
- `--color-cta` (arancione CTA — oggi alias mentale di `--color-warning`)
- `--color-danger` (`#c0392b`, duplicato in `GuestLogin.tsx`)
- `--color-success` (non usato esplicitamente ma pattern prevedibile)
- `--shadow-1`, `--shadow-2` (oggi `0 2px 8px rgba(0,0,0,0.06)` duplicato in `Card` e in molti `style={{ boxShadow: … }}` inline)
- `--focus-ring` (es. `0 0 0 3px rgba(30,115,190,0.25)`) — prerequisito fix #1 e #6

La definizione di questi 5 token è la **precondizione strutturale** a qualsiasi estensione dei primitivi.
