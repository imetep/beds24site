# Wizard Sidebar Audit — uniformare le 3 varianti

**Data:** 2026-04-19
**Scope:** il riepilogo soggiorno nel wizard `/prenota` cambia forma in modo incoerente tra step 1, 2 e 3. Prima di migrare il CSS di `WizardSidebar.tsx` (Sessione 3 del migration plan) serve decidere la **forma di destinazione** del pattern.
**Fuori scope:** logica pagamento, validazione form, mobile (trattato come caso separato in §4).

---

## 1. Evidenze raccolte dal codice

### 1.1 Tre "sidebar" diverse — inventario

| Step | Sorgente | Largh. | Padding | Radius | Background | Classe CSS | File |
|---|---|---|---|---|---|---|---|
| **1** | `WizardSidebar.tsx` (componente dedicato) | **250** | 20/18 | 16 | `#f9fafb` | `.wizard-container__sidebar` (library) + inline | [WizardSidebar.tsx:153](../../components/wizard/WizardSidebar.tsx:153) |
| **2** | inline in `WizardStep2.tsx` | **380** | 22/24 | 16 | ereditato (pagina step 2 ha bg grigio edge-to-edge) | `.step6-sidebar` (locale, nome residuo) | [WizardStep2.tsx:598](../../components/wizard/WizardStep2.tsx:598) |
| **3** | nessuna sidebar | — | — | — | — | — | [WizardStep3.tsx:525](../../components/wizard/WizardStep3.tsx:525) |

Tra step 1 e step 2 la sidebar **cresce di 130px (+52%)** e cambia padding. Tra step 2 e step 3 **sparisce**: il riepilogo dello step 3 è inline nel corpo con `maxWidth: 640`, in cards bianche impilate.

### 1.2 Duplicazione concettuale

Lo stesso concetto ("riepilogo soggiorno lato utente") è implementato **4 volte**:

1. **`WizardSidebar.tsx`** — sidebar step 1 (foto + banner energia/deposito + riepilogo dati + CTA)
2. **`SidebarContent` inline in `WizardStep2.tsx`** — sidebar step 2 (riepilogo dati + breakdown prezzo + CTA modifica)
3. **Cards inline in `WizardStep3.tsx`** — riepilogo finale full-width (appartamento, date, breakdown, policy, dati ospite)
4. **`WizardBookingSummary.tsx` + `components/ui/BookingSummary.tsx`** — primitivo creato per **unificare** i tre pattern sopra, ma **mai importato da nessuno** (marcato come "pronto per riuso in /guest/portal" in [wizard-layout.md:359](wizard-layout.md:359)). Scaffolding inattivo.

### 1.3 Codice morto rilevato

| # | Dove | Cosa |
|---|---|---|
| a | `WizardSidebar.tsx:93-149` | `renderTopSection()` ha 5 rami `if (step === 1/2/3/4/5)`. **Il componente è chiamato sempre con `step={5}`** ([Wizard.tsx:22,24](../../components/wizard/Wizard.tsx:22)). I rami 1/2/3/4 non vengono mai eseguiti. |
| b | `WizardSidebar.tsx:248-258` | `NightsBadge` definito ma **mai usato nel render**. Residuo di versione precedente in cui le notti erano un pill blu pastello. |
| c | `WizardBookingSummary.tsx` + `components/ui/BookingSummary.tsx` | Primitivo + wrapper creati per unificare ma **mai cablati**. Marcato "pronto per riuso" ma il riuso non è avvenuto. |
| d | `WizardStep2.tsx:455` + `:599` | Classe `.step6-sidebar` / `.step6-mobile-summary` — **nome residuo** di una numerazione precedente degli step (mai esistito uno step 6 nel flusso corrente). |

### 1.4 Stato mobile

- **Step 1 mobile** (<768px): sidebar nascosta via `.wizard-container__sidebar { display: none; }`. L'utente non vede foto/banner laterali — lo step 1 resta nudo.
- **Step 2 mobile**: `.step6-mobile-summary` — **accordion riepilogo in cima** che si apre al tap ("Il tuo soggiorno — €420 ›"). Al suo interno riusa lo stesso `<SidebarContent />` del desktop.
- **Step 3 mobile**: il layout è già a colonna singola, quindi il riepilogo viene visto naturalmente (niente variante mobile dedicata).

---

## 2. Principi UX di riferimento

Dall'osservazione di Booking.com, Airbnb, Hotels.com (pattern consolidati su desktop ≥768px):

1. **Riepilogo persistente**: resta visibile **in tutti gli step** del checkout per ridurre l'ansia da "non ricordo cosa sto comprando". Sempre sticky a destra su desktop.
2. **Larghezza costante**: ~320–400px, non cambia tra uno step e l'altro (Booking: 368px; Airbnb: 374px; Hotels.com: 352px).
3. **Gerarchia interna fissa**: foto appartamento → dati chiave (date, ospiti) → breakdown prezzo → totale → CTA. L'ordine non cambia tra step.
4. **Contenuto cresce, contorno no**: più vai avanti, più info appaiono (es. dati ospite compilati) **dentro** la stessa sidebar. La sidebar non si ridisegna — si riempie.
5. **Mobile**: pattern **accordion-in-alto** (clic per espandere) o **sticky-bottom-bar** con totale + CTA. Tutti i player usano uno di questi due pattern.
6. **Ultimo step (pagamento/conferma)**: la sidebar si "trasforma" in **riepilogo finale full-width** SOLO quando il riepilogo diventa l'unico contenuto (es. pagina di conferma post-pagamento). **Durante il pagamento in corso** la sidebar resta laterale.

---

## 3. Confronto sito vs best practice

| Dimensione | Sito ora | Best practice |
|---|---|---|
| Sidebar in tutti gli step | ❌ solo step 1 + step 2 (sparisce a step 3) | ✅ tutti gli step attivi |
| Larghezza costante | ❌ 250 → 380 → sparisce | ✅ costante ~320-400 |
| Gerarchia interna | ❌ diversa tra step 1 (brand content) e step 2 (riepilogo data-driven) | ✅ stessa gerarchia |
| Mobile pattern unificato | ⚠️ solo step 2 ha accordion; step 1 non mostra nulla | ✅ tutti gli step o accordion o sticky-bar |
| Nome file/classi coerente | ❌ `.step6-sidebar`, `WizardBookingSummary` non usato | ✅ |

**Diagnosi**: il sito applica **tre pattern diversi** per lo stesso concetto. La "stessa mamma" non esiste ancora a livello architetturale — non è un problema solo CSS.

---

## 4. Opzioni architetturali

### Opzione A — Riepilogo persistente unificato (allineato a Booking/Airbnb)
- Sidebar visibile negli step 1 e 2 desktop (step 3 = pagamento, la sidebar resta).
- **Un solo componente** `BookingSidebar` (nuovo nome) che riceve `step` come prop e **mostra sempre la stessa gerarchia**: foto → date/ospiti → (quando presente) breakdown prezzo → totale → CTA.
- Largh. fissa (es. 360px). Bg bianco + border + shadow-sm (no grigio #f9fafb in step 1, no bg ereditato in step 2).
- Mobile: accordion-in-alto in tutti gli step. Contenuto identico al desktop.
- Step 3 **non ha più il riepilogo full-width**: resta laterale. L'attuale riepilogo inline viene eliminato.
- **Implica**: riscrivere il layout dello step 3 per fare spazio alla sidebar + spostare il breakdown prezzo dentro la sidebar.
- Estetica: massima coerenza, curva di apprendimento zero per l'utente.
- Costo: **medio-alto** (tocca step 2 e step 3, non solo la sidebar).

### Opzione B — Sidebar unica step 1+2, riepilogo finale full-width step 3 (ibrido)
- Sidebar visibile negli step 1 e 2 desktop. Step 3 resta full-width perché è la "pagina di conferma/pagamento".
- **Un solo componente** `BookingSidebar` per step 1+2, larghezza fissa (es. 320px).
- Step 3 tiene il layout centrato attuale, ma il breakdown cards **usa le stesse classi** library della sidebar (stesso DNA visivo) — così il salto non è più "un'altra UI", è "lo stesso riepilogo che si espande".
- Mobile: accordion-in-alto per step 1+2, layout naturale per step 3.
- **Implica**: rinomina `WizardSidebar` → `BookingSidebar`, refactor CSS di step 2 sidebar, restyle step 3 cards per coerenza — ma NO cambio di layout dello step 3.
- Estetica: coerenza buona con minor costo di ristrutturazione.
- Costo: **medio**.

### Opzione C — Migrazione CSS-only, zero cambio architetturale (minima)
- Migra `WizardSidebar.tsx` CSS seguendo la libreria, senza toccare il fatto che step 2 ha una sidebar diversa e step 3 non ce l'ha.
- Elimina solo il codice morto (`renderTopSection` rami 1-4, `NightsBadge`).
- Rename `.step6-sidebar` → `.wizard-summary-sidebar` (non si tocca il layout di step 2).
- Estetica: resta incoerente — **non risolve il problema segnalato dall'utente**.
- Costo: **basso**.

---

## 5. Consigliato

**Opzione B** è il compromesso con miglior rapporto valore/rischio:
- Risolve l'incoerenza tra step 1 e step 2 (stesso componente, stessa larghezza, stesso DNA).
- Mantiene lo step 3 full-width perché è semanticamente diverso ("ecco cosa stai per pagare, clicca per pagare") → la letteratura UX supporta questo pattern ("order summary expanded at checkout").
- Non introduce il grande rischio dell'Opzione A (riscrivere il layout dello step 3 mentre c'è Stripe/PayPal in mezzo = ad alto rischio per il booking funnel).
- Apre la strada al riuso del primitivo `BookingSummary` (già creato e mai cablato): finalmente trova la sua casa.

**Se scegli B**, il lavoro si divide in **4 mini-sessioni**:

| # | Ambito | Rischio |
|---|---|---|
| 3a | Cleanup morti: `renderTopSection` rami 1-4, `NightsBadge`, rename `.step6-sidebar` | 🟢 basso |
| 3b | Fusione: `WizardSidebar` → `BookingSidebar` (via `components/ui/BookingSummary` + wrapper `WizardBookingSummary`). Larghezza unificata, stessa gerarchia interna. Step 1 e step 2 usano lo stesso componente. | 🟡 medio |
| 3c | Restyle step 3 cards: stesse classi library della sidebar (section-title, card-info, divider-horizontal, ecc.) | 🟢 basso |
| 3d | Migrazione CSS finale del `BookingSidebar` (zero inline, zero hex) | 🟢 basso |

Ogni mini-sessione = commit atomico. Totale: 4 commit, 4 deploy Vercel incrementali.

---

## 6. Decisioni che chiedo prima di procedere

1. **Larghezza target della sidebar**: 320 (Hotels.com), 360 (Booking), o 380 (step 2 attuale)?
2. **Background sidebar**: bianco + border + shadow-sm (uniforma step 1 al resto del sito), o manteniamo il grigio `#f9fafb` come step 1 attuale?
3. **Step 3 full-width**: OK mantenere come ora (Opzione B), o vuoi sidebar laterale anche lì (Opzione A)?
4. **`WizardBookingSummary` primitivo**: lo cabliamo come componente unico in 3b, o lo eliminiamo e ricreiamo un nuovo `BookingSidebar` da zero?

---

## 7. Cosa NON fa questo audit

- Non tocca logica di pagamento / validazione / fetch / store.
- Non cambia il wizard-layout container (quello è in [wizard-layout.md](wizard-layout.md), già stabile).
- Non copre il self-checkin wizard (ha un flusso completamente diverso, audit separato).
- Non adotta CSS-in-JS. Resta plain CSS + token + classi library.

---

## 8. Riferimenti

- [migration-plan.md](migration-plan.md) — piano generale (questo doc è il prerequisito di Sessione 3)
- [wizard-layout.md](wizard-layout.md) — layout container e §14 rollback
- [wizard-visual-audit.md](wizard-visual-audit.md) — audit visivo cross-step (3 titoli, 3 sfondi, 3 CTA)
- [css-library.md](../design-system/css-library.md) — libreria CSS Sessione 1+2
