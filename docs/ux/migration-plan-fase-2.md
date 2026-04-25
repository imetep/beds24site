# Piano di Migrazione CSS — Fase 2 (post-funnel + marketing + primitive)

**Data:** 2026-04-25
**Stato:** 🟢 ratificato — piano di esecuzione successivo alla Fase B
**Scope:** le aree del sito non coperte dalla [Fase B](./migration-plan.md) e che restano critiche per l'esperienza ospite o la presenza brand. **33 file, 690 style inline** da migrare al Livello 2 (classi CSS in `globals.css`, zero inline nel JSX).

**Fuori scope (escluso esplicitamente):** area `components/admin/*` (4 file, 81 inline) — esclusione confermata dall'utente. Resta in stato corrente, eventualmente migrata opportunisticamente solo se toccata per altri motivi.

**Numerazione sessioni:** continua da Fase B (1-13) → **Fase 2 = sessioni 14-27**.

---

## 1. Principio guida — "la mamma" (invariato dalla Fase B)

Tutti i file del sito devono sembrare **figli della stessa mamma**. La Fase 2 estende lo stesso DNA design system della Fase B alle aree post-pagamento, marketing trust, primitive UI e page shells.

### 1.1 Il contratto per ogni file migrato

Dopo una sessione di migrazione il file deve avere:

- ✅ **Zero `style={{}}` inline** (unica eccezione: valori **dinamici** calcolati a runtime, es. `width: ${progress}%`. Ogni eccezione va commentata nel codice con la ragione).
- ✅ **Zero hex hardcoded** (`#FCAF1A`, `#1E73BE`, `#e5e7eb`, ecc.) nel JSX e nei CSS nuovi. Tutti via `var(--color-*)`.
- ✅ **Zero numeri magici** per spacing/padding/radius/font-size. Tutti via `var(--space-*)`, `var(--radius-*)`, `var(--text-*)`.
- ✅ **Tutte le classi nuove** definite in `globals.css` (o un file CSS dedicato se la libreria cresce).
- ✅ **Typecheck pulito** (`npx tsc --noEmit`) prima del commit.
- ✅ **Verifica visiva su Vercel** prima della sessione successiva.
- ✅ **Bootstrap Icons** (`bi-*`) ovunque. Emoji solo come contenuto semantico (eccezioni esplicite e documentate).
- ✅ **Token testo aggiornati** dalla Fase B: `--color-text` (#0d1b2a blu-notte), `--color-text-muted`, `--color-text-subtle`, `--color-text-disabled`, `--color-text-accent` (#C5881F arancione su highlight).

### 1.2 Il contratto per ogni sessione

- 📖 **Lettura integrale** del file prima di toccare (lezione dalla regressione sidebar Fase B).
- 💬 **Niente esperimenti senza conferma** — se emergono scelte di design nuove, si fermano in una domanda, non si implementano "a sensibilità mia".
- 💾 **Commit atomici** (memoria utente: 1 file modificato = 1 commit). Se una sessione tocca 1 file JSX + `globals.css` + 4 traduzioni, sono 6 commit.
- 🚀 **Push a fine sessione** (memoria utente: Vercel deploya su push).
- 🧪 **Test funzionale del flusso toccato** dopo push. Per Tier 1 (booking funnel post-payment) il test è obbligatorio: PagaClient → smoke con carta Stripe test, Guest Portal → login con prenotazione test, Self-checkin → wizard end-to-end.

### 1.3 Principio del business

> *"È meglio perdere 2 prenotazioni che deludere un ospite."*

Applicato alla Fase 2: **mai deployare qualcosa che introduce attriti o bug nel post-booking journey** (pagamento, guest portal, self-checkin). Preferibile fermarsi e chiedere piuttosto che tentare un fix "al volo" su file che gestiscono pagamenti, dati ospite, deposit cauzionale.

---

## 2. Pre-requisiti (già fatti, ereditati dalla Fase B)

- ✅ [Audit UX generale](../ux-audit.md)
- ✅ [Audit primitivi Button/Card/FormField](../design-system/audit-primitivi.md)
- ✅ Sessione 0 + 1 Fase B (pattern audit + libreria CSS base in `globals.css`)
- ✅ 17 design token strutturali in `globals.css` (13 originari + 4 introdotti durante Fase B)
- ✅ Primitivi `Stepper`, `BookingSummary`, `BookingSidebar` creati
- ✅ Sweep emoji globale completata (~30 file Fase B, regola `bi-*` Bootstrap Icons)
- ✅ Sessione i18n T9 + T12 chiusa (4 lingue allineate)
- ✅ T1+T2 chiusi (token testo armonizzati al brand `#006CB7` + `#FCAF1A`)

---

## 3. Le aree da migrare (Fase 2)

### 3.1 Tier 1 — Booking funnel post-pagamento (rosso, alta criticità)

L'ospite vive end-to-end: **paga → conferma → guest portal → self-checkin**. Stesso DNA della scheda residenza + wizard.

| File | # inline | Ruolo | Complessità |
|---|---|---|---|
| `app/[locale]/paga/PagaClient.tsx` | 34 | Pagina pagamento standalone (Stripe Element + PayPal) | 🔴 alta (pagamento!) |
| `app/[locale]/paga/page.tsx` | 3 | Page shell paga | 🟢 bassa |
| `app/[locale]/prenota/successo/SuccessContent.tsx` | 12 | Pagina conferma post-pagamento | 🟡 media |
| `app/[locale]/prenota/successo/page.tsx` | 2 | Page shell successo | 🟢 bassa |
| `app/[locale]/prenota/page.tsx` | 2 | Page shell prenota (entry wizard) | 🟢 bassa |
| `components/guest/GuestPortal.tsx` | 60 | Container guest portal (banner + sezioni) | 🟡 media |
| `components/guest/GuestLogin.tsx` | 12 | Form login ospite (bookId + arrivo) | 🟢 bassa |
| `components/guest/BedSection.tsx` | 32 | Sezione configurazione letti | 🟡 media |
| `components/guest/DepositSection.tsx` | 26 | Sezione deposito cauzionale (Stripe SetupIntent) | 🔴 alta (Stripe!) |
| `components/guest/CheckinSection.tsx` | 18 | Sezione check-in pending/approved/rejected | 🟡 media |
| `components/guest/ChangeRequestWizard.tsx` | 43 | Wizard richiesta modifiche prenotazione | 🟡 media (logica multi-step) |
| `components/self-checkin/WizardCheckin.tsx` | 96 | Wizard self-check-in completo (form + upload doc) | 🔴 alta (file upload + validazioni) |
| `components/self-checkin/StatusCheckin.tsx` | 31 | Pagina stato check-in (pending/approved/rejected) | 🟡 media |
| `components/self-checkin/SelfCheckinPage.tsx` | 52 | Container self-checkin (auth + routing) | 🟡 media |

**Sub-totale Tier 1: 14 file, 423 inline**

### 3.2 Tier 2 — Entry / discovery (arancione, alta visibilità)

| File | # inline | Ruolo | Complessità |
|---|---|---|---|
| `components/home/HomeSearch.tsx` | 111 | Hero home + search bar (date picker, ospiti) | 🔴 alta (file grosso, calendar custom) |
| `components/home/ResidenzaSlider.tsx` | 7 | Carosello residenze landing | 🟢 bassa |
| `components/HeaderClient.tsx` | 9 | Header globale (nav, lang switcher, cta) | 🟢 bassa |

**Sub-totale Tier 2: 3 file, 127 inline**

### 3.3 Tier 3 — Marketing trust (giallo, media criticità)

Pagine accessorie che costruiscono fiducia pre-booking. Traffico medio, ma SEO importante.

| File | # inline | Ruolo | Complessità |
|---|---|---|---|
| `components/contatti/ContattiClient.tsx` | 32 | Pagina contatti (form + WhatsApp + indirizzi) | 🟡 media |
| `components/dove-siamo/DoveSiamoClient.tsx` | 13 | Pagina "Dove siamo" (mappa + indicazioni) | 🟢 bassa |
| `components/deposito/DepositoClient.tsx` | 29 | Pagina spiegazione deposito cauzionale | 🟡 media |
| `components/prenotazione-sicura/PrenotazioneSicuraClient.tsx` | 19 | Pagina trust prenotazione (cancellazione, garanzie) | 🟡 media |
| `components/utenze/UtenzeClient.tsx` | 15 | Pagina utenze incluse (consumi energetici) | 🟢 bassa |
| `components/animali/AnimaliClient.tsx` | 7 | Pagina pet policy | 🟢 bassa |

**Sub-totale Tier 3: 6 file, 115 inline**

### 3.4 Tier 4 — Pulizia finale (verde, low priority)

| File | # inline | Ruolo | Complessità |
|---|---|---|---|
| `components/ui/Card.tsx` | 1 | Primitive Card (raro uso) | 🟢 bassa |
| `components/ui/Button.tsx` | 1 | Primitive Button (raro uso) | 🟢 bassa |
| `app/[locale]/layout.tsx` | 8 | Layout root (font, theme provider) | 🟡 media (impatta tutto) |
| `app/[locale]/residenze/page.tsx` | 4 | Pagina lista residenze | 🟢 bassa |
| `app/[locale]/privacy/page.tsx` | 2 | Pagina legale privacy | 🟢 bassa |
| `app/[locale]/condizioni/page.tsx` | 1 | Pagina legale condizioni | 🟢 bassa |
| `app/[locale]/trattamento-dati/page.tsx` | 1 | Pagina legale GDPR | 🟢 bassa |

**Sub-totale Tier 4: 7 file effettivi (Card + Button + 5 page shells), 17 inline**

### 3.5 Pagine già coperte da Fase B (riferimento)

`app/[locale]/paga/page.tsx`, `successo/page.tsx`, `prenota/page.tsx` — page shell minori già citate in Tier 1 sopra.

### ⚫ Esclusi (memoria utente)

| File | # inline | Ruolo | Stato |
|---|---|---|---|
| `components/admin/AdminBiancheria.tsx` | 38 | Admin biancheria | ⚫ escluso |
| `components/admin/AdminCheckin.tsx` | 24 | Admin check-in | ⚫ escluso |
| `components/admin/AdminPulizie.tsx` | 16 | Admin pulizie | ⚫ escluso |
| `components/admin/AdminBuchi.tsx` | 3 | Admin gestione buchi prenotazioni | ⚫ escluso |

**Totale escluso: 4 file, 81 inline.** Possono essere riconsiderati in una "Fase 3 admin" futura solo se decisione esplicita utente.

---

## 4. Ordine di esecuzione (14 sessioni)

L'ordine è ottimizzato per: **rischio crescente** (warm-up sui flussi semplici prima dei pagamenti) + **valore crescente** (lavoro sui pezzi più critici quando il sistema è rodato).

### Tier 1 — Booking funnel post-pagamento

| # | Sessione | File | Obiettivo | Stato |
|---|---|---|---|---|
| 14 | Pagamento standalone | `paga/PagaClient.tsx` + `paga/page.tsx` | migra 37 inline. Stripe Element preserva il theme nativo (no token applicati lì). Smoke test obbligatorio con carta test Stripe (`4242 4242 4242 4242`). | ⏳ |
| 15 | Post-pagamento | `successo/SuccessContent.tsx` + `successo/page.tsx` + `prenota/page.tsx` | migra 16 inline su 3 page shell. Banner success/error pattern unificato. | ⏳ |
| 16 | Guest login + portal main | `GuestLogin.tsx` + `GuestPortal.tsx` | migra 72 inline. Pattern login form unificato + container portal con banner sezione (deposit success/cancel). | ⏳ |
| 17 | Guest sections A | `BedSection.tsx` + `DepositSection.tsx` + `CheckinSection.tsx` | migra 76 inline. Pattern dashboard-card unificato. DepositSection: smoke test Stripe SetupIntent (carta test). | ⏳ |
| 18 | Guest change request | `ChangeRequestWizard.tsx` | migra 43 inline. Wizard 3-step (data, motivo, conferma). Riuso pattern `Stepper` esistente. | ⏳ |
| 19 | Self-checkin wizard | `WizardCheckin.tsx` | migra 96 inline. Form 4-step + file upload. Test arrivo end-to-end con bookId reale. | ⏳ |
| 20 | Self-checkin status + page | `StatusCheckin.tsx` + `SelfCheckinPage.tsx` | migra 83 inline. Pattern stati pending/approved/rejected unificato (riuso da CheckinSection). | ⏳ |

**Dopo ogni sessione Tier 1**: smoke test completo del flusso toccato (no solo screenshot), approvazione tua prima della sessione successiva.

### Tier 2 — Entry / discovery

| # | Sessione | File | Obiettivo | Stato |
|---|---|---|---|---|
| 21 | Home search | `HomeSearch.tsx` | migra 111 inline. File grosso con date picker custom + ospiti stepper + responsive desktop/mobile. Probabile sub-sessione 21a/21b se troppo lungo. | ⏳ |
| 22 | Home slider + header | `ResidenzaSlider.tsx` + `HeaderClient.tsx` | migra 16 inline. Carousel residenze + header globale (lang switcher, hamburger). | ⏳ |

### Tier 3 — Marketing trust

| # | Sessione | File | Obiettivo | Stato |
|---|---|---|---|---|
| 23 | Trust istituzionale | `ContattiClient.tsx` + `DoveSiamoClient.tsx` | migra 45 inline. Hero gradient (già in token Fase B), form contatti, mappa indicazioni. | ⏳ |
| 24 | Trust booking | `DepositoClient.tsx` + `PrenotazioneSicuraClient.tsx` + `UtenzeClient.tsx` | migra 63 inline. Pattern "sezione info long-form" + bullet list + banner trust. | ⏳ |
| 25 | Trust extra | `AnimaliClient.tsx` | migra 7 inline. Pet policy minor page. | ⏳ |

### Tier 4 — Pulizia finale

| # | Sessione | File | Obiettivo | Stato |
|---|---|---|---|---|
| 26 | UI primitive | `ui/Card.tsx` + `ui/Button.tsx` | migra 2 inline. File minimali, sweep finale. | ⏳ |
| 27 | Page shells + legali | `layout.tsx` + `residenze/page.tsx` + 3 pagine legali | migra 16 inline su 5 file. Layout root con cautela (impatta tutto il sito). | ⏳ |

**Dopo ogni sessione**: screenshot desktop + mobile della pagina toccata, confronto con prima, approvazione tua prima di passare alla successiva.

---

## 5. Criteri di "fatto bene" per sessione

Checklist rigida da completare **prima** del push finale di ogni sessione:

### 5.1 Pre-sessione
- [ ] File letto integralmente (una volta per sessione, anche se >500 righe)
- [ ] Pattern mappati a classi della libreria (§1). Se emerge un pattern nuovo, lo si aggiunge alla libreria e si documenta
- [ ] Rischi del file dichiarati (es. "tocca Stripe", "ha regex custom", "usa ref DOM", "fa file upload")
- [ ] Per Tier 1: identificato il **flusso di test funzionale** end-to-end (es. "PagaClient: completa pagamento test con carta 4242, verifica redirect a /successo")

### 5.2 Durante
- [ ] Ogni `style={{}}` trovato → o eliminato (→ className) o giustificato (valore dinamico)
- [ ] Ogni hex trovato → token. Se il token non esiste, lo si definisce PRIMA di usarlo
- [ ] Ogni numero magico → token. Stessa regola
- [ ] Ogni emoji decorativa trovata → Bootstrap Icon `bi-*` (eccezioni semantiche documentate)
- [ ] Nessuna modifica alla **logica di business** (pagamento, validazione, store, fetch, file upload, Stripe SetupIntent)
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
- [ ] **Tier 1**: smoke test funzionale obbligatorio:
  - Sessione 14 → completa pagamento con carta test Stripe → verifica `/successo`
  - Sessione 16 → login guest portal con bookId test → verifica dashboard
  - Sessione 17 → SetupIntent deposit (Stripe test) → verifica autorizzazione
  - Sessione 18 → invia change request → verifica email
  - Sessione 19/20 → completa self-checkin con upload doc → verifica admin riceve
- [ ] Riporto in chat all'utente: ✅ sessione N completata, X inline eliminati, smoke test OK

### 5.5 Stop condizioni (interrompo e chiedo conferma)
- Se il file ha comportamenti visivamente diversi dopo il refactor (anche se il tsc passa)
- Se il file ha pattern che non si sentono coperti dalla libreria (serve aggiornare la libreria, non inventare classi locali)
- Se emerge un bug di produzione non correlato al refactor (si ferma tutto, si fixa quello prima)
- **Tier 1 specific**: se il smoke test funzionale fallisce dopo refactor (anche con tsc verde) → REVERT immediato, indagine prima di re-push

---

## 6. Decisioni aperte (da risolvere in corsa, in ordine di apparizione)

### D.A — Stripe Elements custom theme (Sessione 14)

`PagaClient.tsx` e `DepositSection.tsx` usano Stripe Elements (`<CardElement>`, `<PaymentElement>`). Questi componenti renderizzano in iframe con styling controllato via prop `options`. Oggi probabilmente usano default Stripe.

**Opzioni:**
- **A** Lasciare default Stripe (theme neutro, blu Stripe brand)
- **B** Applicare theme custom con token brand: `colorPrimary: var(--color-primary)`, `colorText: var(--color-text)`, `fontFamily: var(--font-sans)`
- **C** Theme custom solo su elementi non-iframe (label, helper text), iframe Stripe resta default

**Da decidere prima della Sessione 14.** Default consigliato: **B** (allineamento brand completo, costo basso una volta stabiliti i token).

### D.B — Pattern banner notice (Sessione 14-20)

Il guest portal ha banner success/error/info/warning ricorrenti (`depositResult === 'success'` rendering verde, ecc.). Self-checkin idem. Oggi sono sparsi inline.

**Da unificare in 4 classi** durante Sessione 14 (libreria pre-Tier 1):
- `.notice-banner.is-success` (#d1fae5 bg, #065f46 text, bi-check-circle-fill)
- `.notice-banner.is-error` (#fef2f2 bg, #991b1b text, bi-x-circle-fill)
- `.notice-banner.is-info` (#dbeafe bg, primary text, bi-info-circle-fill)
- `.notice-banner.is-warning` (warning-soft bg, warning-text, bi-exclamation-triangle-fill)

Tutti centrali in `globals.css`, riusati nei file Tier 1. **Decidere prima della Sessione 14**.

### D.C — Pattern dashboard-card (Sessione 16-17)

Guest portal ha "card" sezione: Booking, Check-in, Deposit, Bed config. Ognuna ha header + body + footer-cta. Oggi inline.

**Pattern proposto:**
```css
.dashboard-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}
.dashboard-card__header { /* titolo + status badge */ }
.dashboard-card__body { /* contenuto principale */ }
.dashboard-card__footer { /* cta o info secondaria */ }
.dashboard-card__status-badge.is-pending { background: var(--color-warning-soft); color: var(--color-warning-text); }
.dashboard-card__status-badge.is-approved { background: #d1fae5; color: #065f46; }
.dashboard-card__status-badge.is-rejected { background: #fee2e2; color: #991b1b; }
```

**Decidere prima della Sessione 16**.

### D.D — Form input pattern (Sessione 16, 18, 19)

Self-checkin wizard ha form complessi (data nascita, ospiti, doc upload). GuestLogin ha form (bookId, arrivo). Riuso `.ui-field-*` esistenti dalla Fase B (BookingPanel) o estensione con varianti `.ui-field--compact`, `.ui-field--with-prefix-icon`, ecc.

**Da decidere durante Sessione 16** (prima estensione a GuestLogin).

### D.E — Empty states (Sessione 17, 20)

Pattern "nessun dato": guest portal "nessun deposito richiesto", self-checkin "nessun check-in pending", change-request "nessuna richiesta inviata".

**Pattern proposto:**
```css
.empty-state {
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  color: var(--color-text-muted);
}
.empty-state__icon { font-size: 2rem; margin-bottom: var(--space-sm); color: var(--color-text-disabled); }
.empty-state__title { font-size: var(--text-md); font-weight: 600; color: var(--color-text); margin-bottom: var(--space-xs); }
.empty-state__hint { font-size: var(--text-sm); color: var(--color-text-muted); }
.empty-state__cta { margin-top: var(--space-md); }
```

**Decidere prima della Sessione 17**.

### D.F — File upload pattern (Sessione 19)

Self-checkin wizard ha upload documento (carta identità). Pattern drag-drop + preview + remove. Da costruire ex novo.

**Da decidere all'inizio della Sessione 19** dopo lettura integrale `WizardCheckin.tsx`.

---

## 6.1 TODO che possono emergere durante Fase 2

Sezione speculare a §6.1 della Fase B, da popolare durante l'esecuzione. Esempi attesi:

- Inconsistenze i18n (chiavi hardcoded IT in pagine marketing) → da raccogliere e chiudere in sessione T9-bis
- Hex deprecati emersi in pagine marketing che il sweep Fase B non ha toccato (`#1E73BE` residui, `#dbeafe` deprecato, ecc.)
- Bug funzionali pre-esistenti scoperti durante refactor (es. self-checkin upload non funziona su Safari iOS)
- Opportunità design: pattern che ricorrono in 5+ pagine e meritano una primitiva React (es. `<NoticeBanner />`, `<DashboardCard />`)

---

## 7. Gestione rischi

| Rischio | Mitigazione |
|---|---|
| Regressione visiva silenziosa | Screenshot prima/dopo per ogni file. Utente approva prima del file successivo |
| Regressione funzionale Tier 1 (pagamento, deposito, self-checkin) | Smoke test obbligatorio post-deploy (5.4). Carta test Stripe + bookId test pre-creato |
| Stripe Elements stylistico break | D.A risolta prima Sessione 14. Test render su due viewport (320, 768, 1280) |
| File upload non funziona post-refactor | Sessione 19 testata localmente con file reale prima di push |
| Classi troppo astratte che non combaciano | Pre-sessione: pattern audit per Tier (§1.1 di ogni Tier). Estendere libreria, non inventare classi locali |
| Context-window: tenere 33 file in testa è impossibile | 1 file = 1 sessione (con sub-sessioni se >500 righe). Contesto fresco ogni volta |
| Deploy continuo su Vercel rompe produzione | Ogni commit è atomico e reversibile (`git revert <sha>`). Per Tier 1, rollback in 30 secondi |
| "Scope creep" — voglia di rifare anche design | **No**. Il refactor CSS non è un redesign. Le patch visive sono ammesse solo se documentate nel commit message e marcate `[design-patch]` |
| Pagine legali (privacy, condizioni, ecc.) hanno markup complesso | Sessione 27 con cautela. Page shells legali tipicamente solo wrapper, contenuto da CMS o markdown |

---

## 8. Metriche di progresso

| Sessione | File toccato | Inline eliminati (sessione) | Inline rimanenti (scope 33 file) |
|---|---|---|---|
| 14 | PagaClient + paga/page | 37 | 653 |
| 15 | SuccessContent + successo/page + prenota/page | 16 | 637 |
| 16 | GuestLogin + GuestPortal | 72 | 565 |
| 17 | BedSection + DepositSection + CheckinSection | 76 | 489 |
| 18 | ChangeRequestWizard | 43 | 446 |
| 19 | WizardCheckin | 96 | 350 |
| 20 | StatusCheckin + SelfCheckinPage | 83 | 267 |
| 21 | HomeSearch | 111 | 156 |
| 22 | ResidenzaSlider + HeaderClient | 16 | 140 |
| 23 | ContattiClient + DoveSiamoClient | 45 | 95 |
| 24 | DepositoClient + PrenotazioneSicuraClient + UtenzeClient | 63 | 32 |
| 25 | AnimaliClient | 7 | 25 |
| 26 | Card + Button | 2 | 23 |
| 27 | layout + residenze/page + 3 legali | 23 | 0 ✅ |

**Target finale: 690 → 0 inline su 33 file.** Tolleranza accettabile: **fino a 5 inline dinamici giustificati** sull'intero scope (analoghi al BookingPanel `gridTemplateColumns` Fase B).

### 8.1 Stato dopo Fase 2 completata (proiezione)

| | Pre Fase B | Post Fase B (oggi) | Post Fase 2 |
|---|---|---|---|
| File totali con inline | 53 | 37 | 4 (solo admin escluso) |
| Inline totali | 1179 | 770 | 81 (solo admin) |
| % debito eliminato | 0% | 35% | **93%** |

**Solo admin (4 file, 81 inline) resta non migrato** — esclusione esplicita utente.

---

## 9. Dopo Fase 2 (Fase 3 admin opportunistica, non prescritta)

Se si decidesse in futuro di migrare anche l'admin:
- `components/admin/AdminBiancheria.tsx` — 38 inline
- `components/admin/AdminCheckin.tsx` — 24 inline
- `components/admin/AdminPulizie.tsx` — 16 inline
- `components/admin/AdminBuchi.tsx` — 3 inline

Verrebbero migrate **quando** toccate per altri motivi (bug, feature, evolution), applicando la **stessa libreria CSS** della Fase B+2. Nessuna sessione dedicata, nessuna pressione.

---

## 10. Cosa NON fa questo piano

- ❌ Non tocca il contenuto / logica (pagamento, deposito Stripe, validazione, fetch, store, routing, file upload, email)
- ❌ Non introduce nuove primitive React oltre alle estensioni dei pattern esistenti (Stepper, BookingSummary, BookingSidebar, Card, Button, FormField). Eventuali primitive nuove (`NoticeBanner`, `DashboardCard`, `EmptyState`) emergeranno opportunisticamente e saranno proposte una alla volta
- ❌ Non tocca i 4 file admin
- ❌ Non adotta CSS-in-JS (styled-components, emotion): resta plain CSS + token (scelta di `docs/ux-audit.md §7`)
- ❌ Non fa A/B test, analytics, performance optimization
- ❌ Non ristruttura il layout a colonna/griglia (eccezione: patch minime già emerse dall'audit visivo, marcate `[design-patch]` nel commit)
- ❌ Non riscrive Stripe integration (Elements, SetupIntent, webhook) — solo styling esterno

---

## 11. Comunicazione utente↔Claude

### All'inizio di ogni sessione
Riapro la conversazione con: *"Sessione N (Fase 2), file X, inline target Y. Riletto il file, pattern mappati: [elenco]. Decisioni aperte da risolvere: [D.X di questa sessione]. Procedo?"* — attendo OK.

### Durante la sessione
Se emerge decisione nuova, **stop e domanda breve**. Non invento.

### A fine sessione
Riporto: *"Sessione N (Fase 2) completata. File X, Y inline → 0. Commit: [sha]. Deploy Vercel: [link]. Smoke test: [risultato]. Screenshot incluso."* Attendo approvazione visiva prima della sessione successiva.

---

## 12. Riferimenti

- [`docs/ux/migration-plan.md`](./migration-plan.md) — Fase B (sessioni 0-13, completata 2026-04-24)
- [`docs/ux-audit.md`](../ux-audit.md) — audit UX pagine
- [`docs/design-system/audit-primitivi.md`](../design-system/audit-primitivi.md) — audit Button/Card/FormField
- [`docs/ux/wizard-layout.md`](./wizard-layout.md) — spec layout wizard (Fase B)
- [`docs/ux/wizard-visual-audit.md`](./wizard-visual-audit.md) — audit visivo cross-step
- [`docs/ux/wizard-sidebar-audit.md`](./wizard-sidebar-audit.md) — diagnosi 3 varianti sidebar (Fase B)
- [`docs/ux/wizard-sidebar-design.md`](./wizard-sidebar-design.md) — DNA unificato sidebar (Fase B)
- [`app/globals.css`](../../app/globals.css) — token + classi esistenti

---

## 13. Quando ripartiamo?

In qualsiasi momento, in una nuova sessione. Basta scrivermi:

> *"Procediamo con la Sessione 14 del migration plan Fase 2."*

Io rileggo questo documento, leggo il file target, mappa i pattern, risolvo eventuali D.X di sessione, e chiedo conferma prima di iniziare.

Nessuna memoria persistente: il documento è la memoria. Se le decisioni cambiano, si aggiorna il doc prima di ripartire.

---

## 14. Differenze sostanziali con Fase B

| Aspetto | Fase B | Fase 2 |
|---|---|---|
| Scope file | 17 file (wizard + scheda) | 33 file (post-funnel + marketing + primitive + shells) |
| Inline target | 413 | 690 |
| Sessioni | 13 (0-13) | 14 (14-27) |
| Criticità mediana | Media-alta (booking funnel pre-pagamento) | Alta (booking funnel post-pagamento + entry home) |
| Smoke test obbligatorio | Click-test fine sessione | **Smoke funzionale Tier 1** (Stripe test, bookId test, file upload) |
| Token nuovi attesi | Pochi (D.X/D.Y/D.Z risolti) | Pattern (`.notice-banner`, `.dashboard-card`, `.empty-state`) — non nuovi token, nuove classi |
| Emoji sweep | Globale fatto in Fase B | Verifica per area, eventuali residui ad-hoc |
| i18n consolidamento | Sessione T9 dedicata | Opportunistico, su file toccato |
