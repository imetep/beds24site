# Piano di Migrazione CSS — Wizard + Scheda Abitazione

**Data:** 2026-04-18
**Stato:** 🟢 ratificato — piano di esecuzione per le prossime sessioni
**Scope:** le 2 aree più usate del sito: **wizard prenotazione** (5 file) + **scheda abitazione** (12 file). Totale: **17 file, ~413 style inline** da migrare al Livello 2 (classi CSS in `globals.css`, zero inline nel JSX).

**Fuori scope (per ora):** self-checkin, guest portal, contatti, admin, legali. Resteranno con style inline finché non si farà la Fase 3 opportunistica, oppure una Fase B estesa in futuro.

---

## 1. Principio guida — "la mamma"

Tutti i file del sito devono sembrare **figli della stessa mamma**. Per raggiungerlo, ogni sessione di migrazione segue **regole rigorose**, non opinabili.

### 1.1 Il contratto per ogni file migrato

Dopo una sessione di migrazione il file deve avere:

- ✅ **Zero `style={{}}` inline** (unica eccezione: valori **dinamici** calcolati a runtime, es. `width: ${progress}%`. Ogni eccezione va commentata nel codice con la ragione).
- ✅ **Zero hex hardcoded** (`#FCAF1A`, `#1E73BE`, `#e5e7eb`, ecc.) nel JSX e nei CSS nuovi. Tutti via `var(--color-*)`.
- ✅ **Zero numeri magici** per spacing/padding/radius/font-size. Tutti via `var(--space-*)`, `var(--radius-*)`, `var(--text-*)`.
- ✅ **Tutte le classi nuove** definite in `globals.css` (o un file CSS dedicato se la libreria cresce).
- ✅ **Typecheck pulito** (`npx tsc --noEmit`) prima del commit.
- ✅ **Verifica visiva su Vercel** prima della sessione successiva.

### 1.2 Il contratto per ogni sessione

- 📖 **Lettura integrale** del file prima di toccare (lezione dalla regressione sidebar).
- 💬 **Niente esperimenti senza conferma** — se emergono scelte di design nuove, si fermano in una domanda, non si implementano "a sensibilità mia".
- 💾 **Commit atomici** (memoria utente: 1 file modificato = 1 commit). Se una sessione tocca 1 file JSX + `globals.css` + 4 traduzioni, sono 6 commit.
- 🚀 **Push a fine sessione** (memoria utente: Vercel deploya su push).

### 1.3 Principio del business

> *"È meglio perdere 2 prenotazioni che deludere un ospite."*

Applicato alla migrazione: **mai deployare qualcosa che introduce attriti o bug nel booking funnel**. Preferibile fermarsi e chiedere piuttosto che tentare un fix "al volo".

---

## 2. Pre-requisiti (già fatti in questa sessione)

- ✅ [Audit UX generale](../ux-audit.md)
- ✅ [Audit primitivi Button/Card/FormField](../design-system/audit-primitivi.md)
- ✅ [Audit visivo wizard (3 step stesso DNA)](./wizard-visual-audit.md)
- ✅ 13 design token strutturali in `globals.css` (§2.2 dell'ux-audit)
- ✅ Primitivi `Stepper`, `BookingSummary` creati
- ✅ Logo SVG 2026 allineato ai token (hex brand ancora hardcoded nel file SVG — ok)
- ⚠️ Decisione pendente (non bloccante): unificare `#006cb7` (logo blue) con `#1E73BE` (`--color-primary`). Vedi §6.

---

## 3. Le 2 aree da migrare

### 3.1 Wizard prenotazione — 5 file, 213 inline

| File | # inline | Ruolo | Complessità |
|---|---|---|---|
| `components/wizard/Wizard.tsx` | 5 | Container + Stepper (già in usa) | 🟢 bassa |
| `components/wizard/WizardSidebar.tsx` | 29 | Sidebar step 1 (foto + CTA) | 🟡 media |
| `components/wizard/WizardStep1.tsx` | 66 | Scelta appartamento + tariffa | 🟡 media |
| `components/wizard/WizardStep2.tsx` | 81 | Conferma + dati ospite + pagamento | 🔴 alta (pagamento!) |
| `components/wizard/WizardStep3.tsx` | 32 | Riepilogo finale + Stripe/PayPal | 🔴 alta (pagamento!) |

### 3.2 Scheda abitazione — 12 file, ~200 inline

| File | # inline | Ruolo | Complessità |
|---|---|---|---|
| `app/[locale]/residenze/[slug]/page.tsx` | 6 | Page shell | 🟢 bassa |
| `components/residenze/RoomCard.tsx` | 1 | Card mini residenza | 🟢 bassa |
| `components/residenze/PropertyMap.tsx` | 2 | Mappa Google | 🟢 bassa |
| `components/residenze/ThingsToKnow.tsx` | 5 | Info generiche fine pagina | 🟢 bassa |
| `components/residenze/StickyBookingBar.tsx` | 5 | Sticky bar mobile | 🟢 bassa |
| `components/residenze/CardPhotoGallery.tsx` | 18 | Anteprima foto hero | 🟡 media |
| `components/residenze/BedConfigDisplay.tsx` | 20 | Configurazione letti | 🟡 media |
| `components/residenze/BookingPanel.tsx` | 25 | Pannello tariffe + CTA "Prenota" | 🔴 alta (entry booking!) |
| ~~`components/residenze/PhotoLightbox.tsx`~~ | ~~26~~ | Dead code orfano dal 2026-03-29, rimosso post-Session 12 (commit `93e11b0`). Il lightbox vero vive in `PhotoCarousel.tsx` ramo desktop fullscreen | ⚪ eliminato |
| `components/residenze/PhotoCarousel.tsx` | 27 | Carousel foto desktop | 🟡 media |
| `components/residenze/AvailabilityCalendar.tsx` | 33 | Calendario disponibilità | 🟡 media |
| `components/residenze/FotoGalleryClient.tsx` | 34 | Pagina dedicata `/foto` | 🟡 media |

---

## 4. Ordine di esecuzione (12 sessioni)

L'ordine è ottimizzato per: **rischio crescente** (prima i facili come warm-up sul pattern) + **valore crescente** (lavoro sui pezzi più critici quando il sistema è rodato).

### Fase preparatoria

#### Sessione 0 — Pattern Audit cross-file (nessun commit di codice)
- Lettura integrale dei 17 file target
- Compilazione mappa pattern: elenco **tipi** di bottoni / card / banner / badge / label / separatori presenti
- Atteso: ~15-25 pattern ricorrenti (es: `btn-cta-primary`, `btn-cta-secondary`, `btn-link`, `card-info`, `card-warning-brand`, `card-interactive`, `badge-selected`, `badge-floor`, `section-title`, `micro-label-uppercase`, ecc.)
- Output: nuovo `docs/ux/css-pattern-audit.md` con la mappa + 1-2 frammenti di esempio per pattern
- Decisione con utente: nomenclatura classi, pattern da separare vs accorpare

#### Sessione 1 — Libreria CSS (1 commit su `globals.css` + 1 su doc)
- Scrittura delle classi decise in sessione 0 dentro `globals.css`
- Output: `globals.css` aggiornato + `docs/design-system/css-library.md` che documenta ogni classe (nome, ruolo, token usati, dove usarla)
- Nessun file di componente toccato in questa sessione

### Wizard (sessioni 2–6)

| # | Sessione | File | Obiettivo | Stato |
|---|---|---|---|---|
| 2 | Wizard.tsx | migra 5 inline. Include anche la patch visiva §4.3 dell'audit visivo | ✅ |
| 3 | WizardSidebar.tsx → **ristrutturazione** sidebar booking unificata step 1+2 | vedi §4-bis scomposizione | ✅ 3a/3b/3c |
| 4 | WizardStep1.tsx | migra 95 inline residui. Applica §1.2–§1.4 audit visivo | ✅ `1a66800`/`89ce18d`/`09a11b4` |
| 5 | WizardStep2.tsx | migra form+pagamento (43 inline main col). SidebarContent legacy + 55 inline residui restano per sessione mobile dedicata. Applica §2.2–§2.6 | ✅ `1df83d6`/`4e397ad` + ✅ `ed5db23`/`4ce08c0` (sessione mobile chiude i 48 residui SidebarContent/SideRow/CSSProp legacy a 0 — 2026-04-24) |
| 6 | WizardStep3.tsx | migra 32 inline + redesign B single-col condensato + i18n namespace wizardStep3 (era UI inline 150 righe) + rinomina func WizardStep7→WizardStep3 + fetch cover hero. Applica §3.1–§3.7 audit visivo. Logica Stripe/PayPal PRESERVATA byte-identical | ✅ `b4807dc`/`3d28133`/`80f746c` |

**Dopo ogni sessione**: screenshot desktop + mobile del step toccato, confronto con prima, approvazione tua prima di passare alla successiva.

### 4-bis — Sessione 3 scomposta (ratificata 2026-04-19)

Durante la Sessione 3 è emerso che il refactor del solo `WizardSidebar.tsx` non risolveva il problema reale: il wizard aveva **3 sidebar strutturalmente diverse** (step 1 a 250px / step 2 a 380px / step 3 assente). Audit + design doc dedicati hanno portato a ristrutturazione più ampia.

Riferimenti:
- 📋 [wizard-sidebar-audit.md](wizard-sidebar-audit.md) — diagnosi delle 3 varianti
- 🎨 [wizard-sidebar-design.md](wizard-sidebar-design.md) v3 ratificato — DNA unificato, look master = SidebarContent di WizardStep2, API componente unificato

| # | Sub-sessione | Cosa | Stato |
|---|---|---|---|
| 3a | Cleanup dead code in WizardSidebar.tsx + rename `.step6-*` in WizardStep2.tsx | rimosso `NightsBadge`, rami 1-4 di `renderTopSection` (morti perché sempre chiamati con step=5), MapFrame, URL mappe/foto morti, `loc`. Rename a `.wizard-summary-*`. Zero cambio visivo. | ✅ `35924e3`, `fbcea4d`, `c635b9e` |
| 3b | Creazione `BookingSidebar.tsx` + cablatura step 1 + eliminazione scaffolding | nuovo componente unificato, eliminazione di 3 file scaffolding (`WizardSidebar`, `WizardBookingSummary`, `components/ui/BookingSummary`), 19 chiavi i18n nuove, classi `.booking-sidebar*` in globals.css, fix icone Bootstrap (no emoji), fix leggibilità typography/date, label "Il tuo alloggio" neutra | ✅ `a4b6047`, `077a0e4`, `ab4de98`, `d3a5967`, `c2373ac`, `4024b67`, `fd03ed5`, `16751de` |
| 3c | Uniformazione step 2 al DNA master (SidebarContent attuale) | 4 mini-step: 3c.1 BookingSidebar adotta look SidebarContent ✅ `6efbd85`; 3c.2 prop `step` + slot + callback Modifica ✅ `79d0c29`; 3c.3 WizardStep2 sidebar desktop → BookingSidebar, bg grigio rimosso, titolo WizardStep1 nero, width main col 560→680 ✅ `e595d2c`/`c6876de`/`5e3fef2`; 3c.4 slot voucher+extras inline style → classi BEM (+ .section-title-main weight 800 per audit DNA) ✅ `66cb81a`/`fc14d00`/`565c778`/`95ad478`. Mobile accordion resta con SidebarContent legacy fino a sessione mobile dedicata (spec §7) | ✅ 3c.1/3c.2/3c.3/3c.4 |

**Sessione 3c completata** ✅ — prossimo step: Sessione 4 (WizardStep1 inline migration, 66 inline residui) oppure sessione mobile dedicata per WizardStep2 (cleanup SidebarContent + accordion mobile).

La spec di dettaglio da seguire è [wizard-sidebar-design.md §6 roadmap](wizard-sidebar-design.md).

### Scheda abitazione (sessioni 7–12)

| # | Sessione | File | Note | Stato |
|---|---|---|---|---|
| 7 | File piccoli in un colpo | page + RoomCard + PropertyMap + ThingsToKnow + StickyBookingBar = 19 inline | Warm-up area | ✅ `8278a74` (css+doc), `f31ef59` (page), `3265199` (css mini), `469bc45` (RoomCard), `fb52c08` (PropertyMap), `1b0dd8f` (ThingsToKnow), `41b48ee` (StickyBookingBar) |
| 8 | BedConfigDisplay + CardPhotoGallery | 38 inline totali | Pattern "card residenza" + dead code removal lightbox CardPhotoGallery | ✅ `2956e99` (css mini), `8db427a` (BedConfigDisplay), `9677c53` (CardPhotoGallery dead-code + RoomCard prop), `5bf6b05` (cleanup lightbox CSS) |
| 9 | BookingPanel | 25 inline | CTA principale scheda (entry booking). Applicato T6 (`#dbeafe` deprecato riga 196 → `var(--color-primary-soft)`), T7 (`#EEF5FC` riga 185 → token), emoji ⚠️ → `bi-exclamation-triangle-fill`, riuso `.wizard-loading-spinner`. 1 inline dinamico residuo giustificato (gridTemplateColumns 1fr/1fr 1fr) | ✅ `b226e5d` (css), `fc10a0e` (BookingPanel) |
| 10 | PhotoCarousel + PhotoLightbox | 53 inline totali | Gallery + lightbox "vero" (duplicava con quello rimosso in Sess 8). **NB**: post-Session 12 è emerso che `PhotoLightbox.tsx` era dead code orfano dal 2026-03-29; rimosso in cleanup (commit `93e11b0` tsx + `4e938bb` 9 classi CSS). Il lightbox vero vive in `PhotoCarousel.tsx` | ✅ `49a0081` (css shared), `8ab3be4` (PhotoCarousel), `49d4448` (css touch-lock), `b98ddea` (PhotoLightbox — poi eliminato) |
| 11 | AvailabilityCalendar | 33 inline | Calendario complesso, sessione dedicata. Applicato T7 (#EEF5FC → token) | ✅ `9c93916` |
| 12 | FotoGalleryClient | 34 inline | Pagina foto completa (portrait + landscape immersivo). Banner iOS CriOS/FxiOS preservato byte-identical, emoji 📷 mantenuta (eccezione deliberata compat. cross-browser). Applicato T2 | ✅ `8f6fbb0` (css), `4513f15` (FotoGalleryClient, 1 inline residuo: frozenW/H dinamici iOS) |

**🏁 Fase B COMPLETATA** ✅ (2026-04-24) — Sessione 9 BookingPanel chiusa come ultima (commit `b226e5d` css + `fc10a0e` refactor). Tutti i 16 file target (era 17, dopo delete PhotoLightbox) sono a **zero inline style** (eccezione: 1 valore dinamico per file quando matematicamente necessario, documentato). Sessione mobile dedicata WizardStep2 SidebarContent + Sessione i18n T9 a seguire (fuori Fase B).

---

## 5. Criteri di "fatto bene" per sessione

Checklist rigida da completare **prima** del push finale di ogni sessione:

### 5.1 Pre-sessione
- [ ] File letto integralmente (una volta per sessione, anche se >500 righe)
- [ ] Pattern mappati a classi della libreria (§1). Se emerge un pattern nuovo, lo si aggiunge alla libreria e si documenta
- [ ] Rischi del file dichiarati (es. "tocca Stripe", "ha regex custom", "usa ref DOM")

### 5.2 Durante
- [ ] Ogni `style={{}}` trovato → o eliminato (→ className) o giustificato (valore dinamico)
- [ ] Ogni hex trovato → token. Se il token non esiste, lo si definisce PRIMA di usarlo
- [ ] Ogni numero magico → token. Stessa regola
- [ ] Nessuna modifica alla **logica di business** (pagamento, validazione, store, fetch)
- [ ] Commenti mantenuti

### 5.3 Pre-commit
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] Diff pulito: solo sostituzioni `style`/`hex` → classi/token. Niente rename variabili o refactor logica "bonus"
- [ ] Commit messaggio descrittivo (cosa è migrato, quanti inline eliminati, eventuali eccezioni)

### 5.4 Post-push
- [ ] Vercel deploy completato
- [ ] Screenshot desktop della pagina toccata
- [ ] Screenshot mobile della pagina toccata
- [ ] Confronto visivo con lo stato prima (se possibile)
- [ ] Click-test del flusso che coinvolge il file (es. se ho toccato WizardStep2, click "Vedi riepilogo", verifica che funzioni)
- [ ] Riporto in chat all'utente: ✅ sessione N completata, X inline eliminati

### 5.5 Stop condizioni (interrompo e chiedo conferma)
- Se il file ha comportamenti visivamente diversi dopo il refactor (anche se il tsc passa)
- Se il file ha pattern che non si sentono coperti dalla libreria (serve aggiornare la libreria, non inventare classi locali)
- Se emerge un bug di produzione non correlato al refactor (si ferma tutto, si fixa quello prima)

---

## 6. Decisioni aperte (non bloccanti per iniziare, da risolvere in corsa)

### D.X — Unificare il blu ⚠️ risolta parzialmente (2026-04-23)

**Decisione: opzione A** — allineato il sito al logo (`--color-primary: #006CB7`).

Tre opzioni erano state considerate:
- **A** ✅ Allineare sito al logo (`--color-primary: #006cb7`): impatta tutto il sito, ma allinea al brand
- **B** Allineare logo al sito: toccare `public/logo.svg`, ma si disallinea dal PDF/stampati
- **C** 2 token distinti: `--color-primary` (sito) + `--color-brand-blue` (logo)

**Eseguito** in 2 commit:
- `92e4500` — `app/globals.css`: 5 punti (token `--color-primary`, `--bs-primary`, `--bs-primary-rgb`, `--focus-ring`, e l'rgba `0 0 0 3px rgba(30,115,190,0.12)` su `.step1-room-card.is-selected`).
- `3301921` — 10 file sorgente: replace letterale `#1E73BE` → `#006CB7` (20 occorrenze) in `BookingPanel`, `BedConfigDisplay`, `AvailabilityCalendar`, `FotoGalleryClient`, `ThingsToKnow`, `AdminCheckin`, `ContattiClient`, `DoveSiamoClient`, `SelfCheckinPage`, `SuccessContent`.

**⚠️ Parziale — residuo non risolto**:

In `components/contatti/ContattiClient.tsx:210` sopravvive un blu secondary non allineato al nuovo token:
```jsx
background: 'linear-gradient(135deg, #006CB7 0%, #1557a0 100%)'
```
Il primo stop è stato aggiornato al nuovo blu logo, ma il **second stop `#1557a0`** (blu più scuro, ex-derivato di `#1E73BE`) è rimasto intatto perché non era `#1E73BE` letterale e il replace sed non lo ha catturato. Il gradient ora va da blu-logo a un blu-più-scuro-non-canonico — visivamente coerente ma non allineato a un token del design system.

**Da decidere in futuro**: mantenere `#1557a0` come variante scura ad-hoc, oppure introdurre un token `--color-primary-dark` derivato da `#006CB7` (circa `#004a80`) e usarlo come second stop. Impatta solo questo gradient in ContattiClient — non pressante.

### D.Y — Separazione semantica arancione
Oggi: `--color-cta = --color-warning = --color-brand-accent = #FCAF1A`.
**Proposta**: `--color-warning = #F59E0B` (più giallo), gli altri restano. Implica che i banner "cancellazione gratuita", "consumi energetici" cambiano leggermente tonalità (più giallo, meno arancio).

**Da decidere prima della sessione 1** (libreria CSS).

### D.Z — Accorpare o separare pattern
Durante l'audit sessione 0 emergeranno dubbi tipo: "`.card-residenza-list` e `.card-residenza-selected` sono 2 classi o 1 con modifier?". Scelte di nomenclatura da decidere con l'utente.

---

## 6.1 TODO emersi durante checklist Sessione 7+8 (2026-04-23)

Checklist visiva post-push di 9 check funzionali completata (7 ok, 2 ok-con-riserva). TODO raccolti:

### 🎨 Decisioni di design aperte

**T1 — Contrasto titoli neri vs palette brand blu+arancione**
Checklist §3 e §5: il nero `--color-text` (#111) dei titoli (h1 scheda, header accordion non è impattato) non convince accanto al brand `#006CB7` + `#FCAF1A`. Da decidere una tonalità titolo più armonica (es. blu-nero `#0a1929`, warm-dark `#2a2520`, o mantenere nero con più respiro visivo). Impatta `.section-title-main`, `.section-title-secondary`, potenzialmente `.label-uppercase-muted`. È una decisione design system, non fix puntuale.

**T2 — Blu secondary derivati dal vecchio `#1E73BE` non rigenerati (D.X-1)**
Dopo D.X il primary è `#006CB7` ma **i blu derivati sono rimasti** (erano calcolati su `#1E73BE`):
- `#1557a0` — `ContattiClient.tsx:210` gradient second stop (già documentato nel D.X §6 parziale)
- `#0c447c` — `HomeSearch.tsx:438` gradient + `globals.css:2372` bed-config note text
- `#b5d4f4` — `globals.css:2364` bed-config note border

Se si vuole D.X piena serve rigenerare questi 3 dal nuovo primary (es. `#004a80` per dark, `#b3d4ee` per light). Visivamente oggi non stridono.

### 🔧 Bug / fix puntuali

**T3 — `.card-room-bed` overflow con contenuto alto**
Checklist §4: la card "Camera 4" con 2 letti impilabili (contenuto verticale > 220px) produce scroll verticale interno su **desktop** (mobile non visibile). Soluzione: `.card-room-bed { min-height: 220px }` invece di `height: 220px` in `app/globals.css`. Rischio: disuniformità minima di altezza tra card della stessa riga.

**T4 — Sticky bar mobile "non appare in tutte le sezioni"**
Checklist §6: verifica se è comportamento intenzionale (IntersectionObserver nasconde la bar quando `#booking-panel` è visibile) o bug. Probabilmente intenzionale. Richiede screenshot/descrizione del caso specifico per decidere.

**T5 — Mappa Google pinch-zoom 2 dita sposta la pagina**
Checklist §8: preesistente alla Sessione 7 (comportamento iframe Google Maps Embed). Non causato da nessun refactor oggi. Fix possibile: passare a Maps JS API con `gestureHandling: 'greedy'`, oppure overlay "tap per interagire" che intercetta il primo touch. Richiede valutazione UX mobile.

**T6 — `#dbeafe` deprecato in `BookingPanel.tsx:196`** ✅ risolto (2026-04-24)
Applicato durante Sessione 9: `.booking-panel__offer-pill-selected` usa ora `var(--color-primary-soft)` (commit `fc10a0e`).

### 🧹 Pulizia (non urgente)

**T7 — `#EEF5FC` hardcoded ovunque → `var(--color-primary-soft)`** 🟡 in corso
~30 occorrenze del valore `#EEF5FC` letterale nei sorgenti (wizard, scheda, guest portal, self-checkin, admin). Visivamente corretto (il valore matcha esattamente il token) ma inefficiente. Pulizia fattibile file-per-file durante le rispettive migration oppure con un search-replace globale.

Applicato durante Sessione 11 (`AvailabilityCalendar.tsx:192` — `.is-in-range` usa ora `var(--color-primary-soft)`) e Sessione 9 (`BookingPanel.tsx:185` — `.booking-panel__offer.is-picked` usa ora `var(--color-primary-soft)`). Residui: `BedConfigDisplay.tsx:113`, più altri fuori scope Fase B. Da spuntare man mano.

**T8 — `lib/beds24-client.ts` potenzialmente dead code** ✅ risolto (2026-04-24)
Verifica orfanazione confermata (0 consumer nel grep `.tsx/.ts/.js/.jsx` repo-wide). File rimosso nel commit `ce3fbf7` (316 righe eliminate). Token Beds24 auth vive interamente in `lib/beds24-token.ts` (single source of truth con Redis Upstash).

**T9 — i18n centralizzazione nei file scheda residenza** ✅ risolto parzialmente (2026-04-24) — consolidamento LABELS dict Session 7 rinviato

**Done** (4 consumer Session 9-12 migrati a `getTranslations()` + 22 chiavi × 4 locale aggiunte in `locales/*/common.json`, commit `dd41baa` + `1f75eaa` + `3523184` + `d1bef50` + `144413c`):
- BookingPanel: childrenHint, childAgeLabel, selectAge, yearsLabel0/1/N, maxPeopleOne/Many (+ bug fix accessibilità: "Massimo N persone" prima IT-only, ora 4 locale)
- PhotoCarousel: close/prev/next aria-label + photoCount "{count} foto"
- AvailabilityCalendar: prevMonth/nextMonth aria-label + riuso `clear` esistente
- FotoGalleryClient: prev/next/close/back aria-label + iosBannerText/iosBannerOpenSafari/rotateHint/emptyState

**Rinviato** (scope consolidamento LABELS dict già funzionanti ma duplicati con common.json):
- `app/[locale]/residenze/[slug]/page.tsx` — dict `LABELS` inline (~30 chiavi × 4 locale) + `FEATURE_LABELS` (~10 chiavi × 4 lingue)
- `components/residenze/RoomCard.tsx` — dict `LABELS` inline
- `components/residenze/ThingsToKnow.tsx` — dict `LABELS` inline
- Stato attuale: funzionanti in 4 lingue via dict inline tipo `LABELS[locale] ?? LABELS.it`
- Perché rinviato: consolidamento stilistico (zero fix funzionale, ~120 traduzioni da duplicare nel JSON + 3 file da refactorare, con rischio regressione)
- Quando farlo: opportunistic (quando uno di questi file viene toccato per altri motivi)

**Scope consumer migrati** ✅ **RISOLTI 2026-04-24** (commit `dd41baa` chiavi + 4 commit refactor):
- ✅ `PhotoCarousel.tsx`: aria-label Chiudi/Precedente/Successivo + "N foto" → `components.photoCarousel.*`
- ✅ `AvailabilityCalendar.tsx`: aria-label Mese precedente/successivo + Cancella date → `components.availabilityCalendar.prevMonth/nextMonth/clear`
- ✅ `FotoGalleryClient.tsx`: aria-label Precedente/Successivo/Chiudi/Indietro + 4 testi visibili banner iOS / hint rotate / empty state → `components.fotoGallery.*`
- ✅ `BookingPanel.tsx`: 4 gruppi hint/label/select/warning + fix accessibilità maxPeople (prima IT-only) → `components.bookingPanel.*`
- ~~`PhotoLightbox.tsx`~~: file eliminato nel cleanup post-Session 12 (commit `93e11b0`), scope i18n non più applicabile

**Residui i18n non-aria** da portare via getTranslations:
- `components.availabilityCalendar.clear` esiste già in `locales/*/common.json` ma non è usato (il bottone ✕ non ha testo visibile)
- aggiungere chiavi nuove: `components.photoCarousel.photoCount` (`"{n} foto"`), `.close`, `.prev`, `.next`; `components.availabilityCalendar.prevMonth`, `.nextMonth`, `.clear` (riuso già esistente come aria-label)

**Approccio sessione i18n dedicata**: grep di tutti gli hardcoded italiani in `components/residenze/**`, aggiungere chiavi mancanti nei 4 locale (it/en/de/pl), sostituire con `getTranslations()` + `aria-label={ui.close}` ecc.

**T10 — `DEL beds24:refreshToken` su Upstash** ✅ eseguito manualmente (2026-04-26 utente)
Follow-up del commit `6c4c867` (dedup REDIS_RT_KEY): dopo 2-3 giorni di deploy sano, cancellare manualmente la chiave legacy da Upstash Data Browser. Rete di sicurezza rollback non più necessaria passato quel tempo.

**T12 — `distanceLabel` in `config/properties.ts` hardcoded IT (bug i18n scheda residenza + wizard)** 🔴 scoperto 2026-04-24

**Impatto**: utenti EN/DE/PL vedono il testo in italiano in 2 punti visibili.

**Origine**: `config/properties.ts:41` dichiara `distanceLabel: string` (stringa singola); le 2 properties hardcodano il valore IT:
- `config/properties.ts:55` (LivingApple, propId 46487): `'A 1.5 km dal mare, immerso nella natura'`
- `config/properties.ts:226` (LivingApple Beach, propId 46871): `'Vicino al mare, a 250m dalla spiaggia'`

**Consumer**:
- `app/[locale]/residenze/[slug]/page.tsx:255` — sotto il titolo `H1` della scheda (`{property.distanceLabel} · {floorLabel}`)
- `components/wizard/BookingSidebar.tsx:183` — sidebar wizard step 1 (`{property.name} · {property.distanceLabel}`)

**Duplicati orfani già in `locales/*/common.json`** (traduzioni fatte ma mai cablate alla scheda — da consolidare):
- `:51 campagna_desc` — `"1.5 km dal mare, immerso nella natura"` + versioni EN/DE/PL
- `:407 nature` — `"A 1,5 km dal mare, immerso nella natura"` (variante con virgola)
- `:9 description` — `"10 appartamenti immersi nella campagna, a 1.5 km dal mare."` (usata solo in Home, non scheda)

**Soluzione consigliata — pattern già in uso nello stesso file** (`OFFER_INFO.name` / `.conditions` riga 378/379 sono `Record<string, string>`):
```ts
// config/properties.ts
distanceLabel: { it: '...', en: '...', de: '...', pl: '...' },
// Consumer: property.distanceLabel[locale] (fallback a .it se locale mancante)
```

**Scope intervento**:
- `config/properties.ts`: tipo `Property.distanceLabel` → `Record<string, string>` + 2 properties × 4 locale = 8 stringhe
- `app/[locale]/residenze/[slug]/page.tsx:255`: `{property.distanceLabel[locale] ?? property.distanceLabel.it}`
- `components/wizard/BookingSidebar.tsx:183`: idem (+ verificare se ha già `locale` nello scope)
- Cleanup: eliminare le chiavi duplicate `campagna_desc` / `nature` / `natura` in `locales/*/common.json` se non consumate altrove (grep prima)

**Da fare insieme alla sessione i18n dedicata** (vedi T9). ✅ risolto (2026-04-24) — eseguito insieme alla Sessione T9 allargata (commit `a261189` core + `4b53fb4` cleanup chiavi dead in locales).

---

**T13 — Chrome violation "unload is not allowed"** 🟡 probabilmente non del sito (scoperto 2026-04-26)
Warning console su `/it/residenze/fuji`: `nuanria.Chrome.js:70 [Violation] Permissions policy violation: unload is not allowed in this document.`
Il file `nuanria.Chrome.js` NON è codice del sito — è un'estensione Chrome installata dall'utente (probabilmente "Claude in Chrome" / simile). Il warning segnala che un listener `unload` (evento deprecato in Chrome moderni) è registrato dall'estensione, non dal nostro codice.
**Azione consigliata**: testare in Incognito (senza estensioni) per confermare che il warning sparisce. Se sparisce → falso positivo da estensione, da ignorare. Se persiste → indagare origine.

**T14 — Runtime error "message port closed" su contatti** 🟡 probabilmente non del sito (scoperto 2026-04-26)
Errore console su `/it/contatti`: `Unchecked runtime.lastError: The message port closed before a response was received.`
Messaggio tipico di `chrome.runtime.sendMessage` usato in estensioni Chrome (quando il sendMessage finisce senza che il listener abbia chiamato `sendResponse`). Il codice del sito NON usa `chrome.runtime` API.
**Azione consigliata**: come T13, testare in Incognito per confermare falso positivo da estensione.

**T15 — 401 loggato come errore su `/api/portal/booking`** 🟢 behavior normale, da silenziare (scoperto 2026-04-26)
Sul Guest Portal quando l'utente NON è loggato, la fetch iniziale a `/api/portal/booking` restituisce 401 che appare come errore nella console. È il comportamento corretto (l'auth guard protegge l'endpoint), ma l'errore rumoroso in console non è ideale.
**Fix**: intercettare il 401 nel client (`GuestPortal.tsx` o file auth) come "non autenticato → redirect login silenzioso", senza propagare come errore console.
**Scope**: piccolo, 1 file, ~10 min.

**T16 — 🔴 Traduzione EN errata: "Sommier" → "Divan bed"** (scoperto 2026-04-26, bug user-facing)
`components/residenze/BedConfigDisplay.tsx:40`:
```ts
'sommier': { it: 'Sommier', en: 'Divan bed', de: 'Sommier', pl: 'Sommier' },
```
**Problema**: "Divan bed" in inglese britannico significa **divano letto** (una base letto con cassetti sotto, tipo IKEA Malm). Il sommier italiano è invece la **base letto con doghe/molle** (l'elemento sotto al materasso). Traduzione confusa per utenti EN → rischio che pensino di affittare un divano letto invece di un letto vero.
**Fix proposto**: `en: 'Bed base'` (termine corretto per bed frame con doghe) oppure `en: 'Sommier'` (termine francese usato anche in EN tecnico). Preferito **"Bed base"** (più naturale per nativi EN).
**Scope**: 1 riga, file `BedConfigDisplay.tsx`. DE e PL già corretti (usano "Sommier").

---

## 7. Gestione rischi

| Rischio | Mitigazione |
|---|---|
| Regressione visiva silenziosa | Screenshot prima/dopo per ogni file. Utente approva prima del file successivo |
| Regressione funzionale (pagamento, fetch) | Non tocco la logica. Click-test di fine sessione. Se esiste un dubbio → stop e chiedo |
| Classi troppo astratte che non combaciano | Pattern audit preliminare (sessione 0) prima di creare la libreria |
| Context-window: tenere 17 file in testa è impossibile | 1 file = 1 sessione. Contesto fresco ogni volta |
| Deploy continuo su Vercel rompe produzione | Ogni commit è atomico e reversibile (`git revert <sha>`). Se qualcosa va live storto, rollback in 30 secondi |
| "Scope creep" — voglia di rifare anche design | **No**. Il refactor CSS non è un redesign. Le patch visive dell'audit §4 sono le uniche modifiche estetiche ammesse, e sono sempre marcate nel commit message |

---

## 8. Metriche di progresso

| Sessione | File toccato | Inline eliminati (sessione) | Inline rimanenti (scope 17 file) |
|---|---|---|---|
| 0 | — (audit) | 0 | 413 |
| 1 | — (libreria CSS) | 0 | 413 |
| 2 | Wizard.tsx | 5 | 408 |
| 3 | WizardSidebar.tsx | 29 | 379 |
| 4 | WizardStep1.tsx | 66 | 313 |
| 5 | WizardStep2.tsx | 81 | 232 |
| 6 | WizardStep3.tsx | 32 | 200 |
| 7 | 5 file piccoli scheda | 19 | 181 |
| 8 | BedConfig + CardPhotoGallery | 38 | 143 |
| 10 | PhotoCarousel + PhotoLightbox (quest'ultimo poi eliminato) | 53 | 90 ✅ |
| 11 | AvailabilityCalendar | 33 | 57 ✅ |
| 12 | FotoGalleryClient | 33 (34 → 1 dinamico) | 24 ✅ |
| 9 | BookingPanel | 24 (25 → 1 dinamico giustificato) | 0 ✅ |
| mob | Sessione mobile WizardStep2 | 48 | 0 ✅ (2026-04-24, piano programmato chiuso) |

### 8.1 Metriche finali misurate (2026-04-24, 🏁 Piano programmato COMPLETATO)

Numeri da `grep 'style={{' components/` + `grep 'style={{' app/` post-sessione mobile-WizardStep2.

**Scope Fase B + post-B programmato (16 file, era 17 pre-delete PhotoLightbox):**

| Categoria | # file | Note |
|---|---|---|
| File a **zero inline** | 14 | 5 wizard (Wizard, BookingSidebar, WizardStep1, **WizardStep2**, WizardStep3) + 9 scheda (page, RoomCard, PropertyMap, ThingsToKnow, StickyBookingBar, CardPhotoGallery, BedConfigDisplay, PhotoCarousel, AvailabilityCalendar) |
| File con **1 inline dinamico giustificato** | 2 | `BookingPanel.tsx` (gridTemplateColumns numChild 1/2) + `FotoGalleryClient.tsx` (frozenW/H iOS fix) |
| File con **debito programmato** | 0 | Tutti chiusi ✅ |

**Inline eliminati Fase B + post-B (misurati):**

| | Prima (plan) | Dopo (grep reale) | Eliminati |
|---|---|---|---|
| Wizard (5 file) | 213 | 0 | 213 |
| Scheda abitazione (12→11 file) | 200 | 2 (dinamici giustificati) | 198 |
| **Totale** | **~413** | **2** | **411 style eliminati** |

**Debito residuo repo-wide (al 2026-04-24, post sessione mobile):**

| Area | File | `style={{}}` | In scope? |
|---|---|---|---|
| `components/residenze/` (BookingPanel, FotoGalleryClient) | 2 | 2 | ✅ dinamici giustificati |
| `components/wizard/WizardStep2.tsx` | 1 | 0 | ✅ chiuso 2026-04-24 |
| `app/[locale]/paga/PagaClient.tsx` | 1 | 34 | ❌ Fase 3 opportunistica |
| `app/[locale]/prenota/successo/SuccessContent.tsx` | 1 | 12 | ❌ Fase 3 |
| `components/self-checkin/*` (3 file: WizardCheckin, SelfCheckinPage, StatusCheckin) | 3 | 179 | ❌ Fase 3 |
| `components/guest/*` (6 file: BedSection, ChangeRequestWizard, CheckinSection, GuestLogin, DepositSection, GuestPortal) | 6 | 189 | ❌ Fase 3 |
| `components/admin/*` (4 file: AdminPulizie, AdminCheckin, AdminBuchi, AdminBiancheria) | 4 | 81 | ❌ Fase 3 (solo se decisa) |
| `components/home/*` (HomeSearch, ResidenzaSlider) | 2 | 118 | ❌ Fase 3 |
| `components/contatti`, `dove-siamo`, `animali`, `deposito`, `prenotazione-sicura`, `utenze`, `HeaderClient` | 7 | 124 | ❌ Fase 3 |
| `components/ui/*` (primitive Card, Button) | 2 | 2 | ❌ Fase 3 |
| `app/[locale]/*/page.tsx` + `layout.tsx` (shells + legali + lista residenze + successo/page + prenota/page + condizioni + privacy + trattamento-dati + admin/page + paga/page) | 9 | 27 | ❌ Fase 3 |
| **Totale repo** | **37 file** | **768** | |

**Rapporto inline eliminati / totale progetto**: 411 / (411 + 768) = **~35%** del debito inline storico smaltito nella Fase B + sessione mobile, con **100% delle pagine-utente del funnel booking coperte** (scheda residenza + wizard 1/2/3 incluso accordion mobile a zero inline, pagamento resta in stato corrente).

### 8.2 Sweep emoji 2026-04-24

Regola **"no emoji decorative, sempre Bootstrap Icons"** applicata a tutto il sito tranne area admin (esclusa da utente) e commenti di sviluppo.

**File toccati (~30)**: WizardStep1, 4 pagine root (paga/successo/residenze/home), 8 marketing (HeaderClient, PropertyMap, Utenze, Contatti, Deposito, Animali, DoveSiamo, PrenotazioneSicura), 6 guest portal (GuestLogin, GuestPortal, DepositSection, CheckinSection, ChangeRequestWizard, BedSection), 3 self-checkin (WizardCheckin, StatusCheckin, SelfCheckinPage), residui (BookingPanel/AvailabilityCalendar/FotoGalleryClient/PhotoCarousel/WizardStep2), `locales/*/common.json × 4` (~15 chiavi pulite + icon consumer wiring).

**Mapping principale** (~50 emoji sostituite):
- 🏠 bi-house-fill · 🛏️/🛏 bi-door-closed-fill · 🚿 bi-droplet-fill · 👥 bi-people-fill · 📐 bi-aspect-ratio
- 🏊/🌊 bi-water · 🏖️ bi-umbrella-fill · 🌿 bi-tree-fill · ☀️ bi-sun-fill · ❄️ bi-snow · 🌙 bi-moon-stars-fill
- 📍 bi-geo-alt-fill · 🏛️ bi-building · 🏢 bi-building-fill · 🏨 bi-building
- 🔐 bi-shield-lock-fill · 🔒 bi-lock-fill · 🛡️ bi-shield-fill · ⚠️ bi-exclamation-triangle-fill · ⚡ bi-lightning-fill
- 💳 bi-credit-card-fill · 🅿️ bi-paypal · 💶/💰 bi-currency-euro / bi-cash-coin · 🏷️ bi-tag-fill
- ✅/✓ bi-check-circle-fill / bi-check-lg · ❌ bi-x-circle-fill · ✕ bi-x-lg · ℹ️ bi-info-circle-fill · 💡 bi-lightbulb-fill
- 💬 bi-chat-fill (+ bi-whatsapp per link WA) · ✉️/📧 bi-envelope-fill · 🔗 bi-link-45deg · 🔍 bi-search
- 📋 bi-clipboard-fill · 📝 bi-sticky-fill · 📰 bi-newspaper · 📅/🗓️ bi-calendar-fill · ⏳/⏱️ bi-hourglass-split / bi-clock-fill
- ⚖️ bi-bank2 · 🐾 bi-heart-fill (no paw, closest) · 🐕 bi-check-circle-fill · 🧸 bi-emoji-smile · ⭐ bi-star-fill
- ✈️ bi-airplane-fill · 🚂/🚉 bi-train-front-fill · 🚗 bi-car-front-fill · 🍼 bi-egg-fill (no bottle) · 👤 bi-person-fill

**Pattern consumer esteso**: dove array dict aveva `{ icon: 'emoji' }`, il valore è ora nome class Bootstrap (`{ icon: 'bi-xxx' }`) e il renderer usa `<i className={`bi ${item.icon}`}>` invece di `{item.icon}`.

**Eccezioni legittime rimaste (non da toccare)**:
- commenti di sviluppo in TSX/TS/CSS (`// ✅ FIX:`, `/* BANNER ⚡ */`, `console.log('✅')`)
- log server-side in `app/api/**` (trace emoji non-UI)
- email/Slack backend messages in `app/api/portal/*`
- prose markdown-style (`✗`/`✓` come bullet markers in testo narrativo di PrenotazioneSicuraClient chapters)
- area admin esclusa da utente (3 file: AdminBiancheria/AdminCheckin/AdminPulizie)

**Commit sweep** (8 commit, 2026-04-24): `a9e1ba4` WizardStep1 · `172d03e` FAQ icons + ContattiClient · `da2628b` pool values + consumer · `97bbd52` 4 pagine pubbliche root · `6c05f3e` 8 marketing · `38be518` 6 guest portal · `c9deb46` 3 self-checkin · `4f1ebc0` sweep residui finale.

**Prossimi passi — aggiornato 2026-04-24 post-task T8+T12+T9**:

| # | Cosa | Prio | Effort | Stato |
|---|------|------|--------|-------|
| 1 | ~~T8 `lib/beds24-client.ts` dead code~~ | ⚪ | ~15min | ✅ risolto (commit `ce3fbf7`, -316 righe dead) |
| 2 | ~~Sessione i18n T9 (parte consumer Session 9-12 + T12 assorbito)~~ | 🔴🟡 | ~3h | ✅ risolto 7 commit (`a261189` T12 core, `4b53fb4` locales cleanup, `dd41baa` 22 chiavi × 4 locale, `1f75eaa` BookingPanel, `3523184` PhotoCarousel, `d1bef50` AvailabilityCalendar, `144413c` FotoGalleryClient). Fix accessibilità bonus: bookingPanel.maxPeople prima IT-only ora 4 locale |
| 3 | ~~Sessione mobile WizardStep2~~ | 🟡 | 2-3h | ✅ risolto 2026-04-24 (commit `ed5db23` css + `4ce08c0` refactor). 48 inline → 0, SidebarContent + SideRow + 2 CSSProp legacy a BEM `.wizard-step2-mobile__*`. 4 emoji decorative → Bootstrap Icons (🛏️ mantenuta). **🏁 piano programmato chiuso** |
| 4 | ~~Consolidamento LABELS dict Session 7 (T9 residuo)~~ | ⚪ | ~2h | ✅ risolto 2026-04-24 (commit `4b9d791` chiavi, `35b5100` RoomCard, `e24a6c7` ThingsToKnow, `8807a74` page.tsx). 48 chiavi × 4 locale aggiunte in namespace `components.roomCard/roomPage/thingsToKnow`. Bonus: 9 emoji decorative → bi-* (🛏️🚿👥📐 RoomCard badge + 🏊🌊🏖️ pool + 🐾🚭 rules) + 2 eccezioni residue chiuse (🛏️ WizardStep2 extras, 📷 FotoGalleryClient banner iOS). FEATURE_LABELS di page.tsx RESTA inline (catalogo structured) |
| 5 | ~~T10 cleanup Redis key legacy~~ | ⚪ | ~5min | ✅ eseguito manualmente (2026-04-26, utente via Upstash Data Browser) |
| 7 | **T13** Chrome unload violation su /residenze/[slug] | 🟡 | 5min | Test in Incognito. Probabilmente falso positivo da estensione `nuanria.Chrome.js`. Se persiste → indagare |
| 8 | **T14** Runtime error "message port closed" su /contatti | 🟡 | 5min | Stesso pattern di T13 (estensione Chrome chrome.runtime.sendMessage). Test Incognito |
| 9 | **T15** 401 loggato come errore su `/api/portal/booking` non autenticato | 🟢 | ~10min | Intercettare 401 nel client come redirect login silenzioso (non error) |
| 10 | **T16** 🔴 EN "Divan bed" (sbagliato per Sommier) | 🔴 | ~2min | Fix `BedConfigDisplay.tsx:40` → `en: 'Bed base'`. Bug user-facing EN, rischio confusione ospiti |
| 6 | ~~WizardStep1 emoji decorative~~ + **sweep globale emoji tutto il sito** | ⚪ | completato | ✅ risolto 2026-04-24 (sweep globale, ~30 file toccati). Regola 'no emoji decorative' applicata uniformemente tranne admin (escluso da utente) e commenti di sviluppo. Sommario in [§8.2 qui sotto](#82-sweep-emoji-2026-04-24) |

---

## 9. Dopo questo piano (Fase 3 opportunistica, non prescritta)

- Self-checkin (2 file, 85 inline)
- Guest portal (5 file, 130 inline)
- Marketing minori (4 file, 61 inline)
- Pagine legali (3 file, 7 inline)
- Admin (5 file, 85 inline) — solo se si deciderà di includere l'admin

Verranno migrati **quando** toccati per altri motivi (bug, feature, evolution), applicando la **stessa libreria CSS** della Fase 2. Nessuna sessione dedicata, nessuna pressione.

---

## 10. Cosa NON fa questo piano

- ❌ Non tocca il contenuto / logica (pagamento, validazione, fetch, store, routing)
- ❌ Non introduce nuovi primitivi React oltre a quelli già esistenti (Stepper, BookingSummary, Button, Card, FormField)
- ❌ Non tocca i 35 file fuori scope
- ❌ Non adotta CSS-in-JS (styled-components, emotion): resta plain CSS + token (scelta di `docs/ux-audit.md §7`)
- ❌ Non fa A/B test, analytics, performance optimization
- ❌ Non ristruttura il layout a colonna/griglia (eccezione: le patch minime già elencate dall'audit visivo wizard, applicate in corsa)

---

## 11. Comunicazione utente↔Claude

### All'inizio di ogni sessione
Riapro la conversazione con: *"Sessione N, file X, inline target Y. Riletto il file, pattern mappati: [elenco]. Procedo?"* — attendo OK.

### Durante la sessione
Se emerge decisione nuova, **stop e domanda breve**. Non invento.

### A fine sessione
Riporto: *"Sessione N completata. File X, Y inline → 0. Commit: [sha]. Deploy Vercel: [link]. Screenshot incluso."* Attendo approvazione visiva prima della sessione successiva.

---

## 12. Riferimenti

- [`docs/ux-audit.md`](../ux-audit.md) — audit UX pagine
- [`docs/design-system/audit-primitivi.md`](../design-system/audit-primitivi.md) — audit Button/Card/FormField
- [`docs/ux/wizard-layout.md`](./wizard-layout.md) — spec layout wizard (con §14 rollback onesto)
- [`docs/ux/wizard-visual-audit.md`](./wizard-visual-audit.md) — audit visivo cross-step
- [`app/globals.css`](../../app/globals.css) — token + classi esistenti

---

## 13. Quando ripartiamo?

In qualsiasi momento, in una nuova sessione. Basta scrivermi:

> *"Procediamo con la Sessione 0 del migration plan."*

Io rileggo questo documento, apro l'audit dei 17 file target, scrivo la mappa pattern, e chiedo conferma prima di iniziare a creare la libreria CSS.

Nessuna memoria persistente: il documento è la memoria. Se le decisioni cambiano, si aggiorna il doc prima di ripartire.
