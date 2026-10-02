import { createRng, type Rng } from './rng.ts';
import { generateHero } from './hero.ts';
import { zoneFor } from '../data/zones.ts';
import { defaultSetup, liveMonth, newLife, type Emit } from './dream.ts';
import { instinctChoice, resolveFork } from './forks.ts';
import { BLESSING_COST, startPlace } from '../data/knowledge.ts';
import {
  CHARGE_MAX,
  canFaceThePatriarch,
  fightThePatriarch,
  DEFAULT_PRIORITY,
  applyReward,
  autoPick,
  fateFor,
  makeOffer,
  realBreakthrough,
  realityBeat,
} from './reality.ts';
import type { DreamSetup, DreamSummary, GameEvent, GameState, Life, LifetimeStats, RewardKind } from './types.ts';

export { START_AGE_MONTHS } from './dream.ts';
import { START_AGE_MONTHS } from './dream.ts';

export const JOURNAL_LIMIT = 500;
export const CHRONICLE_LIMIT = 100;
/** A dreaming beat stops at the next journal line; this caps how many silent months one beat may skip. */
export const MAX_QUIET_MONTHS = 600;
const SUMMARY_HIGHLIGHTS = 8;

export function newGame(seed: number): GameState {
  const rng = createRng(seed);
  const hero = generateHero(rng);
  const state: GameState = {
    tick: 0,
    beat: 0,
    rngState: 0,
    hero,
    life: newLife(hero, 1, defaultSetup(hero)),
    phase: 'dreaming',
    offer: null,
    charges: CHARGE_MAX - 1,
    chargeBeats: 0,
    autopilot: { enabled: false, priority: [...DEFAULT_PRIORITY] },
    setup: defaultSetup(hero),
    waitForMe: false,
    ascended: false,
    dreamsEnded: 0,
    journal: [],
    nextEntryId: 1,
    chronicle: [],
    stats: emptyStats(),
  };
  beginDream(state);
  state.rngState = rng.state;
  return state;
}

/** One beat of real time (the UI calls this every ~3 s). Pure. */
export function step(state: GameState): GameState {
  return advanceSteps(state, 1);
}

export function advanceSteps(state: GameState, steps: number): GameState {
  return mutate(state, (s, rng) => {
    for (let i = 0; i < steps; i++) applyBeat(s, rng);
  });
}

/** Plays forward exactly `months` dreamed months, waking into choices as needed. For tests and tools. Pure. */
export function advanceMonths(state: GameState, months: number): GameState {
  return mutate(state, (s, rng) => {
    for (let i = 0; i < months && s.phase === 'dreaming' && !s.life.fork; i++) applyMonth(s, rng);
  });
}

/** Catches up after the player was away and leaves one summary line instead of a wall of text. */
export function catchUp(state: GameState, steps: number): GameState {
  if (steps <= 0) return state;
  const draft = advanceSteps(state, steps);
  record(draft, { kind: 'away', months: draft.tick - state.tick, dreamsEnded: draft.dreamsEnded - state.dreamsEnded });
  return draft;
}

// --- Player decisions (pure) -------------------------------------------------

export function chooseReward(state: GameState, index: number): GameState {
  if (state.phase !== 'choosing' || !state.offer?.[index]) return state;
  return mutate(state, (s, rng) => takeReward(s, index, false, rng));
}

/** Answers the fork the dream is waiting on. */
export function chooseFork(state: GameState, option: string): GameState {
  if (state.phase !== 'dreaming' || !state.life.fork?.options.includes(option)) return state;
  return mutate(state, (s, rng) => {
    resolveFork(s, rng, emitter(s), option, false);
    if (s.life.death) wake(s, rng);
  });
}

/** Changes what the next dream will be like. Costs are paid when it starts. */
export function setSetup(state: GameState, patch: Partial<DreamSetup>): GameState {
  return { ...state, setup: { ...state.setup, ...patch } };
}

export function setWaitForMe(state: GameState, waitForMe: boolean): GameState {
  return { ...state, waitForMe };
}

/** Fate points the setup would cost now, or null if it cannot be afforded as chosen. */
export function setupCost(state: GameState, setup: DreamSetup = state.setup): number {
  return startPlace(setup.start).cost + (setup.blessing ? BLESSING_COST : 0);
}

/** The last fight, awake: the Blood Moon Patriarch. Win, and the dream of immortality comes true. */
export function faceThePatriarch(state: GameState): GameState {
  if (!canFaceThePatriarch(state)) return state;
  return mutate(state, (s, rng) => fightThePatriarch(s, rng, emitter(s)));
}

export function attemptRealBreakthrough(state: GameState): GameState {
  return mutate(state, (s, rng) => realBreakthrough(s, rng, emitter(s)));
}

export function setAutopilot(state: GameState, enabled: boolean): GameState {
  return { ...state, autopilot: { ...state.autopilot, enabled } };
}

/** Moves a reward kind one place up (-1) or down (+1) in the autopilot's priority. */
export function movePriority(state: GameState, kind: RewardKind, delta: -1 | 1): GameState {
  const priority = [...state.autopilot.priority];
  const from = priority.indexOf(kind);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= priority.length) return state;
  [priority[from], priority[to]] = [priority[to]!, priority[from]!];
  return { ...state, autopilot: { ...state.autopilot, priority } };
}

// --- The loop ----------------------------------------------------------------

function applyBeat(s: GameState, rng: Rng): void {
  s.beat += 1;
  realityBeat(s, rng, emitter(s));
  switch (s.phase) {
    case 'dreaming': {
      const fork = s.life.fork;
      if (fork) {
        // The dream waits for an answer; after a while the dreamer's instinct gives one.
        if (!s.waitForMe && s.beat >= fork.deadline) {
          resolveFork(s, rng, emitter(s), instinctChoice(s), true);
          if (s.life.death) wake(s, rng);
        }
        return;
      }
      const before = s.nextEntryId;
      for (let m = 0; s.nextEntryId === before && s.phase === 'dreaming' && !s.life.fork; m++) {
        // A retired elder's last decades pass in one beat; anything else stops after a long silence.
        if (m >= MAX_QUIET_MONTHS && s.life.activity !== 'retired') break;
        applyMonth(s, rng);
      }
      return;
    }
    case 'choosing':
      if (s.autopilot.enabled && s.offer) takeReward(s, autoPick(s.offer, s.autopilot.priority), true, rng);
      return;
    case 'resting':
      if (s.charges > 0 && s.hero.injuryBeats === 0) {
        s.charges -= 1;
        s.life = newLife(s.hero, s.life.n + 1, paySetup(s));
        s.phase = 'dreaming';
        beginDream(s);
      }
      return;
  }
}

function applyMonth(s: GameState, rng: Rng): void {
  s.tick += 1;
  liveMonth(s, rng, emitter(s));
  if (s.life.death) wake(s, rng);
}

function takeReward(s: GameState, index: number, auto: boolean, rng: Rng): void {
  const reward = s.offer?.[index];
  if (!reward) return;
  record(s, { kind: 'reward', dream: s.life.n, reward, auto });
  const summary = s.chronicle.at(-1);
  if (summary?.n === s.life.n) summary.reward = reward;
  applyReward(s, reward, rng, emitter(s));
  s.offer = null;
  s.phase = 'resting';
}

/**
 * The setup the next dream actually gets: places the hero does not know fall back to the home sect, and whatever
 * the fate points cannot cover is dropped (the blessing first). Pays for what is kept.
 */
function paySetup(s: GameState): DreamSetup {
  const { hero } = s;
  const setup = { ...s.setup };
  const place = startPlace(setup.start);
  if (place.knowledge && !hero.knowledge.includes(place.knowledge)) setup.start = startPlace('').key;
  if (setup.blessing && setupCost(s, setup) > hero.fate) setup.blessing = false;
  if (setupCost(s, setup) > hero.fate) setup.start = startPlace('').key;
  hero.fate -= setupCost(s, setup);
  return setup;
}

function beginDream(s: GameState): void {
  const { hero, life } = s;
  record(s, { kind: 'dreamStart', dream: life.n });
  record(s, {
    kind: 'joinSect',
    ageMonths: life.ageMonths,
    root: hero.root,
    path: life.path,
    start: life.start,
    instinct: life.instinct,
  });
}

function wake(s: GameState, rng: Rng): void {
  const life = s.life;
  const summary = summarize(life);
  s.chronicle.push(summary);
  if (s.chronicle.length > CHRONICLE_LIMIT) s.chronicle.splice(0, s.chronicle.length - CHRONICLE_LIMIT);
  s.dreamsEnded += 1;
  countDream(s.stats, life, summary);
  s.hero.fate += fateFor(summary.score);
  record(s, { kind: 'wake', dream: life.n, score: summary.score });
  s.offer = makeOffer(s.hero, life, summary.score, rng);
  s.phase = 'choosing';
}

export function lifeScore(life: Life): number {
  return (
    life.level * 10 +
    Math.floor(life.ageMonths / 24) +
    life.bossesKilled.length * 15 +
    Math.floor(life.totals.kills / 10) +
    // Courage counts: every stronger foe beaten makes the life worth more.
    Math.floor(life.valor / 2)
  );
}

export function emptyStats(): LifetimeStats {
  const none = { value: 0, dream: 0 };
  return {
    dreams: 0,
    months: 0,
    kills: 0,
    bosses: 0,
    deaths: { killed: 0, oldAge: 0, deviation: 0, tribulation: 0 },
    killers: {},
    byInstinct: {},
    best: { level: { ...none }, age: { ...none }, score: { ...none } },
  };
}

/** Adds a finished dream to the lifetime statistics. */
export function countDream(stats: LifetimeStats, life: Life, summary: DreamSummary): void {
  stats.dreams += 1;
  stats.months += Math.max(0, summary.ageMonths - START_AGE_MONTHS);
  stats.kills += summary.kills;
  stats.bosses += life.bossesKilled.length;
  stats.deaths[summary.death.cause] = (stats.deaths[summary.death.cause] ?? 0) + 1;
  const killer = summary.death.enemy;
  if (killer) stats.killers[killer] = (stats.killers[killer] ?? 0) + 1;
  const mine = (stats.byInstinct[life.instinct] ??= { dreams: 0, score: 0 });
  mine.dreams += 1;
  mine.score += summary.score;
  const beat = (record: { value: number; dream: number }, value: number) => {
    if (value > record.value) Object.assign(record, { value, dream: summary.n });
  };
  beat(stats.best.level, summary.level);
  beat(stats.best.age, summary.ageMonths);
  beat(stats.best.score, summary.score);
}

function summarize(life: Life): DreamSummary {
  const top = life.highlights
    .map((h, i) => ({ ...h, i }))
    .sort((a, b) => b.priority - a.priority || a.i - b.i)
    .slice(0, SUMMARY_HIGHLIGHTS)
    .sort((a, b) => a.i - b.i)
    .map((h) => h.event);
  return {
    instinct: life.instinct,
    path: life.path,
    n: life.n,
    ageMonths: life.ageMonths,
    level: life.level,
    zone: zoneFor(life.level).key,
    death: life.death!,
    score: lifeScore(life),
    kills: life.totals.kills,
    highlights: top,
  };
}

function emitter(s: GameState): Emit {
  return (event, priority = 0) => {
    record(s, event);
    if (priority >= 3) s.life.highlights.push({ priority, event });
  };
}

function record(s: GameState, event: GameEvent): void {
  s.journal.push({ id: s.nextEntryId++, tick: s.tick, event });
  if (s.journal.length > JOURNAL_LIMIT) s.journal.splice(0, s.journal.length - JOURNAL_LIMIT);
}

/** Runs `fn` on a deep copy with its own RNG and returns the copy; the caller's state is untouched. */
function mutate(state: GameState, fn: (s: GameState, rng: Rng) => void): GameState {
  const draft: GameState = {
    ...structuredClone({ ...state, journal: [], chronicle: [] }),
    journal: state.journal.slice(),
    chronicle: state.chronicle.slice(),
  };
  const rng = createRng(draft.rngState);
  fn(draft, rng);
  draft.rngState = rng.state;
  return draft;
}
