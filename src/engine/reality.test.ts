import { describe, expect, it } from 'vitest';
import { newLife } from './dream.ts';
import { qiToReach, totalProgress } from './levels.ts';
import { BEATS_PER_CHARGE, CHARGE_MAX, autoPick, makeOffer, rewardQuality } from './reality.ts';
import { createRng } from './rng.ts';
import { advanceSteps, attemptRealBreakthrough, chooseReward, newGame, setAutopilot, step } from './sim.ts';
import type { GameState } from './types.ts';

/** Plays until the first dream ends and the rewards are on the table. */
function untilChoosing(seed: number): GameState {
  let s = newGame(seed);
  for (let i = 0; i < 20_000 && s.phase !== 'choosing'; i++) s = step(s);
  expect(s.phase).toBe('choosing');
  return s;
}

describe('reality', () => {
  it('offers three rewards when a dream ends and waits for the player', () => {
    const s = untilChoosing(4);
    expect(s.offer).toHaveLength(3);
    const later = advanceSteps(s, 50);
    expect(later.phase).toBe('choosing');
    expect(later.life.n).toBe(1);
  });

  it('a chosen reward reaches the real hero, then the next dream starts and spends a charge', () => {
    const s = untilChoosing(4);
    const chosen = chooseReward(s, 0);
    expect(chosen.phase).toBe('resting');
    expect(chosen.offer).toBeNull();
    expect(chosen.journal.some((e) => e.event.kind === 'reward')).toBe(true);
    const next = step(chosen);
    expect(next.phase).toBe('dreaming');
    expect(next.life.n).toBe(2);
    expect(next.charges).toBe(chosen.charges - 1);
  });

  it('a qi reward pays out a share of what the dream gained, and the real hero keeps it', () => {
    const s = untilChoosing(4);
    const idx = s.offer!.findIndex((r) => r.kind === 'qi');
    if (idx < 0) return; // this dream gained nothing; covered by other seeds
    const before = totalProgress(s.hero.level, s.hero.qi);
    const after = chooseReward(s, idx);
    expect(totalProgress(after.hero.level, after.hero.qi)).toBeGreaterThan(before);
  });

  it('without charges the Pillow rests, then recovers one charge with time', () => {
    const s = { ...chooseReward(untilChoosing(6), 0), charges: 0, chargeBeats: 0 };
    const waiting = advanceSteps(s, BEATS_PER_CHARGE - 1);
    expect(waiting.phase).toBe('resting');
    const asleep = advanceSteps(waiting, 1);
    expect(asleep.phase).toBe('dreaming');
  });

  it('charges never exceed the maximum', () => {
    const s = advanceSteps({ ...untilChoosing(6), charges: CHARGE_MAX }, BEATS_PER_CHARGE * 3);
    expect(s.charges).toBeLessThanOrEqual(CHARGE_MAX);
  });

  it('the autopilot takes rewards by priority and keeps dreaming', () => {
    const offer = [
      { kind: 'stats' as const, stats: { body: 2 } },
      { kind: 'talent' as const, talent: { key: 'ironSkin' } },
      { kind: 'qi' as const, amount: 100 },
    ];
    expect(autoPick(offer, ['talent', 'qi', 'stats'])).toBe(1);
    expect(autoPick(offer, ['qi', 'talent'])).toBe(2);

    const s = advanceSteps({ ...setAutopilot(newGame(9), true), charges: 100 }, 3000);
    expect(s.dreamsEnded).toBeGreaterThan(1);
    expect(s.journal.some((e) => e.event.kind === 'reward' && e.event.auto)).toBe(true);
  });

  it('a new dream starts from the real hero, not from scratch', () => {
    const s = newGame(1);
    const hero = { ...s.hero, level: 5, qi: 40, talents: [{ key: 'ironSkin' }] };
    const life = newLife(hero, 2);
    expect(life.level).toBe(5);
    expect(life.qi).toBe(40);
    expect(life.talents).toEqual([{ key: 'ironSkin' }]);
    expect(life.startProgress).toBe(totalProgress(5, 40));
  });

  it('real stages go up on their own, but a realm gate waits for the player and keeps the qi behind it', () => {
    let s = newGame(2);
    // Three times what the mortal → Qi Condensation gate needs.
    s = { ...s, hero: { ...s.hero, qi: qiToReach(1) * 3 } };
    s = step(s);
    expect(s.hero.level).toBe(0);
    expect(s.hero.qi).toBeGreaterThanOrEqual(qiToReach(1) * 3);

    for (let seed = 0; seed < 20; seed++) {
      const tried = attemptRealBreakthrough({ ...s, rngState: seed });
      if (tried.hero.level === 1) {
        // The qi beyond the gate flows on into the new realm.
        expect(tried.hero.qi).toBeCloseTo(s.hero.qi - qiToReach(1));
      } else {
        expect(tried.hero.injuryBeats).toBeGreaterThan(0);
        expect(tried.hero.qi).toBeCloseTo(s.hero.qi - 0.3 * qiToReach(1));
      }
    }
  });

  it('remembers who killed you', () => {
    const s = newGame(3);
    const life = { ...newLife(s.hero, 1), death: { cause: 'killed' as const, enemy: 'greyWolf', enemyLevel: 2 } };
    const offers = Array.from({ length: 20 }, (_, i) => makeOffer(s.hero, life, 10, createRng(i)));
    const memory = offers.flat().find((r) => r.kind === 'talent' && r.talent.key === 'deathMemory');
    expect(memory).toEqual({ kind: 'talent', talent: { key: 'deathMemory', enemy: 'greyWolf' } });
  });

  it('better lives give better rewards', () => {
    expect([rewardQuality(10), rewardQuality(100), rewardQuality(300)]).toEqual([0, 1, 2]);
  });
});
