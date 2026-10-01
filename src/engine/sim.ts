import { createRng, nextFloat, nextInt, type Rng } from './rng';
import type { GameEvent, GameState } from './types';

// Milestone 1 placeholder: a dream is just ageing, a few flavour events and a random death.
// Real states (sect, travel, combat, cultivation) replace `liveOneMonth` in milestone 2.

export const START_AGE_MONTHS = 16 * 12;
export const JOURNAL_LIMIT = 500;

export function newGame(seed: number): GameState {
  const state: GameState = {
    tick: 0,
    rngState: createRng(seed).state,
    hero: { nameKey: 'xiaoLin' },
    dream: { n: 1, ageMonths: START_AGE_MONTHS, spiritStones: 0, awake: false },
    journal: [],
    nextEntryId: 1,
  };
  record(state, { kind: 'dreamStart', dream: 1 });
  return state;
}

/** Advances one tick. Pure: the input state is not modified. */
export function step(state: GameState): GameState {
  return advance(state, 1);
}

/** Advances `ticks` ticks in one go (offline catch-up, fast-forward). Pure. */
export function advance(state: GameState, ticks: number): GameState {
  const draft = clone(state);
  const rng = createRng(draft.rngState);
  for (let i = 0; i < ticks; i++) applyTick(draft, rng);
  draft.rngState = rng.state;
  return draft;
}

/** Catches up after the player was away and leaves one summary line instead of a wall of text. */
export function catchUp(state: GameState, ticks: number): GameState {
  if (ticks <= 0) return state;
  const dreamsBefore = state.dream.n - (state.dream.awake ? 0 : 1);
  const draft = advance(state, ticks);
  const dreamsAfter = draft.dream.n - (draft.dream.awake ? 0 : 1);
  record(draft, { kind: 'away', months: ticks, dreamsEnded: dreamsAfter - dreamsBefore });
  return draft;
}

function applyTick(s: GameState, rng: Rng): void {
  s.tick += 1;

  if (s.dream.awake) {
    const n = s.dream.n + 1;
    s.dream = { n, ageMonths: START_AGE_MONTHS, spiritStones: 0, awake: false };
    record(s, { kind: 'dreamStart', dream: n });
    return;
  }

  s.dream.ageMonths += 1;
  if (nextFloat(rng) < deathChancePerMonth(s.dream.ageMonths)) {
    s.dream.awake = true;
    record(s, { kind: 'wake', dream: s.dream.n, ageMonths: s.dream.ageMonths });
    return;
  }

  liveOneMonth(s, rng);
}

function liveOneMonth(s: GameState, rng: Rng): void {
  const ageMonths = s.dream.ageMonths;
  const roll = nextFloat(rng);
  if (roll < 0.08) {
    record(s, { kind: 'meditate', ageMonths });
  } else if (roll < 0.12) {
    record(s, { kind: 'wander', ageMonths });
  } else if (roll < 0.15) {
    const amount = nextInt(rng, 1, 10);
    s.dream.spiritStones += amount;
    record(s, { kind: 'findStones', ageMonths, amount });
  }
}

/** ≈5% a year while young, climbing steeply after 60 — a mortal's life with no cultivation yet. */
export function deathChancePerMonth(ageMonths: number): number {
  const years = ageMonths / 12;
  return 0.004 + Math.max(0, years - 60) * 0.002;
}

function record(s: GameState, event: GameEvent): void {
  s.journal.push({ id: s.nextEntryId++, tick: s.tick, event });
  if (s.journal.length > JOURNAL_LIMIT) s.journal.splice(0, s.journal.length - JOURNAL_LIMIT);
}

function clone(s: GameState): GameState {
  return { ...s, hero: { ...s.hero }, dream: { ...s.dream }, journal: s.journal.slice() };
}
