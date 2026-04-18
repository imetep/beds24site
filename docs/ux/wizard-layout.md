# Wizard Layout Spec — ratifica direzione

**Data:** 2026-04-18
**Stato:** 🟢 ratificato 2026-04-18 — pronto per implementazione
**Riferimento:** [`docs/ux-audit.md §4`](../ux-audit.md)
**Scope:** layout **contenitore** dei 2 wizard multi-step dell'app. Non tocca il contenuto dei form.

## Principio guida (decisione utente, 2026-04-18)

> **"È meglio perdere 2 prenotazioni che deludere un ospite."**

Il wizard serve a **essere onesti con chi sta prenotando**, non a vendere. Il marketing sta altrove (home, `residenze/[slug]`, `dove-siamo`). Qui dentro: prezzo totale con tasse sempre visibile, zero scarcity, zero upsell, zero distrazioni.

## Decisioni ratificate

| ID | Scelta | Nota |
|---|---|---|
| **D1** | Stepper con label sempre visibili (mobile + desktop) | 3 step stanno comodi in una riga anche mobile; nascondere le label è un vezzo di flussi più lunghi |
| **D2** | Sidebar = solo summary prenotazione. **Zero marketing.** | Ratifica del principio guida sopra |
| **D3** | Container desktop **720px contenuto + 320px sidebar = 1072** | Formato Booking.com; 720 respira per form 3-colonne; 320 breakdown tasse leggibile |
| **D4** | Mobile: sticky bar bottom con **prezzo totale + CTA** | Pattern mobile-first consolidato; il prezzo sempre visibile rispetta principio guida |

---

## 1. Cosa definisce questo spec

Definisce:
- Container, max-width, breakpoint
- Posizione e forma dello **stepper** (indicatore passo corrente)
- Posizione, ruolo e contenuto della **sidebar desktop**
- Comportamento del **summary mobile**
- Posizione e stato della CTA primaria ("Continua")
- Regole di coerenza **tra tutti gli step**

**Non** definisce:
- Il contenuto interno di ogni step (campi form, card offerte, ecc.)
- Lo stile grafico fine (colori, shadow, typography scale) — quello è nell'audit primitivi
- Le micro-animazioni

---

## 2. Scope: quali wizard

| Wizard | Route | Step | Criticità |
|---|---|---|---|
| **Prenota** | `/[locale]/prenota` | 3 (scelta residenza/offerta → dati ospite → pagamento) | 🔴 KPI #1. Desktop "buttato a caso" segnalato utente. |
| **Self-checkin** | `/[locale]/self-checkin/wizard` | N step (documenti, ospiti, foto, ecc.) | 🟡 Post-booking, stesso problema layout. |

**Decisione:** lo spec vale per **entrambi**. Un solo layout, due wizard. Riduce manutenzione + utente impara il pattern una volta.

---

## 3. Problema attuale (desktop)

### 3.1 Prenota wizard — riproduzione comportamento attuale

Letto in [`components/wizard/Wizard.tsx:147-175`](../../components/wizard/Wizard.tsx).

```
┌── Step 1 (logicalStep=1) ──────────────────────────────────┐
│                                                             │
│   ┌────────────────────┐     ┌──────────────┐              │
│   │                    │     │              │              │
│   │  Contenuto         │     │  Sidebar     │              │
│   │  (max 680px)       │     │  250px       │              │
│   │                    │     │              │              │
│   └────────────────────┘     └──────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌── Step 2/3 (logicalStep>=2) ───────────────────────────────┐
│                                                             │
│   ┌─────────────────────────────────────────────┐          │
│   │                                             │          │
│   │  Contenuto (max 1100px, sidebar sparita)    │          │
│   │                                             │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Conseguenza:** il layout "cambia pelle" tra step 1 e step 2. La sidebar scompare, il contenuto si allarga a 1100px. Su desktop è percepito come pagina diversa — "pezzi buttati a caso".

Tecnicamente: `showSidebar = logicalStep === 1` e `fullWidth = logicalStep >= 2`.

---

## 4. Proposta — layout unificato

### 4.1 Principio
**Una sola struttura di pagina per tutti gli step.** Cambia il contenuto, non il contenitore. L'utente deve sentire "sto avanzando nello stesso percorso", non "sono su pagine diverse".

### 4.2 Wireframe desktop (tutti gli step)

```
╔═ Header sito ══════════════════════════════════════════════╗
║                                                            ║
║  ┌─ Stepper ───────────────────────────────────────────┐  ║
║  │  ●───○───○    Scegli → Ospite → Paga                │  ║
║  └─────────────────────────────────────────────────────┘  ║
║                                                            ║
║  ┌─ Contenuto step ────────┐    ┌─ Summary sidebar ────┐ ║
║  │                         │    │                      │ ║
║  │  max-width 720px        │    │  width 320px         │ ║
║  │                         │    │  sticky (top: 90px)  │ ║
║  │                         │    │                      │ ║
║  │  [campi / scelte]       │    │  [date, ospiti,      │ ║
║  │                         │    │   notti, prezzo      │ ║
║  │                         │    │   totale CON TASSE]  │ ║
║  │                         │    │                      │ ║
║  │  ┌────────────────┐     │    │  ┌──────────────┐   │ ║
║  │  │  Continua →    │     │    │  │  Continua →  │   │ ║
║  │  └────────────────┘     │    │  └──────────────┘   │ ║
║  └─────────────────────────┘    └──────────────────────┘ ║
║                                                            ║
║  Gap tra colonne: 32px          Totale row: 1072px        ║
╚════════════════════════════════════════════════════════════╝
```

**Cambi rispetto a oggi:**
1. Sidebar **sempre visibile** (non sparisce mai da step 1 a step 3).
2. Contenuto step resta a `--container-sm = 680px` a tutti gli step (no più 1100px a step 2/3).
3. **Stepper orizzontale** sopra il contenuto (oggi manca — l'utente non sa a che punto è).
4. Sidebar unifica "summary persistente" — non è più contesto marketing variabile (mappa Scauri su step 1, foto piscina su step 3...). Contenuto sidebar = **riepilogo prenotazione**, sempre lo stesso schema.
5. CTA "Continua" **duplicata** in sidebar (come oggi a step 1) per eliminare lo scroll verticale al CTA su desktop.

### 4.3 Wireframe mobile (tutti gli step)

```
╔════════════════════╗
║  Header            ║
╠════════════════════╣
║                    ║
║  ●─○─○  (stepper)  ║
║                    ║
║  [Contenuto step]  ║
║                    ║
║  (scroll libero)   ║
║                    ║
║                    ║
╠════════════════════╣  ← sticky bottom
║  2 notti · €480    ║
║  ┌──────────────┐  ║
║  │  Continua →  │  ║
║  └──────────────┘  ║
╚════════════════════╝
```

**Scelte mobile:**
- Stepper in alto, compatto (pallini + label step corrente).
- Summary **non** stacked in cima (occupa schermo prezioso); diventa **sticky bar in basso** con 1 riga: `{notti} notti · €{totale}` + CTA.
- Tappa sulla sticky bar → apre bottom sheet con breakdown completo (tasse, dettaglio offerta).

---

## 5. Stepper — spec

### 5.1 Forma
```
  ●─────○─────○
  Scegli  Ospite  Paga
```
- **3 stati per pallino**: `completato` (pieno blu + ✓), `corrente` (pieno arancione), `futuro` (vuoto grigio).
- **Label sotto ogni pallino**: **sempre visibili** su desktop e mobile (D1 ratificata). I 3 step ("Scegli", "Ospite", "Paga") stanno comodamente in una riga anche a 375px.
- **Connettori**: linea tra pallini, piena se lo step è completato.
- **Click su step completato** = torna indietro. Click su step futuro = disabilitato.

### 5.2 Token
- Colore corrente: `--color-cta`
- Colore completato: `--color-primary`
- Colore futuro: `--color-border`
- Altezza barra: `--space-lg` (24px)

### 5.3 Nuovo primitivo `Stepper`
Giustifica un componente riusabile in `components/ui/Stepper.tsx`. Props:
```ts
type StepperProps = {
  steps: { label: string }[];
  current: number;   // 1-based
  onGoBack?: (step: number) => void;
};
```

---

## 6. Sidebar summary — spec

### 6.1 Contenuto fisso (tutti gli step)

| Zona | Cosa mostra | Visibile quando |
|---|---|---|
| Header | Titolo "La tua prenotazione" | Sempre |
| Residenza | Nome + foto cover (60×60px) | Se `selectedRoomId` |
| Date | Check-in / check-out + nr notti | Se date impostate |
| Ospiti | N adulti + N bambini | Se impostati |
| Offerta | Nome tariffa | Da step 2 |
| Prezzo | Totale **con tasse** grande, prezzo/notte piccolo | Da step 2 |
| CTA | "Continua →" (duplicato) | Quando abilitata |

### 6.2 Cosa sparisce
**Le info marketing contestuali di oggi** (mappa Scauri, foto piscina, messaggi brand, spiegazione natura...). Vanno fuori dalla sidebar. Riflessione: il wizard non è il posto per convincere, è il posto per completare. Il convincere è nel dettaglio residenza (pagina `/residenze/[slug]`).

### 6.3 Dimensioni
- Width: **320px** (D3 ratificata — oggi 250px; 320 permette breakdown tasse leggibile senza ammassare).
- Margin-left: `--space-xl` (32px) dal contenuto.
- Sticky top: **90px** (sotto header).
- Background: `--color-bg-muted`.
- Radius: `--radius-lg`.
- Padding: `--space-lg` (verticale) / `--space-base` (orizzontale).

### 6.4 Nuovo primitivo `BookingSummary`
Riusabile nel portale guest (`/guest/portal`) per mostrare lo stesso riepilogo post-booking. In `components/booking/BookingSummary.tsx`.

---

## 7. Container e breakpoint

| Breakpoint | Contenuto step | Sidebar | Container totale |
|---|---|---|---|
| `<768px` (mobile) | full-width meno padding 16px | sticky bar bottom | `--container-lg` |
| `768–1023px` (tablet) | fluido, no sidebar (sotto la soglia utile) | — | `--container-md` |
| `≥1024px` (desktop) | 720px | 320px | `--container-lg` (1200px) |

**Padding container**: `--space-lg` desktop, `--space-base` mobile.

**Totale riga desktop**: 720 + 32 gap + 320 = **1072px**. Sta dentro `--container-lg` (1200px) con respiro ai lati. Comodo da 1280×720 in su (Booking.com usa lo stesso formato).

---

## 8. CTA "Continua" — spec

### 8.1 Posizione
- **Mobile**: dentro sticky bar bottom (unica).
- **Desktop**: 2 istanze — una dentro il contenuto step (fine form), una dentro la sidebar. Mostrano lo stesso testo, stesso stato abilitato/disabilitato, stesso handler.

### 8.2 Stato
- Abilitata quando lo step corrente è completato (validazione step-local).
- Disabilitata con tooltip/hint "Completa i campi richiesti".
- Durante submit (step 3 → pagamento): `loading` con spinner inline + `aria-busy`.

### 8.3 Stile
- Variante `primary` del primitivo `Button` (colore `--color-cta`, arancione).
- Size `lg`.
- `fullWidth` su mobile e dentro sidebar; size fissa (auto) dentro contenuto desktop.
- **Icona trailing ›** (chevron) per segnalare avanzamento.

### 8.4 CTA secondaria "Indietro"
- Variante `ghost`.
- Sempre a sinistra della primaria.
- Nessuna icona leading (`←`) — stop over-dressing.

---

## 9. Self-checkin wizard — adattamenti

Stessa struttura. Differenze:
- Summary sidebar mostra **prenotazione già confermata** (no prezzo; invece: date soggiorno + nome ospite + codice booking).
- Stepper può avere più di 3 step — in quel caso: desktop tutti con label, mobile solo current label + "X di Y".
- Non esiste CTA sidebar "completa check-in" — qui il flusso è più lineare, 1 CTA sola dentro step.

---

## 10. Decisioni ratificate ✅

Riepilogo chiuso (dettagli in testa a questo doc):

| ID | Scelta | Fonte |
|---|---|---|
| D1 | Stepper con label sempre visibili, mobile + desktop | best practice UX (flussi corti = label esplicite) |
| D2 | Sidebar solo summary, zero marketing | preferenza utente + principio "perdere 2 prenotazioni ≪ deludere 1 ospite" |
| D3 | 720 + 320 = 1072 desktop | formato Booking.com; respira per form 3-col + breakdown tasse leggibile |
| D4 | Sticky bar bottom con prezzo totale + CTA | pattern mobile-first consolidato; prezzo sempre visibile |

---

## 11. Impatti implementativi (stima)

Se direzione ratificata:

| Intervento | Sforzo | File toccati |
|---|---|---|
| Nuovo primitivo `Stepper` | S | 1 nuovo + globals.css |
| Nuovo primitivo `BookingSummary` | M | 1 nuovo + tests |
| Refactor `Wizard.tsx` (container unificato) | M | 1 file |
| Refactor `WizardSidebar.tsx` (semplificazione drastica — da 282 a ~120 righe) | M | 1 file, rimuove Map/Photo/InfoItem helpers |
| Sticky bar mobile (nuovo componente) | M | 1 nuovo |
| Applicazione stesso layout a self-checkin wizard | S | 1 file |
| **Totale** | **~2 sessioni di lavoro mirate** | |

Nessuna API change; niente modifiche al wizard-store; nessun rischio di regressione logica del booking.

---

## 12. Cosa NON fa questo spec

- Non ridisegna il contenuto dei 3 step (quello è nell'audit per-pagina, §5 dell'ux-audit).
- Non introduce animazioni di transizione tra step (fuori scope).
- Non cambia la logica di validazione inter-step (già gestita dallo store).
- Non tocca la pagina `paga` (è successiva al wizard, pagina standalone).

---

## 13. Prossimo passo

Spec ratificato. Implementazione:
1. Primitivo `Stepper` (`components/ui/Stepper.tsx`) — applica D1.
2. Primitivo `BookingSummary` (`components/booking/BookingSummary.tsx`) — applica D2.
3. Refactor `Wizard.tsx` con il layout unificato — applica D3.
4. Sticky bar mobile (`components/wizard/WizardMobileBar.tsx`) — applica D4.
5. Replica su self-checkin wizard.
