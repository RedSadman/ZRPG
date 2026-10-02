import { INSTINCTS, type Instinct, type InstinctDef } from '../data/instincts.ts';

/** How much a secondary instinct shifts the main one's thresholds and values. */
export const SECONDARY_WEIGHT = 0.3;

const cache = new Map<string, InstinctDef>();

/**
 * The dreamer's temperament: the main instinct, shifted a little by a secondary one. Numbers (thresholds,
 * values, leanings) blend; habits add up — a cautious dreamer with a greedy streak still opens a shop, and
 * makes the talismans both care for. How a task is judged and whether to wait for a pill stay the main one's.
 */
export function temperament(life: { instinct: Instinct; secondary?: Instinct | null }): InstinctDef {
  const main = INSTINCTS[life.instinct];
  const secondary = life.secondary && life.secondary !== life.instinct ? INSTINCTS[life.secondary] : null;
  if (!secondary) return main;
  const key = `${life.instinct}/${life.secondary}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const w = SECONDARY_WEIGHT;
  const mix = (a: number, b: number) => a * (1 - w) + b * w;
  const blended: InstinctDef = {
    ...main,
    selfImage: mix(main.selfImage, secondary.selfImage),
    engageAt: mix(main.engageAt, secondary.engageAt),
    engageDemonAt: mix(main.engageDemonAt, secondary.engageDemonAt),
    lootLust: mix(main.lootLust, secondary.lootLust),
    fleeAt: mix(main.fleeAt, secondary.fleeAt),
    maxHuntMonths: Math.round(mix(main.maxHuntMonths, secondary.maxHuntMonths)),
    returnAtHp: mix(main.returnAtHp, secondary.returnAtHp),
    fillsBag: main.fillsBag || secondary.fillsBag,
    armoryLag: Math.round(mix(main.armoryLag, secondary.armoryLag)),
    values: {
      stones: mix(main.values.stones, secondary.values.stones),
      contribution: mix(main.values.contribution, secondary.values.contribution),
      karma: mix(main.values.karma, secondary.values.karma),
      power: mix(main.values.power, secondary.values.power),
    },
    fightTaste: mix(main.fightTaste, secondary.fightTaste),
    riskAversion: mix(main.riskAversion, secondary.riskAversion),
    declineChance: mix(main.declineChance, secondary.declineChance),
    bossFromStage: Math.round(mix(main.bossFromStage, secondary.bossFromStage)),
    craftNerve: mix(main.craftNerve, secondary.craftNerve),
    talismans: [...new Set([...main.talismans, ...secondary.talismans])],
    investor: main.investor || secondary.investor,
    traits: {
      curiosity: Math.max(main.traits.curiosity, secondary.traits.curiosity * w),
      vengeance: Math.max(main.traits.vengeance, secondary.traits.vengeance * w),
      sloth: Math.max(main.traits.sloth, secondary.traits.sloth * w),
      ambition: Math.max(main.traits.ambition, secondary.traits.ambition * w),
    },
  };
  cache.set(key, blended);
  return blended;
}
