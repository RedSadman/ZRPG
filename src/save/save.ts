import { PATHS } from '../data/paths.ts';
import { CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { startingCrafts } from '../engine/crafts.ts';
import { CHARGE_MAX, DEFAULT_PRIORITY } from '../engine/reality.ts';
import { countDream, emptyStats } from '../engine/sim.ts';
import type { DreamSummary, GameState, Life } from '../engine/types.ts';

export const SAVE_KEY = 'zrpg.save';
export const SAVE_VERSION = 10;

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
  // v4 → v5: behaviour. Tasks come from a board now, so an old-style quest is dropped; karma and reputation start at zero.
  4: (old) => {
    const s = old.state as any;
    Object.assign(s.life, { quest: null, karma: 0, reputation: 0, pillWaits: 0 });
    s.life.trip.avoided = 0;
    return { ...old, version: 5, state: s as GameState };
  },
  // v5 → v6: peaceful tasks and spirit ore.
  5: (old) => {
    const s = old.state as any;
    if (s.life.quest) Object.assign(s.life.quest, { peaceful: false, inSect: false, ore: false });
    s.life.trip.ore = 0;
    return { ...old, version: 6, state: s as GameState };
  },
  // v6 → v7: the high realms, valor and the ending.
  6: (old) => {
    const s = old.state as any;
    s.life.valor = 0;
    s.ascended = false;
    return { ...old, version: 7, state: s as GameState };
  },
  // v7 → v8: crafts and business. Nobody has learned a craft yet; the dream in progress starts with an empty storehouse.
  7: (old) => {
    const s = old.state as any;
    s.hero.crafts = { alchemy: 0, forging: 0, talismans: 0 };
    s.life.crafts = startingCrafts(s.hero, s.life.path);
    Object.assign(s.life.pills, { gathering: 0, eaten: 0 });
    Object.assign(s.life, { talismans: { escape: 0, thunder: 0 }, mats: { herbs: 0, cores: 0, ore: 0 }, shop: { level: 0, till: 0 } });
    const priority: string[] = s.autopilot.priority;
    if (!priority.includes('craft')) priority.splice(Math.max(0, priority.indexOf('cultivation')), 0, 'craft');
    return { ...old, version: 8, state: s as GameState };
  },
  // v8 → v9: lifetime statistics, rebuilt as well as the Chronicle allows (it keeps only the latest dreams).
  8: (old) => {
    const s = old.state as any;
    s.stats = emptyStats();
    for (const summary of s.chronicle as DreamSummary[]) {
      countDream(s.stats, { instinct: summary.instinct ?? s.setup.instinct, bossesKilled: [] } as unknown as Life, summary);
    }
    return { ...old, version: 9, state: s as GameState };
  },
  // v9 → v10: secondary instincts, grudges, ranks in the sect, curious trips into the next region.
  9: (old) => {
    const s = old.state as any;
    s.setup.secondary = null;
    Object.assign(s.life, { secondary: null, grudge: null, sectRank: 0 });
    s.life.trip.peek = false;
    return { ...old, version: 10, state: s as GameState };
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
