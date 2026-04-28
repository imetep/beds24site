/**
 * MOCK STATICO — /paga-mock-v2
 *
 * Scopo: discussione preliminare del nuovo flow checkout 2-col Airbnb-style
 * (wizardstep1 + wizardstep2 unificato), riferimento mockup utente:
 *   docs/ux/mio desiderio.xlsx
 *   docs/ux/airbnb-checkout-analysis.xlsx
 *
 * Layout:
 *   - desktop ≥1024: form 540 sx + summary 340 dx STICKY top:32 (gap 105, max-width 985)
 *   - tablet 768-1024: stesso 2-col, container fluido
 *   - mobile <1024: stacked, summary IN ALTO, form sotto, CTA sticky bottom
 *
 * Logica: ZERO. Tutti i dati hardcoded (Pellini 3, 4 notti, €389.48).
 * I bottoni Modifica / Riepilogo costi non aprono nulla.
 *
 * Da rimuovere quando la decisione UX è ratificata e i pattern migrano in
 * components/wizard/WizardStep1.tsx + WizardStep2.tsx unificato.
 */
export default function PagaMockV2Page() {
  return (
    <main className="checkout-page">

      {/* Titolo principale */}
      <h1 className="section-title-main checkout-page__title">
        Conferma e paga
      </h1>

      {/* Layout 2-col */}
      <div className="checkout-grid">

        {/* ═══════════════════════════════════════════════════════════════
            COLONNA SX — form (3 cards: Pagamento / Dati ospite / Upsell)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="checkout-form-col">

          {/* CARD 1 — Metodo di pagamento */}
          <section className="checkout-card" aria-labelledby="card-pay-title">
            <header className="checkout-card__header">
              <h2 id="card-pay-title" className="checkout-card__title">Metodo di pagamento</h2>
              <button type="button" className="checkout-modify-btn">Modifica</button>
            </header>

            <div className="checkout-pay-current">
              <i className="bi bi-credit-card-2-front checkout-pay-current__icon" aria-hidden="true" />
              <span className="checkout-pay-current__brand">VISA</span>
              <span>•••• 4548</span>
            </div>

            <p className="checkout-pay-brands-row">
              VISA · MASTERCARD · AMEX · PAYPAL · STRIPE
            </p>
          </section>

          {/* CARD 2 — Dati ospite */}
          <section className="checkout-card" aria-labelledby="card-guest-title">
            <header className="checkout-card__header">
              <h2 id="card-guest-title" className="checkout-card__title">Dati ospite</h2>
            </header>
            <p className="checkout-card__subtitle checkout-card__subtitle--lead">
              I dati che inserisci sono usati per la conferma di prenotazione e il check-in.
            </p>

            <div className="checkout-guest-grid">
              <div className="ui-field-wrapper">
                <label className="ui-field-label" htmlFor="mock-nome">Nome</label>
                <input id="mock-nome" type="text" className="ui-field-input" placeholder="Mario" autoComplete="given-name" />
              </div>
              <div className="ui-field-wrapper">
                <label className="ui-field-label" htmlFor="mock-cognome">Cognome</label>
                <input id="mock-cognome" type="text" className="ui-field-input" placeholder="Rossi" autoComplete="family-name" />
              </div>
              <div className="ui-field-wrapper">
                <label className="ui-field-label" htmlFor="mock-email">Email</label>
                <input id="mock-email" type="email" className="ui-field-input" placeholder="mario@esempio.it" autoComplete="email" />
              </div>
              <div className="ui-field-wrapper">
                <label className="ui-field-label" htmlFor="mock-tel">Telefono</label>
                <input id="mock-tel" type="tel" className="ui-field-input" placeholder="+39 333 1234567" autoComplete="tel" />
              </div>
            </div>

            <div className="ui-field-wrapper checkout-card__textarea-wrap">
              <label className="ui-field-label" htmlFor="mock-richieste">Richieste particolari (opzionale)</label>
              <textarea id="mock-richieste" className="ui-field-input ui-field-textarea" placeholder='Esempio: "Arriviamo tardi, possibile late check-in?"' rows={3} />
            </div>
          </section>

          {/* CARD 3 — Upsell opzionali */}
          <section className="checkout-card" aria-labelledby="card-upsell-title">
            <header className="checkout-card__header">
              <h2 id="card-upsell-title" className="checkout-card__title">Servizi opzionali</h2>
            </header>
            <p className="checkout-card__subtitle checkout-card__subtitle--lead">
              Aggiungi ora ed evita richieste al check-in.
            </p>

            <ul className="checkout-upsell-list">
              <li className="checkout-upsell-item">
                <div className="checkout-upsell-item__text">
                  <h3 className="checkout-upsell-item__title">
                    <i className="bi bi-stars" aria-hidden="true" /> Pulizia premium
                  </h3>
                  <p className="checkout-upsell-item__sub">Pulizia approfondita pre-arrivo (cambio biancheria + sanificazione bagni)</p>
                </div>
                <span className="checkout-upsell-item__price">+ 25,00 €</span>
              </li>

              <li className="checkout-upsell-item">
                <div className="checkout-upsell-item__text">
                  <h3 className="checkout-upsell-item__title">
                    <i className="bi bi-clock-history" aria-hidden="true" /> Late check-out
                  </h3>
                  <p className="checkout-upsell-item__sub">Resta fino alle 14:00 nel giorno di partenza</p>
                </div>
                <span className="checkout-upsell-item__price">+ 15,00 €</span>
              </li>

              <li className="checkout-upsell-item is-selected">
                <div className="checkout-upsell-item__text">
                  <h3 className="checkout-upsell-item__title">
                    <i className="bi bi-p-square" aria-hidden="true" /> Parcheggio dedicato
                  </h3>
                  <p className="checkout-upsell-item__sub">1 posto auto riservato in struttura per tutto il soggiorno</p>
                </div>
                <span className="checkout-upsell-item__price">+ 20,00 €</span>
              </li>
            </ul>
          </section>

          {/* Disclaimer (terms accept) */}
          <p className="checkout-disclaimer">
            Cliccando su <strong>Conferma prenotazione</strong> accetto i <button type="button">termini di prenotazione</button> e la <button type="button">privacy policy</button>.
          </p>

        </div>

        {/* ═══════════════════════════════════════════════════════════════
            COLONNA DX — summary sticky
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

            {/* Dettagli prezzo */}
            <h3 className="checkout-summary__data-label checkout-summary__price-title">Dettagli del prezzo</h3>

            <div className="checkout-summary__price-row">
              <span>4 notti × 87,87 €</span>
              <span>351,48 €</span>
            </div>
            <div className="checkout-summary__price-row checkout-summary__price-row--strike">
              <span>Prezzo lista</span>
              <span>661,28 €</span>
            </div>
            <div className="checkout-summary__price-row">
              <span>Imposta di soggiorno</span>
              <span>38,00 €</span>
            </div>

            {/* Totale */}
            <div className="checkout-summary__total">
              <span className="checkout-summary__total-label">Totale EUR</span>
              <span className="checkout-summary__total-value">389,48 €</span>
            </div>

            <button type="button" className="checkout-summary__breakdown-link">
              Riepilogo dei costi
            </button>

            {/* CTA solo desktop (mobile usa sticky bottom) */}
            <button type="button" className="btn btn--primary checkout-summary__cta-desktop">
              Conferma prenotazione
            </button>

          </div>
        </aside>

      </div>

      {/* CTA mobile sticky bottom (visibile solo <1024) */}
      <div className="checkout-cta-mobile-sticky">
        <button type="button" className="btn btn--primary">
          Conferma prenotazione · 389,48 €
        </button>
      </div>

    </main>
  );
}
