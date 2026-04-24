'use client';
import { useState } from 'react';
import type { Locale } from '@/config/i18n';

// ─── Fonti (statiche — stessa lista in tutte le lingue) ───────────────────────
const SOURCES_INTL = [
  { outlet: 'Euronews — dic 2025',          title: 'Milan bans self check-in key boxes for short-term rentals starting in 2026',           url: 'https://www.euronews.com/travel/2025/12/05/milan-bans-self-check-in-key-boxes-for-short-term-rentals-starting-in-2026' },
  { outlet: 'The Local Italy — dic 2025',   title: 'Explained: how Italy\'s rules on self check-ins have changed again',                    url: 'https://www.thelocal.it/20251204/explained-how-italys-rules-on-self-check-ins-have-changed-again' },
  { outlet: 'Skift — feb 2025',             title: 'Italy clamps down on self check-ins and key boxes for short-term rentals',              url: 'https://skift.com/2025/02/25/italy-clamps-down-on-self-check-ins-and-key-boxes-for-short-term-rentals/' },
  { outlet: 'Rental Scale-Up — giu 2025',   title: 'Italy legalizes remote check-ins again: why this matters',                             url: 'https://www.rentalscaleup.com/italy-legalizes-remote-check-ins-again-why-this-matters-to-short-term-rental-managers-everywhere/' },
  { outlet: 'Travel & Tour World',          title: 'How new short-term rental laws will change your check-in experience in Italy',          url: 'https://www.travelandtourworld.com/news/article/planning-a-trip-to-italy-heres-how-new-short-term-rental-laws-will-change-your-check-in-experience/' },
];

const SOURCES_IT = [
  { outlet: 'Il Sole 24 Ore — nov 2025',      title: 'Affitti brevi: Consiglio di Stato conferma il divieto di self check-in',          url: 'https://www.ilsole24ore.com/art/affitti-brevi-consiglio-stato-conferma-divieto-self-check-in-AH0w2psD' },
  { outlet: 'Sky TG24 — nov 2025',            title: 'Affitti brevi e self check-in: la sentenza del Consiglio di Stato',               url: 'https://tg24.sky.it/economia/2025/11/22/affitti-brevi-self-check-in-consiglio-stato' },
  { outlet: 'Agenda Digitale — nov 2025',     title: 'Self check-in negli affitti brevi: cambia tutto di nuovo, ecco come',            url: 'https://www.agendadigitale.eu/documenti/self-check-in-negli-affitti-brevi-cambia-tutto-di-nuovo-ecco-come/' },
  { outlet: 'Il Fatto Quotidiano — nov 2025', title: 'Affitti brevi, self check-in vietato: la sentenza del Consiglio di Stato',       url: 'https://www.ilfattoquotidiano.it/2025/11/21/affitti-brevi-self-check-in-vietato-consiglio-di-stato-sentenza-oggi-news/8203757/' },
  { outlet: 'Smoobu Blog — dic 2025',         title: 'Stop self check-in e key box: cosa cambia per gli host',                        url: 'https://www.smoobu.com/it/blog/stop-self-check-in-e-key-box' },
  { outlet: 'Lodgify Blog — gen 2026',        title: 'Obbligo check-in de visu: cosa è legale nel 2026',                             url: 'https://www.lodgify.com/blog/it/obbligo-check-in-de-visu' },
];

// ─── Traduzioni ───────────────────────────────────────────────────────────────
const T: Record<Locale, {
  title: string;
  subtitle: string;
  whyTitle: string;
  whyText: string;
  whyBadge: string;
  legalNote: string;
  stepsTitle: string;
  steps: { n: string; title: string; text: string }[];
  needTitle: string;
  needs: string[];
  timeNote: string;
  faqTitle: string;
  faqs: { q: string; a: string; link?: { label: string; href: string } }[];
  ctaTitle: string;
  ctaText: string;
  ctaBtn: string;
  ctaNote: string;
  sourcesTitle: string;
  sourcesSubtitle: string;
  sourcesIntl: string;
  sourcesIt: string;
}> = {

  // ── ITALIANO ────────────────────────────────────────────────────────────────
  it: {
    title: 'Check-in online',
    subtitle: 'Come funziona la procedura di pre-check-in obbligatoria per il self check-in.',
    whyTitle: 'Perché è obbligatorio?',
    whyText: 'In Italia, l\'art. 109 del Testo Unico delle Leggi di Pubblica Sicurezza (R.D. 773/1931) impone alle strutture ricettive di identificare visivamente ogni ospite e comunicare i dati alle autorità di pubblica sicurezza. Non è una scelta del gestore: è un obbligo di legge che si applica a tutte le strutture ricettive italiane, incluse quelle extralberghiere.',
    whyBadge: 'Art. 109 TULPS — R.D. 773/1931',
    legalNote: 'La sentenza del Consiglio di Stato n. 05732/2025 del 21 novembre 2025 ha confermato che l\'identificazione in presenza (de visu) rimane obbligatoria. Il self check-in è consentito solo come procedura ibrida: raccolta documenti online + videochiamata di verifica al momento dell\'accesso fisico.',
    stepsTitle: 'Come funziona — 5 passi',
    steps: [
      { n: '1', title: 'Inserisci il numero di prenotazione', text: 'Il tuo numero di prenotazione Beds24 è indicato nell\'email di conferma che hai ricevuto al momento della prenotazione.' },
      { n: '2', title: 'Compila i dati personali', text: 'Nome, cognome, data di nascita, nazionalità e numero di documento per ogni ospite adulto. Per i minori è sufficiente indicare il numero e l\'età.' },
      { n: '3', title: 'Carica i documenti di identità', text: 'Fotografia chiara di fronte e retro del documento (passaporto, carta d\'identità o patente). Il documento deve essere leggibile, non modificato e senza parti oscurate.' },
      { n: '4', title: 'Firma e invia', text: 'Dichiari di aver letto le condizioni, acconsenti al trattamento dati (art. 109 TULPS e GDPR) e invii la richiesta. Riceverai un riferimento univoco della tua richiesta.' },
      { n: '5', title: 'Ricevi il guidebook', text: 'Dopo la nostra verifica e approvazione, riceverai via email il link al guidebook della struttura con tutti i dettagli per il tuo arrivo. Al momento dell\'accesso fisico effettueremo una breve videochiamata di verifica come previsto dalla legge.' },
    ],
    needTitle: 'Cosa ti serve',
    needs: [
      'Documento di identità valido (passaporto, carta d\'identità o patente) per ogni adulto',
      'Smartphone o computer con fotocamera per fotografare il documento',
      'Carta di credito (non debit card, non PostePay) per il deposito cauzionale',
      'Circa 5–10 minuti di tempo',
    ],
    timeNote: 'La procedura va completata almeno 72 ore prima dell\'arrivo.',
    faqTitle: 'Domande frequenti',
    faqs: [
      { q: 'I miei dati sono al sicuro?', a: 'Sì. I documenti vengono caricati su Cloudinary in una cartella privata non indicizzabile. I dati personali sono trattati ai sensi del Regolamento UE 2016/679 (GDPR) e trasmessi alle autorità italiane come previsto dall\'art. 109 TULPS. Non vengono condivisi con terze parti per finalità commerciali.' },
      { q: 'Cosa succede se il documento non viene accettato?', a: 'Riceverai una email con la motivazione del rifiuto e l\'invito a ripetere la procedura. Documenti con volti oscurati, dati coperti o immagini modificate vengono rifiutati automaticamente.' },
      { q: 'Posso completare la procedura per conto di altri ospiti?', a: 'Sì, il titolare della prenotazione può compilare i dati di tutti gli ospiti adulti del gruppo. Ogni adulto però deve essere titolare di un documento valido.' },
      { q: 'Il deposito cauzionale viene addebitato subito?', a: 'No. Viene effettuata una pre-autorizzazione (blocco temporaneo) sulla carta di credito, non un addebito reale. Se non ci sono danni, il blocco viene rilasciato automaticamente entro 7–30 giorni dalla partenza a seconda del circuito (Visa/Mastercard/Amex).', link: { label: 'Come funziona il deposito →', href: '/it/deposito' } },
    ],
    ctaTitle: 'Pronto per il check-in?',
    ctaText: 'Hai ricevuto il link di check-in nella email di conferma della prenotazione. Se non lo trovi, contattaci via WhatsApp.',
    ctaBtn: 'Avvia il check-in online',
    ctaNote: 'Ti serve il numero di prenotazione — lo trovi nell\'email di conferma.',
    sourcesTitle: 'Fonti e approfondimenti',
    sourcesSubtitle: 'La normativa è documentata da testate giornalistiche internazionali e italiane. Non si tratta di una scelta del gestore.',
    sourcesIntl: 'Stampa internazionale',
    sourcesIt: 'Stampa italiana',
  },

  // ── ENGLISH ─────────────────────────────────────────────────────────────────
  en: {
    title: 'Online check-in',
    subtitle: 'How the mandatory pre-check-in procedure works for self check-in.',
    whyTitle: 'Why is it required?',
    whyText: 'In Italy, Article 109 of the Consolidated Law on Public Security (R.D. 773/1931) requires accommodation providers to visually identify every guest and report their details to the public security authorities. This is not a choice made by the property manager — it is a legal obligation that applies to all Italian accommodation facilities, including non-hotel properties.',
    whyBadge: 'Art. 109 TULPS — R.D. 773/1931',
    legalNote: 'The Council of State ruling no. 05732/2025 of 21 November 2025 confirmed that in-person (de visu) identification remains mandatory. Self check-in is permitted only as a hybrid procedure: online document collection + a verification video call at the time of physical access.',
    stepsTitle: 'How it works — 5 steps',
    steps: [
      { n: '1', title: 'Enter your booking number', text: 'Your Beds24 booking number is shown in the confirmation email you received when you booked.' },
      { n: '2', title: 'Fill in your personal details', text: 'First name, last name, date of birth, nationality and document number for every adult guest. For minors, just the number and age are sufficient.' },
      { n: '3', title: 'Upload identity documents', text: 'A clear photo of the front and back of the document (passport, ID card or driving licence). The document must be legible, unaltered and with no parts obscured.' },
      { n: '4', title: 'Sign and submit', text: 'You declare that you have read the conditions, consent to data processing (Art. 109 TULPS and GDPR) and submit the request. You will receive a unique reference for your request.' },
      { n: '5', title: 'Receive the guidebook', text: 'After our review and approval, you will receive the property guidebook by email, with all the details for your arrival. At the time of physical access, we will carry out a brief verification video call as required by law.' },
    ],
    needTitle: 'What you need',
    needs: [
      'A valid identity document (passport, ID card or driving licence) for every adult',
      'A smartphone or computer with a camera to photograph the document',
      'A credit card (not debit card, not prepaid card) for the security deposit',
      'About 5–10 minutes of your time',
    ],
    timeNote: 'The procedure must be completed at least 72 hours before arrival.',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'Is my data secure?', a: 'Yes. Documents are uploaded to Cloudinary in a private, non-indexed folder. Personal data is processed in accordance with EU Regulation 2016/679 (GDPR) and transmitted to Italian authorities as required by Art. 109 TULPS. It is not shared with third parties for commercial purposes.' },
      { q: 'What happens if my document is not accepted?', a: 'You will receive an email explaining why it was rejected and asking you to repeat the procedure. Documents with obscured faces, covered data or altered images are automatically rejected.' },
      { q: 'Can I complete the procedure on behalf of other guests?', a: 'Yes, the lead guest can fill in the details for all adult members of the group. However, each adult must hold a valid document.' },
      { q: 'Is the security deposit charged immediately?', a: 'No. A pre-authorisation (temporary hold) is placed on the credit card — no actual charge is made. If there is no damage, the hold is released automatically within 7–30 days of departure depending on the card network (Visa/Mastercard/Amex).', link: { label: 'How the deposit works →', href: '/en/deposito' } },
    ],
    ctaTitle: 'Ready to check in?',
    ctaText: 'You received the check-in link in your booking confirmation email. If you cannot find it, contact us via WhatsApp.',
    ctaBtn: 'Start online check-in',
    ctaNote: 'You will need your booking number — it is in your confirmation email.',
    sourcesTitle: 'Sources & further reading',
    sourcesSubtitle: 'The regulation is documented by international and Italian news outlets. This is a legal requirement, not a choice made by the property manager.',
    sourcesIntl: 'International press',
    sourcesIt: 'Italian press',
  },

  // ── DEUTSCH ─────────────────────────────────────────────────────────────────
  de: {
    title: 'Online-Check-in',
    subtitle: 'So funktioniert das obligatorische Pre-Check-in-Verfahren für den Self-Check-in.',
    whyTitle: 'Warum ist es Pflicht?',
    whyText: 'In Italien verpflichtet Artikel 109 des Einheitstexts der Gesetze über die öffentliche Sicherheit (R.D. 773/1931) alle Beherbergungsbetriebe, jeden Gast persönlich zu identifizieren und die Daten den Sicherheitsbehörden zu melden. Dies ist keine Entscheidung des Betreibers — es ist eine gesetzliche Pflicht, die für alle italienischen Beherbergungsbetriebe gilt, einschließlich außerhotellierer Betriebe.',
    whyBadge: 'Art. 109 TULPS — R.D. 773/1931',
    legalNote: 'Das Urteil des Staatsrats Nr. 05732/2025 vom 21. November 2025 bestätigt, dass die persönliche Identifizierung (de visu) weiterhin Pflicht ist. Self-Check-in ist nur als hybrides Verfahren zulässig: Online-Dokumentenerfassung + Videoanruf zur Überprüfung beim physischen Zugang.',
    stepsTitle: 'So funktioniert es — 5 Schritte',
    steps: [
      { n: '1', title: 'Buchungsnummer eingeben', text: 'Ihre Beds24-Buchungsnummer finden Sie in der Bestätigungs-E-Mail, die Sie bei der Buchung erhalten haben.' },
      { n: '2', title: 'Persönliche Daten ausfüllen', text: 'Vorname, Nachname, Geburtsdatum, Staatsangehörigkeit und Ausweisnummer für jeden erwachsenen Gast. Für Minderjährige reichen Anzahl und Alter.' },
      { n: '3', title: 'Ausweisdokumente hochladen', text: 'Ein klares Foto von Vorder- und Rückseite des Dokuments (Reisepass, Personalausweis oder Führerschein). Das Dokument muss lesbar, unverändert und ohne verdeckte Teile sein.' },
      { n: '4', title: 'Unterschreiben und absenden', text: 'Sie erklären, die Bedingungen gelesen zu haben, stimmen der Datenverarbeitung (Art. 109 TULPS und DSGVO) zu und senden die Anfrage ab. Sie erhalten eine eindeutige Referenznummer.' },
      { n: '5', title: 'Guidebook erhalten', text: 'Nach unserer Prüfung und Genehmigung erhalten Sie per E-Mail den Link zum Guidebook mit allen Ankunftsdetails. Beim physischen Zugang führen wir wie gesetzlich vorgeschrieben einen kurzen Videoanruf zur Verifizierung durch.' },
    ],
    needTitle: 'Was Sie brauchen',
    needs: [
      'Ein gültiges Ausweisdokument (Reisepass, Personalausweis oder Führerschein) für jeden Erwachsenen',
      'Ein Smartphone oder Computer mit Kamera zum Fotografieren des Dokuments',
      'Eine Kreditkarte (keine Debitkarte, keine Prepaid-Karte) für die Kaution',
      'Etwa 5–10 Minuten Zeit',
    ],
    timeNote: 'Das Verfahren muss mindestens 72 Stunden vor der Ankunft abgeschlossen werden.',
    faqTitle: 'Häufig gestellte Fragen',
    faqs: [
      { q: 'Sind meine Daten sicher?', a: 'Ja. Dokumente werden in einem privaten, nicht indizierten Ordner auf Cloudinary hochgeladen. Personenbezogene Daten werden gemäß EU-Verordnung 2016/679 (DSGVO) verarbeitet und den italienischen Behörden gemäß Art. 109 TULPS übermittelt. Sie werden nicht zu kommerziellen Zwecken an Dritte weitergegeben.' },
      { q: 'Was passiert, wenn mein Dokument nicht akzeptiert wird?', a: 'Sie erhalten eine E-Mail mit der Begründung der Ablehnung und der Bitte, das Verfahren zu wiederholen. Dokumente mit verdeckten Gesichtern, abgedeckten Daten oder veränderten Bildern werden automatisch abgelehnt.' },
      { q: 'Kann ich das Verfahren für andere Gäste ausfüllen?', a: 'Ja, der Hauptbuchende kann die Daten aller erwachsenen Mitglieder der Gruppe ausfüllen. Jeder Erwachsene muss jedoch ein gültiges Dokument besitzen.' },
      { q: 'Wird die Kaution sofort abgebucht?', a: 'Nein. Es wird eine Vorautorisierung (vorübergehende Blockierung) auf der Kreditkarte durchgeführt — keine tatsächliche Abbuchung. Wenn keine Schäden vorliegen, wird die Blockierung je nach Kartennetz (Visa/Mastercard/Amex) automatisch innerhalb von 7–30 Tagen nach der Abreise aufgehoben.', link: { label: 'So funktioniert die Kaution →', href: '/de/deposito' } },
    ],
    ctaTitle: 'Bereit zum Einchecken?',
    ctaText: 'Sie haben den Check-in-Link in Ihrer Buchungsbestätigungs-E-Mail erhalten. Wenn Sie ihn nicht finden, kontaktieren Sie uns über WhatsApp.',
    ctaBtn: 'Online-Check-in starten',
    ctaNote: 'Sie benötigen Ihre Buchungsnummer — Sie finden sie in Ihrer Bestätigungs-E-Mail.',
    sourcesTitle: 'Quellen & weiterführende Informationen',
    sourcesSubtitle: 'Die Vorschrift ist durch internationale und italienische Medien dokumentiert. Es handelt sich um eine gesetzliche Pflicht, keine Entscheidung des Betreibers.',
    sourcesIntl: 'Internationale Presse',
    sourcesIt: 'Italienische Presse',
  },

  // ── POLSKI ──────────────────────────────────────────────────────────────────
  pl: {
    title: 'Check-in online',
    subtitle: 'Jak przebiega obowiązkowa procedura pre-check-in dla samodzielnego zameldowania.',
    whyTitle: 'Dlaczego jest obowiązkowy?',
    whyText: 'We Włoszech art. 109 Ujednoliconego tekstu ustaw o bezpieczeństwie publicznym (R.D. 773/1931) zobowiązuje wszystkie obiekty noclegowe do osobistej identyfikacji każdego gościa i przekazania danych organom bezpieczeństwa publicznego. To nie jest decyzja zarządcy — to obowiązek prawny obowiązujący wszystkie włoskie obiekty noclegowe, w tym pozahotelowe.',
    whyBadge: 'Art. 109 TULPS — R.D. 773/1931',
    legalNote: 'Wyrok Rady Stanu nr 05732/2025 z 21 listopada 2025 r. potwierdził, że osobista identyfikacja (de visu) pozostaje obowiązkowa. Self check-in jest dozwolony wyłącznie jako procedura hybrydowa: zbieranie dokumentów online + rozmowa wideo w celu weryfikacji przy fizycznym dostępie.',
    stepsTitle: 'Jak to działa — 5 kroków',
    steps: [
      { n: '1', title: 'Wpisz numer rezerwacji', text: 'Twój numer rezerwacji Beds24 jest podany w e-mailu potwierdzającym rezerwację.' },
      { n: '2', title: 'Wypełnij dane osobowe', text: 'Imię, nazwisko, data urodzenia, obywatelstwo i numer dokumentu dla każdego dorosłego gościa. Dla nieletnich wystarczy podać liczbę i wiek.' },
      { n: '3', title: 'Prześlij dokumenty tożsamości', text: 'Wyraźne zdjęcie przedniej i tylnej strony dokumentu (paszport, dowód osobisty lub prawo jazdy). Dokument musi być czytelny, niezmieniony i bez zakrytych elementów.' },
      { n: '4', title: 'Podpisz i wyślij', text: 'Oświadczasz, że zapoznałeś się z warunkami, wyrażasz zgodę na przetwarzanie danych (art. 109 TULPS i RODO) i wysyłasz wniosek. Otrzymasz unikalny numer referencyjny.' },
      { n: '5', title: 'Otrzymaj przewodnik', text: 'Po naszej weryfikacji i zatwierdzeniu otrzymasz e-mailem link do przewodnika po obiekcie z wszystkimi szczegółami przyjazdu. Przy fizycznym wejściu przeprowadzimy krótką rozmowę wideo w celu weryfikacji zgodnie z wymogami prawa.' },
    ],
    needTitle: 'Czego potrzebujesz',
    needs: [
      'Ważny dokument tożsamości (paszport, dowód osobisty lub prawo jazdy) dla każdego dorosłego',
      'Smartfon lub komputer z aparatem do sfotografowania dokumentu',
      'Karta kredytowa (nie debetowa, nie przedpłacona) na kaucję',
      'Około 5–10 minut czasu',
    ],
    timeNote: 'Procedurę należy ukończyć co najmniej 72 godziny przed przyjazdem.',
    faqTitle: 'Często zadawane pytania',
    faqs: [
      { q: 'Czy moje dane są bezpieczne?', a: 'Tak. Dokumenty są przesyłane do Cloudinary w prywatnym, nieindeksowanym folderze. Dane osobowe są przetwarzane zgodnie z Rozporządzeniem UE 2016/679 (RODO) i przekazywane władzom włoskim zgodnie z art. 109 TULPS. Nie są udostępniane stronom trzecim w celach komercyjnych.' },
      { q: 'Co się stanie, jeśli dokument nie zostanie zaakceptowany?', a: 'Otrzymasz e-mail wyjaśniający przyczyny odrzucenia i prośbę o powtórzenie procedury. Dokumenty z zakrytymi twarzami, ukrytymi danymi lub zmienionymi obrazami są automatycznie odrzucane.' },
      { q: 'Czy mogę wypełnić procedurę w imieniu innych gości?', a: 'Tak, główny rezerwujący może wypełnić dane wszystkich dorosłych członków grupy. Jednak każdy dorosły musi posiadać ważny dokument.' },
      { q: 'Czy kaucja jest pobierana od razu?', a: 'Nie. Na karcie kredytowej dokonywana jest pre-autoryzacja (tymczasowe zablokowanie) — bez rzeczywistego obciążenia. Jeśli nie ma szkód, blokada jest automatycznie zwalniana w ciągu 7–30 dni od wyjazdu, w zależności od sieci kartowej (Visa/Mastercard/Amex).', link: { label: 'Jak działa kaucja →', href: '/pl/deposito' } },
    ],
    ctaTitle: 'Gotowy do zameldowania?',
    ctaText: 'Link do check-in otrzymałeś w e-mailu potwierdzającym rezerwację. Jeśli go nie możesz znaleźć, skontaktuj się z nami przez WhatsApp.',
    ctaBtn: 'Rozpocznij check-in online',
    ctaNote: 'Będziesz potrzebować numeru rezerwacji — znajdziesz go w e-mailu potwierdzającym.',
    sourcesTitle: 'Źródła i dodatkowe informacje',
    sourcesSubtitle: 'Przepis jest udokumentowany przez międzynarodowe i włoskie media. To wymóg prawny, a nie decyzja zarządcy.',
    sourcesIntl: 'Prasa międzynarodowa',
    sourcesIt: 'Prasa włoska',
  },
};

// ─── Componenti interni ────────────────────────────────────────────────────────
function StepCard({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '0.5px solid #f3f4f6' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'var(--color-primary)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2,
      }}>
        {n}
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#111' }}>{title}</p>
        <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>{text}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a, link }: { q: string; a: string; link?: { label: string; href: string } }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '0.5px solid #f3f4f6' }}>
      <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#111' }}>{q}</p>
      <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>{a}</p>
      {link && (
        <a href={link.href} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
          {link.label}
        </a>
      )}
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────
interface Props { locale: Locale; wizardHref: string; contactHref: string; }

export default function SelfCheckinPage({ locale, wizardHref, contactHref }: Props) {
  const t = T[locale];
  const [sourcesOpen, setSourcesOpen] = useState(false);

  return (
    <div className="page-container" style={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 60 }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', padding: '28px 20px 24px', borderBottom: '0.5px solid #f3f4f6', marginBottom: 8 }}>
        <div style={{
          display: 'inline-block', marginBottom: 12,
          background: '#EEF5FC', color: 'var(--color-primary)',
          fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
        }}>
          {t.whyBadge}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', margin: '0 0 8px', lineHeight: 1.2 }}>
          {t.title}
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: '#6b7280', lineHeight: 1.55 }}>
          {t.subtitle}
        </p>
      </div>

      {/* ── CTA sopra il fold — UX 3.5 (prima del contenuto informativo) ────── */}
      <div className="bg-white px-3 pt-2 pb-3 mb-2 text-center">
        <a
          href={wizardHref}
          className="btn btn-primary btn-lg fw-bold w-100 py-3"
        >
          {t.ctaBtn} →
        </a>
        <p className="small text-muted mt-2 mb-0">
          <i className="bi bi-info-circle me-1"></i> {t.ctaNote}
        </p>
      </div>

      {/* ── Perché è obbligatorio ────────────────────────────────────────────── */}
      <div style={{ background: '#fff', padding: '20px 20px 22px', marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 10px' }}>
          {t.whyTitle}
        </h2>
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>
          {t.whyText}
        </p>

        {/* Accordion fonti — subito dopo whyText */}
        <div style={{
          border: '0.5px solid #e5e7eb',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 14,
        }}>
          <button
            onClick={() => setSourcesOpen(o => !o)}
            style={{
              width: '100%', background: '#f9fafb', border: 'none',
              padding: '12px 16px', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', textAlign: 'left', gap: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              <i className="bi bi-newspaper me-1" aria-hidden="true" />
              {t.sourcesTitle}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#9ca3af" strokeWidth="2.5"
              style={{ flexShrink: 0, transition: 'transform 250ms ease', transform: sourcesOpen ? 'rotate(180deg)' : 'none' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <div style={{
            overflow: 'hidden',
            maxHeight: sourcesOpen ? 1200 : 0,
            transition: 'max-height 300ms ease',
          }}>
            <div style={{ padding: '14px 16px', borderTop: '0.5px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                {t.sourcesSubtitle}
              </p>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.sourcesIntl}
              </p>
              <ul style={{ margin: '0 0 12px', padding: 0, listStyle: 'none' }}>
                {SOURCES_INTL.map((s, i) => (
                  <li key={i} style={{ padding: '6px 0', borderBottom: '0.5px solid #f3f4f6', display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, minWidth: 130 }}>{s.outlet}</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: 'var(--color-primary)', textDecoration: 'none', lineHeight: 1.5 }}>
                      {s.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.sourcesIt}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {SOURCES_IT.map((s, i) => (
                  <li key={i} style={{ padding: '6px 0', borderBottom: i < SOURCES_IT.length - 1 ? '0.5px solid #f3f4f6' : 'none', display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, minWidth: 130 }}>{s.outlet}</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: 'var(--color-primary)', textDecoration: 'none', lineHeight: 1.5 }}>
                      {s.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div style={{
          background: '#FFF9E6', border: '0.5px solid #FDE68A',
          borderRadius: 10, padding: '12px 16px',
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#713f12', lineHeight: 1.65 }}>
            <i className="bi bi-bank2 me-1" aria-hidden="true" />
            {t.legalNote}
          </p>
        </div>
      </div>

      {/* ── 5 passi ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', padding: '20px 20px 6px', marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
          {t.stepsTitle}
        </h2>
        {t.steps.map(s => (
          <StepCard key={s.n} {...s} />
        ))}
      </div>

      {/* ── Cosa ti serve ───────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', padding: '20px 20px 22px', marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 12px' }}>
          {t.needTitle}
        </h2>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {t.needs.map((need, i) => (
            <li key={i} style={{
              display: 'flex', gap: 10, padding: '8px 0',
              borderBottom: i < t.needs.length - 1 ? '0.5px solid #f3f4f6' : 'none',
              fontSize: 14, color: '#4b5563', lineHeight: 1.55,
            }}>
              <span style={{ color: 'var(--color-primary)', flexShrink: 0, fontWeight: 700 }}>✓</span>
              {need}
            </li>
          ))}
        </ul>
        <p style={{ margin: '14px 0 0', fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
          ⏱ {t.timeNote}
        </p>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', padding: '20px 20px 14px', marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
          {t.faqTitle}
        </h2>
        {t.faqs.map((f, i) => (
          <FaqItem key={i} {...f} />
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <div style={{ background: '#EEF5FC', margin: '0 0 8px', padding: '24px 20px', borderTop: '2px solid #006CB7' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0C447C', margin: '0 0 8px' }}>
          {t.ctaTitle}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#185FA5', lineHeight: 1.6 }}>
          {t.ctaText}
        </p>
        <a
          href={wizardHref}
          style={{
            display: 'inline-block',
            background: 'var(--color-primary)', color: '#fff',
            borderRadius: 12, padding: '13px 24px',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            marginBottom: 10,
          }}
        >
          {t.ctaBtn} →
        </a>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#185FA5' }}>
          ℹ️ {t.ctaNote}
        </p>
      </div>

      {/* ── Link contatti secondario ─────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px', textAlign: 'center' }}>
        <a href={contactHref} style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'none' }}>
          Hai domande? Contattaci →
        </a>
      </div>

    </div>
  );
}
