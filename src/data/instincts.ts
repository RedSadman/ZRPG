// How the dreamer behaves when nobody is choosing for them: in fights, on the road and at forks.
// Every instinct trades something: the cautious live long and grow slowly, the bold grow fast and die young.

export type Instinct = 'cautious' | 'bold' | 'greedy' | 'righteous';

export interface InstinctDef {
  /** Below this share of HP the hero drinks a pill or tries to run. */
  fleeAt: number;
  fleeBonus: number;
  /** Added to the chance of sensing a much stronger foe and slipping away before the fight. */
  sense: number;
  damage: number;
  maxHuntMonths: number;
  /** Head back to the sect when HP falls below this share and no pills are left. */
  returnAtHp: number;
  bagBonus: number;
  stonesMult: number;
  contributionMult: number;
  /** How far behind (in levels) gear may fall before visiting the armory. */
  armoryLag: number;
  /** Share of a meditation month's qi gathered during a month of hunting: danger forges the bold. */
  huntQiShare: number;
}

export const INSTINCTS: Record<Instinct, InstinctDef> = {
  cautious: {
    fleeAt: 0.45,
    fleeBonus: 0.1,
    sense: 0.2,
    damage: 1,
    maxHuntMonths: 6,
    returnAtHp: 0.45,
    bagBonus: 0,
    stonesMult: 1,
    contributionMult: 1,
    armoryLag: 0,
    huntQiShare: 0.08,
  },
  bold: {
    fleeAt: 0.25,
    fleeBonus: 0,
    sense: -0.1,
    damage: 1.25,
    maxHuntMonths: 14,
    returnAtHp: 0.25,
    bagBonus: 0,
    stonesMult: 1,
    contributionMult: 1,
    armoryLag: 1,
    huntQiShare: 0.5,
  },
  greedy: {
    fleeAt: 0.35,
    fleeBonus: 0,
    sense: 0,
    damage: 1,
    maxHuntMonths: 12,
    returnAtHp: 0.3,
    bagBonus: 6,
    stonesMult: 1.3,
    contributionMult: 1,
    armoryLag: 3,
    huntQiShare: 0.25,
  },
  righteous: {
    fleeAt: 0.35,
    fleeBonus: 0,
    sense: 0.05,
    damage: 1,
    maxHuntMonths: 12,
    returnAtHp: 0.3,
    bagBonus: 0,
    stonesMult: 1,
    contributionMult: 1.3,
    armoryLag: 1,
    huntQiShare: 0.25,
  },
};

export const INSTINCT_KEYS = Object.keys(INSTINCTS) as Instinct[];
