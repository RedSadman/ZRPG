import { REALMS } from '../data/realms.ts';
import { realmOf, stageOf } from '../engine/levels.ts';
import type { DreamSummary, GameEvent, GameState, JournalEntry } from '../engine/types.ts';
import { messages, plural, type Locale, type Messages } from '../i18n/index.ts';
import type { NarrationContext } from '../i18n/types.ts';

/** "Конденсація Ці, 3-й етап" / "Qi Condensation, stage 3"; mortals have no stage. */
export function levelLabel(m: Messages, level: number): string {
  const realm = m.realms[REALMS[realmOf(level)]!.key]!.nom;
  return level === 0 ? realm : `${realm}, ${m.stage(stageOf(level))}`;
}

/** `seed` picks between alternative phrasings; the journal entry id keeps a line stable across re-renders. */
export function narrationContext(state: GameState, locale: Locale, seed = 0): NarrationContext {
  const m = messages(locale);
  return {
    m,
    heroName: m.heroNames[state.hero.nameKey] ?? state.hero.nameKey,
    g: (male, female) => (state.hero.gender === 'f' ? female : male),
    age: (ageMonths) => plural(locale, Math.floor(ageMonths / 12), m.ageYears),
    plural: (n, forms) => plural(locale, Math.round(n), forms),
    enemy: (key, surname) => {
      const noun = m.enemies[key] ?? { nom: key };
      return surname ? m.namedEnemy(noun, m.surnames[surname] ?? surname) : noun;
    },
    eg: (key, male, female) => (m.enemies[key]?.gender === 'f' ? female : male),
    item: (item, form) => m.itemName(item, form, m),
    level: (level) => levelLabel(m, level),
    vary: (...options) => options[seed % options.length]!,
  };
}

/** Turns a journal event into a line of text in the chosen language. */
export function narrate(event: GameEvent, state: GameState, locale: Locale, seed = 0): string {
  const ctx = narrationContext(state, locale, seed);
  // TypeScript cannot correlate the event's kind with its template across a union, hence the cast.
  const template = ctx.m.events[event.kind] as (e: GameEvent, c: NarrationContext) => string;
  return template(event, ctx);
}

export function narrateEntry(entry: JournalEntry, state: GameState, locale: Locale): string {
  return narrate(entry.event, state, locale, entry.id);
}

export function narrateSummary(summary: DreamSummary, state: GameState, locale: Locale): string {
  return messages(locale).summary(summary, narrationContext(state, locale, summary.n));
}
