import type { Instinct } from './instincts.ts';
import type { KnowledgeKey } from './knowledge.ts';

// Forks in the road: a dream pauses, offers a choice, and the instinct answers if the player does not.
// Outcomes live in engine/forks.ts.

export interface ForkOption {
  key: string;
  /** Instincts that pick this option on their own. */
  instincts: Instinct[];
}

export interface ForkDef {
  key: string;
  weight: number;
  minLevel: number;
  maxLevel: number;
  /** Only in this zone, if set. */
  zone?: string;
  /** Not offered once the hero already knows this. */
  unlessKnown?: KnowledgeKey;
  options: ForkOption[];
}

export const FORKS: ForkDef[] = [
  {
    key: 'oldManManual',
    weight: 10,
    minLevel: 1,
    maxLevel: 99,
    options: [
      { key: 'buy', instincts: ['bold', 'curious', 'ambitious'] },
      { key: 'refuse', instincts: ['cautious', 'lazy', 'vengeful'] },
      { key: 'rob', instincts: ['greedy'] },
      { key: 'bow', instincts: ['righteous'] },
    ],
  },
  {
    key: 'injuredStranger',
    weight: 10,
    minLevel: 0,
    maxLevel: 99,
    options: [
      { key: 'help', instincts: ['righteous', 'bold', 'curious', 'ambitious'] },
      { key: 'rob', instincts: ['greedy'] },
      { key: 'pass', instincts: ['cautious', 'lazy', 'vengeful'] },
    ],
  },
  {
    key: 'duelChallenge',
    weight: 8,
    minLevel: 1,
    maxLevel: 99,
    options: [
      { key: 'accept', instincts: ['bold', 'righteous', 'vengeful', 'ambitious', 'curious'] },
      { key: 'refuse', instincts: ['cautious', 'greedy', 'lazy'] },
      { key: 'bribe', instincts: [] },
    ],
  },
  {
    key: 'secretRealm',
    weight: 6,
    minLevel: 10,
    maxLevel: 99,
    options: [
      { key: 'enter', instincts: ['bold', 'curious', 'ambitious'] },
      { key: 'lurk', instincts: ['greedy', 'vengeful'] },
      { key: 'skip', instincts: ['cautious', 'righteous', 'lazy'] },
    ],
  },
  {
    key: 'hiddenCave',
    weight: 7,
    minLevel: 1,
    maxLevel: 9,
    zone: 'azureFoothills',
    unlessKnown: 'oldZhangCave',
    options: [
      { key: 'enter', instincts: ['bold', 'greedy', 'curious', 'ambitious'] },
      { key: 'remember', instincts: ['cautious', 'righteous', 'lazy', 'vengeful'] },
    ],
  },
  {
    key: 'qiSpring',
    weight: 7,
    minLevel: 10,
    maxLevel: 99,
    zone: 'thousandBeastForest',
    unlessKnown: 'hiddenSpring',
    options: [
      { key: 'meditate', instincts: ['bold', 'greedy', 'righteous', 'lazy', 'ambitious', 'vengeful'] },
      { key: 'mark', instincts: ['cautious', 'curious'] },
    ],
  },
];

/** Chance per month on the road or hunting that a fork appears. */
export const FORK_CHANCE = 0.008;
/** Beats (~3 s each) a fork waits for the player before the instinct answers. */
export const FORK_WAIT_BEATS = 20;
