/**
 * MOCK STATICO — /wizardstep1-mock-v2
 *
 * Riferimenti:
 *   - docs/ux/mio desiderio.xlsx (foglio wizardstep1) — mockup utente
 *   - docs/ux/airbnb-pattern-analysis.xlsx — pattern search results Airbnb
 *
 * Decisioni Airbnb-derived:
 *   - H1 location + count ("X residenze a Scauri") come Airbnb /s
 *   - "Flessibile 60gg" = TESTO INLINE GRIGIO (non banner colorato),
 *     pattern Airbnb /book "Questa prenotazione non è rimborsabile"
 *   - Tariffe = solo nome + prezzo (no descrizione sotto), pattern card Airbnb /s
 *   - Banner sidebar: solo Consumi (info) + Deposito (warning), specifici LivingApple
 *   - CTA blu --color-primary (no rosa Airbnb, memoria progetto)
 *
 * Layout:
 *   - desktop ≥1024: form 540 sx + summary 340 dx STICKY top:32 (gap 105, max 985)
 *   - mobile <1024: stacked, summary IN ALTO, lista sotto, CTA sticky bottom
 *
 * Logica: ZERO. Da rimuovere quando i pattern migrano in WizardStep1.tsx.
 */
export default function WizardStep1MockV2Page() {
  return (
    <main className="checkout-page">

      {/* H1 location + count (pattern Airbnb /s) */}
      <h1 className="section-title-main checkout-page__title">
        12 residenze a Scauri
      </h1>

      {/* Layout 2-col */}
      <div className="checkout-grid">

        {/* ═══════════════════════════════════════════════════════════════
            COLONNA SX — filter-bar + lista room-card (riusa .step1-*)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="checkout-form-col">

          {/* Filter bar */}
          <div className="step1-filter-bar" role="toolbar" aria-label="Filtri">
            <button type="button" className="step1-filter-btn">
              <i className="bi bi-sliders" aria-hidden="true" /> Filtri
            </button>
            <button type="button" className="step1-filter-chip">
              Piscina
              <span className="step1-filter-chip__x" aria-label="Rimuovi filtro">×</span>
            </button>
            <button type="button" className="step1-filter-chip">
              Vista mare
              <span className="step1-filter-chip__x" aria-label="Rimuovi filtro">×</span>
            </button>
            <button type="button" className="step1-filter-chip">
              4+ camere
              <span className="step1-filter-chip__x" aria-label="Rimuovi filtro">×</span>
            </button>
          </div>

          {/* ROOM CARD #1 — Pellini 3 (selected) */}
          <article className="step1-room-card is-selected">
            <div className="step1-room-card__row">
              <div className="step1-room-card__photo">
                <div className="step1-room-card__photo-placeholder">
                  <i className="bi bi-image" aria-hidden="true" />
                </div>
              </div>
              <div className="step1-room-card__details">
                <div className="step1-room-card__name">Pellini 3 — 180 m²</div>
                <div className="step1-room-card__meta-chips">
                  <span><i className="bi bi-house-door" aria-hidden="true" /> Appartamento</span>
                  <span><i className="bi bi-people" aria-hidden="true" /> 12 ospiti</span>
                  <span><i className="bi bi-door-open" aria-hidden="true" /> 4 camere</span>
                  <span><i className="bi bi-water" aria-hidden="true" /> 200m mare</span>
                </div>
              </div>
              <div className="step1-room-card__offers">
                {/* Tariffe: solo nome + prezzo (pattern Airbnb /s, niente descrizione) */}
                <button type="button" className="step1-offer-option is-selected">
                  <div className="step1-offer-option__info">
                    <div className="step1-offer-option__name-row">
                      <span className="step1-offer-option__name">Non rimborsabile</span>
                      <span className="step1-offer-option__selected-tag" aria-hidden="true">
                        <i className="bi bi-check-lg" />
                      </span>
                    </div>
                  </div>
                  <div className="step1-offer-option__price-col">
                    <div className="step1-offer-option__price">79 €</div>
                  </div>
                </button>

                <button type="button" className="step1-offer-option">
                  <div className="step1-offer-option__info">
                    <div className="step1-offer-option__name-row">
                      <span className="step1-offer-option__name">Parzialmente rimborsabile</span>
                    </div>
                  </div>
                  <div className="step1-offer-option__price-col">
                    <div className="step1-offer-option__price">87 €</div>
                  </div>
                </button>

                <button type="button" className="step1-offer-option">
                  <div className="step1-offer-option__info">
                    <div className="step1-offer-option__name-row">
                      <span className="step1-offer-option__name">Flessibile</span>
                    </div>
                  </div>
                  <div className="step1-offer-option__price-col">
                    <div className="step1-offer-option__price">99 €</div>
                  </div>
                </button>
              </div>
            </div>
          </article>

          {/* ROOM CARD #2 — Casa Mare */}
          <article className="step1-room-card">
            <div className="step1-room-card__row">
              <div className="step1-room-card__photo">
                <div className="step1-room-card__photo-placeholder">
                  <i className="bi bi-image" aria-hidden="true" />
                </div>
              </div>
              <div className="step1-room-card__details">
                <div className="step1-room-card__name">Casa Mare — 95 m²</div>
                <div className="step1-room-card__meta-chips">
                  <span><i className="bi bi-house-door" aria-hidden="true" /> Appartamento</span>
                  <span><i className="bi bi-people" aria-hidden="true" /> 6 ospiti</span>
                  <span><i className="bi bi-door-open" aria-hidden="true" /> 2 camere</span>
                  <span><i className="bi bi-water" aria-hidden="true" /> 50m mare</span>
                </div>
              </div>
              <div className="step1-room-card__offers">
                <button type="button" className="step1-offer-option">
                  <div className="step1-offer-option__info">
                    <div className="step1-offer-option__name-row">
                      <span className="step1-offer-option__name">Non rimborsabile</span>
                    </div>
                  </div>
                  <div className="step1-offer-option__price-col">
                    <div className="step1-offer-option__price">62 €</div>
                  </div>
                </button>

                <button type="button" className="step1-offer-option">
                  <div className="step1-offer-option__info">
                    <div className="step1-offer-option__name-row">
                      <span className="step1-offer-option__name">Parzialmente rimborsabile</span>
                    </div>
                  </div>
                  <div className="step1-offer-option__price-col">
                    <div className="step1-offer-option__price">71 €</div>
                  </div>
                </button>
              </div>
            </div>
          </article>

        </div>

        {/* ═══════════════════════════════════════════════════════════════
            COLONNA DX — sidebar sticky (foto + caratteristiche + flessibile inline + banner + Date/Ospiti + prezzo)
            ═══════════════════════════════════════════════════════════════ */}
        <aside className="checkout-summary-col">
          <div className="checkout-summary">

            {/* Hero foto */}
            <div className="checkout-summary__hero">
              <div className="checkout-summary__hero-placeholder">
                [foto alloggio 332×160]
              </div>
            </div>

            {/* Titolo casa */}
            <h2 className="checkout-summary__title">Pellini 3 — 180 m²</h2>

            {/* Label uppercase + features */}
            <p className="label-uppercase-muted">Caratteristiche</p>
            <ul className="checkout-summary__features">
              <li><i className="bi bi-people" aria-hidden="true" /> 12 ospiti</li>
              <li><i className="bi bi-door-open" aria-hidden="true" /> 4 camere</li>
              <li><i className="bi bi-droplet-half" aria-hidden="true" /> 3 bagni</li>
              <li><i className="bi bi-water" aria-hidden="true" /> Piscina condivisa</li>
              <li><i className="bi bi-tree" aria-hidden="true" /> Giardino</li>
            </ul>

            {/* Flessibile come TESTO INLINE GRIGIO (pattern Airbnb, no banner) */}
            <p className="checkout-summary__policy-text">
              Questa prenotazione è flessibile per 60 giorni
            </p>

            {/* Banner alloggio (specifici LivingApple) — solo Consumi + Deposito */}
            <div className="banner banner--info">
              <i className="bi bi-lightning-charge" aria-hidden="true" />
              <span>Consumi energetici</span>
            </div>
            <div className="banner banner--warning">
              <i className="bi bi-shield-exclamation" aria-hidden="true" />
              <span>Deposito cauzionale — € (variabile)</span>
            </div>

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

            {/* Dettagli prezzo */}
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

      {/* CTA mobile sticky bottom */}
      <div className="checkout-cta-mobile-sticky">
        <button type="button" className="btn btn--primary">
          Continua · 354,00 €
        </button>
      </div>

    </main>
  );
}
