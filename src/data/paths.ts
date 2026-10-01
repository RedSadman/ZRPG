import type { Stats } from '../engine/types.ts';

export type PathKey = 'sword' | 'body' | 'alchemy' | 'demonic';

export interface PathDef {
  /** Relative weights for where stage-up stat points go. */
  growth: Stats;
  start: Partial<Stats>;
  technique: string;
  /** Item base keys for the starting weapon and preferred drops. */
  weapons: string[];
  qiMult: number;
  pillPriceMult: number;
  herbChance: number;
  /** Chance that a failed realm breakthrough kills outright (qi deviation). */
  deviation: number;
}

export const PATHS: Record<PathKey, PathDef> = {
  sword: {
    growth: { body: 2, qi: 3, agi: 4, mind: 1, luck: 1 },
    start: { agi: 3, qi: 2 },
    technique: 'threeCloudsSword',
    weapons: ['sword', 'sabre'],
    qiMult: 1,
    pillPriceMult: 1,
    herbChance: 0.15,
    deviation: 0.05,
  },
  body: {
    growth: { body: 3, qi: 2, agi: 3, mind: 1, luck: 1 },
    start: { body: 3, agi: 2 },
    technique: 'ironFistPalm',
    weapons: ['gauntlets', 'spear'],
    qiMult: 1,
    pillPriceMult: 1,
    herbChance: 0.15,
    deviation: 0.05,
  },
  alchemy: {
    growth: { body: 2, qi: 4, agi: 1, mind: 3, luck: 2 },
    start: { mind: 3, qi: 1, luck: 1 },
    technique: 'poisonMistNeedle',
    weapons: ['fan', 'sword'],
    qiMult: 1,
    pillPriceMult: 0.7,
    herbChance: 0.3,
    deviation: 0.03,
  },
  demonic: {
    growth: { body: 2, qi: 5, agi: 2, mind: 0, luck: 1 },
    start: { qi: 4, body: 1 },
    technique: 'bloodMoonClaw',
    weapons: ['sabre', 'gauntlets'],
    qiMult: 1.4,
    pillPriceMult: 1,
    herbChance: 0.15,
    deviation: 0.3,
  },
};

export const PATH_KEYS = Object.keys(PATHS) as PathKey[];
