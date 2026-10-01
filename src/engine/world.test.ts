import { describe, expect, it } from 'vitest';
import { SECRETS } from '../data/knowledge.ts';
import { MAX_LEVEL } from '../data/realms.ts';
import { ZONES, zoneFor } from '../data/zones.ts';
import { LOCALES } from '../i18n/index.ts';
import { narrateEntry } from '../narrator/narrator.ts';
import { newLife } from './dream.ts';
import { monthsPerTick, qiToReach } from './levels.ts';
import { canFaceThePatriarch } from './reality.ts';
import { advanceMonths, faceThePatriarch, newGame } from './sim.ts';
import type { GameState } from './types.ts';

/** A dream about to break through into `level` (a realm gate): a frail body and no healing pills, so the storm can go either way. */
function atGate(level: number, seed: number): GameState {
  const s = newGame(seed);
  const hero = { ...s.hero, level: level - 1, stats: { body: 6, qi: 14, agi: 12, mind: 30, luck: 6 } };
  const life = {
    ...newLife(hero, 1, { instinct: 'bold', path: hero.path, start: 'azureCloudSect', blessing: false }),
    activity: 'meditate' as const,
    qi: qiToReach(level) - 1,
    pills: { healing: 0, breakthrough: null },
  };
  return { ...s, hero, life, rngState: seed * 977 };
}

describe('the world', () => {
  it('has a zone for every realm up to the peak', () => {
    expect(zoneFor(0).key).toBe('villageWoods');
    expect(zoneFor(20).key).toBe('poisonMistSwamps');
    expect(zoneFor(MAX_LEVEL).key).toBe('heavenlyStairs');
    expect(ZONES.at(-1)!.maxLevel).toBe(MAX_LEVEL);
  });

  it('tells time in larger strides in the high realms', () => {
    expect(monthsPerTick(5)).toBe(1);
    expect(monthsPerTick(20)).toBe(3);
    expect(monthsPerTick(50)).toBe(24);
    const s = { ...newGame(1), life: { ...newLife({ ...newGame(1).hero, level: 50 }, 1), activity: 'retired' as const } };
    expect(advanceMonths(s, 1).life.ageMonths - s.life.ageMonths).toBe(24);
  });

  it('crossing into Golden Core calls down the Heavenly Tribulation, which can kill', () => {
    let survived = 0;
    let killed = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const after = advanceMonths(atGate(19, seed), 1);
      const trib = after.journal.find((e) => e.event.kind === 'tribulation')?.event;
      if (!trib || trib.kind !== 'tribulation') continue;
      if (trib.survived) survived++;
      else killed++;
      for (const locale of LOCALES) {
        for (const e of after.journal) expect(narrateEntry(e, after, locale)).not.toMatch(/undefined|NaN/);
      }
    }
    expect(survived).toBeGreaterThan(0);
    expect(killed).toBeGreaterThan(0);
  });

  it('a realm boss gives up its Secret', () => {
    let found = false;
    for (let seed = 1; seed <= 40 && !found; seed++) {
      const s = newGame(seed);
      const hero = { ...s.hero, level: 9, stats: { body: 40, qi: 40, agi: 30, mind: 30, luck: 10 } };
      const life = { ...newLife(hero, 1), activity: 'hunt' as const, monthsInActivity: 3, pills: { healing: 3, breakthrough: null } };
      const after = advanceMonths({ ...s, hero, life, rngState: seed }, 3);
      found = after.life.discoveries.includes('secretRavine');
    }
    expect(found).toBe(true);
  });

  it('the ending opens only with all six Secrets at the peak, and is decided by a real fight', () => {
    const s = newGame(2);
    const ready: GameState = {
      ...s,
      hero: {
        ...s.hero,
        level: MAX_LEVEL,
        stats: { body: 160, qi: 160, agi: 120, mind: 80, luck: 30 },
        knowledge: SECRETS.map((x) => x.key),
      },
    };
    expect(canFaceThePatriarch(s)).toBe(false);
    expect(canFaceThePatriarch({ ...ready, hero: { ...ready.hero, knowledge: [] } })).toBe(false);
    expect(canFaceThePatriarch(ready)).toBe(true);

    const after = faceThePatriarch(ready);
    const line = after.journal.at(-1)!.event;
    expect(line.kind).toBe('finalBattle');
    if (line.kind === 'finalBattle' && line.won) expect(after.ascended).toBe(true);
    else expect(after.hero.injuryBeats).toBeGreaterThan(0);
  });
});
