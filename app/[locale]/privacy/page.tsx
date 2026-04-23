import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const T: Record<Locale, {
  h1: string; subtitle: string; infoBox: string;
  p1: string; p2: string; p3: string; p4: string; p5: string;
  h2Purposes: string;
  purpose1: string; purpose2: string; purpose3: string;
  h2Rights: string; rightsIntro: string;
  right1: string; right2: string; right3: string; right4: string;
  h2Contact: string; contactIntro: string;
}> = {
  it: {
    h1: 'Privacy Policy',
    subtitle: 'Scopri come proteggiamo i tuoi dati',
    infoBox: 'Informativa sul trattamento dei dati personali ai sensi dell\'Art. 13 D.lgs. 30 giugno 2003 n. 196',
    p1: 'Si informa l\'Interessato (Utente o Cliente) che il D.lgs. 196/2003 prevede la tutela delle persone fisiche rispetto al trattamento dei dati personali. In conformità alla normativa vigente, il trattamento sarà improntato ai principi di correttezza, liceità e trasparenza.',
    p2: 'I trattamenti di dati connessi ai servizi informativi web di questo sito hanno luogo presso la sede di Livingapple S.r.l. e avvengono da parte di personale appositamente incaricato del trattamento.',
    p3: 'I sistemi informatici acquisiscono alcuni dati personali la cui trasmissione è implicita nell\'uso dei protocolli di comunicazione di Internet (indirizzi IP, nomi a dominio, orario delle richieste). Tali dati sono utilizzati per il corretto funzionamento del sito e vengono cancellati immediatamente dopo l\'elaborazione.',
    p4: 'L\'invio volontario di dati attraverso il form del sito comporta l\'acquisizione dell\'indirizzo email del mittente, necessario per rispondere alle richieste.',
    p5: 'Non viene fatto uso di cookies per la trasmissione di informazioni personali, né vengono utilizzati sistemi per il tracciamento degli utenti.',
    h2Purposes: 'Finalità del trattamento',
    purpose1: 'Concludere, gestire ed eseguire le richieste di contatto o di fornitura dei servizi',
    purpose2: 'Organizzare e gestire le predette richieste anche mediante comunicazione dei dati a terzi fornitori',
    purpose3: 'Assolvere agli obblighi di legge o agli adempimenti richiesti dalle competenti Autorità',
    h2Rights: 'Diritti dell\'interessato (Art. 7 del Codice)',
    rightsIntro: 'L\'interessato ha diritto di ottenere la conferma dell\'esistenza di dati personali che lo riguardano e la loro comunicazione. Ha diritto di ottenere:',
    right1: 'l\'indicazione dell\'origine, delle finalità e modalità del trattamento',
    right2: 'l\'aggiornamento, la rettificazione ovvero l\'integrazione dei dati',
    right3: 'la cancellazione, la trasformazione in forma anonima o il blocco dei dati trattati in violazione di legge',
    right4: 'di opporsi, in tutto o in parte, al trattamento dei dati personali',
    h2Contact: 'Come esercitare i tuoi diritti',
    contactIntro: 'Le richieste vanno rivolte tramite posta a:',
  },
  en: {
    h1: 'Privacy Policy',
    subtitle: 'How we protect your personal data',
    infoBox: 'Privacy notice pursuant to Art. 13 of Legislative Decree no. 196 of 30 June 2003 and EU Regulation 679/2016 (GDPR)',
    p1: 'Livingapple S.r.l. informs you (the User or Customer) that Legislative Decree 196/2003 and EU Regulation 679/2016 (GDPR) provide for the protection of natural persons with regard to the processing of personal data. All processing is carried out in accordance with the principles of lawfulness, fairness and transparency.',
    p2: 'Data processing related to the web services of this site takes place at the registered offices of Livingapple S.r.l. and is carried out by specifically authorised personnel.',
    p3: 'Our IT systems automatically collect certain personal data whose transmission is implicit in the use of Internet communication protocols (IP addresses, domain names, request timestamps). This data is used solely to ensure the correct functioning of the site and is deleted immediately after processing.',
    p4: 'Voluntary submission of data through the site\'s contact form results in the collection of the sender\'s email address, which is necessary to respond to enquiries.',
    p5: 'We do not use cookies to transmit personal information, nor do we use user tracking systems.',
    h2Purposes: 'Purposes of processing',
    purpose1: 'To conclude, manage and fulfil contact requests or service provision requests submitted by the data subject',
    purpose2: 'To organise and manage said requests, including by sharing data with third-party providers',
    purpose3: 'To comply with legal obligations or requirements of competent authorities',
    h2Rights: 'Your rights (Art. 7 of the Privacy Code)',
    rightsIntro: 'You have the right to obtain confirmation of whether personal data concerning you exists and to have it communicated. You specifically have the right to:',
    right1: 'be informed of the origin of personal data, the purposes and methods of processing',
    right2: 'obtain updating, rectification or integration of data',
    right3: 'obtain erasure, anonymisation or blocking of data processed unlawfully',
    right4: 'object, in whole or in part, to the processing of personal data',
    h2Contact: 'How to exercise your rights',
    contactIntro: 'Requests should be sent by post to:',
  },
  de: {
    h1: 'Datenschutzerklärung',
    subtitle: 'So schützen wir Ihre persönlichen Daten',
    infoBox: 'Datenschutzhinweis gemäß Art. 13 EU-Verordnung 679/2016 (DSGVO)',
    p1: 'Die Livingapple S.r.l. informiert Sie (den Nutzer oder Kunden), dass die EU-Verordnung 679/2016 (DSGVO) den Schutz natürlicher Personen bei der Verarbeitung personenbezogener Daten gewährleistet. Die gesamte Datenverarbeitung erfolgt nach den Grundsätzen der Rechtmäßigkeit, Fairness und Transparenz.',
    p2: 'Die mit den Webdiensten dieser Website verbundene Datenverarbeitung findet am Sitz der Livingapple S.r.l. statt und wird von eigens beauftragtem Personal durchgeführt.',
    p3: 'Unsere IT-Systeme erfassen automatisch bestimmte personenbezogene Daten, deren Übermittlung durch die Nutzung von Internet-Kommunikationsprotokollen implizit ist (IP-Adressen, Domainnamen, Zeitstempel der Anfragen). Diese Daten dienen ausschließlich der ordnungsgemäßen Funktion der Website und werden nach der Verarbeitung sofort gelöscht.',
    p4: 'Durch die freiwillige Übermittlung von Daten über das Kontaktformular der Website wird die E-Mail-Adresse des Absenders erfasst, die zur Beantwortung von Anfragen benötigt wird.',
    p5: 'Wir verwenden keine Cookies zur Übermittlung personenbezogener Daten und kein Nutzer-Tracking.',
    h2Purposes: 'Zwecke der Verarbeitung',
    purpose1: 'Abwicklung, Verwaltung und Erfüllung von Kontakt- oder Dienstleistungsanfragen der betroffenen Person',
    purpose2: 'Organisation und Verwaltung der genannten Anfragen, auch durch Weitergabe von Daten an Drittanbieter',
    purpose3: 'Erfüllung gesetzlicher Verpflichtungen oder behördlicher Anforderungen',
    h2Rights: 'Ihre Rechte',
    rightsIntro: 'Sie haben das Recht zu erfahren, ob Sie betreffende personenbezogene Daten vorliegen, und diese zu erhalten. Sie haben insbesondere das Recht auf:',
    right1: 'Auskunft über die Herkunft der Daten, die Verarbeitungszwecke und -methoden',
    right2: 'Aktualisierung, Berichtigung oder Ergänzung der Daten',
    right3: 'Löschung, Anonymisierung oder Sperrung rechtswidrig verarbeiteter Daten',
    right4: 'Widerspruch gegen die Verarbeitung personenbezogener Daten, ganz oder teilweise',
    h2Contact: 'Wie Sie Ihre Rechte ausüben können',
    contactIntro: 'Anfragen sind per Post zu richten an:',
  },
  pl: {
    h1: 'Polityka prywatności',
    subtitle: 'Jak chronimy Pani/Pana dane osobowe',
    infoBox: 'Informacja o przetwarzaniu danych osobowych zgodnie z art. 13 rozporządzenia UE 679/2016 (RODO)',
    p1: 'Livingapple S.r.l. informuje Panią/Pana (Użytkownika lub Klienta), że rozporządzenie UE 679/2016 (RODO) zapewnia ochronę osób fizycznych w zakresie przetwarzania danych osobowych. Całe przetwarzanie odbywa się zgodnie z zasadami zgodności z prawem, rzetelności i przejrzystości.',
    p2: 'Przetwarzanie danych związane z usługami internetowymi tej witryny odbywa się w siedzibie Livingapple S.r.l. i jest wykonywane przez specjalnie upoważniony personel.',
    p3: 'Nasze systemy informatyczne automatycznie zbierają niektóre dane osobowe, których przekazywanie jest wpisane w użycie internetowych protokołów komunikacyjnych (adresy IP, nazwy domen, znaczniki czasu żądań). Dane te służą wyłącznie do zapewnienia prawidłowego funkcjonowania witryny i są usuwane natychmiast po przetworzeniu.',
    p4: 'Dobrowolne przesłanie danych przez formularz kontaktowy witryny skutkuje zebraniem adresu e-mail nadawcy, niezbędnego do udzielenia odpowiedzi na zapytania.',
    p5: 'Nie używamy plików cookie do przekazywania danych osobowych ani systemów śledzenia użytkowników.',
    h2Purposes: 'Cele przetwarzania',
    purpose1: 'Zawieranie, zarządzanie i realizacja zapytań kontaktowych lub zamówień usług',
    purpose2: 'Organizacja i zarządzanie ww. zapytaniami, w tym poprzez przekazywanie danych zewnętrznym dostawcom',
    purpose3: 'Wypełnianie obowiązków prawnych lub wymogów właściwych organów',
    h2Rights: 'Pani/Pana prawa',
    rightsIntro: 'Przysługuje Pani/Panu prawo do potwierdzenia, czy przetwarzane są dane osobowe Pani/Pana dotyczące, i do ich otrzymania. W szczególności przysługuje Pani/Panu prawo do:',
    right1: 'informacji o pochodzeniu danych, celach i metodach przetwarzania',
    right2: 'aktualizacji, sprostowania lub uzupełnienia danych',
    right3: 'usunięcia, anonimizacji lub zablokowania danych przetwarzanych niezgodnie z prawem',
    right4: 'wniesienia sprzeciwu wobec przetwarzania danych osobowych, w całości lub w części',
    h2Contact: 'Jak wykonać swoje prawa',
    contactIntro: 'Wnioski należy kierować pocztą na adres:',
  },
};

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <div className="page-container py-5">
      <h1 className="fs-1 fw-bold mb-1">{t.h1}</h1>
      <p className="text-muted mb-3">{t.subtitle}</p>
      <div className="alert alert-primary"><strong>{t.infoBox}</strong></div>
      <div className="text-secondary" style={{ lineHeight: 1.8 }}>
        <p>{t.p1}</p>
        <p>{t.p2}</p>
        <p>{t.p3}</p>
        <p>{t.p4}</p>
        <p>{t.p5}</p>

        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Purposes}</h2>
        <ol className="ps-4 my-2">
          <li>{t.purpose1}</li>
          <li>{t.purpose2}</li>
          <li>{t.purpose3}</li>
        </ol>

        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Rights}</h2>
        <p>{t.rightsIntro}</p>
        <ul className="ps-4 my-2">
          <li>{t.right1}</li>
          <li>{t.right2}</li>
          <li>{t.right3}</li>
          <li>{t.right4}</li>
        </ul>

        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Contact}</h2>
        <p>{t.contactIntro}</p>
        <div className="bg-light border rounded p-3 mt-2" style={{ lineHeight: 1.8 }}>
          <strong>Livingapple S.r.l.</strong><br />
          Loc. LeTore, Traversa Carmen Rosati n. 2<br />
          04028 Scauri di Minturno (LT) — Italy
        </div>
      </div>
    </div>
  );
}
