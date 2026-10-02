import { describe, expect, it } from 'vitest';
import { GATHERING_PILL, SHOP } from '../data/crafts.ts';
import type { Instinct } from '../data/instincts.ts';
import { LOCALES } from '../i18n/index.ts';
import { narrateEntry } from '../narrator/narrator.ts';
import { materialUnit, visitWorkshop } from './crafts.ts';
import { encounter, newLife } from './dream.ts';
import { qiToReach } from './levels.ts';
import { applyReward, makeOffer } from './reality.ts';
import { createRng } from './rng.ts';
import { advanceMonths, newGame } from './sim.ts';
import type { GameState, Life } from './types.ts';

/** A level-8 dreamer of the given temperament on the given path, at the sect. */
function dreamer(instinct: Instinct, path: Life['path'] = 'sword', patch: Partial<Life> = {}): GameState {
  const s = newGame(4);
  const hero = { ...s.hero, path, level: 8, stats: { body: 14, qi: 14, agi: 14, mind: 20, luck: 6 } };
  const life = { ...newLife(hero, 1, { instinct, path, start: 'azureCloudSect', blessing: false }), ...patch };
  return { ...s, hero, life, setup: { ...s.setup, instinct, path } };
}

describe('materials', () => {
  it('a slain beast leaves a core for the furnace; a bandit leaves none', () => {
    let cores = 0;
    for (let seed = 0; seed < 30; seed++) {
      const beast = dreamer('bold');
      if (encounter(beast, createRng(seed), () => {}, 'greyWolf', 6, { committed: true }) === 'won') cores += beast.life.mats.cores;
      const bandit = dreamer('bold');
      encounter(bandit, createRng(seed), () => {}, 'banditCultivator', 6, { committed: true });
      expect(bandit.life.mats.cores).toBe(0);
    }
    expect(cores).toBeGreaterThan(0);
  });
});

describe('the workshop', () => {
  it('a skilled alchemist turns cores and herbs into gathering pills and grows more skilled', () => {
    const unit = materialUnit(8);
    const s = dreamer('righteous', 'alchemy', {
      stones: 10_000,
      mats: { herbs: 20 * unit, cores: 20 * unit, ore: 0 },
      crafts: { alchemy: 6, forging: 0, talismans: 0 },
    });
    const work = visitWorkshop(s, createRng(1));
    expect(s.life.pills.gathering).toBeGreaterThan(0);
    expect(work.batches.some((b) => b.product === 'gatheringPill' && b.made > 0)).toBe(true);
    expect(s.life.mats.cores).toBeLessThan(20 * unit);
    expect(s.life.crafts.alchemy).toBeGreaterThan(6);
  });

  it('nobody brews gathering pills while the purse cannot cover the essentials; the cores are sold', () => {
    const unit = materialUnit(8);
    const s = dreamer('bold', 'alchemy', { stones: 0, pills: { healing: 3, breakthrough: null, gathering: 0, eaten: 0 }, mats: { herbs: 0, cores: 20 * unit, ore: 0 } });
    const work = visitWorkshop(s, createRng(2));
    expect(s.life.pills.gathering).toBe(0);
    expect(work.sold).toBeGreaterThan(0);
  });

  it('the cautious do not experiment: with poor odds they sell everything', () => {
    const unit = materialUnit(8);
    const s = dreamer('cautious', 'demonic', {
      stones: 10_000,
      mats: { herbs: 10 * unit, cores: 10 * unit, ore: 10 * unit },
      stats: { body: 10, qi: 10, agi: 10, mind: 0, luck: 5 },
    });
    const work = visitWorkshop(s, createRng(3));
    expect(work.batches).toHaveLength(0);
    expect(s.life.mats).toEqual({ herbs: 0, cores: 0, ore: 0 });
  });

  it('the bold draw thunder talismans, the cautious Thousand-Li ones', () => {
    const unit = materialUnit(8);
    const mats = () => ({ herbs: 20 * unit, cores: 20 * unit, ore: 0 });
    const crafts = { alchemy: 0, forging: 0, talismans: 8 };
    const bold = dreamer('bold', 'sword', { stones: 10_000, mats: mats(), crafts: { ...crafts } });
    const cautious = dreamer('cautious', 'sword', { stones: 10_000, mats: mats(), crafts: { ...crafts } });
    visitWorkshop(bold, createRng(4));
    visitWorkshop(cautious, createRng(4));
    expect(bold.life.talismans.thunder).toBeGreaterThan(0);
    expect(bold.life.talismans.escape).toBe(0);
    expect(cautious.life.talismans.escape).toBeGreaterThan(0);
  });
});

describe('pills and talismans at work', () => {
  it('a gathering pill gives a share of the next stage, and the body takes only a few per stage', () => {
    const s = dreamer('righteous', 'sword', { activity: 'meditate', qi: 0, pills: { healing: 0, breakthrough: null, gathering: 6, eaten: 0 } });
    const need = qiToReach(9);
    let state = s;
    for (let i = 0; i < 5 && state.life.level === 8; i++) state = advanceMonths(state, 1);
    expect(state.life.pills.eaten).toBeLessThanOrEqual(GATHERING_PILL.perStage);
    expect(state.life.pills.gathering).toBe(6 - state.life.pills.eaten);
    expect(state.life.qi).toBeGreaterThanOrEqual(Math.min(need, need * GATHERING_PILL.share * state.life.pills.eaten));
  });

  it('a Thousand-Li talisman tears the hero out of a lost fight', () => {
    let saved = 0;
    for (let seed = 0; seed < 40; seed++) {
      const s = dreamer('bold', 'sword', { talismans: { escape: 1, thunder: 0 }, pills: { healing: 0, breakthrough: null, gathering: 0, eaten: 0 } });
      const result = encounter(s, createRng(seed), () => {}, 'ironbackBear', 16, { committed: true });
      if (result === 'escaped') {
        saved++;
        expect(s.life.death).toBeNull();
        expect(s.life.talismans.escape).toBe(0);
      }
    }
    expect(saved).toBeGreaterThan(0);
  });
});

describe('business', () => {
  it('a greedy dreamer with money opens a shop, and the till fills while they are away', () => {
    const s = dreamer('greedy', 'sword', { stones: 100_000, activity: 'sect' });
    let state = advanceMonths(s, 1);
    expect(state.life.shop.level).toBe(1);
    expect(state.journal.some((e) => e.event.kind === 'shop' && e.event.action === 'opened')).toBe(true);
    state = advanceMonths(state, 3);
    const earned = state.life.shop.till > 0 || state.journal.some((e) => e.event.kind === 'sect' && (e.event.income ?? 0) > 0);
    expect(earned).toBe(true);
    expect(state.life.shop.level).toBeLessThanOrEqual(SHOP.maxLevel);
    for (const locale of LOCALES) {
      for (const e of state.journal) expect(narrateEntry(e, state, locale)).not.toMatch(/undefined|NaN/);
    }
  });

  it('others do not bother with a shop', () => {
    const state = advanceMonths(dreamer('righteous', 'sword', { stones: 100_000, activity: 'sect' }), 1);
    expect(state.life.shop.level).toBe(0);
  });
});

describe('carrying a craft out of the dream', () => {
  it('a craft that grew in the dream can be taken, and the next dream starts with it', () => {
    const s = dreamer('bold', 'sword', { crafts: { alchemy: 5.5, forging: 0, talismans: 2 } });
    let found = null;
    for (let seed = 0; seed < 40 && !found; seed++) {
      found = makeOffer(s.hero, s.life, 200, createRng(seed)).find((r) => r.kind === 'craft') ?? null;
    }
    expect(found).toMatchObject({ kind: 'craft', craft: 'alchemy' });
    const next = structuredClone(s);
    applyReward(next, found!, createRng(0), () => {});
    expect(next.hero.crafts.alchemy).toBeGreaterThanOrEqual(1);
    expect(newLife(next.hero, 2).crafts.alchemy).toBe(next.hero.crafts.alchemy);
  });

  it('the path’s own head start is not offered as a reward', () => {
    const s = dreamer('bold', 'sword');
    for (let seed = 0; seed < 20; seed++) {
      expect(makeOffer(s.hero, s.life, 200, createRng(seed)).some((r) => r.kind === 'craft')).toBe(false);
    }
  });
});
