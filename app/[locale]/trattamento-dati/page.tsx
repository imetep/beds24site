import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function TrattamentoDatiPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={h1Style}>Trattamento dei dati</h1>

      <div style={infoBoxStyle}>
        <strong>Informativa ex art. 13 Regolamento EU 679/2016</strong>
      </div>

      <div style={bodyStyle}>
        <p>Ai sensi dell'art. 13 del Regolamento EU 679/2016, dettato in materia di protezione delle persone fisiche con riguardo al trattamento dei dati personali, nonché alla libera circolazione di tali dati, la <strong>Livingapple srl</strong>, con sede in Scauri di Minturno (LT) in Traversa Carmen Rosati, 2, La informa che i suoi dati personali, trattati con strumenti prevalentemente automatizzati, saranno raccolti per:</p>

        <ul style={ulStyle}>
          <li><strong>A</strong> — dare risposta alle sue richieste</li>
          <li><strong>B</strong> — l'invio di comunicazioni a carattere informativo/promozionale</li>
        </ul>

        <p>Il conferimento dei dati di cui al punto A è necessario e in sua mancanza non potremmo inviarLe le informazioni richieste. Il conferimento dei dati di cui al punto B non è obbligatorio e in sua mancanza non potremmo inviarLe comunicazioni informativo/promozionali.</p>

        <p>La base giuridica del trattamento dei suoi dati è la richiesta dell'interessato e il consenso, che potrà liberamente prestare. In relazione a quest'ultimo lei ha il diritto di revocare il consenso in qualsiasi momento. La revoca del consenso non pregiudica la liceità del trattamento in base al consenso fornito prima del ritiro.</p>

        <h2 style={h2Style}>Conservazione dei dati</h2>
        <p>I suoi dati personali saranno conservati per il tempo necessario a rispondere alle sue richieste (finalità A). Per le finalità di cui al punto B, i dati saranno <strong>conservati per 24 mesi</strong>.</p>

        <h2 style={h2Style}>Comunicazione e diffusione</h2>
        <p>I dati non saranno né comunicati né diffusi a terzi, salvo quanto necessario per adempiere agli obblighi di legge.</p>

        <h2 style={h2Style}>I tuoi diritti</h2>
        <p>Potrà esercitare i diritti previsti dal Regolamento EU 679/2016 scrivendo a:</p>
        <div style={emailBoxStyle}>
          <a href="mailto:livingapple@gmail.com" style={{ color: '#1E73BE', fontWeight: 600 }}>
            livingapple@gmail.com
          </a>
        </div>
        <p>Lei potrà pertanto chiedere:</p>
        <ul style={ulStyle}>
          <li>di avere conoscenza dell'origine dei dati nonché della logica e delle finalità del trattamento</li>
          <li>la cancellazione, la trasformazione in forma anonima o il blocco dei dati trattati in violazione di legge</li>
          <li>l'aggiornamento, la rettifica o l'integrazione dei dati</li>
          <li>di opporsi, per motivi legittimi, al trattamento</li>
        </ul>
        <p>È garantito il diritto a revocare il consenso in qualsiasi momento senza pregiudicare la liceità del trattamento basata sul consenso prestato prima della revoca. È garantito il diritto alla portabilità dei dati e a proporre reclamo a un'autorità di controllo.</p>
      </div>
    </div>
  );
}

const h1Style: React.CSSProperties = {
  fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: '#1a1a1a',
};
const infoBoxStyle: React.CSSProperties = {
  background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
  padding: '1rem 1.25rem', fontSize: '0.9rem', color: '#1e40af', marginBottom: '2rem',
};
const h2Style: React.CSSProperties = {
  fontSize: '1.1rem', fontWeight: 700, color: '#1E73BE',
  borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem',
  marginTop: '1.75rem', marginBottom: '0.75rem',
};
const bodyStyle: React.CSSProperties = {
  fontSize: '0.95rem', color: '#374151', lineHeight: 1.8,
};
const ulStyle: React.CSSProperties = { paddingLeft: '1.5rem', margin: '0.5rem 0' };
const emailBoxStyle: React.CSSProperties = {
  background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '0.75rem 1.25rem',
  fontSize: '1rem', margin: '0.75rem 0',
};
