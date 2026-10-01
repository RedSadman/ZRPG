import { createRng, type Rng } from './rng.ts';
import { generateHero } from './hero.ts';
import { liveMonth, newLife, type Emit } from './dream.ts';
import type { DreamSummary, GameEvent, GameState, Life } from './types.ts';

export { START_AGE_MONTHS } from './dream.ts';

export const JOURNAL_LIMIT = 500;
export const CHRONICLE_LIMIT = 100;
/** A step stops at the next journal line; this caps how many silent months one step may skip. */
export const MAX_QUIET_MONTHS = 600;
const SUMMARY_HIGHLIGHTS = 8;

export function newGame(seed: number): GameState {
  const rng = createRng(seed);
  const hero = generateHero(rng);
  const state: GameState = {
    tick: 0,
    rngState: 0,
    hero,
    life: newLife(hero, 1),
    awake: false,
    journal: [],
    nextEntryId: 1,
    chronicle: [],
  };
  beginDream(state);
  state.rngState = rng.state;
  return state;
}

/** Plays forward to the next journal line (the UI calls this once per beat). Pure. */
export function step(state: GameState): GameState {
  return advanceSteps(state, 1);
}

export function advanceSteps(state: GameState, steps: number): GameState {
  const draft = clone(state);
  const rng = createRng(draft.rngState);
  for (let i = 0; i < steps; i++) {
    const before = draft.nextEntryId;
    for (let m = 0; m < MAX_QUIET_MONTHS && draft.nextEntryId === before; m++) applyMonth(draft, rng);
  }
  draft.rngState = rng.state;
  return draft;
}

/** Plays forward exactly `months` dreamed months. Pure. */
export function advanceMonths(state: GameState, months: number): GameState {
  const draft = clone(state);
  const rng = createRng(draft.rngState);
  for (let i = 0; i < months; i++) applyMonth(draft, rng);
  draft.rngState = rng.state;
  return draft;
}

/** Catches up after the player was away and leaves one summary line instead of a wall of text. */
export function catchUp(state: GameState, steps: number): GameState {
  if (steps <= 0) return state;
  const draft = advanceSteps(state, steps);
  const dreamsEnded = dreamsCompleted(draft) - dreamsCompleted(state);
  record(draft, { kind: 'away', months: draft.tick - state.tick, dreamsEnded });
  return draft;
}

export function dreamsCompleted(state: GameState): number {
  return state.life.n - (state.awake ? 0 : 1);
}

function applyMonth(s: GameState, rng: Rng): void {
  s.tick += 1;
  if (s.awake) {
    s.life = newLife(s.hero, s.life.n + 1);
    s.awake = false;
    beginDream(s);
    return;
  }
  liveMonth(s, rng, emitter(s));
  if (s.life.death) wake(s);
}

function beginDream(s: GameState): void {
  const { hero, life } = s;
  record(s, { kind: 'dreamStart', dream: life.n });
  record(s, { kind: 'joinSect', ageMonths: life.ageMonths, root: hero.root, path: hero.path });
}

function wake(s: GameState): void {
  const life = s.life;
  const summary = summarize(life);
  s.chronicle.push(summary);
  if (s.chronicle.length > CHRONICLE_LIMIT) s.chronicle.splice(0, s.chronicle.length - CHRONICLE_LIMIT);
  record(s, { kind: 'wake', dream: life.n, score: summary.score });
  s.awake = true;
}

export function lifeScore(life: Life): number {
  return life.level * 10 + Math.floor(life.ageMonths / 24) + life.bossesKilled.length * 15 + Math.floor(life.totals.kills / 10);
}

function summarize(life: Life): DreamSummary {
  const top = life.highlights
    .map((h, i) => ({ ...h, i }))
    .sort((a, b) => b.priority - a.priority || a.i - b.i)
    .slice(0, SUMMARY_HIGHLIGHTS)
    .sort((a, b) => a.i - b.i)
    .map((h) => h.event);
  return {
    n: life.n,
    ageMonths: life.ageMonths,
    level: life.level,
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

/** Deep enough that the engine can mutate the draft without touching the caller's state. */
function clone(s: GameState): GameState {
  return { ...structuredClone({ ...s, journal: [], chronicle: [] }), journal: s.journal.slice(), chronicle: s.chronicle.slice() };
}
