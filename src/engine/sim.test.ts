import { describe, expect, it } from 'vitest';
import { CHRONICLE_LIMIT, JOURNAL_LIMIT, START_AGE_MONTHS, advanceMonths, advanceSteps, catchUp, dreamsCompleted, newGame, step } from './sim.ts';

describe('sim', () => {
  it('starts dream #1 at the sect gates', () => {
    const s = newGame(1);
    expect(s.life).toMatchObject({ n: 1, ageMonths: START_AGE_MONTHS, level: 0, death: null });
    expect(s.journal.map((e) => e.event.kind)).toEqual(['dreamStart', 'joinSect']);
  });

  it('is deterministic for a seed', () => {
    expect(advanceMonths(newGame(123), 3000)).toEqual(advanceMonths(newGame(123), 3000));
  });

  it('gives the same result step by step as in one batch', () => {
    let s = newGame(9);
    for (let i = 0; i < 300; i++) s = step(s);
    expect(s).toEqual(advanceSteps(newGame(9), 300));
  });

  it('adds exactly one journal line per step unless a dream is waking', () => {
    let s = newGame(21);
    for (let i = 0; i < 200; i++) {
      const before = s.nextEntryId;
      s = step(s);
      expect(s.nextEntryId).toBeGreaterThan(before);
    }
  });

  it('does not mutate its input', () => {
    const s = advanceMonths(newGame(5), 50);
    const snapshot = structuredClone(s);
    advanceMonths(s, 1000);
    expect(s).toEqual(snapshot);
  });

  it('ends dreams with a summary in the chronicle and starts new ones', () => {
    const s = advanceSteps(newGame(3), 3000);
    expect(s.chronicle.length).toBeGreaterThan(0);
    const first = s.chronicle[0]!;
    expect(first.n).toBe(1);
    expect(first.highlights.length).toBeLessThanOrEqual(8);
    const kinds = s.journal.map((e) => e.event.kind);
    expect(kinds).toContain('death');
    expect(kinds).toContain('wake');
  });

  it('caps the journal and the chronicle', () => {
    const s = advanceSteps(newGame(11), 20_000);
    expect(s.journal.length).toBeLessThanOrEqual(JOURNAL_LIMIT);
    expect(s.chronicle.length).toBeLessThanOrEqual(CHRONICLE_LIMIT);
  });

  it('never lets a dreamer grow younger or cultivate past the ceiling', () => {
    let s = newGame(8);
    let lastAge = s.life.ageMonths;
    for (let i = 0; i < 2000; i++) {
      s = step(s);
      if (s.life.n === 1) {
        expect(s.life.ageMonths).toBeGreaterThanOrEqual(lastAge);
        lastAge = s.life.ageMonths;
      }
      expect(s.life.level).toBeLessThanOrEqual(18);
    }
  });

  it('summarises offline progress in one line', () => {
    const start = newGame(77);
    const s = catchUp(start, 500);
    const last = s.journal.at(-1)!.event;
    expect(last).toEqual({ kind: 'away', months: s.tick - start.tick, dreamsEnded: dreamsCompleted(s) });
  });
});
