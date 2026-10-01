// Realm 0 is the mortal start; each later realm has 9 stages. Level L counts stages: 0 mortal, 1–9 realm 1, 10–18 realm 2…

export interface RealmDef {
  key: string;
  lifespanYears: number;
}

export const REALMS: RealmDef[] = [
  { key: 'mortal', lifespanYears: 80 },
  { key: 'qiCondensation', lifespanYears: 120 },
  { key: 'foundation', lifespanYears: 200 },
  { key: 'goldenCore', lifespanYears: 500 },
  { key: 'nascentSoul', lifespanYears: 1000 },
  { key: 'spiritTransformation', lifespanYears: 2000 },
  { key: 'daoUnion', lifespanYears: 5000 },
];

export const STAGES_PER_REALM = 9;

/** The peak of Dao Union. Beyond it lies only Ascension, which no dream can grant. */
export const MAX_LEVEL = 54;

/** From Golden Core on, crossing into a realm calls down the Heavenly Tribulation. */
export const TRIBULATION_FROM_LEVEL = 19;

/**
 * Months that one dreamed tick stands for, by realm. Lives in the high realms span centuries, so their time is told
 * in larger strides.
 */
export const MONTHS_PER_TICK = [1, 1, 1, 3, 6, 12, 24];

/**
 * How much more qi a stage costs in each realm. It grows faster than time stretches, so the high realms take a large
 * share even of a very long life: a dream at the top moves a few stages, not a few realms.
 */
export const QI_COST_MULT = [1, 1, 1, 6, 24, 96, 384];
