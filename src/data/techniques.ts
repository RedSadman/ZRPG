export interface CombatTechniqueDef {
  /** Damage multiplier applied to `stat`. */
  k: number;
  /** Qi spent per use. */
  cost: number;
  stat: 'qi' | 'body';
  /** Sect contribution needed to learn it in the library; 0 = a path's starting technique. */
  contribution: number;
}

export const COMBAT_TECHNIQUES: Record<string, CombatTechniqueDef> = {
  threeCloudsSword: { k: 0.6, cost: 6, stat: 'qi', contribution: 0 },
  ironFistPalm: { k: 0.5, cost: 4, stat: 'body', contribution: 0 },
  poisonMistNeedle: { k: 0.85, cost: 5, stat: 'qi', contribution: 0 },
  bloodMoonClaw: { k: 0.8, cost: 8, stat: 'qi', contribution: 0 },
  shadowCraneStep: { k: 0.7, cost: 7, stat: 'qi', contribution: 60 },
  mountainSplitPalm: { k: 1.0, cost: 12, stat: 'body', contribution: 150 },
  thousandSwordRain: { k: 1.4, cost: 18, stat: 'qi', contribution: 400 },
  starfallPalm: { k: 2.0, cost: 26, stat: 'body', contribution: 1200 },
  voidSeveringBlade: { k: 2.8, cost: 36, stat: 'qi', contribution: 3000 },
};

/** Combat techniques the sect library teaches, cheapest first. */
export const LIBRARY = ['shadowCraneStep', 'mountainSplitPalm', 'thousandSwordRain', 'starfallPalm', 'voidSeveringBlade'];

export const MAX_COMBAT_TECHNIQUES = 3;

export interface CultivationTechniqueDef {
  key: string;
  qiMult: number;
  contribution: number;
}

/** Ordered from the starting sutra upwards; the library sells the next one. */
export const CULTIVATION_TECHNIQUES: CultivationTechniqueDef[] = [
  { key: 'azureCloudSutra', qiMult: 1, contribution: 0 },
  { key: 'nineTurnsBreath', qiMult: 1.15, contribution: 120 },
  { key: 'heavenEarthMethod', qiMult: 1.35, contribution: 450 },
  { key: 'nineHeavensScripture', qiMult: 1.6, contribution: 1500 },
];
