'use client';
import { useState } from 'react';

// ─── Tipi ─────────────────────────────────────────────────────────────────────
type Locale = 'it' | 'en' | 'de' | 'pl';
interface FaqItem {
  q: string;
  a: string;
  /** Link opzionale mostrato in fondo alla risposta (es. guida self check-in) */
  link?: { label: string; href: string };
}
interface FaqCategory { icon: string; label: string; items: FaqItem[]; }

// ─── Traduzioni UI ─────────────────────────────────────────────────────────────
const UI: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  faqTitle: string;
  contactTitle: string;
  contactSubtitle: string;
  wa: string; waSub: string;
  tel: string; telSub: string;
  mail: string; mailSub: string;
  bookBanner: string; bookBtn: string;
  safeBannerText: string; safeBannerBtn: string;
}> = {
  it: {
    pageTitle: 'Contatti',
    pageSubtitle: 'Trova la risposta qui sotto, o scrivici direttamente.',
    faqTitle: 'Domande frequenti',
    contactTitle: 'Non hai trovato la risposta?',
    contactSubtitle: 'Siamo disponibili tutti i giorni.',
    wa: 'WhatsApp', waSub: 'Risposta entro 1 ora',
    tel: 'Telefono', telSub: 'Lun–Dom, 9:00–21:00',
    mail: 'Email', mailSub: 'Risposta entro 24 ore',
    bookBanner: 'Vuoi prenotare direttamente?', bookBtn: 'Prenota ora',
    safeBannerText: 'Vuoi sapere chi siamo prima di prenotare?', safeBannerBtn: 'Prenotazione sicura →',
  },
  en: {
    pageTitle: 'Contact Us',
    pageSubtitle: 'Find your answer below, or write to us directly.',
    faqTitle: 'Frequently asked questions',
    contactTitle: "Didn't find your answer?",
    contactSubtitle: "We're available every day.",
    wa: 'WhatsApp', waSub: 'Reply within 1 hour',
    tel: 'Phone', telSub: 'Mon–Sun, 9:00–21:00',
    mail: 'Email', mailSub: 'Reply within 24 hours',
    bookBanner: 'Want to book directly?', bookBtn: 'Book now',
    safeBannerText: 'Want to know who we are before booking?', safeBannerBtn: 'Safe booking →',
  },
  de: {
    pageTitle: 'Kontakt',
    pageSubtitle: 'Finden Sie Ihre Antwort unten oder schreiben Sie uns direkt.',
    faqTitle: 'Häufig gestellte Fragen',
    contactTitle: 'Keine Antwort gefunden?',
    contactSubtitle: 'Wir sind täglich für Sie da.',
    wa: 'WhatsApp', waSub: 'Antwort innerhalb 1 Stunde',
    tel: 'Telefon', telSub: 'Mo–So, 9:00–21:00',
    mail: 'E-Mail', mailSub: 'Antwort innerhalb 24 Stunden',
    bookBanner: 'Möchten Sie direkt buchen?', bookBtn: 'Jetzt buchen',
    safeBannerText: 'Möchten Sie wissen, wer wir sind?', safeBannerBtn: 'Sicheres Buchen →',
  },
  pl: {
    pageTitle: 'Kontakt',
    pageSubtitle: 'Znajdź odpowiedź poniżej lub napisz do nas bezpośrednio.',
    faqTitle: 'Często zadawane pytania',
    contactTitle: 'Nie znalazłeś odpowiedzi?',
    contactSubtitle: 'Jesteśmy dostępni każdego dnia.',
    wa: 'WhatsApp', waSub: 'Odpowiedź w ciągu 1 godziny',
    tel: 'Telefon', telSub: 'Pon–Nd, 9:00–21:00',
    mail: 'Email', mailSub: 'Odpowiedź w ciągu 24 godzin',
    bookBanner: 'Chcesz zarezerwować bezpośrednio?', bookBtn: 'Zarezerwuj',
    safeBannerText: 'Chcesz wiedzieć, kim jesteśmy przed rezerwacją?', safeBannerBtn: 'Bezpieczna rezerwacja →',
  },
};

// ─── Dati FAQ ──────────────────────────────────────────────────────────────────
function getFaqData(locale: Locale): FaqCategory[] {
  const categories: FaqCategory[] = [];

  // 🛡️ Sicurezza — solo IT
  if (locale === 'it') {
    categories.push({
      icon: '🛡️', label: 'Sicurezza e prenotazione',
      items: [
        {
          q: 'Posso venire a vedere la casa prima di prenotare?',
          a: 'Non effettuiamo sopralluoghi prima della prenotazione.\nVedere fisicamente una casa non garantisce che chi la mostra abbia il diritto legale di affittarla: è uno dei meccanismi più comuni nelle truffe sugli affitti brevi.\nL\'unica e vera garanzia è prenotare su una piattaforma certificata (Airbnb) con host verificato, recensioni reali e CIN esposto nell\'annuncio.',
          link: { label: 'Leggi la guida alla prenotazione sicura →', href: '/it/prenotazione-sicura' },
        },
        {
          q: 'Ho chiamato ma non risponde nessuno. Come posso contattarvi?',
          a: 'I nostri canali principali sono WhatsApp, email e telefono (tasto 4 del centralino).\nPer contatti rapidi scrivi su WhatsApp: rispondiamo di solito entro poche ore.\nNon effettuiamo assistenza telefonica diretta: WhatsApp ci permette di risponderti in modo più preciso e tracciabile.',
        },
      ],
    });
  }

  const faq: Record<Locale, FaqCategory[]> = {
    it: [
      {
        icon: '🧸', label: 'Bambini',
        items: [
          { q: 'I bambini fino a 2 anni pagano?', a: 'I bambini fino a 2 anni non sono compresi nel prezzo ma vengono conteggiati ai fini della massima capienza della struttura e non pagano la tassa di soggiorno.' },
          { q: 'È disponibile una culla da campeggio?', a: 'Sì, per i bambini fino a 2 anni è disponibile su richiesta la culla da campeggio con seggiolone al costo di €40 a soggiorno. Va prenotata con almeno 72 ore di anticipo contattandoci via WhatsApp.' },
          { q: 'I bambini dai 3 agli 11 anni pagano?', a: 'I bambini dai 3 agli 11 anni pagano come gli adulti e non pagano la tassa di soggiorno.' },
        ],
      },
      {
        icon: '🗓️', label: 'Arrivo e partenza',
        items: [
          { q: 'Quali sono gli orari di check-in e check-out?', a: 'Check-in dalle 16:00 alle 19:00, check-out dalle 08:00 entro le 10:00.' },
          { q: 'Posso arrivare dopo le 19:00?', a: 'Sì. Se il tuo volo non ti consente di arrivare entro le 19:00, oppure vuoi essere libero dagli orari della reception, puoi richiedere il self check-in.', link: { label: 'Scopri come funziona il self check-in →', href: '/it/self-checkin' } },
          { q: 'Posso fare il check-out prima delle 08:00?', a: 'Sì. Se devi partire prima delle 08:00, segnalacelo quando arrivi: organizzeremo insieme il check-out anticipato.' },
          { q: 'Posso richiedere il check-in anticipato?', a: 'No, nella quasi totalità dei casi l\'ospite precedente lascia la struttura alle 10:00 e nelle sei ore successive prepariamo tutto per il tuo arrivo.\nIn casi eccezionali è possibile: contattaci qualche giorno prima per verificare la disponibilità.' },
          { q: 'Come funziona la consegna delle chiavi?', a: 'Siamo presenti ad accoglierti di persona.' },
          { q: 'Come funziona il self check-in?', a: 'Il self check-in non è automatico: va richiesto con almeno 72 ore di anticipo.\n• Richiedi il self check-in almeno 72 ore prima dell\'arrivo\n• Invia i documenti di identità di tutti gli ospiti adulti (leggibili e completi)\n• Devi essere raggiungibile nelle 2 ore precedenti l\'arrivo', link: { label: 'Consulta la guida al self check-in →', href: '/it/self-checkin' } },
          { q: 'Come arrivo in treno? La stazione è vicina?', a: 'La stazione di Minturno-Scauri si trova al centro del paese.\nTempi di percorrenza: da Roma circa 1h40, da Napoli circa 60 minuti.\nVisita trenitalia.com per orari e biglietti.', link: { label: 'Vedi la stazione su Maps →', href: 'https://maps.app.goo.gl/7m3S4mdEpvwaa1zB9' } },
          { q: 'Dove si trova la reception per il check-in fisico?', a: 'Riceverai informazioni dettagliate per il check-in entro 7 giorni prima dell\'arrivo.' },
          { q: 'C\'è un numero WhatsApp per contatti diretti?', a: 'Sì, puoi contattarci via WhatsApp al contatto indicato in questa pagina. Lo usiamo per organizzare l\'arrivo, il check-in e qualsiasi esigenza durante il soggiorno.' },
        ],
      },
      {
        icon: '🏊', label: 'Piscina',
        items: [
          { q: 'La piscina è aperta? In quale periodo dell\'anno?', a: 'La piscina è disponibile indicativamente dal 30 maggio al 15 ottobre. Le date esatte dipendono dalla struttura e dalle condizioni meteo. Contattaci per conferma sul tuo periodo.' },
          { q: 'La piscina è privata (uso esclusivo) o condivisa?', a: 'Il tipo di piscina, ove presente, è indicato nella descrizione dell\'abitazione (condivisa o esclusiva).' },
          { q: 'La piscina è inclusa nel prezzo?', a: 'Sì, l\'uso della piscina è completamente incluso nel prezzo di affitto. Non ci sono costi aggiuntivi.' },
          { q: 'La piscina è adatta ai bambini piccoli? È sicura?', a: 'I bambini possono accedere in piscina solo se accompagnati da un adulto. La piscina principale ha una profondità massima di 1,20 metri.' },
          { q: 'Le foto mostrano piscine diverse — quale è quella inclusa?', a: 'Il tipo di piscina (condivisa o esclusiva), ove disponibile, è indicato nelle caratteristiche della casa.' },
        ],
      },
      {
        icon: '🏠', label: 'Struttura e servizi',
        items: [
          { q: 'L\'alloggio è interamente per noi? Non ci sono altri ospiti?', a: 'Sì, ogni unità abitativa è riservata esclusivamente agli ospiti che la prenotano. Spazi come parcheggio, piscina e area ombrelloni potrebbero essere condivisi con ospiti di altre unità all\'interno dello stesso complesso.' },
          { q: 'Biancheria da letto e asciugamani sono inclusi?', a: 'Sì, lenzuola e asciugamani da bagno sono inclusi nel prezzo. Gli asciugamani da mare non sono forniti.' },
          { q: 'La pulizia finale è obbligatoria? Quanto costa?', a: 'Sì, le pulizie finali sono comprese nel prezzo salvo diversa indicazione durante la prenotazione. Le pulizie non includono il riassetto giornaliero delle camere.' },
          { q: 'I consumi energetici (luce, gas, acqua) sono inclusi nel prezzo?', a: 'No. I consumi energetici sono addebitati a parte, misurati tramite lettura dei contatori al check-in e al check-out. Paghi solo quello che hai consumato.\nIn inverno il costo dipende molto dalle abitudini di utilizzo del riscaldamento.', link: { label: 'Scopri tariffe e consigli sui consumi →', href: '/it/utenze' } },
          { q: 'Il WiFi è disponibile? È veloce per smart working e videochiamate?', a: 'Sì, il WiFi è disponibile in tutte le strutture LivingApple. La connessione è sufficiente per smart working e videochiamate professionali, ma le prestazioni variano da struttura a struttura. Per la velocità esatta contattaci.' },
          { q: 'Il riscaldamento è garantito d\'inverno?', a: 'Sì, tutte le strutture sono dotate di impianto di riscaldamento funzionante. In caso di problemi tecnici siamo reperibili tempestivamente.\nAttenzione: i consumi energetici (luce, gas, acqua) sono misurati a contatore e addebitati a parte al termine del soggiorno.', link: { label: 'Scopri come funzionano le utenze →', href: '/it/utenze' } },
          { q: 'C\'è il parcheggio privato? È gratuito?', a: 'Sì, ogni struttura dispone di parcheggio privato all\'interno della proprietà o nelle immediate vicinanze. In alcuni casi potrebbe essere a pagamento: lo trovi indicato nella scheda della struttura.' },
          { q: 'A Scauri è facile parcheggiare?', a: 'Sì, non ci sono grossi problemi di parcheggio. Direttamente in struttura è possibile stipulare un abbonamento per le strisce blu al costo di 15,00 € a settimana, valido per Scauri e l\'intero Comune di Minturno.' },
          { q: 'Come si affronta un problema tecnico durante il soggiorno?', a: 'In caso di problemi tecnici (acqua calda, riscaldamento, ecc.) contattaci immediatamente su WhatsApp. Per problemi urgenti la priorità è massima e interveniamo nel più breve tempo possibile.' },
          { q: 'È possibile avere un cambio asciugamani o una pulizia durante il soggiorno?', a: 'Sì, durante il soggiorno è possibile richiedere:\n• Cambio asciugamani: 4 € a set per persona\n• Pulizia intermedia della casa: costo e data da concordare al check-in\nPer soggiorni superiori a una settimana consigliamo di organizzarlo già all\'arrivo.' },
        ],
      },
      {
        icon: '📍', label: 'Posizione e dintorni',
        items: [
          { q: 'Quanto dista il mare? Ci sono spiagge attrezzate?', a: 'LivingApple campagna dista circa 2-3 km dalla spiaggia di Scauri/Minturno. LivingApple mare è a soli 250 metri. Ci sono lidi attrezzati raggiungibili in auto o a piedi.' },
          { q: 'La struttura si trova a Scauri o a Minturno? Come la trovo?', a: 'Le strutture LivingApple si trovano tra Minturno e Scauri (LT), nel Lazio meridionale. Ti invieremo l\'indirizzo esatto e il pin Google Maps nel messaggio di benvenuto.' },
          { q: 'Ci sono supermercati, ristoranti e negozi vicini?', a: 'Sì, a Scauri e Minturno trovi supermercati, bar, ristoranti, farmacie e negozi a pochi minuti in auto. I tempi variano a seconda della struttura scelta.' },
          { q: 'Quanto dista dall\'aeroporto di Roma Fiumicino?', a: 'L\'aeroporto di Roma Fiumicino (FCO) è a circa 165 km, raggiungibile in circa 1h40-2h00 in auto (A1). In alternativa: treno da Roma Termini fino alla stazione di Minturno-Scauri.' },
          { q: 'Quanto tempo da Roma e da Napoli in auto o in treno?', a: 'In auto: da Roma circa 1h40 (A1), da Napoli circa 1h (A1).\nIn treno: da Roma Termini circa 1h40, da Napoli Centrale circa 60 minuti.\nMinturno si trova a metà strada tra Roma e Napoli.' },
          { q: 'La strada per raggiungere la struttura è difficile?', a: 'Le strade principali di accesso sono percorribili normalmente. Per strutture collinari ti invieremo indicazioni dettagliate e il percorso consigliato nel messaggio di benvenuto.' },
        ],
      },
      {
        icon: '💶', label: 'Prezzi e pagamenti',
        items: [
          { q: 'La tassa di soggiorno è inclusa nel prezzo?', a: 'Sì, è compresa nel prezzo mostrato sul nostro sito.\nLe OTA (Airbnb e Booking) hanno difficoltà ad adattare il calcolo per ogni singola Municipalità: a Minturno la tassa è di 2 € a notte per adulto (massimo 10 notti). I bambini under 12 anni sono esenti.' },
          { q: 'Come funziona la politica di cancellazione?', a: 'Dipende dalla tariffa scelta al momento della prenotazione. I dettagli completi sono indicati nella scheda dell\'offerta.' },
          { q: 'È previsto un deposito cauzionale?', a: 'Sì, verrà richiesto un deposito cauzionale all\'arrivo. L\'importo esatto varia da casa a casa ed è indicato sul nostro sito.\nAll\'arrivo sarà richiesta una carta di credito (non Debit Card, non PostePay). Il deposito sarà restituito integralmente entro 48 ore dalla partenza in assenza di danni.', link: { label: 'Come funziona il deposito cauzionale →', href: '/it/deposito' } },
          { q: 'È possibile trattare il prezzo per soggiorni lunghi o gruppi?', a: 'Per soggiorni di un mese o più è possibile concordare una tariffa personalizzata. Contattaci direttamente con le date esatte e il numero di ospiti.' },
          { q: 'Ho visto prezzi diversi su pagine diverse — quale è corretto?', a: 'Il prezzo corretto e definitivo è quello mostrato nella pagina di dettaglio dell\'annuncio al momento della prenotazione. In nessun caso il prezzo è comprensivo dei consumi energetici.' },
          { q: 'È possibile avere una fattura per soggiorni aziendali?', a: 'Sì, per soggiorni aziendali è possibile emettere fattura. Contattaci prima di prenotare indicando ragione sociale, P.IVA e le date del soggiorno.' },
          { q: 'I consumi energetici (luce, gas, acqua) sono inclusi nel prezzo?', a: 'No. I consumi energetici sono addebitati a parte, misurati tramite lettura dei contatori al check-in e al check-out. Paghi solo quello che hai consumato.\nIn inverno il costo dipende molto dalle abitudini di utilizzo del riscaldamento.', link: { label: 'Scopri tariffe e consigli sui consumi →', href: '/it/utenze' } },
        ],
      },
    ],
    en: [
      {
        icon: '🧸', label: 'Children',
        items: [
          { q: 'Do children up to 2 years old pay?', a: 'Children up to 2 years old are not included in the price but are counted towards the maximum capacity of the property and do not pay tourist tax.' },
          { q: 'Is a camping cot available?', a: 'Yes, for children up to 2 years old a camping cot with highchair is available on request at €40 per stay. Please book at least 72 hours in advance by contacting us via WhatsApp.' },
          { q: 'Do children aged 3 to 11 pay?', a: 'Children aged 3 to 11 pay the same rate as adults and do not pay tourist tax.' },
        ],
      },
      {
        icon: '🗓️', label: 'Arrival & departure',
        items: [
          { q: 'What are the check-in and check-out times?', a: 'Check-in from 4:00 PM to 7:00 PM, check-out from 8:00 AM by 10:00 AM.' },
          { q: 'Can I arrive after 7:00 PM?', a: 'Yes. If your flight does not allow you to arrive by 7:00 PM, or if you prefer to be free from reception hours, you can request self check-in.', link: { label: 'Find out how self check-in works →', href: '/en/self-checkin' } },
          { q: 'Can I check out before 8:00 AM?', a: 'Yes. If you need to leave before 8:00 AM, let us know when you arrive and we will arrange an early check-out together.' },
          { q: 'Can I request an early check-in?', a: 'In almost all cases the previous guest leaves at 10:00 AM and we use the following six hours to prepare everything for your arrival.\nIn exceptional cases it may be possible: contact us a few days before arrival to check availability.' },
          { q: 'How does key handover work?', a: 'We are personally present to welcome you upon arrival.' },
          { q: 'How does self check-in work?', a: 'Self check-in is not automatic: it must be requested at least 72 hours in advance.\n• Request self check-in at least 72 hours before arrival\n• Send ID documents of all adult guests (legible and complete)\n• You must be reachable in the 2 hours before arrival', link: { label: 'Read the self check-in guide →', href: '/en/self-checkin' } },
          { q: 'How do I get here by train? Is the station nearby?', a: 'Minturno-Scauri station is in the centre of town.\nJourney times: approximately 1h40 from Rome, 60 minutes from Naples.\nVisit trenitalia.com for timetables and tickets.', link: { label: 'View station on Maps →', href: 'https://maps.app.goo.gl/7m3S4mdEpvwaa1zB9' } },
          { q: 'Where is the reception for physical check-in?', a: 'You will receive detailed check-in information within 7 days before your arrival.' },
          { q: 'Is there a WhatsApp number for direct contact?', a: 'Yes, you can contact us via WhatsApp at the number shown on this page. We use it to organise arrival, check-in and any needs during your stay.' },
        ],
      },
      {
        icon: '🏊', label: 'Pool',
        items: [
          { q: 'Is the pool open? What time of year?', a: 'The pool is generally available from 30 May to 15 October. Exact dates depend on the property and weather conditions. Contact us to confirm for your specific dates.' },
          { q: 'Is the pool private (exclusive use) or shared?', a: 'The type of pool, where available, is indicated in the property description (shared or exclusive).' },
          { q: 'Is the pool included in the price?', a: 'Yes, use of the pool is fully included in the rental price. There are no additional costs.' },
          { q: 'Is the pool suitable for young children? Is it safe?', a: 'Children may only use the pool when accompanied by an adult. The main pool has a maximum depth of 1.20 metres.' },
          { q: 'The photos show different pools — which one is included?', a: 'The type of pool (shared or exclusive), where available, is indicated in the property features.' },
        ],
      },
      {
        icon: '🏠', label: 'Property & services',
        items: [
          { q: 'Is the accommodation entirely ours? Are there no other guests?', a: 'Yes, each accommodation unit is reserved exclusively for the guests who book it. Spaces such as the car park, pool and sun terrace area may be shared with guests from other units within the same complex.' },
          { q: 'Are bed linen and towels included?', a: 'Yes, bed linen and bathroom towels are included in the price. Beach towels are not provided.' },
          { q: 'Is the final cleaning mandatory? How much does it cost?', a: 'Yes, the final cleaning is included in the price unless otherwise stated during booking. Cleaning does not include daily room tidying.' },
          { q: 'Are energy costs (electricity, gas, water) included in the price?', a: 'No. Energy costs are charged separately, measured by meter readings at check-in and check-out. You only pay for what you actually consume.\nIn winter, the cost depends heavily on how much you use the heating.', link: { label: 'See rates and energy tips →', href: '/en/utilities' } },
          { q: 'Is WiFi available? Is it fast enough for remote working and video calls?', a: 'Yes, WiFi is available in all LivingApple properties. The connection is sufficient for remote working and professional video calls, though performance varies between properties. Contact us for the exact speed.' },
          { q: 'Is heating guaranteed in winter?', a: 'Yes, all properties are equipped with a working heating system. In the event of technical problems, we are available promptly.\nPlease note: energy costs (electricity, gas, water) are measured by meter and charged separately at the end of your stay.', link: { label: 'See how utilities work →', href: '/en/utilities' } },
          { q: 'Is there private parking? Is it free?', a: 'Yes, each property has private parking on site or nearby. In some cases it may be chargeable: this is indicated on the property listing.' },
          { q: 'Is it easy to park in Scauri?', a: 'Yes, parking is generally not a problem. At the property itself you can purchase a weekly blue-zone permit for €15.00, valid in Scauri and the entire Municipality of Minturno.' },
          { q: 'How do I deal with a technical problem during my stay?', a: 'In case of technical problems (hot water, heating, etc.) contact us immediately on WhatsApp. For urgent issues, our response priority is maximum and we intervene as quickly as possible.' },
          { q: 'Can I get a towel change or cleaning during my stay?', a: 'Yes, during your stay you can request:\n• Towel change: €4 per set per person\n• Mid-stay cleaning: cost and date to be agreed at check-in\nFor stays of more than one week, we recommend arranging this at arrival.' },
        ],
      },
      {
        icon: '📍', label: 'Location & surroundings',
        items: [
          { q: 'How far is the sea? Are there equipped beaches?', a: 'LivingApple countryside is about 2-3 km from Scauri/Minturno beach. LivingApple sea is just 250 metres away. There are equipped beach clubs reachable by car or on foot.' },
          { q: 'Is the property in Scauri or Minturno? How do I find it?', a: 'LivingApple properties are located between Minturno and Scauri (LT), in southern Lazio. We will send you the exact address and Google Maps pin in the welcome message.' },
          { q: 'Are there supermarkets, restaurants and shops nearby?', a: 'Yes, in Scauri and Minturno you will find supermarkets, bars, restaurants, pharmacies and shops a few minutes away by car. Travel times vary depending on the property chosen.' },
          { q: 'How far is it from Rome Fiumicino Airport?', a: 'Rome Fiumicino Airport (FCO) is approximately 165 km away, reachable in about 1h40-2h00 by car (A1 motorway). Alternatively: train from Roma Termini to Minturno-Scauri station.' },
          { q: 'How long does it take from Rome and Naples by car or train?', a: 'By car: from Rome approx. 1h40 (A1 motorway), from Naples approx. 1h (A1).\nBy train: from Roma Termini approx. 1h40, from Napoli Centrale approx. 60 minutes.\nMinturno is halfway between Rome and Naples.' },
          { q: 'Is the road to the property difficult?', a: 'The main access roads are easy to navigate. For hillside properties we will send you detailed directions and the recommended route in the welcome message.' },
        ],
      },
      {
        icon: '💶', label: 'Prices & payments',
        items: [
          { q: 'Is the tourist tax included in the price?', a: 'Yes, it is included in the price shown on our website.\nOTA platforms (Airbnb and Booking) have difficulty adapting the calculation for each individual Municipality: in Minturno the tax is €2 per night per adult (maximum 10 nights). Children under 12 are exempt.' },
          { q: 'How does the cancellation policy work?', a: 'It depends on the rate chosen at the time of booking. Full details are shown on the offer page.' },
          { q: 'Is a security deposit required?', a: 'Yes, a security deposit will be required on arrival. The exact amount varies by property and is shown on our website.\nA credit card will be required on arrival (not Debit Card, not PostePay). The deposit will be fully refunded within 48 hours of departure if there is no damage.', link: { label: 'How the security deposit works →', href: '/en/deposito' } },
          { q: 'Can the price be negotiated for long stays or groups?', a: 'For stays of one month or more, a personalised rate can be arranged. Contact us directly with the exact dates and number of guests.' },
          { q: 'I have seen different prices on different pages — which one is correct?', a: 'The correct and final price is the one shown on the listing detail page at the time of booking. The price never includes energy consumption.' },
          { q: 'Is it possible to get an invoice for business stays?', a: 'Yes, invoices can be issued for business stays. Contact us before booking, providing your company name, VAT number and stay dates.' },
          { q: 'Are energy costs (electricity, gas, water) included in the price?', a: 'No. Energy costs are charged separately, measured by meter readings at check-in and check-out. You only pay for what you actually consume.\nIn winter, the cost depends heavily on how much you use the heating.', link: { label: 'See rates and energy tips →', href: '/en/utilities' } },
        ],
      },
    ],
    de: [
      {
        icon: '🧸', label: 'Kinder',
        items: [
          { q: 'Zahlen Kinder bis 2 Jahre?', a: 'Kinder bis 2 Jahre sind nicht im Preis enthalten, werden jedoch für die maximale Kapazität der Unterkunft gezählt und zahlen keine Kurtaxe.' },
          { q: 'Ist ein Campingbettchen verfügbar?', a: 'Ja, für Kinder bis 2 Jahre ist auf Anfrage ein Campingbettchen mit Hochstuhl für €40 pro Aufenthalt verfügbar. Bitte mindestens 72 Stunden im Voraus über WhatsApp reservieren.' },
          { q: 'Zahlen Kinder von 3 bis 11 Jahren?', a: 'Kinder von 3 bis 11 Jahren zahlen denselben Tarif wie Erwachsene und zahlen keine Kurtaxe.' },
        ],
      },
      {
        icon: '🗓️', label: 'Ankunft & Abreise',
        items: [
          { q: 'Wann ist Check-in und Check-out?', a: 'Check-in von 16:00 bis 19:00 Uhr, Check-out von 08:00 bis spätestens 10:00 Uhr.' },
          { q: 'Kann ich nach 19:00 Uhr ankommen?', a: 'Ja. Wenn Ihr Flug keine Ankunft bis 19:00 Uhr ermöglicht oder Sie von den Rezeptionszeiten unabhängig sein möchten, können Sie Self-Check-in beantragen.', link: { label: 'So funktioniert der Self-Check-in →', href: '/de/self-checkin' } },
          { q: 'Kann ich vor 08:00 Uhr abreisen?', a: 'Ja. Wenn Sie vor 08:00 Uhr abreisen müssen, teilen Sie uns dies bei der Ankunft mit — wir organisieren gemeinsam einen frühen Check-out.' },
          { q: 'Kann ich einen früheren Check-in beantragen?', a: 'In fast allen Fällen verlässt der vorherige Gast die Unterkunft um 10:00 Uhr, und wir nutzen die folgenden sechs Stunden, um alles für Ihre Ankunft vorzubereiten.\nIn Ausnahmefällen ist es möglich: Bitte kontaktieren Sie uns einige Tage vor der Ankunft.' },
          { q: 'Wie funktioniert die Schlüsselübergabe?', a: 'Wir empfangen Sie persönlich bei Ihrer Ankunft.' },
          { q: 'Wie funktioniert der Self-Check-in?', a: 'Self-Check-in ist nicht automatisch: Er muss mindestens 72 Stunden im Voraus beantragt werden.\n• Beantragen Sie den Self-Check-in mindestens 72 Stunden vor der Ankunft\n• Senden Sie die Ausweisdokumente aller erwachsenen Gäste (lesbar und vollständig)\n• Sie müssen in den 2 Stunden vor der Ankunft erreichbar sein', link: { label: 'Self-Check-in-Anleitung lesen →', href: '/de/self-checkin' } },
          { q: 'Wie komme ich mit dem Zug an? Ist der Bahnhof in der Nähe?', a: 'Der Bahnhof Minturno-Scauri befindet sich im Ortskern.\nFahrtzeiten: ca. 1h40 ab Rom, ca. 60 Minuten ab Neapel.\nFahrpläne und Tickets finden Sie auf trenitalia.com.', link: { label: 'Bahnhof auf Maps ansehen →', href: 'https://maps.app.goo.gl/7m3S4mdEpvwaa1zB9' } },
          { q: 'Wo befindet sich die Rezeption für den persönlichen Check-in?', a: 'Sie erhalten detaillierte Check-in-Informationen spätestens 7 Tage vor Ihrer Ankunft.' },
          { q: 'Gibt es eine WhatsApp-Nummer für direkten Kontakt?', a: 'Ja, Sie können uns über WhatsApp unter der auf dieser Seite angegebenen Nummer erreichen. Wir nutzen es für Ankunft, Check-in und alle Bedürfnisse während des Aufenthalts.' },
        ],
      },
      {
        icon: '🏊', label: 'Pool',
        items: [
          { q: 'Ist der Pool geöffnet? Zu welcher Jahreszeit?', a: 'Der Pool ist in der Regel vom 30. Mai bis zum 15. Oktober verfügbar. Die genauen Daten hängen von der Unterkunft und den Wetterbedingungen ab. Bitte kontaktieren Sie uns zur Bestätigung.' },
          { q: 'Ist der Pool privat (Alleinnutzung) oder wird er geteilt?', a: 'Die Art des Pools, sofern vorhanden, ist in der Unterkunftsbeschreibung angegeben (geteilt oder exklusiv).' },
          { q: 'Ist der Pool im Preis inbegriffen?', a: 'Ja, die Nutzung des Pools ist vollständig im Mietpreis enthalten. Es fallen keine zusätzlichen Kosten an.' },
          { q: 'Ist der Pool für Kleinkinder geeignet? Ist er sicher?', a: 'Kinder dürfen den Pool nur in Begleitung eines Erwachsenen nutzen. Der Hauptpool hat eine maximale Tiefe von 1,20 Metern.' },
          { q: 'Die Fotos zeigen verschiedene Pools — welcher ist inbegriffen?', a: 'Die Art des Pools (geteilt oder exklusiv), sofern vorhanden, ist in den Unterkunftsmerkmalen angegeben.' },
        ],
      },
      {
        icon: '🏠', label: 'Unterkunft & Services',
        items: [
          { q: 'Gehört die Unterkunft ganz uns? Gibt es keine anderen Gäste?', a: 'Ja, jede Wohneinheit ist ausschließlich für die buchenden Gäste reserviert. Bereiche wie Parkplatz, Pool und Liegewiese können mit Gästen anderer Einheiten im selben Komplex geteilt werden.' },
          { q: 'Sind Bettwäsche und Handtücher inbegriffen?', a: 'Ja, Bettwäsche und Badetücher sind im Preis enthalten. Strandtücher werden nicht gestellt.' },
          { q: 'Ist die Endreinigung obligatorisch? Was kostet sie?', a: 'Ja, die Endreinigung ist im Preis inbegriffen, sofern bei der Buchung nichts anderes angegeben ist. Die Reinigung umfasst kein tägliches Aufräumen der Zimmer.' },
          { q: 'Sind Energiekosten (Strom, Gas, Wasser) im Preis enthalten?', a: 'Nein. Energiekosten werden separat berechnet, gemessen durch Zählerablesung beim Check-in und Check-out. Sie zahlen nur, was Sie tatsächlich verbraucht haben.\nIm Winter hängen die Kosten stark vom Heizungsverbrauch ab.', link: { label: 'Tarife und Energie-Tipps ansehen →', href: '/de/energie' } },
          { q: 'Ist WLAN verfügbar? Ist es schnell genug für Homeoffice und Videoanrufe?', a: 'Ja, WLAN ist in allen LivingApple-Unterkünften verfügbar. Die Verbindung reicht für Homeoffice und professionelle Videoanrufe aus, die Leistung variiert jedoch je nach Unterkunft. Für die genaue Geschwindigkeit kontaktieren Sie uns bitte.' },
          { q: 'Ist die Heizung im Winter garantiert?', a: 'Ja, alle Unterkünfte sind mit einer funktionierenden Heizungsanlage ausgestattet. Bei technischen Problemen sind wir umgehend erreichbar.\nHinweis: Energiekosten (Strom, Gas, Wasser) werden per Zähler gemessen und am Ende des Aufenthalts separat in Rechnung gestellt.', link: { label: 'So funktionieren die Nebenkosten →', href: '/de/energie' } },
          { q: 'Gibt es einen Privatparkplatz? Ist er kostenlos?', a: 'Ja, jede Unterkunft verfügt über einen privaten Parkplatz auf dem Grundstück oder in unmittelbarer Nähe. In einigen Fällen kann er kostenpflichtig sein: Dies ist im Unterkunftsangebot angegeben.' },
          { q: 'Ist das Parken in Scauri einfach?', a: 'Ja, das Parken ist in der Regel kein Problem. Direkt in der Unterkunft können Sie eine Wochenkarte für die blaue Zone für 15,00 € erwerben, gültig in Scauri und der gesamten Gemeinde Minturno.' },
          { q: 'Wie gehe ich mit einem technischen Problem während des Aufenthalts um?', a: 'Bei technischen Problemen (Warmwasser, Heizung usw.) kontaktieren Sie uns sofort über WhatsApp. Bei dringenden Problemen hat unsere Reaktion höchste Priorität und wir greifen so schnell wie möglich ein.' },
          { q: 'Kann ich während des Aufenthalts einen Handtuchwechsel oder eine Reinigung bekommen?', a: 'Ja, während des Aufenthalts können Sie Folgendes beantragen:\n• Handtuchwechsel: 4 € pro Set pro Person\n• Zwischenreinigung: Kosten und Datum beim Check-in vereinbaren\nBei Aufenthalten von mehr als einer Woche empfehlen wir, dies bereits bei der Ankunft zu organisieren.' },
        ],
      },
      {
        icon: '📍', label: 'Lage & Umgebung',
        items: [
          { q: 'Wie weit ist das Meer entfernt? Gibt es ausgestattete Strände?', a: 'LivingApple Landhaus ist etwa 2-3 km vom Strand Scauri/Minturno entfernt. LivingApple Meer liegt nur 250 Meter entfernt. Es gibt ausgestattete Strandbäder, die mit dem Auto oder zu Fuß erreichbar sind.' },
          { q: 'Befindet sich die Unterkunft in Scauri oder Minturno? Wie finde ich sie?', a: 'Die LivingApple-Unterkünfte befinden sich zwischen Minturno und Scauri (LT) im südlichen Latium. Wir senden Ihnen die genaue Adresse und den Google Maps-Pin in der Willkommensnachricht.' },
          { q: 'Gibt es in der Nähe Supermärkte, Restaurants und Geschäfte?', a: 'Ja, in Scauri und Minturno finden Sie Supermärkte, Bars, Restaurants, Apotheken und Geschäfte, die nur wenige Minuten mit dem Auto entfernt sind. Die Fahrtzeiten variieren je nach gewählter Unterkunft.' },
          { q: 'Wie weit ist der Flughafen Rom-Fiumicino entfernt?', a: 'Der Flughafen Rom-Fiumicino (FCO) ist ca. 165 km entfernt und mit dem Auto (Autobahn A1) in etwa 1h40-2h00 erreichbar. Alternativ: Zug vom Bahnhof Roma Termini nach Minturno-Scauri.' },
          { q: 'Wie lange dauert es von Rom und Neapel mit dem Auto oder Zug?', a: 'Mit dem Auto: ab Rom ca. 1h40 (A1), ab Neapel ca. 1h (A1).\nMit dem Zug: ab Roma Termini ca. 1h40, ab Napoli Centrale ca. 60 Minuten.\nMinturno liegt auf halbem Weg zwischen Rom und Neapel.' },
          { q: 'Ist die Straße zur Unterkunft schwierig?', a: 'Die Hauptzufahrtsstraßen sind problemlos befahrbar. Für Unterkünfte in Hügellage senden wir Ihnen detaillierte Wegbeschreibungen und die empfohlene Route in der Willkommensnachricht.' },
        ],
      },
      {
        icon: '💶', label: 'Preise & Zahlung',
        items: [
          { q: 'Ist die Kurtaxe im Preis enthalten?', a: 'Ja, sie ist im auf unserer Website angezeigten Preis enthalten.\nOTA-Plattformen (Airbnb und Booking) haben Schwierigkeiten, die Berechnung für jede einzelne Gemeinde anzupassen: In Minturno beträgt die Kurtaxe 2 € pro Nacht und Erwachsenem (maximal 10 Nächte). Kinder unter 12 Jahren sind befreit.' },
          { q: 'Wie funktioniert die Stornierungsbedingung?', a: 'Dies hängt vom bei der Buchung gewählten Tarif ab. Die vollständigen Details sind auf der Angebotsseite angegeben.' },
          { q: 'Wird eine Kaution verlangt?', a: 'Ja, bei der Ankunft wird eine Kaution verlangt. Der genaue Betrag variiert je nach Unterkunft und ist auf unserer Website angegeben.\nBei der Ankunft wird eine Kreditkarte benötigt (keine Debitkarte, keine PostePay). Die Kaution wird innerhalb von 48 Stunden nach der Abreise vollständig zurückerstattet, sofern keine Schäden vorliegen.', link: { label: 'So funktioniert die Kaution →', href: '/de/deposito' } },
          { q: 'Kann der Preis für Langzeitaufenthalte oder Gruppen verhandelt werden?', a: 'Für Aufenthalte von einem Monat oder länger kann ein individueller Tarif vereinbart werden. Kontaktieren Sie uns direkt mit den genauen Daten und der Anzahl der Gäste.' },
          { q: 'Ich habe auf verschiedenen Seiten unterschiedliche Preise gesehen — welcher ist korrekt?', a: 'Der korrekte und endgültige Preis ist der, der bei der Buchung auf der Detailseite des Angebots angezeigt wird. Der Preis schließt in keinem Fall die Energiekosten ein.' },
          { q: 'Ist es möglich, eine Rechnung für Geschäftsaufenthalte zu erhalten?', a: 'Ja, für Geschäftsaufenthalte können Rechnungen ausgestellt werden. Bitte kontaktieren Sie uns vor der Buchung und geben Sie Firmenname, USt-IdNr. und Aufenthaltsdaten an.' },
          { q: 'Sind Energiekosten (Strom, Gas, Wasser) im Preis enthalten?', a: 'Nein. Energiekosten werden separat berechnet, gemessen durch Zählerablesung beim Check-in und Check-out. Sie zahlen nur, was Sie tatsächlich verbraucht haben.\nIm Winter hängen die Kosten stark vom Heizungsverbrauch ab.', link: { label: 'Tarife und Energie-Tipps ansehen →', href: '/de/energie' } },
        ],
      },
    ],
    pl: [
      {
        icon: '🧸', label: 'Dzieci',
        items: [
          { q: 'Czy dzieci do 2 lat płacą?', a: 'Dzieci do 2 lat nie są wliczone w cenę, ale są liczone do maksymalnej pojemności obiektu i nie płacą podatku turystycznego.' },
          { q: 'Czy dostępne jest łóżeczko turystyczne?', a: 'Tak, dla dzieci do 2 lat na życzenie dostępne jest łóżeczko turystyczne z krzesełkiem do karmienia za €40 za pobyt. Prosimy o rezerwację co najmniej 72 godziny wcześniej przez WhatsApp.' },
          { q: 'Czy dzieci w wieku 3–11 lat płacą?', a: 'Dzieci w wieku od 3 do 11 lat płacą tyle samo co dorośli i nie płacą podatku turystycznego.' },
        ],
      },
      {
        icon: '🗓️', label: 'Przyjazd i wyjazd',
        items: [
          { q: 'Jakie są godziny zameldowania i wymeldowania?', a: 'Zameldowanie od 16:00 do 19:00, wymeldowanie od 08:00 do 10:00.' },
          { q: 'Czy mogę przyjechać po 19:00?', a: 'Tak. Jeśli Twój lot nie pozwala na przyjazd przed 19:00 lub chcesz być niezależny od godzin recepcji, możesz poprosić o self check-in.', link: { label: 'Dowiedz się, jak działa self check-in →', href: '/pl/self-checkin' } },
          { q: 'Czy mogę wymeldować się przed 08:00?', a: 'Tak. Jeśli musisz wyjechać przed 08:00, poinformuj nas o tym przy przyjeździe — wspólnie zorganizujemy wcześniejsze wymeldowanie.' },
          { q: 'Czy mogę poprosić o wcześniejsze zameldowanie?', a: 'W prawie wszystkich przypadkach poprzedni gość opuszcza obiekt o 10:00, a w ciągu następnych sześciu godzin przygotowujemy wszystko na Twój przyjazd.\nW wyjątkowych przypadkach jest to możliwe: skontaktuj się z nami kilka dni przed przyjazdem.' },
          { q: 'Jak działa przekazanie kluczy?', a: 'Jesteśmy osobiście obecni, aby Cię przywitać.' },
          { q: 'Jak działa samodzielne zameldowanie?', a: 'Samodzielne zameldowanie nie jest automatyczne: należy je zgłosić co najmniej 72 godziny wcześniej.\n• Poproś o self check-in co najmniej 72 godziny przed przyjazdem\n• Prześlij dokumenty tożsamości wszystkich dorosłych gości (czytelne i kompletne)\n• Musisz być dostępny na 2 godziny przed przyjazdem', link: { label: 'Przeczytaj przewodnik self check-in →', href: '/pl/self-checkin' } },
          { q: 'Jak dojechać pociągiem? Czy stacja jest blisko?', a: 'Stacja Minturno-Scauri znajduje się w centrum miejscowości.\nCzas przejazdu: ok. 1h40 z Rzymu, ok. 60 minut z Neapolu.\nRozkłady jazdy i bilety: trenitalia.com.', link: { label: 'Zobacz stację na Maps →', href: 'https://maps.app.goo.gl/7m3S4mdEpvwaa1zB9' } },
          { q: 'Gdzie znajduje się recepcja do osobistego zameldowania?', a: 'Szczegółowe informacje dotyczące zameldowania otrzymasz w ciągu 7 dni przed przyjazdem.' },
          { q: 'Czy jest numer WhatsApp do bezpośredniego kontaktu?', a: 'Tak, możesz skontaktować się z nami przez WhatsApp pod numerem podanym na tej stronie. Używamy go do organizacji przyjazdu, zameldowania i wszelkich potrzeb podczas pobytu.' },
        ],
      },
      {
        icon: '🏊', label: 'Basen',
        items: [
          { q: 'Czy basen jest otwarty? O jakiej porze roku?', a: 'Basen jest dostępny orientacyjnie od 30 maja do 15 października. Dokładne daty zależą od obiektu i warunków pogodowych. Skontaktuj się z nami w celu potwierdzenia.' },
          { q: 'Czy basen jest prywatny (do wyłącznego użytku) czy wspólny?', a: 'Rodzaj basenu, jeśli dostępny, jest podany w opisie nieruchomości (wspólny lub na wyłączność).' },
          { q: 'Czy basen jest wliczony w cenę?', a: 'Tak, korzystanie z basenu jest w pełni wliczone w cenę wynajmu. Nie ma żadnych dodatkowych kosztów.' },
          { q: 'Czy basen jest odpowiedni dla małych dzieci? Czy jest bezpieczny?', a: 'Dzieci mogą korzystać z basenu wyłącznie pod opieką dorosłego. Główny basen ma maksymalną głębokość 1,20 metra.' },
          { q: 'Zdjęcia pokazują różne baseny — który jest wliczony?', a: 'Rodzaj basenu (wspólny lub na wyłączność), jeśli dostępny, jest podany w cechach nieruchomości.' },
        ],
      },
      {
        icon: '🏠', label: 'Obiekt i usługi',
        items: [
          { q: 'Czy zakwaterowanie jest tylko dla nas? Czy nie ma innych gości?', a: 'Tak, każda jednostka mieszkalna jest zarezerwowana wyłącznie dla gości, którzy ją rezerwują. Przestrzenie takie jak parking, basen i strefa leżaków mogą być współdzielone z gośćmi innych jednostek w tym samym kompleksie.' },
          { q: 'Czy pościel i ręczniki są wliczone?', a: 'Tak, pościel i ręczniki łazienkowe są wliczone w cenę. Ręczniki plażowe nie są zapewniane.' },
          { q: 'Czy sprzątanie końcowe jest obowiązkowe? Ile kosztuje?', a: 'Tak, sprzątanie końcowe jest wliczone w cenę, chyba że podczas rezerwacji zaznaczono inaczej. Sprzątanie nie obejmuje codziennego porządkowania pokoi.' },
          { q: 'Czy koszty energii (prąd, gaz, woda) są wliczone w cenę?', a: 'Nie. Koszty energii są naliczane osobno, mierzone odczytem liczników przy zameldowaniu i wymeldowaniu. Płacisz tylko za to, co faktycznie zużyłeś.\nZimą koszty zależą w dużej mierze od intensywności ogrzewania.', link: { label: 'Zobacz taryfy i wskazówki dotyczące zużycia →', href: '/pl/media' } },
          { q: 'Czy WiFi jest dostępne? Czy jest wystarczająco szybkie do pracy zdalnej i rozmów wideo?', a: 'Tak, WiFi jest dostępne we wszystkich obiektach LivingApple. Połączenie wystarczy do pracy zdalnej i profesjonalnych rozmów wideo, choć prędkość różni się w zależności od obiektu. Skontaktuj się z nami po dokładne dane.' },
          { q: 'Czy ogrzewanie jest zapewnione zimą?', a: 'Tak, wszystkie obiekty są wyposażone w działający system ogrzewania. W przypadku problemów technicznych jesteśmy do dyspozycji.\nUwaga: koszty energii (prąd, gaz, woda) są mierzone licznikiem i naliczane osobno na koniec pobytu.', link: { label: 'Jak działają media →', href: '/pl/media' } },
          { q: 'Czy jest prywatny parking? Czy jest bezpłatny?', a: 'Tak, każdy obiekt posiada prywatny parking na terenie posesji lub w bezpośrednim sąsiedztwie. W niektórych przypadkach może być płatny: informacja ta jest podana w opisie obiektu.' },
          { q: 'Czy łatwo zaparkować w Scauri?', a: 'Tak, parkowanie zazwyczaj nie stanowi problemu. Bezpośrednio w obiekcie można wykupić tygodniowy abonament na strefy niebieskie za 15,00 €, ważny w Scauri i całej gminie Minturno.' },
          { q: 'Jak postępować z problemem technicznym podczas pobytu?', a: 'W przypadku problemów technicznych (ciepła woda, ogrzewanie itp.) skontaktuj się z nami natychmiast przez WhatsApp. W pilnych przypadkach reagujemy priorytetowo i interweniujemy tak szybko, jak to możliwe.' },
          { q: 'Czy mogę otrzymać zmianę ręczników lub sprzątanie podczas pobytu?', a: 'Tak, podczas pobytu możesz zamówić:\n• Wymianę ręczników: 4 € za zestaw na osobę\n• Sprzątanie pośrednie: koszt i termin do uzgodnienia przy zameldowaniu\nW przypadku pobytów dłuższych niż tydzień zalecamy zaplanowanie tego już przy przyjeździe.' },
        ],
      },
      {
        icon: '📍', label: 'Lokalizacja i okolice',
        items: [
          { q: 'Jak daleko jest morze? Czy są plaże z udogodnieniami?', a: 'LivingApple campagna jest oddalona ok. 2-3 km od plaży Scauri/Minturno. LivingApple mare jest zaledwie 250 metrów dalej. W pobliżu znajdują się plaże z udogodnieniami, dostępne samochodem lub pieszo.' },
          { q: 'Czy obiekt znajduje się w Scauri czy Minturno? Jak go znaleźć?', a: 'Obiekty LivingApple znajdują się między Minturno a Scauri (LT) w południowym Lacjum. Dokładny adres i pin Google Maps wyślemy Ci w wiadomości powitalnej.' },
          { q: 'Czy w pobliżu są supermarkety, restauracje i sklepy?', a: 'Tak, w Scauri i Minturno znajdziesz supermarkety, bary, restauracje, apteki i sklepy w kilku minutach jazdy samochodem. Czas dojazdu zależy od wybranego obiektu.' },
          { q: 'Jak daleko jest lotnisko Rzym Fiumicino?', a: 'Lotnisko Rzym Fiumicino (FCO) jest odległe o ok. 165 km, osiągalne samochodem (autostrada A1) w ok. 1h40-2h00. Alternatywnie: pociąg z Roma Termini do stacji Minturno-Scauri.' },
          { q: 'Jak długo trwa podróż z Rzymu i Neapolu samochodem lub pociągiem?', a: 'Samochodem: z Rzymu ok. 1h40 (A1), z Neapolu ok. 1h (A1).\nPociągiem: z Roma Termini ok. 1h40, z Napoli Centrale ok. 60 minut.\nMinturno leży w połowie drogi między Rzymem a Neapolem.' },
          { q: 'Czy droga do obiektu jest trudna?', a: 'Główne drogi dojazdowe są łatwe do pokonania. W przypadku obiektów na wzgórzach wyślemy Ci szczegółowe wskazówki i zalecaną trasę w wiadomości powitalnej.' },
        ],
      },
      {
        icon: '💶', label: 'Ceny i płatności',
        items: [
          { q: 'Czy podatek turystyczny jest wliczony w cenę?', a: 'Tak, jest wliczony w cenę podaną na naszej stronie.\nPlatformy OTA (Airbnb i Booking) mają trudności z dostosowaniem obliczeń do każdej gminy: w Minturno podatek wynosi 2 € za noc na dorosłego (maksymalnie 10 nocy). Dzieci poniżej 12 lat są zwolnione.' },
          { q: 'Jak działa polityka anulowania?', a: 'Zależy od wybranej taryfy w momencie rezerwacji. Pełne szczegóły są podane na stronie oferty.' },
          { q: 'Czy wymagana jest kaucja?', a: 'Tak, przy przyjeździe wymagana jest kaucja. Dokładna kwota różni się w zależności od obiektu i jest podana na naszej stronie.\nPrzy przyjeździe wymagana jest karta kredytowa (nie karta debetowa, nie PostePay). Kaucja zostanie w pełni zwrócona w ciągu 48 godzin od wyjazdu, jeśli nie ma żadnych szkód.', link: { label: 'Jak działa kaucja →', href: '/pl/deposito' } },
          { q: 'Czy cena jest negocjowalna dla długich pobytów lub grup?', a: 'W przypadku pobytów trwających miesiąc lub dłużej możliwe jest uzgodnienie indywidualnej stawki. Skontaktuj się z nami bezpośrednio, podając dokładne daty i liczbę gości.' },
          { q: 'Widziałem różne ceny na różnych stronach — która jest prawidłowa?', a: 'Prawidłowa i ostateczna cena to ta wyświetlana na stronie szczegółów oferty w momencie rezerwacji. Cena nigdy nie obejmuje zużycia energii.' },
          { q: 'Czy można otrzymać fakturę za pobyty służbowe?', a: 'Tak, dla pobytów służbowych możliwe jest wystawienie faktury. Skontaktuj się z nami przed rezerwacją, podając nazwę firmy, NIP i daty pobytu.' },
          { q: 'Czy koszty energii (prąd, gaz, woda) są wliczone w cenę?', a: 'Nie. Koszty energii są naliczane osobno, mierzone odczytem liczników przy zameldowaniu i wymeldowaniu. Płacisz tylko za to, co faktycznie zużyłeś.\nZimą koszty zależą w dużej mierze od intensywności ogrzewania.', link: { label: 'Zobacz taryfy i wskazówki dotyczące zużycia →', href: '/pl/media' } },
        ],
      },
    ],
  };

  return [...categories, ...faq[locale]];
}

// ─── Componente accordion singolo ────────────────────────────────────────────
// ─── FaqItem ──────────────────────────────────────────────────────────────────
function FaqItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const lines = item.a.split('\n');

  return (
    <div style={{
      borderBottom: '1px solid #f0f4f8',
    }}>
      {/* Domanda */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: open ? '#fffbf2' : '#fff',
          border: 'none',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          cursor: 'pointer',
          textAlign: 'left',
          minHeight: 58,
          transition: 'background 180ms',
          borderLeft: open ? '4px solid #FCAF1A' : '4px solid transparent',
        }}
      >
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: open ? '#1E73BE' : '#1a1a2e',
          lineHeight: 1.4,
          flex: 1,
        }}>
          {item.q}
        </span>
        <div style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: open ? '#FCAF1A' : '#f0f4f8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 180ms',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={open ? '#fff' : '#6b7280'} strokeWidth="2.5"
            style={{ transition: 'transform 220ms ease', transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {/* Risposta */}
      {open && (
        <div style={{
          padding: '0 20px 18px 24px',
          fontSize: 14,
          color: '#374151',
          lineHeight: 1.7,
          background: '#fffbf2',
          borderLeft: '4px solid #FCAF1A',
        }}>
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
          {item.link && (
            <a
              href={item.link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                fontSize: 13,
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
                background: '#1E73BE',
                padding: '6px 14px',
                borderRadius: 20,
              }}
            >
              {item.link.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Canali contatto ──────────────────────────────────────────────────────────
function ContactChannels({ locale, t }: {
  locale: Locale;
  t: typeof UI['it'];
}) {
  const WA_NUMBER = '393283131500';
  const PHONE     = 'tel:+390771062003';
  const EMAIL     = 'mailto:contattolivingapple@gmail.com';

  const channels = [
    {
      href: `https://wa.me/${WA_NUMBER}`,
      accent: '#25D366',
      label: t.wa, sub: t.waSub,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      href: PHONE,
      accent: '#1E73BE',
      label: t.tel, sub: t.telSub,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.72A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.91a16 16 0 006.18 6.18l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
      ),
    },
    {
      href: EMAIL,
      accent: '#6b7280',
      label: t.mail, sub: t.mailSub,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      {/* Header sezione */}
      <div style={{
        padding: '14px 20px',
        background: '#1E73BE',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>💬</span>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {t.contactTitle}
          </p>
          <p style={{ margin: '1px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
            {t.contactSubtitle}
          </p>
        </div>
      </div>

      {channels.map((ch, i) => (
        <a
          key={ch.href}
          href={ch.href}
          target={ch.href.startsWith('http') ? '_blank' : undefined}
          rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            borderBottom: i < channels.length - 1 ? '1px solid #f3f4f6' : 'none',
            textDecoration: 'none',
            background: '#fff',
            minHeight: 68,
          }}
        >
          <div style={{
            width: 46, height: 46,
            borderRadius: 13,
            background: ch.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 4px 12px ${ch.accent}40`,
          }}>
            {ch.icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111' }}>{ch.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>{ch.sub}</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </a>
      ))}
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────
interface Props { locale: Locale; bookHref: string; }

export default function ContattiClient({ locale, bookHref }: Props) {
  const t  = UI[locale];
  const faqData = getFaqData(locale);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 40px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Hero con sfondo brand ─────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E73BE 0%, #1557a0 100%)',
        padding: '32px 24px 28px',
        marginBottom: 0,
      }}>
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: '#fff',
          margin: '0 0 8px', lineHeight: 1.15,
        }}>
          {t.pageTitle}
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
          {t.pageSubtitle}
        </p>
      </div>

      {/* ── Contenuto principale ─────────────────────────────────────────── */}
      <div style={{ padding: '16px 12px 0' }}>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {faqData.map((cat, ci) => (
            <div key={ci} style={{
              background: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid #e5e7eb',
            }}>
              {/* Header categoria — blu pieno */}
              <div style={{
                padding: '13px 20px',
                background: '#1E73BE',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{cat.icon}</span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '0.01em',
                }}>
                  {cat.label}
                </span>
              </div>

              {/* Domande */}
              {cat.items.map((item, ii) => (
                <FaqItem key={ii} item={item} />
              ))}
            </div>
          ))}
        </div>

        {/* ── Canali contatto ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 12 }}>
          <ContactChannels locale={locale} t={t} />
        </div>

        {/* ── Banner prenotazione sicura ────────────────────────────────────── */}
        <div style={{ marginBottom: 12 }}>
          <a
            href={`/${locale}/prenotazione-sicura`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 14,
              padding: '16px 20px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: 10,
                background: '#EEF5FC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 20 }}>🔍</span>
              </div>
              <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.4, fontWeight: 500 }}>
                {t.safeBannerText}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E73BE', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {t.safeBannerBtn}
            </span>
          </a>
        </div>

        {/* ── Banner prenota ────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #FCAF1A 0%, #f59e0b 100%)',
          borderRadius: 16,
          padding: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 4px 16px rgba(252,175,26,0.3)',
        }}>
          <p style={{ margin: 0, fontSize: 15, color: '#111', lineHeight: 1.4, fontWeight: 600 }}>
            {t.bookBanner}
          </p>
          <a
            href={bookHref}
            style={{
              background: '#111',
              color: '#FCAF1A',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.bookBtn}
          </a>
        </div>

      </div>
    </div>
  );
}
