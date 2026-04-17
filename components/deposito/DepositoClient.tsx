'use client';
import { useState } from 'react';
import type { Locale } from '@/config/i18n';

const T: Record<Locale, {
  title: string;
  subtitle: string;
  badge: string;
  // Sezione perché
  whyTitle: string;
  whyText: string;
  // Metodo offline
  offlineTitle: string;
  offlineSteps: string[];
  offlineNote: string;
  // Metodo online
  onlineTitle: string;
  onlineBadge: string;
  onlineSteps: string[];
  onlineNote: string;
  // Importi
  amountsTitle: string;
  amountsNote: string;
  amounts: { label: string; value: string }[];
  // Restituzione
  returnTitle: string;
  returnSteps: string[];
  // Danni
  damagesTitle: string;
  damagesText: string;
  // FAQ
  faqTitle: string;
  faqs: { q: string; a: string }[];
  // CTA
  ctaTitle: string;
  ctaText: string;
  ctaBtn: string;
  ctaNote: string;
  // Card labels
  offline: string;
  online: string;
}> = {

  // ── ITALIANO ────────────────────────────────────────────────────────────────
  it: {
    title: 'Deposito cauzionale',
    subtitle: 'Come funziona, quanto è, quando viene restituito.',
    badge: 'Obbligatorio per tutte le prenotazioni',

    whyTitle: 'Perché viene richiesto?',
    whyText: 'Il deposito cauzionale tutela la struttura da eventuali danni accidentali durante il soggiorno. Non è un costo aggiuntivo: viene restituito integralmente entro 48 ore dalla partenza se non ci sono danni. Puoi versarlo in due modi: in persona all\'arrivo con carta di credito, oppure online in anticipo tramite Stripe.',

    offlineTitle: 'Offline — carta di credito all\'arrivo',
    offlineSteps: [
      'Presentati alla receptionist con la tua Carta di Credito (no Debit Card, no PostePay).',
      'La receptionist compila il modulo di autorizzazione che firmerai.',
      'Il modulo viene conservato fino alla partenza e poi distrutto.',
      'Nessuna pre-autorizzazione sulla tua carta: è solo una garanzia cartacea.',
    ],
    offlineNote: 'Puoi cambiare idea e scegliere il pagamento online in qualsiasi momento dalla tua Area Ospiti.',

    onlineTitle: 'Online — pre-autorizzazione Stripe',
    onlineBadge: 'Certificazione PCI DSS Level 1',
    onlineSteps: [
      'Accedi alla tua Area Ospiti con numero prenotazione ed email.',
      'Seleziona "Deposito cauzionale" e scegli il metodo online.',
      'Stripe blocca la cifra sulla tua carta in pre-autorizzazione — nessun addebito reale.',
      'Ricevi conferma immediata via email.',
    ],
    onlineNote: 'I tuoi dati carta non vengono mai condivisi con noi. Stripe è certificato PCI DSS Level 1, lo stesso standard delle banche.',

    amountsTitle: 'Importi per struttura',
    amountsNote: 'L\'importo esatto è indicato nella scheda di ogni appartamento. A titolo indicativo:',
    amounts: [
      { label: 'Monolocale / Bilocale', value: '€ 200' },
      { label: 'Trilocale', value: '€ 300' },
      { label: 'Villa / Casa grande', value: '€ 500' },
    ],

    returnTitle: 'Quando viene restituito?',
    returnSteps: [
      'Il personale effettua un controllo della struttura entro 2 ore dal check-out.',
      'In assenza di danni, il deposito viene restituito entro 48 ore dalla partenza.',
      'Per il metodo online (Stripe), la pre-autorizzazione decade automaticamente in 7–30 giorni a seconda del circuito (Visa, Mastercard, Amex).',
      'In caso di danni, ti verrà inviata una documentazione fotografica e una stima dei costi prima di qualsiasi trattenuta.',
    ],

    damagesTitle: 'Cosa succede in caso di danni?',
    damagesText: 'Se vengono riscontrati danni, ti contatteremo entro 24 ore dalla partenza con documentazione fotografica e dettaglio dei costi. Potrai contestare o concordare l\'importo prima che venga effettuata qualsiasi trattenuta. La trattenuta è sempre proporzionale al danno effettivo e mai superiore all\'importo del deposito.',

    faqTitle: 'Domande frequenti',
    faqs: [
      {
        q: 'Posso pagare con carta prepagata o Postepay?',
        a: 'No. È richiesta una Carta di Credito vera (Visa, Mastercard, Amex). Le carte di debito e le prepagate non vengono accettate né per il metodo offline né per quello online.',
      },
      {
        q: 'Il deposito viene addebitato subito con il metodo online?',
        a: 'No. Stripe effettua una pre-autorizzazione: la cifra viene "bloccata" sulla tua carta ma non addebitata. Se non ci sono danni, il blocco decade automaticamente senza nessun addebito.',
      },
      {
        q: 'Cosa succede se dimentico di versare il deposito prima dell\'arrivo?',
        a: 'Nessun problema. Puoi sempre versarlo in persona all\'arrivo con la tua carta di credito. Ti consigliamo però di portarla con te.',
      },
      {
        q: 'Il deposito è lo stesso per ogni appartamento?',
        a: 'No. L\'importo varia in base alla dimensione e al tipo di struttura. Lo trovi indicato nella scheda dell\'appartamento che hai prenotato.',
      },
      {
        q: 'Posso contestare una trattenuta?',
        a: 'Sì. Prima di qualsiasi trattenuta ti inviamo documentazione fotografica e dettaglio dei costi. Puoi contestare l\'importo e concordare una soluzione. In caso di disaccordo, sono disponibili le procedure di contestazione della tua banca o di PayPal.',
      },
    ],

    ctaTitle: 'Pronto a versare il deposito online?',
    ctaText: 'Accedi alla tua Area Ospiti con numero prenotazione ed email per procedere.',
    ctaBtn: 'Vai all\'Area Ospiti',
    ctaNote: 'Ti serve il numero di prenotazione — lo trovi nell\'email di conferma.',

    offline: 'All\'arrivo',
    online: 'Online (Stripe)',
  },

  // ── ENGLISH ─────────────────────────────────────────────────────────────────
  en: {
    title: 'Security deposit',
    subtitle: 'How it works, how much it is, and when it is refunded.',
    badge: 'Required for all bookings',

    whyTitle: 'Why is it required?',
    whyText: 'The security deposit protects the property against accidental damage during your stay. It is not an extra charge: it is refunded in full within 48 hours of departure if there is no damage. You can pay it in two ways: in person on arrival with a credit card, or online in advance via Stripe.',

    offlineTitle: 'Offline — credit card on arrival',
    offlineSteps: [
      'Present yourself to reception with your Credit Card (no Debit Card, no PostePay).',
      'The receptionist will fill in an authorisation form which you will sign.',
      'The form is kept until your departure and then destroyed.',
      'No pre-authorisation on your card: it is a paper guarantee only.',
    ],
    offlineNote: 'You can change your mind and switch to the online payment method at any time from your Guest Area.',

    onlineTitle: 'Online — Stripe pre-authorisation',
    onlineBadge: 'PCI DSS Level 1 Certified',
    onlineSteps: [
      'Log in to your Guest Area with your booking number and email.',
      'Select "Security deposit" and choose the online method.',
      'Stripe places a hold on your card — no actual charge is made.',
      'You receive immediate confirmation by email.',
    ],
    onlineNote: 'Your card details are never shared with us. Stripe is PCI DSS Level 1 certified — the same standard used by banks.',

    amountsTitle: 'Amounts by property',
    amountsNote: 'The exact amount is shown on each apartment listing. As a guide:',
    amounts: [
      { label: 'Studio / One-bedroom', value: '€ 200' },
      { label: 'Two-bedroom', value: '€ 300' },
      { label: 'Villa / Large house', value: '€ 500' },
    ],

    returnTitle: 'When is it refunded?',
    returnSteps: [
      'Staff carry out a property inspection within 2 hours of check-out.',
      'If there is no damage, the deposit is refunded within 48 hours of departure.',
      'For the online method (Stripe), the pre-authorisation expires automatically in 7–30 days depending on the card network (Visa, Mastercard, Amex).',
      'If there is damage, you will receive photographic documentation and a cost estimate before any deduction is made.',
    ],

    damagesTitle: 'What happens if there is damage?',
    damagesText: 'If damage is found, we will contact you within 24 hours of departure with photographic documentation and a cost breakdown. You will be able to dispute or agree on the amount before any deduction is made. Any deduction is always proportionate to the actual damage and never exceeds the deposit amount.',

    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: 'Can I pay with a prepaid card or PostePay?',
        a: 'No. A real Credit Card is required (Visa, Mastercard, Amex). Debit cards and prepaid cards are not accepted for either the offline or online method.',
      },
      {
        q: 'Is the deposit charged immediately with the online method?',
        a: 'No. Stripe places a pre-authorisation: the amount is "held" on your card but not charged. If there is no damage, the hold expires automatically with no charge.',
      },
      {
        q: 'What if I forget to pay the deposit before arrival?',
        a: 'No problem. You can always pay in person on arrival with your credit card. We recommend you bring it with you.',
      },
      {
        q: 'Is the deposit the same for every apartment?',
        a: 'No. The amount varies based on the size and type of property. You will find it on the listing for the apartment you have booked.',
      },
      {
        q: 'Can I dispute a deduction?',
        a: 'Yes. Before any deduction we will send you photographic documentation and a cost breakdown. You can dispute the amount and agree on a solution. If there is a disagreement, your bank\'s chargeback procedure or PayPal\'s dispute process are available.',
      },
    ],

    ctaTitle: 'Ready to pay the deposit online?',
    ctaText: 'Log in to your Guest Area with your booking number and email to proceed.',
    ctaBtn: 'Go to Guest Area',
    ctaNote: 'You will need your booking number — it is in your confirmation email.',

    offline: 'On arrival',
    online: 'Online (Stripe)',
  },

  // ── DEUTSCH ─────────────────────────────────────────────────────────────────
  de: {
    title: 'Kaution',
    subtitle: 'Wie sie funktioniert, wie hoch sie ist und wann sie zurückerstattet wird.',
    badge: 'Für alle Buchungen erforderlich',

    whyTitle: 'Warum wird sie verlangt?',
    whyText: 'Die Kaution schützt die Unterkunft vor eventuellen Schäden während des Aufenthalts. Sie ist kein zusätzlicher Kostenpunkt: Sie wird innerhalb von 48 Stunden nach der Abreise vollständig zurückerstattet, wenn keine Schäden vorliegen. Sie können sie auf zwei Arten hinterlegen: persönlich bei der Ankunft mit Kreditkarte oder online im Voraus über Stripe.',

    offlineTitle: 'Offline — Kreditkarte bei der Ankunft',
    offlineSteps: [
      'Erscheinen Sie an der Rezeption mit Ihrer Kreditkarte (keine Debitkarte, keine Prepaid-Karte).',
      'Die Rezeptionistin füllt ein Autorisierungsformular aus, das Sie unterschreiben.',
      'Das Formular wird bis zur Abreise aufbewahrt und dann vernichtet.',
      'Keine Vorautorisierung auf Ihrer Karte: Es handelt sich nur um eine schriftliche Garantie.',
    ],
    offlineNote: 'Sie können jederzeit auf die Online-Zahlung wechseln, und zwar über Ihren Gästebereich.',

    onlineTitle: 'Online — Stripe-Vorautorisierung',
    onlineBadge: 'PCI-DSS-Level-1-Zertifizierung',
    onlineSteps: [
      'Melden Sie sich mit Buchungsnummer und E-Mail in Ihrem Gästebereich an.',
      'Wählen Sie „Kaution" und dann die Online-Methode.',
      'Stripe sperrt den Betrag auf Ihrer Karte — kein tatsächlicher Abbuchung.',
      'Sie erhalten sofort eine Bestätigung per E-Mail.',
    ],
    onlineNote: 'Ihre Kartendaten werden niemals mit uns geteilt. Stripe ist PCI DSS Level 1 zertifiziert — derselbe Standard wie bei Banken.',

    amountsTitle: 'Beträge nach Unterkunft',
    amountsNote: 'Der genaue Betrag ist im Angebot jeder Wohnung angegeben. Als Richtwert:',
    amounts: [
      { label: 'Studio / Einzimmerwohnung', value: '€ 200' },
      { label: 'Zweizimmerwohnung', value: '€ 300' },
      { label: 'Villa / Großes Haus', value: '€ 500' },
    ],

    returnTitle: 'Wann wird sie zurückerstattet?',
    returnSteps: [
      'Das Personal führt innerhalb von 2 Stunden nach dem Check-out eine Inspektion durch.',
      'Bei keinen Schäden wird die Kaution innerhalb von 48 Stunden nach der Abreise zurückerstattet.',
      'Bei der Online-Methode (Stripe) verfällt die Vorautorisierung je nach Kartennetz (Visa, Mastercard, Amex) automatisch in 7–30 Tagen.',
      'Bei Schäden erhalten Sie Fotodokumentation und eine Kostenschätzung, bevor ein Abzug erfolgt.',
    ],

    damagesTitle: 'Was passiert bei Schäden?',
    damagesText: 'Wenn Schäden festgestellt werden, kontaktieren wir Sie innerhalb von 24 Stunden nach der Abreise mit Fotodokumentation und einer Kostenaufstellung. Sie können den Betrag anfechten oder vereinbaren, bevor ein Abzug vorgenommen wird. Jeder Abzug ist immer proportional zum tatsächlichen Schaden und übersteigt nie den Kautionsbetrag.',

    faqTitle: 'Häufig gestellte Fragen',
    faqs: [
      {
        q: 'Kann ich mit einer Prepaid-Karte bezahlen?',
        a: 'Nein. Es ist eine echte Kreditkarte erforderlich (Visa, Mastercard, Amex). Debit- und Prepaid-Karten werden weder für die Offline- noch für die Online-Methode akzeptiert.',
      },
      {
        q: 'Wird die Kaution bei der Online-Methode sofort abgebucht?',
        a: 'Nein. Stripe führt eine Vorautorisierung durch: Der Betrag wird auf Ihrer Karte „gesperrt", aber nicht abgebucht. Bei keinen Schäden verfällt die Sperre automatisch ohne Abbuchung.',
      },
      {
        q: 'Was, wenn ich vergesse, die Kaution vor der Ankunft zu hinterlegen?',
        a: 'Kein Problem. Sie können sie immer persönlich bei der Ankunft mit Ihrer Kreditkarte hinterlegen. Wir empfehlen, sie mitzubringen.',
      },
      {
        q: 'Ist die Kaution für jede Wohnung gleich?',
        a: 'Nein. Der Betrag variiert je nach Größe und Art der Unterkunft. Sie finden ihn im Angebot der von Ihnen gebuchten Wohnung.',
      },
      {
        q: 'Kann ich einen Abzug anfechten?',
        a: 'Ja. Vor jedem Abzug senden wir Ihnen Fotodokumentation und eine Kostenaufstellung. Sie können den Betrag anfechten und eine Lösung vereinbaren. Bei Uneinigkeit stehen das Chargeback-Verfahren Ihrer Bank oder das Streitbeilegungsverfahren von PayPal zur Verfügung.',
      },
    ],

    ctaTitle: 'Kaution online hinterlegen?',
    ctaText: 'Melden Sie sich mit Buchungsnummer und E-Mail in Ihrem Gästebereich an.',
    ctaBtn: 'Zum Gästebereich',
    ctaNote: 'Sie benötigen Ihre Buchungsnummer — Sie finden sie in Ihrer Bestätigungs-E-Mail.',

    offline: 'Bei der Ankunft',
    online: 'Online (Stripe)',
  },

  // ── POLSKI ──────────────────────────────────────────────────────────────────
  pl: {
    title: 'Kaucja',
    subtitle: 'Jak działa, ile wynosi i kiedy jest zwracana.',
    badge: 'Wymagana przy wszystkich rezerwacjach',

    whyTitle: 'Dlaczego jest wymagana?',
    whyText: 'Kaucja chroni obiekt przed ewentualnymi szkodami podczas pobytu. Nie jest to dodatkowy koszt: jest zwracana w całości w ciągu 48 godzin od wyjazdu, jeśli nie ma żadnych szkód. Możesz ją wpłacić na dwa sposoby: osobiście przy zameldowaniu kartą kredytową lub online z wyprzedzeniem przez Stripe.',

    offlineTitle: 'Offline — karta kredytowa przy zameldowaniu',
    offlineSteps: [
      'Zgłoś się do recepcji z kartą kredytową (nie debetową, nie przedpłaconą).',
      'Recepcjonista wypełni formularz autoryzacji, który podpiszesz.',
      'Formularz jest przechowywany do wymeldowania, a następnie niszczony.',
      'Brak pre-autoryzacji na Twojej karcie — to tylko pisemna gwarancja.',
    ],
    offlineNote: 'Możesz zmienić zdanie i wybrać płatność online w dowolnym momencie ze swojego Obszaru Gościa.',

    onlineTitle: 'Online — pre-autoryzacja Stripe',
    onlineBadge: 'Certyfikat PCI DSS Level 1',
    onlineSteps: [
      'Zaloguj się do Obszaru Gościa numerem rezerwacji i adresem e-mail.',
      'Wybierz „Kaucja" i metodę online.',
      'Stripe blokuje kwotę na Twojej karcie — bez rzeczywistego obciążenia.',
      'Natychmiast otrzymujesz potwierdzenie e-mailem.',
    ],
    onlineNote: 'Dane Twojej karty nigdy nie są udostępniane nam. Stripe jest certyfikowany PCI DSS Level 1 — ten sam standard co w bankach.',

    amountsTitle: 'Kwoty według obiektu',
    amountsNote: 'Dokładna kwota jest podana w opisie każdego apartamentu. Orientacyjnie:',
    amounts: [
      { label: 'Kawalerka / Mieszkanie 1-pokojowe', value: '€ 200' },
      { label: 'Mieszkanie 2-pokojowe', value: '€ 300' },
      { label: 'Willa / Duży dom', value: '€ 500' },
    ],

    returnTitle: 'Kiedy jest zwracana?',
    returnSteps: [
      'Personel przeprowadza kontrolę obiektu w ciągu 2 godzin od wymeldowania.',
      'W przypadku braku szkód kaucja jest zwracana w ciągu 48 godzin od wyjazdu.',
      'W przypadku metody online (Stripe) pre-autoryzacja wygasa automatycznie w ciągu 7–30 dni, w zależności od sieci kartowej (Visa, Mastercard, Amex).',
      'W przypadku szkód otrzymasz dokumentację fotograficzną i kosztorys przed jakimkolwiek potrąceniem.',
    ],

    damagesTitle: 'Co się dzieje w przypadku szkód?',
    damagesText: 'Jeśli zostaną stwierdzone szkody, skontaktujemy się z Tobą w ciągu 24 godzin od wyjazdu z dokumentacją fotograficzną i zestawieniem kosztów. Będziesz mógł zakwestionować lub uzgodnić kwotę przed dokonaniem jakiegokolwiek potrącenia. Każde potrącenie jest zawsze proporcjonalne do rzeczywistych szkód i nigdy nie przekracza kwoty kaucji.',

    faqTitle: 'Często zadawane pytania',
    faqs: [
      {
        q: 'Czy mogę zapłacić kartą przedpłaconą?',
        a: 'Nie. Wymagana jest prawdziwa karta kredytowa (Visa, Mastercard, Amex). Karty debetowe i przedpłacone nie są akceptowane ani w metodzie offline, ani online.',
      },
      {
        q: 'Czy kaucja jest pobierana natychmiast przy metodzie online?',
        a: 'Nie. Stripe dokonuje pre-autoryzacji: kwota jest „zablokowana" na Twojej karcie, ale nie pobrana. Jeśli nie ma szkód, blokada automatycznie wygasa bez obciążenia.',
      },
      {
        q: 'Co jeśli zapomnę wpłacić kaucję przed przyjazdem?',
        a: 'Żaden problem. Zawsze możesz wpłacić ją osobiście przy zameldowaniu kartą kredytową. Zalecamy jednak jej zabranie.',
      },
      {
        q: 'Czy kaucja jest taka sama dla każdego apartamentu?',
        a: 'Nie. Kwota zależy od wielkości i rodzaju obiektu. Znajdziesz ją w opisie zarezerwowanego apartamentu.',
      },
      {
        q: 'Czy mogę zakwestionować potrącenie?',
        a: 'Tak. Przed jakimkolwiek potrąceniem przesyłamy Ci dokumentację fotograficzną i zestawienie kosztów. Możesz zakwestionować kwotę i uzgodnić rozwiązanie. W razie sporu dostępne są procedury chargeback Twojego banku lub procedura sporów PayPal.',
      },
    ],

    ctaTitle: 'Gotowy wpłacić kaucję online?',
    ctaText: 'Zaloguj się do Obszaru Gościa numerem rezerwacji i adresem e-mail.',
    ctaBtn: 'Przejdź do Obszaru Gościa',
    ctaNote: 'Będziesz potrzebować numeru rezerwacji — znajdziesz go w e-mailu potwierdzającym.',

    offline: 'Przy zameldowaniu',
    online: 'Online (Stripe)',
  },
};

// ─── Componente step ────────────────────────────────────────────────────────
function StepCard({ n, text }: { n: number; text: string }) {
  return (
    <div className="d-flex gap-3 py-3 border-bottom">
      <div
        className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
        style={{ width: 28, height: 28, background: '#1E73BE', fontSize: 13, marginTop: 2 }}
      >
        {n}
      </div>
      <p className="m-0 small text-secondary" style={{ lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

// ─── Componente FAQ ─────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-bottom">
      <button
        onClick={() => setOpen(!open)}
        className="btn w-100 d-flex justify-content-between align-items-center gap-2 py-3 px-0 text-start"
      >
        <span className="small fw-semibold text-dark" style={{ lineHeight: 1.4 }}>{q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#9ca3af" strokeWidth="2.5"
          className="flex-shrink-0"
          style={{ transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <p className="small text-secondary mb-3" style={{ lineHeight: 1.65 }}>{a}</p>
      )}
    </div>
  );
}

// ─── Componente principale ──────────────────────────────────────────────────
interface Props { locale: Locale; contactHref: string; portalHref: string; }

export default function DepositoClient({ locale, contactHref, portalHref }: Props) {
  const t = T[locale];

  return (
    <div className="mx-auto pb-5" style={{ maxWidth: 720 }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="bg-white px-3 pt-4 pb-3 border-bottom mb-2">
        <div
          className="d-inline-block mb-2 fw-bold rounded-pill"
          style={{ background: '#FFF8E7', color: '#92400e', fontSize: 12, padding: '4px 12px' }}
        >
          💳 {t.badge}
        </div>
        <h1 className="fs-2 fw-bold text-dark mb-2" style={{ lineHeight: 1.2 }}>
          {t.title}
        </h1>
        <p className="m-0 text-secondary" style={{ fontSize: 15, lineHeight: 1.55 }}>
          {t.subtitle}
        </p>
      </div>

      {/* ── Perché ──────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 mb-2">
        <h2 className="fs-6 fw-bold text-dark mb-2">
          {t.whyTitle}
        </h2>
        <p className="m-0 small text-secondary" style={{ lineHeight: 1.7 }}>
          {t.whyText}
        </p>
      </div>

      {/* ── Due metodi ──────────────────────────────────────────────────────── */}
      <div className="d-grid gap-2 pb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

        {/* Offline */}
        <div className="bg-white p-3">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ fontSize: 20 }}>🏨</span>
            <h2 className="fs-6 fw-bold text-dark m-0">{t.offlineTitle}</h2>
          </div>
          {t.offlineSteps.map((step, i) => (
            <StepCard key={i} n={i + 1} text={step} />
          ))}
          <p className="mt-3 mb-0 text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            ℹ️ {t.offlineNote}
          </p>
        </div>

        {/* Online */}
        <div className="p-3 border-top border-2" style={{ background: '#EEF5FC', borderColor: '#1E73BE' }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ fontSize: 20 }}>🔒</span>
            <h2 className="fs-6 fw-bold m-0" style={{ color: '#0C447C' }}>{t.onlineTitle}</h2>
          </div>
          <div
            className="d-inline-block mb-2 fw-bold text-white rounded-pill"
            style={{ background: '#1E73BE', fontSize: 10, padding: '3px 8px' }}
          >
            {t.onlineBadge}
          </div>
          {t.onlineSteps.map((step, i) => (
            <StepCard key={i} n={i + 1} text={step} />
          ))}
          <p className="mt-3 mb-0" style={{ fontSize: 12, color: '#185FA5', lineHeight: 1.5 }}>
            🔐 {t.onlineNote}
          </p>
        </div>

      </div>

      {/* ── Importi ─────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 mb-2">
        <h2 className="fs-6 fw-bold text-dark mb-2">
          {t.amountsTitle}
        </h2>
        <p className="text-muted mb-3" style={{ fontSize: 13 }}>{t.amountsNote}</p>
        <div className="d-flex flex-column">
          {t.amounts.map((row, i) => (
            <div
              key={i}
              className={`d-flex justify-content-between align-items-center py-2${i < t.amounts.length - 1 ? ' border-bottom' : ''}`}
            >
              <span className="small" style={{ color: '#374151' }}>{row.label}</span>
              <span className="fw-bold" style={{ fontSize: 15, color: '#1E73BE' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Restituzione ────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 mb-2">
        <h2 className="fs-6 fw-bold text-dark mb-1">
          {t.returnTitle}
        </h2>
        {t.returnSteps.map((step, i) => (
          <StepCard key={i} n={i + 1} text={step} />
        ))}
      </div>

      {/* ── Danni ───────────────────────────────────────────────────────────── */}
      <div className="border p-3 mb-2" style={{ background: '#FFF8E7', borderColor: '#FDE68A' }}>
        <h2 className="fs-6 fw-bold mb-2" style={{ color: '#92400e' }}>
          ⚠️ {t.damagesTitle}
        </h2>
        <p className="m-0 small" style={{ color: '#78350f', lineHeight: 1.7 }}>
          {t.damagesText}
        </p>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 mb-2">
        <h2 className="fs-6 fw-bold text-dark mb-1">
          {t.faqTitle}
        </h2>
        {t.faqs.map((f, i) => (
          <FaqItem key={i} {...f} />
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <div className="p-3 mb-2 border-top border-2" style={{ background: '#EEF5FC', borderColor: '#1E73BE' }}>
        <h2 className="fs-5 fw-bold mb-2" style={{ color: '#0C447C' }}>
          {t.ctaTitle}
        </h2>
        <p className="small mb-3" style={{ color: '#185FA5', lineHeight: 1.6 }}>
          {t.ctaText}
        </p>
        <a
          href={portalHref}
          className="d-inline-block text-white fw-bold text-decoration-none rounded-3 mb-2"
          style={{ background: '#1E73BE', padding: '13px 24px', fontSize: 15 }}
        >
          {t.ctaBtn} →
        </a>
        <p className="mb-0" style={{ fontSize: 12, color: '#185FA5' }}>
          ℹ️ {t.ctaNote}
        </p>
      </div>

      {/* ── Link contatti ────────────────────────────────────────────────────── */}
      <div className="p-3 text-center">
        <a href={contactHref} className="small text-decoration-none" style={{ color: '#1E73BE' }}>
          Hai domande? Contattaci →
        </a>
      </div>

    </div>
  );
}
