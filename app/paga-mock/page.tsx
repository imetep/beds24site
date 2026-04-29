/**
 * MOCK temporaneo — ricostruzione del mockup paga.png (Photoshop utente).
 * Path: /paga-mock
 *
 * Scopo: discussione preliminare di design system per /paga prima di
 * applicare cambi a PagaClient.tsx. Riusa SOLO classi del design system
 * attuale (wizardstep2 + BookingSidebar).
 *
 * Dati hardcoded a quelli del mockup (3 notti × 79€, 12 ospiti, Pink Lady).
 *
 * Da rimuovere quando la decisione è ratificata.
 */
export default function PagaMockPage() {
  return (
    <main className="page-container page-top pb-5">

      {/* Stepper */}
      <div className="ui-stepper">
        <ol className="ui-stepper-list">
          <li className="ui-stepper-item is-done">
            <div className="ui-stepper-inner">
              <span className="ui-stepper-dot"><i className="bi bi-check" aria-hidden="true" /></span>
              <span className="ui-stepper-label">Scegli</span>
            </div>
          </li>
          <li className="ui-stepper-item is-done">
            <div className="ui-stepper-inner">
              <span className="ui-stepper-dot"><i className="bi bi-check" aria-hidden="true" /></span>
              <span className="ui-stepper-label">Dati ospite</span>
            </div>
          </li>
          <li className="ui-stepper-item is-current">
            <div className="ui-stepper-inner">
              <span className="ui-stepper-dot">3</span>
              <span className="ui-stepper-label">Paga</span>
            </div>
          </li>
        </ol>
      </div>

      {/* Titolo */}
      <h2 className="section-title-main">Conferma e paga</h2>

      {/* Layout 2-col wizardstep2: main max 680 + sidebar 380 + gap 32 */}
      <div className="wizard-step2__layout">

        {/* Colonna SX (action) */}
        <div className="wizard-step2__main">

          {/* Box 1 — Come vuoi pagare? */}
          <div className="card-info">
            <p className="paga-mock__numbered-title">
              <span className="paga-mock__num-badge">1</span>
              Come vuoi pagare?
            </p>

            {/* Card radio selected */}
            <label className="card-option is-selected paga-mock__pay-option">
              <span className="paga-mock__radio is-checked" aria-hidden="true" />
              <span className="paga-mock__pay-text">
                <span className="paga-mock__pay-title">Salva carta, nessun addebito oggi</span>
                <span className="paga-mock__pay-sub">addebito alla conferma secondo la policy</span>
              </span>
            </label>

            {/* Card radio not selected */}
            <label className="card-option paga-mock__pay-option">
              <span className="paga-mock__radio" aria-hidden="true" />
              <span className="paga-mock__pay-text">
                <span className="paga-mock__pay-title">
                  Paga in 3 rate con PayPal{' '}
                  <span className="paga-mock__paypal-badge">
                    <i className="bi bi-paypal" aria-hidden="true" /> PayPal
                  </span>
                </span>
                <span className="paga-mock__pay-sub">Con PayPal il tuo conto viene solo salvato — nessun addebito immediato.</span>
              </span>
            </label>

            {/* Banner verde info Stripe */}
            <div className="banner banner--success banner--with-icon" style={{ marginTop: 'var(--space-md)' }}>
              <i className="bi bi-credit-card-fill" aria-hidden="true" />
              <p className="banner__text">Con Stripe la carta viene solo salvata — nessun addebito immediato.</p>
            </div>
          </div>

          {/* Box 2 — I tuoi dati */}
          <div className="card-info">
            <p className="paga-mock__numbered-title">
              <span className="paga-mock__num-badge">2</span>
              I tuoi dati
            </p>

            <div className="paga-mock__form-grid">
              <div className="ui-field-wrapper">
                <label className="ui-field-label">Nome *</label>
                <input className="ui-field-input" type="text" />
              </div>
              <div className="ui-field-wrapper">
                <label className="ui-field-label">Cognome *</label>
                <input className="ui-field-input" type="text" />
              </div>
            </div>

            <div className="ui-field-wrapper">
              <label className="ui-field-label">Email *</label>
              <input className="ui-field-input" type="email" />
            </div>

            <div className="paga-mock__form-grid">
              <div className="ui-field-wrapper">
                <label className="ui-field-label">Telefono</label>
                <input className="ui-field-input" type="tel" />
              </div>
              <div className="ui-field-wrapper">
                <label className="ui-field-label">Paese</label>
                <input className="ui-field-input" type="text" />
              </div>
            </div>

            <div className="ui-field-wrapper">
              <label className="ui-field-label">Ora di arrivo prevista</label>
              <input className="ui-field-input" type="time" />
            </div>

            <div className="ui-field-wrapper">
              <label className="ui-field-label">Richieste speciali</label>
              <textarea className="ui-field-input ui-field-textarea" rows={3} />
            </div>
          </div>

          {/* CTA disabled */}
          <button className="btn btn--primary" disabled style={{ width: '100%' }}>Continua</button>
          <p className="paga-mock__terms">Confermando accetti le <a href="#">condizioni generali</a></p>

          <a href="#" className="paga-mock__back-link">← Indietro</a>
        </div>

        {/* Colonna DX (sidebar = BookingSidebar replica) */}
        <aside className="wizard-step2__sidebar">
          <div className="booking-sidebar">

            {/* Foto */}
            <div className="booking-sidebar__hero">
              <img
                src="https://res.cloudinary.com/dsnlduczj/image/upload/c_fill,f_auto,h_400,q_auto,w_600/01_wkgmv3"
                alt="Pink Lady"
                className="booking-sidebar__hero-img"
                loading="lazy"
              />
            </div>

            <p className="section-title-secondary">Pink Lady</p>
            <p className="label-metadata">Appartamento · 180 mq · 12 ospiti</p>

            {/* Banner consumi energetici */}
            <div className="banner banner--info banner--with-icon">
              <i className="bi bi-lightning-fill" aria-hidden="true" />
              <div>
                <p className="banner__title">Consumi energetici</p>
                <p className="banner__text">I consumi energetici vengono conteggiati in base all&apos;utilizzo reale, tramite contatori presenti in ogni abitazione. Non si tratta di un costo aggiuntivo per guadagno, ma di una misura per evitare sprechi.</p>
              </div>
            </div>

            {/* Codice promozionale */}
            <hr className="divider-horizontal" />
            <p className="label-uppercase-muted">Codice promozionale</p>
            <div className="paga-mock__voucher-row">
              <input className="ui-field-input" type="text" placeholder="es. ESTATE2026" />
              <button className="btn btn--secondary" type="button">Applica</button>
            </div>

            {/* Date / Ospiti con Modifica */}
            <hr className="divider-horizontal" />
            <div className="booking-sidebar__data-row">
              <div className="booking-sidebar__data-cell">
                <p className="booking-sidebar__data-label">Date</p>
                <p className="booking-sidebar__data-value">15 mag 2026 – 18 mag 2026</p>
                <p className="booking-sidebar__data-hint">3 notti</p>
              </div>
              <button type="button" className="booking-sidebar__edit-btn">Modifica</button>
            </div>
            <div className="booking-sidebar__data-row">
              <div className="booking-sidebar__data-cell">
                <p className="booking-sidebar__data-label">Ospiti</p>
                <p className="booking-sidebar__data-value">2 adulti</p>
              </div>
              <button type="button" className="booking-sidebar__edit-btn">Modifica</button>
            </div>

            {/* Dettagli del prezzo */}
            <hr className="divider-horizontal" />
            <p className="label-uppercase-muted">Dettagli del prezzo</p>
            <div className="layout-row-between">
              <span>3 notti × 79 €</span>
              <span>236 €</span>
            </div>
            <div className="layout-row-between">
              <span>Imposta di soggiorno</span>
              <span>12 €</span>
            </div>
            <p className="hint-text">€2/pers/notte · max 10 notti · esenti under 12</p>

            {/* Servizi extra (opzionale) */}
            <hr className="divider-horizontal" />
            <p className="label-uppercase-muted">2. Servizi extra (opzionale)</p>
            <div className="paga-mock__extra-row">
              <span className="paga-mock__extra-icon" aria-hidden="true">
                <i className="bi bi-bag-fill" />
              </span>
              <div className="paga-mock__extra-info">
                <p className="paga-mock__extra-name">Lettino da campeggio con biancheria</p>
                <p className="paga-mock__extra-price">+40 € / unità</p>
              </div>
              <div className="paga-mock__extra-stepper">
                <button className="extras-stepper-btn extras-stepper-btn--minus" type="button" aria-label="Diminuisci">−</button>
                <span className="paga-mock__extra-qty">0</span>
                <button className="extras-stepper-btn extras-stepper-btn--plus is-active" type="button" aria-label="Aumenta">+</button>
              </div>
            </div>

            {/* Totale */}
            <div className="booking-sidebar__total">
              <span className="booking-sidebar__total-label">Totale</span>
              <span className="booking-sidebar__total-value">248 €</span>
            </div>

            {/* Cancellazione */}
            <hr className="divider-horizontal" />
            <p className="label-uppercase-muted">Cancellazione</p>
            <p className="hint-text">Flessibile 60 gg — Non paghi niente adesso · Cancellazione gratuita entro 60 giorni dall&apos;arrivo</p>

            {/* Banner deposito */}
            <div className="banner banner--warning banner--with-icon">
              <i className="bi bi-shield-lock-fill" aria-hidden="true" />
              <div>
                <p className="banner__title">Deposito cauzionale — €500</p>
                <p className="banner__text">Questo alloggio richiede un deposito cauzionale di €500. Sarà necessaria una Carta di Credito (no Debit Card) al momento del check-in.</p>
              </div>
            </div>

            {/* CIN footer */}
            <p className="booking-sidebar__footer">CIN IT059014B47RVOMN2D</p>

          </div>
        </aside>

      </div>
    </main>
  );
}
