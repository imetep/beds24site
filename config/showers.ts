// config/showers.ts
// Numero di docce per roomId — usato esclusivamente da bedConfig.ts per calcolo scendibagno.
// Fonte: Excel 0000_Caratteristiche + verifica diretta strutture.
// NON esposto al portale ospiti né alle schede casa.
//
// AGGIORNARE quando cambia la dotazione fisica delle docce in una struttura.

export const SHOWERS_BY_ROOM: Record<number, number> = {
  // ── LivingApple campagna (46487) ─────────────────────────────────────────
  107773: 1,  // Stark        — 2 bagni, 1 doccia
  107799: 1,  // Idared       — 1 bagno, 1 doccia
  107846: 1,  // Delicious    — 1 bagno, 1 doccia
  107847: 1,  // Fuji         — 2 bagni, 1 doccia
  107848: 1,  // PinkLady     — 2 bagni, 1 doccia
  107849: 2,  // Renetta      — 2 bagni, 2 docce
  107851: 1,  // Smith        — 2 bagni, 1 doccia
  198030: 1,  // Annurca      — 1 bagno, 1 doccia
  432215: 2,  // Kissabel     — 2 bagni, 2 docce
  507514: 2,  // Sergente     — 2 bagni, 2 docce

  // ── LivingApple Beach (46871) ────────────────────────────────────────────
  108607: 2,  // Gala         — 2 bagni, 2 docce
  108612: 2,  // Rubens       — 2 bagni, 2 docce
  108613: 1,  // Braeburn     — 1 bagno, 1 doccia

  // ── Cherry House (47410) ─────────────────────────────────────────────────
  109685: 1,  // Cherry       — 1 bagno, 1 doccia
  113528: 1,  // Mulberry     — 1 bagno, 1 doccia

  // ── Il Mare In Giardino (48556) ──────────────────────────────────────────
  112982: 1,  // Ciclamino    — 1 bagno, 1 doccia
  113880: 1,  // Fiordaliso   — 1 bagno, 1 doccia
  113881: 1,  // Lavanda      — 1 bagno, 1 doccia
  113882: 1,  // Narciso      — 2 bagni, 1 doccia
  113883: 1,  // Orchidea     — 1 bagno, 1 doccia
  113884: 1,  // Primula      — 1 bagno, 1 doccia
  113885: 1,  // Mughetto     — 1 bagno, 1 doccia
  113887: 1,  // Viola        — 1 bagno, 1 doccia
  179295: 1,  // Peonia       — 1 bagno, 1 doccia

  // ── Villa Patrizia (190754) ──────────────────────────────────────────────
  411401: 2,  // Villa Patrizia — 2 bagni, 2 docce
};

export function getShowers(roomId: number): number {
  return SHOWERS_BY_ROOM[roomId] ?? 1;
}
