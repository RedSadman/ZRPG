import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies.ts';
import { enemyCombatant, fight, type FightOutcome } from './combat.ts';
import { createRng } from './rng.ts';

function tally(heroLevel: number, foeLevel: number, n = 500) {
  const rng = createRng(42);
  const counts: Record<FightOutcome, number> = { won: 0, fled: 0, rescued: 0, lost: 0 };
  const hero = enemyCombatant(ENEMIES.greyWolf!, heroLevel);
  for (let i = 0; i < n; i++) counts[fight(hero, enemyCombatant(ENEMIES.spiritBoar!, foeLevel), 0, 5, rng).outcome]++;
  return counts;
}

describe('combat', () => {
  it('is deterministic for a seed', () => {
    const run = () => fight(enemyCombatant(ENEMIES.greyWolf!, 3), enemyCombatant(ENEMIES.spiritBoar!, 3), 1, 5, createRng(7));
    expect(run()).toEqual(run());
  });

  it('a much stronger fighter almost always wins', () => {
    expect(tally(8, 2).won).toBeGreaterThan(480);
  });

  it('a whole realm is a wall', () => {
    // Level 9 is the peak of Qi Condensation; level 10 is Foundation Establishment.
    const sameRealm = tally(9, 9);
    const realmAbove = tally(9, 10);
    expect(realmAbove.won).toBeLessThan(sameRealm.won / 2);
  });

  it('pills are drunk before running away', () => {
    const rng = createRng(3);
    const hero = enemyCombatant(ENEMIES.greyWolf!, 2);
    const r = fight(hero, enemyCombatant(ENEMIES.ironbackBear!, 4), 3, 5, rng);
    if (r.outcome !== 'won') expect(r.pillsUsed).toBeGreaterThan(0);
  });
});
