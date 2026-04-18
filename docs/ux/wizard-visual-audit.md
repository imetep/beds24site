# Wizard Visual Audit — uniformare i 3 step

**Data:** 2026-04-18
**Scope:** aspetto visivo (tipografia, card, colori, spacing, shadow, CTA) dei 3 step del wizard `/prenota` su **desktop**.
**Fuori scope:** logica pagamento/validazione, layout mobile (OK per ora), step del self-checkin wizard.
**Principio guida:** `docs/ux/wizard-layout.md` — "perdere 2 prenotazioni < deludere 1 ospite".

> **Diagnosi utente (citazione):** *"Questi 3 step non sono figli della stessa mamma."*
> Confermata da lettura del codice: i 3 file (WizardStep1: 798 righe, WizardStep2: 693, WizardStep3: 711) sono stati scritti in momenti e sensibilità diversi, senza un design system di riferimento. Risultato: 3 stili visivi distinti, stessa pagina logica.

---

## 1. Tabella delle incoerenze (dall'osservazione del codice)

### 1.1 Titolo pagina (h2)

| Step | Colore | Size | Weight | File |
|---|---|---|---|---|
| 1 | **blu primary** `var(--color-primary)` | 21px | 700 | `WizardStep1.tsx:295` |
| 2 | nero `#111` | 22px | 700 | `WizardStep2.tsx:446` |
| 3 | nero `#111` | 24px | 800 | `WizardStep3.tsx:527` |

**Incoerenza:** colore, size e weight diversi. Step 1 è blu (come un link), step 2/3 neri ma di taglia diversa.

### 1.2 Sfondo pagina

| Step | Sfondo |
|---|---|
| 1 | bianco (nessuno) |
| 2 | **grigio chiaro `#f9fafb` edge-to-edge** tramite `margin: -24px -16px; padding: 24px 16px` |
| 3 | bianco (nessuno) |

**Incoerenza:** lo step 2 "spara" uno sfondo grigio che rompe la linearità del container esterno. Effetto "pagina diversa".

### 1.3 Card padding / radius / shadow / border

| Step | Border | Radius | Shadow | Padding |
|---|---|---|---|---|
| 1 card residenza | `1.5px solid #e5e7eb` | 14px | `0 1px 4px rgba(0,0,0,0.06)` | 12–14px |
| 1 card selezionata | `2px solid var(--color-primary)` | 16px | `0 0 0 3px rgba(30,115,190,0.12)` | 12–14px |
| 2 card sezione | `1px solid #e5e7eb` | `var(--radius-lg)` = 16px | `0 2px 8px rgba(0,0,0,0.06)` | `var(--space-base)` = 16px |
| 3 card info | `1px solid #e5e7eb` | `var(--radius-lg)` = 16px | **nessuno** | `var(--space-base)` |
| 3 card policy | `1px solid #fcd34d` + **`borderLeft: 4px solid #FCAF1A`** | 16px | nessuno | 16px |

**Incoerenze:** 3 regole diverse per shadow (leggera / media / assente). Step 3 inventa un pattern "border-left spesso giallo" che non esiste negli altri.

### 1.4 Micro-label uppercase delle sezioni

| Step | Size | Color | Uppercase? |
|---|---|---|---|
| 1 | (non usa questo pattern) | — | — |
| 2 sidebar | 12px fw 700 | `#374151` | ✓ |
| 2 section-title | 17px fw 700 | `#111` | ✗ |
| 3 card-label | **11px** fw 700 | **`var(--color-primary)` blu** | ✓ |

**Incoerenza:** lo step 3 usa il **blu primary** come colore delle label di sezione ("DETTAGLIO PREZZO", "DATI OSPITE"). Il blu primary dovrebbe essere **riservato** a elementi interattivi (link, CTA secondarie) e titoli. Usarlo come label cromatica confonde il ruolo del colore.

### 1.5 CTA "Continua / Paga"

| Step | Padding | Size | Weight | Radius | BG | Shadow |
|---|---|---|---|---|---|---|
| 1 (sidebar) | `11px 0` | 15px | 700 | 10 | `#FCAF1A` | nessuna |
| 2 (sotto form) | 16px | 17px | 900 | 12 | `#FCAF1A` | `transition opacity` |
| 3 (pagamento) | 18px | 18px | 900 | 14 | `#FCAF1A` | **`0 4px 14px rgba(252,175,26,0.4)`** (alone arancione) |

**Incoerenze:** 3 taglie crescenti (media/grande/enorme), 3 radius crescenti, e lo step 3 ha un "alone" arancione che nessun altro ha. L'utente percepisce "la CTA cambia pianta" man mano che avanza.

### 1.6 Prezzo totale

| Step | Size | Weight | Color | Container |
|---|---|---|---|---|
| 1 (sidebar) | 22px | 800 | `var(--color-primary)` | nessuno |
| 2 (sidebar+bottom) | 20px | 800 | `var(--color-primary)` | nessuno |
| 3 (riepilogo) | **32px** | **900** | `var(--color-primary)` | **box blu chiaro `#EEF5FC` radius 12 padding 14–16** |

**Incoerenza:** il totale allo step 3 è 60% più grande + dentro un box dedicato. Se volevi enfasi finale ("controlla il totale!"), il pattern andrebbe graduato — oggi è un salto.

### 1.7 Icone

| Step | Pattern |
|---|---|
| 1 | SVG custom stroke + chip rounded |
| 2 | emoji `⚡` `🔐` dentro banner info (banner colorato) |
| 3 | icona Bootstrap `bi bi-shield-lock-fill` + emoji `💳` `⏳` dentro CTA |

**Incoerenza:** 3 famiglie visive (SVG / emoji banner / Bootstrap icons + emoji CTA). Effetto "collage".

### 1.8 Token rispetto a hardcoded

| Step | Token usati | Hardcoded |
|---|---|---|
| 1 | `var(--color-primary)`, `var(--touch-target)` | `#FCAF1A`, `#e5e7eb`, `#FFF8EC`, `#B07820`, tanti `fontSize` numerici |
| 2 | `var(--color-primary)`, `var(--touch-target)`, `var(--radius-lg)`, `var(--space-base)` | `#FCAF1A`, `#EEF5FC`, `#e5e7eb`, `#16a34a`, tutti i fontSize |
| 3 | `var(--color-primary)`, `var(--radius-lg)`, `var(--space-base)` | `#FCAF1A`, `#EEF5FC`, `#fcd34d`, `#FFF8EC`, `#78350f`, `#27ae60`, tutti i fontSize |

**Osservazione:** nessuno usa `--color-cta` (il nuovo token che abbiamo introdotto), tutti hardcodano `#FCAF1A`. Nessuno usa la shadow scale `--shadow-*`. Nessuno usa la typography scale semantica.

---

## 2. DNA visivo proposto (la "mamma")

Una volta applicato, i 3 step condividono questa grammatica:

### 2.1 Titolo pagina
```
color:      var(--color-text)        /* nero coerente */
font-size:  var(--text-xl)           /* 22px */
font-weight: 800
margin:     0 0 var(--space-lg)
```
→ Step 1 perde il blu (diventa nero). Step 3 perde i 2px extra. Tutti uguali.

### 2.2 Sfondo pagina
Rimosso il grigio edge-to-edge di step 2. Tutti bianchi. Il contrasto delle card è dato dalla shadow + border, non dal background pagina.

### 2.3 Card base
```
background:   #fff
border:       1px solid var(--color-border)
border-radius: var(--radius-lg)      /* 16 */
box-shadow:   var(--shadow-sm)       /* 0 1px 2px rgba(0,0,0,0.04) */
padding:      var(--space-base)      /* 16 */
margin-bottom: var(--space-base)
```

**Varianti semantiche** (pattern riusabili, non inventati per step):
- Card **selezionata** (radio card, residenza scelta): `border: 2px solid var(--color-primary)` + `box-shadow: 0 0 0 3px rgba(30,115,190,0.12)`.
- Card **info** (messaggi neutri come "consumi energetici"): `background: var(--color-primary-soft)` + nessun border.
- Card **warning** (policy cancellazione, deposito): `background: #FFF8EC` + `border: 1px solid #fcd34d`. **Senza border-left spesso** — è una variante inventata da step 3 e non riusata. Se serve enfasi, una piccola icona warning in testa basta.

### 2.4 Micro-label uppercase (sezione)
```
font-size:     var(--text-xs)        /* 12 */
font-weight:   700
letter-spacing: 0.07em
color:         var(--color-text-muted)   /* grigio */
text-transform: uppercase
margin:         0 0 var(--space-sm)
```
→ **Mai blu**. Il blu è per elementi interattivi. Step 3 cambia.

### 2.5 CTA primaria
Usa il primitivo `<Button variant="primary" size="lg">` con questi token:
```
background:  var(--color-cta)        /* non #FCAF1A hardcoded */
color:       #fff
padding:     14px 20px               /* Button size=lg attuale */
font-size:   var(--text-md)          /* 15 */
font-weight: 700
border-radius: var(--radius-md)      /* 12 */
min-height:  var(--touch-target)
box-shadow:  nessuna
```
→ **Nessun alone arancione**. Step 3 perde il glow. Stessa dimensione su tutti gli step.

### 2.6 Prezzo totale
Un solo pattern enfatico:
```
font-size:   var(--text-xl)          /* 22 */
font-weight: 800
color:       var(--color-primary)
```
Step 3 non ingigantisce più a 32px. L'enfasi viene dal **contesto** (posizione in cima alla card "riepilogo finale", label "TOTALE" con scritta in uppercase), non dalla grandezza del numero. Chiarezza > spettacolo.

### 2.7 Icone
Regola: **Bootstrap Icons ovunque possibile** (già importati globalmente, vedi `globals.css:2`). Niente emoji decorative `⚡🔐💳⏳`. Le emoji restano solo dove sono **contenuto** (es. "🇮🇹" accanto a una bandiera), non come ornamento.

---

## 3. Patch list per step (CSS-only, zero logica)

Ogni patch è applicabile indipendentemente. Ordinata per **rischio** e **impatto visivo**.

### Step 1 — `WizardStep1.tsx`

| # | Cambia | File:riga | Rischio |
|---|---|---|---|
| 1.1 | Titolo: colore da `var(--color-primary)` a `var(--color-text)`, size 21→22 | `:295` | 🟢 basso |
| 1.2 | Card residenza: shadow `0 1px 4px rgba(0,0,0,0.06)` → `var(--shadow-sm)` | `:601` | 🟢 basso |
| 1.3 | Chip filtri: sostituire `#FCAF1A` con `var(--color-cta)` | `:315`, `:327` | 🟢 basso |
| 1.4 | CTA sidebar: è già `padding 11px` — allinearla a Button size=lg (serve toccare `WizardSidebar.tsx`) | separato | 🟡 medio |

### Step 2 — `WizardStep2.tsx`

| # | Cambia | File:riga | Rischio |
|---|---|---|---|
| 2.1 | **Rimuovere sfondo grigio** `background: '#f9fafb', margin: -24px -16px, padding: 24px 16px` | `:445` | 🟢 basso (visivo grosso impatto) |
| 2.2 | Titolo: size 22 OK, weight 700→800 per allineare | `:446` | 🟢 basso |
| 2.3 | `sectionCard` shadow `0 2px 8px rgba(0,0,0,0.06)` → `var(--shadow-sm)` | `:657` | 🟢 basso |
| 2.4 | `sectionTitle` size 17→16 (`--text-card-title` idealmente) | `:659` | 🟢 basso |
| 2.5 | CTA: sostituire style inline con `<Button variant="primary" size="lg" fullWidth>` | `:568` | 🟡 medio (swap componente) |
| 2.6 | `#FCAF1A` → `var(--color-cta)` ovunque | vari | 🟢 basso |

### Step 3 — `WizardStep3.tsx`

| # | Cambia | File:riga | Rischio |
|---|---|---|---|
| 3.1 | Titolo: size 24→22, weight 800 OK | `:527` | 🟢 basso |
| 3.2 | `labelStyle`: color `var(--color-primary)` → `var(--color-text-muted)` (la **label più visibile**) | `:708` | 🟢 basso (impatto significativo sul "tono" della pagina) |
| 3.3 | Card: aggiungere `box-shadow: var(--shadow-sm)` (oggi nessuna) | `:703` | 🟢 basso |
| 3.4 | Card policy: rimuovere `borderLeft: 4px solid #FCAF1A` → allineare a card warning standard | `:543` | 🟢 basso |
| 3.5 | Totale: size 32→22, rimuovere box `#EEF5FC` o tenerlo ma senza gigantismo | `:582` | 🟡 medio (è la cifra più enfatica oggi; potrebbe sembrare meno "definitiva" dopo) |
| 3.6 | CTA: sostituire inline con `<Button variant="primary" size="lg">`, rimuovere alone arancione | `:622` | 🟡 medio (swap componente) |
| 3.7 | `#FCAF1A` → `var(--color-cta)` | `:575`, `:628`, `:632` | 🟢 basso |

---

## 4. Ordine di applicazione consigliato

Logica: **basso rischio + alto impatto visivo prima**. Ogni passo è un commit separato (1 file = 1 commit, memoria utente).

1. **Step 2 §2.1** — rimuovere sfondo grigio edge-to-edge. *Singolo cambio che fa sparire metà dell'effetto "pagina diversa"*.
2. **Step 3 §3.2** — label blu → grigio. *Secondo cambio ad alto impatto*.
3. **Step 1 §1.1** — titolo blu → nero. *Chiude il "salto cromatico" dei titoli*.
4. **Step 3 §3.5** — totale a 22px nella card "TOTALE". *Allinea la scala tipografica*.
5. **Step 3 §3.4** — rimuovere border-left giallo policy. *Allinea pattern warning*.
6. **Step 1 §1.2, Step 2 §2.3, Step 3 §3.3** — shadow scale unificata (3 commit piccoli).
7. **Step 1/2/3 §1.3, §2.6, §3.7** — `#FCAF1A` → `var(--color-cta)` (3 commit piccoli).
8. **Step 2 §2.5 + Step 3 §3.6** — CTA via primitivo `Button` (rischio medio, verifica visiva dopo).

Dopo i primi 3 punti il wizard cambia percezione sensibilmente. I successivi sono rifinitura.

**Stop point naturale**: dopo il §4.3 (i primi 3 cambi). Guardi lo screenshot e decidi se continuare o fermarti.

---

## 5. Cosa non fa questo audit

- Non tocca il layout (container, sidebar, flex). Quello è in `wizard-layout.md` §14.
- Non riprogetta il contenuto (bottoni "Modifica", accordion mobile, banner info).
- Non propone animazioni o micro-interazioni.
- Non tocca mobile (confermato OK dall'utente).
- Non tocca il self-checkin wizard (audit separato, quando lo affronteremo).

## 6. Dopo questo audit

Se ratificato nell'ordine §4, gli step avranno lo stesso DNA visivo. Questo **non** significa che gli step saranno "perfetti" — significa che saranno **coerenti tra loro**. Il passo successivo, in un momento diverso, è valutare se il DNA stesso è quello giusto (es. "il totale davvero basta a 22px o serve enfasi diversa?"). Prima coerenza, poi ottimizzazione.
