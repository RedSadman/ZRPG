export const HEALING_PILL = { heal: 0.5, basePrice: 6, pricePerLevel: 2, carryMax: 3 };

/** Pills that help cross into a new realm, keyed by the level they unlock. */
export const BREAKTHROUGH_PILLS: Record<number, { key: string; price: number; bonus: number }> = {
  1: { key: 'qiGatheringPill', price: 30, bonus: 0.15 },
  10: { key: 'foundationPill', price: 300, bonus: 0.2 },
  19: { key: 'goldenCorePill', price: 1200, bonus: 0.2 },
  28: { key: 'nascentSoulPill', price: 3500, bonus: 0.2 },
  37: { key: 'spiritPill', price: 8000, bonus: 0.2 },
  46: { key: 'daoPill', price: 18000, bonus: 0.2 },
};
