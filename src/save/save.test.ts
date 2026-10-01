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
