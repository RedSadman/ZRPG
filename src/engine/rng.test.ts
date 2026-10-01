import { describe, expect, it } from 'vitest';
import { createRng, nextFloat, nextInt } from './rng';

describe('rng', () => {
  it('replays the same sequence from the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 100 }, () => nextFloat(a));
    const seqB = Array.from({ length: 100 }, () => nextFloat(b));
    expect(seqA).toEqual(seqB);
  });

  it('resumes from a saved state', () => {
    const a = createRng(7);
    for (let i = 0; i < 10; i++) nextFloat(a);
    const resumed = createRng(a.state);
    expect(nextFloat(resumed)).toBe(nextFloat(a));
  });

  it('stays in range', () => {
    const r = createRng(1);
    for (let i = 0; i < 10_000; i++) {
      const f = nextFloat(r);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = nextInt(r, 3, 5);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
  });
});
