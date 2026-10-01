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

/** Highest reachable level for now: Golden Core needs Heavenly Tribulation (milestone 5). */
export const MAX_LEVEL = 18;
