import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// ─── Testi per lingua ─────────────────────────────────────────────────────────

type Sections = { title: string; body: React.ReactNode }[];

function getContent(locale: Locale): { h1: string; subtitle: string; sections: Sections } {
  const ul = ulStyle;

  const data: Record<Locale, { h1: string; subtitle: string; sections: Sections }> = {
    it: {
      h1: 'Condizioni generali di vendita',
      subtitle: 'Tutte le condizioni per la tua vacanza a LivingApple',
      sections: [
        { title: '1. Premessa', body: (<>
          <p>Nelle presenti "Condizioni generali di locazione" si intende:</p>
          <p>per <strong>"Cliente"</strong> colui che effettua la Prenotazione ed usufruisce dei servizi e degli immobili offerti in locazione da LivingApple;</p>
          <p>per <strong>"Prenotazione"</strong> la richiesta del Cliente di prendere in locazione un appartamento per un certo periodo;</p>
          <p>per <strong>"Proposta di Contratto"</strong> la comunicazione di disponibilità contenente il dettaglio dell'offerta e l'invito ad inviare l'acconto;</p>
          <p>per <strong>"Lettera di Conferma"</strong> la comunicazione di conferma del ricevimento dell'acconto con il codice di conferma;</p>
          <p>per <strong>"Contratto di Locazione"</strong> le condizioni di servizio concluse tra LivingApple e il cliente.</p>
        </>) },
        { title: '2. Prenotazione e perfezionamento', body: (<p>La Prenotazione si intende perfezionata nel momento in cui il Cliente riceve la Lettera di Conferma spedita da LivingApple immediatamente dopo aver ricevuto la caparra. Al Contratto di Locazione è allegato un modulo Elenco Inquilini, che dovrà essere compilato, sottoscritto e rispedito a LivingApple.</p>) },
        { title: '3. Acconto, pagamento e deposito cauzionale', body: (<>
          <p>L'acconto corrisponde al 30% (minimo € 150,00) del canone e può essere versato tramite bonifico, carta di credito (+2,5%) o PayPal (+3,4%). Deve pervenire entro 7 giorni dalla comunicazione della disponibilità (3 giorni per pagamento online).</p>
          <p>Il saldo del canone e il deposito cauzionale devono essere versati in contanti o con pre-autorizzazione di carta di credito all'arrivo, contestualmente al ritiro delle chiavi.</p>
        </>) },
        { title: '4. Disdetta e recesso', body: (<>
          <p>Una prenotazione confermata non può essere annullata o modificata. Ogni richiesta di cancellazione dovrà essere comunicata via email a LivingApple. Per prenotazioni a tariffa scontata o nei periodi festivi, ogni cancellazione prevede il pagamento del 100% del valore.</p>
          <ul style={ul}>
            <li><strong>60+ giorni prima:</strong> 50% dell'acconto (min. € 150,00)</li>
            <li><strong>59–15 giorni prima:</strong> acconto + 25% del saldo dovuto</li>
            <li><strong>14–01 giorni prima:</strong> pagamento dell'intero saldo</li>
          </ul>
        </>) },
        { title: '5. Arrivo e partenza', body: (<>
          <p>Almeno 3 giorni prima dell'arrivo devono essere inviati via email i dettagli di arrivo. Il check-in è previsto dalle 17:00 alle 20:00. Arrivi tardivi:</p>
          <ul style={ul}>
            <li>€ 30,00 dalle 20:00 alle 22:00</li>
            <li>€ 50,00 dalle 22:00 alle 24:00</li>
          </ul>
          <p>Non è possibile effettuare il check-in dopo le 24:00 né il check-out prima delle 8:00. All'arrivo devono essere esibiti i documenti d'identità di tutti gli occupanti.</p>
        </>) },
        { title: '6. Dotazione delle abitazioni', body: (<p>Tutti gli appartamenti sono consegnati arredati con cucina a gas, frigorifero, batteria da cucina, acqua calda e fredda, energia elettrica 220V. Per ogni posto letto sono disponibili coperta e guanciale. Su richiesta è possibile noleggiare lenzuola e asciugamani.</p>) },
        { title: '7. Partenza', body: (<p>L'appartamento deve essere lasciato libero tra le 7:00 e le 10:00. Deve essere lasciato privo di immondizie, con ripiani puliti, stoviglie lavate, frigorifero vuoto con porta aperta. I mobili non devono essere spostati né lasciati all'esterno.</p>) },
        { title: '8. Norme di soggiorno', body: (<>
          <p>È vietato ospitare più persone di quanto consentito dal numero di posti letto. I bambini oltre i 24 mesi sono considerati adulti. È vietato lasciare arredi all'esterno, lasciare aperte tende da sole, usare il bbq con legna.</p>
          <p>Gli ospiti sono tenuti a rispettare le norme sulla quiete, specialmente nelle ore pomeridiane e notturne.</p>
        </>) },
        { title: '9. Aree esterne e pic nic', body: (<p>L'accesso all'area Pic Nic è consentito dalle 11:00 alle 24:00. I bambini devono essere sorvegliati. Non sono ammessi vetro, animali, biciclette o skateboard. Il numero di ospiti è limitato a quanto indicato nel contratto.</p>) },
        { title: '10. Piscina', body: (<p>La piscina è riservata agli ospiti LivingApple della sede di Via Tore. Gli ospiti di LivingApple Beach <strong>non hanno accesso alla piscina</strong>. Aperta dalle 9:00 alle 19:00. I bambini sotto i 12 anni devono essere accompagnati. Vietati salti e contenitori di vetro.</p>) },
        { title: '11. Sanzioni', body: (<p>Per l'inosservanza delle regole di cui ai punti 7 e 8 sono previste sanzioni da € 10,00 a € 500,00 e maggiorazioni sul costo delle pulizie finali.</p>) },
        { title: '12. Deposito cauzionale', body: (<p>A garanzia del rispetto delle norme, è richiesta una cauzione il cui importo varia in base all'appartamento prenotato, al momento della consegna delle chiavi. La cauzione viene restituita dopo la verifica dello stato dell'appartamento.</p>) },
        { title: '13. Responsabilità', body: (<p>Nessuna responsabilità può essere attribuita a LivingApple per rotture, infortuni, smarrimenti, furti, ritardi o inconvenienti. Per eventuali controversie legali, il Foro esclusivo competente è quello di Cassino (FR).</p>) },
        { title: '14. Accettazione', body: (<p>All'atto della prenotazione il locatario accetta espressamente tutte le condizioni qui esposte.</p>) },
      ],
    },

    en: {
      h1: 'General Terms & Conditions',
      subtitle: 'All conditions for your holiday at LivingApple',
      sections: [
        { title: '1. Definitions', body: (<>
          <p>In these "General Rental Terms" the following definitions apply:</p>
          <p><strong>"Customer"</strong> — the person making the Booking and using the services and properties offered by LivingApple;</p>
          <p><strong>"Booking"</strong> — the Customer's request to rent an apartment for a specific period;</p>
          <p><strong>"Contract Proposal"</strong> — LivingApple's communication confirming availability, detailing the offer and requesting the deposit;</p>
          <p><strong>"Confirmation Letter"</strong> — LivingApple's confirmation of receipt of the deposit with the booking confirmation code;</p>
          <p><strong>"Rental Agreement"</strong> — the service terms concluded between LivingApple and the customer.</p>
        </>) },
        { title: '2. Booking and conclusion', body: (<p>The Booking is considered finalised when the Customer receives the Confirmation Letter, sent by LivingApple immediately upon receipt of the deposit. The Rental Agreement includes a Guest List form which must be completed, signed and returned to LivingApple as soon as possible.</p>) },
        { title: '3. Deposit, payment and security deposit', body: (<>
          <p>The advance deposit equals 30% of the rental fee (minimum €150.00) and may be paid by bank transfer, credit card (+2.5%) or PayPal (+3.4%). It must be received within 7 days of the availability notification (3 days for online payment).</p>
          <p>The balance and security deposit must be paid in cash or by credit card pre-authorisation upon arrival when collecting the keys.</p>
        </>) },
        { title: '4. Cancellation', body: (<>
          <p>A confirmed booking cannot be cancelled or modified. Any cancellation request must be communicated by email. For discounted rates or holiday periods, any cancellation requires payment of 100% of the booking value.</p>
          <ul style={ul}>
            <li><strong>60+ days before:</strong> 50% of the advance deposit (min. €150.00)</li>
            <li><strong>59–15 days before:</strong> full advance deposit + 25% of the remaining balance</li>
            <li><strong>14–01 days before:</strong> full balance payment</li>
          </ul>
        </>) },
        { title: '5. Arrival and departure', body: (<>
          <p>Arrival details must be sent by email at least 3 days before the arrival date. Check-in is scheduled between 17:00 and 20:00. Late arrivals:</p>
          <ul style={ul}>
            <li>€30.00 from 20:00 to 22:00</li>
            <li>€50.00 from 22:00 to 24:00</li>
          </ul>
          <p>Check-in after midnight and check-out before 08:00 are not possible. All occupants must present identity documents upon arrival.</p>
        </>) },
        { title: '6. Property equipment', body: (<p>All apartments are fully furnished and include a gas cooker, refrigerator, kitchen equipment, hot and cold running water, and 220V electricity. One blanket and pillow are provided per bed. Bed linen and towels can be hired on request.</p>) },
        { title: '7. Departure', body: (<p>The apartment must be vacated between 07:00 and 10:00. It must be left free of rubbish, with clean shelves, washed crockery, an empty fridge with the door open. Furniture must not be moved or left outside.</p>) },
        { title: '8. House rules', body: (<>
          <p>Accommodating more guests than the number of beds permits is strictly prohibited. Children over 24 months are counted as adults. Leaving furniture outside, leaving retractable awnings open when vacating, and using the barbecue with wood are not permitted.</p>
          <p>Guests must observe quiet hours, especially in the afternoon and at night.</p>
        </>) },
        { title: '9. Outdoor areas and picnic area', body: (<p>The picnic area is accessible from 11:00 to 24:00. Children must be supervised. Glass, animals, bicycles and skateboards are not permitted. The number of guests is limited to those specified in the contract.</p>) },
        { title: '10. Swimming pool', body: (<p>The pool is reserved exclusively for guests at the Via Tore property. LivingApple Beach guests <strong>do not have pool access</strong>. Open 09:00–19:00. Children under 12 must be accompanied. Diving, jumping and glass containers are prohibited.</p>) },
        { title: '11. Penalties', body: (<p>Failure to comply with the rules in sections 7 and 8 may result in penalties ranging from €10.00 to €500.00 and surcharges on final cleaning costs.</p>) },
        { title: '12. Security deposit', body: (<p>A security deposit is required upon key collection, as a guarantee of compliance with these rules. The amount varies depending on the apartment booked. The deposit is returned after the apartment has been inspected.</p>) },
        { title: '13. Liability', body: (<p>LivingApple accepts no liability for breakages, injuries, losses, thefts, delays or inconveniences of any kind. Any legal disputes shall be subject to the exclusive jurisdiction of the Court of Cassino (FR), Italy.</p>) },
        { title: '14. Acceptance', body: (<p>By making a booking, the customer expressly accepts all the terms and conditions set out herein.</p>) },
      ],
    },

    de: {
      h1: 'Allgemeine Geschäftsbedingungen',
      subtitle: 'Alle Bedingungen für Ihren Urlaub bei LivingApple',
      sections: [
        { title: '1. Begriffsbestimmungen', body: (<>
          <p>In diesen "Allgemeinen Mietbedingungen" gelten folgende Definitionen:</p>
          <p><strong>"Kunde"</strong> — die Person, die die Buchung vornimmt und die von LivingApple angebotenen Dienste und Unterkünfte nutzt;</p>
          <p><strong>"Buchung"</strong> — die Anfrage des Kunden, eine Unterkunft für einen bestimmten Zeitraum zu mieten;</p>
          <p><strong>"Vertragsangebot"</strong> — die Mitteilung von LivingApple über die Verfügbarkeit mit Angebotsdetails und Aufforderung zur Anzahlung;</p>
          <p><strong>"Bestätigungsschreiben"</strong> — die Bestätigung des Eingangs der Anzahlung mit dem Buchungsbestätigungscode;</p>
          <p><strong>"Mietvertrag"</strong> — die zwischen LivingApple und dem Kunden vereinbarten Servicebedingungen.</p>
        </>) },
        { title: '2. Buchung und Vertragsabschluss', body: (<p>Die Buchung gilt als abgeschlossen, wenn der Kunde das Bestätigungsschreiben erhält, das LivingApple unmittelbar nach Eingang der Anzahlung verschickt. Dem Mietvertrag ist ein Gästelistenformular beigefügt, das ausgefüllt, unterzeichnet und so schnell wie möglich an LivingApple zurückgesendet werden muss.</p>) },
        { title: '3. Anzahlung, Zahlung und Kaution', body: (<>
          <p>Die Anzahlung beträgt 30% des Mietpreises (mindestens €150,00) und kann per Banküberweisung, Kreditkarte (+2,5%) oder PayPal (+3,4%) geleistet werden. Sie muss innerhalb von 7 Tagen nach der Verfügbarkeitsbestätigung eingehen (3 Tage bei Online-Zahlung).</p>
          <p>Der Restbetrag und die Kaution sind bei der Ankunft bei der Schlüsselübergabe in bar oder per Kreditkarten-Vorautorisierung zu zahlen.</p>
        </>) },
        { title: '4. Stornierung', body: (<>
          <p>Eine bestätigte Buchung kann weder storniert noch geändert werden. Jede Stornierungsanfrage muss per E-Mail mitgeteilt werden. Bei Sondertarifen oder Ferienzeiträumen ist bei jeder Stornierung 100% des Buchungswerts zu zahlen.</p>
          <ul style={ul}>
            <li><strong>60+ Tage vorher:</strong> 50% der Anzahlung (mind. €150,00)</li>
            <li><strong>59–15 Tage vorher:</strong> volle Anzahlung + 25% des verbleibenden Saldos</li>
            <li><strong>14–01 Tage vorher:</strong> vollständige Restzahlung</li>
          </ul>
        </>) },
        { title: '5. Ankunft und Abreise', body: (<>
          <p>Die Ankunftsdetails müssen mindestens 3 Tage vor der Ankunft per E-Mail mitgeteilt werden. Der Check-in ist zwischen 17:00 und 20:00 Uhr geplant. Späte Ankunft:</p>
          <ul style={ul}>
            <li>€30,00 von 20:00 bis 22:00 Uhr</li>
            <li>€50,00 von 22:00 bis 24:00 Uhr</li>
          </ul>
          <p>Ein Check-in nach Mitternacht und ein Check-out vor 08:00 Uhr sind nicht möglich. Alle Gäste müssen bei der Ankunft ihre Ausweisdokumente vorzeigen.</p>
        </>) },
        { title: '6. Ausstattung', body: (<p>Alle Apartments sind möbliert und verfügen über einen Gasherd, Kühlschrank, Küchenutensilien, Warm- und Kaltwasser sowie 220V-Strom. Pro Bett stehen eine Decke und ein Kissen zur Verfügung. Bettwäsche und Handtücher können auf Anfrage ausgeliehen werden.</p>) },
        { title: '7. Abreise', body: (<p>Das Apartment muss zwischen 07:00 und 10:00 Uhr geräumt werden — frei von Müll, mit sauberen Regalen, gespültem Geschirr, leerem Kühlschrank mit geöffneter Tür. Möbel dürfen nicht verrückt oder nach draußen gestellt werden.</p>) },
        { title: '8. Hausordnung', body: (<>
          <p>Es ist verboten, mehr Gäste als die Anzahl der Betten zu beherbergen. Kinder über 24 Monate gelten als Erwachsene. Möbel dürfen nicht nach draußen gestellt werden; Markisen dürfen bei Abwesenheit nicht geöffnet bleiben; der Grill darf nicht mit Holz betrieben werden.</p>
          <p>Die Gäste sind verpflichtet, die Ruhezeiten einzuhalten, insbesondere nachmittags und nachts.</p>
        </>) },
        { title: '9. Außenbereiche und Picknickplatz', body: (<p>Der Picknickplatz ist von 11:00 bis 24:00 Uhr zugänglich. Kinder müssen beaufsichtigt werden. Glaswaren, Tiere, Fahrräder und Skateboards sind nicht erlaubt. Die Gästezahl ist auf die im Vertrag angegebene Personenanzahl begrenzt.</p>) },
        { title: '10. Schwimmbad', body: (<p>Das Schwimmbad steht ausschließlich LivingApple-Gästen am Standort Via Tore zur Verfügung. LivingApple Beach Gäste <strong>haben keinen Zugang zum Schwimmbad</strong>. Geöffnet von 09:00 bis 19:00 Uhr. Kinder unter 12 Jahren müssen begleitet werden. Springen und Glasflaschen sind verboten.</p>) },
        { title: '11. Sanktionen', body: (<p>Bei Nichteinhaltung der Regeln gemäß den Punkten 7 und 8 können Strafen von €10,00 bis €500,00 sowie Aufschläge auf die Endreinigungskosten erhoben werden.</p>) },
        { title: '12. Kaution', body: (<p>Als Sicherheit für die Einhaltung aller Regeln wird bei der Schlüsselübergabe eine Kaution erhoben, deren Höhe je nach gebuchter Unterkunft variiert. Die Kaution wird nach Überprüfung des Zustands der Unterkunft zurückgezahlt.</p>) },
        { title: '13. Haftung', body: (<p>LivingApple übernimmt keine Haftung für Schäden, Verletzungen, Verluste, Diebstahl, Verzögerungen oder sonstige Unannehmlichkeiten. Für eventuelle Rechtsstreitigkeiten ist ausschließlich das Gericht Cassino (FR), Italien, zuständig.</p>) },
        { title: '14. Annahme', body: (<p>Mit der Buchung akzeptiert der Mieter ausdrücklich alle hier dargelegten Bedingungen.</p>) },
      ],
    },

    pl: {
      h1: 'Ogólne warunki rezerwacji',
      subtitle: 'Wszystkie warunki dotyczące Pani/Pana pobytu w LivingApple',
      sections: [
        { title: '1. Definicje', body: (<>
          <p>W niniejszych „Ogólnych warunkach najmu" stosuje się następujące definicje:</p>
          <p><strong>„Klient"</strong> — osoba dokonująca rezerwacji i korzystająca z usług oraz nieruchomości oferowanych przez LivingApple;</p>
          <p><strong>„Rezerwacja"</strong> — wniosek Klienta o wynajem apartamentu na określony okres;</p>
          <p><strong>„Propozycja umowy"</strong> — komunikat LivingApple potwierdzający dostępność, zawierający szczegóły oferty i prośbę o wpłatę zaliczki;</p>
          <p><strong>„List potwierdzający"</strong> — potwierdzenie otrzymania zaliczki z kodem potwierdzającym rezerwację;</p>
          <p><strong>„Umowa najmu"</strong> — warunki usługi zawarte między LivingApple a klientem.</p>
        </>) },
        { title: '2. Rezerwacja i zawarcie umowy', body: (<p>Rezerwacja jest uważana za sfinalizowaną w momencie, gdy Klient otrzyma List potwierdzający wysłany przez LivingApple natychmiast po otrzymaniu zaliczki. Do Umowy najmu dołączony jest formularz listy gości, który należy wypełnić, podpisać i jak najszybciej odesłać do LivingApple.</p>) },
        { title: '3. Zaliczka, płatność i kaucja', body: (<>
          <p>Zaliczka wynosi 30% czynszu (minimum €150,00) i może być opłacona przelewem bankowym, kartą kredytową (+2,5%) lub PayPal (+3,4%). Musi wpłynąć w ciągu 7 dni od powiadomienia o dostępności (3 dni w przypadku płatności online).</p>
          <p>Pozostała kwota i kaucja muszą być opłacone gotówką lub autoryzacją wstępną karty kredytowej przy odbiorze kluczy.</p>
        </>) },
        { title: '4. Anulowanie rezerwacji', body: (<>
          <p>Potwierdzona rezerwacja nie może być anulowana ani zmieniona. Każda prośba o anulowanie musi zostać przekazana e-mailem. W przypadku cen promocyjnych lub okresów świątecznych każde anulowanie wiąże się z koniecznością uiszczenia 100% wartości rezerwacji.</p>
          <ul style={ul}>
            <li><strong>60+ dni przed:</strong> 50% zaliczki (min. €150,00)</li>
            <li><strong>59–15 dni przed:</strong> pełna zaliczka + 25% pozostałej należności</li>
            <li><strong>14–01 dni przed:</strong> pełna pozostała należność</li>
          </ul>
        </>) },
        { title: '5. Przyjazd i wyjazd', body: (<>
          <p>Szczegóły przyjazdu należy przesłać e-mailem co najmniej 3 dni przed datą przyjazdu. Check-in odbywa się między godz. 17:00 a 20:00. Spóźniony przyjazd:</p>
          <ul style={ul}>
            <li>€30,00 między 20:00 a 22:00</li>
            <li>€50,00 między 22:00 a 24:00</li>
          </ul>
          <p>Check-in po północy i check-out przed godz. 08:00 nie są możliwe. Wszyscy goście muszą okazać dokumenty tożsamości po przyjeździe.</p>
        </>) },
        { title: '6. Wyposażenie apartamentu', body: (<p>Wszystkie apartamenty są w pełni umeblowane i wyposażone w kuchenkę gazową, lodówkę, naczynia kuchenne, ciepłą i zimną wodę oraz prąd 220V. Na każde łóżko przypadają koc i poduszka. Pościel i ręczniki można wypożyczyć na życzenie.</p>) },
        { title: '7. Wyjazd', body: (<p>Apartament należy opuścić między godz. 07:00 a 10:00. Powinien być wolny od śmieci, z czystymi półkami, umytymi naczyniami, pustą lodówką z otwartymi drzwiami. Meble nie mogą być przestawiane ani wynoszone na zewnątrz.</p>) },
        { title: '8. Regulamin pobytu', body: (<>
          <p>Zabrania się przyjmowania większej liczby gości niż liczba dostępnych łóżek. Dzieci powyżej 24 miesięcy są traktowane jak dorośli. Zabrania się wystawiania mebli na zewnątrz, zostawiania otwartych markiz podczas nieobecności oraz używania grilla na drewno.</p>
          <p>Goście zobowiązani są do przestrzegania ciszy, szczególnie w godzinach popołudniowych i nocnych.</p>
        </>) },
        { title: '9. Strefy zewnętrzne i piknikowe', body: (<p>Strefa piknikowa jest dostępna w godzinach 11:00–24:00. Dzieci muszą być pod opieką. Szkło, zwierzęta, rowery i deskorolki są niedozwolone. Liczba gości jest ograniczona do liczby osób wskazanej w umowie.</p>) },
        { title: '10. Basen', body: (<p>Basen jest przeznaczony wyłącznie dla gości LivingApple przy Via Tore. Goście LivingApple Beach <strong>nie mają dostępu do basenu</strong>. Czynny od 09:00 do 19:00. Dzieci poniżej 12 lat muszą być pod opieką. Skakanie i szklane pojemniki są zabronione.</p>) },
        { title: '11. Kary', body: (<p>Niestosowanie się do zasad opisanych w punktach 7 i 8 może skutkować karami od €10,00 do €500,00 oraz dopłatami do kosztów końcowego sprzątania.</p>) },
        { title: '12. Kaucja', body: (<p>Jako gwarancja przestrzegania wszystkich zasad, przy wydaniu kluczy pobierana jest kaucja, której wysokość zależy od zarezerwowanego apartamentu. Kaucja jest zwracana po sprawdzeniu stanu apartamentu.</p>) },
        { title: '13. Odpowiedzialność', body: (<p>LivingApple nie ponosi odpowiedzialności za uszkodzenia, obrażenia, zagubienia, kradzieże, opóźnienia ani żadne inne niedogodności. Wszelkie spory prawne podlegają wyłącznej jurysdykcji Sądu w Cassino (FR), Włochy.</p>) },
        { title: '14. Akceptacja', body: (<p>Dokonując rezerwacji, najemca wyraźnie akceptuje wszystkie warunki określone w niniejszym dokumencie.</p>) },
      ],
    },
  };

  return data[locale];
}

export default async function CondizioniPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const { h1, subtitle, sections } = getContent(locale);

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <h1 className="fs-1 fw-bold mb-1">{h1}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      {sections.map(({ title, body }) => (
        <div key={title} className="mb-4">
          <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mb-2">{title}</h2>
          <div className="text-secondary" style={{ lineHeight: 1.7 }}>{body}</div>
        </div>
      ))}
    </div>
  );
}

const ulStyle: React.CSSProperties = { paddingLeft: '1.5rem', margin: '0.5rem 0' };
