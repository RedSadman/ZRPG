import { describe, expect, it } from 'vitest';
import { INSTINCTS, type Instinct } from '../data/instincts.ts';
import { QUESTS } from '../data/quests.ts';
import { LOCALES } from '../i18n/index.ts';
import { narrateEntry } from '../narrator/narrator.ts';
import { chooseQuest, makeQuest } from './board.ts';
import { encounter, newLife } from './dream.ts';
import { instinctChoice } from './forks.ts';
import { createRng } from './rng.ts';
import { advanceMonths, newGame } from './sim.ts';
import { temperament } from './temperament.ts';
import type { GameState, Life } from './types.ts';

/** A level-8 dreamer with level-8 gear. */
function dreamer(instinct: Instinct, secondary: Instinct | null = null, patch: Partial<Life> = {}): GameState {
  const s = newGame(6);
  const hero = { ...s.hero, level: 8, stats: { body: 14, qi: 14, agi: 14, mind: 14, luck: 6 } };
  const life = { ...newLife(hero, 1, { instinct, secondary, path: hero.path, start: 'azureCloudSect', blessing: false }), ...patch };
  return { ...s, hero, life };
}

function noUndefinedText(s: GameState): void {
  for (const locale of LOCALES) {
    for (const e of s.journal) expect(narrateEntry(e, s, locale)).not.toMatch(/undefined|NaN/);
  }
}

describe('a secondary instinct', () => {
  it('shifts the numbers a little and adds its habits', () => {
    const t = temperament({ instinct: 'cautious', secondary: 'greedy' });
    expect(t.engageAt).toBeLessThan(INSTINCTS.cautious.engageAt);
    expect(t.engageAt).toBeGreaterThan(INSTINCTS.greedy.engageAt);
    expect(t.investor).toBe(true);
    expect(t.waitsForPill).toBe(true);
    expect(temperament({ instinct: 'bold', secondary: 'curious' }).traits.curiosity).toBeCloseTo(0.3);
    expect(temperament({ instinct: 'bold', secondary: 'bold' })).toBe(INSTINCTS.bold);
  });

  it('answers a fork when the main instinct’s choice is not on the table', () => {
    const s = dreamer('curious', 'greedy', {
      fork: { key: 'oldManManual', options: ['refuse', 'rob', 'bow'], deadline: 0, cost: 3, enemyLevel: 9 },
    });
    expect(instinctChoice(s)).toBe('rob');
  });
});

describe('the curious', () => {
  it('sometimes wander into the next region; the cautious never do', () => {
    const peeks = (instinct: Instinct) => {
      let n = 0;
      for (let seed = 0; seed < 60; seed++) {
        const s = dreamer(instinct, null, { activity: 'travel' });
        const after = advanceMonths({ ...s, rngState: seed }, 1);
        if (after.life.trip.peek) {
          n++;
          expect(after.journal.at(-1)!.event).toMatchObject({ kind: 'explore', zone: 'thousandBeastForest' });
          noUndefinedText(after);
        }
      }
      return n;
    };
    expect(peeks('curious')).toBeGreaterThan(0);
    expect(peeks('cautious')).toBe(0);
  });
});

describe('the vengeful', () => {
  it('remember who made them run', () => {
    const grudges = (instinct: Instinct) => {
      let n = 0;
      for (let seed = 0; seed < 80; seed++) {
        const s = dreamer(instinct, null, { pills: { healing: 0, breakthrough: null, gathering: 0, eaten: 0 } });
        const result = encounter(s, createRng(seed), () => {}, 'ironbackBear', 13, { committed: true });
        if (result !== 'lost' && s.life.grudge) n++;
      }
      return n;
    };
    expect(grudges('vengeful')).toBeGreaterThan(0);
    expect(grudges('cautious')).toBe(0);
  });

  it('come back for them once they feel strong enough', () => {
    let paid = false;
    for (let seed = 0; seed < 30 && !paid; seed++) {
      const s = dreamer('vengeful', null, { activity: 'hunt', grudge: { enemy: 'greyWolf', level: 6, ageMonths: 200 } });
      const after = advanceMonths({ ...s, rngState: seed }, 6);
      const revenge = after.journal.find((e) => e.event.kind === 'fight' && e.event.note === 'revenge');
      if (revenge) {
        paid = true;
        expect(after.life.grudge).toBeNull();
        noUndefinedText(after);
      }
    }
    expect(paid).toBe(true);
  });
});

describe('the lazy and the ambitious', () => {
  const board = (s: GameState) => {
    const rng = createRng(3);
    return ['herbs', 'sectDuty', 'eliteBeast', 'hunt'].map((k) => makeQuest(QUESTS.find((q) => q.kind === k)!, s.life, rng));
  };

  it('the lazy take the work that keeps them at home', () => {
    const s = dreamer('lazy');
    expect(chooseQuest(board(s), s.life, createRng(1)).kind).toBe('sectDuty');
  });

  it('the ambitious go for the work that brings standing', () => {
    const s = dreamer('ambitious');
    expect(['eliteBeast', 'hunt']).toContain(chooseQuest(board(s), s.life, createRng(1)).kind);
  });

  it('a rank in the sect takes both standing and strength, and raises the pay', () => {
    // Plenty of standing, but only Qi Condensation: still an outer disciple.
    const weak = advanceMonths(dreamer('ambitious', null, { reputation: 40, activity: 'sect' }), 1);
    expect(weak.life.sectRank).toBe(0);
    // Golden Core with the same standing: inner disciple, then senior.
    const s = dreamer('ambitious', null, { reputation: 16, level: 20, activity: 'sect' });
    const after = advanceMonths(s, 1);
    expect(after.life.sectRank).toBe(2);
    expect(after.journal.filter((e) => e.event.kind === 'promotion')).toHaveLength(2);
    noUndefinedText(after);
    // Golden Core but little standing: the sect does not know you yet.
    expect(advanceMonths(dreamer('ambitious', null, { reputation: 2, level: 20, activity: 'sect' }), 1).life.sectRank).toBe(0);
    const plain = makeQuest(QUESTS[0]!, { ...s.life, sectRank: 0 }, createRng(5));
    const senior = makeQuest(QUESTS[0]!, { ...s.life, sectRank: 2 }, createRng(5));
    expect(senior.stones).toBeGreaterThan(plain.stones);
  });
});
