// The sect's task board. Each visit it offers a few tasks; the dreamer's instinct picks one.

export type QuestKind =
  | 'hunt'
  | 'herbs'
  | 'delivery'
  | 'mining'
  | 'sectDuty'
  | 'eliteBeast'
  | 'escort'
  | 'defendVillage'
  | 'demonHunt';

/** Who the task's fights are against. */
export type QuestFoes = 'target' | 'beasts' | 'bandits' | 'demons';

export interface QuestDef {
  kind: QuestKind;
  weight: number;
  minLevel: number;
  fights: [number, number];
  /** Foe levels relative to the hero. */
  levelOffset: [number, number];
  foes: QuestFoes;
  months: [number, number];
  /** Multiples of the base pay for the hero's level. */
  stones: number;
  contribution: number;
  karma: number;
  /** Chance of a ranked item on success. */
  itemChance: number;
  /** Foes in this task are tougher than usual (an elite beast). */
  elite?: boolean;
  /**
   * Work that needs no fighting. The road can still bring trouble, but a hero not looking for it runs into it less.
   */
  peaceful?: boolean;
  /** Done inside the sect: no road at all. */
  inSect?: boolean;
  /** Brings back spirit ore to sell (and, one day, to forge). */
  ore?: boolean;
}

export const QUESTS: QuestDef[] = [
  { kind: 'hunt', weight: 30, minLevel: 0, fights: [3, 5], levelOffset: [-1, 1], foes: 'target', months: [4, 7], stones: 1, contribution: 1, karma: 0, itemChance: 0.05 },
  // Peaceful work: modest pay from the sect, no great prizes, little risk.
  { kind: 'herbs', weight: 18, minLevel: 0, fights: [0, 0], levelOffset: [0, 0], foes: 'beasts', months: [3, 5], stones: 0.7, contribution: 0.6, karma: 0, itemChance: 0, peaceful: true },
  { kind: 'delivery', weight: 12, minLevel: 0, fights: [0, 0], levelOffset: [0, 0], foes: 'beasts', months: [2, 4], stones: 0.8, contribution: 0.8, karma: 0, itemChance: 0, peaceful: true },
  { kind: 'mining', weight: 10, minLevel: 1, fights: [0, 0], levelOffset: [0, 0], foes: 'beasts', months: [4, 6], stones: 0.5, contribution: 0.4, karma: 0, itemChance: 0, peaceful: true, ore: true },
  { kind: 'sectDuty', weight: 12, minLevel: 0, fights: [0, 0], levelOffset: [0, 0], foes: 'beasts', months: [3, 6], stones: 0.3, contribution: 1, karma: 0.5, itemChance: 0, peaceful: true, inSect: true },
  { kind: 'eliteBeast', weight: 15, minLevel: 1, fights: [1, 1], levelOffset: [3, 5], foes: 'beasts', months: [3, 5], stones: 2.5, contribution: 2, karma: 0, itemChance: 0.6, elite: true },
  { kind: 'escort', weight: 15, minLevel: 1, fights: [1, 3], levelOffset: [0, 2], foes: 'bandits', months: [4, 6], stones: 3, contribution: 0.5, karma: 0.5, itemChance: 0.1 },
  { kind: 'defendVillage', weight: 15, minLevel: 0, fights: [2, 4], levelOffset: [-1, 1], foes: 'beasts', months: [3, 5], stones: 0.5, contribution: 2, karma: 3, itemChance: 0.05 },
  { kind: 'demonHunt', weight: 12, minLevel: 1, fights: [1, 2], levelOffset: [1, 3], foes: 'demons', months: [4, 6], stones: 1.5, contribution: 2.5, karma: 4, itemChance: 0.3 },
];

/** Tasks on the board at once. */
export const BOARD_SIZE = 4;

export function baseStones(level: number): number {
  return 10 + 4 * level;
}

export function baseContribution(level: number): number {
  return 10 + 2 * level;
}

/** Karma moves Luck by one point per this much, up to ±MAX_KARMA_LUCK. */
export const KARMA_PER_LUCK = 3;
export const MAX_KARMA_LUCK = 5;
/** Each point of reputation raises the sect's pay by this share, up to double. */
export const REPUTATION_PAY = 0.05;

/**
 * Tasks that match a temperament's ideal, for the journal's "why": a righteous hero hunting boars did not do it to
 * help anyone. Instincts not listed always choose in character (the safest, the best paid).
 */
export const QUEST_IDEALS: Partial<Record<'bold' | 'righteous', QuestKind[]>> = {
  bold: ['eliteBeast', 'demonHunt', 'escort'],
  righteous: ['defendVillage', 'demonHunt', 'escort', 'sectDuty'],
};
