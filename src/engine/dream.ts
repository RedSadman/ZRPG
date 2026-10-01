import { ENEMIES } from '../data/enemies.ts';
import { RIVAL_SURNAMES } from '../data/rivals.ts';
import { PATHS } from '../data/paths.ts';
import { BREAKTHROUGH_PILLS, HEALING_PILL } from '../data/pills.ts';
import { MAX_LEVEL, STAGES_PER_REALM } from '../data/realms.ts';
import { TALENT_EFFECTS } from '../data/talents.ts';
import { COMBAT_TECHNIQUES, CULTIVATION_TECHNIQUES, LIBRARY, MAX_COMBAT_TECHNIQUES } from '../data/techniques.ts';
import { zoneFor, type ZoneDef } from '../data/zones.ts';
import { enemyCombatant, fight, heroCombatant } from './combat.ts';
import { bagCapacity, bagCount, cultivationRate, effectiveStats, growStats, hasTalent, maxHp } from './hero.ts';
import { isRealmGate, lifespanMonths, qiToReach, realmOf, stageOf, totalProgress } from './levels.ts';
import { itemPower, makeItem, rollRank, sellValue, starterItem, takeItem } from './loot.ts';
import { between, chance, nextInt, pick, pickWeighted, type Rng } from './rng.ts';
import type { Activity, DeathCause, GameEvent, GameState, Hero, Life, Slot } from './types.ts';

export const START_AGE_MONTHS = 16 * 12;

/** Records a journal line; priority ≥ 3 also makes it a candidate for the dream's summary. */
export type Emit = (event: GameEvent, priority?: number) => void;

// Tuning knobs for a dreamed month.
const ENCOUNTER_CHANCE = 0.75;
const TRAVEL_ENCOUNTER_CHANCE = 0.15;
const HUNT_QI_SHARE = 0.25;
const HUNT_REGEN = 0.1;
const MAX_HUNT_MONTHS = 12;
const MAX_MEDITATION_MONTHS = 36;
/** How far above or below the hero a regular encounter can be, in levels. */
const LEVEL_OFFSETS = [
  { offset: -2, weight: 15 },
  { offset: -1, weight: 25 },
  { offset: 0, weight: 30 },
  { offset: 1, weight: 18 },
  { offset: 2, weight: 9 },
  { offset: 3, weight: 3 },
];
/** Chance that an encounter comes from the realm above. */
const DANGER_CHANCE = 0.01;
/** Slots the sect armory keeps stocked with plain gear of the hero's level. */
const ARMORY_SLOTS: Slot[] = ['weapon', 'robe', 'bracers', 'boots'];

/** A new dream starts from everything the real hero has: level, qi, stats, techniques, items, talents. */
export function newLife(hero: Hero, n: number): Life {
  const life: Life = {
    n,
    ageMonths: START_AGE_MONTHS,
    level: hero.level,
    qi: hero.qi,
    stats: { ...hero.stats },
    hp: 0,
    equipment: startingGear(hero),
    bag: { trophyValue: 0, trophies: 0, items: [] },
    stones: 0,
    contribution: 0,
    pills: { healing: 1, breakthrough: null },
    techniques: hero.techniques.map((t) => ({ ...t })),
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
  };
  life.hp = maxHp(life);
  return life;
}

/**
 * A dream that starts at Foundation Establishment starts with a Foundation cultivator's plain gear, not a wooden
 * sword. Items brought back from earlier dreams replace it when they are better.
 */
function startingGear(hero: Hero): Life['equipment'] {
  const base: Record<Slot, string> = {
    weapon: PATHS[hero.path].weapons[0]!,
    robe: 'robe',
    bracers: 'bracers',
    boots: 'boots',
    pendant: 'pendant',
    ring: 'ring',
  };
  const slots: Slot[] = hero.level === 0 ? ['weapon', 'robe'] : ARMORY_SLOTS;
  const gear: Life['equipment'] = {};
  for (const slot of slots) gear[slot] = starterItem(slot, base[slot], hero.level);
  for (const item of Object.values(hero.equipment)) {
    const plain = gear[item.slot];
    if (!plain || itemPower(item, hero.path) > itemPower(plain, hero.path)) gear[item.slot] = structuredClone(item);
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

function go(life: Life, activity: Activity): void {
  life.activity = activity;
  life.monthsInActivity = 0;
}

function die(life: Life, emit: Emit, cause: DeathCause, enemy?: string, enemyLevel?: number, enemyName?: string): void {
  life.death = enemy ? { cause, enemy, enemyLevel: enemyLevel ?? 0, ...(enemyName ? { enemyName } : {}) } : { cause };
  emit({ kind: 'death', ageMonths: life.ageMonths, death: life.death }, 10);
}

// --- Sect -------------------------------------------------------------------

function sectMonth(s: GameState, rng: Rng, emit: Emit): void {
  const { hero, life } = s;
  const path = PATHS[hero.path];
  life.hp = maxHp(life);

  const sold = Math.round(life.bag.trophyValue) + life.bag.items.reduce((sum, i) => sum + sellValue(i), 0);
  life.stones += sold;
  life.bag = { trophyValue: 0, trophies: 0, items: [] };

  let contribution = 0;
  if (life.quest && life.quest.killed >= life.quest.needed) {
    contribution = 10 + 2 * life.level;
    life.contribution += contribution;
    life.stones += 3 + life.level;
    life.quest = null;
  }
  if (sold > 0 || contribution > 0) emit({ kind: 'sect', ageMonths: life.ageMonths, sold, contribution }, 1);

  learnInLibrary(life, emit);
  visitArmory(s, rng);

  const pillPrice = Math.round((HEALING_PILL.basePrice + HEALING_PILL.pricePerLevel * life.level) * path.pillPriceMult);
  while (life.pills.healing < HEALING_PILL.carryMax && life.stones >= pillPrice) {
    life.stones -= pillPrice;
    life.pills.healing += 1;
  }

  const gatePill = BREAKTHROUGH_PILLS[life.level + 1];
  if (gatePill && !life.pills.breakthrough && life.qi >= 0.6 * qiToReach(life.level + 1)) {
    const price = Math.round(gatePill.price * path.pillPriceMult);
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
  const known = new Set(life.techniques.map((t) => t.key));
  const next = LIBRARY.find((key) => !known.has(key));
  if (!next) return;
  const def = COMBAT_TECHNIQUES[next]!;
  if (life.contribution < def.contribution) return;
  life.contribution -= def.contribution;
  if (life.techniques.length >= MAX_COMBAT_TECHNIQUES) {
    // Forget the weakest to make room.
    const weakest = life.techniques.reduce((a, b) => (COMBAT_TECHNIQUES[a.key]!.k <= COMBAT_TECHNIQUES[b.key]!.k ? a : b));
    life.techniques = life.techniques.filter((t) => t !== weakest);
  }
  life.techniques.push({ key: next, uses: 0 });
  emit({ kind: 'technique', ageMonths: life.ageMonths, technique: next }, 5);
}

/** Replaces gear that fell behind with plain Mortal-rank pieces of the hero's level. */
function visitArmory(s: GameState, rng: Rng): void {
  const { hero, life } = s;
  const price = 4 + 3 * life.level;
  for (const slot of ARMORY_SLOTS) {
    if (life.stones < price) return;
    const current = life.equipment[slot];
    const offer = makeItem(rng, life.level, 0, hero.path, slot);
    if (current && itemPower(offer, hero.path) <= itemPower(current, hero.path) * 1.1) continue;
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
  if (chance(rng, TRAVEL_ENCOUNTER_CHANCE)) {
    const humans = zone.enemies.filter((e) => ENEMIES[e.key]!.kind === 'human');
    encounter(s, rng, emit, pickWeighted(rng, humans).key, rollEnemyLevel(rng, s.life.level));
    if (s.life.death || s.life.activity !== 'travel') return;
  }
  go(s.life, 'hunt');
}

function huntMonth(s: GameState, rng: Rng, emit: Emit): void {
  const { hero, life } = s;
  const zone = zoneFor(life.level);
  life.trip.months += 1;
  const hpMax = maxHp(life);
  life.hp = Math.min(hpMax, life.hp + hpMax * HUNT_REGEN);
  life.qi = Math.min(qiToReach(life.level + 1), life.qi + qiPerMonth(hero, life) * HUNT_QI_SHARE);

  if (chance(rng, PATHS[hero.path].herbChance) && bagCount(life) < bagCapacity(life)) {
    life.bag.trophyValue += zone.herbValue * (1 + 0.1 * life.level);
    life.bag.trophies += 1;
    life.trip.herbs += 1;
  }

  const bossDue = stageOf(life.level) === 9 && !life.bossesKilled.includes(zone.boss) && !life.trip.bossTried;
  if (bossDue && life.monthsInActivity >= 2) {
    life.trip.bossTried = true;
    encounter(s, rng, emit, zone.boss, life.level);
  } else if (chance(rng, ENCOUNTER_CHANCE)) {
    encounter(s, rng, emit, pickWeighted(rng, zone.enemies).key, rollEnemyLevel(rng, life.level));
  }
  if (life.death || life.activity !== 'hunt') return;

  const questDone = life.quest !== null && life.quest.killed >= life.quest.needed;
  const exhausted = life.hp < maxHp(life) * 0.3 && life.pills.healing === 0;
  if (
    bagCount(life) >= bagCapacity(life) ||
    (questDone && life.monthsInActivity >= 3) ||
    exhausted ||
    life.monthsInActivity >= MAX_HUNT_MONTHS
  ) {
    go(life, 'returning');
  }
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

/**
 * Regular encounters stay inside the hero's realm: a whole realm up is a wall in this genre.
 * Rarely the wall comes to you anyway.
 */
function rollEnemyLevel(rng: Rng, heroLevel: number): number {
  const realm = realmOf(heroLevel);
  const floor = realm === 0 ? 0 : (realm - 1) * STAGES_PER_REALM + 1;
  const ceiling = realm * STAGES_PER_REALM;
  if (chance(rng, DANGER_CHANCE)) return ceiling + nextInt(rng, 1, 3);
  const level = heroLevel + pickWeighted(rng, LEVEL_OFFSETS).offset;
  return Math.min(ceiling, Math.max(floor, level));
}

function encounter(s: GameState, rng: Rng, emit: Emit, enemyKey: string, level: number): void {
  const { hero, life } = s;
  const def = ENEMIES[enemyKey]!;
  const name = def.rival ? pick(rng, RIVAL_SURNAMES) : undefined;
  const me = heroCombatant(life, enemyKey);
  const foe = enemyCombatant(def, level);
  const r = fight(me, foe, life.pills.healing, effectiveStats(life).luck, rng);

  life.hp = r.heroHp;
  life.pills.healing -= r.pillsUsed;
  for (const t of life.techniques) t.uses += r.techniqueUses[t.key] ?? 0;
  life.totals.fights += 1;

  const note = (n: 'boss' | 'rival' | 'closeCall' | 'stronger' | 'fled' | 'rescued', priority: number) =>
    emit({ kind: 'fight', ageMonths: life.ageMonths, enemy: enemyKey, enemyLevel: level, note: n, ...(name ? { name } : {}) }, priority);

  switch (r.outcome) {
    case 'lost':
      die(life, emit, 'killed', enemyKey, level, name);
      return;
    case 'fled':
      life.totals.flees += 1;
      note('fled', 2);
      return;
    case 'rescued':
      note('rescued', 7);
      go(life, 'returning');
      return;
    case 'won':
      break;
  }

  life.totals.wins += 1;
  life.totals.kills += 1;
  life.trip.kills += 1;
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

  const value = hasTalent(life.talents, 'goldenTouch') ? TALENT_EFFECTS.goldenTouchValue : 1;
  if (def.trophy > 0 && bagCount(life) < bagCapacity(life)) {
    life.bag.trophyValue += def.trophy * (1 + 0.15 * level) * value;
    life.bag.trophies += 1;
  }
  if (def.stones > 0) life.stones += Math.round(def.stones * (1 + 0.2 * level) * between(rng, 0.5, 1.5) * value);

  if (chance(rng, def.itemChance)) {
    const rank = rollRank(rng, effectiveStats(life).luck, def.boss ? 1 : 0);
    const item = makeItem(rng, level, rank, hero.path);
    const equipped = takeItem(life, item, hero.path);
    if (equipped && rank > 0) emit({ kind: 'loot', ageMonths: life.ageMonths, item }, 2 + rank * 2);
  }
}

// --- Cultivation ------------------------------------------------------------

export function qiPerMonth(hero: Hero, life: Life): number {
  const injury = life.injuryMonths > 0 ? 0.5 : 1;
  return cultivationRate(hero.root, hero.path, life.level, life.cultivation, life.talents) * injury;
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
    growStats(hero.path, life.stats, 2, rng);
    emit({ kind: 'stageUp', ageMonths: life.ageMonths, level: next, months: life.monthsInActivity }, 3);
  }
  if (life.death) return;
  life.plan = 'hunt';
  go(life, 'sect');
}

function attemptBreakthrough(s: GameState, rng: Rng, emit: Emit): void {
  const { hero, life } = s;
  const next = life.level + 1;
  const pill = BREAKTHROUGH_PILLS[next];
  const usedPill = pill !== undefined && life.pills.breakthrough === pill.key;
  const heart = hasTalent(life.talents, 'steadyHeart') ? TALENT_EFFECTS.steadyHeartBreakthrough : 0;
  const p = Math.min(0.95, 0.5 + 0.01 * effectiveStats(life).mind + (usedPill ? pill.bonus : 0) + heart);
  if (usedPill) life.pills.breakthrough = null;

  if (chance(rng, p)) {
    life.level = next;
    life.qi = 0;
    growStats(hero.path, life.stats, 4, rng);
    life.hp = maxHp(life);
    emit({ kind: 'realmUp', ageMonths: life.ageMonths, level: next, pill: usedPill }, 9);
    return;
  }
  life.qi *= 0.7;
  life.injuryMonths = 12;
  if (chance(rng, PATHS[hero.path].deviation)) {
    die(life, emit, 'deviation');
    return;
  }
  emit({ kind: 'breakthroughFail', ageMonths: life.ageMonths, level: next }, 6);
}
