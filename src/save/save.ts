import type { GameState } from '../engine/types';

export const SAVE_KEY = 'zrpg.save';
export const SAVE_VERSION = 1;

export interface SaveFile {
  version: number;
  savedAt: number;
  /** Wall-clock time of the last applied tick; offline catch-up counts from here. */
  lastTickAt: number;
  state: GameState;
}

/** Upgrades a save from version `n` to `n + 1`. Add one entry per schema change. */
const migrations: Record<number, (old: SaveFile) => SaveFile> = {};

export function serialize(state: GameState, lastTickAt: number, now: number): string {
  const file: SaveFile = { version: SAVE_VERSION, savedAt: now, lastTickAt, state };
  return JSON.stringify(file);
}

/** Parses and migrates a save. Returns null for garbage or a save from a newer game version. */
export function deserialize(json: string): SaveFile | null {
  let file: SaveFile;
  try {
    file = JSON.parse(json) as SaveFile;
  } catch {
    return null;
  }
  if (typeof file?.version !== 'number' || file.version > SAVE_VERSION || !file.state) return null;
  while (file.version < SAVE_VERSION) {
    const migrate = migrations[file.version];
    if (!migrate) return null;
    file = migrate(file);
  }
  return file;
}

export function loadSave(storage: Storage): SaveFile | null {
  try {
    const json = storage.getItem(SAVE_KEY);
    return json ? deserialize(json) : null;
  } catch {
    return null;
  }
}

export function writeSave(storage: Storage, state: GameState, lastTickAt: number, now: number): void {
  try {
    storage.setItem(SAVE_KEY, serialize(state, lastTickAt, now));
  } catch {
    // Storage may be full or blocked (private mode); the game keeps running unsaved.
  }
}

export function clearSave(storage: Storage): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // Same as above.
  }
}
