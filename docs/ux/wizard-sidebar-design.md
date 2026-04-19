# Wizard Sidebar Design — DNA unificato (look master = SidebarContent)

**Data:** 2026-04-19
**Stato:** 🟢 ratificato v3 (inversione direzione)
**Prerequisito:** [wizard-sidebar-audit.md](wizard-sidebar-audit.md) (diagnosi)

## Decisioni utente ratificate

- **Larghezza sidebar 380px fissa** (step 1 e step 2 uguali)
- **Look master = `SidebarContent` di `WizardStep2.tsx`** (valutato "più bello" dall'utente 2026-04-19)
- **BookingSidebar** (step 1) si **allinea visivamente** a SidebarContent, non il contrario
- **Logica extras / voucher resta in `WizardStep2.tsx`** (non si travasa)
- **Allineamento via slot**: BookingSidebar accetta `step2Extras?: React.ReactNode` prop; quando step=2 renderizza quel nodo nel blocco dedicato
- **Scope proporzionato al 35% desktop** — no sovra-ingegnerizzazione
- **Bootstrap Icons ovunque** (no emoji decorative)

> **Principio**: documento fondato su ricerca UX pubblica (Baymard, NN/g) + pattern consolidati Booking/Airbnb/Hotels.com + dati reali di `config/properties.ts`. Nessuna inferenza su USP inventati.

---

## 1. Letteratura UX

### 1.1 Baymard Institute — e-commerce checkout

- **B1 — Persistent Order Summary** — riepilogo in tutti gli step (§3.2)
- **B2 — Thumbnail Image in Summary** — immagine del prodotto riduce l'ansia (§3.4)
- **B3 — Cost Breakdown Transparent** — ogni componente esplicito (tassa, extras, sconto, **deposito**, **consumi**). "Hidden costs" = causa #1 di abbandono
- **B4 — Trust Signals Near Decision Point** — i signal di fiducia funzionano vicino alla CTA

### 1.2 Nielsen Norman Group

- **Recognition over Recall** (#6)
- **System Status Visibility** (#1)
- **Progressive Disclosure**: **NON applicare** a costi/obblighi — banner consumi e deposito restano visibili (scelta utente ratificata dopo tentativo modale scartato)

### 1.3 Pattern ricorrenti player (fase selezione)

Sidebar ~352–374px fissa, bg bianco + border, **banner informativi con titolo + testo** (non 1-riga), righe dati chiave con **label sopra / valore sotto + bottone Modifica** inline, totale visibile, CTA in basso.

---

## 2. DNA visivo unificato (look master = SidebarContent)

### 2.1 Container

```
width:         380px
background:    #fff
border:        1px solid var(--color-border)
border-radius: var(--radius-lg)
box-shadow:    var(--shadow-sm)
padding:       var(--space-lg)
position:      sticky
top:           90px
```

### 2.2 Gerarchia interna (10 blocchi ordinati)

Ordine invariante step 1 / step 2. Blocchi condizionali appaiono/spariscono ma non si spostano.

```
┌────────────────────────────────────┐
│  1. HERO — foto 160h + nome + tipo │  section-title-secondary / label-metadata
├────────────────────────────────────┤
│  2. BANNER ⚡ CONSUMI (titolo+testo)│  banner--info con titolo + paragrafo esteso
├────────────────────────────────────┤
│  3. FEATURE APPTO (step 1 solo)    │  icone bi-* + testo (da PROPERTIES config)
├────────────────────────────────────┤
│  4. SEZIONE VOUCHER (step 2 solo)  │  label + input + bottone Applica
├────────────────────────────────────┤
│  5. DATI CHIAVE — Date / Ospiti    │  label sopra, valore sotto, opz. Modifica a dx
├────────────────────────────────────┤
│  6. DETTAGLI DEL PREZZO            │  label uppercase + righe breakdown
│     - Notti × prezzo / notte       │
│     - Sconto voucher               │
│     - Extras (step 2 solo)         │
│     - Tassa di soggiorno           │
├────────────────────────────────────┤
│  7. SERVIZI EXTRA (step 2 solo)    │  card con stepper +/− per upsell
├────────────────────────────────────┤
│  8. TOTALE                         │  20px/800 primary con border-top
├────────────────────────────────────┤
│  9. CANCELLAZIONE                  │  label uppercase + 1 riga condizione
├────────────────────────────────────┤
│  10. BANNER 🔐 DEPOSITO             │  banner--warning con titolo + paragrafo esteso
├────────────────────────────────────┤
│  11. CTA                           │  btn--primary full-width
├────────────────────────────────────┤
│  12. CIN/CIR footer micro          │  hint-text (solo step 1, signal regolarità)
└────────────────────────────────────┘
```

### 2.3 Banner informativi (pattern master)

**Nuovo standard**: i banner ⚡ e 🔐 non sono più "1 riga" ma **blocco con titolo + testo esteso**.

```
┌─────────────────────────────────────┐
│ 🛡️  Deposito cauzionale             │  icona + titolo
│    Questo alloggio richiede un      │  testo esteso (12px, line-height 1.5)
│    deposito di €1000. Carta di      │  può andare a capo
│    credito richiesta al check-in    │
└─────────────────────────────────────┘
```

Testi da spostare dall'hardcode `ENERGY_BOX`/`DEPOSIT_BOX` di WizardStep2.tsx in i18n standard.

### 2.4 Righe dati chiave (Date / Ospiti)

**Nuovo standard**: layout verticale (label sopra, valore sotto), bottone Modifica inline a destra solo in step 2.

```
Date                       Modifica
29 mag 2026 – 1 giu 2026
3 notti                             ← riga aggiuntiva 12px muted
```

**Formato data ratificato 2026-04-19**: `dd MMM yyyy` (mese corto + anno). Allineato a SidebarContent attuale, valido entrambi gli step.

Invece di single-line `Check-in 29 maggio` (attuale BookingSidebar step 1).

### 2.5 Typography e spacing (classi library)

| Elemento | Classe / Token |
|---|---|
| Nome appartamento | `.section-title-secondary` |
| Tipo (sotto nome) | `.label-metadata` |
| Label sezione | `.label-uppercase-muted` |
| Label dato chiave | 12px muted |
| Valore dato chiave | 14px text |
| Nights hint | 12px muted (`.hint-text`) |
| Bottone Modifica | 13px primary, decoration:underline |
| Riga breakdown | `.layout-row-between`, 14px |
| Totale label | 16px/700 text |
| Totale valore | 20px/800 primary |
| CTA | `.btn .btn--primary` |

Banner:
- `.banner .banner--info .banner--with-icon` (consumi)
- `.banner .banner--warning .banner--with-icon` (deposito)
- `.banner__title` nuovo element (700, margin-bottom)
- `.banner__text` nuovo element (opzionale — lo si omette se banner è 1-riga)

---

## 3. Contenuto della sidebar step 1 (BookingSidebar)

### 3.1 Nessun appartamento selezionato

```
┌────────────────────────────────────┐
│  [foto location 160h]              │
│  (placeholder senza nome)          │
│  ────────────────────────────      │
│  [🛡️ Deposito cauzionale]          │  sempre — testo fisso generico
│  [⚡ Consumi energetici]            │  sempre — testo fisso
│  ────────────────────────────      │
│  Date                              │
│  —                                 │
│  Ospiti                            │
│  —                                 │
│  ────────────────────────────      │
│  DETTAGLI DEL PREZZO               │
│  Seleziona un appartamento e date  │  hint-text
│  per vedere il totale              │
│  ────────────────────────────      │
│  CANCELLAZIONE                     │
│  Dipende dalla tariffa scelta      │
│  ────────────────────────────      │
│  [Continua →]  disabled            │
│  CIN IT059014B47RVOMN2D            │
└────────────────────────────────────┘
```

### 3.2 Appartamento selezionato

```
┌────────────────────────────────────┐
│  [foto Kissabel 160h]              │
│  Villa Kissabel                    │
│  Villa · 260mq · 14 ospiti         │
│  ────────────────────────────      │
│  🚪 4 camere · 💧 2 bagni · 👥 14   │  feature chip con bi-door-closed-fill etc
│  🌊 Piscina privata + condivisa    │
│  🌳 Giardino                        │
│  🏠 Patio                           │
│  📅 Sala eventi                     │
│  ────────────────────────────      │
│  [🛡️ Deposito cauzionale]          │  ora mostra importo €1000 dal config
│  Questo alloggio richiede...       │
│  [⚡ Consumi energetici]            │
│  I consumi sono calcolati...       │
│  ────────────────────────────      │
│  Date                              │
│  29 mag 2026 – 1 giu 2026          │
│  3 notti                           │
│  Ospiti                            │
│  2 adulti                          │
│  ────────────────────────────      │
│  DETTAGLI DEL PREZZO               │
│  3 notti × €131    €393            │
│  Tassa soggiorno    €12            │
│  Totale          €405              │  grande primary
│  ────────────────────────────      │
│  CANCELLAZIONE                     │
│  Flessibile 60gg — cancelli gratis │
│  ────────────────────────────      │
│  [Continua →]  enabled             │
│  CIN IT059014B47RVOMN2D            │
└────────────────────────────────────┘
```

---

## 4. Contenuto della sidebar step 2

Stesso DNA di step 1 + **2 blocchi aggiuntivi** (voucher + servizi extra) + bottoni **Modifica** nelle righe Date/Ospiti. Contenuto logico gestito da WizardStep2, renderizzato via **slot** (vedi §5).

---

## 5. Componente `BookingSidebar` — API

```tsx
interface BookingSidebarProps {
  locale?: string;
  step?: 1 | 2;   // default 1

  // step 1 (sempre disponibili)
  onContinua?: () => void;
  canContinua?: boolean;

  // step 2 — slot passante
  step2VoucherSlot?: React.ReactNode;   // JSX dell'input voucher (gestione locale a WizardStep2)
  step2ExtrasSlot?: React.ReactNode;    // JSX del catalogo upsell con stepper
  onEditDates?: () => void;             // bottone Modifica su riga Date
  onEditGuests?: () => void;            // bottone Modifica su riga Ospiti
  ctaLabel?: string;                    // override CTA (default t.continua)
}
```

**Separazione**:
- BookingSidebar = chrome visivo (hero, banner, layout, typography, totale, CTA, footer)
- Slot = contenuti dinamici specifici dello step 2 (voucher input, upsell stepper)
- WizardStep2 padrone di voucher/extras state + fetch API upsell

---

## 6. Roadmap

| # | Ambito | Rischio | Visual |
|---|---|---|---|
| **3c.1** | Aggiornamento `BookingSidebar` visuale a SidebarContent look: banner con titolo+testo, righe dati verticali, totale grande, extra chiavi i18n per banner titles | 🟡 medio | alto (step 1 aggiorna) |
| **3c.2** | Aggiunta `step` prop + slot `step2VoucherSlot` / `step2ExtrasSlot` + `onEditDates/onEditGuests` al componente. Renderizza blocco voucher/extras quando step=2. Allineamento label i18n (priceSection → "Dettagli del prezzo", ecc.) | 🟢 basso | nullo (step 2 ancora non usa il componente) |
| **3c.3** | In `Wizard.tsx`: `showSidebar = logicalStep === 1 \|\| logicalStep === 2`. WizardSidebarWrapper passa al BookingSidebar gli slot da WizardStep2 (via ref/callback oppure sollevando state al Wizard.tsx) | 🟡 medio | alto (step 2 adotta BookingSidebar) |
| **3c.4** | In `WizardStep2.tsx`: elimina `SidebarContent`, sidebar desktop inline, accordion mobile, bg grigio edge-to-edge, helper `SideRow`/`PriceRow`, hardcoded `ENERGY_BOX`/`DEPOSIT_BOX` (spostati in i18n) | 🔴 alto (tocca pagamento) | alto (step 2 finalmente uniformato) |

**Ordine**: 3c.1 → 3c.2 → **pausa visiva step 1** → 3c.3 → 3c.4 → **pausa visiva step 2**.

Ogni punto = 1 commit atomico + push → verifica Vercel.

---

## 7. Cosa NON fa questo design

- Non introduce modali (banner informativi sempre visibili)
- Non tocca lo step 3 (pagamento) — resta full-width
- Non tocca il layout wizard container
- Non adotta CSS-in-JS
- Non aggiunge dipendenze
- Non rimuove l'accordion mobile step 2 (resterà fino a sessione mobile dedicata futura)

---

## 8. Riferimenti

- Baymard Institute, NN/g, Cialdini
- [wizard-sidebar-audit.md](wizard-sidebar-audit.md)
- [wizard-layout.md](wizard-layout.md)
- [css-library.md](../design-system/css-library.md)
- [config/properties.ts](../../config/properties.ts)
- [components/wizard/WizardStep2.tsx §SidebarContent](../../components/wizard/WizardStep2.tsx) — look master

---

## 9. Changelog

### 2026-04-19 v3 — inversione direzione
- L'utente ha valutato SidebarContent di WizardStep2 "più bella" di BookingSidebar. Direzione ribaltata: BookingSidebar si allinea a SidebarContent, non il contrario.
- Banner informativi con titolo + testo esteso (era 1 riga in v2)
- Righe dati chiave con layout verticale (era label-row-between horizontale in v2)
- Totale 20px/800 (era 22px in v2)
- BookingSidebar accetta slot `step2VoucherSlot`/`step2ExtrasSlot` per non travasare logica da WizardStep2
- Roadmap 3c scomposta in 3c.1/3c.2/3c.3/3c.4

### 2026-04-19 v2
- Rimossa Progressive Disclosure con modale
- Contenuto step 1 basato su PROPERTIES config
- CIN/CIR in footer
- Banner visibili entrambi gli step

### 2026-04-19 v1
- Prima stesura, 380px, DNA unificato, trust signal generici scartati poi
