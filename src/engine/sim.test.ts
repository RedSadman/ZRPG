import { describe, expect, it } from 'vitest';
import { JOURNAL_LIMIT, START_AGE_MONTHS, advance, catchUp, newGame, step } from './sim';

describe('sim', () => {
  it('starts in dream #1 with an opening line', () => {
    const s = newGame(1);
    expect(s.dream).toMatchObject({ n: 1, ageMonths: START_AGE_MONTHS, awake: false });
    expect(s.journal.map((e) => e.event.kind)).toEqual(['dreamStart']);
  });

  it('is deterministic for a seed', () => {
    expect(advance(newGame(123), 5000)).toEqual(advance(newGame(123), 5000));
  });

  it('gives the same result tick by tick as in one batch', () => {
    let s = newGame(9);
    for (let i = 0; i < 2000; i++) s = step(s);
    expect(s).toEqual(advance(newGame(9), 2000));
  });

  it('does not mutate its input', () => {
    const s = newGame(5);
    const snapshot = structuredClone(s);
    advance(s, 1000);
    expect(s).toEqual(snapshot);
  });

  it('ends dreams and starts new ones', () => {
    const s = advance(newGame(3), 20_000);
    const kinds = s.journal.map((e) => e.event.kind);
    expect(s.dream.n).toBeGreaterThan(1);
    expect(kinds).toContain('wake');
  });

  it('caps the journal', () => {
    const s = advance(newGame(11), 50_000);
    expect(s.journal.length).toBeLessThanOrEqual(JOURNAL_LIMIT);
  });

  it('summarises offline progress in one line', () => {
    const start = newGame(77);
    const s = catchUp(start, 20_000);
    const last = s.journal.at(-1)!.event;
    const wakes = advance(start, 20_000).dream.n - (s.dream.awake ? 0 : 1);
    expect(last).toEqual({ kind: 'away', months: 20_000, dreamsEnded: wakes });
  });
});
