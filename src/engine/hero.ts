import { HERO_NAMES } from '../data/heroNames.ts';
import { KARMA_PER_LUCK, MAX_KARMA_LUCK } from '../data/quests.ts';
import { PATHS, PATH_KEYS, type PathKey } from '../data/paths.ts';
import { ROOTS, rootDef, type RootKey } from '../data/roots.ts';
import { TALENT_EFFECTS } from '../data/talents.ts';
import { CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { baseQiPerMonth } from './levels.ts';
import { nextInt, pick, pickWeighted, type Rng } from './rng.ts';
import type { Hero, Life, StatKey, Stats, Talent } from './types.ts';

export const STAT_KEYS: StatKey[] = ['body', 'qi', 'agi', 'mind', 'luck'];

/** Injured cultivators fight and cultivate at this fraction of their stats. */
const INJURY_FACTOR = 0.8;

export function generateHero(rng: Rng): Hero {
  const name = pick(rng, HERO_NAMES);
  const root = pickWeighted(rng, ROOTS).key;
  const path = pick(rng, PATH_KEYS);
  const stats = {} as Stats;
  for (const key of STAT_KEYS) stats[key] = 5 + nextInt(rng, 0, 2) + (PATHS[path].start[key] ?? 0);
  return {
    nameKey: name.key,
    gender: name.gender,
    root,
    path,
    stats,
    level: 0,
    qi: 0,
    techniques: [{ key: PATHS[path].technique, uses: 0 }],
    cultivation: CULTIVATION_TECHNIQUES[0]!.key,
    equipment: {},
    talents: [],
    injuryBeats: 0,
    knowledge: [],
    fate: 0,
    crafts: { alchemy: 0, forging: 0, talismans: 0 },
  };
}

export function hasTalent(talents: Talent[], key: string, enemy?: string): boolean {
  return talents.some((t) => t.key === key && (enemy === undefined || t.enemy === enemy));
}

/** Life stats plus equipment and talents, reduced while injured. */
export function effectiveStats(life: Life): Stats {
  const out = { ...life.stats };
  for (const item of Object.values(life.equipment)) {
    for (const key of STAT_KEYS) out[key] += item.bonus[key] ?? 0;
  }
  if (hasTalent(life.talents, 'luckyStar')) out.luck += TALENT_EFFECTS.luckyStarLuck;
  out.luck += life.luckBonus + karmaLuck(life.karma);
  if (life.injuryMonths > 0) for (const key of STAT_KEYS) out[key] *= INJURY_FACTOR;
  return out;
}

/** Heaven keeps count: good deeds bring luck, bad ones take it away. */
export function karmaLuck(karma: number): number {
  return Math.max(-MAX_KARMA_LUCK, Math.min(MAX_KARMA_LUCK, Math.trunc(karma / KARMA_PER_LUCK)));
}

export function maxHp(life: Life): number {
  const talent = hasTalent(life.talents, 'ironSkin') ? TALENT_EFFECTS.ironSkinHp : 1;
  return Math.round((40 + effectiveStats(life).body * 6 + life.level * 10) * talent);
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

/** Spends `points` stat points the way the path prefers. */
export function growStats(path: PathKey, stats: Stats, points: number, rng: Rng): void {
  const growth = PATHS[path].growth;
  const weights = STAT_KEYS.map((key) => ({ key, weight: growth[key] }));
  for (let i = 0; i < points; i++) stats[pickWeighted(rng, weights).key] += 1;
}

/** Qi gathered in a month of meditation towards the next level. */
export function cultivationRate(root: RootKey, path: PathKey, level: number, cultivation: string, talents: Talent[]): number {
  const method = CULTIVATION_TECHNIQUES.find((t) => t.key === cultivation)!;
  const sponge = hasTalent(talents, 'qiSponge') ? TALENT_EFFECTS.qiSpongeRate : 1;
  return baseQiPerMonth(level + 1) * rootDef(root).qiMult * method.qiMult * PATHS[path].qiMult * sponge;
}
