// How the dreamer behaves when nobody is choosing for them. Instincts change decisions, not numbers:
// how the hero sizes up a fight, which work they take, when they run, when they dare a breakthrough.

export type Instinct = 'cautious' | 'bold' | 'greedy' | 'righteous';

export interface InstinctDef {
  /** Multiplies the hero's own side when sizing up a fight: above 1 overrates, below 1 underrates. */
  selfImage: number;
  /** Lowest estimated chance of winning at which the hero picks a fight instead of slipping away. */
  engageAt: number;
  /** The same against demonic cultivators. */
  engageDemonAt: number;
  /** Lowered for foes that carry stones (greed clouds the eyes). */
  lootLust: number;
  /** Below this share of HP the hero drinks a pill or runs. */
  fleeAt: number;
  maxHuntMonths: number;
  /** Heads back to the sect when HP falls below this share and no pills are left. */
  returnAtHp: number;
  /** Keeps hunting until the bag is full. */
  fillsBag: boolean;
  /** How far behind (in levels) gear may fall before paying the armory. */
  armoryLag: number;
  /** What a gain is worth to this temperament when choosing work from the board. */
  values: { stones: number; contribution: number; karma: number; power: number };
  /** What each required fight in a task is worth: negative for those who would rather not fight at all. */
  fightTaste: number;
  /** How much an estimated risk of dying weighs against the gains. */
  riskAversion: number;
  /** Skips work that pays fewer stones than the board's average. */
  wantsPay: boolean;
  /** Chance to turn down a payment it feels it has not earned. */
  declineChance: number;
  /** Will not try a realm gate without a breakthrough pill (for a while). */
  waitsForPill: boolean;
  /** Which foe a task is judged by: the worst it could send, an average one, or the easiest. */
  plansFor: 'worst' | 'average' | 'best';
  /** Goes after the zone's boss from this stage of the realm on. */
  bossFromStage: number;
}

export const INSTINCTS: Record<Instinct, InstinctDef> = {
  cautious: {
    selfImage: 0.85,
    engageAt: 0.85,
    engageDemonAt: 0.9,
    lootLust: 0,
    fleeAt: 0.45,
    maxHuntMonths: 8,
    returnAtHp: 0.45,
    fillsBag: false,
    armoryLag: 0,
    values: { stones: 1, contribution: 1, karma: 0.5, power: 1 },
    fightTaste: -0.5,
    riskAversion: 20,
    wantsPay: false,
    declineChance: 0,
    waitsForPill: true,
    plansFor: 'worst',
    bossFromStage: 9,
  },
  bold: {
    selfImage: 1.2,
    engageAt: 0.5,
    engageDemonAt: 0.5,
    lootLust: 0,
    fleeAt: 0.25,
    maxHuntMonths: 14,
    returnAtHp: 0.2,
    fillsBag: false,
    armoryLag: 1,
    values: { stones: 0.6, contribution: 1, karma: 0.3, power: 2.5 },
    fightTaste: 0.2,
    riskAversion: 1,
    wantsPay: false,
    declineChance: 0,
    waitsForPill: false,
    plansFor: 'best',
    bossFromStage: 7,
  },
  greedy: {
    selfImage: 1,
    engageAt: 0.65,
    engageDemonAt: 0.7,
    lootLust: 0.15,
    fleeAt: 0.35,
    maxHuntMonths: 12,
    returnAtHp: 0.3,
    fillsBag: true,
    armoryLag: 3,
    values: { stones: 2.5, contribution: 0.4, karma: 0, power: 1 },
    fightTaste: 0,
    riskAversion: 3,
    wantsPay: true,
    declineChance: 0,
    waitsForPill: false,
    plansFor: 'average',
    bossFromStage: 8,
  },
  righteous: {
    selfImage: 1,
    engageAt: 0.65,
    engageDemonAt: 0.3,
    lootLust: 0,
    fleeAt: 0.35,
    maxHuntMonths: 12,
    returnAtHp: 0.3,
    fillsBag: false,
    armoryLag: 1,
    values: { stones: 0.3, contribution: 1.5, karma: 2.5, power: 1 },
    fightTaste: 0,
    riskAversion: 3,
    wantsPay: false,
    declineChance: 0.25,
    waitsForPill: false,
    plansFor: 'average',
    bossFromStage: 9,
  },
};

export const INSTINCT_KEYS = Object.keys(INSTINCTS) as Instinct[];
