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
    energyTitle: 'Consumi energetici',
    energyText: 'I consumi energetici vengono conteggiati in base all\'utilizzo reale, tramite contatori presenti in ogni abitazione. Non si tratta di un costo aggiuntivo per guadagno, ma di una misura per evitare sprechi.',
    taxTitle: 'Imposta di soggiorno',
    taxText: 'Nel Comune in cui si trova la struttura è prevista un\'imposta di soggiorno di €2,00 a persona al giorno, valida solo per i primi 10 giorni di soggiorno e solo per gli ospiti con più di 12 anni di età.',
    rulesTitle: 'Regole della casa',
    noPets: '🐾 Animali non ammessi',
    noSmoking: '🚭 Vietato fumare',
    showMore: 'Mostra tutto ▼',
    showLess: 'Chiudi ▲',
  },
  en: {
    title: 'Info & important details',
    checkInTitle: 'Check-in & Check-out',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    depositTitle: 'Security deposit',
    depositText: 'Required at check-in by Credit Card (no Debit Card). Fully refunded at departure, subject to no damage.',
    energyTitle: 'Energy consumption',
    energyText: 'Energy consumption is calculated based on actual usage, measured through meters installed in each accommodation. This is not an additional charge for profit, but a measure to prevent energy waste.',
    taxTitle: 'Tourist tax',
    taxText: 'A tourist tax of €2.00 per person per day applies, valid only for the first 10 nights and only for guests over 12 years of age.',
    rulesTitle: 'House rules',
    noPets: '🐾 No pets allowed',
    noSmoking: '🚭 No smoking',
    showMore: 'Show all ▼',
    showLess: 'Close ▲',
  },
  de: {
    title: 'Infos & wichtige Details',
    checkInTitle: 'Check-in & Check-out',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    depositTitle: 'Kaution',
    depositText: 'Beim Check-in per Kreditkarte (keine Debitkarte). Wird bei Abreise vollständig zurückerstattet, sofern keine Schäden vorliegen.',
    energyTitle: 'Energieverbrauch',
    energyText: 'Der Energieverbrauch wird auf Grundlage des tatsächlichen Verbrauchs berechnet und über in jeder Unterkunft installierte Zähler erfasst. Dabei handelt es sich nicht um eine zusätzliche Gebühr zur Gewinnerzielung, sondern um eine Maßnahme zur Vermeidung von Energieverschwendung.',
    taxTitle: 'Kurtaxe',
    taxText: 'Es wird eine Kurtaxe von €2,00 pro Person und Nacht erhoben, gültig nur für die ersten 10 Nächte und nur für Gäste über 12 Jahre.',
    rulesTitle: 'Hausregeln',
    noPets: '🐾 Keine Haustiere',
    noSmoking: '🚭 Nichtraucher',
    showMore: 'Alles anzeigen ▼',
    showLess: 'Schließen ▲',
  },
  pl: {
    title: 'Informacje i ważne szczegóły',
    checkInTitle: 'Check-in i Check-out',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    depositTitle: 'Kaucja',
    depositText: 'Wymagana przy zameldowaniu kartą kredytową (bez kart debetowych). Zwracana w całości przy wyjeździe, o ile nie wystąpią szkody.',
    energyTitle: 'Zużycie energii',
    energyText: 'Zużycie energii jest rozliczane na podstawie rzeczywistego wykorzystania, mierzonego przez liczniki zainstalowane w każdym obiekcie. Nie jest to dodatkowa opłata w celu osiągnięcia zysku, lecz środek mający na celu zapobieganie marnotrawstwu energii.',
    taxTitle: 'Opłata turystyczna',
    taxText: 'Obowiązuje opłata turystyczna w wysokości €2,00 za osobę za dobę, tylko przez pierwsze 10 nocy i tylko dla gości powyżej 12 roku życia.',
    rulesTitle: 'Zasady domu',
    noPets: '🐾 Zakaz zwierząt',
    noSmoking: '🚭 Zakaz palenia',
    showMore: 'Pokaż wszystko ▼',
    showLess: 'Zamknij ▲',
  },
};

export default function ThingsToKnow({ locale, checkInStart, checkInEnd, checkOutEnd, securityDeposit }: Props) {
  const [open, setOpen] = useState(false);
  const t = LABELS[locale] ?? LABELS.it;

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 32,
    }}>

      {/* Header — sempre visibile */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 20px',
          background: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 17,
          fontWeight: 700,
          color: '#222',
        }}
      >
        <span>ℹ️ {t.title}</span>
        <span style={{ fontSize: 13, color: '#1E73BE', fontWeight: 600 }}>
          {open ? t.showLess : t.showMore}
        </span>
      </button>

      {/* Contenuto espandibile */}
      {open && (
        <div style={{ borderTop: '1px solid #f0f0f0', padding: '20px' }}>

          {/* Check-in/out */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🕐 {t.checkInTitle}</div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t.checkIn}</span>
              <span style={valueStyle}>{checkInStart} – {checkInEnd}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t.checkOut}</span>
              <span style={valueStyle}>entro le {checkOutEnd}</span>
            </div>
          </div>

          {/* Deposito */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>💳 {t.depositTitle}: €{securityDeposit}</div>
            <p style={textStyle}>{t.depositText}</p>
          </div>

          {/* Consumi */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>⚡ {t.energyTitle}</div>
            <p style={textStyle}>{t.energyText}</p>
          </div>

          {/* Imposta di soggiorno */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🏛️ {t.taxTitle}</div>
            <p style={textStyle}>{t.taxText}</p>
          </div>

          {/* Regole */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>📋 {t.rulesTitle}</div>
            <div style={{ fontSize: 14, color: '#444', marginTop: 6 }}>{t.noPets}</div>
            <div style={{ fontSize: 14, color: '#444', marginTop: 4 }}>{t.noSmoking}</div>
          </div>

          {/* CIN / CIR */}
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: '#555',
            background: '#f5f5f5',
            borderRadius: 8,
            padding: '10px 14px',
            letterSpacing: '0.2px',
          }}>
            CIN {CIN} &nbsp;·&nbsp; CIR {CIR}
          </div>

        </div>
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  paddingBottom: 16,
  marginBottom: 16,
  borderBottom: '1px solid #f5f5f5',
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#222',
  marginBottom: 8,
};
const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  marginBottom: 4,
};
const labelStyle: React.CSSProperties = {
  color: '#888',
};
const valueStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#333',
};
const textStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#555',
  lineHeight: 1.6,
  margin: 0,
};
