import type { Instinct } from '../data/instincts.ts';
import { QUEST_IDEALS, type QuestKind } from '../data/quests.ts';
import { en } from './en.ts';
import { uk } from './uk.ts';
import type { Locale, Messages, PluralForms } from './types.ts';

export type { Locale, Messages, PluralForms } from './types.ts';
export { LOCALES } from './types.ts';

const catalogs: Record<Locale, Messages> = { uk, en };

export function messages(locale: Locale): Messages {
  return catalogs[locale];
}

const pluralRules = new Map<Locale, Intl.PluralRules>();

/** Picks the plural form for `n` and substitutes `{n}`. */
export function plural(locale: Locale, n: number, forms: PluralForms): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  const form = forms[rules.select(n)] ?? forms.other;
  return form.replaceAll('{n}', String(n));
}

const LOCALE_KEY = 'zrpg.locale';

export function loadLocale(storage: Storage): Locale {
  try {
    const saved = storage.getItem(LOCALE_KEY);
    if (saved === 'uk' || saved === 'en') return saved;
  } catch {
    // Fall through to the default.
  }
  return 'uk';
}

export function saveLocale(storage: Storage, locale: Locale): void {
  try {
    storage.setItem(LOCALE_KEY, locale);
  } catch {
    // Not worth failing over.
  }
}

/** Why the hero picked a task: the temperament's own reason, or a plain one when the board had nothing in character. */
export function questReason(e: { instinct: Instinct; quest: { kind: QuestKind } }, m: Messages): string {
  const ideals = QUEST_IDEALS[e.instinct as keyof typeof QUEST_IDEALS];
  return !ideals || ideals.includes(e.quest.kind) ? m.questReason[e.instinct] : m.questReasonPlain;
}
