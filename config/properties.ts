/**
 * config/properties.ts
 *
 * Mappa slug interni → propertyId Beds24.
 * I nomi delle rooms (es. "Stark", "Fuji"...) NON sono hardcodati qui —
 * vengono sempre recuperati live da GET /properties?includeAllRooms=true
 * e messi in cache indefinitamente.
 *
 * Proprietà pubblicate su livingapple.com:
 *   46487  LivingApple          (campagna, 1.5km dal mare)  10 rooms
 *   46871  LivingApple Beach    (3 min dal mare)             3 rooms
 *
 * NON pubblicate (per ora): 47410, 48556, 190754
 */

export interface PropertyConfig {
  /** Slug usato nelle URL (es. /it/residenze/campagna) */
  slug: string;
  /** ID proprietà Beds24 */
  beds24Id: number;
  /** Room IDs Beds24 appartenenti a questa proprietà */
  roomIds: number[];
  /** Gruppo visivo sul sito */
  group: 'campagna' | 'mare';
}

export const PROPERTIES: PropertyConfig[] = [
  {
    slug: 'campagna',
    beds24Id: 46487,
    roomIds: [107773, 107799, 107846, 107847, 107848, 107849, 107851, 198030, 432215, 507514],
    group: 'campagna',
  },
  {
    slug: 'mare',
    beds24Id: 46871,
    roomIds: [108607, 108612, 108613],
    group: 'mare',
  },
];

/** Tutti i propertyId pubblicati (utile per chiamate API bulk) */
export const PUBLISHED_PROPERTY_IDS = PROPERTIES.map((p) => p.beds24Id);

/** Tutti i roomId pubblicati (utile per webhook e cache) */
export const PUBLISHED_ROOM_IDS = PROPERTIES.flatMap((p) => p.roomIds);

/** Trova una proprietà dallo slug URL */
export function getPropertyBySlug(slug: string): PropertyConfig | undefined {
  return PROPERTIES.find((p) => p.slug === slug);
}

/** Trova la proprietà a cui appartiene un roomId */
export function getPropertyByRoomId(roomId: number): PropertyConfig | undefined {
  return PROPERTIES.find((p) => p.roomIds.includes(roomId));
}
