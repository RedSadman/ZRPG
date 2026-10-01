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
    ],
    boss: 'shadowWolfKing',
    herbValue: 10,
  },
];

export function zoneFor(level: number): ZoneDef {
  return ZONES.find((z) => level <= z.maxLevel) ?? ZONES.at(-1)!;
}
