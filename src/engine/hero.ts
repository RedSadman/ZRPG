import { HERO_NAMES } from '../data/heroNames.ts';
import { PATHS, PATH_KEYS } from '../data/paths.ts';
import { ROOTS } from '../data/roots.ts';
import { nextInt, pick, pickWeighted, type Rng } from './rng.ts';
import type { Hero, Life, StatKey, Stats } from './types.ts';

export const STAT_KEYS: StatKey[] = ['body', 'qi', 'agi', 'mind', 'luck'];

/** Injured cultivators fight and cultivate at this fraction of their stats. */
const INJURY_FACTOR = 0.8;

export function generateHero(rng: Rng): Hero {
  const name = pick(rng, HERO_NAMES);
  const root = pickWeighted(rng, ROOTS).key;
  const path = pick(rng, PATH_KEYS);
  const stats = {} as Stats;
  for (const key of STAT_KEYS) stats[key] = 5 + nextInt(rng, 0, 2) + (PATHS[path].start[key] ?? 0);
  return { nameKey: name.key, gender: name.gender, root, path, stats };
}

/** Life stats plus equipment, reduced while injured. */
export function effectiveStats(life: Life): Stats {
  const out = { ...life.stats };
  for (const item of Object.values(life.equipment)) {
    for (const key of STAT_KEYS) out[key] += item.bonus[key] ?? 0;
  }
  if (life.injuryMonths > 0) for (const key of STAT_KEYS) out[key] *= INJURY_FACTOR;
  return out;
}

export function maxHp(life: Life): number {
  return Math.round(40 + effectiveStats(life).body * 6 + life.level * 10);
}

export function weaponDamage(life: Life): number {
  return life.equipment.weapon?.weapon ?? 1;
}

export function totalArmor(life: Life): number {
  return Object.values(life.equipment).reduce((sum, item) => sum + item.armor, 0);
}

export function bagCapacity(life: Life): number {
  return 12 + Math.floor(life.stats.body / 2);
}

export function bagCount(life: Life): number {
  return life.bag.trophies + life.bag.items.length;
}

/** Spends `points` stat points the way the hero's path prefers. */
export function growStats(hero: Hero, life: Life, points: number, rng: Rng): void {
  const growth = PATHS[hero.path].growth;
  const weights = STAT_KEYS.map((key) => ({ key, weight: growth[key] }));
  for (let i = 0; i < points; i++) life.stats[pickWeighted(rng, weights).key] += 1;
}
