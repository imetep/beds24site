import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const T: Record<Locale, {
  h1: string; infoBox: string; intro: string;
  purposeA: string; purposeB: string;
  conferimento: string; baseGiuridica: string;
  h2Storage: string; storage: string;
  h2Communication: string; communication: string;
  h2Rights: string; rightsIntro: string;
  right1: string; right2: string; right3: string; right4: string;
  rightsFooter: string;
}> = {
  it: {
    h1: 'Trattamento dei dati',
    infoBox: 'Informativa ex art. 13 Regolamento EU 679/2016',
    intro: 'Ai sensi dell\'art. 13 del Regolamento EU 679/2016, la Livingapple srl, con sede in Traversa Carmen Rosati 2, Scauri di Minturno (LT), La informa che i suoi dati personali saranno raccolti per:',
    purposeA: 'A — dare risposta alle sue richieste',
    purposeB: 'B — l\'invio di comunicazioni a carattere informativo/promozionale',
    conferimento: 'Il conferimento dei dati di cui al punto A è necessario; in sua mancanza non potremmo inviarLe le informazioni richieste. Il conferimento dei dati di cui al punto B non è obbligatorio.',
    baseGiuridica: 'La base giuridica del trattamento è la richiesta dell\'interessato e il consenso liberamente prestato. Ha il diritto di revocare il consenso in qualsiasi momento senza pregiudicare la liceità del trattamento precedente.',
    h2Storage: 'Conservazione dei dati',
    storage: 'I dati saranno conservati per il tempo necessario a rispondere alle sue richieste (finalità A). Per la finalità B, i dati saranno conservati per 24 mesi.',
    h2Communication: 'Comunicazione e diffusione',
    communication: 'I dati non saranno comunicati né diffusi a terzi, salvo quanto necessario per adempiere agli obblighi di legge.',
    h2Rights: 'I tuoi diritti',
    rightsIntro: 'Potrà esercitare i diritti previsti dal Regolamento EU 679/2016 scrivendo a livingapple@gmail.com. Potrà chiedere:',
    right1: 'conoscenza dell\'origine dei dati e delle finalità del trattamento',
    right2: 'cancellazione, anonimizzazione o blocco dei dati trattati in violazione di legge',
    right3: 'aggiornamento, rettifica o integrazione dei dati',
    right4: 'di opporsi, per motivi legittimi, al trattamento',
    rightsFooter: 'È garantito il diritto alla portabilità dei dati e a proporre reclamo a un\'autorità di controllo.',
  },
  en: {
    h1: 'Data Processing Notice',
    infoBox: 'Notice pursuant to Art. 13 EU Regulation 679/2016 (GDPR)',
    intro: 'Pursuant to Art. 13 of EU Regulation 679/2016 (GDPR), Livingapple srl, registered at Traversa Carmen Rosati 2, Scauri di Minturno (LT), Italy, informs you that your personal data will be collected for the following purposes:',
    purposeA: 'A — to respond to your enquiries',
    purposeB: 'B — to send informational and/or promotional communications',
    conferimento: 'Providing data for purpose A is required; without it we cannot send you the requested information. Providing data for purpose B is optional.',
    baseGiuridica: 'The legal basis for processing is your request and your freely given consent. You may withdraw consent at any time without affecting the lawfulness of prior processing.',
    h2Storage: 'Data retention',
    storage: 'Your data will be retained for as long as needed to respond to your requests (purpose A). For purpose B, data will be retained for 24 months.',
    h2Communication: 'Disclosure and dissemination',
    communication: 'Data will not be disclosed or shared with third parties except as required by law.',
    h2Rights: 'Your rights',
    rightsIntro: 'You may exercise your rights under EU Regulation 679/2016 by writing to livingapple@gmail.com. You may specifically request:',
    right1: 'information on the origin and purposes of processing',
    right2: 'erasure, anonymisation or blocking of unlawfully processed data',
    right3: 'updating, rectification or integration of data',
    right4: 'to object to processing on legitimate grounds',
    rightsFooter: 'You have the right to data portability and to lodge a complaint with a supervisory authority.',
  },
  de: {
    h1: 'Datenschutzhinweis',
    infoBox: 'Hinweis gemäß Art. 13 EU-Verordnung 679/2016 (DSGVO)',
    intro: 'Gemäß Art. 13 der EU-Verordnung 679/2016 (DSGVO) teilt die Livingapple srl, Sitz: Traversa Carmen Rosati 2, Scauri di Minturno (LT), Italien, Ihnen mit, dass Ihre personenbezogenen Daten für folgende Zwecke erhoben werden:',
    purposeA: 'A — Beantwortung Ihrer Anfragen',
    purposeB: 'B — Versand von Informations- und/oder Werbemitteilungen',
    conferimento: 'Die Angabe der Daten gemäß Zweck A ist erforderlich; ohne sie können wir Ihnen die gewünschten Informationen nicht zusenden. Die Angabe der Daten gemäß Zweck B ist freiwillig.',
    baseGiuridica: 'Rechtsgrundlage der Verarbeitung sind Ihre Anfrage und Ihre freiwillig erteilte Einwilligung. Sie können Ihre Einwilligung jederzeit widerrufen, ohne dass die Rechtmäßigkeit der bisherigen Verarbeitung berührt wird.',
    h2Storage: 'Datenspeicherung',
    storage: 'Ihre Daten werden so lange gespeichert, wie es zur Beantwortung Ihrer Anfragen erforderlich ist (Zweck A). Für Zweck B werden die Daten 24 Monate lang aufbewahrt.',
    h2Communication: 'Weitergabe und Verbreitung',
    communication: 'Die Daten werden nicht an Dritte weitergegeben oder verbreitet, es sei denn, dies ist zur Erfüllung gesetzlicher Pflichten erforderlich.',
    h2Rights: 'Ihre Rechte',
    rightsIntro: 'Sie können Ihre Rechte aus der EU-Verordnung 679/2016 geltend machen, indem Sie uns unter livingapple@gmail.com kontaktieren. Sie können insbesondere beantragen:',
    right1: 'Auskunft über Herkunft und Zwecke der Verarbeitung',
    right2: 'Löschung, Anonymisierung oder Sperrung rechtswidrig verarbeiteter Daten',
    right3: 'Aktualisierung, Berichtigung oder Ergänzung der Daten',
    right4: 'Widerspruch gegen die Verarbeitung aus berechtigten Gründen',
    rightsFooter: 'Sie haben das Recht auf Datenübertragbarkeit und das Recht, Beschwerde bei einer Datenschutzbehörde einzulegen.',
  },
  pl: {
    h1: 'Informacja o przetwarzaniu danych',
    infoBox: 'Informacja zgodnie z art. 13 rozporządzenia UE 679/2016 (RODO)',
    intro: 'Zgodnie z art. 13 rozporządzenia UE 679/2016 (RODO), Livingapple srl z siedzibą przy Traversa Carmen Rosati 2, Scauri di Minturno (LT), Włochy, informuje, że Pani/Pana dane osobowe będą zbierane w następujących celach:',
    purposeA: 'A — udzielanie odpowiedzi na zapytania',
    purposeB: 'B — przesyłanie komunikatów informacyjnych i/lub promocyjnych',
    conferimento: 'Podanie danych w celu A jest niezbędne; bez nich nie możemy udzielić żądanych informacji. Podanie danych w celu B jest dobrowolne.',
    baseGiuridica: 'Podstawą prawną przetwarzania jest Pani/Pana zapytanie oraz dobrowolnie wyrażona zgoda. Zgodę można wycofać w dowolnym momencie bez wpływu na zgodność z prawem wcześniejszego przetwarzania.',
    h2Storage: 'Przechowywanie danych',
    storage: 'Dane będą przechowywane przez czas niezbędny do udzielenia odpowiedzi na zapytania (cel A). W przypadku celu B dane będą przechowywane przez 24 miesiące.',
    h2Communication: 'Ujawnianie i przekazywanie',
    communication: 'Dane nie będą ujawniane ani przekazywane osobom trzecim, chyba że jest to konieczne w celu wypełnienia obowiązków prawnych.',
    h2Rights: 'Pani/Pana prawa',
    rightsIntro: 'Prawa przysługujące na mocy rozporządzenia UE 679/2016 można wykonywać, pisząc na adres livingapple@gmail.com. W szczególności można zażądać:',
    right1: 'informacji o pochodzeniu i celach przetwarzania danych',
    right2: 'usunięcia, anonimizacji lub zablokowania danych przetwarzanych niezgodnie z prawem',
    right3: 'aktualizacji, sprostowania lub uzupełnienia danych',
    right4: 'wniesienia sprzeciwu wobec przetwarzania z uzasadnionych powodów',
    rightsFooter: 'Przysługuje Pani/Panu prawo do przenoszenia danych oraz prawo do wniesienia skargi do organu nadzorczego.',
  },
};

export default async function TrattamentoDatiPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <div className="page-container page-top pb-5">
      <h1 className="fs-1 fw-bold mb-3">{t.h1}</h1>
      <div className="alert alert-primary"><strong>{t.infoBox}</strong></div>
      <div className="text-secondary" style={{ lineHeight: 1.8 }}>
        <p>{t.intro}</p>
        <ul className="ps-4 my-2">
          <li><strong>{t.purposeA}</strong></li>
          <li><strong>{t.purposeB}</strong></li>
        </ul>
        <p>{t.conferimento}</p>
        <p>{t.baseGiuridica}</p>
        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Storage}</h2>
        <p>{t.storage}</p>
        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Communication}</h2>
        <p>{t.communication}</p>
        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Rights}</h2>
        <p>{t.rightsIntro}</p>
        <div className="bg-light border rounded p-2 my-2">
          <a href="mailto:livingapple@gmail.com" className="text-primary fw-semibold text-decoration-none">
            livingapple@gmail.com
          </a>
        </div>
        <ul className="ps-4 my-2">
          <li>{t.right1}</li>
          <li>{t.right2}</li>
          <li>{t.right3}</li>
          <li>{t.right4}</li>
        </ul>
        <p>{t.rightsFooter}</p>
      </div>
    </div>
  );
}
