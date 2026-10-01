export interface ZoneDef {
  key: string;
  /** Highest hero level that still hunts here. */
  maxLevel: number;
  enemies: Array<{ key: string; weight: number }>;
  /** Empty for zones without a boss. */
  boss: string;
  herbValue: number;
  /**
   * Fixed enemy levels, for places whose population does not care who walks in. Without it, encounters are
   * drawn around the hero's level with a long tail upwards.
   */
  levels?: Array<{ level: number; weight: number }>;
}

export const ZONES: ZoneDef[] = [
  {
    // Mortals cannot travel far; the woods by the village are mostly mortal beasts and the odd stray cultivator.
    key: 'villageWoods',
    maxLevel: 0,
    enemies: [
      { key: 'spiritBoar', weight: 35 },
      { key: 'greyWolf', weight: 35 },
      { key: 'banditCultivator', weight: 20 },
    ],
    boss: '',
    herbValue: 2,
    levels: [
      { level: 0, weight: 92 },
      { level: 1, weight: 5 },
      { level: 2, weight: 2 },
      { level: 4, weight: 1 },
    ],
  },
  {
    key: 'azureFoothills',
    maxLevel: 9,
    enemies: [
      { key: 'spiritBoar', weight: 30 },
      { key: 'greyWolf', weight: 30 },
      { key: 'banditCultivator', weight: 20 },
      { key: 'bullyDisciple', weight: 8 },
      { key: 'bloodMoonCultist', weight: 4 },
    ],
    boss: 'blackRavineChief',
    herbValue: 3,
  },
  {
    key: 'thousandBeastForest',
    maxLevel: 18,
    enemies: [
      { key: 'shadowWolf', weight: 30 },
      { key: 'spiritSerpent', weight: 25 },
      { key: 'ironbackBear', weight: 20 },
      { key: 'banditCultivator', weight: 10 },
      { key: 'youngMaster', weight: 8 },
      { key: 'bloodMoonCultist', weight: 6 },
    ],
    boss: 'shadowWolfKing',
    herbValue: 10,
  },
  {
    key: 'poisonMistSwamps',
    maxLevel: 27,
    enemies: [
      { key: 'venomToad', weight: 30 },
      { key: 'mireCrocodile', weight: 25 },
      { key: 'spiritSerpent', weight: 10 },
      { key: 'cultAdept', weight: 18 },
      { key: 'youngMaster', weight: 6 },
    ],
    boss: 'cultElder',
    herbValue: 30,
  },
  {
    key: 'burningSands',
    maxLevel: 36,
    enemies: [
      { key: 'flameScorpion', weight: 30 },
      { key: 'sandWyrm', weight: 25 },
      { key: 'ruinSpirit', weight: 20 },
      { key: 'cultAdept', weight: 10 },
    ],
    boss: 'fireDragonScorpion',
    herbValue: 80,
  },
  {
    key: 'northernIsles',
    maxLevel: 45,
    enemies: [
      { key: 'seaSerpent', weight: 30 },
      { key: 'stormHawk', weight: 25 },
      { key: 'pirateCultivator', weight: 20 },
      { key: 'cultAdept', weight: 10 },
    ],
    boss: 'islandTurtle',
    herbValue: 200,
  },
  {
    key: 'heavenlyStairs',
    maxLevel: 54,
    enemies: [
      { key: 'heavenGuard', weight: 30 },
      { key: 'heartIllusion', weight: 25 },
      { key: 'cultAdept', weight: 15 },
    ],
    boss: 'bloodMoonPatriarch',
    herbValue: 500,
  },
];

export function zoneFor(level: number): ZoneDef {
  return ZONES.find((z) => level <= z.maxLevel) ?? ZONES.at(-1)!;
}
