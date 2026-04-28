/**
 * MOCK STATICO — /wizardstep1-mock-v2
 *
 * Scopo: discussione preliminare del nuovo wizardstep1 (lista risultati)
 * 2-col Airbnb-style. Riferimento: docs/ux/mio desiderio.xlsx (foglio
 * wizardstep1) — banner cancellazione/consumi/deposito SPOSTATI in
 * sidebar (NON dentro la room-card). Tariffe usano .step1-offer-option
 * esistente (stesso aspetto del WizardStep1.tsx attuale).
 *
 * Layout:
 *   - desktop ≥1024: form 540 sx (filter-bar + lista room-card 3-col interna) +
 *     summary 340 dx STICKY top:32 (con banner alloggio + Date/Ospiti + prezzo)
 *   - mobile <1024: stacked, summary IN ALTO, lista sotto, CTA sticky bottom
 *
 * Riusa classi CSS esistenti: .step1-room-card, .step1-offer-option,
 * .step1-filter-*, .banner, .checkout-* (layout esterno + summary).
 *
 * Logica: ZERO. Da rimuovere quando i pattern migrano in WizardStep1.tsx.
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
            COLONNA SX — filter-bar + lista room-card (riusa .step1-*)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="checkout-form-col">

          {/* Filter bar (overflow-x scroll mobile) — riusa .step1-filter-* */}
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
                <button type="button" className="step1-offer-option is-selected">
                  <div className="step1-offer-option__info">
                    <div className="step1-offer-option__name-row">
                      <span className="step1-offer-option__name">Non rimborsabile</span>
                      <span className="step1-offer-option__selected-tag" aria-hidden="true">
                        <i className="bi bi-check-lg" />
                      </span>
                    </div>
                    <p className="step1-offer-option__desc">Cancellazione non rimborsabile</p>
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
                    <p className="step1-offer-option__desc">50% trattenuto se cancelli</p>
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
                    <p className="step1-offer-option__desc">Cancellazione gratuita 60 giorni</p>
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
                    <p className="step1-offer-option__desc">Cancellazione non rimborsabile</p>
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
                    <p className="step1-offer-option__desc">50% trattenuto se cancelli</p>
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
            COLONNA DX — sidebar sticky (foto + caratteristiche + BANNER + Date/Ospiti + prezzo)
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
              <li><i className="bi bi-tree" aria-hidden="true" /> Giardino</li>
            </ul>

            {/* BANNER alloggio (qui, NON dentro room-card) — riusa .banner.banner--* esistenti */}
            <div className="banner banner--success">
              <i className="bi bi-check2-circle" aria-hidden="true" />
              <span>Cancellazione gratuita fino a 60 giorni dall&apos;arrivo</span>
            </div>
            <div className="banner banner--info">
              <i className="bi bi-lightning-charge" aria-hidden="true" />
              <span>Consumi energetici reali, addebitati dopo il soggiorno</span>
            </div>
            <div className="banner banner--warning">
              <i className="bi bi-shield-exclamation" aria-hidden="true" />
              <span>Deposito cauzionale €300 — Carta di Credito al check-in</span>
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
