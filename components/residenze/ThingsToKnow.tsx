'use client';
import { CIN, CIR } from '@/config/properties';
import { useState } from 'react';

interface Props {
  locale: string;
  checkInStart: string;
  checkInEnd: string;
  checkOutEnd: string;
  securityDeposit: number;
}

const LABELS: Record<string, Record<string, string>> = {
  it: {
    title: 'Info e dettagli importanti',
    checkInTitle: 'Check-in e Check-out',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    depositTitle: 'Deposito cauzionale',
    depositText: 'Richiesto al check-in con Carta di Credito (no Debit Card). Verrà rimborsato integralmente alla partenza, salvo danni.',
    depositLink: 'Come funziona il deposito →',
    depositHref: '/it/deposito',
    energyTitle: 'Consumi energetici',
    energyText: 'I consumi energetici vengono conteggiati in base all\'utilizzo reale, tramite contatori presenti in ogni abitazione. Non si tratta di un costo aggiuntivo per guadagno, ma di una misura per evitare sprechi.',
    energyLink: 'Tariffe e consigli →',
    energyHref: '/it/utenze',
    taxTitle: 'Imposta di soggiorno',
    taxText: 'Nel Comune di Minturno, in cui si trova la struttura, è prevista un\'imposta di soggiorno di €2,00 a persona al giorno, valida solo per i primi 10 giorni di soggiorno e solo per gli ospiti con più di 12 anni di età.',
    rulesTitle: 'Regole della casa',
    noPets: '🐾 Animali non ammessi',
    noSmoking: '🚭 Vietato fumare',
    within: 'entro le',
  },
  en: {
    title: 'Info & important details',
    checkInTitle: 'Check-in & Check-out',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    depositTitle: 'Security deposit',
    depositText: 'Required at check-in by Credit Card (no Debit Card). Fully refunded at departure, subject to no damage.',
    depositLink: 'How the deposit works →',
    depositHref: '/en/deposito',
    energyTitle: 'Energy consumption',
    energyText: 'Energy consumption is calculated based on actual usage, measured through meters installed in each accommodation. This is not an additional charge for profit, but a measure to prevent energy waste.',
    energyLink: 'Rates and tips →',
    energyHref: '/en/utilities',
    taxTitle: 'Tourist tax',
    taxText: 'A tourist tax of €2.00 per person per day applies, valid only for the first 10 nights and only for guests over 12 years of age.',
    rulesTitle: 'House rules',
    noPets: '🐾 No pets allowed',
    noSmoking: '🚭 No smoking',
    within: 'by',
  },
  de: {
    title: 'Infos & wichtige Details',
    checkInTitle: 'Check-in & Check-out',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    depositTitle: 'Kaution',
    depositText: 'Beim Check-in per Kreditkarte (keine Debitkarte). Wird bei Abreise vollständig zurückerstattet, sofern keine Schäden vorliegen.',
    depositLink: 'So funktioniert die Kaution →',
    depositHref: '/de/deposito',
    energyTitle: 'Energieverbrauch',
    energyText: 'Der Energieverbrauch wird auf Grundlage des tatsächlichen Verbrauchs berechnet und über in jeder Unterkunft installierte Zähler erfasst. Dabei handelt es sich nicht um eine zusätzliche Gebühr zur Gewinnerzielung, sondern um eine Maßnahme zur Vermeidung von Energieverschwendung.',
    energyLink: 'Tarife und Tipps →',
    energyHref: '/de/energie',
    taxTitle: 'Kurtaxe',
    taxText: 'Es wird eine Kurtaxe von €2,00 pro Person und Nacht erhoben, gültig nur für die ersten 10 Nächte und nur für Gäste über 12 Jahre.',
    rulesTitle: 'Hausregeln',
    noPets: '🐾 Keine Haustiere',
    noSmoking: '🚭 Nichtraucher',
    within: 'bis',
  },
  pl: {
    title: 'Informacje i ważne szczegóły',
    checkInTitle: 'Check-in i Check-out',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    depositTitle: 'Kaucja',
    depositText: 'Wymagana przy zameldowaniu kartą kredytową (bez kart debetowych). Zwracana w całości przy wyjeździe, o ile nie wystąpią szkody.',
    depositLink: 'Jak działa kaucja →',
    depositHref: '/pl/deposito',
    energyTitle: 'Zużycie energii',
    energyText: 'Zużycie energii jest rozliczane na podstawie rzeczywistego wykorzystania, mierzonego przez liczniki zainstalowane w każdym obiekcie. Nie jest to dodatkowa opłata w celu osiągnięcia zysku, lecz środek mający na celu zapobieganie marnotrawstwu energii.',
    energyLink: 'Taryfy i wskazówki →',
    energyHref: '/pl/media',
    taxTitle: 'Opłata turystyczna',
    taxText: 'Obowiązuje opłata turystyczna w wysokości €2,00 za osobę za dobę, tylko przez pierwsze 10 nocy i tylko dla gości powyżej 12 roku życia.',
    rulesTitle: 'Zasady domu',
    noPets: '🐾 Zakaz zwierząt',
    noSmoking: '🚭 Zakaz palenia',
    within: 'do',
  },
};

export default function ThingsToKnow({ locale, checkInStart, checkInEnd, checkOutEnd, securityDeposit }: Props) {
  const [open, setOpen] = useState(false);
  const t = LABELS[locale] ?? LABELS.it;

  return (
    <div className="card overflow-hidden mb-4" style={{ borderRadius: 16 }}>

      {/* Header colored #1E73BE — UX 3.7 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="d-flex justify-content-between align-items-center w-100 fw-bold px-3 py-3 border-0 text-white"
        style={{ background: 'var(--color-primary)', fontSize: 17 }}
        aria-expanded={open}
      >
        <span>
          <i className="bi bi-info-circle-fill me-2"></i>{t.title}
        </span>
        <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
      </button>

      {/* Contenuto espandibile */}
      {open && (
        <div className="p-3 border-top">

          {/* Check-in/out */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2"><i className="bi bi-clock me-1"></i> {t.checkInTitle}</div>
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">{t.checkIn}</span>
              <span className="fw-semibold">{checkInStart} – {checkInEnd}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span className="text-muted">{t.checkOut}</span>
              <span className="fw-semibold">{t.within} {checkOutEnd}</span>
            </div>
          </div>

          {/* Deposito */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2">
              <i className="bi bi-shield-lock-fill me-1"></i> {t.depositTitle}: €{securityDeposit}
            </div>
            <p className="small text-secondary mb-1" style={{ lineHeight: 1.6 }}>{t.depositText}</p>
            <a href={t.depositHref} target="_blank" rel="noopener noreferrer" className="small text-primary text-decoration-none">{t.depositLink}</a>
          </div>

          {/* Consumi */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2">
              <i className="bi bi-lightning-fill me-1"></i> {t.energyTitle}
            </div>
            <p className="small text-secondary mb-1" style={{ lineHeight: 1.6 }}>{t.energyText}</p>
            <a href={t.energyHref} target="_blank" rel="noopener noreferrer" className="small text-primary text-decoration-none">{t.energyLink}</a>
          </div>

          {/* Imposta di soggiorno */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2">
              <i className="bi bi-bank2 me-1"></i> {t.taxTitle}
            </div>
            <p className="small text-secondary mb-0" style={{ lineHeight: 1.6 }}>{t.taxText}</p>
          </div>

          {/* Regole */}
          <div className="pb-3 mb-3 border-bottom">
            <div className="fw-bold mb-2">
              <i className="bi bi-card-list me-1"></i> {t.rulesTitle}
            </div>
            <div className="small text-secondary">{t.noPets}</div>
            <div className="small text-secondary">{t.noSmoking}</div>
          </div>

          {/* CIN / CIR */}
          <div className="bg-light rounded-3 px-3 py-2 small fw-semibold text-secondary">
            CIN {CIN} &nbsp;·&nbsp; CIR {CIR}
          </div>

        </div>
      )}
    </div>
  );
}
