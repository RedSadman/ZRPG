export interface ZoneDef {
  key: string;
  /** Highest hero level that still hunts here. */
  maxLevel: number;
  enemies: Array<{ key: string; weight: number }>;
  boss: string;
  herbValue: number;
}

export const ZONES: ZoneDef[] = [
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
