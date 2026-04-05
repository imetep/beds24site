'use client';
import { useState, useEffect, useRef } from 'react';

type Locale = 'it' | 'en' | 'de' | 'pl';
type Tab = 'plane' | 'train' | 'car';

// ─── Traduzioni ────────────────────────────────────────────────────────────────
const T: Record<Locale, {
  hero_title: string;
  hero_sub: string;
  why_title: string;
  pills: { icon: string; title: string; text: string }[];
  map_title: string;
  map_sub: string;
  how_title: string;
  tab_plane: string;
  tab_train: string;
  tab_car: string;
  plane_intro: string;
  plane_airports: { code: string; name: string; km: string; time: string }[];
  train_intro: string;
  train_routes: { label: string; time: string }[];
  train_note: string;
  car_intro: string;
  car_from: { city: string; time: string; detail: string }[];
  car_note_title: string;
  car_note: string;
  cta: string;
  // labels mappa
  by_car: string;
  by_plane: string;
}> = {

  // ── ITALIANO ──────────────────────────────────────────────────────────────────
  it: {
    hero_title: 'Scauri, a metà strada tra Roma e Napoli',
    hero_sub: 'Dove il Lazio incontra il mare, tra natura, storia e sapori autentici del Sud.',
    why_title: 'Perché Scauri',
    pills: [
      { icon: '🌊', title: 'Mare a pochi passi', text: 'LivingApple campagna è a 1,5 km dalla spiaggia. LivingApple beach è a soli 250 m.' },
      { icon: '📍', title: 'Posizione strategica', text: 'A 2h da Roma e 1h15 da Napoli in auto, raggiungibile anche in treno.' },
      { icon: '☀️', title: 'Clima mediterraneo', text: 'Estate lunga e soleggiata da maggio a ottobre, con temperature miti e poca pioggia.' },
      { icon: '🌿', title: 'Silenzio e natura', text: 'Nessuna folla, nessun caos. Solo mare, campagna e autentica ospitalità laziale.' },
    ],
    map_title: 'Quanto siamo lontani?',
    map_sub: 'Scauri è raggiungibile in giornata da tutte le grandi città italiane.',
    how_title: 'Come raggiungerci',
    tab_plane: 'Aereo',
    tab_train: 'Treno',
    tab_car: 'Auto',
    plane_intro: "L'aeroporto più comodo è Napoli Capodichino, a soli 80 km. Roma Fiumicino offre più voli internazionali. Roma Ciampino è ideale per compagnie low cost.",
    plane_airports: [
      { code: 'NAP', name: 'Napoli Capodichino', km: '~80 km', time: '~1h in auto' },
      { code: 'FCO', name: 'Roma Fiumicino', km: '~165 km', time: '~2h in auto' },
      { code: 'CIA', name: 'Roma Ciampino', km: '~145 km', time: '~1h30 in auto' },
    ],
    train_intro: 'La stazione di Minturno-Scauri è servita da treni Intercity e Regionali. Collegamento diretto da Roma Termini e da Napoli Centrale.',
    train_routes: [
      { label: 'Da Roma Termini', time: '~1h45' },
      { label: 'Da Napoli Centrale', time: '~1h' },
    ],
    train_note: 'Dalla stazione alla struttura: ~10 min in taxi o auto a noleggio (non ci sono autobus).',
    car_intro: "In auto è il modo migliore per vivere Scauri in piena libertà. Percorri l'A1 (Autostrada del Sole) e prendi il casello di Cassino.",
    car_from: [
      { city: 'Roma', time: '~2h', detail: '155 km · A1' },
      { city: 'Napoli', time: '~1h 15min', detail: '80 km · A1 o SS7' },
      { city: 'Firenze', time: '~4h', detail: '413 km · A1' },
      { city: 'Milano', time: '~6h 30min', detail: '730 km · A1' },
    ],
    car_note_title: "L'auto è indispensabile",
    car_note: "Una volta arrivati, l'auto non è un optional — è necessaria. Supermercati, spiagge e ristoranti non sono raggiungibili a piedi dalla struttura: le strade rurali non hanno marciapiedi ed è pericoloso camminare. L'auto ti darà libertà totale per esplorare la costa, l'entroterra e i borghi dei Monti Aurunci.",
    cta: 'Prenota ora',
    by_car: 'in auto',
    by_plane: 'in aereo',
  },

  // ── ENGLISH ───────────────────────────────────────────────────────────────────
  en: {
    hero_title: 'Scauri, halfway between Rome and Naples',
    hero_sub: 'Where Lazio meets the sea — nature, history and authentic southern Italian flavours.',
    why_title: 'Why Scauri',
    pills: [
      { icon: '🌊', title: 'Sea a short walk away', text: 'LivingApple countryside is 1.5 km from the beach. LivingApple beach is just 250 m away.' },
      { icon: '📍', title: 'Strategic location', text: '2h from Rome and 1h15 from Naples by car, also reachable by train.' },
      { icon: '☀️', title: 'Mediterranean climate', text: 'Long sunny summers from May to October, with mild temperatures and little rain.' },
      { icon: '🌿', title: 'Peace and nature', text: 'No crowds, no chaos. Just sea, countryside and genuine hospitality.' },
    ],
    map_title: 'How far are we?',
    map_sub: 'Scauri is reachable in a day from all major Italian cities.',
    how_title: 'How to reach us',
    tab_plane: 'By plane',
    tab_train: 'By train',
    tab_car: 'By car',
    plane_intro: 'The most convenient airport is Naples Capodichino, just 80 km away. Rome Fiumicino offers more international flights. Rome Ciampino is ideal for low-cost airlines.',
    plane_airports: [
      { code: 'NAP', name: 'Naples Capodichino', km: '~80 km', time: '~1h by car' },
      { code: 'FCO', name: 'Rome Fiumicino', km: '~165 km', time: '~2h by car' },
      { code: 'CIA', name: 'Rome Ciampino', km: '~145 km', time: '~1h30 by car' },
    ],
    train_intro: 'Minturno-Scauri station is served by Intercity and Regional trains, with direct connections from Roma Termini and Napoli Centrale.',
    train_routes: [
      { label: 'From Roma Termini', time: '~1h45' },
      { label: 'From Napoli Centrale', time: '~1h' },
    ],
    train_note: 'From the station to the property: ~10 min by taxi or rental car (no bus service).',
    car_intro: 'Driving is the best way to enjoy full freedom in Scauri. Take the A1 motorway (Autostrada del Sole) and exit at Cassino.',
    car_from: [
      { city: 'Rome', time: '~2h', detail: '155 km · A1' },
      { city: 'Naples', time: '~1h 15min', detail: '80 km · A1 or SS7' },
      { city: 'Florence', time: '~4h', detail: '413 km · A1' },
      { city: 'Milan', time: '~6h 30min', detail: '730 km · A1' },
    ],
    car_note_title: 'A car is essential',
    car_note: 'Once you arrive, a car is not optional — it is necessary. Supermarkets, beaches and restaurants are not walkable from the property: the rural roads have no pavements and it is not safe to walk. A car will give you total freedom to explore the coastline, countryside and the villages of the Aurunci Mountains.',
    cta: 'Book now',
    by_car: 'by car',
    by_plane: 'by plane',
  },

  // ── DEUTSCH ───────────────────────────────────────────────────────────────────
  de: {
    hero_title: 'Scauri, auf halbem Weg zwischen Rom und Neapel',
    hero_sub: 'Wo Latium das Meer trifft — Natur, Geschichte und authentische süditalienische Küche.',
    why_title: 'Warum Scauri',
    pills: [
      { icon: '🌊', title: 'Meer in der Nähe', text: 'LivingApple Landhaus ist 1,5 km vom Strand entfernt. LivingApple Meer nur 250 m.' },
      { icon: '📍', title: 'Strategische Lage', text: '2h von Rom und 1h15 von Neapel mit dem Auto, auch mit dem Zug erreichbar.' },
      { icon: '☀️', title: 'Mediterranes Klima', text: 'Langer sonniger Sommer von Mai bis Oktober mit milden Temperaturen und wenig Regen.' },
      { icon: '🌿', title: 'Ruhe und Natur', text: 'Keine Massen, kein Trubel. Nur Meer, Landschaft und echte Gastfreundschaft.' },
    ],
    map_title: 'Wie weit sind wir entfernt?',
    map_sub: 'Scauri ist von allen großen italienischen Städten an einem Tag erreichbar.',
    how_title: 'So erreichen Sie uns',
    tab_plane: 'Flugzeug',
    tab_train: 'Zug',
    tab_car: 'Auto',
    plane_intro: 'Der nächstgelegene Flughafen ist Neapel Capodichino, nur 80 km entfernt. Rom Fiumicino bietet mehr internationale Flüge. Rom Ciampino ist ideal für Billigfluggesellschaften.',
    plane_airports: [
      { code: 'NAP', name: 'Neapel Capodichino', km: '~80 km', time: '~1h mit dem Auto' },
      { code: 'FCO', name: 'Rom Fiumicino', km: '~165 km', time: '~2h mit dem Auto' },
      { code: 'CIA', name: 'Rom Ciampino', km: '~145 km', time: '~1h30 mit dem Auto' },
    ],
    train_intro: 'Der Bahnhof Minturno-Scauri wird von Intercity- und Regionalzügen bedient, mit Direktverbindungen von Roma Termini und Napoli Centrale.',
    train_routes: [
      { label: 'Ab Roma Termini', time: '~1h45' },
      { label: 'Ab Napoli Centrale', time: '~1h' },
    ],
    train_note: 'Vom Bahnhof zur Unterkunft: ~10 Min. mit dem Taxi oder Mietwagen (kein Busservice).',
    car_intro: 'Mit dem Auto können Sie Scauri in voller Freiheit erkunden. Nehmen Sie die A1 (Autostrada del Sole) und verlassen Sie die Autobahn bei Cassino.',
    car_from: [
      { city: 'Rom', time: '~2h', detail: '155 km · A1' },
      { city: 'Neapel', time: '~1h 15min', detail: '80 km · A1 oder SS7' },
      { city: 'Florenz', time: '~4h', detail: '413 km · A1' },
      { city: 'Mailand', time: '~6h 30min', detail: '730 km · A1' },
    ],
    car_note_title: 'Ein Auto ist unverzichtbar',
    car_note: 'Vor Ort ist ein Auto kein Luxus — es ist notwendig. Supermärkte, Strände und Restaurants sind von der Unterkunft aus nicht zu Fuß erreichbar: Die ländlichen Straßen haben keine Bürgersteige und das Gehen ist gefährlich. Ein Auto gibt Ihnen völlige Freiheit, die Küste, das Hinterland und die Dörfer der Aurunci-Berge zu erkunden.',
    cta: 'Jetzt buchen',
    by_car: 'mit dem Auto',
    by_plane: 'per Flugzeug',
  },

  // ── POLSKI ────────────────────────────────────────────────────────────────────
  pl: {
    hero_title: 'Scauri, w połowie drogi między Rzymem a Neapolem',
    hero_sub: 'Tam, gdzie Lacjum spotyka morze — natura, historia i autentyczne smaki południa Włoch.',
    why_title: 'Dlaczego Scauri',
    pills: [
      { icon: '🌊', title: 'Morze w pobliżu', text: 'LivingApple campagna jest 1,5 km od plaży. LivingApple beach zaledwie 250 m.' },
      { icon: '📍', title: 'Strategiczna lokalizacja', text: '2h od Rzymu i 1h15 od Neapolu samochodem, dostępne też pociągiem.' },
      { icon: '☀️', title: 'Klimat śródziemnomorski', text: 'Długie słoneczne lato od maja do października, łagodne temperatury i mało deszczu.' },
      { icon: '🌿', title: 'Cisza i natura', text: 'Bez tłumów, bez chaosu. Tylko morze, wieś i autentyczna gościnność.' },
    ],
    map_title: 'Jak daleko jesteśmy?',
    map_sub: 'Do Scauri można dotrzeć w ciągu jednego dnia z każdego większego włoskiego miasta.',
    how_title: 'Jak do nas dotrzeć',
    tab_plane: 'Samolotem',
    tab_train: 'Pociągiem',
    tab_car: 'Samochodem',
    plane_intro: 'Najbliższe lotnisko to Neapol Capodichino, zaledwie 80 km. Rzym Fiumicino oferuje więcej połączeń międzynarodowych. Rzym Ciampino jest idealny dla tanich linii lotniczych.',
    plane_airports: [
      { code: 'NAP', name: 'Neapol Capodichino', km: '~80 km', time: '~1h samochodem' },
      { code: 'FCO', name: 'Rzym Fiumicino', km: '~165 km', time: '~2h samochodem' },
      { code: 'CIA', name: 'Rzym Ciampino', km: '~145 km', time: '~1h30 samochodem' },
    ],
    train_intro: 'Stacja Minturno-Scauri obsługiwana jest przez pociągi Intercity i regionalne, z bezpośrednimi połączeniami z Roma Termini i Napoli Centrale.',
    train_routes: [
      { label: 'Z Roma Termini', time: '~1h45' },
      { label: 'Z Napoli Centrale', time: '~1h' },
    ],
    train_note: 'Ze stacji do obiektu: ~10 min taksówką lub wynajętym samochodem (brak autobusów).',
    car_intro: 'Samochodem możesz cieszyć się pełną swobodą w Scauri. Jedź autostradą A1 (Autostrada del Sole) i zjedź na węźle Cassino.',
    car_from: [
      { city: 'Rzym', time: '~2h', detail: '155 km · A1' },
      { city: 'Neapol', time: '~1h 15min', detail: '80 km · A1 lub SS7' },
      { city: 'Florencja', time: '~4h', detail: '413 km · A1' },
      { city: 'Mediolan', time: '~6h 30min', detail: '730 km · A1' },
    ],
    car_note_title: 'Samochód jest niezbędny',
    car_note: 'Na miejscu samochód nie jest luksusem — jest koniecznością. Supermarkety, plaże i restauracje nie są osiągalne pieszo od obiektu: wiejskie drogi nie mają chodników i chodzenie jest niebezpieczne. Samochód da Ci pełną swobodę odkrywania wybrzeża, okolic i miejscowości gór Aurunci.',
    cta: 'Zarezerwuj teraz',
    by_car: 'samochodem',
    by_plane: 'samolotem',
  },
};

// ─── Coordinate città sulla mappa (verificate da Luca) ─────────────────────
const CITIES = [
  { id: 'roma',    x: 392, y: 506, label: 'Roma',    time: '~2h',      byPlane: false },
  { id: 'napoli',  x: 512, y: 633, label: 'Napoli',  time: '~1h 15min',byPlane: false },
  { id: 'firenze', x: 376, y: 372, label: 'Firenze', time: '~4h',      byPlane: false },
  { id: 'venezia', x: 430, y: 163, label: 'Venezia', time: '~6h',      byPlane: false },
  { id: 'milano',  x: 181, y: 137, label: 'Milano',  time: '~6h 30min',byPlane: false },
  { id: 'palermo', x: 464, y: 846, label: 'Palermo', time: '~1h',      byPlane: true  },
  { id: 'bari',    x: 709, y: 569, label: 'Bari',    time: '~3h 45min',byPlane: false },
];

// ─── Label placement ────────────────────────────────────────────────────────
const LABEL_OFFSET: Record<string, { ax: number; ay: number; anchor: string }> = {
  roma:    { ax: -15, ay: -5,  anchor: 'end'    },
  napoli:  { ax: +15, ay: +4,  anchor: 'start'  },
  firenze: { ax: -15, ay: -5,  anchor: 'end'    },
  venezia: { ax: -15, ay: -8,  anchor: 'end'    },
  milano:  { ax: -15, ay: -5,  anchor: 'end'    },
  palermo: { ax:   0, ay: +22, anchor: 'middle' },
  bari:    { ax: +15, ay: +4,  anchor: 'start'  },
};

// ─── SVG Italy path (da EPS ufficiale, elaborato con potrace) ─────────────
const ITALY_PATH = `M3320 9880 c-8 -5 -32 -10 -53 -10 -105 0 -178 -45 -221 -135 -14
-30 -29 -55 -33 -55 -5 0 -27 14 -51 30 -55 37 -111 45 -223 32 -114 -12 -130
-26 -166 -139 -22 -72 -29 -84 -52 -89 -99 -23 -136 -35 -157 -55 -27 -25 -54
-104 -54 -155 0 -17 -6 -36 -12 -42 -7 -5 -50 -16 -95 -24 -99 -18 -108 -14
-117 57 -10 77 -28 89 -139 93 -155 5 -184 -26 -186 -196 -1 -93 -15 -125 -85
-190 -46 -43 -60 -52 -79 -46 -12 4 -44 13 -72 20 -50 13 -60 22 -117 100 -24
32 -28 46 -28 109 0 133 -31 165 -148 150 -79 -10 -106 -27 -139 -87 -21 -40
-39 -58 -73 -76 -74 -37 -85 -53 -87 -132 -2 -90 -38 -162 -96 -192 -36 -18
-45 -19 -104 -8 -85 16 -143 7 -212 -32 -54 -32 -61 -33 -166 -34 -144 -1
-139 0 -174 -29 -16 -14 -51 -33 -76 -42 -65 -22 -79 -57 -72 -175 7 -102 21
-135 76 -171 34 -22 43 -37 57 -84 10 -35 30 -73 51 -96 49 -55 43 -73 -47
-124 -59 -33 -85 -42 -122 -43 l-48 0 0 -199 0 -199 41 -31 c23 -16 54 -33 70
-36 51 -11 47 -44 -17 -155 -28 -48 -28 -48 -6 -233 7 -55 16 -87 31 -105 12
-15 32 -43 45 -62 31 -46 44 -57 96 -75 24 -9 65 -29 90 -44 49 -32 137 -61
182 -61 35 0 36 -20 7 -75 -38 -74 -7 -215 55 -244 57 -27 320 19 429 75 91
47 114 71 169 179 50 100 55 107 102 128 44 19 53 29 77 82 32 72 48 87 118
115 61 24 100 19 234 -26 71 -24 211 -110 277 -169 19 -17 73 -53 119 -79 68
-39 96 -49 153 -55 66 -7 71 -10 119 -57 41 -41 52 -61 64 -110 8 -32 14 -81
15 -109 0 -67 25 -207 43 -242 8 -15 25 -37 37 -48 13 -11 41 -58 62 -105 32
-69 39 -92 34 -125 -3 -22 -8 -60 -11 -85 -4 -25 -8 -55 -11 -67 -5 -28 -70
-63 -116 -63 -102 0 -145 -38 -157 -136 -5 -38 -17 -89 -26 -114 -18 -49 -14
-120 9 -139 21 -18 101 -24 139 -12 36 12 51 38 59 101 3 24 5 25 73 23 125
-5 144 10 160 130 4 31 11 47 21 47 8 0 14 -9 14 -20 0 -43 28 -79 73 -91 87
-23 99 -32 138 -92 58 -89 52 -109 -35 -121 -63 -8 -74 -18 -82 -73 -10 -70 9
-121 54 -140 42 -17 108 -13 163 10 49 21 184 37 224 26 40 -11 102 -59 130
-102 12 -18 32 -59 45 -91 33 -84 69 -121 130 -136 74 -18 151 -87 195 -177
28 -59 43 -76 74 -93 21 -10 48 -34 59 -52 11 -18 35 -46 52 -63 18 -16 49
-53 70 -80 33 -44 47 -54 121 -82 46 -17 100 -37 120 -43 43 -13 61 -31 83
-83 26 -64 94 -81 212 -51 62 15 62 15 115 -11 39 -20 74 -29 133 -33 67 -4
83 -9 102 -29 17 -18 78 -129 102 -185 2 -4 -12 -15 -32 -25 -44 -21 -61 -64
-53 -141 9 -81 19 -87 136 -86 l99 2 4 -55 c7 -79 29 -98 116 -98 54 0 81 7
137 32 44 20 94 34 136 38 61 6 69 4 88 -16 36 -39 44 -81 30 -158 -6 -38 -9
-84 -5 -104 9 -46 86 -122 145 -142 27 -9 67 -37 106 -74 72 -70 120 -87 205
-76 30 4 66 8 79 9 37 2 62 -49 72 -147 14 -123 42 -203 95 -272 72 -94 86
-134 94 -265 8 -117 31 -202 66 -241 27 -30 11 -45 -53 -52 -54 -5 -61 -9 -99
-52 -55 -62 -66 -120 -43 -222 10 -41 9 -54 -5 -81 -18 -36 -30 -39 -136 -45
-60 -3 -86 -9 -122 -31 -38 -22 -57 -27 -100 -24 l-53 3 -7 54 c-7 60 -24 107
-71 201 -29 58 -36 65 -72 74 -27 6 -62 5 -108 -2 -37 -7 -95 -12 -130 -12
-38 0 -77 -7 -102 -19 -23 -10 -62 -21 -87 -25 -26 -4 -52 -14 -59 -23 -17
-20 -17 -116 -1 -136 18 -22 80 -30 132 -18 25 5 80 11 122 13 70 3 79 1 103
-22 53 -49 72 -120 38 -138 -10 -5 -34 -12 -54 -16 -20 -4 -54 -20 -75 -37
-55 -44 -80 -55 -158 -69 -47 -9 -110 -11 -192 -7 -93 5 -134 3 -171 -8 -76
-23 -92 -20 -137 29 -23 25 -54 48 -71 52 -16 4 -49 24 -71 45 -62 56 -124 60
-286 18 -23 -6 -47 -22 -60 -39 -12 -17 -26 -30 -32 -30 -5 0 -22 15 -37 32
-26 32 -30 33 -98 33 -71 0 -71 0 -109 -42 -41 -47 -139 -103 -181 -103 -14
-1 -44 -8 -66 -16 -22 -9 -74 -17 -116 -17 -46 -1 -82 -7 -92 -15 -22 -19 -31
-85 -17 -128 13 -40 55 -64 111 -64 40 0 135 -27 147 -43 5 -7 17 -41 26 -77
21 -81 38 -108 81 -126 19 -7 46 -29 60 -48 35 -46 77 -59 164 -50 66 6 72 5
101 -20 18 -14 50 -29 73 -32 33 -6 52 -18 92 -59 56 -59 145 -120 190 -131
17 -3 53 -24 80 -45 82 -62 184 -99 295 -108 78 -6 103 -12 137 -34 55 -35 92
-83 123 -158 24 -58 29 -64 90 -95 l64 -34 263 0 263 0 0 77 0 77 58 55 57 54
-1 71 c0 54 -6 84 -26 127 -14 30 -28 77 -32 104 -6 37 -15 55 -42 78 -19 17
-34 37 -34 46 0 8 13 51 29 95 16 45 35 99 41 121 15 56 80 148 112 159 20 7
37 5 70 -10 36 -16 66 -19 204 -19 214 0 205 -5 264 151 36 96 81 152 186 229
40 30 81 69 90 87 12 22 20 80 28 184 12 170 14 175 96 222 41 24 55 27 150
27 61 1 114 6 126 13 49 27 77 159 49 232 -10 25 -23 109 -31 187 -7 78 -19
153 -26 166 -17 33 -90 93 -148 122 -25 13 -65 39 -89 59 -31 26 -56 37 -92
42 -80 11 -97 46 -48 100 23 25 39 76 39 125 0 22 9 47 22 64 12 16 49 80 83
143 33 65 72 124 88 136 l27 20 38 -36 c74 -71 173 -107 323 -117 64 -5 121
-11 127 -15 19 -12 92 -165 92 -194 0 -59 20 -99 78 -154 69 -66 107 -80 222
-82 75 -1 92 2 117 20 l28 21 3 290 2 291 -71 68 c-39 38 -90 81 -113 96 -31
19 -48 39 -60 70 -24 60 -58 92 -129 123 -34 14 -73 33 -87 41 -27 17 -100 50
-170 80 -25 10 -78 50 -120 89 -103 98 -191 148 -384 217 -60 21 -164 67 -231
101 -160 82 -199 98 -263 113 -59 14 -92 37 -92 65 0 10 31 42 73 74 39 32 78
68 85 81 39 73 15 242 -39 288 -42 36 -94 40 -316 26 -109 -7 -243 -12 -298
-11 -96 2 -101 3 -153 38 -29 19 -81 46 -114 59 -73 28 -94 46 -108 90 -8 24
-30 46 -78 80 -37 26 -108 86 -157 133 -50 47 -117 105 -148 129 -32 23 -64
57 -72 75 -39 87 -95 240 -95 257 0 11 -10 46 -21 78 -12 31 -31 93 -44 137
-12 44 -36 107 -52 140 -17 33 -40 95 -52 138 -26 96 -66 194 -88 219 -9 10
-46 27 -82 38 -90 27 -124 50 -239 161 -131 127 -161 148 -240 174 -55 17 -71
28 -87 55 -11 19 -51 64 -89 100 -38 36 -79 82 -92 102 -31 48 -51 135 -64
267 -10 92 -9 106 6 122 10 11 23 19 30 19 19 0 73 48 89 80 19 37 30 168 16
202 -5 15 -30 39 -53 54 -24 15 -45 28 -47 31 -3 2 -8 31 -12 64 -5 40 -16 73
-33 98 -42 61 -30 91 36 91 21 0 66 9 100 21 75 25 236 104 264 130 11 11 49
30 85 44 40 16 74 37 90 57 26 31 26 31 73 18 29 -8 67 -10 104 -6 73 8 88 3
111 -43 27 -51 51 -70 102 -77 58 -8 119 9 150 42 20 22 24 36 24 88 0 56 -4
69 -42 127 -23 35 -55 72 -70 81 -68 40 -80 60 -88 145 -5 62 -3 87 8 109 21
42 30 91 22 130 -4 25 -16 41 -45 61 -22 14 -40 34 -40 43 0 10 22 34 50 54
39 28 51 44 61 78 23 89 -7 166 -75 187 -35 11 -155 30 -261 41 -95 10 -193
27 -295 50 -47 11 -112 24 -145 29 -122 19 -161 50 -221 178 -32 67 -35 79
-29 128 l7 55 -353 0 c-211 0 -360 -4 -369 -10z M2203 5963 c-37 -7 -48 -31
-48 -109 0 -93 12 -108 89 -108 68 -1 92 19 102 81 16 109 -35 157 -143 136z
M2543 5283 c-12 -2 -27 -11 -35 -20 -17 -21 -17 -135 0 -156 18 -22 85 -31
126 -17 50 16 69 79 45 148 -15 43 -64 59 -136 45z M1763 4239 c-18 -5 -44
-25 -58 -44 -15 -19 -46 -45 -69 -59 -37 -22 -62 -46 -165 -161 -27 -31 -176
-103 -187 -92 -4 3 -1 35 7 71 18 91 3 141 -49 163 -44 18 -126 12 -152 -12
-28 -25 -70 -129 -76 -187 -3 -29 -13 -73 -22 -98 -13 -34 -17 -80 -17 -192 0
-170 2 -175 83 -185 69 -8 88 -30 95 -110 3 -39 13 -73 25 -90 34 -49 35 -68
6 -102 -21 -25 -28 -48 -36 -114 -11 -95 -5 -143 22 -198 24 -46 27 -151 6
-221 -8 -26 -17 -80 -21 -120 -9 -110 -12 -116 -54 -138 -83 -42 -82 -161 2
-260 23 -27 51 -61 62 -75 15 -19 33 -27 70 -31 41 -5 56 -12 82 -42 l32 -36
100 -4 c146 -6 185 2 236 49 58 54 94 109 109 166 8 30 18 49 29 51 9 2 44
-16 78 -39 55 -39 67 -43 119 -44 48 0 63 4 83 24 61 56 127 318 112 437 -5
34 -2 67 9 104 11 35 16 92 16 166 0 73 5 126 15 154 17 49 19 108 4 165 -6
22 -13 50 -16 63 -3 14 3 33 19 55 52 68 71 119 76 202 3 59 -1 92 -13 125
-24 66 -34 107 -44 183 -7 48 -17 78 -35 102 -14 18 -26 42 -26 53 0 51 -14
85 -41 101 -21 11 -33 30 -44 66 l-14 50 -113 54 c-119 57 -182 70 -245 50z
M4414 3964 c-45 -10 -59 -40 -59 -125 0 -99 11 -113 91 -113 47 0 60 4 75 23
40 49 49 172 15 200 -15 13 -91 22 -122 15z M5983 2004 c-35 -8 -48 -33 -48
-95 0 -82 23 -104 105 -104 80 0 95 15 95 95 0 46 -5 64 -20 80 -21 20 -90 33
-132 24z M4548 1919 c-33 -13 -53 -65 -43 -117 9 -49 19 -59 65 -67 61 -10
107 9 120 51 13 39 5 107 -14 123 -19 16 -97 22 -128 10z M3678 249 c-56 -22
-63 -149 -13 -215 l26 -34 92 0 c106 0 114 6 123 88 7 58 -13 119 -46 143 -30
22 -143 33 -182 18z`;

// ─── Componente mappa animata ───────────────────────────────────────────────
function ItalyMap({ locale }: { locale: Locale }) {
  const t = T[locale];
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleCities, setVisibleCities] = useState<Set<number>>(new Set());
  const [drawingIndex, setDrawingIndex] = useState<number>(-1);

  useEffect(() => {
    let step = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      setVisibleCities(new Set());
      setDrawingIndex(-1);

      const showNext = () => {
        if (!running) return;
        if (step >= CITIES.length) {
          // pausa poi riavvia
          animRef.current = setTimeout(() => {
            step = 0;
            animate();
          }, 2500);
          return;
        }
        setDrawingIndex(step);
        animRef.current = setTimeout(() => {
          setVisibleCities(prev => new Set([...prev, step]));
          step++;
          animRef.current = setTimeout(showNext, 600);
        }, 900);
      };

      animRef.current = setTimeout(showNext, 400);
    };

    animate();
    return () => {
      running = false;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  const lineLen = (city: typeof CITIES[0]) =>
    Math.sqrt((city.x - 480) ** 2 + (city.y - 577) ** 2);

  return (
    <svg
      viewBox="0 0 836 989"
      style={{ width: '100%', maxWidth: 400, margin: '0 auto', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Silhouette Italia */}
      <g transform="translate(0,989) scale(0.1,-0.1)">
        <path
          d={ITALY_PATH}
          fill="var(--color-bg, #f0f0ec)"
          stroke="#ccc"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>

      {/* Linee animate */}
      {CITIES.map((city, i) => {
        const ll = lineLen(city);
        const isDrawing = drawingIndex === i;
        const isVisible = visibleCities.has(i);
        return (
          <line
            key={city.id}
            x1={480} y1={577} x2={city.x} y2={city.y}
            stroke="#1E73BE"
            strokeWidth={2}
            fill="none"
            strokeDasharray={city.byPlane ? `6 4 ${ll}` : `${ll}`}
            strokeDashoffset={isDrawing || isVisible ? 0 : ll}
            opacity={isDrawing || isVisible ? 1 : 0}
            style={{
              transition: isDrawing
                ? 'stroke-dashoffset 0.85s ease, opacity 0.1s'
                : 'none',
            }}
          />
        );
      })}

      {/* Dot e label città */}
      {CITIES.map((city, i) => {
        const lbl = LABEL_OFFSET[city.id];
        const isVisible = visibleCities.has(i);
        const modeLabel = city.byPlane ? t.by_plane : t.by_car;
        return (
          <g key={city.id} opacity={isVisible ? 1 : 0} style={{ transition: 'opacity 0.4s' }}>
            <circle cx={city.x} cy={city.y} r={6} fill="#1E73BE" />
            <text
              x={city.x + lbl.ax}
              y={city.y + lbl.ay - 9}
              textAnchor={lbl.anchor as 'start' | 'end' | 'middle'}
              fontSize={18}
              fontWeight={500}
              fill="var(--color-text, #111)"
              fontFamily="system-ui, sans-serif"
            >
              {city.label}
            </text>
            <text
              x={city.x + lbl.ax}
              y={city.y + lbl.ay + 8}
              textAnchor={lbl.anchor as 'start' | 'end' | 'middle'}
              fontSize={14}
              fill="#1E73BE"
              fontFamily="system-ui, sans-serif"
            >
              {city.time} {modeLabel}
            </text>
          </g>
        );
      })}

      {/* Scauri — dot home */}
      <circle cx={480} cy={577} r={16} fill="none" stroke="#FCAF1A" strokeWidth={1.5} opacity={0.4} />
      <circle cx={480} cy={577} r={9} fill="#FCAF1A" stroke="white" strokeWidth={2.5} />
      <circle cx={480} cy={577} r={4} fill="white" />
      <text x={496} y={570} fontSize={18} fontWeight={600} fill="var(--color-text, #111)" fontFamily="system-ui, sans-serif">
        Scauri
      </text>
    </svg>
  );
}

// ─── Componente principale ──────────────────────────────────────────────────
export default function DoveSiamoClient({
  locale,
  bookHref,
}: {
  locale: Locale;
  bookHref: string;
}) {
  const t = T[locale];
  const [activeTab, setActiveTab] = useState<Tab>('car');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.25rem 4rem' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '3.5rem 0 2.5rem' }}>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          fontWeight: 700,
          color: '#1E73BE',
          marginBottom: '0.75rem',
          lineHeight: 1.25,
        }}>
          {t.hero_title}
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: 580, margin: '0 auto' }}>
          {t.hero_sub}
        </p>
      </section>

      {/* ── Perché Scauri ─────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={h2Style}>{t.why_title}</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {t.pills.map((pill, i) => (
            <div key={i} style={pillStyle}>
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.5rem' }}>
                {pill.icon}
              </span>
              <strong style={{ display: 'block', color: '#1E73BE', marginBottom: '0.3rem', fontSize: '0.95rem' }}>
                {pill.title}
              </strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
                {pill.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mappa ─────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={h2Style}>{t.map_title}</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          {t.map_sub}
        </p>
        <ItalyMap locale={locale} />
      </section>

      {/* ── Come raggiungerci — tabs ───────────────────────────────────────── */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={h2Style}>{t.how_title}</h2>

        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0' }}>
          {(['plane', 'train', 'car'] as Tab[]).map((tab) => {
            const labels = { plane: t.tab_plane, train: t.tab_train, car: t.tab_car };
            const icons  = { plane: '✈️', train: '🚂', car: '🚗' };
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.6rem 1.1rem',
                  fontSize: '0.9rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#1E73BE' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2.5px solid #1E73BE' : '2.5px solid transparent',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                  transition: 'color 0.15s',
                }}
              >
                {icons[tab]} {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Contenuto tab Aereo */}
        {activeTab === 'plane' && (
          <div style={tabContentStyle}>
            <p style={tabIntroStyle}>{t.plane_intro}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {t.plane_airports.map((ap) => (
                <div key={ap.code} style={airportRowStyle}>
                  <span style={{ fontWeight: 700, color: '#1E73BE', minWidth: 36, fontSize: '0.85rem' }}>
                    {ap.code}
                  </span>
                  <span style={{ flex: 1, color: '#374151', fontSize: '0.95rem' }}>{ap.name}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{ap.km}</span>
                  <span style={{
                    background: '#EBF4FF',
                    color: '#1E73BE',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}>
                    {ap.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenuto tab Treno */}
        {activeTab === 'train' && (
          <div style={tabContentStyle}>
            <p style={tabIntroStyle}>{t.train_intro}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
              {t.train_routes.map((route, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#374151', fontSize: '0.95rem' }}>🚉 {route.label}</span>
                  <span style={{ fontWeight: 600, color: '#1E73BE', fontSize: '1rem' }}>{route.time}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.5 }}>
              ℹ️ {t.train_note}
            </p>
          </div>
        )}

        {/* Contenuto tab Auto */}
        {activeTab === 'car' && (
          <div style={tabContentStyle}>
            <p style={tabIntroStyle}>{t.car_intro}</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              margin: '1rem 0',
            }}>
              {t.car_from.map((item, i) => (
                <div key={i} style={{ padding: '1rem', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1rem', color: '#111' }}>
                    🚗 {item.city}
                  </p>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '1.1rem', fontWeight: 600, color: '#1E73BE' }}>
                    {item.time}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>{item.detail}</p>
                </div>
              ))}
            </div>
            {/* Nota auto obbligatoria */}
            <div style={{
              background: '#FFF8E7',
              border: '1px solid #FCAF1A',
              borderRadius: 10,
              padding: '1rem 1.25rem',
              marginTop: '1.25rem',
            }}>
              <strong style={{ display: 'block', color: '#92400e', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                ⚠️ {t.car_note_title}
              </strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#78350f', lineHeight: 1.6 }}>
                {t.car_note}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', paddingTop: '1.5rem' }}>
        <a
          href={bookHref}
          style={{
            display: 'inline-block',
            background: '#FCAF1A',
            color: '#111',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '0.85rem 2.5rem',
            borderRadius: 10,
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          {t.cta}
        </a>
      </section>

    </div>
  );
}

// ─── Stili condivisi ────────────────────────────────────────────────────────
const h2Style: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: 700,
  color: '#1E73BE',
  marginBottom: '1rem',
};

const pillStyle: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '1.25rem',
};

const tabContentStyle: React.CSSProperties = {
  animation: 'fadeIn 0.25s ease',
};

const tabIntroStyle: React.CSSProperties = {
  color: '#374151',
  lineHeight: 1.6,
  fontSize: '0.95rem',
  marginBottom: '0.5rem',
};

const airportRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  background: '#f9fafb',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  flexWrap: 'wrap',
};
