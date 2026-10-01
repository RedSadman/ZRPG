import { describe, expect, it } from 'vitest';
import { advanceMonths, newGame } from '../engine/sim.ts';
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
});
