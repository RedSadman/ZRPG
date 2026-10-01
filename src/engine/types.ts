// Everything here must stay plain JSON: the save file is this state, and a future server will replay it.

import type { PathKey } from '../data/paths.ts';
import type { RootKey } from '../data/roots.ts';

export type StatKey = 'body' | 'qi' | 'agi' | 'mind' | 'luck';
export type Stats = Record<StatKey, number>;
export type Slot = 'weapon' | 'robe' | 'bracers' | 'boots' | 'pendant' | 'ring';
export type Gender = 'm' | 'f';

export interface Item {
  slot: Slot;
  /** Base kind, e.g. "sabre"; also its i18n key. */
  base: string;
  /** Affix keys; the first one names the item. */
  affixes: string[];
  /** 0 Mortal, 1 Spirit, 2 Earth, 3 Heaven. */
  rank: number;
  level: number;
  weapon: number;
  armor: number;
  bonus: Partial<Stats>;
}

export interface LearnedTechnique {
  key: string;
  uses: number;
}

/** The real hero, who sleeps on the Jade Pillow. Every dream starts from here. */
export interface Hero {
  nameKey: string;
  gender: Gender;
  root: RootKey;
  path: PathKey;
  stats: Stats;
}

/** `retired`: hit the current cultivation ceiling and lives out the dream as a sect elder. */
export type Activity = 'sect' | 'travel' | 'hunt' | 'returning' | 'meditate' | 'retired';

export interface Quest {
  enemy: string;
  needed: number;
  killed: number;
}

export type DeathCause = 'killed' | 'oldAge' | 'deviation';

export interface Death {
  cause: DeathCause;
  enemy?: string;
  enemyLevel?: number;
  /** Surname of a rival cultivator (key into i18n surnames). */
  enemyName?: string;
}

/** One dreamed life. */
export interface Life {
  n: number;
  ageMonths: number;
  level: number;
  qi: number;
  /** Stats grown during this life (items and injuries are applied on top). */
  stats: Stats;
  hp: number;
  equipment: Partial<Record<Slot, Item>>;
  bag: { trophyValue: number; trophies: number; items: Item[] };
  stones: number;
  contribution: number;
  pills: { healing: number; breakthrough: string | null };
  techniques: LearnedTechnique[];
  cultivation: string;
  activity: Activity;
  monthsInActivity: number;
  /** What to do after the next sect visit. */
  plan: 'hunt' | 'meditate';
  quest: Quest | null;
  injuryMonths: number;
  bossesKilled: string[];
  wallHit: boolean;
  /** Counters for the current hunting trip, flushed into one journal line on the way back. */
  trip: { months: number; kills: number; herbs: number; bossTried: boolean; rivalNoted: boolean };
  totals: { fights: number; wins: number; flees: number; kills: number };
  highlights: Array<{ priority: number; event: GameEvent }>;
  death: Death | null;
}

export type FightNote = 'boss' | 'rival' | 'closeCall' | 'stronger' | 'fled' | 'rescued';

export type GameEvent =
  | { kind: 'dreamStart'; dream: number }
  | { kind: 'joinSect'; ageMonths: number; root: RootKey; path: PathKey }
  | { kind: 'fight'; ageMonths: number; enemy: string; enemyLevel: number; note: FightNote; name?: string }
  | { kind: 'loot'; ageMonths: number; item: Item }
  | { kind: 'hunt'; ageMonths: number; zone: string; months: number; kills: number; herbs: number }
  | { kind: 'sect'; ageMonths: number; sold: number; contribution: number }
  | { kind: 'technique'; ageMonths: number; technique: string }
  | { kind: 'stageUp'; ageMonths: number; level: number; months: number }
  | { kind: 'realmUp'; ageMonths: number; level: number; pill: boolean }
  | { kind: 'breakthroughFail'; ageMonths: number; level: number }
  | { kind: 'wall'; ageMonths: number; level: number }
  | { kind: 'death'; ageMonths: number; death: Death }
  | { kind: 'wake'; dream: number; score: number }
  | { kind: 'away'; months: number; dreamsEnded: number };

export type EventKind = GameEvent['kind'];

export interface JournalEntry {
  id: number;
  tick: number;
  event: GameEvent;
}

/** What is left of a dream after waking: the Chronicle of Lives. */
export interface DreamSummary {
  n: number;
  ageMonths: number;
  level: number;
  death: Death;
  score: number;
  kills: number;
  highlights: GameEvent[];
}

export interface GameState {
  /** One tick = one dreamed month. */
  tick: number;
  rngState: number;
  hero: Hero;
  life: Life;
  /** Set once the current life has been summarised; the next tick starts a new dream. */
  awake: boolean;
  journal: JournalEntry[];
  nextEntryId: number;
  chronicle: DreamSummary[];
}
