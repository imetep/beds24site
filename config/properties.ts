// config/properties.ts
// Dati statici delle proprietà pubblicate su livingapple.com
// Fonte: Excel cliente + API Beds24 verificata
// v3.9 — aggiunto CIN/CIR, coordinate GPS per Google Maps

// ─── CODICI IDENTIFICATIVI STRUTTURA (obbligatori per legge italiana) ─────────
export const CIN = 'IT059014B47RVOMN2D';
export const CIR = '059014-CAV-00072';

export type PoolType = 'none' | 'private' | 'shared';

export interface RoomFeatures {
  outdoorDining: boolean;   // mangiare fuori
  garden: boolean;          // giardino
  patio: boolean;           // patio esterno
  eventHall: boolean;       // salone per eventi
}

export interface Room {
  roomId: number;
  name: string;
  slug: string;             // URL slug es. "fuji" → /residenze/fuji
  type: 'monolocale' | 'appartamento' | 'villa';
  bedrooms: number;
  bathrooms: number;
  maxPeople: number;
  sqm: number;              // superficie mq
  floor: number;            // piano (0 = piano terra)
  privatePool: boolean;
  sharedPool: boolean;
  features: RoomFeatures;
  securityDeposit: number;  // €
  cloudinaryFolder: string; // es. "livingapple/fuji"
}

export interface Property {
  propertyId: number;
  name: string;
  nameShort: string;
  distanceFromSea: number;  // km
  distanceLabel: string;    // testo per il cliente
  latitude: number;         // coordinate GPS
  longitude: number;
  rooms: Room[];
}

// ─── PROPRIETÀ PUBBLICATE ────────────────────────────────────────────────────

export const PROPERTIES: Property[] = [
  {
    propertyId: 46487,
    name: 'LivingApple',
    nameShort: 'natura',
    distanceFromSea: 1.5,
    distanceLabel: 'A 1.5 km dal mare, immerso nella natura',
    latitude: 41.2624198,
    longitude: 13.7012664,
    rooms: [
      {
        roomId: 107773,
        name: 'Stark',
        slug: 'stark',
        type: 'appartamento',
        bedrooms: 4,
        bathrooms: 2,
        maxPeople: 11,
        sqm: 180,
        floor: 0,
        privatePool: true,
        sharedPool: true,
        features: { outdoorDining: true, garden: true, patio: true, eventHall: true },
        securityDeposit: 600,
        cloudinaryFolder: 'livingapple/stark',
      },
      {
        roomId: 107799,
        name: 'Idared',
        slug: 'idared',
        type: 'appartamento',
        bedrooms: 2,
        bathrooms: 1,
        maxPeople: 6,
        sqm: 80,
        floor: 3,
        privatePool: false,
        sharedPool: true,
        features: { outdoorDining: true, garden: false, patio: false, eventHall: false },
        securityDeposit: 300,
        cloudinaryFolder: 'livingapple/idared',
      },
      {
        roomId: 107846,
        name: 'Delicious',
        slug: 'delicious',
        type: 'appartamento',
        bedrooms: 2,
        bathrooms: 1,
        maxPeople: 6,
        sqm: 80,
        floor: 3,
        privatePool: false,
        sharedPool: true,
        features: { outdoorDining: true, garden: false, patio: false, eventHall: false },
        securityDeposit: 300,
        cloudinaryFolder: 'livingapple/delicious',
      },
      {
        roomId: 107847,
        name: 'Fuji',
        slug: 'fuji',
        type: 'appartamento',
        bedrooms: 3,
        bathrooms: 2,
        maxPeople: 9,
        sqm: 110,
        floor: 2,
        privatePool: false,
        sharedPool: true,
        features: { outdoorDining: true, garden: false, patio: false, eventHall: false },
        securityDeposit: 400,
        cloudinaryFolder: 'livingapple/fuji',
      },
      {
        roomId: 107848,
        name: 'Pink Lady',
        slug: 'pink-lady',
        type: 'appartamento',
        bedrooms: 3,
        bathrooms: 2,
        maxPeople: 12,
        sqm: 180,
        floor: 1,
        privatePool: false,
        sharedPool: true,
        features: { outdoorDining: true, garden: false, patio: true, eventHall: true },
        securityDeposit: 500,
        cloudinaryFolder: 'livingapple/pink-lady',
      },
      {
        roomId: 107849,
        name: 'Renetta',
        slug: 'renetta',
        type: 'appartamento',
        bedrooms: 3,
        bathrooms: 2,
        maxPeople: 12,
        sqm: 160,
        floor: 0,
        privatePool: false,
        sharedPool: true,
        features: { outdoorDining: true, garden: false, patio: true, eventHall: true },
        securityDeposit: 500,
        cloudinaryFolder: 'livingapple/renetta',
      },
      {
        roomId: 107851,
        name: 'Smith',
        slug: 'smith',
        type: 'appartamento',
        bedrooms: 3,
        bathrooms: 2,
        maxPeople: 9,
        sqm: 110,
        floor: 2,
        privatePool: false,
        sharedPool: true,
        features: { outdoorDining: true, garden: false, patio: false, eventHall: false },
        securityDeposit: 400,
        cloudinaryFolder: 'livingapple/smith',
      },
      {
        roomId: 198030,
        name: 'Annurca',
        slug: 'annurca',
        type: 'monolocale',
        bedrooms: 1,
        bathrooms: 1,
        maxPeople: 4,
        sqm: 40,
        floor: 0,
        privatePool: false,
        sharedPool: true,
        features: { outdoorDining: false, garden: false, patio: false, eventHall: false },
        securityDeposit: 200,
        cloudinaryFolder: 'livingapple/annurca',
      },
      {
        roomId: 432215,
        name: 'Kissabel',
        slug: 'kissabel',
        type: 'villa',
        bedrooms: 4,
        bathrooms: 2,
        maxPeople: 14,
        sqm: 260,
        floor: 0,
        privatePool: true,
        sharedPool: true,
        features: { outdoorDining: true, garden: true, patio: true, eventHall: true },
        securityDeposit: 1000,
        cloudinaryFolder: 'livingapple/kissabel',
      },
      {
        roomId: 507514,
        name: 'Sergente',
        slug: 'sergente',
        type: 'villa',
        bedrooms: 4,
        bathrooms: 2,
        maxPeople: 14,
        sqm: 260,
        floor: 0,
        privatePool: false,
        sharedPool: true,
        features: { outdoorDining: true, garden: true, patio: true, eventHall: false },
        securityDeposit: 800,
        cloudinaryFolder: 'livingapple/sergente',
      },
    ],
  },
  {
    propertyId: 46871,
    name: 'LivingApple Beach',
    nameShort: 'mare',
    distanceFromSea: 0.25,
    distanceLabel: 'Vicino al mare, a 250m dalla spiaggia',
    latitude: 41.237587,
    longitude: 13.74424,
    rooms: [
      {
        roomId: 108607,
        name: 'Gala',
        slug: 'gala',
        type: 'appartamento',
        bedrooms: 2,
        bathrooms: 2,
        maxPeople: 5,
        sqm: 68,
        floor: 0,
        privatePool: false,
        sharedPool: false,
        features: { outdoorDining: true, garden: false, patio: true, eventHall: false },
        securityDeposit: 300,
        cloudinaryFolder: 'livingapple-beach/gala',
      },
      {
        roomId: 108612,
        name: 'Rubens',
        slug: 'rubens',
        type: 'appartamento',
        bedrooms: 2,
        bathrooms: 2,
        maxPeople: 5,
        sqm: 68,
        floor: 0,
        privatePool: false,
        sharedPool: false,
        features: { outdoorDining: true, garden: false, patio: true, eventHall: false },
        securityDeposit: 300,
        cloudinaryFolder: 'livingapple-beach/rubens',
      },
      {
        roomId: 108613,
        name: 'Braeburn',
        slug: 'braeburn',
        type: 'appartamento',
        bedrooms: 2,
        bathrooms: 1,
        maxPeople: 6,
        sqm: 75,
        floor: 0,
        privatePool: false,
        sharedPool: false,
        features: { outdoorDining: true, garden: false, patio: true, eventHall: false },
        securityDeposit: 300,
        cloudinaryFolder: 'livingapple-beach/braeburn',
      },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Tutte le rooms pubblicate (flat list)
export const ALL_ROOMS: Room[] = PROPERTIES.flatMap((p) => p.rooms);

// Trova property di una room
export function getPropertyForRoom(roomId: number): Property | undefined {
  return PROPERTIES.find((p) => p.rooms.some((r) => r.roomId === roomId));
}

// Trova room per roomId
export function getRoomById(roomId: number): Room | undefined {
  return ALL_ROOMS.find((r) => r.roomId === roomId);
}

// Trova room per slug
export function getRoomBySlug(slug: string): Room | undefined {
  return ALL_ROOMS.find((r) => r.slug === slug);
}

// Filtra rooms per numero di persone
export function filterByOccupancy(totalGuests: number): Room[] {
  return ALL_ROOMS.filter((r) => r.maxPeople >= totalGuests);
}

// Filtra rooms per preferenza piscina
export function filterByPool(rooms: Room[], poolPreference: PoolType): Room[] {
  if (poolPreference === 'none') return rooms;
  if (poolPreference === 'private') return rooms.filter((r) => r.privatePool);
  if (poolPreference === 'shared') return rooms.filter((r) => r.sharedPool);
  return rooms;
}

// Filtra rooms per entrambi i criteri (occupancy + pool)
export function getAvailableRooms(totalGuests: number, poolPreference: PoolType): Room[] {
  const byOccupancy = filterByOccupancy(totalGuests);
  return filterByPool(byOccupancy, poolPreference);
}

// Controlla se una room ha la piscina (privata o condivisa)
export function hasPool(room: Room): boolean {
  return room.privatePool || room.sharedPool;
}

// Controlla se tutte le rooms filtrate appartengono solo a LivingApple Beach
export function allRoomsAreBeach(rooms: Room[]): boolean {
  return rooms.every((r) => {
    const prop = getPropertyForRoom(r.roomId);
    return prop?.propertyId === 46871;
  });
}

// Calcola URL Cloudinary per una foto
// photoIndex: 1-based (1 = foto principale)
export function getCloudinaryUrl(room: Room, photoIndex: number = 1, width: number = 800): string {
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'livingapple';
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},c_fill,q_auto,f_auto/${room.cloudinaryFolder}/${photoIndex}.jpg`;
}

// Imposta di Soggiorno — Comune di Minturno (Scauri)
// €2/persona/notte · max 10 notti · esenti under 12
export const TOURIST_TAX_RATE_EUR = 2;
export const TOURIST_TAX_MAX_NIGHTS = 10;
export const TOURIST_TAX_EXEMPT_UNDER_AGE = 12;

export function calculateTouristTax(
  numAdult: number,
  childrenAges: number[] | undefined,
  nights: number
): number {
  if (nights <= 0) return 0;
  const taxableNights = Math.min(nights, TOURIST_TAX_MAX_NIGHTS);
  const taxableChildren = (childrenAges ?? []).filter(a => a >= TOURIST_TAX_EXEMPT_UNDER_AGE).length;
  const taxablePeople = numAdult + taxableChildren;
  return taxableNights * taxablePeople * TOURIST_TAX_RATE_EUR;
}

// Inietta le costanti tassa di soggiorno nel template i18n (placeholder {rate} / {maxNights} / {exemptAge}).
export function formatTouristTaxNote(template: string): string {
  return template
    .replace('{rate}', String(TOURIST_TAX_RATE_EUR))
    .replace('{maxNights}', String(TOURIST_TAX_MAX_NIGHTS))
    .replace('{exemptAge}', String(TOURIST_TAX_EXEMPT_UNDER_AGE));
}

// ─── OFFERS — uguali per tutte le property ───────────────────────────────────

export interface OfferInfo {
  offerId: number;
  name: Record<string, string>;
  conditions: Record<string, string>;
}

export const OFFER_INFO: Record<number, OfferInfo> = {
  1: {
    offerId: 1,
    name: { it: 'Non Rimborsabile', en: 'Non Refundable', de: 'Nicht Erstattungsfähig', pl: 'Bezzwrotna' },
    conditions: {
      it: 'Paghi tutto entro 48 ore dalla prenotazione',
      en: 'Full payment within 48 hours of booking',
      de: 'Vollständige Zahlung innerhalb von 48 Stunden nach der Buchung',
      pl: 'Pełna płatność w ciągu 48 godzin od rezerwacji',
    },
  },
  2: {
    offerId: 2,
    name: { it: 'Parzialmente Rimborsabile', en: 'Partially Refundable', de: 'Teilweise Erstattungsfähig', pl: 'Częściowo Zwrotna' },
    conditions: {
      it: 'Paghi il 50% subito, il saldo lo porti all\'arrivo',
      en: '50% now, balance due at arrival',
      de: '50% jetzt, Restbetrag bei Ankunft',
      pl: '50% teraz, reszta płatna przy przyjeździe',
    },
  },
  3: {
    offerId: 3,
    name: { it: 'Flessibile 60 giorni', en: 'Flexible 60 days', de: 'Flexibel 60 Tage', pl: 'Elastyczna 60 dni' },
    conditions: {
      it: 'Non paghi niente adesso · Cancellazione gratuita entro 60 giorni dall\'arrivo',
      en: 'No payment now · Free cancellation up to 60 days before arrival',
      de: 'Keine Zahlung jetzt · Kostenlose Stornierung bis 60 Tage vor Ankunft',
      pl: 'Brak płatności teraz · Bezpłatne anulowanie do 60 dni przed przyjazdem',
    },
  },
  4: {
    offerId: 4,
    name: { it: 'Flessibile 45 giorni', en: 'Flexible 45 days', de: 'Flexibel 45 Tage', pl: 'Elastyczna 45 dni' },
    conditions: {
      it: 'Non paghi niente adesso · Cancellazione gratuita entro 45 giorni dall\'arrivo',
      en: 'No payment now · Free cancellation up to 45 days before arrival',
      de: 'Keine Zahlung jetzt · Kostenlose Stornierung bis 45 Tage vor Ankunft',
      pl: 'Brak płatności teraz · Bezpłatne anulowanie do 45 dni przed przyjazdem',
    },
  },
  5: {
    offerId: 5,
    name: { it: 'Flessibile 30 giorni', en: 'Flexible 30 days', de: 'Flexibel 30 Tage', pl: 'Elastyczna 30 dni' },
    conditions: {
      it: 'Non paghi niente adesso · Cancellazione gratuita entro 30 giorni dall\'arrivo',
      en: 'No payment now · Free cancellation up to 30 days before arrival',
      de: 'Keine Zahlung jetzt · Kostenlose Stornierung bis 30 Tage vor Ankunft',
      pl: 'Brak płatności teraz · Bezpłatne anulowanie do 30 dni przed przyjazdem',
    },
  },
  6: {
    offerId: 6,
    name: { it: 'Flessibile 5 giorni', en: 'Flexible 5 days', de: 'Flexibel 5 Tage', pl: 'Elastyczna 5 dni' },
    conditions: {
      it: 'Non paghi niente adesso · Cancellazione gratuita entro 5 giorni dall\'arrivo',
      en: 'No payment now · Free cancellation up to 5 days before arrival',
      de: 'Keine Zahlung jetzt · Kostenlose Stornierung bis 5 Tage vor Ankunft',
      pl: 'Brak płatności teraz · Bezpłatne anulowanie do 5 dni przed przyjazdem',
    },
  },
};