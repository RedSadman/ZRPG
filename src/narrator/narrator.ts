import type { GameEvent, GameState } from '../engine/types';
import { messages, plural, type Locale } from '../i18n';
import type { NarrationContext } from '../i18n/types';

/** Turns a journal event into a line of text in the chosen language. */
export function narrate(event: GameEvent, state: GameState, locale: Locale): string {
  const m = messages(locale);
  const ctx: NarrationContext = {
    heroName: m.heroNames[state.hero.nameKey] ?? state.hero.nameKey,
    age: (ageMonths) => plural(locale, Math.floor(ageMonths / 12), m.ageYears),
    plural: (n, forms) => plural(locale, n, forms),
  };
  // TypeScript cannot correlate the event's kind with its template across a union, hence the cast.
  const template = m.events[event.kind] as (e: GameEvent, c: NarrationContext) => string;
  return template(event, ctx);
}
