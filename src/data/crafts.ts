// Crafts and business: what a dreamer makes of herbs, beast cores and spirit ore, and what money makes of itself.
// Materials and products are priced in spirit stones, so selling and crafting can be weighed against each other.

import type { PathKey } from './paths.ts';

export type CraftKey = 'alchemy' | 'forging' | 'talismans';
export const CRAFT_KEYS: CraftKey[] = ['alchemy', 'forging', 'talismans'];

export type Product = 'healingPill' | 'gatheringPill' | 'gatePill' | 'escapeTalisman' | 'thunderTalisman';
export type TalismanKind = 'escape' | 'thunder';

/** The craft each path takes to: it starts with some skill in it and learns it twice as fast. */
export const PATH_CRAFT: Partial<Record<PathKey, CraftKey>> = { alchemy: 'alchemy', body: 'forging', sword: 'talismans' };
export const PATH_CRAFT_START = 2;
export const MAX_CRAFT = 10;
/** Skill gained per attempt, success or not. */
export const CRAFT_XP = 0.05;

/** Chance that one attempt works: skill and a clear mind help. */
export function craftChance(skill: number, mind: number): number {
  return Math.min(0.95, Math.max(0.05, 0.45 + 0.05 * skill + 0.005 * mind));
}

/**
 * Pills that speed up meditation: each gives a share of the qi the next stage needs, but the body takes only a
 * few per stage before it stops listening. Brewed from beast cores, so they come from fighting, or bought dear
 * from the sect's pill hall.
 */
export const GATHERING_PILL = { carryMax: 6, share: 0.1, perStage: 3, price: 3, cores: 0.35, herbs: 0.15 };

/** Materials for a healing pill, as a share of its price in the pill hall. */
export const HEALING_HERBS = 0.5;

/** A realm-gate pill brewed at home: materials as a share of its price; needs this much skill per realm. */
export const GATE_PILL = { cores: 0.3, herbs: 0.2, skillPerRealm: 2, penaltyPerRealm: 0.05, tries: 3 };

/**
 * Talismans; materials in units, the stones pay for cinnabar and paper. Escape tears the hero out of a lost fight;
 * thunder opens a fight with a bolt worth a share of what an ordinary foe of that level can take.
 */
export const TALISMANS: Record<TalismanKind, { carryMax: number; cores: number; herbs: number; stones: number }> = {
  escape: { carryMax: 2, cores: 0, herbs: 1, stones: 1 },
  thunder: { carryMax: 3, cores: 0.5, herbs: 0.2, stones: 0.2 },
};
export const THUNDER_DAMAGE = 0.3;

/** Forging: ore and cores in material units; harder than alchemy, and skill pushes the rank up like luck. */
export const FORGE = { ore: 8, cores: 3, penalty: 0.1, skillLuck: 3 };

/**
 * A shop in the town below the mountain. Each level doubles the price and adds the same income again; the till
 * fills while the hero is away and is emptied at the next visit, unless thieves get there first.
 */
export const SHOP = { maxLevel: 3, price: 30, income: 0.6, robbery: 0.008 };
