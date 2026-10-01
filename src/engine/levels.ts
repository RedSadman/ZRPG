import { MONTHS_PER_TICK, QI_COST_MULT, REALMS, STAGES_PER_REALM } from '../data/realms.ts';

export function realmOf(level: number): number {
  return level === 0 ? 0 : Math.ceil(level / STAGES_PER_REALM);
}

/** 1–9 within the realm; 0 for a mortal. */
export function stageOf(level: number): number {
  return level === 0 ? 0 : level - (realmOf(level) - 1) * STAGES_PER_REALM;
}

/** Reaching this level means entering a new realm (1, 10, 19…), which takes a risky breakthrough. */
export function isRealmGate(level: number): boolean {
  return level % STAGES_PER_REALM === 1;
}

/** Qi needed to reach `level` from the one below. */
/** Qi needed to reach `level` from the one below; the high realms are steeply dearer (see QI_COST_MULT). */
export function qiToReach(level: number): number {
  return 100 * level ** 1.6 * QI_COST_MULT[realmOf(level)]!;
}

/** Qi gathered in one month of meditation towards `level`, before root/technique/path multipliers. */
export function baseQiPerMonth(level: number): number {
  return 4 * level;
}

/** All qi ever gathered to stand at `level` with `qi` towards the next one; lets two points on the path be compared. */
export function totalProgress(level: number, qi: number): number {
  let sum = qi;
  for (let l = 1; l <= level; l++) sum += qiToReach(l);
  return sum;
}

/**
 * How much harder the attacker hits for standing realms above the defender (or softer, below).
 * Every realm is a wall of ×1.5, except the first step out of mortality, which is ×1.25: early Qi Condensation is
 * still close to a mortal body.
 */
export function realmEdge(attackerLevel: number, defenderLevel: number): number {
  const a = realmOf(attackerLevel);
  const d = realmOf(defenderLevel);
  let factor = 1;
  for (let r = Math.min(a, d); r < Math.max(a, d); r++) factor *= r === 0 ? 1.25 : 1.5;
  return a >= d ? factor : 1 / factor;
}

/** Months that one dreamed tick stands for at this level. */
export function monthsPerTick(level: number): number {
  return MONTHS_PER_TICK[realmOf(level)]!;
}

export function lifespanMonths(level: number): number {
  return REALMS[realmOf(level)]!.lifespanYears * 12;
}
