import { describe, expect, it } from 'vitest';
import { advance, newGame } from '../engine/sim';
import { SAVE_VERSION, deserialize, serialize } from './save';

describe('save', () => {
  it('round-trips the game state', () => {
    const state = advance(newGame(4), 300);
    const file = deserialize(serialize(state, 1000, 2000));
    expect(file).toEqual({ version: SAVE_VERSION, savedAt: 2000, lastTickAt: 1000, state });
  });

  it('a loaded game continues exactly like the original', () => {
    const state = advance(newGame(4), 300);
    const loaded = deserialize(serialize(state, 0, 0))!.state;
    expect(advance(loaded, 500)).toEqual(advance(state, 500));
  });

  it('rejects garbage and saves from a newer version', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize('{}')).toBeNull();
    expect(deserialize(JSON.stringify({ version: SAVE_VERSION + 1, state: {} }))).toBeNull();
  });
});
