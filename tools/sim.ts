// Balance simulator: plays many dreams on autopilot and prints how they went.
// Usage: node tools/sim.ts [dreams=300] [seed=1]

import { MAX_LEVEL } from '../src/data/realms.ts';
import { realmOf, stageOf } from '../src/engine/levels.ts';
import { advanceSteps, newGame } from '../src/engine/sim.ts';
import type { DreamSummary, GameState } from '../src/engine/types.ts';

const dreams = Number(process.argv[2] ?? 300);
const seed = Number(process.argv[3] ?? 1);

const summaries: Array<DreamSummary & { root: string; path: string; steps: number; fights: number; wins: number; flees: number }> = [];

for (let i = 0; i < dreams; i++) {
  let s: GameState = newGame(seed * 100_003 + i);
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
