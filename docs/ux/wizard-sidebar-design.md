# Wizard Sidebar Design — DNA unificato step 1 e step 2

**Data:** 2026-04-19
**Stato:** 🟢 ratificato (v2 aggiornato dopo discussione contenuto)
**Prerequisito:** [wizard-sidebar-audit.md](wizard-sidebar-audit.md) (diagnosi)

## Decisioni utente ratificate

- **Larghezza sidebar 380px fissa** (step 1 e step 2 uguali)
- **Grafica uniforme** tra step 1 e step 2 (stesso DNA visivo)
- **Contenuto utile step 1**: feature dell'appartamento selezionato (pattern Airbnb/Booking "property highlights"). Niente USP generici inventati.
- **Placeholder soft** se nessun appartamento selezionato (es. "Seleziona un appartamento"). Nessun blocco "Perché prenotare con noi" con trust signal generici.
- **Feature mostrate** (quando appartamento selezionato): `tipo · mq · max ospiti · distanza mare · piscina · garden/patio/salone` (solo se presenti nel config).
- **CIN/CIR visibile** come signal di regolarità (obbligo di legge comunicato come rassicurazione).
- **Banner ⚡ consumi + 🔐 deposito visibili** in entrambi gli step, stessa posizione. **No modale nascosta**: l'utente deve vedere costi e obblighi prima della CTA (Baymard: "hidden costs" = causa #1 di abbandono carrello).
- **Scope proporzionato al valore**: desktop = 35% del traffico. No sovra-ingegnerizzazione.

> **Principio**: documento fondato su ricerca UX pubblica (Baymard, NN/g) + pattern consolidati Booking/Airbnb/Hotels.com + dati reali di `config/properties.ts` e `OFFER_INFO`. Niente inferenze su USP inventati.

---

## 1. Cosa dice la letteratura UX

### 1.1 Baymard Institute — e-commerce checkout

- **B1: Persistent Order Summary** — riepilogo visibile in tutti gli step. Fonte: Baymard Checkout Usability Report §3.2.
- **B2: Thumbnail Image in Summary** — immagine del prodotto riduce l'ansia ("sto comprando la cosa giusta?"). Baymard §3.4.
- **B3: Cost Breakdown Transparent** — ogni componente esplicito (tassa, extras, sconto, **deposito**, **consumi**). *"Hidden costs"* è causa #1 di abbandono (50% degli abbandoni). Fonte: Baymard E-Commerce Benchmark.
- **B4: Trust Signals Near Decision Point** — i signal di fiducia funzionano vicino alla CTA, non nel footer. Baymard Trust Seals Study.

### 1.2 Nielsen Norman Group (NN/g)

- **Recognition over Recall** (Heuristic #6): l'utente riconosce le info già selezionate, non le ricorda.
- **System Status Visibility** (Heuristic #1): cosa è già scelto, cosa manca.
- **Progressive Disclosure**: vale per **dettagli accessori**, NON per info che influenzano l'acquisto (costi, policy). Consumi e deposito restano visibili.

### 1.3 Pattern ricorrenti tra i player

| Player | Largh. sidebar | Background | Contenuto fase scelta | Contenuto fase compilazione |
|---|---|---|---|---|
| Airbnb | ~374px | bianco + border | foto · breakdown · cancellazione · trust pagamento | + dati guest in compilazione |
| Booking.com | ~368px | bianco + border + shadow-sm | foto · breakdown · policy · "No pre-payment" | + riepilogo dati |
| Hotels.com | ~352px | bianco + border | points/rewards · breakdown · policy | + guest info |

**Ricorrente**: foto → dati chiave → breakdown → totale → costi aggiuntivi visibili → CTA.

---

## 2. DNA visivo unificato

### 2.1 Token del contenitore

```
width:         380px
padding:       var(--space-lg) (24px)
background:    #fff
border:        1px solid var(--color-border)
border-radius: var(--radius-lg) (16px)
box-shadow:    var(--shadow-sm)
position:      sticky
top:           90px
```

### 2.2 Gerarchia interna (blocchi ordinati)

Ordine invariante in step 1 e step 2. I blocchi condizionali appaiono/spariscono ma non si spostano.

```
┌────────────────────────────────────┐
│  1. HERO (foto + nome + tipo)      │  sempre visibile, foto location se no appto
├────────────────────────────────────┤
│  2. FEATURE APPTO (se selezionato) │  solo step 1 con appto scelto
├────────────────────────────────────┤
│  3. DATI CHIAVE                    │  Check-in, Check-out, Ospiti
├────────────────────────────────────┤
│  4. EXTRAS + VOUCHER (solo step 2) │  upsell stepper + input voucher
├────────────────────────────────────┤
│  5. BREAKDOWN PREZZO               │  righe prezzo / tassa / sconto / extras
├────────────────────────────────────┤
│  6. TOTALE                         │  cifra evidenziata
├────────────────────────────────────┤
│  7. CANCELLAZIONE (1 riga)         │  condizioni della tariffa scelta (placeholder step 1)
├────────────────────────────────────┤
│  8. 🔐 DEPOSITO (banner warning)   │  sempre visibile, spec nel config
├────────────────────────────────────┤
│  9. ⚡ CONSUMI (banner info)       │  sempre visibile, testo fisso
├────────────────────────────────────┤
│  10. CTA                           │  Continua / Vedi riepilogo →
├────────────────────────────────────┤
│  11. CIN/CIR footer micro          │  signal regolarità (legal + trust)
└────────────────────────────────────┘
```

### 2.3 Typography e spacing (classi library)

| Elemento | Classe |
|---|---|
| Nome appartamento | `.section-title-secondary` |
| Tipo appartamento | `.label-metadata` |
| Etichetta sezione | `.label-uppercase-muted` |
| Riga dato (Check-in…) | `.label-row-between` + `__label` + `__value` |
| Riga breakdown | `.layout-row-between` |
| Totale | 22px / 800 / `--color-primary` |
| Feature chip | `.badge-feature` |
| Banner deposito | `.banner .banner--warning` |
| Banner consumi | `.banner .banner--info` |
| CTA | `.btn .btn--primary` |
| Divider | `.divider-horizontal` |
| CIN/CIR footer | `.hint-text` |

**Niente numeri magici. Niente inline style. Niente hex hardcoded.**

---

## 3. Contenuto della sidebar step 1

### 3.1 Quando NESSUN appartamento è selezionato (utente sta scegliendo)

```
┌────────────────────────────────────┐  380px
│                                    │
│  [foto location Scauri 160h]       │  hero statico
│                                    │
│  ────────────────────────────      │
│                                    │
│  Check-in         15 giu           │
│  Check-out        22 giu           │
│  Ospiti           2 adulti         │
│                                    │
│  ────────────────────────────      │
│                                    │
│  IL TUO PREZZO                     │  label-uppercase-muted
│                                    │
│  Seleziona un appartamento         │  hint-text (grigio)
│  dalla lista                       │
│                                    │
│  ────────────────────────────      │
│                                    │
│  🗓️ CANCELLAZIONE                  │  label-uppercase-muted
│  Dipende dalla tariffa scelta      │  hint-text
│                                    │
│  [🔐 Deposito] banner warning      │  testo fisso dal config
│                                    │
│  [⚡ Consumi] banner info          │  testo fisso                   │
│                                    │
│  ┌──────────────────────────────┐  │
│  │        Continua  →           │  │  btn--primary DISABLED
│  └──────────────────────────────┘  │
│                                    │
│  CIN IT059014B47RVOMN2D            │  hint-text (micro)
│                                    │
└────────────────────────────────────┘
```

### 3.2 Quando appartamento È selezionato (utente ha cliccato su Kissabel)

```
┌────────────────────────────────────┐  380px
│                                    │
│  [foto Kissabel 160h]              │  hero dinamico
│  Villa Kissabel                    │  section-title-secondary
│  Villa · 260mq · 14 ospiti         │  label-metadata
│                                    │
│  ────────────────────────────      │
│                                    │
│  📍 LivingApple · 1.5 km dal mare  │  feature chip list
│  🛏️ 4 camere · 2 bagni             │
│  🏊 Piscina privata + condivisa    │  (solo se privatePool=true)
│  🌳 Giardino · Patio · Sala eventi │  (solo se presenti)
│                                    │
│  ────────────────────────────      │
│                                    │
│  Check-in         15 giu           │
│  Check-out        22 giu           │
│  Ospiti           2 adulti         │
│                                    │
│  ────────────────────────────      │
│                                    │
│  DETTAGLIO PREZZO                  │
│  7 notti × €180       €1260        │  solo se offer + date note
│  Tassa soggiorno       €28         │
│                                    │
│  Totale              €1288         │  22px / primary
│                                    │
│  ────────────────────────────      │
│                                    │
│  🗓️ CANCELLAZIONE                  │
│  Flessibile 60 gg — cancelli gratis│  dal OFFER_INFO della tariffa
│                                    │
│  [🔐 Deposito €1000] warning       │
│  [⚡ Consumi a misura] info        │
│                                    │
│  ┌──────────────────────────────┐  │
│  │   Continua   →               │  │  btn--primary ENABLED
│  └──────────────────────────────┘  │
│                                    │
│  CIN IT059014B47RVOMN2D            │
│                                    │
└────────────────────────────────────┘
```

### 3.3 Feature chip — regole di rendering

- `📍` sempre (distanza mare dal `distanceLabel` della property)
- `🛏️` sempre (bedrooms · bathrooms)
- `🏊` mostra "privata + condivisa" se `privatePool`, "condivisa" se `sharedPool`, nulla se nessuna (appartamenti Beach)
- `🌳` concatena `garden/patio/eventHall` con separatore `·`, solo se ≥1 true
- Ordine fisso. Chip mancanti spariscono senza lasciare buco.

**Esempio dal config**:
- Kissabel (villa): tutto presente
- Gala (Beach): `📍 250m dal mare · 🛏️ 2 camere · 2 bagni · 🌊 mare vicino` (no piscina, no giardino)
- Annurca (monolocale): `📍 1.5 km dal mare · 🛏️ 1 camera · 1 bagno · 🏊 Piscina condivisa`

---

## 4. Contenuto della sidebar step 2

I blocchi 1-3 e 5-11 sono identici allo step 1. Cambia solo il blocco 4.

### Blocco 4 — Extras + Voucher (solo step 2)

```
  AGGIUNTE                          │  label-uppercase-muted
                                    │
  [🛏️ Letto extra  −0+  +€15/notte] │  upsell stepper compatto
  [🍼 Culla        −0+  +€8/notte]  │
                                    │
  Codice sconto  [____]  [Applica]  │  voucher inline
```

### Cambi rispetto a oggi

| Contenuto oggi (step 2) | Nuova posizione |
|---|---|
| Foto + nome + tipo | Blocco 1 (identico) |
| Banner ⚡ consumi in cima | Blocco 9 (sposta sotto totale, stesso testo) |
| Input voucher | Blocco 4 |
| Date / Ospiti con Modifica | Blocco 3 |
| Dettaglio prezzo | Blocco 5 |
| Upsell stepper | Blocco 4 |
| Tassa soggiorno | Blocco 5 |
| Totale | Blocco 6 |
| Banner 🔐 deposito | Blocco 8 (sposta vicino a consumi, uniforma) |
| Politica cancellazione | Blocco 7 (compattata in 1 riga + testo) |

**Nessuna info perde**: è lo stesso contenuto, riordinato.

---

## 5. Mockup testuale side-by-side

### Step 1 (appartamento scelto) vs Step 2

```
  STEP 1                              STEP 2
┌──────────────────────────┐        ┌──────────────────────────┐
│ [foto Kissabel 160h]     │        │ [foto Kissabel 160h]     │
│ Villa Kissabel           │        │ Villa Kissabel           │
│ Villa · 260mq · 14 osp.  │        │ Villa · 260mq · 14 osp.  │
├──────────────────────────┤        ├──────────────────────────┤
│ 📍 1.5 km dal mare       │        │ (no feature — già scelto)│
│ 🛏️ 4 camere · 2 bagni    │        │                          │
│ 🏊 Piscina privata       │        │                          │
│ 🌳 Giardino · Patio      │        │                          │
├──────────────────────────┤        ├──────────────────────────┤
│ Check-in     15 giu      │        │ Check-in   15 giu Modif. │
│ Check-out    22 giu      │        │ Check-out  22 giu Modif. │
│ Ospiti       2 adulti    │        │ Ospiti     2 adul. Modif.│
├──────────────────────────┤        ├──────────────────────────┤
│                          │        │ AGGIUNTE                 │
│ (no extras — solo step 2)│        │ [🛏️ Letto ex -0+ +€15]   │
│                          │        │ [🍼 Culla  -0+ +€8]      │
│                          │        │ Codice [_____] Applica   │
├──────────────────────────┤        ├──────────────────────────┤
│ 7 notti × €180  €1260    │        │ 7 notti × €180  €1260    │
│ Tassa sogg.     €28      │        │ Letto ×7        +€105    │
│                          │        │ Tassa sogg.     €28      │
│                          │        │                          │
│ Totale        €1288      │        │ Totale        €1393      │
├──────────────────────────┤        ├──────────────────────────┤
│ 🗓️ Flex 60gg — gratis    │        │ 🗓️ Flex 60gg — gratis    │
│ [🔐 Deposito €1000]      │        │ [🔐 Deposito €1000]      │
│ [⚡ Consumi a misura]    │        │ [⚡ Consumi a misura]    │
├──────────────────────────┤        ├──────────────────────────┤
│ [    Continua  →     ]   │        │ [ Vedi riepil. →€1393 ]  │
├──────────────────────────┤        ├──────────────────────────┤
│ CIN IT059014B47RVOMN2D   │        │ CIN IT059014B47RVOMN2D   │
└──────────────────────────┘        └──────────────────────────┘
```

**Identità**: i 2 mockup sono strutturalmente gemelli. Differenze = solo blocchi condizionali (feature in step 1, extras in step 2). Tutto il resto è identico in posizione, stile, tipografia.

---

## 6. Componente unificato `BookingSidebar`

### 6.1 API

```tsx
interface BookingSidebarProps {
  room?: {
    name: string;
    type: 'monolocale' | 'appartamento' | 'villa';
    sqm: number;
    maxPeople: number;
    bedrooms: number;
    bathrooms: number;
    privatePool: boolean;
    sharedPool: boolean;
    features: { outdoorDining: boolean; garden: boolean; patio: boolean; eventHall: boolean };
    securityDeposit: number;
    coverUrl?: string;
  };
  propertyDistanceLabel?: string;   // es. "1.5 km dal mare"
  fallbackHeroUrl?: string;         // foto location se no appto

  checkIn?: string;
  checkOut?: string;
  numAdults?: number;
  numChildren?: number;

  pricing?: {
    offerName: string;
    offerCondition: string;          // es. "Flessibile 60gg — gratis"
    basePrice: number;
    nights: number;
    perNight: number;
    touristTax: number;
    extras?: Array<{ name: string; price: number; quantity: number }>;
    voucher?: { code: string; discount: number };
    total: number;
  };

  step: 1 | 2;

  // Controlli
  onEditDates?: () => void;          // step 2
  onEditGuests?: () => void;         // step 2
  onVoucherApply?: (code: string) => void;  // step 2
  extras?: {                          // step 2
    items: ExtraItem[];
    onQty: (id: string, qty: number) => void;
  };

  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;

  labels: { /* i18n */ };
  locale: string;
}
```

### 6.2 Scaffolding esistente

`components/wizard/WizardBookingSummary.tsx` + `components/ui/BookingSummary.tsx` sono **scaffolding mai cablato** ([wizard-layout.md:359](wizard-layout.md:359)). L'API è incompatibile col nuovo scope (niente feature chip, niente banner).

**Decisione**: creare `BookingSidebar.tsx` ex-novo, **eliminare** i due file scaffolding. Un componente unico, non tre.

---

## 7. Roadmap

Sostituisce §5 dell'audit. 3 mini-sessioni, ciascuna = 1 commit atomico + Vercel deploy.

| # | Ambito | Rischio | Estetica impatto |
|---|---|---|---|
| **3a** | Cleanup + rename. Elimino `WizardSidebar.tsx`, `WizardBookingSummary.tsx`, `components/ui/BookingSummary.tsx` (scaffolding morto). Rimuovo `renderTopSection` rami 1-4, `NightsBadge`, `.step6-sidebar`. Nessun cambio visivo. | 🟢 basso | nullo |
| **3b** | Creo `BookingSidebar.tsx`. Cablo in `Wizard.tsx` per step 1. Contenuto: hero + (feature chip se appto scelto) + dati chiave + breakdown (placeholder se vuoto) + policy + deposito + consumi + CTA + CIN/CIR. Zero inline. Classi library. | 🟡 medio | alto (step 1 cambia aspetto) |
| **3c** | Cablo `BookingSidebar` in step 2 con `step={2}` (blocco 4 extras+voucher). Rimuovo il `SidebarContent` inline e la sidebar 380 di `WizardStep2.tsx`. Rimuovo sfondo grigio edge-to-edge della pagina step 2. | 🔴 alto (tocca WizardStep2 in cui c'è logica pagamento collegata) | alto (step 2 si uniforma a step 1) |

**Ordine**: 3a → 3b → **stop verifica visiva step 1** (screenshot + approvazione) → 3c → **stop verifica visiva step 2**.

Dopo 3b si apre la sidebar `/prenota` e si confronta col wireframe §3.2. Se non convince → torno al doc prima di toccare step 2.

---

## 8. Cosa NON fa questo design

- Non introduce modali, popup o tooltip (info sempre visibili, scelta ratificata dall'utente).
- Non introduce animazioni o micro-interazioni.
- Non tocca lo step 3 (pagamento) — resta full-width (pattern "order summary expanded at checkout" — Baymard §3.9).
- Non adotta CSS-in-JS.
- Non propone redesign del layout wizard container (stabile in [wizard-layout.md](wizard-layout.md)).
- Non aggiunge dipendenze.

---

## 9. Riferimenti

- **Baymard Institute** — Checkout Usability Report, Trust Seals Study (baymard.com/research)
- **Nielsen Norman Group** — 10 Usability Heuristics (nngroup.com/articles)
- **Dati reali**: [config/properties.ts](../../config/properties.ts), `OFFER_INFO`
- [wizard-sidebar-audit.md](wizard-sidebar-audit.md) — diagnosi
- [wizard-layout.md](wizard-layout.md) — container layout
- [css-library.md](../design-system/css-library.md) — classi Sessione 1+2
- [migration-plan.md](migration-plan.md) — piano generale

---

## 10. Changelog

### 2026-04-19 — v2 (ratificata)
- Rimossa Opzione Progressive Disclosure con modale: banner ⚡/🔐 restano **visibili** in sidebar (Baymard "no hidden costs").
- Contenuto step 1 ridefinito: feature dell'appartamento selezionato dal `config/properties.ts`. Niente trust signal generici inventati.
- Placeholder soft quando nessun appto scelto (niente "Perché prenotare con noi").
- Aggiunto CIN/CIR in footer sidebar come signal regolarità.
- Gerarchia portata a 10 blocchi (+ CIN/CIR footer) — aggiunto cluster policy + deposito + consumi uniformato tra step.
- Roadmap ridotta: 3 mini-sessioni (3d eliminata perché non serve più).

### 2026-04-19 — v1
- Prima stesura. 380px, DNA unificato, 4 trust signal generici (scartati in v2).
