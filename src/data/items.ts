import type { Slot, StatKey } from '../engine/types.ts';

export const SLOTS: Slot[] = ['weapon', 'robe', 'bracers', 'boots', 'pendant', 'ring'];

/** Base item kinds; names live in i18n under the same keys. */
export const BASES: Record<string, Slot> = {
  sword: 'weapon',
  sabre: 'weapon',
  spear: 'weapon',
  fan: 'weapon',
  gauntlets: 'weapon',
  robe: 'robe',
  bracers: 'bracers',
  boots: 'boots',
  pendant: 'pendant',
  ring: 'ring',
};

export const ARMOR_BASES: Record<Exclude<Slot, 'weapon'>, string> = {
  robe: 'robe',
  bracers: 'bracers',
  boots: 'boots',
  pendant: 'pendant',
  ring: 'ring',
};

/** What each slot gives before affixes: [base, per level]. */
export const SLOT_STATS: Record<Slot, { weapon?: [number, number]; armor?: [number, number]; bonus?: StatKey }> = {
  weapon: { weapon: [3, 1.5] },
  robe: { armor: [1.5, 0.6] },
  bracers: { armor: [0.8, 0.3], bonus: 'agi' },
  boots: { armor: [0.5, 0.2], bonus: 'agi' },
  pendant: { bonus: 'qi' },
  ring: { bonus: 'luck' },
};

export type AffixStat = StatKey | 'weapon' | 'armor';

/** Affixes name the item ("Sword of Thousand Tears") and carry a real bonus. */
export const AFFIXES: Record<string, AffixStat> = {
  thousandTears: 'qi',
  forgottenDisciple: 'luck',
  azureCloud: 'agi',
  ironMountain: 'body',
  drunkenImmortal: 'luck',
  silentPine: 'mind',
  crimsonDawn: 'weapon',
  turtleShell: 'armor',
};

/** Mortal, Spirit, Earth, Heaven. */
export const RANKS = [
  { mult: 1.0, affixes: 0, weight: 70 },
  { mult: 1.2, affixes: 1, weight: 22 },
  { mult: 1.5, affixes: 2, weight: 7 },
  { mult: 2.0, affixes: 3, weight: 1 },
];
