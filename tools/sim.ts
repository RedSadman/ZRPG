// Balance simulator: plays many dreams on autopilot and prints how they went.
// Usage: node tools/sim.ts [dreams=300] [seed=1]        first dreams of fresh heroes
//        node tools/sim.ts 300 1 bold                    the same with another instinct
//        node tools/sim.ts loop [players=40] [dreams=20] progression across dreams with rewards
//        node tools/sim.ts time [players=20] [hours=8] [instinct]   progression by real play time, charges included

import { MAX_LEVEL } from '../src/data/realms.ts';
import { realmOf, stageOf } from '../src/engine/levels.ts';
import { advanceSteps, attemptRealBreakthrough, chooseReward, newGame } from '../src/engine/sim.ts';
import { autoPick, canAttemptRealBreakthrough } from '../src/engine/reality.ts';
import type { DreamSummary, GameState } from '../src/engine/types.ts';

if (process.argv[2] === 'time') {
  byTime(Number(process.argv[3] ?? 20), Number(process.argv[4] ?? 8), process.argv[5] as GameState['life']['instinct'] | undefined);
  process.exit(0);
}

if (process.argv[2] === 'loop') {
  loop(Number(process.argv[3] ?? 40), Number(process.argv[4] ?? 20), process.argv[5] as GameState['life']['instinct'] | undefined);
  process.exit(0);
}

const dreams = Number(process.argv[2] ?? 300);
const seed = Number(process.argv[3] ?? 1);
const instinct = process.argv[4] as GameState['life']['instinct'] | undefined;

const summaries: Array<DreamSummary & { root: string; path: string; steps: number; fights: number; wins: number; flees: number }> = [];

for (let i = 0; i < dreams; i++) {
  let s: GameState = newGame(seed * 100_003 + i);
  if (instinct) s = { ...s, life: { ...s.life, instinct } };
  let steps = 0;
  while (s.chronicle.length === 0 && steps < 20_000) {
    s = advanceSteps(s, 1);
    steps++;
  }
  const sum = s.chronicle[0]!;
  const t = s.life.totals;
  summaries.push({ ...sum, root: s.hero.root, path: s.hero.path, steps, fights: t.fights, wins: t.wins, flees: t.flees });
}

const years = (m: number) => m / 12;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const pct = (n: number) => `${((100 * n) / summaries.length).toFixed(1)}%`;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

console.log(`Dreams: ${summaries.length} (seed ${seed})`);
console.log(`Age at death: avg ${avg(summaries.map((s) => years(s.ageMonths))).toFixed(1)} y, median ${years(median(summaries.map((s) => s.ageMonths))).toFixed(1)} y`);
console.log(`Journal lines per dream (≈ beats of ~3 s): avg ${avg(summaries.map((s) => s.steps)).toFixed(0)}, median ${median(summaries.map((s) => s.steps))}`);
console.log(`Real time per dream at ×1: ~${((avg(summaries.map((s) => s.steps)) * 3) / 60).toFixed(1)} min`);

const fights = summaries.reduce((a, s) => a + s.fights, 0);
const wins = summaries.reduce((a, s) => a + s.wins, 0);
const flees = summaries.reduce((a, s) => a + s.flees, 0);
const killed = summaries.filter((s) => s.death.cause === 'killed').length;
console.log(`Fights: ${fights}, won ${((100 * wins) / fights).toFixed(1)}%, fled ${((100 * flees) / fights).toFixed(1)}%, deaths per fight ${((100 * killed) / fights).toFixed(2)}%`);

console.log('\nCause of death:');
for (const cause of ['killed', 'oldAge', 'deviation']) {
  console.log(`  ${cause.padEnd(10)} ${pct(summaries.filter((s) => s.death.cause === cause).length)}`);
}

console.log('\nKilled by:');
const killers = new Map<string, number>();
for (const s of summaries) if (s.death.enemy) killers.set(s.death.enemy, (killers.get(s.death.enemy) ?? 0) + 1);
for (const [k, n] of [...killers].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(18)} ${pct(n)}`);

console.log('\nHighest level reached:');
const byRealm = new Map<string, number>();
for (const s of summaries) {
  const label = s.level === 0 ? 'mortal' : `realm ${realmOf(s.level)} stage ${stageOf(s.level) <= 3 ? '1-3' : stageOf(s.level) <= 6 ? '4-6' : '7-9'}`;
  byRealm.set(label, (byRealm.get(label) ?? 0) + 1);
}
for (const [k, n] of [...byRealm].sort()) console.log(`  ${k.padEnd(20)} ${pct(n)}`);
console.log(`  reached MAX_LEVEL (${MAX_LEVEL}): ${pct(summaries.filter((s) => s.level >= MAX_LEVEL).length)}`);

console.log('\nBy root (avg level / avg age):');
for (const root of ['trash', 'common', 'rare', 'heavenly']) {
  const xs = summaries.filter((s) => s.root === root);
  if (xs.length) console.log(`  ${root.padEnd(9)} n=${String(xs.length).padEnd(4)} L ${avg(xs.map((s) => s.level)).toFixed(1).padStart(5)}  age ${avg(xs.map((s) => years(s.ageMonths))).toFixed(1)}`);
}
console.log('\nBy path (avg level / avg age):');
for (const path of ['sword', 'body', 'alchemy', 'demonic']) {
  const xs = summaries.filter((s) => s.path === path);
  if (xs.length) console.log(`  ${path.padEnd(9)} n=${String(xs.length).padEnd(4)} L ${avg(xs.map((s) => s.level)).toFixed(1).padStart(5)}  age ${avg(xs.map((s) => years(s.ageMonths))).toFixed(1)}`);
}

/** Each player dreams `count` times, taking rewards by the default priority; charges are not the bottleneck here. */
function loop(players: number, count: number, instinct?: GameState['life']['instinct']): void {
  const rows = Array.from({ length: count }, () => ({ level: 0, realLevel: 0, age: 0, score: 0, beats: 0, oldAge: 0 }));
  for (let p = 0; p < players; p++) {
    let s: GameState = newGame(7_000_003 + p);
    if (instinct) s = { ...s, setup: { ...s.setup, instinct }, life: { ...s.life, instinct } };
    for (let d = 0; d < count; d++) {
      const startBeat = s.beat;
      while (s.phase !== 'choosing') {
        // Play like someone who presses the breakthrough button as soon as it lights up.
        if (canAttemptRealBreakthrough(s.hero)) s = attemptRealBreakthrough(s);
        s = advanceSteps({ ...s, charges: 99 }, 1);
      }
      const sum = s.chronicle.at(-1)!;
      const row = rows[d]!;
      row.level += sum.level;
      row.age += sum.ageMonths / 12;
      row.score += sum.score;
      row.beats += s.beat - startBeat;
      if (sum.death.cause === 'oldAge') row.oldAge += 1;
      s = chooseReward(s, autoPick(s.offer!, s.autopilot.priority));
      row.realLevel += s.hero.level;
    }
  }
  console.log(`Players: ${players}, dreams each: ${count}`);
  console.log('dream  dream-level  real-level     age  score  beats  old-age');
  rows.forEach((r, i) => {
    const f = (x: number, d = 1) => (x / players).toFixed(d).padStart(6);
    const oldAge = `${((100 * r.oldAge) / players).toFixed(0)}%`.padStart(7);
    console.log(`${String(i + 1).padStart(5)}  ${f(r.level)}       ${f(r.realLevel)}     ${f(r.age, 0)}  ${f(r.score, 0)}  ${f(r.beats, 0)}  ${oldAge}`);
  });
}

/**
 * Plays in real time: the Pillow's charges limit how often a dream can start, so short lives are not free.
 * One beat is ~3 s, so an hour is 1200 beats.
 */
function byTime(players: number, hours: number, instinct?: GameState['life']['instinct']): void {
  const BEATS_PER_HOUR = 1200;
  const rows = Array.from({ length: hours }, () => ({ realLevel: 0, dreams: 0 }));
  for (let p = 0; p < players; p++) {
    let s: GameState = newGame(7_000_003 + p);
    if (instinct) s = { ...s, setup: { ...s.setup, instinct }, life: { ...s.life, instinct } };
    s = { ...s, autopilot: { ...s.autopilot, enabled: true } };
    for (let h = 0; h < hours; h++) {
      const until = (h + 1) * BEATS_PER_HOUR;
      while (s.beat < until) {
        if (canAttemptRealBreakthrough(s.hero)) s = attemptRealBreakthrough(s);
        s = advanceSteps(s, Math.min(50, until - s.beat));
      }
      rows[h]!.realLevel += s.hero.level;
      rows[h]!.dreams += s.dreamsEnded;
    }
  }
  console.log(`Players: ${players}, hours: ${hours}${instinct ? `, instinct: ${instinct}` : ''}`);
  console.log('hour  real-level  dreams');
  rows.forEach((r, i) => {
    console.log(`${String(i + 1).padStart(4)}  ${(r.realLevel / players).toFixed(1).padStart(10)}  ${(r.dreams / players).toFixed(1).padStart(6)}`);
  });
}
