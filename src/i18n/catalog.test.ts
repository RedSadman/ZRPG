import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies.ts';
import { FORKS } from '../data/forks.ts';
import { INSTINCT_KEYS } from '../data/instincts.ts';
import { AFFIXES, BASES } from '../data/items.ts';
import { KNOWLEDGE, START_PLACES } from '../data/knowledge.ts';
import { PATH_KEYS } from '../data/paths.ts';
import { REALMS } from '../data/realms.ts';
import { RIVAL_SURNAMES } from '../data/rivals.ts';
import { TALENTS, DEATH_MEMORY } from '../data/talents.ts';
import { COMBAT_TECHNIQUES, CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { ZONES } from '../data/zones.ts';
import { HERO_NAMES } from '../data/heroNames.ts';
import { LOCALES, messages } from './index.ts';

/** Every key the game data can produce has words in every language. */
describe('catalogs', () => {
  for (const locale of LOCALES) {
    const m = messages(locale);
    it(`${locale} names everything in the game data`, () => {
      const missing = (what: string, keys: readonly string[], table: Record<string, unknown>) =>
        keys.filter((k) => table[k] === undefined).map((k) => `${what}.${k}`);
      const gaps = [
        ...missing('enemies', Object.keys(ENEMIES), m.enemies),
        ...missing('zones', ZONES.map((z) => z.key), m.zones),
        ...missing('realms', REALMS.map((r) => r.key), m.realms),
        ...missing('techniques', [...Object.keys(COMBAT_TECHNIQUES), ...CULTIVATION_TECHNIQUES.map((t) => t.key)], m.techniques),
        ...missing('itemBases', Object.keys(BASES), m.itemBases),
        ...missing('affixes', Object.keys(AFFIXES), m.affixes),
        ...missing('talents', [...TALENTS.map((t) => t.key), DEATH_MEMORY], m.talents),
        ...missing('knowledge', KNOWLEDGE, m.knowledge),
        ...missing('startPlaces', START_PLACES.map((p) => p.key), m.startPlaces),
        ...missing('instincts', INSTINCT_KEYS, m.instincts),
        ...missing('paths', PATH_KEYS, m.paths),
        ...missing('surnames', RIVAL_SURNAMES, m.surnames),
        ...missing('heroNames', HERO_NAMES.map((h) => h.key), m.heroNames),
        ...missing('forks', FORKS.map((f) => f.key), m.forks),
        ...FORKS.flatMap((f) => missing(`forks.${f.key}.options`, f.options.map((o) => o.key), m.forks[f.key]?.options ?? {})),
      ];
      expect(gaps).toEqual([]);
    });
  }
});
