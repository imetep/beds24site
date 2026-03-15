import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={h1Style}>Privacy Policy</h1>
      <p style={subtitleStyle}>Scopri come proteggiamo i tuoi dati</p>

      <div style={infoBoxStyle}>
        <strong>Informativa sul trattamento dei dati personali ai sensi dell'Art. 13 D.lgs. 30 giugno 2003 n. 196</strong>
      </div>

      <div style={bodyStyle}>
        <p>Si informa l'Interessato (Utente o Cliente) che il D.lgs. 196/2003 (cd. "Codice in materia di protezione dei dati personali") prevede la tutela delle persone fisiche rispetto al trattamento dei dati personali. In conformità a quanto previsto dal citato Codice e dalla normativa vigente, il trattamento sarà improntato ai principi di correttezza, liceità e trasparenza nel rispetto dei diritti e delle libertà fondamentali, nonché della dignità dell'interessato.</p>

        <p>I trattamenti di dati connessi ai servizi informativi web di questo sito hanno luogo presso la sede del Livingapple S.r.l. e avvengono da parte di personale appositamente incaricato del trattamento.</p>

        <p>I sistemi informatici e le procedure software che garantiscono il funzionamento di questo sito web acquisiscono alcuni dati personali la cui trasmissione è implicita nell'uso dei protocolli di comunicazione di Internet. Tali informazioni non sono raccolte per essere associate a interessati ed in tale categoria rientrano gli indirizzi IP o i nomi a dominio dei computer utilizzati dagli utenti che si connettono al sito, l'orario delle richieste ed altre informazioni di natura tecnica. Tali dati sono utilizzati per controllare il corretto funzionamento del sito e vengono cancellati immediatamente dopo l'elaborazione.</p>

        <p>L'invio, esplicito e volontario di dati attraverso il form sul sito web comporta l'acquisizione dell'indirizzo di posta elettronica del mittente, necessario per rispondere alle richieste, e del Codice Fiscale, necessario per la fatturazione del servizio acquistato.</p>

        <p>Non viene fatto uso di cookies per la trasmissione di informazioni di carattere personale, né vengono utilizzati sistemi per il tracciamento degli utenti. I dati personali sono trattati con strumenti automatizzati per il tempo strettamente necessario ad erogare i servizi richiesti.</p>

        <h2 style={h2Style}>Finalità del trattamento</h2>
        <ol style={olStyle}>
          <li>Concludere, gestire ed eseguire le richieste di contatto ovvero di fornitura dei servizi inoltrate dall'Interessato</li>
          <li>Organizzare, gestire ed eseguire le predette richieste anche mediante comunicazione dei dati a terzi fornitori</li>
          <li>Assolvere agli obblighi di legge o agli altri adempimenti richiesti dalle competenti Autorità</li>
        </ol>

        <h2 style={h2Style}>Diritti dell'interessato (Art. 7 del Codice)</h2>
        <p>L'interessato ha diritto di ottenere la conferma dell'esistenza o meno di dati personali che lo riguardano e la loro comunicazione in forma intelligibile. L'interessato ha diritto di ottenere:</p>
        <ul style={ulStyle}>
          <li>l'indicazione dell'origine dei dati personali, delle finalità e modalità del trattamento</li>
          <li>l'aggiornamento, la rettificazione ovvero l'integrazione dei dati</li>
          <li>la cancellazione, la trasformazione in forma anonima o il blocco dei dati trattati in violazione di legge</li>
          <li>di opporsi, in tutto o in parte, al trattamento dei dati personali che lo riguardano</li>
        </ul>

        <h2 style={h2Style}>Come esercitare i tuoi diritti</h2>
        <p>Le richieste vanno rivolte tramite posta a:</p>
        <div style={addressBoxStyle}>
          <strong>Livingapple S.r.l.</strong><br />
          Loc. LeTore, Traversa Carmen Rosati n. 2<br />
          04028 Scauri di Minturno (LT)
        </div>
      </div>
    </div>
  );
}

const h1Style: React.CSSProperties = {
  fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a1a',
};
const subtitleStyle: React.CSSProperties = {
  fontSize: '1rem', color: '#6b7280', marginBottom: '1.5rem',
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
const olStyle: React.CSSProperties = { paddingLeft: '1.5rem', margin: '0.5rem 0' };
const addressBoxStyle: React.CSSProperties = {
  background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '1rem 1.25rem',
  fontSize: '0.9rem', lineHeight: 1.8, marginTop: '0.75rem',
};
