'use client';
import { useState } from 'react';

type Locale = 'it' | 'en' | 'de' | 'pl';
type Season = 'winter' | 'summer';

const UI: Record<Locale, {
  pageTitle: string;
  pageSubtitle: string;
  disclaimer: string;
  ratesTitle: string;
  elec: string; elecUnit: string;
  gas: string; gasUnit: string;
  water: string; waterUnit: string;
  meterNote: string;
  seasonLabel: string;
  seasonWinter: string;
  seasonSummer: string;
  ratesNote: string;
  wIntroTitle: string;
  wIntroText: string;
  wCostLabel: string;
  wCostCareful: string; wCostCarefulVal: string;
  wCostIntense: string; wCostIntenseVal: string;
  wAcc1Title: string; wAcc1Text: string;
  wAcc2Title: string; wAcc2Text: string;
  wAcc3Title: string; wAcc3Text: string;
  sIntroTitle: string;
  sIntroText: string;
  sCostLabel: string;
  sCostCareful: string; sCostCarefulVal: string;
  sCostIntense: string; sCostIntenseVal: string;
  sAcc1Title: string; sAcc1Text: string;
  sAcc2Title: string; sAcc2Text: string;
  sAcc3Title: string; sAcc3Text: string;
  honestTitle: string;
  honestText: string;
  honestCaution: string;
}> = {
  it: {
    pageTitle: 'Utenze e consumi',
    pageSubtitle: 'Questa pagina esiste perché vogliamo che la tua vacanza non abbia brutte sorprese.',
    disclaimer: 'Ai sensi delle Direttive UE 2011/83/EU e 2019/2161/EU, comunichiamo che saranno addebitate spese supplementari per i consumi di acqua, energia elettrica e gas, misurati tramite lettura dei contatori al check-in e check-out.',
    ratesTitle: 'Tariffe in vigore',
    elec: 'Energia elettrica', elecUnit: '€ 0,80 / kWh',
    gas: 'Gas GPL', gasUnit: '€ 5,00 / mc',
    water: 'Acqua', waterUnit: '€ 6,00 / mc',
    meterNote: 'I contatori vengono letti all\'arrivo e alla partenza. Paghi solo quello che hai consumato. I prezzi possono subire variazioni e saranno comunicati prima della conferma.',
    seasonLabel: 'Seleziona il periodo del tuo soggiorno',
    seasonWinter: '❄️ Inverno',
    seasonSummer: '☀️ Estate',
    ratesNote: 'I prezzi indicati possono subire variazioni. Eventuali aggiornamenti saranno comunicati prima della conferma della prenotazione.',
    wIntroTitle: 'Cosa aspettarsi in inverno',
    wIntroText: 'Le abitazioni del Sud Italia sono state progettate per resistere al calore estivo, non per trattenere il calore invernale. Muri che respirano, alte soffitte, ventilazione naturale: qualità eccellenti d\'estate, ma che in inverno rendono qualsiasi sistema di riscaldamento molto dispersivo. Il fabbisogno energetico è 2,5 volte superiore rispetto agli edifici moderni.',
    wCostLabel: 'Stima costi giornalieri riscaldamento',
    wCostCareful: 'Uso attento (19–20°C)', wCostCarefulVal: '€ 5–8 / giorno',
    wCostIntense: 'Uso intensivo (23–25°C)', wCostIntenseVal: '€ 13–22 / giorno',
    wAcc1Title: 'GPL vs metano — perché costa di più',
    wAcc1Text: 'Siamo in una zona non coperta dalla rete del metano. Utilizziamo GPL (Gas di Petrolio Liquefatti), trasportato su autocisterna e stoccato in serbatoio. Il GPL costa il 30–50% in più del metano a parità di calore prodotto, a causa dei costi di trasporto e logistica. Non è una nostra scelta: è la realtà del territorio e si applica a tutte le strutture della zona.',
    wAcc2Title: 'Il problema della condensa — leggi con attenzione',
    wAcc2Text: 'Circa il 50% degli ospiti invernali lascia le strutture con problemi di condensa. La causa è invariabilmente la stessa: finestre sempre chiuse, riscaldamento al massimo, zero arieggiamento.\n\nIn Nord Europa la ventilazione è gestita automaticamente da sistemi meccanici. Da noi la ventilazione è naturale: bisogna aprire le finestre.\n\nLa soluzione è semplice: aprire completamente le finestre per 5–10 minuti, 2–3 volte al giorno. Camera da letto la mattina, bagno dopo la doccia, cucina dopo i pasti. Il calore si recupera in pochi minuti. La mancata ventilazione, se causa danni da muffa, può comportare trattenuta del deposito cauzionale.',
    wAcc3Title: 'Consigli pratici per l\'inverno',
    wAcc3Text: '• Imposta il riscaldamento a 19–20°C, non a 23–25°C\n• Spegni quando esci per più di 30 minuti\n• Tieni chiuse le porte delle stanze non utilizzate\n• Evita di stendere panni al chiuso\n• Apri le finestre 5–10 minuti, 2–3 volte al giorno',
    sIntroTitle: 'Cosa aspettarsi in estate',
    sIntroText: 'Il condizionatore è disponibile in tutte le strutture LivingApple. Usarlo bene è una questione di salute prima ancora che di risparmio. L\'OMS raccomanda una differenza massima di 7°C tra temperatura interna ed esterna. Il DPR 74/2013 stabilisce che il condizionatore non deve scendere sotto i 24°C. Ricerca italiana pubblicata su Clinical and Translational Allergy: i danni alle vie aeree compaiono già sotto i 24°C.',
    sCostLabel: 'Stima costi per 14 giorni (aria condizionata)',
    sCostCareful: 'Uso attento (24–26°C, spento quando si esce)', sCostCarefulVal: '€ 35–56',
    sCostIntense: 'Uso intensivo (18–20°C, acceso sempre)', sCostIntenseVal: '€ 112–210',
    sAcc1Title: 'Perché non scendere sotto i 24°C',
    sAcc1Text: 'Passare da 35°C esterni a 18°C interni (differenza 17°C) non è più fresco in modo sicuro — è uno shock termico cronico. I rischi documentati: mal di gola, tosse, bronchiti estive, torcicollo, contratture muscolari, problemi gastrointestinali. Questi sintomi possono rovinare la vacanza.\n\nLa temperatura consigliata in estate: 24–26°C. A 26°C con aria deumidificata ci si sente freschi e confortevoli. Un grado in meno sul termostato equivale a circa il 6–8% di consumo in più.',
    sAcc2Title: 'Finestre aperte con il condizionatore acceso',
    sAcc2Text: 'In Nord Europa si è abituati a tenere le finestre leggermente aperte con il riscaldamento o il raffreddamento acceso. Da noi questo annulla completamente l\'effetto del condizionatore e lo costringe al massimo della potenza in modo continuo.\n\nTenere sempre finestre e porte chiuse quando il condizionatore è acceso.',
    sAcc3Title: 'Consigli pratici per l\'estate',
    sAcc3Text: '• Imposta il condizionatore a 24–26°C — fresco e confortevole\n• Spegnilo quando esci: non c\'è alcun vantaggio nel raffreddare una stanza vuota\n• Usa la modalità deumidificatore (DRY) se disponibile: consuma molto meno\n• Tieni chiusi persiane e scuri durante le ore più calde: meno calore entra, meno il condizionatore lavora\n• Non aprire le finestre mentre il condizionatore è acceso',
    honestTitle: 'Il consiglio onesto',
    honestText: 'Se preferisci non pensare ai consumi durante le vacanze — e lo capiamo perfettamente — ti consigliamo onestamente di cercare strutture con energia inclusa nel prezzo. È una scelta assolutamente valida. Non è una rinuncia: è semplicemente lo strumento giusto per le tue esigenze.',
    honestCaution: 'Attenzione: alcune strutture con "consumi inclusi" a prezzi molto bassi presentano sistemi di riscaldamento e raffreddamento non adeguati agli standard nord-europei, massimali di consumo oltre i quali scatta un supplemento, oppure forniture elettriche insufficienti — contatori che scattano e ti lasciano senza corrente.\n\nPrima di prenotare, chiedi sempre:\n• "La struttura raggiunge 22°C in gennaio?"\n• "C\'è un tetto ai consumi inclusi?"\n• "La potenza del contatore è sufficiente per tutti i condizionatori accesi contemporaneamente, più forno, asciugacapelli, lavatrice, lavastoviglie e microonde?"',
  },
  en: {
    pageTitle: 'Utilities & energy use',
    pageSubtitle: 'This page exists because we want your holiday to have no unpleasant surprises.',
    disclaimer: 'In accordance with EU Directives 2011/83/EU and 2019/2161/EU, we inform you that supplementary charges will apply for water, electricity and gas consumption, measured by meter readings at check-in and check-out.',
    ratesTitle: 'Current rates',
    elec: 'Electricity', elecUnit: '€ 0.80 / kWh',
    gas: 'LPG gas', gasUnit: '€ 5.00 / m³',
    water: 'Water', waterUnit: '€ 6.00 / m³',
    meterNote: 'Meters are read at arrival and departure. You are charged only for what you actually consume. Prices may be updated and any changes will be communicated before booking confirmation.',
    seasonLabel: 'Select your stay period',
    seasonWinter: '❄️ Winter',
    seasonSummer: '☀️ Summer',
    ratesNote: 'Prices shown may be subject to change. Any updates will be communicated before booking confirmation.',
    wIntroTitle: 'What to expect in winter',
    wIntroText: 'Southern Italian buildings were designed to resist summer heat, not to retain winter warmth. Breathable walls, high ceilings, natural ventilation: excellent qualities in summer, but in winter they make any heating system highly inefficient. Energy demand is 2.5 times higher than in modern buildings.',
    wCostLabel: 'Estimated daily heating costs',
    wCostCareful: 'Careful use (19–20°C)', wCostCarefulVal: '€ 5–8 / day',
    wCostIntense: 'Intensive use (23–25°C)', wCostIntenseVal: '€ 13–22 / day',
    wAcc1Title: 'LPG vs city gas — why it costs more',
    wAcc1Text: 'Our area is not connected to the natural gas pipeline network. We use LPG (Liquefied Petroleum Gas), delivered by lorry and stored in an on-site tank. LPG costs 30–50% more than city gas per unit of heat produced, due to transport and logistics costs. This is not our choice — it is the reality of the territory and applies to all properties in the area.',
    wAcc2Title: 'The condensation problem — please read carefully',
    wAcc2Text: 'Approximately 50% of our winter guests leave the property with condensation problems. The cause is almost always the same: windows kept closed at all times, heating on full, no ventilation.\n\nIn Northern Europe, ventilation is handled automatically by mechanical systems. In our property, ventilation is natural: windows must be opened regularly.\n\nThe solution is simple: open windows fully for 5–10 minutes, 2–3 times a day. Bedroom in the morning, bathroom after showering, kitchen after cooking. The heating recovers the temperature within a few minutes. Failure to ventilate, if it causes mould damage, may result in a deduction from the security deposit.',
    wAcc3Title: 'Practical tips for winter',
    wAcc3Text: '• Set heating to 19–20°C, not 23–25°C\n• Switch off when leaving for more than 30 minutes\n• Keep doors to unused rooms closed\n• Avoid drying clothes indoors\n• Open windows for 5–10 minutes, 2–3 times a day',
    sIntroTitle: 'What to expect in summer',
    sIntroText: 'Air conditioning is available in all LivingApple properties. Using it correctly is a matter of health before it is a matter of cost. The WHO recommends a maximum difference of 7°C between indoor and outdoor temperature. Italian public health regulations (DPR 74/2013) state that air conditioning should not be set below 24°C. Italian research published in Clinical and Translational Allergy: respiratory damage begins below 24°C.',
    sCostLabel: 'Estimated cost over 14 days (air conditioning)',
    sCostCareful: 'Careful use (24–26°C, off when out)', sCostCarefulVal: '€ 35–56',
    sCostIntense: 'Intensive use (18–20°C, always on)', sCostIntenseVal: '€ 112–210',
    sAcc1Title: 'Why not to go below 24°C',
    sAcc1Text: 'Going from 35°C outside to 18°C inside (a 17°C gap) is not cooler in a safe way — it is a chronic thermal shock. Documented risks: sore throat, cough, summer bronchitis, neck pain, muscle cramps, gastrointestinal problems. These symptoms can ruin a holiday.\n\nRecommended indoor temperature in summer: 24–26°C. At 26°C with dehumidified air you feel cool and comfortable. Each degree lower on the thermostat increases energy consumption by approximately 6–8%.',
    sAcc2Title: 'Windows open with the AC on',
    sAcc2Text: 'In Northern Europe, you may be used to keeping windows slightly open while heating or cooling runs. In our property, this immediately cancels out all the cooling effect and forces the unit to run at maximum capacity continuously.\n\nAlways keep windows and doors closed whenever the air conditioning is on.',
    sAcc3Title: 'Practical tips for summer',
    sAcc3Text: '• Set AC to 24–26°C — cool and comfortable\n• Switch it off when you leave: there is no benefit to cooling an empty room\n• Use the dehumidifier mode (DRY) if available: much lower energy consumption\n• Keep shutters and blinds closed during the hottest part of the day\n• Never open windows while the AC is running',
    honestTitle: 'Our honest recommendation',
    honestText: 'If you prefer not to think about energy use during your holiday — and we completely understand — we honestly suggest looking for a property with all-inclusive pricing. It is a perfectly valid choice. Not a compromise: simply the right tool for your needs.',
    honestCaution: 'Warning: some all-inclusive properties at very low prices have heating and cooling systems inadequate for Northern European standards, consumption caps above which a surcharge applies, or insufficient electrical supply — circuit breakers that trip and leave you without power.\n\nBefore booking, always ask:\n• "Does the property reach 22°C indoors in January?"\n• "Is there a consumption cap on the included utilities?"\n• "Is the electrical supply sufficient for all air conditioners running simultaneously, plus oven, hairdryer, washing machine, dishwasher and microwave?"',
  },
  de: {
    pageTitle: 'Nebenkosten & Energieverbrauch',
    pageSubtitle: 'Diese Seite gibt es, weil wir möchten, dass Ihr Urlaub keine unangenehmen Überraschungen bereithält.',
    disclaimer: 'Gemäß den EU-Richtlinien 2011/83/EU und 2019/2161/EU teilen wir mit, dass zusätzliche Gebühren für Wasser-, Strom- und Gasverbrauch anfallen, gemessen durch Zählerablesung bei Check-in und Check-out.',
    ratesTitle: 'Aktuelle Tarife',
    elec: 'Strom', elecUnit: '€ 0,80 / kWh',
    gas: 'Flüssiggas (LPG)', gasUnit: '€ 5,00 / m³',
    water: 'Wasser', waterUnit: '€ 6,00 / m³',
    meterNote: 'Die Zähler werden bei An- und Abreise abgelesen. Sie zahlen nur das, was Sie tatsächlich verbraucht haben. Preise können sich ändern und werden vor der Buchungsbestätigung mitgeteilt.',
    seasonLabel: 'Wählen Sie Ihren Aufenthaltszeitraum',
    seasonWinter: '❄️ Winter',
    seasonSummer: '☀️ Sommer',
    ratesNote: 'Die angegebenen Preise können sich ändern. Alle Aktualisierungen werden vor der Buchungsbestätigung mitgeteilt.',
    wIntroTitle: 'Was im Winter zu erwarten ist',
    wIntroText: 'Süditalienische Gebäude wurden für sommerliche Hitze konzipiert, nicht zum Halten von Winterwärme. Atmungsaktive Wände, hohe Decken, natürliche Belüftung: im Sommer ausgezeichnete Eigenschaften, die aber im Winter jedes Heizsystem sehr ineffizient machen. Der Energiebedarf ist 2,5-mal höher als bei modernen Gebäuden.',
    wCostLabel: 'Geschätzte tägliche Heizkosten',
    wCostCareful: 'Sparsamer Einsatz (19–20°C)', wCostCarefulVal: '€ 5–8 / Tag',
    wCostIntense: 'Intensiver Einsatz (23–25°C)', wCostIntenseVal: '€ 13–22 / Tag',
    wAcc1Title: 'LPG vs. Erdgas — warum es mehr kostet',
    wAcc1Text: 'Unser Gebiet ist nicht an das Erdgasnetz angeschlossen. Wir verwenden LPG (Flüssiggas), das per Lastwagen geliefert und in einem Tank vor Ort gelagert wird. LPG kostet 30–50% mehr als Erdgas bei gleicher Wärmeleistung, aufgrund der Transport- und Logistikkosten. Das ist keine Entscheidung unsererseits — es ist die Realität des Gebiets und gilt für alle Unterkünfte in der Region.',
    wAcc2Title: 'Das Kondensationsproblem — bitte sorgfältig lesen',
    wAcc2Text: 'Etwa 50% unserer Wintergäste hinterlassen die Unterkunft mit Kondensationsproblemen. Die Ursache ist fast immer dieselbe: Fenster immer geschlossen, Heizung auf Maximum, keine Lüftung.\n\nIn Nordeuropa wird die Belüftung automatisch durch mechanische Systeme geregelt. Bei uns ist die Lüftung natürlich: Fenster müssen regelmäßig geöffnet werden.\n\nDie Lösung ist einfach: Fenster 5–10 Minuten, 2–3 Mal täglich vollständig öffnen. Schlafzimmer morgens, Bad nach dem Duschen, Küche nach dem Kochen. Die Heizung erholt die Temperatur in wenigen Minuten. Unterlassene Lüftung kann bei Schimmelschäden zum Einbehalt der Kaution führen.',
    wAcc3Title: 'Praktische Tipps für den Winter',
    wAcc3Text: '• Heizung auf 19–20°C einstellen, nicht auf 23–25°C\n• Beim Verlassen für mehr als 30 Minuten ausschalten\n• Türen zu ungenutzten Zimmern geschlossen halten\n• Wäsche nicht im Innenbereich trocknen\n• Fenster 5–10 Minuten, 2–3 Mal täglich öffnen',
    sIntroTitle: 'Was im Sommer zu erwarten ist',
    sIntroText: 'Klimaanlagen sind in allen LivingApple-Unterkünften verfügbar. Sie richtig zu nutzen ist eine Gesundheitsfrage vor allem anderen. Die WHO empfiehlt eine maximale Differenz von 7°C zwischen Innen- und Außentemperatur. Die italienische Verordnung DPR 74/2013 legt fest, dass Klimaanlagen nicht unter 24°C eingestellt werden sollen. Italienische Forschung in Clinical and Translational Allergy: Atemwegsschäden beginnen bereits unter 24°C.',
    sCostLabel: 'Geschätzte Kosten über 14 Tage (Klimaanlage)',
    sCostCareful: 'Sparsamer Einsatz (24–26°C, aus wenn man weg ist)', sCostCarefulVal: '€ 35–56',
    sCostIntense: 'Intensiver Einsatz (18–20°C, immer an)', sCostIntenseVal: '€ 112–210',
    sAcc1Title: 'Warum nicht unter 24°C gehen',
    sAcc1Text: 'Von 35°C draußen auf 18°C innen zu gehen (17°C Unterschied) ist kein sicheres Kühlen — es ist ein chronischer Temperaturschock. Dokumentierte Risiken: Halsschmerzen, Husten, Sommerbronchitis, Nackenschmerzen, Muskelkrämpfe, Magenprobleme. Diese Symptome können den Urlaub ruinieren.\n\nEmpfohlene Innentemperatur im Sommer: 24–26°C. Bei 26°C mit entfeuchteter Luft fühlt man sich kühl und wohl. Jeder Grad weniger am Thermostat erhöht den Energieverbrauch um etwa 6–8%.',
    sAcc2Title: 'Fenster offen mit laufender Klimaanlage',
    sAcc2Text: 'In Nordeuropa ist man es gewöhnt, Fenster leicht geöffnet zu lassen, während Heizung oder Kühlung läuft. Bei uns hebt dies sofort den gesamten Kühleffekt auf und zwingt das Gerät, dauerhaft auf maximaler Leistung zu laufen.\n\nFenster und Türen immer geschlossen halten, wenn die Klimaanlage läuft.',
    sAcc3Title: 'Praktische Tipps für den Sommer',
    sAcc3Text: '• Klimaanlage auf 24–26°C einstellen — kühl und angenehm\n• Beim Verlassen ausschalten: Es bringt nichts, einen leeren Raum zu kühlen\n• Entfeuchtungsmodus (DRY) verwenden, wenn verfügbar: viel geringerer Energieverbrauch\n• Fensterläden und Jalousien während der heißesten Tageszeit geschlossen halten\n• Niemals Fenster öffnen, während die Klimaanlage läuft',
    honestTitle: 'Unsere ehrliche Empfehlung',
    honestText: 'Wenn Sie es vorziehen, sich während Ihres Urlaubs keine Gedanken über den Energieverbrauch zu machen — wir verstehen das vollkommen —, empfehlen wir Ihnen ehrlich, eine Unterkunft mit Inklusivpreis zu suchen. Das ist eine absolut gültige Wahl. Kein Kompromiss: einfach das richtige Werkzeug für Ihre Bedürfnisse.',
    honestCaution: 'Achtung: Einige Inklusiv-Unterkünfte zu sehr niedrigen Preisen haben Heizungs- und Kühlsysteme, die nicht den nordeuropäischen Standards entsprechen, Verbrauchsobergrenzen über die ein Aufpreis anfällt, oder eine unzureichende Stromversorgung — Sicherungen, die auslösen und Sie ohne Strom lassen.\n\nFragen Sie vor der Buchung immer:\n• „Erreicht die Unterkunft im Januar 22°C innen?"\n• „Gibt es eine Verbrauchsobergrenze für die inbegriffenen Nebenkosten?"\n• „Ist die Stromversorgung ausreichend für alle gleichzeitig laufenden Klimaanlagen plus Backofen, Haartrockner, Waschmaschine, Geschirrspüler und Mikrowelle?"',
  },
  pl: {
    pageTitle: 'Media i zużycie energii',
    pageSubtitle: 'Ta strona istnieje, ponieważ chcemy, aby Twoje wakacje były wolne od nieprzyjemnych niespodzianek.',
    disclaimer: 'Zgodnie z Dyrektywami UE 2011/83/EU i 2019/2161/EU informujemy, że naliczane będą dodatkowe opłaty za zużycie wody, energii elektrycznej i gazu, mierzone odczytami liczników przy zameldowaniu i wymeldowaniu.',
    ratesTitle: 'Aktualne stawki',
    elec: 'Energia elektryczna', elecUnit: '€ 0,80 / kWh',
    gas: 'Gaz LPG', gasUnit: '€ 5,00 / m³',
    water: 'Woda', waterUnit: '€ 6,00 / m³',
    meterNote: 'Liczniki są odczytywane przy przyjeździe i wyjeździe. Płacisz tylko za to, co rzeczywiście zużyłeś. Ceny mogą ulec zmianie i wszelkie aktualizacje zostaną przekazane przed potwierdzeniem rezerwacji.',
    seasonLabel: 'Wybierz okres swojego pobytu',
    seasonWinter: '❄️ Zima',
    seasonSummer: '☀️ Lato',
    ratesNote: 'Podane ceny mogą ulec zmianie. Wszelkie aktualizacje zostaną przekazane przed potwierdzeniem rezerwacji.',
    wIntroTitle: 'Czego spodziewać się zimą',
    wIntroText: 'Budynki w południowych Włoszech zostały zaprojektowane do odpierania letniego upału, a nie do zatrzymywania zimowego ciepła. Oddychające ściany, wysokie sufity, naturalna wentylacja: doskonałe cechy latem, ale zimą sprawiają, że każdy system grzewczy jest bardzo nieefektywny. Zapotrzebowanie na energię jest 2,5 razy wyższe niż w nowoczesnych budynkach.',
    wCostLabel: 'Szacunkowe dzienne koszty ogrzewania',
    wCostCareful: 'Oszczędne użytkowanie (19–20°C)', wCostCarefulVal: '€ 5–8 / dzień',
    wCostIntense: 'Intensywne użytkowanie (23–25°C)', wCostIntenseVal: '€ 13–22 / dzień',
    wAcc1Title: 'LPG vs gaz ziemny — dlaczego jest droższy',
    wAcc1Text: 'Nasz obszar nie jest podłączony do sieci gazu ziemnego. Używamy LPG (gazu płynnego), dostarczanego ciężarówką i przechowywanego w zbiorniku na miejscu. LPG kosztuje 30–50% więcej niż gaz ziemny przy tej samej ilości wytwarzanego ciepła, ze względu na koszty transportu i logistyki. To nie jest nasz wybór — to rzeczywistość terenu, która dotyczy wszystkich obiektów w okolicy.',
    wAcc2Title: 'Problem z kondensacją — przeczytaj uważnie',
    wAcc2Text: 'Około 50% naszych zimowych gości pozostawia obiekt z problemami z kondensacją. Przyczyna jest prawie zawsze taka sama: okna zawsze zamknięte, ogrzewanie na maksimum, brak wentylacji.\n\nW Europie Północnej wentylacja jest obsługiwana automatycznie przez systemy mechaniczne. U nas wentylacja jest naturalna: okna muszą być regularnie otwierane.\n\nRozwiązanie jest proste: otwierać okna na 5–10 minut, 2–3 razy dziennie. Sypialnia rano, łazienka po prysznicu, kuchnia po gotowaniu. Ogrzewanie przywraca temperaturę w ciągu kilku minut. Brak wentylacji, jeśli spowoduje uszkodzenia z pleśni, może skutkować potrąceniem z kaucji.',
    wAcc3Title: 'Praktyczne wskazówki na zimę',
    wAcc3Text: '• Ustaw ogrzewanie na 19–20°C, nie na 23–25°C\n• Wyłączaj przy wyjściu na ponad 30 minut\n• Trzymaj zamknięte drzwi do nieużywanych pokoi\n• Unikaj suszenia ubrań w pomieszczeniach\n• Otwieraj okna na 5–10 minut, 2–3 razy dziennie',
    sIntroTitle: 'Czego spodziewać się latem',
    sIntroText: 'Klimatyzacja jest dostępna we wszystkich obiektach LivingApple. Prawidłowe używanie jej jest przede wszystkim kwestią zdrowia. WHO zaleca maksymalną różnicę 7°C między temperaturą wewnętrzną a zewnętrzną. Włoskie przepisy zdrowia publicznego (DPR 74/2013): klimatyzacja nie powinna być ustawiana poniżej 24°C. Włoskie badania opublikowane w Clinical and Translational Allergy: uszkodzenia dróg oddechowych zaczynają się poniżej 24°C.',
    sCostLabel: 'Szacunkowy koszt przez 14 dni (klimatyzacja)',
    sCostCareful: 'Oszczędne użytkowanie (24–26°C, wyłączona przy wyjściu)', sCostCarefulVal: '€ 35–56',
    sCostIntense: 'Intensywne użytkowanie (18–20°C, zawsze włączona)', sCostIntenseVal: '€ 112–210',
    sAcc1Title: 'Dlaczego nie schodzić poniżej 24°C',
    sAcc1Text: 'Przejście z 35°C na zewnątrz do 18°C wewnątrz (różnica 17°C) nie jest bezpiecznym chłodzeniem — to chroniczny szok termiczny. Udokumentowane ryzyka: ból gardła, kaszel, letnie zapalenie oskrzeli, ból szyi, skurcze mięśni, problemy żołądkowe. Te objawy mogą zrujnować wakacje.\n\nZalecana temperatura wewnętrzna latem: 24–26°C. Przy 26°C z osusszonym powietrzem czuje się chłód i komfort. Każdy stopień niżej na termostacie zwiększa zużycie energii o około 6–8%.',
    sAcc2Title: 'Otwarte okna przy włączonej klimatyzacji',
    sAcc2Text: 'W Europie Północnej można być przyzwyczajonym do trzymania okien lekko uchylonych przy działającym ogrzewaniu lub chłodzeniu. U nas natychmiast anuluje to cały efekt chłodzenia i zmusza urządzenie do ciągłej pracy z maksymalną mocą.\n\nZawsze trzymaj okna i drzwi zamknięte, gdy klimatyzacja jest włączona.',
    sAcc3Title: 'Praktyczne wskazówki na lato',
    sAcc3Text: '• Ustaw klimatyzację na 24–26°C — chłodno i komfortowo\n• Wyłączaj przy wyjściu: nie ma sensu chłodzić pustego pomieszczenia\n• Używaj trybu osuszacza (DRY), jeśli dostępny: znacznie mniejsze zużycie energii\n• Trzymaj żaluzje i okiennice zamknięte w najgorętszej porze dnia\n• Nigdy nie otwieraj okien, gdy klimatyzacja jest włączona',
    honestTitle: 'Nasza szczera rekomendacja',
    honestText: 'Jeśli wolisz nie myśleć o zużyciu energii podczas wakacji — i w pełni to rozumiemy — szczerze sugerujemy szukanie obiektów z ceną all-inclusive. To absolutnie słuszny wybór. Nie kompromis: po prostu właściwe narzędzie dla Twoich potrzeb.',
    honestCaution: 'Uwaga: niektóre obiekty all-inclusive w bardzo niskich cenach mają systemy grzewcze i chłodzące nieodpowiednie dla standardów Europy Północnej, limity zużycia po przekroczeniu których naliczana jest dopłata lub niewystarczające zasilanie elektryczne — bezpieczniki, które się wyłączają i pozostawiają Cię bez prądu.\n\nPrzed rezerwacją zawsze pytaj:\n• „Czy obiekt osiąga 22°C wewnątrz w styczniu?"\n• „Czy istnieje limit wliczonego zużycia?"\n• „Czy zasilanie elektryczne jest wystarczające dla wszystkich klimatyzatorów pracujących jednocześnie plus piekarnik, suszarka do włosów, pralka, zmywarka i kuchenka mikrofalowa?"',
  },
};

function AccItem({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  const lines = text.split('\n');
  return (
    <div className="border-top">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="btn w-100 d-flex align-items-center justify-content-between gap-3 text-start px-3 py-3"
        style={{ minHeight: 56 }}
      >
        <span className="flex-fill fw-medium lh-base">{title}</span>
        <svg
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="#9ca3af" strokeWidth="2.5"
          style={{ flexShrink: 0, transition: 'transform 260ms ease', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className="px-3 small text-secondary"
        style={{
          overflow: 'hidden',
          maxHeight: open ? 800 : 0,
          transition: 'max-height 280ms ease',
          lineHeight: 1.7,
          paddingBottom: open ? 18 : 0,
          paddingTop: open ? 4 : 0,
        }}
      >
        {lines.map((line, i) => (
          <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-light border rounded-3 p-2">
      <p className="small text-muted mb-1">{label}</p>
      <p className="fs-5 fw-bold mb-0">{value}</p>
    </div>
  );
}

interface Props { locale: Locale; }

export default function UtenzeClient({ locale }: Props) {
  const t = UI[locale];
  const [season, setSeason] = useState<Season>('winter');

  const isWinter = season === 'winter';

  return (
    <div className="container pb-5" style={{ maxWidth: 720 }}>

      {/* Hero */}
      <div className="bg-white border-bottom p-3 mb-2">
        <h1 className="fs-2 fw-bold mb-2">{t.pageTitle}</h1>
        <p className="text-secondary mb-0">{t.pageSubtitle}</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-white border-bottom p-3 mb-2">
        <p className="small text-secondary mb-0">{t.disclaimer}</p>
      </div>

      {/* Tariffe */}
      <div className="bg-white p-3 mb-2">
        <p className="small fw-semibold text-secondary mb-2">{t.ratesTitle}</p>
        <div className="d-grid gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <RateCard label={t.elec} value={t.elecUnit} />
          <RateCard label={t.gas} value={t.gasUnit} />
          <RateCard label={t.water} value={t.waterUnit} />
        </div>
        <p className="small text-muted mb-0">{t.meterNote}</p>
      </div>

      {/* Toggle stagione */}
      <div className="bg-white p-3 mb-2">
        <p className="small fw-semibold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>
          {t.seasonLabel}
        </p>
        <div className="d-flex gap-2">
          <button
            onClick={() => setSeason('winter')}
            className={`btn flex-fill ${isWinter ? 'fw-semibold' : 'border'}`}
            style={{
              background: isWinter ? '#E6F1FB' : '#fff',
              color: isWinter ? '#0C447C' : '#6b7280',
            }}
          >
            {t.seasonWinter}
          </button>
          <button
            onClick={() => setSeason('summer')}
            className={`btn flex-fill ${!isWinter ? 'fw-semibold' : 'border'}`}
            style={{
              background: !isWinter ? '#FAEEDA' : '#fff',
              color: !isWinter ? '#633806' : '#6b7280',
            }}
          >
            {t.seasonSummer}
          </button>
        </div>
      </div>

      {/* Contenuto stagionale */}
      <div className="bg-white mb-2">
        <div className="p-3">
          <h2 className="fs-5 fw-bold mb-2">
            {isWinter ? t.wIntroTitle : t.sIntroTitle}
          </h2>
          <p className="text-secondary mb-3" style={{ lineHeight: 1.7 }}>
            {isWinter ? t.wIntroText : t.sIntroText}
          </p>

          {/* Box costi stimati */}
          <div
            className="rounded-3 p-3 mb-3 border"
            style={{
              background: isWinter ? '#FAEEDA' : '#FEF9C3',
              borderColor: isWinter ? '#FDE68A' : '#FDE047',
            }}
          >
            <p className="small fw-semibold mb-2" style={{ color: isWinter ? '#633806' : '#713f12' }}>
              {isWinter ? t.wCostLabel : t.sCostLabel}
            </p>
            <div className="d-flex flex-column gap-1">
              <div className="d-flex justify-content-between align-items-center gap-2">
                <span className="small" style={{ color: isWinter ? '#854F0B' : '#713f12' }}>
                  {isWinter ? t.wCostCareful : t.sCostCareful}
                </span>
                <span className="fw-bold text-nowrap" style={{ color: isWinter ? '#633806' : '#713f12' }}>
                  {isWinter ? t.wCostCarefulVal : t.sCostCarefulVal}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center gap-2">
                <span className="small" style={{ color: isWinter ? '#854F0B' : '#713f12' }}>
                  {isWinter ? t.wCostIntense : t.sCostIntense}
                </span>
                <span className="fw-bold text-nowrap text-danger">
                  {isWinter ? t.wCostIntenseVal : t.sCostIntenseVal}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Accordion dettagli */}
        {isWinter ? (
          <>
            <AccItem title={t.wAcc1Title} text={t.wAcc1Text} />
            <AccItem title={t.wAcc2Title} text={t.wAcc2Text} />
            <AccItem title={t.wAcc3Title} text={t.wAcc3Text} />
          </>
        ) : (
          <>
            <AccItem title={t.sAcc1Title} text={t.sAcc1Text} />
            <AccItem title={t.sAcc2Title} text={t.sAcc2Text} />
            <AccItem title={t.sAcc3Title} text={t.sAcc3Text} />
          </>
        )}
      </div>

      {/* Consiglio onesto */}
      <div className="bg-white mb-2 p-3 border-start border-4 border-primary">
        <p className="fs-6 fw-bold text-primary mb-2">{t.honestTitle}</p>
        <p className="text-secondary mb-3" style={{ lineHeight: 1.7 }}>
          {t.honestText}
        </p>
        <div className="bg-light border rounded p-3">
          <p className="small text-secondary mb-0" style={{ lineHeight: 1.7 }}>
            ⚠️{' '}
            {t.honestCaution.split('\n').map((line, i) => (
              <span key={i}>{line}{i < t.honestCaution.split('\n').length - 1 && <br />}</span>
            ))}
          </p>
        </div>
      </div>

    </div>
  );
}
