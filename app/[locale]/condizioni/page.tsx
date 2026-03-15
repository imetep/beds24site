import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CondizioniPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={h1Style}>Condizioni generali di vendita</h1>
      <p style={subtitleStyle}>Tutte le condizioni per la tua vacanza a Livingapple</p>

      <Section title="1. Premessa">
        <p>Nelle presenti "Condizioni generali di locazione" si intende:</p>
        <p>per <strong>"Cliente"</strong> colui che effettua la Prenotazione ed usufruisce dei servizi e degli immobili offerti in locazione dall'attività di affitto case vacanze denominata LivingApple;</p>
        <p>per <strong>"Prenotazione"</strong> la richiesta del Cliente di prendere in locazione un appartamento per un certo periodo di tempo;</p>
        <p>per <strong>"Proposta di Contratto"</strong> la comunicazione da parte di LivingApple, a seguito del ricevimento della Prenotazione, di disponibilità di un appartamento al Cliente, contenente il dettaglio dell'offerta e l'invito ad inviare l'acconto;</p>
        <p>per <strong>"Lettera di Conferma"</strong> la comunicazione da parte di LivingApple di conferma del ricevimento dell'acconto contenente il codice di conferma della prenotazione;</p>
        <p>per <strong>"Contratto di Locazione"</strong> le condizioni di servizio che vengono concluse tra LivingApple ed il cliente;</p>
        <p>per <strong>"Condizioni generali di contratto"</strong> le condizioni e norme cui è soggetta la Locazione.</p>
      </Section>

      <Section title="2. Prenotazione e perfezionamento della locazione">
        <p>La Prenotazione si intende perfezionata nel momento in cui il Cliente riceve la Lettera di Conferma che LivingApple spedisce immediatamente dopo aver ricevuto la caparra, con allegato il Contratto di Locazione. Il contratto di Locazione dovrà essere presentato dal Cliente al momento della presa in consegna delle chiavi dell'appartamento locato. Al Contratto di Locazione è allegato un modulo contenente l'Elenco degli Inquilini, che dovrà essere compilato, sottoscritto e rispedito al più presto a LivingApple.</p>
      </Section>

      <Section title="3. Acconto, pagamento del canone e deposito cauzionale">
        <p>L'importo di quanto dovuto a titolo di acconto ed il dettaglio della proposta sono comunicati con la Proposta di Contratto. L'acconto in ogni caso corrisponde al 30% (con un minimo di € 150,00) del canone di Locazione e può essere versata tramite bonifico, pagamento on-line con carta di credito (+2,5%) o PayPal (+3,4%) dall'apposita pagina del nostro sito web.</p>
        <p>L'acconto deve pervenire a LivingApple entro e non oltre 7 giorni dalla data in cui è stata comunicata la disponibilità dell'appartamento — entro 3 giorni nel caso di pagamento on-line. Il saldo del canone di Locazione ed il deposito cauzionale (€ 260,00) deve essere versato, in contanti o con pre-autorizzazione di carta di credito, all'arrivo contestualmente al ritiro delle chiavi.</p>
      </Section>

      <Section title="4. Disdetta e recesso">
        <p>Una prenotazione confermata non può essere annullata e/o modificata dal cliente. Ogni richiesta di cancellazione dovrà essere comunicata via e-mail a LivingApple SRL.</p>
        <p>In tutti i casi in cui il cliente ha ricevuto una tariffa scontata e per tutte le prenotazioni che riguardano i periodi di vacanza (Natale, Capodanno, Pasqua e Ferragosto), ogni cancellazione prevede il pagamento del 100% del valore della prenotazione.</p>
        <ul style={ulStyle}>
          <li><strong>60+ giorni prima:</strong> 50% dell'importo versato come acconto (minimo € 150,00)</li>
          <li><strong>59–15 giorni prima:</strong> importo totale dell'acconto + 25% del saldo dovuto</li>
          <li><strong>14–01 giorni prima:</strong> pagamento dell'intero saldo dovuto</li>
        </ul>
      </Section>

      <Section title="5. Arrivo, mancato arrivo e partenza anticipata">
        <p>Almeno 3 giorni prima della data prevista di arrivo, devono essere inviati via e-mail i dettagli di arrivo (ora di arrivo prevista). Il check-in deve avvenire tra le ore 17:00 e le 20:00. I clienti che arrivano dopo l'orario previsto sono tenuti a pagare:</p>
        <ul style={ulStyle}>
          <li>€ 30,00 dalle ore 20:00 alle ore 22:00</li>
          <li>€ 50,00 dalle ore 22:00 alle ore 24:00</li>
        </ul>
        <p>Non è possibile effettuare il check-in dopo le ore 24:00, né il check-out prima delle 8:00. All'arrivo dovranno essere esibiti i documenti d'identità di tutte le persone che occupano l'appartamento.</p>
      </Section>

      <Section title="6. Dotazione delle abitazioni">
        <p>Tutti gli appartamenti vengono consegnati completamente arredati e provvisti di cucina a gas, frigorifero, batteria da cucina, acqua corrente calda e fredda, energia elettrica a 220V. Per ogni posto letto sono disponibili una coperta ed un guanciale. Su richiesta è possibile noleggiare sul posto lenzuola e asciugamani.</p>
      </Section>

      <Section title="7. Partenza">
        <p>L'appartamento deve essere lasciato libero tra le ore 07:00 e le ore 10:00 del mattino. L'appartamento deve essere lasciato libero da immondizie, con i ripiani interni dei mobili puliti, le stoviglie lavate, il frigorifero vuoto con la porta aperta. I mobili non devono essere spostati dalla posizione originale né lasciati all'esterno.</p>
      </Section>

      <Section title="8. Norme di soggiorno">
        <p>È vietato ospitare più persone di quanto consentito dal numero dei posti letto. I bambini oltre i 24 mesi sono considerati come adulti. Durante il soggiorno è assolutamente vietato lasciare l'arredo interno all'esterno, uscire di casa lasciando aperte le tende a braccio da esterno, adoperare il bbq con legna.</p>
        <p>Gli ospiti sono tenuti a rispettare le norme relative alla quiete, soprattutto nelle ore pomeridiane e notturne. LivingApple consiglia l'utilizzo degli appartamenti ai soli nuclei familiari.</p>
      </Section>

      <Section title="9. Aree esterne e pic nic">
        <p>L'accesso all'area Pic Nic è consentito dalle 11:00 alle 24:00. I bambini devono essere sorvegliati da un genitore. Non è ammessa l'introduzione di vetro, bottiglie di vetro, oggetti in porcellana. Non sono ammessi animali, biciclette, skateboard. Il numero di ospiti consentiti è limitato al numero di persone indicate nel contratto.</p>
      </Section>

      <Section title="10. Piscina">
        <p>L'uso della piscina è riservato esclusivamente ai clienti LivingApple della sede di Via Tore. Gli ospiti di LivingApple Beach <strong>non hanno accesso alla piscina</strong>. La piscina è aperta dalle 09:00 alle 19:00. I bambini sotto i 12 anni devono essere accompagnati. Sono proibite le spinte e i salti in acqua dai bordi. Non introdurre contenitori di vetro. Immergersi gradualmente ed almeno 3 ore dopo i pasti.</p>
      </Section>

      <Section title="11. Sanzioni">
        <p>Per l'inosservanza delle regole di cui ai punti 7 e 8 sono previste sanzioni variabili da € 10,00 ad € 500,00 e maggiorazioni sul costo delle pulizie finali.</p>
      </Section>

      <Section title="12. Deposito cauzionale">
        <p>A garanzia del puntuale rispetto di tutte le norme, LivingApple richiede al Cliente, al momento della consegna delle chiavi, una cauzione di <strong>€ 260,00</strong> per abitazione. La cauzione viene restituita dopo aver accertato il buono stato dell'appartamento.</p>
      </Section>

      <Section title="13. Responsabilità di LivingApple">
        <p>Nessuna responsabilità può essere attribuita a LivingApple per eventuali rotture, infortuni, smarrimenti, furti, ritardi ed inconvenienti in genere. Per eventuali controversie legali, il Foro esclusivo competente è quello di Cassino (FR).</p>
      </Section>

      <Section title="14. Norme particolari">
        <p>Il personale autorizzato da LivingApple può entrare negli appartamenti per eventuali riparazioni o manutenzioni anche in assenza degli inquilini, previa comunicazione. In caso di prenotazione da parte di gruppi con età media inferiore ai 23 anni, non verranno accettate prenotazioni di clienti con età inferiore ai 18 anni salvo autorizzazione scritta di un genitore.</p>
      </Section>

      <Section title="15. Accettazione">
        <p>All'atto della prenotazione il locatario accetta espressamente tutte le condizioni qui esposte.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={h2Style}>{title}</h2>
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}

const h1Style: React.CSSProperties = {
  fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a1a',
};
const subtitleStyle: React.CSSProperties = {
  fontSize: '1rem', color: '#6b7280', marginBottom: '2.5rem',
};
const h2Style: React.CSSProperties = {
  fontSize: '1.1rem', fontWeight: 700, color: '#1E73BE',
  borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '0.75rem',
};
const bodyStyle: React.CSSProperties = {
  fontSize: '0.95rem', color: '#374151', lineHeight: 1.7,
};
const ulStyle: React.CSSProperties = {
  paddingLeft: '1.5rem', margin: '0.5rem 0',
};
