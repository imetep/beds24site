/**
 * MOCK STATICO — /wizardstep1-mock-v2
 *
 * Scopo: discussione preliminare del nuovo wizardstep1 (lista risultati)
 * 2-col Airbnb-style. Riferimento: docs/ux/mio desiderio.xlsx (foglio
 * wizardstep1) + docs/ux/airbnb-checkout-analysis.xlsx.
 *
 * Layout:
 *   - desktop ≥1024: form 540 sx (filter-bar + lista room-card) + summary 340 dx STICKY top:32
 *   - mobile <1024: stacked, summary IN ALTO, lista sotto, CTA "Continua" sticky bottom
 *
 * Logica: ZERO. Dati hardcoded (2 room-card mock con 3 tariffe ciascuna).
 *
 * Da rimuovere quando i pattern migrano in components/wizard/WizardStep1.tsx.
 */
export default function WizardStep1MockV2Page() {
  return (
    <main className="checkout-page">

      {/* Titolo principale */}
      <h1 className="section-title-main checkout-page__title">
        Scegli la tua tariffa
      </h1>

      {/* Layout 2-col */}
      <div className="checkout-grid">

        {/* ═══════════════════════════════════════════════════════════════
            COLONNA SX — filter-bar + lista room-card
            ═══════════════════════════════════════════════════════════════ */}
        <div className="checkout-form-col">

          {/* Filter bar (overflow-x scroll mobile) */}
          <div className="s1-filter-bar" role="toolbar" aria-label="Filtri">
            <button type="button" className="s1-filter-btn">
              <i className="bi bi-sliders" aria-hidden="true" /> Filtri
            </button>
            <button type="button" className="s1-filter-chip">
              Piscina
              <span className="s1-filter-chip__remove" aria-label="Rimuovi filtro Piscina">×</span>
            </button>
            <button type="button" className="s1-filter-chip">
              Vista mare
              <span className="s1-filter-chip__remove" aria-label="Rimuovi filtro Vista mare">×</span>
            </button>
            <button type="button" className="s1-filter-chip">
              4+ camere
              <span className="s1-filter-chip__remove" aria-label="Rimuovi filtro 4+ camere">×</span>
            </button>
          </div>

          {/* ROOM CARD #1 — Pellini 3 */}
          <article className="s1-room-card">
            <div className="s1-room-card__photo">
              <div className="s1-room-card__photo-placeholder">
                [Pellini 3 — 200×160]
              </div>
            </div>
            <div className="s1-room-card__body">
              <h2 className="s1-room-card__name">Pellini 3 — 180 m²</h2>
              <ul className="s1-room-card__meta-chips">
                <li><i className="bi bi-house-door" aria-hidden="true" /> Appartamento</li>
                <li><i className="bi bi-people" aria-hidden="true" /> 12 ospiti</li>
                <li><i className="bi bi-door-open" aria-hidden="true" /> 4 camere</li>
                <li><i className="bi bi-water" aria-hidden="true" /> 200m mare</li>
              </ul>

              <div className="s1-room-card__banner s1-room-card__banner--success">
                <i className="bi bi-check2-circle" aria-hidden="true" />
                <span>Cancellazione gratuita fino a 60 giorni dall&apos;arrivo</span>
              </div>
              <div className="s1-room-card__banner s1-room-card__banner--info">
                <i className="bi bi-lightning-charge" aria-hidden="true" />
                <span>Consumi energetici reali, addebitati dopo il soggiorno</span>
              </div>
              <div className="s1-room-card__banner s1-room-card__banner--warning">
                <i className="bi bi-shield-exclamation" aria-hidden="true" />
                <span>Deposito cauzionale €300 — Carta di Credito al check-in</span>
              </div>

              <div className="s1-offers-section">
                <p className="s1-offers-label">Tariffe disponibili</p>

                <label className="s1-offer-option is-selected">
                  <span className="s1-offer-option__radio" aria-hidden="true" />
                  <span className="s1-offer-option__label">Non rimborsabile</span>
                  <span className="s1-offer-option__price">79 €/notte</span>
                </label>

                <label className="s1-offer-option">
                  <span className="s1-offer-option__radio" aria-hidden="true" />
                  <span className="s1-offer-option__label">Parzialmente rimborsabile</span>
                  <span className="s1-offer-option__price">87 €/notte</span>
                </label>

                <label className="s1-offer-option">
                  <span className="s1-offer-option__radio" aria-hidden="true" />
                  <span className="s1-offer-option__label">Flessibile (60 gg)</span>
                  <span className="s1-offer-option__price">99 €/notte</span>
                </label>
              </div>
            </div>
          </article>

          {/* ROOM CARD #2 — Casa Mare */}
          <article className="s1-room-card">
            <div className="s1-room-card__photo">
              <div className="s1-room-card__photo-placeholder">
                [Casa Mare — 200×160]
              </div>
            </div>
            <div className="s1-room-card__body">
              <h2 className="s1-room-card__name">Casa Mare — 95 m²</h2>
              <ul className="s1-room-card__meta-chips">
                <li><i className="bi bi-house-door" aria-hidden="true" /> Appartamento</li>
                <li><i className="bi bi-people" aria-hidden="true" /> 6 ospiti</li>
                <li><i className="bi bi-door-open" aria-hidden="true" /> 2 camere</li>
                <li><i className="bi bi-water" aria-hidden="true" /> 50m mare</li>
              </ul>

              <div className="s1-room-card__banner s1-room-card__banner--info">
                <i className="bi bi-lightning-charge" aria-hidden="true" />
                <span>Consumi energetici reali, addebitati dopo il soggiorno</span>
              </div>

              <div className="s1-offers-section">
                <p className="s1-offers-label">Tariffe disponibili</p>

                <label className="s1-offer-option">
                  <span className="s1-offer-option__radio" aria-hidden="true" />
                  <span className="s1-offer-option__label">Non rimborsabile</span>
                  <span className="s1-offer-option__price">62 €/notte</span>
                </label>

                <label className="s1-offer-option">
                  <span className="s1-offer-option__radio" aria-hidden="true" />
                  <span className="s1-offer-option__label">Parzialmente rimborsabile</span>
                  <span className="s1-offer-option__price">71 €/notte</span>
                </label>
              </div>
            </div>
          </article>

        </div>

        {/* ═══════════════════════════════════════════════════════════════
            COLONNA DX — summary sticky (CTA "Continua")
            ═══════════════════════════════════════════════════════════════ */}
        <aside className="checkout-summary-col">
          <div className="checkout-summary">

            {/* Hero foto */}
            <div className="checkout-summary__hero">
              <div className="checkout-summary__hero-placeholder">
                [foto alloggio 332×160]
              </div>
            </div>

            {/* Titolo + caratteristiche */}
            <h2 className="checkout-summary__title">Pellini 3 — 180 m²</h2>
            <ul className="checkout-summary__features">
              <li><i className="bi bi-house-door" aria-hidden="true" /> Appartamento</li>
              <li><i className="bi bi-people" aria-hidden="true" /> 12 ospiti</li>
              <li><i className="bi bi-door-open" aria-hidden="true" /> 4 camere</li>
              <li><i className="bi bi-droplet-half" aria-hidden="true" /> 3 bagni</li>
              <li><i className="bi bi-water" aria-hidden="true" /> Piscina condivisa</li>
            </ul>

            <hr className="checkout-summary__divider" />

            {/* Date + Modifica */}
            <div className="checkout-summary__data-row">
              <div className="checkout-summary__data-cell">
                <p className="checkout-summary__data-label">Date</p>
                <p className="checkout-summary__data-value">04 — 08 mag 2026 · 4 notti</p>
              </div>
              <button type="button" className="checkout-modify-btn">Modifica</button>
            </div>

            {/* Ospiti + Modifica */}
            <div className="checkout-summary__data-row">
              <div className="checkout-summary__data-cell">
                <p className="checkout-summary__data-label">Ospiti</p>
                <p className="checkout-summary__data-value">1 adulto</p>
              </div>
              <button type="button" className="checkout-modify-btn">Modifica</button>
            </div>

            <hr className="checkout-summary__divider" />

            {/* Dettagli prezzo (per la tariffa selezionata) */}
            <h3 className="checkout-summary__data-label checkout-summary__price-title">Dettagli del prezzo</h3>

            <div className="checkout-summary__price-row">
              <span>4 notti × 79,00 €</span>
              <span>316,00 €</span>
            </div>
            <div className="checkout-summary__price-row">
              <span>Imposta di soggiorno</span>
              <span>38,00 €</span>
            </div>

            {/* Totale */}
            <div className="checkout-summary__total">
              <span className="checkout-summary__total-label">Totale EUR</span>
              <span className="checkout-summary__total-value">354,00 €</span>
            </div>

            <button type="button" className="checkout-summary__breakdown-link">
              Riepilogo dei costi
            </button>

            {/* CTA solo desktop (mobile usa sticky bottom) */}
            <button type="button" className="btn btn--primary checkout-summary__cta-desktop">
              Continua
            </button>

          </div>
        </aside>

      </div>

      {/* CTA mobile sticky bottom (visibile solo <1024) */}
      <div className="checkout-cta-mobile-sticky">
        <button type="button" className="btn btn--primary">
          Continua · 354,00 €
        </button>
      </div>

    </main>
  );
}
