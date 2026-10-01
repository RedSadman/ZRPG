import type { PathKey } from '../data/paths.ts';
import type { RootKey } from '../data/roots.ts';
import type { DreamSummary, EventKind, GameEvent, Item, Slot, StatKey } from '../engine/types.ts';

export type Locale = 'uk' | 'en';
export const LOCALES: Locale[] = ['uk', 'en'];

/** Plural forms keyed by Intl.PluralRules categories; English uses only `one` and `other`. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/**
 * A noun in the shape its language needs. Ukrainian fills the cases and gender;
 * English fills `article` ("a", "an", or "" for proper names).
 */
export interface Noun {
  nom: string;
  gen?: string;
  acc?: string;
  ins?: string;
  gender?: 'm' | 'f' | 'n' | 'pl';
  article?: string;
}

export interface NarrationContext {
  m: Messages;
  heroName: string;
  /** Picks the word form for the hero's gender (Ukrainian past tense: "знайшов" / "знайшла"). */
  g: (male: string, female: string) => string;
  /** The hero's age in whole years, pluralised: "16 років". */
  age: (ageMonths: number) => string;
  plural: (n: number, forms: PluralForms) => string;
  /** An enemy noun; rivals carry a surname ("задерикуватий учень Лю"). */
  enemy: (key: string, surname?: string) => Noun;
  /** Picks the form for an enemy's gender. */
  eg: (key: string, male: string, female: string) => string;
  item: (item: Item, form: 'nom' | 'acc') => string;
  /** "Конденсація Ці, 3-й етап" / "Qi Condensation, stage 3". */
  level: (level: number) => string;
  /** Picks one of several phrasings, stable for a given journal line. */
  vary: (...options: string[]) => string;
}

type EventTemplates = {
  [K in EventKind]: (event: Extract<GameEvent, { kind: K }>, ctx: NarrationContext) => string;
};

export interface Messages {
  gameTitle: string;
  gameSubtitle: string;
  heroNames: Record<string, string>;
  realms: Record<string, { nom: string; gen: string }>;
  /** "3-й етап" / "stage 3". */
  stage: (stage: number) => string;
  /** "3-го етапу" — after "досяг". */
  stageGen: (stage: number) => string;
  roots: Record<RootKey, string>;
  paths: Record<PathKey, string>;
  zones: Record<string, { nom: string; in: string }>;
  enemies: Record<string, Noun>;
  surnames: Record<string, string>;
  /** Attaches a surname to an enemy noun in every form the language uses. */
  namedEnemy: (noun: Noun, surname: string) => Noun;
  itemBases: Record<string, Noun>;
  affixes: Record<string, string>;
  /** Rank names for the UI: Смертний, Духовний, Земний, Небесний. */
  ranks: string[];
  /** "духовного рангу" / "Spirit-rank". */
  rankOf: string[];
  techniques: Record<string, string>;
  stats: Record<StatKey, string>;
  slots: Record<Slot, string>;
  /** Builds an item's display name in the requested form. */
  itemName: (item: Item, form: 'nom' | 'acc', m: Messages) => string;
  ui: {
    dream: (n: number) => string;
    realm: string;
    qi: string;
    hp: string;
    spiritStones: string;
    contribution: string;
    pills: string;
    root: string;
    path: string;
    stats: string;
    equipment: string;
    techniques: string;
    cultivation: string;
    activity: Record<string, string>;
    awake: string;
    journal: string;
    chronicle: string;
    lastDream: string;
    noDreamsYet: string;
    speed: string;
    pause: string;
    language: string;
    newGame: string;
    newGameConfirm: string;
  };
  ageYears: PluralForms;
  events: EventTemplates;
  /** One line about a finished dream for the Chronicle. */
  summary: (s: DreamSummary, ctx: NarrationContext) => string;
}
