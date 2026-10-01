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
