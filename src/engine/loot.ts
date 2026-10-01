import { AFFIXES, ARMOR_BASES, BASES, RANKS, SLOTS, SLOT_STATS } from '../data/items.ts';
import { PATHS, type PathKey } from '../data/paths.ts';
import { chance, pick, pickWeighted, type Rng } from './rng.ts';
import type { Item, Life, Slot } from './types.ts';
import { STAT_KEYS, bagCapacity, bagCount } from './hero.ts';

/** Luck nudges weight from Mortal rank towards the higher ones. */
export function rollRank(rng: Rng, luck: number, minRank = 0): number {
  const shift = luck - 5;
  const weights = [70 - shift, 22 + shift * 0.6, 7 + shift * 0.3, 1 + shift * 0.1].map((w, rank) => ({
    rank,
    weight: rank < minRank ? 0 : Math.max(0, w),
  }));
  return pickWeighted(rng, weights).rank;
}

export function makeItem(rng: Rng, level: number, rank: number, path: PathKey, slot?: Slot): Item {
  const s = slot ?? pick(rng, SLOTS);
  const base = s === 'weapon' ? (chance(rng, 0.7) ? pick(rng, PATHS[path].weapons) : pick(rng, weaponBases())) : ARMOR_BASES[s];
  const mult = RANKS[rank]!.mult;
  const spec = SLOT_STATS[s];
  const item: Item = {
    slot: s,
    base,
    affixes: [],
    rank,
    level,
    weapon: spec.weapon ? round1((spec.weapon[0] + spec.weapon[1] * level) * mult) : 0,
    armor: spec.armor ? round1((spec.armor[0] + spec.armor[1] * level) * mult) : 0,
    bonus: {},
  };
  if (spec.bonus) item.bonus[spec.bonus] = round1((1 + 0.25 * level) * mult);

  const affixKeys = Object.keys(AFFIXES);
  for (let i = 0; i < RANKS[rank]!.affixes; i++) {
    const key = pick(rng, affixKeys.filter((k) => !item.affixes.includes(k)));
    item.affixes.push(key);
    const stat = AFFIXES[key]!;
    if (stat === 'weapon') item.weapon = round1(item.weapon + (1 + 0.5 * level) * mult);
    else if (stat === 'armor') item.armor = round1(item.armor + (1 + 0.3 * level) * mult);
    else item.bonus[stat] = round1((item.bonus[stat] ?? 0) + (1 + 0.3 * level) * mult);
  }
  return item;
}

export function starterItem(slot: Slot, base: string): Item {
  const spec = SLOT_STATS[slot];
  return {
    slot,
    base,
    affixes: [],
    rank: 0,
    level: 0,
    weapon: spec.weapon?.[0] ?? 0,
    armor: spec.armor?.[0] ?? 0,
    bonus: {},
  };
}

/** One number to compare items by, weighted by what the hero's path values. */
export function itemPower(item: Item, path: PathKey): number {
  const growth = PATHS[path].growth;
  const top = Math.max(...STAT_KEYS.map((k) => growth[k]));
  let power = item.weapon * 2 + item.armor * 1.5;
  for (const key of STAT_KEYS) power += (item.bonus[key] ?? 0) * (0.5 + growth[key] / top);
  return power;
}

export function sellValue(item: Item): number {
  return Math.max(1, Math.round(item.level + 2) * (item.rank + 1));
}

/** Wears the item if it beats the current one, otherwise bags it. Returns true when equipped. */
export function takeItem(life: Life, item: Item, path: PathKey): boolean {
  const current = life.equipment[item.slot];
  const better = !current || itemPower(item, path) > itemPower(current, path);
  const spare = better ? current : item;
  if (better) life.equipment[item.slot] = item;
  if (spare && bagCount(life) < bagCapacity(life)) life.bag.items.push(spare);
  return better;
}

function weaponBases(): string[] {
  return Object.keys(BASES).filter((k) => BASES[k] === 'weapon');
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
