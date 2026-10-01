import { describe, expect, it } from 'vitest';
import { isRealmGate, lifespanMonths, realmOf, stageOf } from './levels.ts';

describe('levels', () => {
  it('maps levels to realms and stages', () => {
    expect([realmOf(0), stageOf(0)]).toEqual([0, 0]);
    expect([realmOf(1), stageOf(1)]).toEqual([1, 1]);
    expect([realmOf(9), stageOf(9)]).toEqual([1, 9]);
    expect([realmOf(10), stageOf(10)]).toEqual([2, 1]);
    expect([realmOf(18), stageOf(18)]).toEqual([2, 9]);
  });

  it('marks the first stage of every realm as a gate', () => {
    expect([1, 10, 19].every(isRealmGate)).toBe(true);
    expect([2, 9, 11, 18].some(isRealmGate)).toBe(false);
  });

  it('extends lifespan with each realm', () => {
    expect(lifespanMonths(0)).toBe(80 * 12);
    expect(lifespanMonths(5)).toBe(120 * 12);
    expect(lifespanMonths(12)).toBe(200 * 12);
  });
});
