// Permanent traits the hero can carry out of a dream. Higher-quality dreams unlock rarer ones.

export interface TalentDef {
  key: string;
  /** Lowest reward quality (0–2) at which it can be offered. */
  minQuality: number;
  weight: number;
}

export const TALENTS: TalentDef[] = [
  { key: 'ironSkin', minQuality: 0, weight: 10 },
  { key: 'quickStep', minQuality: 0, weight: 10 },
  { key: 'goldenTouch', minQuality: 0, weight: 8 },
  { key: 'luckyStar', minQuality: 0, weight: 8 },
  { key: 'steadyHeart', minQuality: 1, weight: 8 },
  { key: 'qiSponge', minQuality: 1, weight: 8 },
  { key: 'rootRefine', minQuality: 2, weight: 4 },
];

/** Offered after a violent death: the hero remembers who killed them. */
export const DEATH_MEMORY = 'deathMemory';

/** Offered after dying under the Heavenly Tribulation: the next storm hurts less. */
export const THUNDER_SCAR = 'thunderScar';

export const TALENT_EFFECTS = {
  ironSkinHp: 1.1,
  quickStepFlee: 0.15,
  goldenTouchValue: 1.2,
  luckyStarLuck: 3,
  steadyHeartBreakthrough: 0.1,
  qiSpongeRate: 1.1,
  deathMemoryDamage: 1.25,
  thunderScarDamage: 0.75,
};
