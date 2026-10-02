import { describe, expect, it } from 'vitest';
import { advanceMonths, advanceSteps, newGame, setAutopilot } from '../engine/sim.ts';
import { SAVE_VERSION, deserialize, serialize } from './save.ts';

describe('save', () => {
  it('round-trips the game state', () => {
    const state = advanceMonths(newGame(4), 300);
    const file = deserialize(serialize(state, 1000, 2000));
    expect(file).toEqual({ version: SAVE_VERSION, savedAt: 2000, lastTickAt: 1000, state });
  });

  it('a loaded game continues exactly like the original', () => {
    const state = advanceMonths(newGame(4), 300);
    const loaded = deserialize(serialize(state, 0, 0))!.state;
    expect(advanceMonths(loaded, 500)).toEqual(advanceMonths(state, 500));
  });

  it('rejects garbage, saves from a newer version, and old saves it cannot migrate', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize('{}')).toBeNull();
    expect(deserialize(JSON.stringify({ version: SAVE_VERSION + 1, state: {} }))).toBeNull();
    expect(deserialize(JSON.stringify({ version: 1, state: {} }))).toBeNull();
  });
});

describe('save migration', () => {
  it('upgrades a v2 save: the hero gains a real side, the dream goes on', () => {
    const v3 = advanceMonths(newGame(12), 30);
    // Rebuild what a v2 save looked like.
    const { beat: _b, phase: _p, offer: _o, charges: _c, chargeBeats: _cb, autopilot: _a, dreamsEnded: _d, ...rest } = v3;
    const { level: _l, qi: _q, techniques: _t, cultivation: _cu, equipment: _e, talents: _ta, injuryBeats: _i, ...hero } = v3.hero;
    const { talents: _lt, startProgress: _sp, ...life } = v3.life;
    const v2 = { version: 2, savedAt: 0, lastTickAt: 0, state: { ...rest, hero, life, awake: false } };

    const file = deserialize(JSON.stringify(v2))!;
    expect(file.version).toBe(SAVE_VERSION);
    expect(file.state.phase).toBe('dreaming');
    expect(file.state.hero.level).toBe(0);
    expect(file.state.hero.techniques).toHaveLength(1);
    expect(() => advanceMonths(file.state, 200)).not.toThrow();
  });

  it('upgrades a v7 save: crafts start from nothing, the dream goes on', () => {
    const v8 = advanceMonths(newGame(12), 30);
    const { crafts: _hc, ...hero } = v8.hero;
    const { crafts: _lc, mats: _m, talismans: _t, shop: _s, ...life } = v8.life;
    const { gathering: _g, eaten: _e, ...pills } = v8.life.pills;
    const autopilot = { ...v8.autopilot, priority: v8.autopilot.priority.filter((k) => k !== 'craft') };
    const v7 = { version: 7, savedAt: 0, lastTickAt: 0, state: { ...v8, hero, life: { ...life, pills }, autopilot } };

    const file = deserialize(JSON.stringify(v7))!;
    expect(file.version).toBe(SAVE_VERSION);
    expect(file.state.hero.crafts).toEqual({ alchemy: 0, forging: 0, talismans: 0 });
    expect(file.state.life.mats).toEqual({ herbs: 0, cores: 0, ore: 0 });
    expect(file.state.autopilot.priority).toContain('craft');
    expect(() => advanceMonths(file.state, 200)).not.toThrow();
  });

  it('upgrades a v8 save: lifetime statistics are rebuilt from the Chronicle', () => {
    // Two finished dreams, rewards taken by the autopilot.
    let v9 = setAutopilot({ ...newGame(5), charges: 99 }, true);
    for (let i = 0; i < 20_000 && v9.chronicle.length < 2; i++) v9 = advanceSteps(v9, 1);
    expect(v9.chronicle.length).toBe(2);
    const { stats: _s, ...state } = v9;
    const v8 = { version: 8, savedAt: 0, lastTickAt: 0, state };

    const file = deserialize(JSON.stringify(v8))!;
    expect(file.version).toBe(SAVE_VERSION);
    expect(file.state.stats.dreams).toBe(v9.chronicle.length);
    expect(file.state.stats.kills).toBe(v9.stats.kills);
    expect(file.state.stats.best.level).toEqual(v9.stats.best.level);
  });

  it('upgrades a v9 save: no secondary instinct, no grudges, no rank yet', () => {
    const v10 = advanceMonths(newGame(9), 30);
    const { secondary: _s, grudge: _g, sectRank: _r, ...life } = v10.life;
    const { peek: _p, ...trip } = v10.life.trip;
    const { secondary: _ss, ...setup } = v10.setup;
    const v9 = { version: 9, savedAt: 0, lastTickAt: 0, state: { ...v10, setup, life: { ...life, trip } } };

    const file = deserialize(JSON.stringify(v9))!;
    expect(file.version).toBe(SAVE_VERSION);
    expect(file.state.setup.secondary).toBeNull();
    expect(file.state.life).toMatchObject({ secondary: null, grudge: null, sectRank: 0 });
    expect(() => advanceMonths(file.state, 200)).not.toThrow();
  });
});
