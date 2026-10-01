import { ENEMIES } from '../data/enemies.ts';
import { INSTINCTS } from '../data/instincts.ts';
import { BLESSING_LUCK, HIDDEN_SPRING_MIN_LEVEL, HIDDEN_SPRING_QI, startPlace } from '../data/knowledge.ts';
import { PATHS } from '../data/paths.ts';
import { BREAKTHROUGH_PILLS, HEALING_PILL } from '../data/pills.ts';
import { MAX_LEVEL } from '../data/realms.ts';
import { RIVAL_SURNAMES } from '../data/rivals.ts';
import { TALENT_EFFECTS } from '../data/talents.ts';
import { COMBAT_TECHNIQUES, CULTIVATION_TECHNIQUES, LIBRARY, MAX_COMBAT_TECHNIQUES } from '../data/techniques.ts';
import { zoneFor, type ZoneDef } from '../data/zones.ts';
import { enemyCombatant, fight, heroCombatant } from './combat.ts';
import { maybeFork } from './forks.ts';
import { bagCapacity, bagCount, cultivationRate, effectiveStats, growStats, hasTalent, maxHp } from './hero.ts';
import { isRealmGate, lifespanMonths, qiToReach, realmOf, stageOf, totalProgress } from './levels.ts';
import { itemPower, makeItem, rollRank, sellValue, starterItem, takeItem } from './loot.ts';
import { between, chance, nextInt, pick, pickWeighted, type Rng } from './rng.ts';
import type { Activity, DeathCause, DreamSetup, GameEvent, GameState, Hero, Life, Slot } from './types.ts';

export const START_AGE_MONTHS = 16 * 12;

/** Records a journal line; priority ≥ 3 also makes it a candidate for the dream's summary. */
export type Emit = (event: GameEvent, priority?: number) => void;

// Tuning knobs for a dreamed month.
const ENCOUNTER_CHANCE = 0.75;
const TRAVEL_ENCOUNTER_CHANCE = 0.15;
const HUNT_REGEN = 0.1;
const MAX_MEDITATION_MONTHS = 36;
/**
 * Encounters are drawn around the hero's level with a long tail upwards, and nothing caps them at the realm's
 * edge: a cultivator a whole realm above can walk out of the trees on any day.
 */
const LEVEL_OFFSETS = [
  { offset: -2, weight: 14 },
  { offset: -1, weight: 22 },
  { offset: 0, weight: 28 },
  { offset: 1, weight: 17 },
  { offset: 2, weight: 9 },
  { offset: 3, weight: 5 },
  { offset: 4, weight: 3 },
  { offset: 6, weight: 1.5 },
  { offset: 9, weight: 0.5 },
];
/** Share of the next level's qi gained per level of difference when beating a stronger foe. */
const BATTLE_INSIGHT = 0.06;
/** A foe this many levels above, or from a higher realm, can be sensed and avoided. */
const SENSE_GAP = 3;
const ARMORY_SLOTS: Slot[] = ['weapon', 'robe', 'bracers', 'boots'];
/** The armory does not always have what you need. */
const ARMORY_STOCK_CHANCE = 0.6;

export function defaultSetup(hero: Hero): DreamSetup {
  return { instinct: 'cautious', path: hero.path, start: 'azureCloudSect', blessing: false };
}

/** A new dream starts from everything the real hero has, shaped by the player's setup for this dream. */
export function newLife(hero: Hero, n: number, setup: DreamSetup = defaultSetup(hero)): Life {
  const place = startPlace(setup.start);
  const techniques = hero.techniques.map((t) => ({ ...t }));
  const pathTechnique = PATHS[setup.path].technique;
  if (!techniques.some((t) => t.key === pathTechnique) && techniques.length < MAX_COMBAT_TECHNIQUES) {
    techniques.push({ key: pathTechnique, uses: 0 });
  }
  const life: Life = {
    n,
    ageMonths: START_AGE_MONTHS,
    level: hero.level,
    qi: hero.qi,
    stats: { ...hero.stats },
    hp: 0,
    equipment: startingGear(hero, setup),
    bag: { trophyValue: 0, trophies: 0, items: [] },
    stones: 0,
    contribution: 0,
    pills: { healing: place.startPills, breakthrough: null },
    techniques,
    cultivation: hero.cultivation,
    activity: 'sect',
    monthsInActivity: 0,
    plan: 'hunt',
    quest: null,
    injuryMonths: 0,
    bossesKilled: [],
    wallHit: false,
    trip: { months: 0, kills: 0, herbs: 0, bossTried: false, rivalNoted: false },
    totals: { fights: 0, wins: 0, flees: 0, kills: 0 },
    highlights: [],
    death: null,
    talents: hero.talents.map((t) => ({ ...t })),
    startProgress: totalProgress(hero.level, hero.qi),
    path: setup.path,
    instinct: setup.instinct,
    start: place.key,
    luckBonus: setup.blessing ? BLESSING_LUCK : 0,
    fork: null,
    discoveries: [],
    remembered: [],
  };
  life.hp = maxHp(life);
  return life;
}

/**
 * A dream that starts at Foundation Establishment starts with a Foundation cultivator's plain gear, not a wooden
 * sword. Items brought back from earlier dreams replace it when they are better.
 */
function startingGear(hero: Hero, setup: DreamSetup): Life['equipment'] {
  const base: Record<Slot, string> = {
    weapon: PATHS[setup.path].weapons[0]!,
    robe: 'robe',
    bracers: 'bracers',
    boots: 'boots',
    pendant: 'pendant',
    ring: 'ring',
  };
  const slots: Slot[] = hero.level === 0 ? ['weapon', 'robe'] : ARMORY_SLOTS;
  const gear: Life['equipment'] = {};
  for (const slot of slots) gear[slot] = starterItem(slot, base[slot], hero.level);
  if (startPlace(setup.start).rankedBracers) {
    // The Iron Fist Clan hands every newcomer a pair of its own bracers.
    const bracers = starterItem('bracers', 'bracers', hero.level);
    bracers.rank = 1;
    bracers.affixes = ['ironMountain'];
    bracers.armor = Math.round(bracers.armor * 12) / 10;
    bracers.bonus = { ...bracers.bonus, body: Math.round((1 + 0.3 * hero.level) * 12) / 10 };
    gear.bracers = bracers;
  }
  for (const item of Object.values(hero.equipment)) {
    const current = gear[item.slot];
    if (!current || itemPower(item, setup.path) > itemPower(current, setup.path)) gear[item.slot] = structuredClone(item);
  }
  return gear;
}

/** Lives one month of the current dream. Sets `life.death` when the dream ends. */
export function liveMonth(s: GameState, rng: Rng, emit: Emit): void {
  const life = s.life;
  life.ageMonths += 1;
  life.monthsInActivity += 1;
  if (life.injuryMonths > 0) life.injuryMonths -= 1;

  if (life.ageMonths >= lifespanMonths(life.level)) {
    die(life, emit, 'oldAge');
    return;
  }

  switch (life.activity) {
    case 'sect':
      return sectMonth(s, rng, emit);
    case 'travel':
      return travelMonth(s, rng, emit);
    case 'hunt':
      return huntMonth(s, rng, emit);
    case 'returning':
      return returningMonth(s, emit);
    case 'meditate':
      return meditateMonth(s, rng, emit);
    case 'retired':
      return;
  }
}

export function go(life: Life, activity: Activity): void {
  life.activity = activity;
  life.monthsInActivity = 0;
}

export function die(life: Life, emit: Emit, cause: DeathCause, enemy?: string, enemyLevel?: number, enemyName?: string): void {
  life.death = enemy ? { cause, enemy, enemyLevel: enemyLevel ?? 0, ...(enemyName ? { enemyName } : {}) } : { cause };
  emit({ kind: 'death', ageMonths: life.ageMonths, death: life.death }, 10);
}

// --- Sect -------------------------------------------------------------------

function sectMonth(s: GameState, rng: Rng, emit: Emit): void {
  const { life } = s;
  const place = startPlace(life.start);
  const instinct = INSTINCTS[life.instinct];
  life.hp = maxHp(life);

  const sold = Math.round(life.bag.trophyValue) + life.bag.items.reduce((sum, i) => sum + sellValue(i), 0);
  life.stones += sold;
  life.bag = { trophyValue: 0, trophies: 0, items: [] };

  let contribution = 0;
  if (life.quest && life.quest.killed >= life.quest.needed) {
    contribution = Math.round((10 + 2 * life.level) * instinct.contributionMult);
    life.contribution += contribution;
    life.stones += 3 + life.level;
    life.quest = null;
  }
  if (sold > 0 || contribution > 0) emit({ kind: 'sect', ageMonths: life.ageMonths, sold, contribution }, 1);

  learnInLibrary(life, emit);
  visitArmory(s, rng);

  const pillPrice = Math.round(
    (HEALING_PILL.basePrice + HEALING_PILL.pricePerLevel * life.level) * PATHS[life.path].pillPriceMult * place.pillPriceMult,
  );
  while (life.pills.healing < HEALING_PILL.carryMax && life.stones >= pillPrice) {
    life.stones -= pillPrice;
    life.pills.healing += 1;
  }

  const gatePill = BREAKTHROUGH_PILLS[life.level + 1];
  if (gatePill && !life.pills.breakthrough && life.qi >= 0.6 * qiToReach(life.level + 1)) {
    const price = Math.round(gatePill.price * PATHS[life.path].pillPriceMult * place.pillPriceMult);
    if (life.stones >= price) {
      life.stones -= price;
      life.pills.breakthrough = gatePill.key;
    }
  }

  if (!life.quest) life.quest = newQuest(rng, zoneFor(life.level));

  const canCultivate = life.level < MAX_LEVEL || !life.wallHit;
  if (life.plan === 'meditate' && canCultivate) go(life, 'meditate');
  else go(life, 'travel');
}

function learnInLibrary(life: Life, emit: Emit): void {
  const currentIdx = CULTIVATION_TECHNIQUES.findIndex((t) => t.key === life.cultivation);
  const nextCult = CULTIVATION_TECHNIQUES[currentIdx + 1];
  if (nextCult && life.contribution >= nextCult.contribution) {
    life.contribution -= nextCult.contribution;
    life.cultivation = nextCult.key;
    emit({ kind: 'technique', ageMonths: life.ageMonths, technique: nextCult.key }, 5);
    return;
  }
  const next = nextLibraryTechnique(life);
  if (!next || life.contribution < COMBAT_TECHNIQUES[next]!.contribution) return;
  life.contribution -= COMBAT_TECHNIQUES[next]!.contribution;
  addTechnique(life, next);
  emit({ kind: 'technique', ageMonths: life.ageMonths, technique: next }, 5);
}

export function nextLibraryTechnique(life: Life): string | undefined {
  const known = new Set(life.techniques.map((t) => t.key));
  return LIBRARY.find((key) => !known.has(key));
}

/** Learns a technique, forgetting the weakest if all slots are taken. */
export function addTechnique(life: Life, key: string): void {
  if (life.techniques.length >= MAX_COMBAT_TECHNIQUES) {
    const weakest = life.techniques.reduce((a, b) => (COMBAT_TECHNIQUES[a.key]!.k <= COMBAT_TECHNIQUES[b.key]!.k ? a : b));
    life.techniques = life.techniques.filter((t) => t !== weakest);
  }
  life.techniques.push({ key, uses: 0 });
}

/**
 * Plain Mortal-rank gear of the hero's level, when the shelves have it and the instinct thinks it is worth the money.
 * A greedy dreamer lets gear fall well behind before paying.
 */
function visitArmory(s: GameState, rng: Rng): void {
  const { life } = s;
  const price = Math.round((6 + 4 * life.level) * startPlace(life.start).armoryPriceMult);
  const lag = INSTINCTS[life.instinct].armoryLag;
  for (const slot of ARMORY_SLOTS) {
    if (life.stones < price) return;
    if (!chance(rng, ARMORY_STOCK_CHANCE)) continue;
    const current = life.equipment[slot];
    if (current && current.level >= life.level - lag && current.rank === 0) continue;
    const offer = makeItem(rng, life.level, 0, life.path, slot);
    if (current && itemPower(offer, life.path) <= itemPower(current, life.path) * 1.1) continue;
    life.stones -= price;
    life.equipment[slot] = offer;
  }
}

function newQuest(rng: Rng, zone: ZoneDef) {
  return { enemy: pickWeighted(rng, zone.enemies).key, needed: nextInt(rng, 3, 6), killed: 0 };
}

// --- Travel and hunting -----------------------------------------------------

function travelMonth(s: GameState, rng: Rng, emit: Emit): void {
  const zone = zoneFor(s.life.level);
  if (maybeFork(s, rng, emit)) return;
  if (chance(rng, TRAVEL_ENCOUNTER_CHANCE)) {
    const humans = zone.enemies.filter((e) => ENEMIES[e.key]!.kind === 'human');
    encounter(s, rng, emit, pickWeighted(rng, humans).key, rollEnemyLevel(rng, s.life.level, zone));
    if (s.life.death || s.life.activity !== 'travel') return;
  }
  go(s.life, 'hunt');
}

function huntMonth(s: GameState, rng: Rng, emit: Emit): void {
  const { hero, life } = s;
  const zone = zoneFor(life.level);
  const instinct = INSTINCTS[life.instinct];
  life.trip.months += 1;
  const hpMax = maxHp(life);
  life.hp = Math.min(hpMax, life.hp + hpMax * HUNT_REGEN);
  life.qi = Math.min(qiToReach(life.level + 1), life.qi + qiPerMonth(hero, life) * instinct.huntQiShare);

  if (rememberOldZhangCave(s, zone, emit)) return;
  if (maybeFork(s, rng, emit)) return;

  const herbChance = PATHS[life.path].herbChance + startPlace(life.start).herbBonus;
  if (chance(rng, herbChance) && bagCount(life) < bagCapacity(life)) {
    life.bag.trophyValue += zone.herbValue * (1 + 0.1 * life.level);
    life.bag.trophies += 1;
    life.trip.herbs += 1;
  }

  const bossDue = zone.boss !== '' && stageOf(life.level) === 9 && !life.bossesKilled.includes(zone.boss) && !life.trip.bossTried;
  if (bossDue && life.monthsInActivity >= 2) {
    life.trip.bossTried = true;
    encounter(s, rng, emit, zone.boss, life.level, { avoidable: false });
  } else if (chance(rng, ENCOUNTER_CHANCE)) {
    encounter(s, rng, emit, pickWeighted(rng, zone.enemies).key, rollEnemyLevel(rng, life.level, zone));
  }
  if (life.death || life.activity !== 'hunt') return;

  const questDone = life.quest !== null && life.quest.killed >= life.quest.needed;
  const exhausted = life.hp < maxHp(life) * instinct.returnAtHp && life.pills.healing === 0;
  if (
    bagCount(life) >= bagCapacity(life) ||
    (questDone && life.monthsInActivity >= 3) ||
    exhausted ||
    life.monthsInActivity >= instinct.maxHuntMonths
  ) {
    go(life, 'returning');
  }
}

/** The cave from an earlier dream is still there: the old man's manual lies where you left it. */
function rememberOldZhangCave(s: GameState, zone: ZoneDef, emit: Emit): boolean {
  const { hero, life } = s;
  if (zone.key !== 'azureFoothills' || !hero.knowledge.includes('oldZhangCave') || life.remembered.includes('oldZhangCave')) {
    return false;
  }
  life.remembered.push('oldZhangCave');
  const technique = nextLibraryTechnique(life);
  if (technique) {
    addTechnique(life, technique);
    emit({ kind: 'remembered', ageMonths: life.ageMonths, knowledge: 'oldZhangCave', technique }, 6);
  } else {
    const amount = Math.round(qiToReach(life.level + 1) * 0.3);
    life.qi = Math.min(qiToReach(life.level + 1), life.qi + amount);
    emit({ kind: 'remembered', ageMonths: life.ageMonths, knowledge: 'oldZhangCave', amount }, 6);
  }
  return true;
}

function returningMonth(s: GameState, emit: Emit): void {
  const life = s.life;
  const { kills, herbs } = life.trip;
  if (kills + herbs > 0) {
    emit({ kind: 'hunt', ageMonths: life.ageMonths, zone: zoneFor(life.level).key, months: life.trip.months, kills, herbs }, 1);
  }
  life.trip = { months: 0, kills: 0, herbs: 0, bossTried: false, rivalNoted: false };
  life.plan = 'meditate';
  go(life, 'sect');
}

export function rollEnemyLevel(rng: Rng, heroLevel: number, zone: ZoneDef): number {
  if (zone.levels) return pickWeighted(rng, zone.levels).level;
  return Math.max(0, heroLevel + pickWeighted(rng, LEVEL_OFFSETS).offset);
}

export interface EncounterOptions {
  /** A foe the hero went looking for (boss, duel) cannot be slipped away from. */
  avoidable?: boolean;
  /** A duel: losing leaves you beaten, not dead. */
  lethal?: boolean;
  /** Start the fight with this share of the foe's HP (tired cultivators leaving a secret realm). */
  foeHp?: number;
  /** Fork fights are narrated by the fork itself. */
  quiet?: boolean;
}

export type EncounterResult = 'won' | 'fled' | 'sensed' | 'rescued' | 'lost' | 'beaten';

export function encounter(
  s: GameState,
  rng: Rng,
  emit: Emit,
  enemyKey: string,
  level: number,
  opts: EncounterOptions = {},
): EncounterResult {
  const { life } = s;
  const def = ENEMIES[enemyKey]!;
  const name = def.rival ? pick(rng, RIVAL_SURNAMES) : undefined;
  const note = (n: 'boss' | 'rival' | 'closeCall' | 'stronger' | 'fled' | 'rescued' | 'sensed', priority: number) => {
    if (opts.quiet) return;
    emit({ kind: 'fight', ageMonths: life.ageMonths, enemy: enemyKey, enemyLevel: level, note: n, ...(name ? { name } : {}) }, priority);
  };

  // Sensing the pressure of a far stronger qi, a wary cultivator can slip away before it starts.
  const overwhelming = level >= life.level + SENSE_GAP || realmOf(level) > realmOf(life.level);
  if ((opts.avoidable ?? true) && overwhelming) {
    const p = 0.35 + 0.02 * effectiveStats(life).mind + INSTINCTS[life.instinct].sense;
    if (chance(rng, Math.min(0.9, Math.max(0.05, p)))) {
      note('sensed', realmOf(level) > realmOf(life.level) ? 5 : 2);
      return 'sensed';
    }
  }

  const me = heroCombatant(life, enemyKey);
  const foe = enemyCombatant(def, level);
  if (opts.foeHp !== undefined) foe.hp = Math.round(foe.maxHp * opts.foeHp);
  const r = fight(me, foe, life.pills.healing, effectiveStats(life).luck, rng);

  life.hp = r.heroHp;
  life.pills.healing -= r.pillsUsed;
  for (const t of life.techniques) t.uses += r.techniqueUses[t.key] ?? 0;
  life.totals.fights += 1;

  switch (r.outcome) {
    case 'lost':
      if (opts.lethal === false) {
        life.hp = 1;
        life.injuryMonths = Math.max(life.injuryMonths, 6);
        return 'beaten';
      }
      die(life, emit, 'killed', enemyKey, level, name);
      return 'lost';
    case 'fled':
      life.totals.flees += 1;
      note('fled', 2);
      return 'fled';
    case 'rescued':
      note('rescued', 7);
      go(life, 'returning');
      return 'rescued';
    case 'won':
      break;
  }

  life.totals.wins += 1;
  life.totals.kills += 1;
  life.trip.kills += 1;
  if (level > life.level) {
    // Insight from beating someone stronger: the bold grow on danger.
    const need = qiToReach(life.level + 1);
    life.qi = Math.min(need, life.qi + need * BATTLE_INSIGHT * (level - life.level));
  }
  if (life.quest?.enemy === enemyKey) life.quest.killed += 1;

  if (def.boss) {
    life.bossesKilled.push(enemyKey);
    note('boss', 8);
  } else if (def.rival && !life.trip.rivalNoted) {
    // One arrogant young master per trip is a story; five is a chore.
    life.trip.rivalNoted = true;
    note('rival', 5);
  } else if (r.closeCall) note('closeCall', 4);
  else if (level >= life.level + 3) note('stronger', 3);

  const value = (hasTalent(life.talents, 'goldenTouch') ? TALENT_EFFECTS.goldenTouchValue : 1) * INSTINCTS[life.instinct].stonesMult;
  if (def.trophy > 0 && bagCount(life) < bagCapacity(life)) {
    life.bag.trophyValue += def.trophy * (1 + 0.15 * level) * value;
    life.bag.trophies += 1;
  }
  if (def.stones > 0) life.stones += Math.round(def.stones * (1 + 0.2 * level) * between(rng, 0.5, 1.5) * value);

  if (chance(rng, def.itemChance)) {
    const rank = rollRank(rng, effectiveStats(life).luck, def.boss ? 1 : 0);
    const item = makeItem(rng, level, rank, life.path);
    const equipped = takeItem(life, item, life.path);
    if (equipped && rank > 0 && !opts.quiet) emit({ kind: 'loot', ageMonths: life.ageMonths, item }, 2 + rank * 2);
  }
  return 'won';
}

// --- Cultivation ------------------------------------------------------------

export function qiPerMonth(hero: Hero, life: Life): number {
  const injury = life.injuryMonths > 0 ? 0.5 : 1;
  const spring = hero.knowledge.includes('hiddenSpring') && life.level >= HIDDEN_SPRING_MIN_LEVEL ? HIDDEN_SPRING_QI : 1;
  return cultivationRate(hero.root, life.path, life.level, life.cultivation, life.talents) * injury * spring;
}

function meditateMonth(s: GameState, rng: Rng, emit: Emit): void {
  const { hero, life } = s;
  life.hp = maxHp(life);
  const next = life.level + 1;

  if (next > MAX_LEVEL) {
    emit({ kind: 'wall', ageMonths: life.ageMonths, level: life.level }, 6);
    life.wallHit = true;
    go(life, 'retired');
    return;
  }

  if (
    hero.knowledge.includes('hiddenSpring') &&
    life.level >= HIDDEN_SPRING_MIN_LEVEL &&
    !life.remembered.includes('hiddenSpring')
  ) {
    life.remembered.push('hiddenSpring');
    emit({ kind: 'remembered', ageMonths: life.ageMonths, knowledge: 'hiddenSpring' }, 3);
  }

  life.qi += qiPerMonth(hero, life);
  if (life.qi < qiToReach(next)) {
    if (life.monthsInActivity >= MAX_MEDITATION_MONTHS) {
      life.plan = 'hunt';
      go(life, 'sect');
    }
    return;
  }

  if (isRealmGate(next)) attemptBreakthrough(s, rng, emit);
  else {
    life.level = next;
    life.qi = 0;
    growStats(life.path, life.stats, 2, rng);
    emit({ kind: 'stageUp', ageMonths: life.ageMonths, level: next, months: life.monthsInActivity }, 3);
  }
  if (life.death) return;
  life.plan = 'hunt';
  go(life, 'sect');
}

function attemptBreakthrough(s: GameState, rng: Rng, emit: Emit): void {
  const { life } = s;
  const next = life.level + 1;
  const pill = BREAKTHROUGH_PILLS[next];
  const usedPill = pill !== undefined && life.pills.breakthrough === pill.key;
  const heart = hasTalent(life.talents, 'steadyHeart') ? TALENT_EFFECTS.steadyHeartBreakthrough : 0;
  const p = Math.min(0.95, 0.5 + 0.01 * effectiveStats(life).mind + (usedPill ? pill.bonus : 0) + heart);
  if (usedPill) life.pills.breakthrough = null;

  if (chance(rng, p)) {
    life.level = next;
    life.qi = 0;
    growStats(life.path, life.stats, 4, rng);
    life.hp = maxHp(life);
    emit({ kind: 'realmUp', ageMonths: life.ageMonths, level: next, pill: usedPill }, 9);
    return;
  }
  life.qi *= 0.7;
  life.injuryMonths = 12;
  if (chance(rng, PATHS[life.path].deviation)) {
    die(life, emit, 'deviation');
    return;
  }
  emit({ kind: 'breakthroughFail', ageMonths: life.ageMonths, level: next }, 6);
}
