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
| `components/residenze/PhotoLightbox.tsx` | 26 | Lightbox gallery | 🟡 media |
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
| 4 | WizardStep1.tsx | migra 66 inline. Applica §1.1 (titolo nero, non blu) dell'audit visivo | ⏳ |
| 5 | WizardStep2.tsx | migra 81 inline residui (post 3c). Applica §2.1–2.6 dell'audit visivo | ⏳ |
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

| # | Sessione | File | Note |
|---|---|---|---|
| 7 | File piccoli in un colpo | page + RoomCard + PropertyMap + ThingsToKnow + StickyBookingBar = 19 inline | Batch di file semplici come warm-up dell'area |
| 8 | BedConfigDisplay + CardPhotoGallery | 38 inline totali | Pattern "card residenza" |
| 9 | BookingPanel | 25 inline | CTA principale scheda (entry booking) |
| 10 | PhotoCarousel + PhotoLightbox | 53 inline totali | Gallery + lightbox, pattern condivisi |
| 11 | AvailabilityCalendar | 33 inline | Calendario complesso, sessione dedicata |
| 12 | FotoGalleryClient | 34 inline | Pagina foto completa |

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
| 9 | BookingPanel | 25 | 118 |
| 10 | PhotoCarousel + PhotoLightbox | 53 | 65 |
| 11 | AvailabilityCalendar | 33 | 32 |
| 12 | FotoGalleryClient | 34 | 0 ✅ |

A fine piano: **17 file a zero inline**, **413 style eliminati**, **35% del debito inline totale del progetto smaltito** con **100% delle pagine-utente coperte**.

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
