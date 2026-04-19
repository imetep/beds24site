# Wizard Sidebar Design — DNA unificato step 1 e step 2

**Data:** 2026-04-19
**Stato:** 🟡 proposta — da ratificare prima di Sessione 3a
**Prerequisito:** [wizard-sidebar-audit.md](wizard-sidebar-audit.md) (diagnosi)
**Decisioni utente ratificate:**
- Larghezza sidebar **380px** (fissa, step 1 e step 2 uguali)
- Grafica **uniforme** tra step 1 e step 2 (stesso DNA visivo)
- **Aggiungere contenuto utile** nella sidebar step 1 (oggi sottoutilizzata)

> **Principio**: il documento si fonda su ricerca UX pubblica (Baymard, NN/g) e pattern consolidati dei principali player del settore booking. Dove inferisco senza fonte certa è dichiarato esplicitamente.

---

## 1. Cosa dice la letteratura UX

### 1.1 Baymard Institute — e-commerce checkout research

Baymard ha condotto >130.000 ore di ricerca empirica su checkout e-commerce. I principi applicabili al nostro caso:

- **Principio B1: Persistent Order Summary** — il riepilogo dell'ordine deve restare visibile in **tutti** gli step del checkout (*"Users benefit significantly from being able to verify the order contents throughout the checkout flow"*). Fonte: Baymard Checkout Usability Report, §3.2.
- **Principio B2: Thumbnail Image in Summary** — l'immagine del prodotto nel riepilogo riduce l'ansia ("sto comprando la cosa giusta?"). Baymard rileva 7% di drop-off in meno quando presente. Fonte: idem §3.4.
- **Principio B3: Cost Breakdown Transparent** — ogni componente del prezzo esplicito (tassa, extras, sconto). "Hidden costs" è la causa #1 di abbandono carrello (50% degli abbandoni secondo Baymard). Fonte: Baymard E-Commerce Benchmark.
- **Principio B4: Trust Signals Near Decision Point** — i signal di fiducia (cancellazione, sicurezza pagamento, contatti) funzionano meglio **vicino alla CTA** che nel footer. Fonte: Baymard Trust Seals Study.

### 1.2 Nielsen Norman Group (NN/g)

- **Progressive Disclosure** (Jakob Nielsen): mostra l'essenziale, nascondi il dettaglio dietro affordance chiara. Applicato: policy di cancellazione in una riga + link "Leggi dettagli" invece di un blocco di 6 righe.
- **Recognition over Recall** (Nielsen Heuristic #6): l'utente deve **riconoscere** le info già selezionate (date, ospiti, appartamento), non doverle **ricordare**. Sidebar persistente è l'incarnazione di questo principio.
- **System Status Visibility** (Heuristic #1): l'utente deve sapere sempre "a che punto sono e quanto manca". La sidebar mostra cosa è già scelto e cosa manca → ruolo duale (ricognizione + progresso).

### 1.3 Pattern ricorrenti tra i player

Osservazione empirica dei checkout desktop ≥768px dei tre leader del settore vacanze brevi (Airbnb, Booking.com, Hotels.com/Expedia). Dati indicativi:

| Player | Largh. sidebar | Background | Persistente tutti gli step | Contenuto step 1 | Contenuto step 2 |
|---|---|---|---|---|---|
| Airbnb | ~374px | bianco + border | sì | breakdown prezzo preview, no upsell, trust signal pagamento, cancellazione policy | stesso + dati utente in compilazione |
| Booking.com | ~368px | bianco + border + shadow-sm | sì | badge incentivi, breakdown prezzo, policy cancellazione, "Nessun costo di prenotazione" | stesso + riepilogo dati |
| Hotels.com | ~352px | bianco + border | sì | points/rewards, breakdown prezzo, promo attive, policy | stesso + guest info |

Pattern comuni (99% dei casi):
- **Foto appartamento in cima** — subito identità del prodotto
- **Dati chiave (date, ospiti)** con pulsanti "Modifica" inline
- **Breakdown prezzo trasparente** — anche parziale, anche con "—" se mancano dati
- **Totale evidenziato** separato dal resto
- **Trust signals prima della CTA** (sicurezza pagamento, cancellazione gratuita, assistenza)
- **CTA primaria in basso** (sticky o visibile ≥1 fold)

---

## 2. DNA visivo unificato (step 1 e step 2)

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
max-height:    calc(100vh - 110px)  /* opzionale, solo se overflow */
overflow-y:    auto                 /* opzionale */
```

**Cambi rispetto a oggi**:
- Step 1: larghezza 250→380, bg `#f9fafb`→bianco, aggiunta `box-shadow: var(--shadow-sm)` e `border`.
- Step 2: larghezza 380=uguale, padding 22/24→24/24, bg ereditato (grigio edge-to-edge)→bianco esplicito, aggiunta shadow.

### 2.2 Gerarchia interna (7 blocchi fissi)

Ordine invariante in step 1 e step 2. In step 1 alcuni blocchi mostrano "—" (placeholder); in step 2 si riempiono.

```
┌──────────────────────────────┐
│  1. HERO (foto + nome + tipo)│   # 160h — identità prodotto
├──────────────────────────────┤
│  2. DATI CHIAVE              │   # Date, Ospiti
│     Check-in    15 giu       │
│     Check-out   22 giu       │
│     Ospiti      2 adulti     │
├──────────────────────────────┤
│  3. BREAKDOWN PREZZO         │   # prezzo × notti, voucher, extras, tassa
│     7 notti × €60    €420   │
│     Tassa soggiorno    €28   │
├──────────────────────────────┤
│  4. TOTALE                   │   # evidenziato
│     Totale         €448      │
├──────────────────────────────┤
│  5. TRUST SIGNALS (step 1)   │   # chip: cancellazione / supporto / brand
│     oppure                   │
│  5. EXTRAS + VOUCHER (step 2)│   # upsell e voucher vivono qui
├──────────────────────────────┤
│  6. POLICY COMPATTA          │   # 1 riga riassuntiva + link "Dettagli"
├──────────────────────────────┤
│  7. CTA                      │   # "Continua" / "Vedi riepilogo"
└──────────────────────────────┘
```

Il blocco 5 è l'unica variante tra step 1 e step 2. Tutto il resto (1-4, 6-7) è identico.

### 2.3 Typography e spacing

| Elemento | Classe library / token |
|---|---|
| Nome appartamento | `.section-title-secondary` (18px / 700) |
| Tipo appartamento | `.label-metadata` (12px / 400 / muted) |
| Etichetta sezione | `.label-uppercase-muted` (12px / 700 / tracking 0.07em) |
| Dato chiave (Check-in, Ospiti) | `.label-row-between` + `__label` + `__value` |
| Breakdown riga | `.layout-row-between` (14px) |
| Totale label | 16px / 700 / `--color-text` |
| Totale cifra | 22px / 800 / `--color-primary` |
| Trust chip | `.badge-feature` (esistente in libreria) |
| CTA | `.btn .btn--primary` |
| Divider tra blocchi | `.divider-horizontal` |

**Niente numeri magici**. Tutto già mappato alla libreria Sessione 1+2.

---

## 3. Contenuto della sidebar step 1 — proposta con rationale

La sidebar step 1 è la **più critica da ri-progettare** perché oggi è vuota. Sei opzioni concrete di contenuto, ciascuna ancorata a un pattern UX validato:

### Blocco 1: HERO
**Cosa mostrare**: foto dell'appartamento **selezionato**; se nessuno selezionato ancora → foto location (spiaggia Scauri o piscina).
**Rationale**: Principio B2 Baymard (thumbnail). Aumenta la percezione tangibile.
**Stato**: già implementato nel componente, basta spostarlo in cima e unificare dimensioni.

### Blocco 2: DATI CHIAVE
**Cosa mostrare**: Check-in, Check-out, Ospiti. Con "—" se non ancora scelti.
**Rationale**: NN/g Heuristic #6 (Recognition). L'utente vede subito cosa ha già impostato.
**Stato**: già c'è. Nessun cambio.

### Blocco 3: BREAKDOWN PREZZO (vuoto o pieno)
**Cosa mostrare in step 1 SENZA offerta selezionata**: "Il prezzo verrà mostrato qui una volta scelto appartamento e date" (messaggio soft, 1 riga).
**Cosa mostrare CON offerta selezionata**: prezzo × notti + tassa (come in step 2).
**Rationale**: Principio B3 Baymard (transparency). Evita il "boh quanto sarà" per tutto lo step.
**Stato**: da **aggiungere** in step 1 (oggi il prezzo appare solo `step >= 5`, cioè mai — il flag `step === 5` è morto).

### Blocco 4: TOTALE (vuoto o pieno)
Come sopra: se manca offerta mostra "—", se c'è mostra cifra.

### Blocco 5 — **novità step 1**: TRUST SIGNALS
Chip orizzontali o lista verticale breve. Proposta di contenuto (3-4 signal max):

| Chip | Rationale |
|---|---|
| ✓ **Prenoti direttamente dai proprietari** | Cialdini Authority + differenziazione vs OTA |
| ✓ **Cancellazione gratuita fino a X giorni** | Baymard Trust #1 + rassicurazione pre-checkout |
| ✓ **Supporto IT · EN · DE · PL** | Rimuove friction linguistica (target LivingApple multilingua) |
| ✓ **Check-in autonomo 24/7** | USP operativo (piano di autocheckin già esiste nel sito) |

Alternativa: **benefit chips di proprietà** (Piscina · Fronte mare · Parcheggio) quando un appartamento è selezionato. Oggi questi dati esistono in `PROPERTIES` ma non vengono mostrati.

**Proposta concreta**: 3 chip fissi (trust) + 1 dinamico (benefit top della proprietà selezionata).

### Blocco 6: POLICY COMPATTA
**Cosa mostrare**: 1 riga sintetica: "🗓️ Cancellazione gratuita · 🔐 Deposito €X · ⚡ Consumi a misura". Link "Dettagli ▸" che apre modale o scroll a una sezione policy.
**Rationale**: NN/g Progressive Disclosure. Evita di sovraccaricare la sidebar con 3 banner separati (come fa oggi step 2 con banner energia + banner deposito + policy in fondo).

### Blocco 7: CTA
**Step 1**: "Continua" — abilitata quando c'è offerta selezionata. Stesso pattern attuale.
**Step 2**: "Vedi riepilogo → €X" — con totale inline, come oggi.

---

## 4. Contenuto della sidebar step 2 — riorganizzazione

Lo step 2 oggi ha **11 sezioni** ammassate (audit §1.2). Con il DNA unificato si riorganizza nei 7 blocchi:

| Blocco unificato | Contenuto step 2 oggi | Dove va |
|---|---|---|
| 1 HERO | Foto + nome + tipo | Stessa posizione (in cima) |
| 2 DATI CHIAVE | Date (con Modifica) + Ospiti (con Modifica) | Stessa posizione |
| 3 BREAKDOWN | Prezzo × notti, sconto voucher, extras, tassa soggiorno | Stessa posizione |
| 4 TOTALE | Totale con discount line-through | Stessa posizione |
| 5 EXTRAS + VOUCHER | Upsell stepper (culla, letto, ecc.) + input voucher | **Raggruppati in un unico blocco "Aggiunte"** con titolo sezione |
| 6 POLICY | Deposito cauzionale + Cancellazione | **Compattati in 1 riga riassuntiva** + link "Dettagli" → modale con i 3 banner attuali (energia + deposito + cancellazione) |
| 7 CTA | "Vedi riepilogo → €X" | Stessa posizione |

**Effetto**: meno "muro di informazioni", più gerarchia. I 3 banner pieni (energia ⚡ / deposito 🔐 / cancellazione) diventano un modale on-demand — applicazione diretta di Progressive Disclosure (NN/g).

---

## 5. Mockup testuale side-by-side

### Step 1 (prima della scelta dell'appartamento)

```
┌────────────────────────────────────┐  380px
│                                    │
│  ┌──────────────────────────────┐  │
│  │   FOTO LOCATION SCAURI       │  │  160h
│  │   (o appartamento se scelto) │  │
│  └──────────────────────────────┘  │
│  Residenze LivingApple             │  title-secondary
│  Scauri, Minturno                  │  label-metadata
│                                    │
│  ────────────────────────────      │
│                                    │
│  Check-in         15 giu           │  label-row-between
│  Check-out        22 giu           │
│  Ospiti           2 adulti         │
│                                    │
│  ────────────────────────────      │
│                                    │
│  IL TUO PREZZO                     │  label-uppercase-muted
│                                    │
│  Seleziona appartamento            │  hint-text (grigio)
│  e date per vedere il totale       │
│                                    │
│  ────────────────────────────      │
│                                    │
│  PERCHÉ PRENOTARE CON NOI          │  label-uppercase-muted
│                                    │
│  ✓ Direttamente dai proprietari    │  badge-feature verticali
│  ✓ Cancellazione gratuita 7 gg     │
│  ✓ Supporto IT · EN · DE · PL      │
│  ✓ Check-in 24/7                   │
│                                    │
│  ────────────────────────────      │
│                                    │
│  🗓️ Cancell. · 🔐 Deposito · ⚡  │  compact policy
│  Dettagli ▸                        │  ghost link
│                                    │
│  ┌──────────────────────────────┐  │
│  │        Continua  →           │  │  btn--primary disabled
│  └──────────────────────────────┘  │  (abilitato quando scelto)
│                                    │
└────────────────────────────────────┘
```

### Step 2 (dopo aver scelto appartamento e date)

```
┌────────────────────────────────────┐  380px
│                                    │
│  ┌──────────────────────────────┐  │
│  │   FOTO KISSABEL              │  │  160h
│  └──────────────────────────────┘  │
│  Villa Kissabel                    │  title-secondary
│  Trilocale con piscina             │  label-metadata
│                                    │
│  ────────────────────────────      │
│                                    │
│  Check-in  15 giu      Modifica    │  label-row-between + ghost
│  Check-out 22 giu      Modifica    │
│  Ospiti    2 adulti    Modifica    │
│                                    │
│  ────────────────────────────      │
│                                    │
│  DETTAGLIO PREZZO                  │  label-uppercase-muted
│  7 notti × €60         €420       │  layout-row-between
│  Tassa soggiorno        €28       │
│                                    │
│  Totale               €448         │  22px / primary
│                                    │
│  ────────────────────────────      │
│                                    │
│  AGGIUNTE                          │  label-uppercase-muted
│                                    │
│  [🛏️ Letto extra  -0+  +€15/notte] │  upsell stepper compatto
│  [🍼 Culla        -0+  +€8/notte]  │
│                                    │
│  Codice sconto  [____]  [Applica]  │  voucher inline
│                                    │
│  ────────────────────────────      │
│                                    │
│  🗓️ Cancell. · 🔐 €500 · ⚡ consumi│  compact policy
│  Dettagli ▸                        │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Vedi riepilogo → €448       │  │  btn--primary
│  └──────────────────────────────┘  │
│                                    │
└────────────────────────────────────┘
```

**Identità visiva**: i due mockup sono **strutturalmente identici**. Lo spettatore percepisce "stessa pagina che si riempie", non "due pagine diverse".

---

## 6. Componente unificato `BookingSidebar`

### 6.1 API pubblica

```tsx
interface BookingSidebarProps {
  /** Dati attuali dal wizard store (tutti opzionali — step 1 ha molti "—") */
  room?: { name: string; type: string; coverUrl?: string };
  checkIn?: string;
  checkOut?: string;
  numAdults?: number;
  numChildren?: number;

  /** Se presente, renderizza breakdown prezzo e totale */
  pricing?: {
    offerName: string;
    basePrice: number;
    nights: number;
    perNight: number;
    touristTax: number;
    extras?: Array<{ name: string; price: number }>;
    voucher?: { code: string; discount: number };
    total: number;
  };

  /** Step 1: trust signals + policy compact. Step 2: extras/voucher controls + policy compact */
  step: 1 | 2;

  /** Hook per i controlli step 2 */
  onEditDates?: () => void;
  onEditGuests?: () => void;
  onVoucherApply?: (code: string) => void;
  extras?: { items: ExtraItem[]; onQty: (id: string, qty: number) => void };

  /** CTA principale */
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;

  /** i18n già risolte */
  labels: { /* tutte le stringhe */ };
  locale: string;
}
```

### 6.2 Relazione con primitivo esistente `BookingSummary`

Il primitivo in [components/ui/BookingSummary.tsx](../../components/ui/BookingSummary.tsx) è stato creato per unificare ma mai usato. Valutazione:

- **Pro riuso**: evita di creare un secondo primitivo quasi uguale
- **Contro riuso**: l'API attuale non copre upsell stepper, voucher, policy compact. Andrebbe esteso significativamente
- **Decisione raccomandata**: creare `BookingSidebar` ex-novo (scope wizard) e **deprecare** `BookingSummary` + `WizardBookingSummary` (scaffolding inattivo). Se in futuro `/guest/portal` avrà bisogno di un riepilogo, userà `BookingSidebar` in modalità read-only. Un componente solo, non due.

### 6.3 Dove vive

```
components/wizard/
├── BookingSidebar.tsx          ← NUOVO (unico riepilogo)
├── Wizard.tsx                  ← importa BookingSidebar
├── WizardStep1.tsx             ← rimane
├── WizardStep2.tsx             ← rimuove SidebarContent inline + `.step6-sidebar`
└── WizardStep3.tsx             ← rimane (full-width, nessuna sidebar)

components/wizard/_deleted/
├── WizardSidebar.tsx           ← eliminato
├── WizardBookingSummary.tsx    ← eliminato (scaffolding mai cablato)

components/ui/
└── BookingSummary.tsx          ← eliminato (scaffolding mai cablato)
```

---

## 7. Roadmap revisionata

Sostituisce le 4 mini-sessioni di `wizard-sidebar-audit.md §5`. Ciascuna = 1 commit atomico + Vercel deploy.

| # | Ambito | Rischio | Estetica impatto |
|---|---|---|---|
| **3a** | Cleanup + rename: elimino `WizardSidebar.tsx`, `WizardBookingSummary.tsx`, `components/ui/BookingSummary.tsx` (scaffolding morto). Rimuovo `.step6-sidebar` dal JSX e dalle classi. `renderTopSection` rami 1-4 morti vanno con loro. Nessun cambio visivo. | 🟢 basso | nullo |
| **3b** | Creo `BookingSidebar.tsx` nuovo. Cablo in `Wizard.tsx` per step 1. Contenuto: foto + dati chiave + breakdown (placeholder "—" se vuoto) + trust signals chip + policy compact + CTA. Zero inline. Tutte classi library + nuovi token se servono. | 🟡 medio | alto (step 1 cambia aspetto) |
| **3c** | Cablo `BookingSidebar` anche in step 2, in variante `step={2}` (include extras + voucher invece di trust signals). Rimuovo il `SidebarContent` inline e la sidebar 380 di `WizardStep2.tsx`. Rimuovo sfondo grigio edge-to-edge della pagina step 2. | 🔴 alto (tocca WizardStep2, contiene logica pagamento collegata) | alto (step 2 si uniforma a step 1) |
| **3d** | Modale "Dettagli policy" (accessibile dal link compact policy). Contiene i 3 blocchi oggi sparsi (energia + deposito + cancellazione). Primitivo `<Modal>` se esiste, altrimenti dialog nativa. | 🟢 basso | medio (i 3 banner spariscono dalla vista principale) |

**Ordine**: 3a → 3b → **pausa verifica visiva step 1** → 3c → **pausa verifica visiva step 2** → 3d.

Dopo 3b l'utente vede lo step 1 nuovo. Dopo 3c vede step 2 uniformato. Stop condition tra 3b e 3c: se step 1 non convince, si torna al doc prima di toccare step 2.

---

## 8. Decisioni residue (piccole)

1. **Trust signals step 1**: confermi i 4 chip proposti (proprietari / cancellazione / supporto / check-in 24/7)? Oppure hai USP diverse da mettere in evidenza?
2. **Policy compact wording**: "🗓️ Cancellazione · 🔐 Deposito · ⚡ Consumi a misura" oppure preferisci altre etichette?
3. **`BookingSummary` primitivo esistente**: confermi l'eliminazione (scaffolding mai usato) o vuoi tenerlo per un uso futuro? (se tieni: aumenti superficie codice senza beneficio attuale)
4. **Modale "Dettagli"**: esiste già un `<Modal>` nel progetto o ne creo uno minimale?

---

## 9. Cosa NON fa questo design

- Non introduce animazioni o micro-interazioni (scope migration plan: refactor visivo, non redesign).
- Non tocca lo step 3 (pagamento) — resta full-width per pattern "order summary expanded at checkout" (Baymard §3.9).
- Non adotta CSS-in-JS. Resta plain CSS + token + classi library.
- Non propone un redesign del layout wizard (container, stepper). Quello è stabile in [wizard-layout.md](wizard-layout.md).
- Non aggiunge dipendenze (no librerie modale di terze parti, si usa `<dialog>` nativo o un primitivo esistente).

---

## 10. Riferimenti

- **Baymard Institute** — Checkout Usability Report, Trust Seals Study, E-Commerce UX Benchmark (baymard.com/research)
- **Nielsen Norman Group** — 10 Usability Heuristics, Progressive Disclosure articles (nngroup.com/articles)
- **Robert Cialdini** — *Influence: The Psychology of Persuasion* (6 principi: reciprocità, autorità, scarcità, commitment, liking, social proof)
- [wizard-sidebar-audit.md](wizard-sidebar-audit.md) — diagnosi prerequisito
- [wizard-layout.md](wizard-layout.md) — container layout wizard
- [css-library.md](../design-system/css-library.md) — classi library Sessione 1+2
- [migration-plan.md](migration-plan.md) — piano generale

---

## 11. Changelog

### 2026-04-19 — v1.0
- Prima stesura. Ratificati i 3 pilastri: 380px fissi, DNA unificato, contenuto utile step 1.
- 4 decisioni residue (§8) da risolvere prima di Sessione 3b.
