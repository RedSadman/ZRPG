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
