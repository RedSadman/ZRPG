// Everything here must stay plain JSON: the save file is this state, and a future server will replay it.

export type GameEvent =
  | { kind: 'dreamStart'; dream: number }
  | { kind: 'meditate'; ageMonths: number }
  | { kind: 'wander'; ageMonths: number }
  | { kind: 'findStones'; ageMonths: number; amount: number }
  | { kind: 'wake'; dream: number; ageMonths: number }
  | { kind: 'away'; months: number; dreamsEnded: number };

export type EventKind = GameEvent['kind'];

export interface JournalEntry {
  id: number;
  tick: number;
  event: GameEvent;
}

export interface Dream {
  /** 1-based dream number ("Сон №n"). */
  n: number;
  ageMonths: number;
  spiritStones: number;
  /** The dreamer died and woke up; the next tick starts a new dream. */
  awake: boolean;
}

export interface GameState {
  tick: number;
  rngState: number;
  hero: { nameKey: string };
  dream: Dream;
  journal: JournalEntry[];
  nextEntryId: number;
}
