# Idea: pannello admin "Gestione extra"

**Stato:** 💭 backlog — non urgente
**Data proposta:** 2026-04-21
**Contesto discussione:** sessione chat `upbeat-shannon-76a8d7`

---

## Il problema

I testi degli upsell Beds24 (nome + descrizione in 4 lingue) vivono hardcoded in [`config/upsell-items.ts`](../../config/upsell-items.ts). Ogni volta che:

- Beds24 cambia l'index di un upsell (capitato 2026-04-21: "Lettino da campeggio" spostato da index 1 → 11, sidebar wizard → vuota in produzione)
- Si aggiunge un nuovo upsell vendibile
- Si corregge una traduzione

…serve toccare codice + deploy. Il proprietario non può farlo in autonomia.

## Idea

Una pagina `/admin/gestione-extra` che:

1. Legge gli upsellItems della property via `/properties?includeUpsellItems=true`
2. Mostra tutti gli slot (obligatory / optional / optionalQty / notUsed) con stato di configurazione
3. Per ciascun optional senza testo: form "Nome in italiano" → salva
4. Al salvataggio: traduzione automatica in en/de/pl + commit sui 4 `locales/*/common.json`

Il pannello è **inline-CSS** (diversamente dal progetto lato utente che sta migrando a classi centralizzate), perché serve solo a chi gestisce il gestionale, non al cliente.

## Architettura concordata (2026-04-21)

Dopo discussione con l'utente, le 3 decisioni architetturali chiave erano:

### 1. Storage — commit su Git via GitHub API

Su Vercel il filesystem è read-only. Quando l'admin salva un upsell:
- Server API prende `{propertyId, index, nameIt}`
- Traduce in 3 lingue (vedi punto 2)
- Commit sui 4 file `locales/{it,en,de,pl}/common.json` via GitHub REST API (`@octokit/rest` o fetch diretto)
- Vercel auto-deploya al push

Pro: zero infrastruttura nuova, versionato, gratis. Coerente con il flow attuale "push → deploy".

Sovrascrivere valori esistenti senza conflitto — conferma utente 2026-04-21.

### 2. Traduzioni — Claude API

`ANTHROPIC_API_KEY` (da creare su console.anthropic.com + aggiungere a Vercel env + `.env.local`).

Costo stimato: ~0.0005$ per upsell (3 traduzioni brevi). Trascurabile.

Flusso server: prompt strutturato a Claude con `nameIt` → chiede JSON `{en, de, pl}` → valida → scrive.

### 3. Scope — tutti gli extra nel pannello admin

- Admin panel mostra tutto: obligatory, optional, optionalQty, notUsed — per visibilità completa dell'inventario Beds24
- Guest booking (API `/api/upsells` esistente) continua a mostrare solo `optional` / `optionalQty` come ora
- Gli obligatory/notUsed appaiono in grigio/read-only con label ("obbligatorio — già in prezzo" / "slot vuoto")

## Pre-requisiti del lavoro

Da fare PRIMA di implementare il pannello (utile anche senza pannello):

- **Migrazione i18n**: spostare testi upsell da `config/upsell-items.ts` → `locales/{it,en,de,pl}/common.json` sotto namespace `upsells.{propertyId}_{index}`. L'helper `getUpsellTexts` diventa un lookup i18n. Questo step elimina la duplicazione tra i18n-centric project e upsell-items.ts hardcoded.
- Decisione: fare la migrazione i18n anche SENZA il pannello admin, così le traduzioni manuali future seguono lo stesso pattern del resto del progetto.

## Piano di lavoro stimato

Quando si riparte, ordine dei commit:

1. **Migrazione i18n** (5 commit: 4 json + 1 helper TS)
2. **API admin `/api/admin/upsells/list`** GET — estratto Beds24 + testi i18n attuali (1 commit)
3. **API admin `/api/admin/upsells/save`** POST — traduzione + GitHub commit (3 commit: deps, helper GitHub, route)
4. **UI `/admin/gestione-extra/page.tsx`** (2-3 commit)

Totale: ~10-12 commit, 2-3 ore.

## Decisione 2026-04-21

L'utente ha deciso di **rimandare il pannello admin** per altri momenti. Nel frattempo le traduzioni upsell si fanno manualmente con l'aiuto dell'agente (editing diretto dei file JSON / TS).

Questa nota resta come promemoria per quando si deciderà di riprendere.
