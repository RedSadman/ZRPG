import { REALMS, STAGES_PER_REALM } from '../data/realms.ts';

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
export function qiToReach(level: number): number {
  return 100 * level ** 1.6;
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

export function lifespanMonths(level: number): number {
  return REALMS[realmOf(level)]!.lifespanYears * 12;
}
