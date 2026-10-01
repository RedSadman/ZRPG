import { describe, expect, it } from 'vitest';
import { FORKS, FORK_WAIT_BEATS } from '../data/forks.ts';
import { LOCALES } from '../i18n/index.ts';
import { narrateEntry } from '../narrator/narrator.ts';
import { newLife } from './dream.ts';
import { instinctChoice } from './forks.ts';
import { makeOffer } from './reality.ts';
import { createRng } from './rng.ts';
import { advanceSteps, chooseFork, chooseReward, newGame, setSetup, setWaitForMe, setupCost, step } from './sim.ts';
import type { GameState } from './types.ts';

/** A game whose dream is waiting on `fork`, at a level where it can happen. */
function atFork(fork: string, level = 12, instinct: GameState['life']['instinct'] = 'cautious'): GameState {
  const s = newGame(42);
  const hero = { ...s.hero, level };
  const life = { ...newLife(hero, 1), instinct, stones: 200, contribution: 50 };
  const def = FORKS.find((f) => f.key === fork)!;
  life.fork = { key: fork, options: def.options.map((o) => o.key), deadline: s.beat + FORK_WAIT_BEATS, cost: 40, enemyLevel: level + 2 };
  return { ...s, hero, life };
}

describe('forks', () => {
  it('pause the dream until answered', () => {
    const s = atFork('injuredStranger');
    const later = advanceSteps(s, FORK_WAIT_BEATS - 1);
    expect(later.life.fork).not.toBeNull();
    expect(later.life.ageMonths).toBe(s.life.ageMonths);
  });

  it('let the instinct answer after the wait', () => {
    const s = atFork('injuredStranger', 12, 'cautious');
    expect(instinctChoice(s)).toBe('pass');
    const later = advanceSteps(s, FORK_WAIT_BEATS + 1);
    expect(later.life.fork).toBeNull();
    const result = later.journal.find((e) => e.event.kind === 'forkResult')!.event;
    expect(result).toMatchObject({ option: 'pass', auto: true });
  });

  it('wait forever when the player asks for it', () => {
    const s = setWaitForMe(atFork('injuredStranger'), true);
    expect(advanceSteps(s, FORK_WAIT_BEATS * 5).life.fork).not.toBeNull();
  });

  it('every option of every fork plays out and reads well in both languages', () => {
    for (const def of FORKS) {
      for (const option of def.options) {
        for (let seed = 0; seed < 6; seed++) {
          const s = { ...atFork(def.key, def.minLevel === 10 ? 12 : 4), rngState: seed * 7919 };
          const after = chooseFork(s, option.key);
          expect(after.life.fork, `${def.key}/${option.key}`).toBeNull();
          const fresh = after.journal.slice(s.journal.length);
          expect(fresh.length, `${def.key}/${option.key}`).toBeGreaterThan(0);
          for (const locale of LOCALES) {
            for (const entry of fresh) {
              expect(narrateEntry(entry, after, locale), `${def.key}/${option.key} ${locale}`).not.toMatch(/undefined|NaN/);
            }
          }
        }
      }
    }
  });

  it('a place found in a dream is offered as knowledge, and once known it is used in later dreams', () => {
    const found = chooseFork(atFork('hiddenCave', 4), 'remember');
    expect(found.life.discoveries).toContain('oldZhangCave');

    const life = { ...found.life, death: { cause: 'oldAge' as const } };
    const offer = makeOffer(found.hero, life, 50, createRng(1));
    expect(offer[0]).toEqual({ kind: 'knowledge', key: 'oldZhangCave' });

    // Learn it, then play a dream in the foothills: the cave gives its technique right away.
    const hero = { ...found.hero, level: 3, knowledge: ['oldZhangCave'] };
    let s: GameState = { ...newGame(5), hero, life: newLife(hero, 2) };
    for (let i = 0; i < 400 && !s.life.remembered.includes('oldZhangCave') && !s.life.death; i++) s = step(s);
    expect(s.life.remembered).toContain('oldZhangCave');
    expect(s.journal.some((e) => e.event.kind === 'remembered')).toBe(true);
  });
});

describe('dream setup', () => {
  it('costs fate points and drops what cannot be afforded', () => {
    let s = newGame(3);
    s = setSetup(s, { blessing: true, instinct: 'bold' });
    expect(setupCost(s)).toBe(2);

    // Not enough fate: the blessing is dropped, the instinct still applies.
    let poor: GameState = { ...s, phase: 'resting', hero: { ...s.hero, fate: 1 } };
    poor = step(poor);
    expect(poor.life.instinct).toBe('bold');
    expect(poor.life.luckBonus).toBe(0);
    expect(poor.hero.fate).toBe(1);

    let rich: GameState = { ...s, phase: 'resting', hero: { ...s.hero, fate: 5 } };
    rich = step(rich);
    expect(rich.life.luckBonus).toBe(5);
    expect(rich.hero.fate).toBe(3);
  });

  it('an unknown starting place falls back to the home sect', () => {
    const s = { ...setSetup(newGame(3), { start: 'ironFistClan' }), phase: 'resting' as const, hero: { ...newGame(3).hero, fate: 9 } };
    expect(step(s).life.start).toBe('azureCloudSect');
  });

  it('waking earns fate points', () => {
    let s = newGame(4);
    for (let i = 0; i < 20_000 && s.phase !== 'choosing'; i++) s = step(s);
    expect(s.hero.fate).toBeGreaterThan(0);
    const next = chooseReward(s, 0);
    expect(next.hero.fate).toBe(s.hero.fate);
  });
});
