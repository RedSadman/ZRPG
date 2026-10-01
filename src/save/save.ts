import { PATHS } from '../data/paths.ts';
import { CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { CHARGE_MAX, DEFAULT_PRIORITY } from '../engine/reality.ts';
import type { GameState } from '../engine/types.ts';

export const SAVE_KEY = 'zrpg.save';
export const SAVE_VERSION = 4;

export interface SaveFile {
  version: number;
  savedAt: number;
  /** Wall-clock time of the last applied tick; offline catch-up counts from here. */
  lastTickAt: number;
  state: GameState;
}

/** Upgrades a save from version `n` to `n + 1`. Add one entry per schema change. */
const migrations: Record<number, (old: SaveFile) => SaveFile> = {
  // v2 → v3: the real hero, rewards, charges and the autopilot arrive. Old saves get a hero with no progress yet.
  2: (old) => {
    const s = old.state as any;
    const awake: boolean = s.awake;
    delete s.awake;
    Object.assign(s.hero, {
      level: 0,
      qi: 0,
      techniques: [{ key: PATHS[s.hero.path as keyof typeof PATHS].technique, uses: 0 }],
      cultivation: CULTIVATION_TECHNIQUES[0]!.key,
      equipment: {},
      talents: [],
      injuryBeats: 0,
    });
    Object.assign(s.life, { talents: [], startProgress: 0 });
    Object.assign(s, {
      beat: 0,
      phase: awake ? 'resting' : 'dreaming',
      offer: null,
      charges: CHARGE_MAX,
      chargeBeats: 0,
      autopilot: { enabled: false, priority: [...DEFAULT_PRIORITY] },
      dreamsEnded: s.life.n - (awake ? 0 : 1),
    });
    return { ...old, version: 3, state: s as GameState };
  },
  // v3 → v4: instincts, dream setup, forks, knowledge and fate points.
  3: (old) => {
    const s = old.state as any;
    Object.assign(s.hero, { knowledge: [], fate: 0 });
    Object.assign(s.life, {
      path: s.hero.path,
      instinct: 'cautious',
      start: 'azureCloudSect',
      luckBonus: 0,
      fork: null,
      discoveries: [],
      remembered: [],
    });
    if (!s.autopilot.priority.includes('knowledge')) s.autopilot.priority.unshift('knowledge');
    Object.assign(s, {
      setup: { instinct: 'cautious', path: s.hero.path, start: 'azureCloudSect', blessing: false },
      waitForMe: false,
    });
    return { ...old, version: 4, state: s as GameState };
  },
};

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
