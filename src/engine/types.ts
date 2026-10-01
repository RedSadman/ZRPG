// Everything here must stay plain JSON: the save file is this state, and a future server will replay it.

import type { Instinct } from '../data/instincts.ts';
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

/** A permanent trait carried from dream to dream. `enemy` is set for "memory of death" talents. */
export interface Talent {
  key: string;
  enemy?: string;
}

/** The real hero, who sleeps on the Jade Pillow. Every dream starts from here. */
export interface Hero {
  nameKey: string;
  gender: Gender;
  root: RootKey;
  path: PathKey;
  stats: Stats;
  level: number;
  qi: number;
  techniques: LearnedTechnique[];
  cultivation: string;
  /** Items brought back from dreams; each dream starts with them on. */
  equipment: Partial<Record<Slot, Item>>;
  talents: Talent[];
  /** After a failed real breakthrough the Pillow stays silent this many beats. */
  injuryBeats: number;
  /** Places and secrets remembered from past dreams; they exist in every later dream. */
  knowledge: string[];
  /** Fate points, earned by good lives and spent on the next dream's setup. */
  fate: number;
}

/** What the player decides before falling asleep; kept between dreams. */
export interface DreamSetup {
  instinct: Instinct;
  path: PathKey;
  start: string;
  blessing: boolean;
}

/** A fork in the road waiting for an answer. */
export interface PendingFork {
  key: string;
  options: string[];
  /** Beat after which the instinct answers (unless the player asked to always wait). */
  deadline: number;
  /** Spirit stones at stake, for forks that ask for money. */
  cost: number;
  enemyLevel: number;
}

/** What the hero may carry out of a finished dream. */
export type Reward =
  | { kind: 'qi'; amount: number }
  | { kind: 'technique'; key: string; uses: number }
  | { kind: 'cultivation'; key: string }
  | { kind: 'item'; item: Item }
  | { kind: 'talent'; talent: Talent }
  | { kind: 'stats'; stats: Partial<Stats> }
  | { kind: 'knowledge'; key: string };

export type RewardKind = Reward['kind'];

/** dreaming → (death) → choosing → (reward taken) → resting → (charge spent) → dreaming. */
export type Phase = 'dreaming' | 'choosing' | 'resting';

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
  talents: Talent[];
  /** Total qi progress of the real hero when this dream began; the qi reward pays out a share of what was gained since. */
  startProgress: number;
  path: PathKey;
  instinct: Instinct;
  start: string;
  /** Luck from the Blessing of Fate and from karma earned at forks. */
  luckBonus: number;
  fork: PendingFork | null;
  /** Knowledge found in this dream; offered as a reward on waking. */
  discoveries: string[];
  /** Knowledge already put to use in this dream. */
  remembered: string[];
}

export type FightNote = 'boss' | 'rival' | 'closeCall' | 'stronger' | 'fled' | 'rescued' | 'sensed';

export type GameEvent =
  | { kind: 'dreamStart'; dream: number }
  | { kind: 'joinSect'; ageMonths: number; root: RootKey; path: PathKey; start?: string; instinct?: Instinct }
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
  | { kind: 'away'; months: number; dreamsEnded: number }
  | { kind: 'reward'; dream: number; reward: Reward; auto: boolean }
  | { kind: 'realStageUp'; level: number }
  | { kind: 'realBreakthrough'; level: number; success: boolean }
  | { kind: 'fork'; ageMonths: number; fork: string; cost: number }
  | {
      kind: 'forkResult';
      ageMonths: number;
      fork: string;
      option: string;
      outcome: string;
      auto: boolean;
      amount?: number;
      item?: Item;
      technique?: string;
      knowledge?: string;
    }
  | { kind: 'remembered'; ageMonths: number; knowledge: string; technique?: string; amount?: number };

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
  /** One beat = one step of real time (about 3 seconds at ×1). Charges and real meditation count beats. */
  beat: number;
  rngState: number;
  hero: Hero;
  life: Life;
  phase: Phase;
  /** The three rewards on the table while `phase` is "choosing". */
  offer: Reward[] | null;
  /** Dreams the Pillow can give before it needs rest. */
  charges: number;
  /** Beats accumulated towards the next charge. */
  chargeBeats: number;
  autopilot: { enabled: boolean; priority: RewardKind[] };
  setup: DreamSetup;
  /** Forks wait for the player forever instead of letting the instinct answer. */
  waitForMe: boolean;
  dreamsEnded: number;
  journal: JournalEntry[];
  nextEntryId: number;
  chronicle: DreamSummary[];
}
