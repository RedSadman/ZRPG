import { INSTINCTS } from '../data/instincts.ts';
import type { Combatant } from './combat.ts';
import { effectiveStats } from './hero.ts';
import { realmEdge } from './levels.ts';
import { nextFloat, type Rng } from './rng.ts';
import type { Life } from './types.ts';

/** Rounds of a fight that techniques usually last for; beyond that the qi pool runs dry. */
const TYPICAL_ROUNDS = 8;
/** How sharply the odds follow the balance of strength. */
const ODDS_STEEPNESS = 3;

/**
 * How a fight would likely go, from a quick look at both sides rather than playing it out:
 * how many rounds each side needs to bring the other down. 0.5 is an even match.
 */
export function estimateWin(me: Combatant, foe: Combatant, pills = 0): number {
  return oddsFromRatio(strengthRatio(me, foe, pills));
}

/**
 * The hero's own reading of the fight. The instinct colours it (the bold overrate themselves, the cautious
 * underrate), and a dull mind misreads it more.
 */
export function perceivedWin(life: Life, me: Combatant, foe: Combatant, rng: Rng): number {
  const mind = effectiveStats(life).mind;
  const spread = Math.min(0.45, Math.max(0.08, 0.45 - 0.02 * mind));
  const ratio = strengthRatio(me, foe, life.pills.healing) * INSTINCTS[life.instinct].selfImage * Math.exp(gaussian(rng) * spread);
  return oddsFromRatio(ratio);
}

function strengthRatio(me: Combatant, foe: Combatant, pills: number): number {
  const myToughness = me.hp + pills * me.maxHp * 0.5;
  const roundsToFell = foe.hp / damagePerRound(me, foe);
  const roundsToFall = myToughness / damagePerRound(foe, me);
  return roundsToFall / roundsToFell;
}

function damagePerRound(att: Combatant, def: Combatant): number {
  const hit = Math.min(0.95, Math.max(0.4, 0.75 + 0.02 * (att.agi - def.agi)));
  const best = att.techniques.reduce((top, t) => Math.max(top, t.k * (t.stat === 'qi' ? att.qi : att.body)), 0);
  const cheapest = att.techniques.reduce((low, t) => Math.min(low, t.cost), Infinity);
  const techShare = att.techniques.length ? Math.min(1, att.qiPool / cheapest / TYPICAL_ROUNDS) : 0;
  const raw = (att.weapon + 0.5 * att.body + best * techShare) * att.damageMult * realmEdge(att.level, def.level);
  const crit = 1 + 0.05 + 0.005 * att.luck;
  return Math.max(1, raw - 0.5 * def.armor) * hit * crit;
}

function oddsFromRatio(ratio: number): number {
  return 1 / (1 + ratio ** -ODDS_STEEPNESS);
}

/** Standard normal sample (Box–Muller). */
function gaussian(rng: Rng): number {
  const u = Math.max(1e-9, nextFloat(rng));
  const v = nextFloat(rng);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
