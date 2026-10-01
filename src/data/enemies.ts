// Multipliers on the shared level curve (see engine/combat.ts `enemyCombatant`).

export interface EnemyDef {
  kind: 'beast' | 'human';
  hp: number;
  atk: number;
  agi: number;
  armor: number;
  /** Spirit-stone value of the trophy it drops; 0 = none. */
  trophy: number;
  /** Base spirit stones carried; 0 = none. */
  stones: number;
  itemChance: number;
  technique?: { k: number; cost: number };
  boss?: true;
  /** Arrogant young masters and bullies: always worth a journal line. */
  rival?: true;
  /** Servants of the Blood Moon Cult; the righteous fight them on sight. */
  demonic?: true;
}

export const ENEMIES: Record<string, EnemyDef> = {
  spiritBoar: { kind: 'beast', hp: 1.0, atk: 0.9, agi: 0.7, armor: 1.2, trophy: 2, stones: 0, itemChance: 0.05 },
  greyWolf: { kind: 'beast', hp: 0.8, atk: 1.0, agi: 1.2, armor: 0.8, trophy: 3, stones: 0, itemChance: 0.05 },
  banditCultivator: {
    kind: 'human',
    hp: 0.9,
    atk: 1.0,
    agi: 1.0,
    armor: 1.0,
    trophy: 0,
    stones: 4,
    itemChance: 0.15,
    technique: { k: 0.4, cost: 5 },
  },
  bullyDisciple: {
    kind: 'human',
    hp: 0.9,
    atk: 0.9,
    agi: 1.0,
    armor: 1.0,
    trophy: 0,
    stones: 3,
    itemChance: 0.2,
    technique: { k: 0.5, cost: 5 },
    rival: true,
  },
  blackRavineChief: {
    kind: 'human',
    hp: 2.2,
    atk: 1.15,
    agi: 1.0,
    armor: 1.3,
    trophy: 0,
    stones: 40,
    itemChance: 1,
    technique: { k: 0.7, cost: 8 },
    boss: true,
  },
  shadowWolf: { kind: 'beast', hp: 1, atk: 1.3, agi: 1.3, armor: 0.8, trophy: 12, stones: 0, itemChance: 0.05 },
  spiritSerpent: { kind: 'beast', hp: 0.9, atk: 1.4, agi: 1.1, armor: 0.7, trophy: 14, stones: 0, itemChance: 0.05 },
  ironbackBear: { kind: 'beast', hp: 1.5, atk: 1.25, agi: 0.7, armor: 1.5, trophy: 16, stones: 0, itemChance: 0.05 },
  youngMaster: {
    kind: 'human',
    hp: 1.2,
    atk: 1.25,
    agi: 1.1,
    armor: 1.1,
    trophy: 0,
    stones: 15,
    itemChance: 0.4,
    technique: { k: 0.8, cost: 10 },
    rival: true,
  },
  bloodMoonCultist: {
    kind: 'human',
    hp: 1.1,
    atk: 1.2,
    agi: 1.0,
    armor: 1.0,
    trophy: 0,
    stones: 12,
    itemChance: 0.25,
    technique: { k: 0.9, cost: 9 },
    demonic: true,
  },
  // --- Golden Core: Poison Mist Swamps ---
  venomToad: { kind: 'beast', hp: 1.2, atk: 1.2, agi: 0.8, armor: 1.0, trophy: 40, stones: 0, itemChance: 0.06 },
  mireCrocodile: { kind: 'beast', hp: 1.5, atk: 1.3, agi: 0.8, armor: 1.6, trophy: 45, stones: 0, itemChance: 0.06 },
  cultAdept: {
    kind: 'human',
    hp: 1.1,
    atk: 1.3,
    agi: 1.1,
    armor: 1.0,
    trophy: 0,
    stones: 40,
    itemChance: 0.3,
    technique: { k: 1.1, cost: 12 },
    demonic: true,
  },
  cultElder: {
    kind: 'human',
    hp: 2.2,
    atk: 1.2,
    agi: 1.1,
    armor: 1.3,
    trophy: 0,
    stones: 400,
    itemChance: 1,
    technique: { k: 1.3, cost: 14 },
    boss: true,
    demonic: true,
  },
  // --- Nascent Soul: Burning Sands ---
  flameScorpion: { kind: 'beast', hp: 1.1, atk: 1.4, agi: 1.1, armor: 1.2, trophy: 90, stones: 0, itemChance: 0.06 },
  sandWyrm: { kind: 'beast', hp: 1.6, atk: 1.3, agi: 0.8, armor: 1.4, trophy: 100, stones: 0, itemChance: 0.06 },
  ruinSpirit: { kind: 'beast', hp: 0.9, atk: 1.5, agi: 1.3, armor: 0.6, trophy: 110, stones: 0, itemChance: 0.1 },
  fireDragonScorpion: { kind: 'beast', hp: 2.3, atk: 1.25, agi: 1.1, armor: 1.4, trophy: 1500, stones: 0, itemChance: 1, boss: true },
  // --- Spirit Transformation: Northern Isles ---
  seaSerpent: { kind: 'beast', hp: 1.4, atk: 1.3, agi: 1.1, armor: 1.1, trophy: 220, stones: 0, itemChance: 0.06 },
  stormHawk: { kind: 'beast', hp: 0.9, atk: 1.4, agi: 1.5, armor: 0.7, trophy: 200, stones: 0, itemChance: 0.06 },
  pirateCultivator: {
    kind: 'human',
    hp: 1.1,
    atk: 1.3,
    agi: 1.2,
    armor: 1.1,
    trophy: 0,
    stones: 200,
    itemChance: 0.35,
    technique: { k: 1.2, cost: 14 },
  },
  islandTurtle: { kind: 'beast', hp: 3, atk: 1.1, agi: 0.6, armor: 2, trophy: 4000, stones: 0, itemChance: 1, boss: true },
  // --- Dao Union: Heavenly Stairs ---
  heavenGuard: {
    kind: 'human',
    hp: 1.4,
    atk: 1.3,
    agi: 1.1,
    armor: 1.5,
    trophy: 0,
    stones: 600,
    itemChance: 0.3,
    technique: { k: 1.4, cost: 16 },
  },
  heartIllusion: { kind: 'beast', hp: 1.0, atk: 1.5, agi: 1.4, armor: 0.5, trophy: 600, stones: 0, itemChance: 0.1 },
  bloodMoonPatriarch: {
    kind: 'human',
    hp: 2.5,
    atk: 1.3,
    agi: 1.2,
    armor: 1.4,
    trophy: 0,
    stones: 5000,
    itemChance: 1,
    technique: { k: 1.6, cost: 18 },
    boss: true,
    demonic: true,
  },
  /** The old man with the manual. Not as frail as he looks. */
  hermit: {
    kind: 'human',
    hp: 1.3,
    atk: 1.3,
    agi: 1.2,
    armor: 1.2,
    trophy: 0,
    stones: 30,
    itemChance: 0.5,
    technique: { k: 1.0, cost: 10 },
  },
  shadowWolfKing: {
    kind: 'beast',
    hp: 2.2,
    atk: 1.15,
    agi: 1.3,
    armor: 1.2,
    trophy: 150,
    stones: 0,
    itemChance: 1,
    boss: true,
  },
};
