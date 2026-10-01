// Things remembered from past dreams. Once known, they exist in every later dream.

export const KNOWLEDGE = ['oldZhangCave', 'hiddenSpring', 'thousandPillValley', 'ironFistClan'] as const;
export type KnowledgeKey = (typeof KNOWLEDGE)[number];

/** Meditating at the hidden spring (once known) speeds up Foundation-level cultivation. */
export const HIDDEN_SPRING_QI = 1.25;
export const HIDDEN_SPRING_MIN_LEVEL = 10;

export interface StartPlace {
  key: string;
  /** Fate points to begin a dream here. */
  cost: number;
  /** Knowledge needed before this place can be chosen; none for the home sect. */
  knowledge?: KnowledgeKey;
  pillPriceMult: number;
  startPills: number;
  herbBonus: number;
  armoryPriceMult: number;
  /** Starts with Spirit-rank bracers of the hero's level. */
  rankedBracers: boolean;
}

export const START_PLACES: StartPlace[] = [
  {
    key: 'azureCloudSect',
    cost: 0,
    pillPriceMult: 1,
    startPills: 1,
    herbBonus: 0,
    armoryPriceMult: 1,
    rankedBracers: false,
  },
  {
    key: 'thousandPillValley',
    cost: 1,
    knowledge: 'thousandPillValley',
    pillPriceMult: 0.5,
    startPills: 3,
    herbBonus: 0.1,
    armoryPriceMult: 1,
    rankedBracers: false,
  },
  {
    key: 'ironFistClan',
    cost: 2,
    knowledge: 'ironFistClan',
    pillPriceMult: 1,
    startPills: 1,
    herbBonus: 0,
    armoryPriceMult: 0.6,
    rankedBracers: true,
  },
];

export function startPlace(key: string): StartPlace {
  return START_PLACES.find((p) => p.key === key) ?? START_PLACES[0]!;
}

/** Fate points for the Blessing of Fate (+5 Luck for one dream). */
export const BLESSING_COST = 2;
export const BLESSING_LUCK = 5;
