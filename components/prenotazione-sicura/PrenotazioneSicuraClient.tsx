'use client';
import { useState } from 'react';

type Locale = 'it' | 'en' | 'de' | 'pl';

const CIN = 'IT059014B47RVOMN2D';
const PIVA = '02710130598';
const AIRBNB_URL = 'https://www.airbnb.it/p/livingapple-italy-vacation-rentals';
const UFFICIOCAMERALE_URL = 'https://www.ufficiocamerale.it/trova-azienda';

const T: Record<Locale, {
  hero_title: string;
  hero_sub: string;
  trust_title: string;
  trust_pills: { icon: string; title: string; text: string; link?: { label: string; href: string } }[];
  guide_title: string;
  guide_sub: string;
  chapters: { title: string; body: string; warn?: string; tip?: string; }[];
  checklist_title: string;
  checklist: string[];
  cta_verify_ri: string;
  cta_verify_airbnb: string;
  cta_book: string;
  cta_book_sub: string;
  scam_title: string;
  scam_steps: string[];
}> = {
  it: {
    hero_title: 'Vuoi sapere chi siamo prima di darci i tuoi soldi?',
    hero_sub: "Buona idea. Questa pagina esiste esattamente per questo. Ci vorranno 2 minuti, e troverai tutto quello che ti serve per verificarci — senza fidarti della nostra parola.",
    trust_title: 'Verificaci prima di prenotare',
    trust_pills: [
      { icon: '🏛️', title: 'CIN verificabile', text: `Il Codice Identificativo Nazionale ${CIN} è obbligatorio per legge da settembre 2024 ed è visibile su tutti i nostri annunci. Puoi verificarlo sul portale del Ministero del Turismo.`, link: { label: 'Verifica il CIN →', href: 'https://bdsr.ministeroturismo.gov.it/' } },
      { icon: '🏢', title: 'P.IVA attiva su Registro Imprese', text: `P.IVA ${PIVA} — codice ATECO 55.20.51 (case e appartamenti vacanze). Puoi verificarla gratuitamente cercando il numero su registroimprese.it o su ufficiocamerale.it: nome, stato attivo e ragione sociale in 30 secondi.`, link: { label: 'Cerca su ufficiocamerale.it →', href: UFFICIOCAMERALE_URL } },
      { icon: '💳', title: 'Pagamenti tramite Stripe — identificazione bancaria', text: 'Stripe non concede l\'accesso a privati senza P.IVA. Per attivarlo è obbligatoria una procedura KYC con verifica dei documenti e estratti conto. Accettando pagamenti via Stripe, siamo già stati identificati da un soggetto bancario terzo.' },
      { icon: '⭐', title: 'Presenti su Airbnb e Booking.com con storico verificato', text: 'Siamo su Airbnb (LivingApple) e Booking.com (LivingApple e LivingApple Beach) con recensioni scritte esclusivamente da ospiti con soggiorno completato — impossibile falsificare. Cerca "LivingApple Scauri" su entrambe le piattaforme.', link: { label: 'Vedi il nostro profilo Airbnb →', href: AIRBNB_URL } },
      { icon: '🛡️', title: 'PayPal "Beni e Servizi" — tutela 180 giorni', text: 'Accettiamo PayPal solo nella modalità "Beni e Servizi", che attiva la Tutela Acquisti: puoi aprire una contestazione entro 180 giorni se il servizio non corrisponde. I truffatori chiedono sempre "Amici e Familiari" — noi no.' },
    ],
    guide_title: 'La guida completa — cosa sapere prima di prenotare una casa vacanza',
    guide_sub: 'Fonti: Polizia Postale · Airbnb · Altroconsumo · Commissariato di P.S. Online',
    chapters: [
      { title: 'Cap. 0 — Chi pubblica e dove: tre categorie', body: 'Nel mercato degli affitti brevi esistono tre categorie distinte. I privati non registrati operano senza CIN, senza P.IVA, spesso in nero. Sono soggetti che violano la legge italiana, il che li rende impossibili da tutelare in caso di problemi.\n\nEsiste poi una zona grigia caotica dove operano i truffatori più sofisticati: copiano annunci reali da Airbnb e Booking, li ripubblicano su Subito.it o gruppi Facebook con prezzi più bassi, e chiedono di pagare fuori piattaforma.\n\nI gestori professionali — quelli con CIN, P.IVA e obblighi fiscali — scelgono le OTA certificate proprio perché offrono strumenti di credibilità impossibili da falsificare.', tip: 'Stripe, Square e qualsiasi piattaforma di pagamento professionale NON vengono concessi a privati senza P.IVA. Un gestore che accetta pagamenti tramite questi strumenti ha già superato un controllo di identità imposto da soggetti terzi.' },
      { title: 'Cap. 1 — Il sopralluogo non prova nulla', body: 'Moltissimi ospiti credono che visitare fisicamente una casa prima di affittarla sia la massima garanzia. È sbagliato.\n\nLa truffa del subaffitto fraudolento — documentata dalla Polizia Postale — funziona così: il truffatore affitta regolarmente un immobile, lo propone a decine di turisti su canali non controllati, li accompagna a visitarlo (la casa esiste, le chiavi aprono), incassa la caparra da tutti e alla data del soggiorno non si trova più.', warn: 'Chi ha fatto il sopralluogo è stato truffato esattamente come chi non l\'ha fatto. Il sopralluogo non verifica nulla di legale: ha solo confermato che un immobile esiste.' },
      { title: 'Cap. 2 — Cosa garantisce davvero la sicurezza', body: 'Le piattaforme certificate (Airbnb, Booking, Expedia) verificano l\'identità dell\'host con documento ufficiale prima della pubblicazione. Le recensioni sono scritte esclusivamente da ospiti con prenotazione confermata e soggiorno completato — impossibile scrivere recensioni false.\n\nUna P.IVA verificabile su Registro Imprese è tracciabile, identificabile e aggredibile in sede legale. Un IBAN intestato a una società con P.IVA è una prova legale inattaccabile.\n\nPayPal "Beni e Servizi" copre i pagamenti per servizi non ricevuti o non conformi. La contestazione va aperta entro 180 giorni.' },
      { title: 'Cap. 3 — I metodi-trappola da evitare sempre', body: 'I truffatori scelgono metodi di pagamento specifici perché non offrono alcuna tutela alla vittima.\n\n✗ Da evitare: ricarica PostePay, bonifico su IBAN di carta ricaricabile, Western Union / MoneyGram, PayPal "Amici e Familiari", contanti senza ricevuta fiscale, criptovalute senza contratto.\n\n✓ Sicuri e tracciabili: bonifico su conto aziendale con P.IVA verificata, pagamento dentro la piattaforma, carta di credito con protezione acquisti, PayPal "Beni e Servizi", link di pagamento POS professionale (Stripe).', warn: 'Un IBAN che non inizia con "IT" — prefissi LT (Lituania), RO (Romania), BG (Bulgaria) — è spesso abbinato a carte fintech estere non soggette alla vigilanza bancaria italiana.' },
      { title: 'Cap. 4 — L\'identikit del truffatore', body: 'Annuncio su Subito.it o gruppo Facebook con prezzo molto inferiore al mercato. Profilo creato da pochi giorni. Non risponde a videochiamate. Cita Airbnb o Booking per darsi credibilità, ma chiede di pagare fuori. Mette fretta: "la casa va a un\'altra coppia se non blocchi oggi". Il conto è intestato a un nome straniero non coerente con chi parli.\n\nSegnali di affidabilità: profilo OTA con storico di almeno 12 mesi e recensioni verificate, P.IVA esposta e verificabile, CIN visibile nell\'annuncio, disponibilità a videochiamate, contratto completo, pagamento gestito dalla piattaforma o con POS professionale.' },
      { title: 'Cap. 5 — La checklist del buon affittuario', body: 'Prima di confermare qualsiasi prenotazione, verifica: l\'annuncio è su una piattaforma OTA certificata. Il gestore ha un profilo con almeno 6-12 mesi di storia. Il pagamento avviene DENTRO la piattaforma. Esiste una P.IVA verificabile. Il CIN dell\'immobile è indicato nell\'annuncio. L\'IBAN inizia con "IT". Viene rilasciata ricevuta fiscale. Il gestore è disponibile a videochiamata e non mette pressione sui tempi.' },
      { title: 'Cap. 6 — In caso di truffa: come agire', body: 'Se sei vittima di un raggiro, agisci tempestivamente. Presenta denuncia alla Polizia Postale su commissariatodips.it entro 48 ore — annota il numero di protocollo. Conserva TUTTA la corrispondenza: email, messaggi, screenshot, link dell\'annuncio, ricevute. Se il pagamento è avvenuto con carta di credito, contatta immediatamente la banca per il chargeback. Se hai usato PayPal "Beni e Servizi", apri una contestazione nel Centro Risoluzioni entro 180 giorni. Non cancellare nessun messaggio.' },
    ],
    checklist_title: 'Checklist rapida — verificaci in 2 minuti',
    checklist: [
      `Cerca P.IVA ${PIVA} su ufficiocamerale.it — nome, stato attivo, ATECO 55.20.51`,
      `Verifica CIN ${CIN} su bdsr.ministeroturismo.gov.it`,
      'Cerca "LivingApple Scauri" su Airbnb e Booking.com — leggi le recensioni verificate',
      'Controlla che il pagamento avvenga su Stripe — link ufficiale LivingApple',
      'Se usi PayPal, verifica che sia "Beni e Servizi" — mai "Amici e Familiari"',
    ],
    cta_verify_ri: 'Cerca P.IVA su ufficiocamerale.it',
    cta_verify_airbnb: 'Vedi il profilo Airbnb',
    cta_book: 'Prenota ora',
    cta_book_sub: 'Pagamento sicuro tramite Stripe',
    scam_title: 'Hai subito una truffa?',
    scam_steps: [
      'Denuncia su commissariatodips.it entro 48h',
      'Conserva ogni messaggio, screenshot e ricevuta',
      'Chiama la banca per chargeback (se hai pagato con carta)',
      'Apri contestazione PayPal entro 180 giorni (se hai usato PayPal B&S)',
    ],
  },
  en: {
    hero_title: 'Want to know who we are before handing over your money?',
    hero_sub: "Good idea. This page exists for exactly that reason. It will take 2 minutes, and you'll find everything you need to verify us — without having to take our word for it.",
    trust_title: 'Verify us before you book',
    trust_pills: [
      { icon: '🏛️', title: 'Verifiable CIN code', text: `The National Identification Code ${CIN} has been mandatory by law since September 2024 and is visible on all our listings. You can verify it on the Italian Ministry of Tourism portal.`, link: { label: 'Verify the CIN →', href: 'https://bdsr.ministeroturismo.gov.it/' } },
      { icon: '🏢', title: 'Active VAT on Companies Register', text: `VAT ${PIVA} — ATECO code 55.20.51 (holiday homes and apartments). You can verify it for free by searching the number on registroimprese.it or ufficiocamerale.it: name, active status and registered details in 30 seconds.`, link: { label: 'Search on ufficiocamerale.it →', href: UFFICIOCAMERALE_URL } },
      { icon: '💳', title: 'Stripe payments — banking identification', text: 'Stripe does not grant access to private individuals without a VAT number. Activation requires a mandatory KYC procedure with document and bank statement verification. By accepting Stripe payments, we have already been identified by an independent banking entity.' },
      { icon: '⭐', title: 'Present on Airbnb and Booking.com with verified history', text: 'We are on Airbnb (LivingApple) and Booking.com (LivingApple and LivingApple Beach) with reviews written exclusively by guests with a completed stay — impossible to fake. Search "LivingApple Scauri" on both platforms.', link: { label: 'See our Airbnb profile →', href: AIRBNB_URL } },
      { icon: '🛡️', title: 'PayPal "Goods and Services" — 180-day buyer protection', text: 'We only accept PayPal as "Goods and Services", which activates Buyer Protection: you can open a dispute within 180 days if the service does not match. Fraudsters always ask for "Friends and Family" — we never do.' },
    ],
    guide_title: 'The complete guide — what to know before booking a holiday home',
    guide_sub: 'Sources: Polizia Postale · Airbnb · Altroconsumo · Commissariato di P.S. Online',
    chapters: [
      { title: 'Ch. 0 — Who publishes and where: three categories', body: 'In the short-term rental market there are three distinct categories. Unregistered private individuals operate without a CIN, without a VAT number, often off the books. They are breaking Italian law, which makes it impossible to protect yourself if something goes wrong.\n\nThere is also a chaotic grey area where more sophisticated fraudsters operate: they copy real listings from Airbnb and Booking, republish them on Subito.it or Facebook groups at lower prices, and ask you to pay outside the platform.\n\nProfessional operators — those with a CIN, VAT number and tax obligations — choose certified OTAs precisely because they offer credibility tools that are impossible to fake.', tip: 'Stripe, Square and any professional payment platform do NOT grant access to private individuals without a VAT number. A host accepting payments through these tools has already passed an identity check imposed by third-party banking entities.' },
      { title: 'Ch. 1 — A viewing proves nothing', body: 'Many guests believe that physically visiting a home before renting it is the ultimate guarantee. It is not.\n\nThe fraudulent sublet scam — documented by the Polizia Postale — works like this: the fraudster legitimately rents a property, advertises it to dozens of tourists on unmonitored channels, takes them on a viewing (the house exists, the keys work), collects a deposit from each one, and is nowhere to be found on the day of arrival.', warn: 'The guest who did the viewing was defrauded just as much as the one who did not. The viewing verified nothing legally — it only confirmed that a property exists.' },
      { title: 'Ch. 2 — What actually guarantees security', body: 'Certified platforms (Airbnb, Booking, Expedia) verify the host\'s identity with an official document before publication. Reviews are written exclusively by guests with a confirmed booking and completed stay — fake reviews are impossible.\n\nA verifiable VAT number on the Companies Register is traceable, identifiable and actionable in court. An IBAN in the name of a company with a VAT number is incontestable legal proof.\n\nPayPal "Goods and Services" covers payments for services not received or not as described. Disputes must be opened within 180 days.' },
      { title: 'Ch. 3 — The payment traps to always avoid', body: 'Fraudsters choose specific payment methods precisely because they offer victims no protection.\n\n✗ Avoid: PostePay top-up, bank transfer to a prepaid card IBAN, Western Union / MoneyGram, PayPal "Friends and Family", cash without a fiscal receipt, cryptocurrencies without a contract.\n\n✓ Safe and traceable: bank transfer to a business account with verified VAT, payment inside the platform, credit card with purchase protection, PayPal "Goods and Services", professional POS payment link (Stripe).', warn: 'An IBAN that does not begin with "IT" — prefixes LT (Lithuania), RO (Romania), BG (Bulgaria) — is often linked to foreign fintech cards not subject to Italian banking supervision.' },
      { title: 'Ch. 4 — The fraudster\'s profile', body: 'A listing on Subito.it or a Facebook group with a price well below market rate. A profile created a few days ago. Does not respond to video calls. Cites Airbnb or Booking for credibility but asks you to pay outside. Creates urgency: "another couple will take it if you don\'t book today". The account is in a foreign name inconsistent with the person you are speaking to.\n\nSigns of reliability: OTA profile with at least 12 months of history and verified reviews, displayed and verifiable VAT number, CIN visible in the listing, willingness to video call, complete contract, payment managed by the platform or with a professional POS.' },
      { title: 'Ch. 5 — The good tenant\'s checklist', body: 'Before confirming any booking, check: the listing is on a certified OTA platform. The host has a profile with at least 6-12 months of history. Payment is made INSIDE the platform. A verifiable VAT number exists. The property CIN is shown in the listing. The IBAN starts with "IT". A fiscal receipt is provided. The host is available for a video call and does not pressure you on timing.' },
      { title: 'Ch. 6 — In case of fraud: what to do', body: 'If you are the victim of a scam, act quickly. File a report with the Polizia Postale at commissariatodips.it within 48 hours — note the protocol number. Keep ALL correspondence: emails, messages, screenshots, listing links, receipts. If payment was by credit card, contact your bank immediately to start a chargeback. If you used PayPal "Goods and Services", open a dispute in the Resolution Centre within 180 days. Do not delete any messages.' },
    ],
    checklist_title: 'Quick checklist — verify us in 2 minutes',
    checklist: [
      `Search VAT ${PIVA} on ufficiocamerale.it — name, active status, ATECO 55.20.51`,
      `Verify CIN ${CIN} on bdsr.ministeroturismo.gov.it`,
      'Search "LivingApple Scauri" on Airbnb and Booking.com — read the verified reviews',
      'Check that payment goes through Stripe — official LivingApple link',
      'If using PayPal, confirm it is "Goods and Services" — never "Friends and Family"',
    ],
    cta_verify_ri: 'Search VAT on ufficiocamerale.it',
    cta_verify_airbnb: 'See the Airbnb profile',
    cta_book: 'Book now',
    cta_book_sub: 'Secure payment via Stripe',
    scam_title: 'Have you been scammed?',
    scam_steps: [
      'File a report at commissariatodips.it within 48h',
      'Keep every message, screenshot and receipt',
      'Call your bank for a chargeback (if paid by card)',
      'Open a PayPal dispute within 180 days (if you used PayPal G&S)',
    ],
  },
  de: {
    hero_title: 'Möchten Sie wissen, wer wir sind, bevor Sie uns Ihr Geld geben?',
    hero_sub: 'Gute Idee. Diese Seite existiert genau dafür. Es dauert 2 Minuten, und Sie finden alles, was Sie brauchen, um uns zu überprüfen — ohne uns beim Wort nehmen zu müssen.',
    trust_title: 'Überprüfen Sie uns vor der Buchung',
    trust_pills: [
      { icon: '🏛️', title: 'Überprüfbarer CIN-Code', text: `Der nationale Identifikationscode ${CIN} ist seit September 2024 gesetzlich vorgeschrieben und in allen unseren Inseraten sichtbar. Sie können ihn auf dem Portal des italienischen Tourismusministeriums verifizieren.`, link: { label: 'CIN verifizieren →', href: 'https://bdsr.ministeroturismo.gov.it/' } },
      { icon: '🏢', title: 'Aktive USt-IdNr. im Handelsregister', text: `USt-IdNr. ${PIVA} — ATECO-Code 55.20.51 (Ferienunterkünfte). Kostenlose Überprüfung durch Eingabe der Nummer auf registroimprese.it oder ufficiocamerale.it: Name, aktiver Status und Firmendetails in 30 Sekunden.`, link: { label: 'Auf ufficiocamerale.it suchen →', href: UFFICIOCAMERALE_URL } },
      { icon: '💳', title: 'Stripe-Zahlungen — Bankenidentifikation', text: 'Stripe gewährt Privatpersonen ohne USt-IdNr. keinen Zugang. Die Aktivierung erfordert ein obligatorisches KYC-Verfahren mit Dokument- und Kontoauszugsverifizierung. Mit der Annahme von Stripe-Zahlungen wurden wir bereits von einem unabhängigen Bankinstitut identifiziert.' },
      { icon: '⭐', title: 'Auf Airbnb und Booking.com mit verifiziertem Verlauf', text: 'Wir sind auf Airbnb (LivingApple) und Booking.com (LivingApple und LivingApple Beach) mit Bewertungen, die ausschließlich von Gästen mit abgeschlossenem Aufenthalt geschrieben wurden — nicht zu fälschen. Suchen Sie "LivingApple Scauri" auf beiden Plattformen.', link: { label: 'Unser Airbnb-Profil ansehen →', href: AIRBNB_URL } },
      { icon: '🛡️', title: 'PayPal "Waren und Services" — 180-Tage-Käuferschutz', text: 'Wir akzeptieren PayPal nur als "Waren und Services", das den Käuferschutz aktiviert: Sie können innerhalb von 180 Tagen einen Streitfall eröffnen, wenn der Service nicht übereinstimmt. Betrüger verlangen immer "Freunde und Familie" — wir nie.' },
    ],
    guide_title: 'Der vollständige Leitfaden — Was Sie vor der Buchung eines Ferienhauses wissen sollten',
    guide_sub: 'Quellen: Polizia Postale · Airbnb · Altroconsumo · Commissariato di P.S. Online',
    chapters: [
      { title: 'Kap. 0 — Wer veröffentlicht und wo: drei Kategorien', body: 'Auf dem Kurzzeitvermietungsmarkt gibt es drei verschiedene Kategorien. Nicht registrierte Privatpersonen arbeiten ohne CIN, ohne USt-IdNr., oft schwarz. Sie verstoßen gegen italienisches Recht, was es unmöglich macht, sich im Schadensfall zu schützen.\n\nEs gibt auch eine chaotische Grauzone, in der raffinierte Betrüger operieren: Sie kopieren echte Inserate von Airbnb und Booking, veröffentlichen sie auf Subito.it oder Facebook-Gruppen zu niedrigeren Preisen und verlangen eine Zahlung außerhalb der Plattform.\n\nProfessionelle Vermieter — jene mit CIN, USt-IdNr. und steuerlichen Pflichten — wählen zertifizierte OTAs, weil diese Glaubwürdigkeitswerkzeuge bieten, die nicht gefälscht werden können.', tip: 'Stripe, Square und jede professionelle Zahlungsplattform gewähren Privatpersonen ohne USt-IdNr. KEINEN Zugang. Ein Vermieter, der Zahlungen über diese Instrumente akzeptiert, wurde bereits durch Drittbankinstanzen identifiziert.' },
      { title: 'Kap. 1 — Eine Besichtigung beweist nichts', body: 'Viele Gäste glauben, dass die persönliche Besichtigung einer Unterkunft die größte Sicherheit bietet. Das ist falsch.\n\nDer betrügerische Untermietermietbetrug — dokumentiert von der Polizia Postale — funktioniert so: Der Betrüger mietet eine Immobilie legal an, bietet sie Dutzenden von Touristen auf unkontrollierten Kanälen an, führt sie zur Besichtigung (das Haus existiert, die Schlüssel funktionieren), kassiert von jedem eine Kaution und ist am Anreisetag nirgends zu finden.', warn: 'Der Gast, der die Besichtigung gemacht hat, wurde genauso betrogen wie derjenige, der sie nicht gemacht hat. Die Besichtigung hat nichts Rechtliches verifiziert — sie hat nur bestätigt, dass eine Immobilie existiert.' },
      { title: 'Kap. 2 — Was wirklich Sicherheit garantiert', body: 'Zertifizierte Plattformen (Airbnb, Booking, Expedia) verifizieren die Identität des Hosts mit einem offiziellen Dokument vor der Veröffentlichung. Bewertungen werden ausschließlich von Gästen mit bestätigter Buchung und abgeschlossenem Aufenthalt geschrieben — Fake-Bewertungen sind unmöglich.\n\nEine im Handelsregister überprüfbare USt-IdNr. ist rückverfolgbar, identifizierbar und gerichtlich angreifbar. Eine IBAN auf den Namen einer Gesellschaft mit USt-IdNr. ist ein unanfechtbarer Rechtsbeweis.\n\nPayPal "Waren und Services" deckt Zahlungen für nicht erhaltene oder nicht beschriebene Leistungen. Streitfälle müssen innerhalb von 180 Tagen eröffnet werden.' },
      { title: 'Kap. 3 — Die Zahlungsfallen, die immer zu meiden sind', body: 'Betrüger wählen spezifische Zahlungsmethoden, weil sie dem Opfer keinen Schutz bieten.\n\n✗ Vermeiden: PostePay-Aufladung, Überweisung auf Prepaid-Karten-IBAN, Western Union / MoneyGram, PayPal "Freunde und Familie", Bargeld ohne Steuerquittung, Kryptowährungen ohne Vertrag.\n\n✓ Sicher und rückverfolgbar: Überweisung auf Geschäftskonto mit verifizierter USt-IdNr., Zahlung innerhalb der Plattform, Kreditkarte mit Käuferschutz, PayPal "Waren und Services", professioneller POS-Zahlungslink (Stripe).', warn: 'Eine IBAN, die nicht mit "IT" beginnt — Präfixe LT (Litauen), RO (Rumänien), BG (Bulgarien) — ist oft mit ausländischen Fintech-Karten verknüpft, die nicht der italienischen Bankenaufsicht unterliegen.' },
      { title: 'Kap. 4 — Das Profil des Betrügers', body: 'Ein Inserat auf Subito.it oder einer Facebook-Gruppe zu einem weit unter dem Marktpreis liegenden Preis. Ein erst wenige Tage altes Profil. Antwortet nicht auf Videoanrufe. Zitiert Airbnb oder Booking für Glaubwürdigkeit, verlangt aber außerhalb zu zahlen. Setzt unter Druck: "Wenn Sie nicht heute buchen, geht es an ein anderes Paar". Das Konto ist auf einen ausländischen Namen lautend, der nicht zu Ihrem Gesprächspartner passt.\n\nZuverlässigkeitszeichen: OTA-Profil mit mindestens 12 Monaten Geschichte und verifizierten Bewertungen, angezeigte und überprüfbare USt-IdNr., CIN im Inserat sichtbar, Bereitschaft zu Videoanrufen, vollständiger Vertrag, Zahlung über die Plattform oder mit professionellem POS.' },
      { title: 'Kap. 5 — Die Checkliste des guten Mieters', body: 'Bevor Sie eine Buchung bestätigen, prüfen Sie: Das Inserat befindet sich auf einer zertifizierten OTA-Plattform. Der Vermieter hat ein Profil mit mindestens 6-12 Monaten Geschichte. Die Zahlung erfolgt INNERHALB der Plattform. Eine überprüfbare USt-IdNr. existiert. Der CIN der Immobilie ist im Inserat angegeben. Die IBAN beginnt mit "IT". Eine Steuerquittung wird ausgestellt. Der Vermieter ist für Videoanrufe verfügbar und setzt Sie nicht unter Zeitdruck.' },
      { title: 'Kap. 6 — Im Betrugsfall: wie vorgehen', body: 'Wenn Sie Opfer eines Betrugs werden, handeln Sie schnell. Erstatten Sie Anzeige bei der Polizia Postale auf commissariatodips.it innerhalb von 48 Stunden — notieren Sie die Protokollnummer. Bewahren Sie GESAMTE Korrespondenz auf: E-Mails, Nachrichten, Screenshots, Inserat-Links, Quittungen. Wenn mit Kreditkarte bezahlt, kontaktieren Sie sofort die Bank für ein Chargeback. Bei PayPal "Waren und Services" eröffnen Sie innerhalb von 180 Tagen einen Streitfall. Keine Nachrichten löschen.' },
    ],
    checklist_title: 'Schnell-Checkliste — überprüfen Sie uns in 2 Minuten',
    checklist: [
      `USt-IdNr. ${PIVA} auf ufficiocamerale.it suchen — Name, aktiver Status, ATECO 55.20.51`,
      `CIN ${CIN} auf bdsr.ministeroturismo.gov.it verifizieren`,
      '"LivingApple Scauri" auf Airbnb und Booking.com suchen — verifizierte Bewertungen lesen',
      'Prüfen, ob die Zahlung über Stripe erfolgt — offizieller LivingApple-Link',
      'Bei PayPal: bestätigen, dass es "Waren und Services" ist — nie "Freunde und Familie"',
    ],
    cta_verify_ri: 'USt-IdNr. auf ufficiocamerale.it suchen',
    cta_verify_airbnb: 'Airbnb-Profil ansehen',
    cta_book: 'Jetzt buchen',
    cta_book_sub: 'Sichere Zahlung über Stripe',
    scam_title: 'Wurden Sie betrogen?',
    scam_steps: [
      'Anzeige auf commissariatodips.it innerhalb von 48h erstatten',
      'Alle Nachrichten, Screenshots und Quittungen aufbewahren',
      'Bank für Chargeback kontaktieren (bei Kartenzahlung)',
      'PayPal-Streitfall innerhalb von 180 Tagen eröffnen (bei PayPal W&S)',
    ],
  },
  pl: {
    hero_title: 'Chcesz wiedzieć, kim jesteśmy, zanim nam zapłacisz?',
    hero_sub: 'Dobry pomysł. Ta strona istnieje właśnie po to. Zajmie to 2 minuty i znajdziesz tu wszystko, czego potrzebujesz, aby nas zweryfikować — bez konieczności brania nas za słowo.',
    trust_title: 'Zweryfikuj nas przed rezerwacją',
    trust_pills: [
      { icon: '🏛️', title: 'Weryfikowalny kod CIN', text: `Narodowy Kod Identyfikacyjny ${CIN} jest obowiązkowy prawnie od września 2024 i widoczny we wszystkich naszych ogłoszeniach. Możesz go zweryfikować w portalu włoskiego Ministerstwa Turystyki.`, link: { label: 'Zweryfikuj CIN →', href: 'https://bdsr.ministeroturismo.gov.it/' } },
      { icon: '🏢', title: 'Aktywny NIP w Rejestrze Firm', text: `NIP ${PIVA} — kod ATECO 55.20.51 (domy i apartamenty wakacyjne). Możesz zweryfikować bezpłatnie, wpisując numer na registroimprese.it lub ufficiocamerale.it: nazwa, aktywny status i dane firmy w 30 sekund.`, link: { label: 'Szukaj na ufficiocamerale.it →', href: UFFICIOCAMERALE_URL } },
      { icon: '💳', title: 'Płatności Stripe — identyfikacja bankowa', text: 'Stripe nie udziela dostępu osobom prywatnym bez NIP. Aktywacja wymaga obowiązkowej procedury KYC z weryfikacją dokumentów i wyciągów bankowych. Przyjmując płatności Stripe, zostaliśmy już zidentyfikowani przez niezależny podmiot bankowy.' },
      { icon: '⭐', title: 'Obecni na Airbnb i Booking.com z zweryfikowaną historią', text: 'Jesteśmy na Airbnb (LivingApple) i Booking.com (LivingApple i LivingApple Beach) z recenzjami napisanymi wyłącznie przez gości z ukończonym pobytem — niemożliwe do sfałszowania. Szukaj "LivingApple Scauri" na obu platformach.', link: { label: 'Zobacz nasz profil Airbnb →', href: AIRBNB_URL } },
      { icon: '🛡️', title: 'PayPal "Towary i Usługi" — ochrona przez 180 dni', text: 'Akceptujemy PayPal tylko jako "Towary i Usługi", co aktywuje Ochronę Kupującego: możesz otworzyć spór w ciągu 180 dni, jeśli usługa nie jest zgodna z opisem. Oszuści zawsze proszą o "Znajomi i rodzina" — my nigdy.' },
    ],
    guide_title: 'Kompletny przewodnik — co wiedzieć przed rezerwacją domu wakacyjnego',
    guide_sub: 'Źródła: Polizia Postale · Airbnb · Altroconsumo · Commissariato di P.S. Online',
    chapters: [
      { title: 'Rozdz. 0 — Kto publikuje i gdzie: trzy kategorie', body: 'Na rynku krótkoterminowych wynajmów istnieją trzy odrębne kategorie. Niezarejestrowani prywatni właściciele działają bez CIN, bez NIP, często w szarej strefie. Naruszają włoskie prawo, co uniemożliwia ochronę w przypadku problemów.\n\nIstnieje też chaotyczna szara strefa, gdzie działają bardziej wyrafinowani oszuści: kopiują prawdziwe ogłoszenia z Airbnb i Booking, publikują je na Subito.it lub grupach Facebook w niższych cenach i proszą o płatność poza platformą.\n\nProfesjonalni zarządcy — z CIN, NIP i obowiązkami podatkowymi — wybierają certyfikowane OTA właśnie dlatego, że oferują narzędzia wiarygodności niemożliwe do sfałszowania.', tip: 'Stripe, Square i każda profesjonalna platforma płatnicza NIE udzielają dostępu osobom prywatnym bez NIP. Zarządca akceptujący płatności przez te narzędzia został już zidentyfikowany przez niezależny podmiot bankowy.' },
      { title: 'Rozdz. 1 — Oględziny nic nie udowadniają', body: 'Wielu gości uważa, że fizyczne oglądanie nieruchomości przed wynajmem jest najlepszą gwarancją. To błąd.\n\nOszustwo z nielegalnym podnajmem — udokumentowane przez Polizia Postale — działa tak: oszust legalnie wynajmuje nieruchomość, proponuje ją dziesiątkom turystów na niekontrolowanych kanałach, prowadzi ich na oględziny (dom istnieje, klucze działają), pobiera kaucję od każdego i w dniu przyjazdu znika.', warn: 'Gość, który był na oględzinach, został oszukany tak samo jak ten, który ich nie przeprowadził. Oględziny nic nie weryfikują prawnie — potwierdziły tylko, że nieruchomość istnieje.' },
      { title: 'Rozdz. 2 — Co naprawdę gwarantuje bezpieczeństwo', body: 'Certyfikowane platformy (Airbnb, Booking, Expedia) weryfikują tożsamość hosta oficjalnym dokumentem przed publikacją. Recenzje są pisane wyłącznie przez gości z potwierdzoną rezerwacją i ukończonym pobytem — fałszywe recenzje są niemożliwe.\n\nWeryfikowalny NIP w Rejestrze Firm jest identyfikowalny i podlega dochodzeniu prawnemu. IBAN na nazwę firmy z NIP jest niepodważalnym dowodem prawnym.\n\nPayPal "Towary i Usługi" chroni płatności za usługi nieotrzymane lub niezgodne z opisem. Spory należy otwierać w ciągu 180 dni.' },
      { title: 'Rozdz. 3 — Pułapki płatnicze, których zawsze należy unikać', body: 'Oszuści wybierają konkretne metody płatności właśnie dlatego, że nie oferują ofierze żadnej ochrony.\n\n✗ Unikaj: doładowania PostePay, przelewu na IBAN karty prepaid, Western Union / MoneyGram, PayPal "Znajomi i rodzina", gotówki bez paragonu fiskalnego, kryptowalut bez umowy.\n\n✓ Bezpieczne i identyfikowalne: przelew na konto firmowe z weryfikowalnym NIP, płatność wewnątrz platformy, karta kredytowa z ochroną zakupów, PayPal "Towary i Usługi", profesjonalny link płatności POS (Stripe).', warn: 'IBAN, który nie zaczyna się od "IT" — prefiksy LT (Litwa), RO (Rumunia), BG (Bułgaria) — jest często powiązany z zagranicznymi kartami fintech, które nie podlegają włoskiemu nadzorowi bankowemu.' },
      { title: 'Rozdz. 4 — Profil oszusta', body: 'Ogłoszenie na Subito.it lub grupie Facebook z ceną znacznie poniżej rynkowej. Profil założony kilka dni temu. Nie odpowiada na połączenia wideo. Powołuje się na Airbnb lub Booking dla wiarygodności, ale prosi o płatność poza platformą. Wywiera presję czasową: "Jeśli nie zarezerwujesz dzisiaj, weźmie inna para". Konto jest na zagraniczne nazwisko niezgodne z rozmówcą.\n\nOznaki wiarygodności: profil OTA z historią co najmniej 12 miesięcy i zweryfikowanymi recenzjami, wyświetlany i weryfikowalny NIP, CIN widoczny w ogłoszeniu, gotowość do rozmów wideo, kompletna umowa, płatność zarządzana przez platformę lub profesjonalny POS.' },
      { title: 'Rozdz. 5 — Lista kontrolna dobrego najemcy', body: 'Przed potwierdzeniem jakiejkolwiek rezerwacji sprawdź: ogłoszenie jest na certyfikowanej platformie OTA. Zarządca ma profil z historią co najmniej 6-12 miesięcy. Płatność odbywa się WEWNĄTRZ platformy. Istnieje weryfikowalny NIP. CIN nieruchomości jest podany w ogłoszeniu. IBAN zaczyna się od "IT". Wydawany jest paragon fiskalny. Zarządca jest dostępny na rozmowę wideo i nie wywiera presji czasowej.' },
      { title: 'Rozdz. 6 — W przypadku oszustwa: jak postępować', body: 'Jeśli jesteś ofiarą oszustwa, działaj szybko. Złóż zawiadomienie w Polizia Postale na commissariatodips.it w ciągu 48 godzin — zanotuj numer protokołu. Zachowaj CAŁĄ korespondencję: e-maile, wiadomości, zrzuty ekranu, linki ogłoszeń, rachunki. Jeśli płaciłeś kartą kredytową, natychmiast skontaktuj się z bankiem w sprawie chargeback. Przy PayPal "Towary i Usługi" otwórz spór w Centrum Rozwiązywania Sporów w ciągu 180 dni. Nie usuwaj żadnych wiadomości.' },
    ],
    checklist_title: 'Szybka lista kontrolna — zweryfikuj nas w 2 minuty',
    checklist: [
      `Szukaj NIP ${PIVA} na ufficiocamerale.it — nazwa, aktywny status, ATECO 55.20.51`,
      `Zweryfikuj CIN ${CIN} na bdsr.ministeroturismo.gov.it`,
      'Szukaj "LivingApple Scauri" na Airbnb i Booking.com — przeczytaj zweryfikowane recenzje',
      'Sprawdź, czy płatność przechodzi przez Stripe — oficjalny link LivingApple',
      'Przy PayPal: potwierdź, że to "Towary i Usługi" — nigdy "Znajomi i rodzina"',
    ],
    cta_verify_ri: 'Szukaj NIP na ufficiocamerale.it',
    cta_verify_airbnb: 'Zobacz profil Airbnb',
    cta_book: 'Zarezerwuj teraz',
    cta_book_sub: 'Bezpieczna płatność przez Stripe',
    scam_title: 'Czy byłeś ofiarą oszustwa?',
    scam_steps: [
      'Zgłoś na commissariatodips.it w ciągu 48h',
      'Zachowaj wszystkie wiadomości, zrzuty ekranu i rachunki',
      'Skontaktuj się z bankiem w sprawie chargeback (przy płatności kartą)',
      'Otwórz spór PayPal w ciągu 180 dni (przy PayPal T&U)',
    ],
  },
};

function Chapter({ chapter, index }: { chapter: typeof T['it']['chapters'][0]; index: number }) {
  const [open, setOpen] = useState(index < 2);
  return (
    <div className="border rounded mb-2 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="btn w-100 d-flex justify-content-between align-items-center text-start gap-2 px-3 py-3"
        style={{ background: open ? '#EEF5FC' : '#fff' }}
      >
        <span className="fw-semibold text-primary flex-fill">{chapter.title}</span>
        <span className="text-muted" style={{ fontSize: '1.1rem', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="p-3 border-top">
          {chapter.body.split('\n\n').map((para, i) => (
            <p key={i} className="text-secondary mb-2" style={{ lineHeight: 1.65 }}>{para}</p>
          ))}
          {chapter.warn && (
            <div className="alert alert-warning mt-2 mb-0" style={{ background: '#FFF8E7', borderColor: '#FCAF1A' }}>
              <p className="small mb-0" style={{ color: '#92400e', lineHeight: 1.6 }}>⚠️ {chapter.warn}</p>
            </div>
          )}
          {chapter.tip && (
            <div className="alert alert-primary mt-2 mb-0" style={{ background: '#EEF5FC' }}>
              <p className="small mb-0" style={{ color: '#1E4E8C', lineHeight: 1.6 }}>💡 {chapter.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PrenotazioneSicuraClient({
  locale,
  bookHref,
}: {
  locale: Locale;
  bookHref: string;
}) {
  const t = T[locale];

  return (
    <div className="page-container pb-5">

      {/* Hero */}
      <section className="text-center py-5">
        <div className="mb-2" style={{ fontSize: '2.5rem' }}>🔍</div>
        <h1 className="fw-bold text-primary mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', lineHeight: 1.3 }}>
          {t.hero_title}
        </h1>
        <p className="fs-5 text-secondary mx-auto mb-0" style={{ maxWidth: 600, lineHeight: 1.6 }}>
          {t.hero_sub}
        </p>
      </section>

      {/* 5 pillole trust */}
      <section className="mb-5">
        <h2 className="fw-bold text-primary fs-3 mb-3">{t.trust_title}</h2>
        <div
          className="d-grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {t.trust_pills.map((pill, i) => (
            <div key={i} className="card">
              <div className="card-body d-flex flex-column gap-2">
                <span style={{ fontSize: '1.6rem' }}>{pill.icon}</span>
                <strong className="text-primary">{pill.title}</strong>
                <p className="small text-secondary mb-0 flex-fill" style={{ lineHeight: 1.55 }}>{pill.text}</p>
                {pill.link && (
                  <a
                    href={pill.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small fw-semibold text-primary text-decoration-none mt-1"
                  >
                    {pill.link.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Checklist rapida */}
      <section className="card border-primary mb-5" style={{ background: '#EEF5FC' }}>
        <div className="card-body p-4">
          <h2 className="fw-bold text-primary fs-3 mb-3">✅ {t.checklist_title}</h2>
          <ol className="ps-4 d-flex flex-column gap-2 mb-3">
            {t.checklist.map((item, i) => (
              <li key={i} className="small" style={{ color: '#1E4E8C', lineHeight: 1.55 }}>{item}</li>
            ))}
          </ol>
          <div className="d-flex gap-2 flex-wrap">
            <a
              href={UFFICIOCAMERALE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm"
            >
              🏢 {t.cta_verify_ri}
            </a>
            <a
              href={AIRBNB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm"
            >
              ⭐ {t.cta_verify_airbnb}
            </a>
          </div>
        </div>
      </section>

      {/* Guida completa */}
      <section className="mb-5">
        <h2 className="fw-bold text-primary fs-3 mb-1">{t.guide_title}</h2>
        <p className="small text-muted fst-italic mb-3">{t.guide_sub}</p>
        {t.chapters.map((chapter, i) => (
          <Chapter key={i} chapter={chapter} index={i} />
        ))}
      </section>

      {/* In caso di truffa */}
      <section className="card border mb-5" style={{ background: '#FFF8E7', borderColor: '#FCAF1A' }}>
        <div className="card-body p-4">
          <h3 className="fw-bold mb-3" style={{ color: '#92400e' }}>🚨 {t.scam_title}</h3>
          <ol className="ps-4 d-flex flex-column gap-2 mb-0">
            {t.scam_steps.map((step, i) => (
              <li key={i} className="small" style={{ color: '#78350f', lineHeight: 1.5 }}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA finale */}
      <section className="text-center">
        <a
          href={bookHref}
          className="btn btn-warning btn-lg fw-bold"
          style={{ color: '#111' }}
        >
          {t.cta_book}
        </a>
        <p className="small text-muted mt-2 mb-0">{t.cta_book_sub}</p>
      </section>

    </div>
  );
}
