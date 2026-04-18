# Audit UX — beds24site

**Data:** 2026-04-18
**Scope:** sito pubblico (marketing + booking funnel + portale guest). **Fuori scope:** area admin interna.
**Complementare a:** [`docs/design-system/audit-primitivi.md`](design-system/audit-primitivi.md) (livello componente). Questo documento lavora al livello **pagina / flusso / pattern**.

---

## 1. Principi guida (decisi)

### 1.1 KPI #1 = "Prenota"
Ogni pagina del sito pubblico risponde alla domanda: *sta avvicinando l'utente alla prenotazione?* Pagine marketing supportano la fiducia, pagine funnel abilitano il completamento, pagine guest proteggono il post-vendita (retention). Quando una scelta UX è in conflitto, vince chi serve meglio la CTA "Prenota".

### 1.2 Mobile-first rigoroso, desktop non secondo cittadino
- **Default = mobile** (375×667 riferimento, iPhone SE). Design, spacing e tap target decisi per il pollice.
- **Eccezione desktop prima classe**: le pagine `residenze/[slug]` (dettaglio residenza) + `residenze/[slug]/foto` (galleria) vanno anche *valorizzate* su desktop, non solo "non rotte". Le residenze top sono quelle per cui un visitatore apre il laptop a casa la sera.
- Sopra 1024px non c'è un terzo layout: è il layout desktop "allargato".

### 1.3 Differenziante: **chiarezza > Booking/Airbnb**
Booking e Airbnb convertono con pattern di **pressione cognitiva**: scarcity artificiale ("solo 2 camere rimaste!"), prezzi "da €X" che nascondono tasse, badge colorati sovrapposti, overlay promozionali.

La nostra scommessa è l'opposto:

| Loro | Noi |
|---|---|
| "Prezzo da €89" (poi €146 al checkout) | **Prezzo totale finale sempre visibile** (con tassa soggiorno inclusa) |
| "⚡ 8 persone stanno guardando" | **Niente contatori in tempo reale**, niente scarcity |
| Banner "-20% SCADE IN 04:32!" | Offerte chiaramente datate, niente countdown ansiogeni |
| 3+ CTA per schermata + upsell | **1 CTA primaria per schermata**, upsell solo post-booking |
| Termini cancellazione in fondo, piccolo | **Termini nella card della tariffa**, leggibili |
| Policy animali/bambini su 4 tap | Policy visibili senza click, nella scheda residenza |

Questa non è scelta "etica": è **scelta competitiva**. In un mare di dark pattern, la chiarezza è un segnale di qualità (e fidelizza il guest post-stay).

### 1.4 Accessibilità target: **WCAG 2.1 AA**
Non è un "nice to have". 3 motivi:
- Obbligo normativo (European Accessibility Act 2025 per e-commerce).
- Overlap totale con UX mobile (touch target, contrasto, focus).
- Il primitivo `FormField` ha già gap a11y critici identificati (audit-primitivi §4).

**AAA** solo dove "gratis" (es. contrasto su testi grandi).

---

## 2. Stato dei design tokens

### 2.1 Presenti in [`app/globals.css`](../app/globals.css)
- **Colore**: `--color-primary` (blu `#1E73BE`), `--color-primary-soft`, `--color-cta` (arancione `#FCAF1A`), `--color-error` (`#dc2626`), `--color-warning`, `--color-text` + 3 varianti muted, `--color-border` + dark, `--color-bg` + muted + dark.
- **Spacing**: scala 4px (`xs 4` → `xl 32`).
- **Radius**: `sm 8` / `md 12` / `lg 16` / `pill`.
- **Typography**: `xs 12` → `xl 22` (6 step).
- **Touch target**: `--touch-target: 44px`.
- **Focus ring**: `--focus-ring` + `--focus-ring-error`.
- **Breakpoints (solo documentali)**: `sm 640` / `md 768` / `lg 1024`.

### 2.2 Mancanti — da aggiungere
| Token | Valore proposto | Perché |
|---|---|---|
| `--color-success` | `#16a34a` | Feedback positivo (pagamento ok, check-in completato). Oggi non esiste — i success usano blu primary, ambiguo. |
| `--color-danger` | `#c0392b` | Distinto da `--color-error` (che è per form validation). Usato per CTA distruttive ("Annulla prenotazione"). Duplicato inline in `GuestLogin.tsx`. |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | Elevazione card statiche. |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.06)` | Valore hardcoded 12+ volte oggi (`Card.tsx`, BookingPanel, StickyBookingBar). |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Modal, dropdown, lightbox. |
| `--z-header` / `--z-sticky` / `--z-modal` / `--z-toast` | 10 / 20 / 50 / 100 | Nessuna z-index scale: oggi numeri magici sparsi. |
| `--container-sm` / `--container-md` / `--container-lg` | 680 / 1024 / 1200 | `maxWidth: 1100` hardcoded in Wizard; altri valori diversi in altri file. |
| `--line-height-tight` / `--line-height-base` / `--line-height-relaxed` | 1.2 / 1.5 / 1.7 | Oggi lineheight sparse inline (1.45, 1.5, 1.2...). |

### 2.3 Typography scale — valutazione
La scala attuale (`12 / 13 / 14 / 15 / 18 / 22`) è **densa e compatta**, coerente con scelta Booking. Ma mancano **ruoli semantici**:

| Ruolo proposto | Token | Valore |
|---|---|---|
| Label di campo | `--text-label` | 12 |
| Caption / helper | `--text-caption` | 12 |
| Body testo | `--text-body` | 14 |
| Titolo card | `--text-card-title` | 16 |
| H3 sezione | `--text-h3` | 18 |
| H2 pagina | `--text-h2` | 22 |
| H1 hero | `--text-h1` | 28 (nuovo) |

L'audit pratico: oggi `h1`/`h2`/`h3` sono spesso sostituiti da `<p style={{ fontSize: X, fontWeight: 700 }}>` — risolvere richiede classi `.title-h1/h2/h3` in globals + rename progressivo.

---

## 3. Pattern per tipologia di pagina

### 3.1 Pagine marketing (home, residenze lista, dove-siamo, contatti, animali)
**Goal:** costruire fiducia, instradare verso "residenza specifica → prenota".
**Pattern canonici:**
- **Hero compatto** (non full-viewport su mobile: massimo 65vh).
- **CTA primaria "Prenota" sempre raggiungibile** (sticky bar mobile o header button desktop).
- **Card residenza** con: foto in evidenza, nome, 3 attributi chiave (ospiti / camere / servizio differenziante), prezzo **totale** suggerito (non "a partire da").
- **Testo breve, scannable**: paragrafi <60 parole, bullet list invece di prose quando si elencano feature.

### 3.2 Booking funnel (prenota, prenota/successo, paga, prenotazione-sicura)
**Goal:** zero attriti, zero dubbi. Ogni step deve finire entro un pollice di scroll.
**Pattern canonici:**
- **Stepper visibile** con passi + passo corrente.
- **Sidebar riepilogo persistente** (desktop) / **sticky summary bar** (mobile) con: date, ospiti, notti, **totale con tasse**.
- **1 sola CTA primaria** per step ("Continua →"), CTA secondaria solo "Indietro" (`ghost`).
- **Nessuna distrazione laterale**: niente newsletter, niente upsell, niente link a blog.
- **Errori di validazione inline**, vicino al campo, colore `--color-error`, `aria-invalid`.
- **Prezzo breakdown espandibile** ("Mostra dettaglio") — default collasso su mobile.

### 3.3 Portale guest (guest/portal, deposito, utenze, self-checkin, paga post-booking)
**Goal:** self-service, zero email di assistenza per operazioni routine.
**Pattern canonici:**
- **Dashboard a card**: una card per ogni azione (check-in, deposito, documenti).
- **Stati visivi chiari**: "da fare" (bordo arancione) / "fatto" (check verde) / "in attesa" (grigio).
- **CTA per card singola**, no bulk action.
- **Link "assistenza" sempre presente** in fondo (WhatsApp / email).

### 3.4 Pagine legali (condizioni, privacy, trattamento-dati)
**Goal:** leggibilità e findability, niente conversione.
**Pattern:** layout single-column max 680px, typography body-ottimizzata (line-height 1.7, spacing generoso), table of contents sticky su desktop lungo.

---

## 4. Problema prioritario: **wizard desktop**

### 4.1 Sintomo
Dalla memoria utente: *"i wizard sembrano, da desktop, pezzi buttati a caso; da mobile sono abbastanza chiari"*.

### 4.2 Causa tecnica (rilevata in [`Wizard.tsx`](../components/wizard/Wizard.tsx))
```tsx
// Step 1: layout flex con sidebar 250px + contenuto 680px
// Step 2, 3: fullWidth=true → contenuto espande a 1100px, sidebar sparisce
```
Risultato: l'utente vede cambiare radicalmente la struttura della pagina tra step. Su mobile non si nota perché tutto è stacked. Su desktop è una regressione visiva.

Inoltre [`WizardSidebar.tsx`](../components/wizard/WizardSidebar.tsx) ha:
- `#FCAF1A` hardcoded per CTA (ignora `--color-cta`)
- `#f9fafb` hardcoded (ignora `--color-bg-muted`)
- 5 helper components inline (MapFrame, PhotoFrame, NightsBadge, InfoItem, Row) con style diversi — scarto di densità e tono tra step

### 4.3 Direzione proposta (da ratificare prima di codare)
- **Sidebar sempre visibile su desktop in TUTTI gli step** del funnel (stepper `prenota/*` + `self-checkin/*`).
- Contenuto principale con `max-width` fisso (`--container-sm = 680px`) su desktop anche a full-width → no "oceano" di spazio.
- Sidebar: ruolo da "info marketing variabile" a **"riepilogo persistente con breakdown prezzo"** → stessa funzione su ogni step, cambia solo il contenuto.
- Step indicator (1/2/3 + nome step) sopra il contenuto, desktop e mobile.

**Non agire ancora**: decisione va presa leggendo questo audit + eventuale review utente. È l'intervento UX di maggior valore sul funnel #1.

---

## 5. Checklist mobile per pagina (priorità di revisione)

Ordine = priorità conversione. ⚫ = non ancora revisionata, 🟢 = OK (residenze dettaglio, da memoria).

| # | Pagina | Stato | Note |
|---|---|---|---|
| 1 | `prenota` (wizard) | ⚫ | Priorità massima. Vedi §4. |
| 2 | home + `HomeSearch` | ⚫ | CTA principale sito. |
| 3 | `residenze` (lista) | ⚫ | Entry point per residenza. |
| 4 | `residenze/[slug]` | 🟢 | Riferimento di fatto (memoria). Anche desktop cura speciale. |
| 5 | `residenze/[slug]/foto` | ⚫ | Galleria — pattern critico anche desktop. |
| 6 | `paga` | ⚫ | Ultimo miglio booking. |
| 7 | `self-checkin` + wizard | ⚫ | Post-booking critico. |
| 8 | `guest/portal` | ⚫ | Hub guest. |
| 9 | `deposito`, `utenze` | ⚫ | Sottopagine guest. |
| 10 | `dove-siamo`, `contatti`, `animali` | ⚫ | Marketing leggero. |
| 11 | `condizioni`, `privacy`, `trattamento-dati` | ⚫ | Legali, solo leggibilità. |
| 12 | `prenotazione-sicura` | ⚫ | Pagina trust signal. |

Per ciascuna, la revisione produce: (a) screenshot mobile before, (b) lista gap vs principi §1–§3, (c) patch proposta.

---

## 6. Roadmap prioritaria

Gli step 1–3 arrivano **prima** del refactor CSS massivo (1.197 `style={{}}` residui — fronte 3). Senza decisioni UX stabili, il refactor CSS è scommessa.

### Step 1 — Completare design tokens (§2.2) ⚡ S
Aggiungere i 7 token mancanti a `globals.css`. Rilascio: 1 commit.

### Step 2 — Ratificare direzione wizard desktop (§4.3) 🧭 S
Non è codice: è una decisione UX. Produzione: 1 wireframe/spec in `docs/ux/wizard-layout.md` + approvazione utente.

### Step 3 — Audit primitivi → completare `Button`/`Card`/`FormField` 🎨 M
Seguire priorità 1–5 dell'audit primitivi esistente. In parallelo: creare `Stepper` (nuovo primitivo richiesto da §4).

### Step 4 — Pilot 1: `GuestLogin` migrato a primitivi 🔬 S
Già identificato nell'audit primitivi §5.3. Proof-of-concept a basso rischio.

### Step 5 — Pilot 2: layout wizard `prenota` 🏗️ L
Applica §4.3. Misura in analytics il drop-off step 1→2→3 prima/dopo.

### Step 6 — Rollout refactor CSS inline per pagina 🧹 L
Iterativo, 1 pagina per sessione (ordine §5). Include i18n cleanup residuo (7 hardcoded).

### Step 7 — Accessibility pass WCAG AA 🔍 M
Audit automatico (axe-core) + manuale (tastiera + screen reader). Deve venire dopo i primitivi corretti, altrimenti si corregge roba che cambierà.

---

## 7. Cosa NON fare

- ❌ Non aggiungere nuovi pattern UX (filtri avanzati, mappa ricerca, wishlist, notifiche) prima di aver chiuso design system + wizard.
- ❌ Non introdurre una CSS-in-JS library (styled-components, emotion). Il progetto è vicino al "classi CSS + token" — avanti così.
- ❌ Non toccare l'area admin per uniformarla al design system: fuori scope (decisione utente).
- ❌ Non adottare pattern di scarcity/FOMO per "aumentare conversione": è anti-differenziante.
- ❌ Non fare A/B test prima di aver allineato il funnel al principio 1.3 — altrimenti si misura rumore.

---

## 8. Riferimenti

- Audit componente-livello: [`docs/design-system/audit-primitivi.md`](design-system/audit-primitivi.md)
- Token: [`app/globals.css`](../app/globals.css)
- Primitivi: [`components/ui/`](../components/ui/)
- Wizard: [`components/wizard/Wizard.tsx`](../components/wizard/Wizard.tsx), [`WizardSidebar.tsx`](../components/wizard/WizardSidebar.tsx)
- Memoria utente: densità Booking, touch target ≥44px, residenze mobile = riferimento *di fatto*, CSS centralizzato in `globals.css`.
