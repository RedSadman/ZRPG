import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies.ts';
import type { Instinct } from '../data/instincts.ts';
import { QUESTS } from '../data/quests.ts';
import { chooseQuest, makeQuest } from './board.ts';
import { enemyCombatant, heroCombatant } from './combat.ts';
import { newLife } from './dream.ts';
import { karmaLuck } from './hero.ts';
import { estimateWin, perceivedWin } from './judgement.ts';
import { qiToReach } from './levels.ts';
import { createRng } from './rng.ts';
import { advanceSteps, newGame, setAutopilot } from './sim.ts';
import type { GameState, Life } from './types.ts';

/** A level-5 hero with level-5 gear, as a given temperament. */
function lifeAt(instinct: Instinct, level = 5): Life {
  const s = newGame(7);
  const hero = { ...s.hero, level, stats: { body: 9, qi: 9, agi: 9, mind: 8, luck: 6 } };
  return { ...newLife(hero, 1, { instinct, path: hero.path, start: 'azureCloudSect', blessing: false }), pills: { healing: 2, breakthrough: null } };
}

function autoGame(seed: number, instinct: Instinct): GameState {
  const s = setAutopilot(newGame(seed), true);
  return { ...s, charges: 1000, setup: { ...s.setup, instinct }, life: { ...s.life, instinct } };
}

describe('sizing up a fight', () => {
  it('sees a far stronger foe as hopeless and a far weaker one as easy', () => {
    const life = lifeAt('righteous');
    const me = heroCombatant(life);
    expect(estimateWin(me, enemyCombatant(ENEMIES.spiritBoar!, 1))).toBeGreaterThan(0.9);
    expect(estimateWin(me, enemyCombatant(ENEMIES.ironbackBear!, 14))).toBeLessThan(0.1);
  });

  it('the bold overrate themselves, the cautious underrate', () => {
    const avg = (instinct: Instinct) => {
      const life = lifeAt(instinct);
      const rng = createRng(3);
      const me = heroCombatant(life);
      const foe = enemyCombatant(ENEMIES.greyWolf!, 7);
      let sum = 0;
      for (let i = 0; i < 400; i++) sum += perceivedWin(life, me, foe, rng);
      return sum / 400;
    };
    expect(avg('bold')).toBeGreaterThan(avg('righteous'));
    expect(avg('righteous')).toBeGreaterThan(avg('cautious'));
  });
});

describe('the task board', () => {
  const board = (life: Life) => QUESTS.map((def) => makeQuest(def, life, createRng(1)));

  it('each temperament picks the work that suits it', () => {
    const pick = (instinct: Instinct) => chooseQuest(board(lifeAt(instinct)), lifeAt(instinct), createRng(2)).kind;
    // The cautious judge a task by the worst foe it could send and would rather not fight at all: mostly peaceful
    // work, and a dangerous task only when they misread it.
    const cautious = Array.from({ length: 40 }, (_, seed) => chooseQuest(board(lifeAt('cautious')), lifeAt('cautious'), createRng(seed)).kind);
    expect(cautious.filter((k) => ['herbs', 'delivery', 'mining', 'sectDuty'].includes(k)).length).toBeGreaterThan(20);
    expect(cautious.filter((k) => ['eliteBeast', 'demonHunt'].includes(k)).length).toBeLessThanOrEqual(2);
    expect(['defendVillage', 'demonHunt']).toContain(pick('righteous'));
    expect(['escort', 'eliteBeast']).toContain(pick('greedy'));
    expect(['eliteBeast', 'demonHunt', 'escort']).toContain(pick('bold'));
  });

  it('the greedy will not touch work that pays below the board average', () => {
    const life = lifeAt('greedy');
    const quests = board(life);
    const avg = quests.reduce((sum, q) => sum + q.stones, 0) / quests.length;
    for (let seed = 0; seed < 20; seed++) expect(chooseQuest(quests, life, createRng(seed)).stones).toBeGreaterThanOrEqual(avg);
  });
});

describe('behaviour over whole dreams', () => {
  it('the cautious slip away from more fights than the bold', () => {
    const avoided = (instinct: Instinct) => {
      let total = 0;
      for (let seed = 0; seed < 12; seed++) {
        const s = advanceSteps(autoGame(seed, instinct), 400);
        for (const e of s.journal) {
          if (e.event.kind === 'hunt') total += e.event.avoided ?? 0;
          if (e.event.kind === 'fight' && e.event.note === 'sensed') total += 1;
        }
      }
      return total;
    };
    expect(avoided('cautious')).toBeGreaterThan(avoided('bold'));
  });

  it('the righteous sometimes turn down pay they feel they did not earn', () => {
    let declined = 0;
    for (let seed = 0; seed < 10 && declined === 0; seed++) {
      const s = advanceSteps(autoGame(seed, 'righteous'), 1500);
      declined += s.journal.filter((e) => e.event.kind === 'questDone' && e.event.declined).length;
    }
    expect(declined).toBeGreaterThan(0);
  });

  it('the cautious wait for a pill at a realm gate, the bold just try', () => {
    const atGate = (instinct: Instinct): GameState => {
      const s = newGame(5);
      const life = { ...lifeAt(instinct, 0), activity: 'meditate' as const, qi: qiToReach(1) - 1 };
      return { ...s, life };
    };
    const cautious = advanceSteps(atGate('cautious'), 1);
    expect(cautious.journal.some((e) => e.event.kind === 'pillWait')).toBe(true);
    const bold = advanceSteps(atGate('bold'), 1);
    expect(bold.journal.some((e) => e.event.kind === 'realmUp' || e.event.kind === 'breakthroughFail' || e.event.kind === 'death')).toBe(
      true,
    );
  });

  it('karma moves luck, within limits', () => {
    expect([karmaLuck(0), karmaLuck(7), karmaLuck(-4), karmaLuck(100), karmaLuck(-100)]).toEqual([0, 2, -1, 5, -5]);
  });
});
