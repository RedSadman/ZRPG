import { ENEMIES } from '../data/enemies.ts';
import { INSTINCTS } from '../data/instincts.ts';
import { BLESSING_LUCK, HIDDEN_SPRING_MIN_LEVEL, HIDDEN_SPRING_QI, SECRETS, startPlace } from '../data/knowledge.ts';
import { PATHS } from '../data/paths.ts';
import { BREAKTHROUGH_PILLS, HEALING_PILL } from '../data/pills.ts';
import { MAX_LEVEL, MONTHS_PER_TICK, QI_COST_MULT, TRIBULATION_FROM_LEVEL } from '../data/realms.ts';
import { RIVAL_SURNAMES } from '../data/rivals.ts';
import { TALENT_EFFECTS, THUNDER_SCAR } from '../data/talents.ts';
import { COMBAT_TECHNIQUES, CULTIVATION_TECHNIQUES, LIBRARY, MAX_COMBAT_TECHNIQUES } from '../data/techniques.ts';
import { zoneFor, type ZoneDef } from '../data/zones.ts';
import { ELITE_ATK, ELITE_HP, chooseQuest, postBoard, questFoe, questNote } from './board.ts';
import { enemyCombatant, fight, heroCombatant } from './combat.ts';
import { maybeFork } from './forks.ts';
import { bagCapacity, bagCount, cultivationRate, effectiveStats, growStats, hasTalent, maxHp } from './hero.ts';
import { estimateWin, perceivedWin } from './judgement.ts';
import { isRealmGate, lifespanMonths, monthsPerTick, qiToReach, realmOf, stageOf, totalProgress } from './levels.ts';
import { itemPower, makeItem, rollRank, sellValue, starterItem, takeItem } from './loot.ts';
import { between, chance, nextInt, pick, pickWeighted, type Rng } from './rng.ts';
import type { Activity, DeathCause, DreamSetup, GameEvent, GameState, Hero, Life, Quest, Slot } from './types.ts';

export const START_AGE_MONTHS = 16 * 12;

/** Records a journal line; priority ≥ 3 also makes it a candidate for the dream's summary. */
export type Emit = (event: GameEvent, priority?: number) => void;

// Tuning knobs for a dreamed month.
const ENCOUNTER_CHANCE = 0.6;
/** On peaceful work the hero is not looking for trouble and meets less of it. */
const PEACEFUL_ENCOUNTER_CHANCE = 0.3;
/** Chance per month in the mine to bring out a chunk of spirit ore. */
const ORE_CHANCE = 0.6;
/** Qi gathered on sect duty, as a share of a meditation month. */
const DUTY_QI_SHARE = 0.3;
const TRAVEL_ENCOUNTER_CHANCE = 0.15;
const HUNT_REGEN = 0.1;
/** Share of a meditation month's qi gathered during a month on the road. */
const HUNT_QI_SHARE = 0.25;
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
/** In a task's fights the hero accepts odds this much worse than usual. */
const QUEST_RESOLVE = 0.5;
/** A breakthrough is put off for a pill at most this many times. */
const MAX_PILL_WAITS = 6;
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
    trip: { months: 0, kills: 0, herbs: 0, ore: 0, avoided: 0, bossTried: false, rivalNoted: false },
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
    karma: 0,
    reputation: 0,
    pillWaits: 0,
    valor: 0,
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
  const months = monthsPerTick(life.level);
  life.ageMonths += months;
  life.monthsInActivity += 1;
  if (life.injuryMonths > 0) life.injuryMonths = Math.max(0, life.injuryMonths - months);

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
    case 'duty':
      return dutyMonth(s);
  }
}

/** Sect duty: chores, scriptures, guard posts. Safe, dull, and the sect remembers it. */
function dutyMonth(s: GameState): void {
  const { hero, life } = s;
  life.hp = maxHp(life);
  life.qi = Math.min(qiToReach(life.level + 1), life.qi + qiPerMonth(hero, life) * DUTY_QI_SHARE);
  const quest = life.quest;
  if (quest) quest.monthsLeft -= 1;
  if (!quest || quest.monthsLeft <= 0) {
    life.plan = 'meditate';
    go(life, 'sect');
  }
}

export function go(life: Life, activity: Activity): void {
  life.activity = activity;
  life.monthsInActivity = 0;
}

export function die(
  life: Life,
  emit: Emit,
  cause: DeathCause,
  enemy?: string,
  enemyLevel?: number,
  enemyName?: string,
  misjudged = false,
): void {
  life.death = enemy
    ? { cause, enemy, enemyLevel: enemyLevel ?? 0, ...(enemyName ? { enemyName } : {}), ...(misjudged ? { misjudged } : {}) }
    : { cause };
  emit({ kind: 'death', ageMonths: life.ageMonths, death: life.death }, 10);
}

// --- Sect -------------------------------------------------------------------

function sectMonth(s: GameState, rng: Rng, emit: Emit): void {
  const { life } = s;
  const place = startPlace(life.start);
  life.hp = maxHp(life);

  const sold = Math.round(life.bag.trophyValue) + life.bag.items.reduce((sum, i) => sum + sellValue(i), 0);
  life.stones += sold;
  life.bag = { trophyValue: 0, trophies: 0, items: [] };
  if (sold > 0) emit({ kind: 'sect', ageMonths: life.ageMonths, sold, contribution: 0 }, 1);

  settleQuest(s, rng, emit);
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

  if (!life.quest) {
    life.quest = chooseQuest(postBoard(life, rng), life, rng);
    emit({ kind: 'questTaken', ageMonths: life.ageMonths, quest: questNote(life.quest), instinct: life.instinct }, 1);
  }

  const canCultivate = life.level < MAX_LEVEL || !life.wallHit;
  if (life.plan === 'meditate' && canCultivate) go(life, 'meditate');
  else {
    if (life.quest) life.quest.started = true;
    go(life, life.quest?.inSect ? 'duty' : 'travel');
  }
}

/** Pays out a finished task, or writes off one that the last trip failed. */
function settleQuest(s: GameState, rng: Rng, emit: Emit): void {
  const { life } = s;
  const quest = life.quest;
  if (!quest || !quest.started) return;
  const done = !quest.failed && quest.fightsLeft === 0 && quest.monthsLeft <= 0;
  life.quest = null;
  if (!done) {
    life.reputation -= 1;
    emit({ kind: 'questFailed', ageMonths: life.ageMonths, quest: questNote(quest) }, 2);
    return;
  }
  // The righteous sometimes refuse money they feel they have not earned; heaven notices.
  const declined = quest.stones > 0 && chance(rng, INSTINCTS[life.instinct].declineChance);
  if (declined) life.karma += 2;
  else life.stones += quest.stones;
  life.contribution += quest.contribution;
  life.karma += quest.karma;
  life.reputation += quest.elite || quest.foes === 'demons' ? 2 : 1;
  let item;
  if (chance(rng, quest.itemChance)) {
    item = makeItem(rng, life.level, rollRank(rng, effectiveStats(life).luck, 1), life.path);
    takeItem(life, item, life.path);
  }
  const priority = 2 + (item ? 2 : 0) + (declined ? 3 : 0);
  emit({ kind: 'questDone', ageMonths: life.ageMonths, quest: questNote(quest), declined, ...(item ? { item } : {}) }, priority);
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
  const ins = INSTINCTS[life.instinct];
  const quest = life.quest;
  life.trip.months += 1;
  const hpMax = maxHp(life);
  life.hp = Math.min(hpMax, life.hp + hpMax * HUNT_REGEN);
  life.qi = Math.min(qiToReach(life.level + 1), life.qi + qiPerMonth(hero, life) * HUNT_QI_SHARE);
  if (quest && !quest.failed) quest.monthsLeft -= 1;

  if (rememberOldZhangCave(s, zone, emit)) return;
  if (maybeFork(s, rng, emit)) return;

  const herbChance = (PATHS[life.path].herbChance + startPlace(life.start).herbBonus) * (quest?.kind === 'herbs' ? 2 : 1);
  if (chance(rng, herbChance) && bagCount(life) < bagCapacity(life)) {
    life.bag.trophyValue += zone.herbValue * (1 + 0.1 * life.level);
    life.bag.trophies += 1;
    life.trip.herbs += 1;
  }

  if (bossIsDue(s, zone, rng)) {
    life.trip.bossTried = true;
    encounter(s, rng, emit, zone.boss, life.level, { committed: true });
  } else if (quest && !quest.failed && quest.fightsLeft > 0 && chance(rng, quest.fightsLeft / Math.max(1, quest.monthsLeft + 1))) {
    questFight(s, rng, emit, quest);
  } else if (chance(rng, quest?.peaceful ? PEACEFUL_ENCOUNTER_CHANCE : ENCOUNTER_CHANCE)) {
    encounter(s, rng, emit, pickWeighted(rng, zone.enemies).key, rollEnemyLevel(rng, life.level, zone));
  }
  if (life.death || life.activity !== 'hunt') return;

  if (quest?.ore && quest.monthsLeft >= 0 && chance(rng, ORE_CHANCE) && bagCount(life) < bagCapacity(life)) {
    life.bag.trophyValue += zone.herbValue * 1.5 * (1 + 0.1 * life.level);
    life.bag.trophies += 1;
    life.trip.ore += 1;
  }

  const questDone = quest !== null && quest.fightsLeft === 0 && quest.monthsLeft <= 0;
  const bagFull = bagCount(life) >= bagCapacity(life);
  const exhausted = life.hp < maxHp(life) * ins.returnAtHp && life.pills.healing === 0;
  // A greedy dreamer does not go home with a half-empty bag.
  const keepFilling = ins.fillsBag && !bagFull;
  if (
    quest?.failed ||
    bagFull ||
    exhausted ||
    (questDone && !keepFilling) ||
    life.monthsInActivity >= ins.maxHuntMonths
  ) {
    go(life, 'returning');
  }
}

/** The zone's boss is hunted once the instinct feels ready, and only if the hero believes in the win. */
function bossIsDue(s: GameState, zone: ZoneDef, rng: Rng): boolean {
  const { life } = s;
  const ins = INSTINCTS[life.instinct];
  if (zone.boss === '' || life.bossesKilled.includes(zone.boss) || life.trip.bossTried || life.monthsInActivity < 2) {
    return false;
  }
  if (realmOf(life.level) === 0 || stageOf(life.level) < ins.bossFromStage) return false;
  const p = perceivedWin(life, heroCombatant(life, zone.boss), enemyCombatant(ENEMIES[zone.boss]!, life.level), rng);
  if (p >= ins.engageAt) return true;
  life.trip.bossTried = true;
  return false;
}

function questFight(s: GameState, rng: Rng, emit: Emit, quest: Quest): void {
  const { life } = s;
  const key = questFoe(quest, life, rng);
  const level = questFoeLevel(quest, life, rng);
  const result = encounter(s, rng, emit, key, level, { resolve: QUEST_RESOLVE, elite: quest.elite });
  if (result === 'won') quest.fightsLeft -= 1;
  else if (result !== 'lost' && result !== 'avoided') quest.failed = true;
}

/** Places with a settled population (the village woods) send the same foes whatever the task says. */
export function questFoeLevel(quest: Quest, life: Life, rng: Rng): number {
  const zone = zoneFor(life.level);
  if (zone.levels) return pickWeighted(rng, zone.levels).level;
  return Math.max(0, life.level + nextInt(rng, quest.offset[0], quest.offset[1]));
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
  const { kills, herbs, ore, avoided } = life.trip;
  if (kills + herbs + ore + avoided > 0) {
    emit(
      {
        kind: 'hunt',
        ageMonths: life.ageMonths,
        zone: zoneFor(life.level).key,
        months: life.trip.months * monthsPerTick(life.level),
        kills,
        herbs,
        ...(ore ? { ore } : {}),
        ...(avoided ? { avoided } : {}),
      },
      1,
    );
  }
  life.trip = { months: 0, kills: 0, herbs: 0, ore: 0, avoided: 0, bossTried: false, rivalNoted: false };
  life.plan = 'meditate';
  go(life, 'sect');
}

export function rollEnemyLevel(rng: Rng, heroLevel: number, zone: ZoneDef): number {
  if (zone.levels) return pickWeighted(rng, zone.levels).level;
  return Math.max(0, heroLevel + pickWeighted(rng, LEVEL_OFFSETS).offset);
}

export interface EncounterOptions {
  /** The hero went looking for this fight (a boss, a duel) and does not slip away from it. */
  committed?: boolean;
  /** Scales how sure the hero must be: a task taken on makes them accept worse odds, but not hopeless ones. */
  resolve?: number;
  /** A duel: losing leaves you beaten, not dead. */
  lethal?: boolean;
  /** Start the fight with this share of the foe's HP (tired cultivators leaving a secret realm). */
  foeHp?: number;
  /** A tougher than usual foe of its kind. */
  elite?: boolean;
  /** Fork fights are narrated by the fork itself. */
  quiet?: boolean;
}

export type EncounterResult = 'won' | 'fled' | 'avoided' | 'rescued' | 'lost' | 'beaten';

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
  const ins = INSTINCTS[life.instinct];
  const name = def.rival ? pick(rng, RIVAL_SURNAMES) : undefined;
  const note = (n: 'boss' | 'rival' | 'closeCall' | 'stronger' | 'fled' | 'rescued' | 'sensed' | 'ambushed', priority: number) => {
    if (opts.quiet) return;
    emit({ kind: 'fight', ageMonths: life.ageMonths, enemy: enemyKey, enemyLevel: level, note: n, ...(name ? { name } : {}) }, priority);
  };

  const me = heroCombatant(life, enemyKey);
  const foe = enemyCombatant(def, level);
  if (opts.elite) {
    foe.hp = foe.maxHp = Math.round(foe.maxHp * ELITE_HP);
    foe.weapon *= ELITE_ATK;
  }
  if (opts.foeHp !== undefined) foe.hp = Math.round(foe.maxHp * opts.foeHp);
  const odds = estimateWin(me, foe, life.pills.healing);

  // Sizing the foe up: fight, or try to slip away. The instinct decides how sure the hero must be, and how well
  // they read the odds in the first place.
  let ambushed = false;
  let chose = false;
  if (!opts.committed) {
    const wanted =
      (def.demonic ? ins.engageDemonAt : ins.engageAt - (def.stones > 0 ? ins.lootLust : 0)) * (opts.resolve ?? 1);
    if (perceivedWin(life, me, foe, rng) < wanted) {
      const slip = 0.55 + 0.02 * (me.agi - foe.agi) + 0.01 * effectiveStats(life).mind;
      if (chance(rng, Math.min(0.95, Math.max(0.15, slip)))) {
        if (odds < 0.5) note('sensed', realmOf(level) > realmOf(life.level) ? 5 : 3);
        else life.trip.avoided += 1;
        return 'avoided';
      }
      ambushed = true;
    } else chose = true;
  }

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
      die(life, emit, 'killed', enemyKey, level, name, chose && odds < 0.4);
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
  if (def.demonic) life.karma += 1;
  life.valor += Math.max(0, level - life.level);
  if (level > life.level) {
    // Insight from beating someone stronger: the bold grow on danger.
    const need = qiToReach(life.level + 1);
    // Measured against an ordinary stage: in the high realms one fight moves the hero proportionally less.
    const realmCost = QI_COST_MULT[realmOf(life.level + 1)]! / MONTHS_PER_TICK[realmOf(life.level + 1)]!;
    life.qi = Math.min(need, life.qi + (need * BATTLE_INSIGHT * (level - life.level)) / realmCost);
  }

  if (def.boss) {
    life.bossesKilled.push(enemyKey);
    note('boss', 8);
    // Every realm's boss knows a piece of the truth about the cult.
    const secret = SECRETS.find((x) => x.boss === enemyKey)?.key;
    if (secret && !s.hero.knowledge.includes(secret) && !life.discoveries.includes(secret)) {
      life.discoveries.push(secret);
      emit({ kind: 'secret', ageMonths: life.ageMonths, secret }, 9);
    }
  } else if (ambushed && odds < 0.5) note('ambushed', 4);
  else if (def.rival && !life.trip.rivalNoted) {
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
    const item = makeItem(rng, level, rank, life.path);
    const equipped = takeItem(life, item, life.path);
    if (equipped && rank > 0 && !opts.quiet) emit({ kind: 'loot', ageMonths: life.ageMonths, item }, 2 + rank * 2);
  }
  return 'won';
}

// --- Cultivation ------------------------------------------------------------

/** Qi gathered in one tick of meditation (a tick may stand for several months in the high realms). */
export function qiPerMonth(hero: Hero, life: Life): number {
  const injury = life.injuryMonths > 0 ? 0.5 : 1;
  const spring = hero.knowledge.includes('hiddenSpring') && life.level >= HIDDEN_SPRING_MIN_LEVEL ? HIDDEN_SPRING_QI : 1;
  return cultivationRate(hero.root, life.path, life.level, life.cultivation, life.talents) * injury * spring * monthsPerTick(life.level);
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

  const need = qiToReach(next);
  life.qi = Math.min(need, life.qi + qiPerMonth(hero, life));
  if (life.qi < need) {
    if (life.monthsInActivity >= MAX_MEDITATION_MONTHS) {
      life.plan = 'hunt';
      go(life, 'sect');
    }
    return;
  }

  if (isRealmGate(next)) {
    // The cautious will not knock on a realm's gate without a pill in hand, for a while at least.
    const pill = BREAKTHROUGH_PILLS[next];
    const waiting =
      INSTINCTS[life.instinct].waitsForPill && pill && life.pills.breakthrough !== pill.key && life.pillWaits < MAX_PILL_WAITS;
    if (waiting) {
      if (life.pillWaits === 0) emit({ kind: 'pillWait', ageMonths: life.ageMonths, level: next }, 2);
      life.pillWaits += 1;
    } else {
      life.pillWaits = 0;
      attemptBreakthrough(s, rng, emit);
    }
  } else {
    life.level = next;
    life.qi = 0;
    growStats(life.path, life.stats, 2, rng);
    emit({ kind: 'stageUp', ageMonths: life.ageMonths, level: next, months: life.monthsInActivity * monthsPerTick(life.level - 1) }, 3);
  }
  if (life.death) return;
  life.plan = 'hunt';
  go(life, 'sect');
}

/** Bolts by the realm being entered: Golden Core 3, Nascent Soul 6, Spirit Transformation and Dao Union 9. */
const TRIBULATION_BOLTS: Record<number, { bolts: number; share: number }> = {
  3: { bolts: 3, share: 0.3 },
  4: { bolts: 6, share: 0.17 },
  5: { bolts: 9, share: 0.13 },
  6: { bolts: 9, share: 0.15 },
};

/**
 * Heaven tests whoever tries to rise above it: a few bolts of lightning, each a share of what a cultivator of that
 * level can usually take. Pills help between strikes; a scar from a past storm and a tempered heart soften them.
 */
function surviveTribulation(s: GameState, rng: Rng, emit: Emit, next: number): boolean {
  const { life } = s;
  const storm = TRIBULATION_BOLTS[realmOf(next)]!;
  const usualHp = 40 + (5 + 0.6 * next) * 6 + 10 * next;
  const armor = Object.values(life.equipment).reduce((sum, i) => sum + i.armor, 0);
  const soften =
    (hasTalent(life.talents, THUNDER_SCAR) ? TALENT_EFFECTS.thunderScarDamage : 1) *
    (hasTalent(life.talents, 'steadyHeart') ? 0.9 : 1);
  const hpMax = maxHp(life);
  let hp = hpMax;
  for (let i = 0; i < storm.bolts; i++) {
    hp -= Math.max(1, usualHp * storm.share * between(rng, 0.7, 1.3) * soften - 0.5 * armor);
    if (hp <= 0) {
      if (chance(rng, 0.05 + 0.005 * effectiveStats(life).luck)) {
        hp = 1;
        continue;
      }
      emit({ kind: 'tribulation', ageMonths: life.ageMonths, level: next, bolts: i + 1, survived: false }, 8);
      die(life, emit, 'tribulation');
      return false;
    }
    if (hp < hpMax * 0.4 && life.pills.healing > 0) {
      life.pills.healing -= 1;
      hp = Math.min(hpMax, hp + hpMax * HEALING_PILL.heal);
    }
  }
  emit({ kind: 'tribulation', ageMonths: life.ageMonths, level: next, bolts: storm.bolts, survived: true }, 7);
  return true;
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
    if (next >= TRIBULATION_FROM_LEVEL && !surviveTribulation(s, rng, emit, next)) return;
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
