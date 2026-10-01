import type { EventKind, GameEvent } from '../engine/types';

export type Locale = 'uk' | 'en';
export const LOCALES: Locale[] = ['uk', 'en'];

/** Plural forms keyed by Intl.PluralRules categories; English uses only `one` and `other`. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export interface NarrationContext {
  heroName: string;
  /** "16 років" / "16" — the hero's age in whole years, already pluralised. */
  age: (ageMonths: number) => string;
  plural: (n: number, forms: PluralForms) => string;
}

type EventTemplates = {
  [K in EventKind]: (event: Extract<GameEvent, { kind: K }>, ctx: NarrationContext) => string;
};

export interface Messages {
  gameTitle: string;
  gameSubtitle: string;
  heroNames: Record<string, string>;
  ui: {
    dream: (n: number) => string;
    age: string;
    spiritStones: string;
    awake: string;
    journal: string;
    speed: string;
    pause: string;
    language: string;
    newGame: string;
    newGameConfirm: string;
  };
  ageYears: PluralForms;
  events: EventTemplates;
}
