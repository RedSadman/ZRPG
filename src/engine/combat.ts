import { COMBAT_TECHNIQUES } from '../data/techniques.ts';
import type { EnemyDef } from '../data/enemies.ts';
import { HEALING_PILL } from '../data/pills.ts';
import { DEATH_MEMORY, TALENT_EFFECTS } from '../data/talents.ts';
import { realmOf } from './levels.ts';
import { between, chance, nextFloat, type Rng } from './rng.ts';
import type { Life } from './types.ts';
import { effectiveStats, hasTalent, maxHp, totalArmor, weaponDamage } from './hero.ts';

export interface CombatTechnique {
  key: string;
  k: number;
  cost: number;
  stat: 'qi' | 'body';
}

export interface Combatant {
  level: number;
  maxHp: number;
  hp: number;
  body: number;
  qi: number;
  agi: number;
  luck: number;
  weapon: number;
  armor: number;
  qiPool: number;
  techniques: CombatTechnique[];
  /** Multiplies outgoing damage (memory of death against the one who killed you). */
  damageMult: number;
  /** Added to the chance of a successful retreat. */
  fleeBonus: number;
}

export type FightOutcome = 'won' | 'fled' | 'rescued' | 'lost';

export interface FightResult {
  outcome: FightOutcome;
  heroHp: number;
  pillsUsed: number;
  techniqueUses: Record<string, number>;
  /** The hero dropped below 15% HP at some point and still won. */
  closeCall: boolean;
  rounds: number;
}

const MAX_ROUNDS = 40;
/** Below this share of HP the hero drinks a pill or, without one, tries to run. */
const LOW_HP = 0.35;

export function heroCombatant(life: Life, enemyKey?: string): Combatant {
  const stats = effectiveStats(life);
  const hp = maxHp(life);
  return {
    level: life.level,
    maxHp: hp,
    hp: Math.min(life.hp, hp),
    body: stats.body,
    qi: stats.qi,
    agi: stats.agi,
    luck: stats.luck,
    weapon: weaponDamage(life),
    armor: totalArmor(life),
    qiPool: 10 + stats.qi * 4 + life.level * 4,
    techniques: life.techniques.map((t) => {
      const def = COMBAT_TECHNIQUES[t.key]!;
      // Mastery: +5% per 10 uses, up to +45%.
      return { key: t.key, k: def.k * (1 + 0.05 * Math.min(9, Math.floor(t.uses / 10))), cost: def.cost, stat: def.stat };
    }),
    damageMult:
      enemyKey && hasTalent(life.talents, DEATH_MEMORY, enemyKey) ? TALENT_EFFECTS.deathMemoryDamage : 1,
    fleeBonus: hasTalent(life.talents, 'quickStep') ? TALENT_EFFECTS.quickStepFlee : 0,
  };
}

/** Enemies use the same level curve as the hero, scaled by their template. */
export function enemyCombatant(def: EnemyDef, level: number): Combatant {
  const stat = 5 + 0.6 * level;
  const body = stat;
  const hp = Math.round((40 + body * 6 + level * 10) * def.hp);
  return {
    level,
    maxHp: hp,
    hp,
    body,
    qi: stat,
    agi: stat * def.agi,
    luck: 3,
    weapon: (3 + 1.5 * level) * def.atk,
    armor: (1 + 0.8 * level) * def.armor,
    qiPool: 10 + stat * 4,
    techniques: def.technique ? [{ key: 'enemy', k: def.technique.k, cost: def.technique.cost, stat: 'qi' }] : [],
    damageMult: 1,
    fleeBonus: 0,
  };
}

export function fight(hero: Combatant, foe: Combatant, pills: number, luckForRescue: number, rng: Rng): FightResult {
  const me = { ...hero };
  const them = { ...foe };
  const uses: Record<string, number> = {};
  let pillsUsed = 0;
  let lowest = me.hp / me.maxHp;
  let round = 0;

  while (round < MAX_ROUNDS) {
    round++;
    const heroFirst = me.agi + nextFloat(rng) * 5 >= them.agi + nextFloat(rng) * 5;
    const order: Array<[Combatant, Combatant]> = heroFirst
      ? [
          [me, them],
          [them, me],
        ]
      : [
          [them, me],
          [me, them],
        ];
    for (const [att, def] of order) {
      if (att.hp <= 0 || def.hp <= 0) continue;
      const used = attack(att, def, rng);
      if (used && att === me) uses[used] = (uses[used] ?? 0) + 1;
    }

    lowest = Math.min(lowest, me.hp / me.maxHp);
    if (them.hp <= 0) return result('won');
    if (me.hp <= 0) {
      if (chance(rng, 0.05 + 0.005 * luckForRescue)) return result('rescued', 1);
      return result('lost', 0);
    }

    if (me.hp < me.maxHp * LOW_HP) {
      if (pills - pillsUsed > 0) {
        pillsUsed++;
        me.hp = Math.min(me.maxHp, me.hp + me.maxHp * HEALING_PILL.heal);
      } else if (them.hp > them.maxHp * 0.4) {
        const fleeChance = Math.min(0.9, Math.max(0.05, 0.4 + me.fleeBonus + 0.02 * (me.agi - them.agi)));
        if (chance(rng, fleeChance)) return result('fled');
      }
    }
  }
  // Nobody fell in time; both sides back off.
  return result('fled');

  function result(outcome: FightOutcome, hp = me.hp): FightResult {
    return {
      outcome,
      heroHp: Math.max(0, Math.round(hp)),
      pillsUsed,
      techniqueUses: uses,
      closeCall: outcome === 'won' && lowest < 0.15,
      rounds: round,
    };
  }
}

/** One blow. Returns the technique key if one was used. */
function attack(att: Combatant, def: Combatant, rng: Rng): string | null {
  const tech = att.techniques
    .filter((t) => t.cost <= att.qiPool)
    .sort((a, b) => b.k * statValue(att, b) - a.k * statValue(att, a))[0];
  if (tech) att.qiPool -= tech.cost;

  const hitChance = Math.min(0.95, Math.max(0.4, 0.75 + 0.02 * (att.agi - def.agi)));
  if (!chance(rng, hitChance)) return tech?.key ?? null;

  const realmGap = realmOf(att.level) - realmOf(def.level);
  let dmg = (att.weapon + 0.5 * att.body + (tech ? tech.k * statValue(att, tech) : 0)) * between(rng, 0.85, 1.15);
  dmg = dmg * att.damageMult * 1.5 ** realmGap - 0.5 * def.armor;
  if (chance(rng, 0.05 + 0.005 * att.luck)) dmg *= 2;
  def.hp -= Math.max(1, dmg);
  return tech?.key ?? null;
}

function statValue(c: Combatant, t: CombatTechnique): number {
  return t.stat === 'qi' ? c.qi : c.body;
}
