import {
  CRAFT_XP,
  FORGE,
  GATE_PILL,
  GATHERING_PILL,
  HEALING_HERBS,
  MAX_CRAFT,
  PATH_CRAFT,
  PATH_CRAFT_START,
  SHOP,
  TALISMANS,
  THUNDER_DAMAGE,
  craftChance,
  type CraftKey,
  type Product,
} from '../data/crafts.ts';
import { startPlace } from '../data/knowledge.ts';
import { PATHS, type PathKey } from '../data/paths.ts';
import { BREAKTHROUGH_PILLS, HEALING_PILL } from '../data/pills.ts';
import { STAGES_PER_REALM } from '../data/realms.ts';
import { zoneFor } from '../data/zones.ts';
import type { Emit } from './dream.ts';
import { effectiveStats } from './hero.ts';
import { monthsPerTick, realmOf, stageOf } from './levels.ts';
import { itemPower, makeItem, rollRank, takeItem } from './loot.ts';
import { between, chance, type Rng } from './rng.ts';
import type { Crafts, GameState, Hero, Item, Life, Materials, Slot, WorkshopBatch } from './types.ts';
import { temperament } from './temperament.ts';

const ALL_SLOTS: Slot[] = ['weapon', 'robe', 'bracers', 'boots', 'pendant', 'ring'];
/** Whether this dreamer would stand at the forge at all: worth knowing when choosing work that brings ore. */
export function willingToForge(life: Life): boolean {
  const odds = craftChance(Math.floor(life.crafts.forging), effectiveStats(life).mind) - FORGE.penalty;
  return odds >= temperament(life).craftNerve;
}

/** A crafter keeps this many units of herbs and cores for the next visit (and ore for one forging); the rest is sold. */
const STORE_UNITS = 4;

export function noCrafts(): Crafts {
  return { alchemy: 0, forging: 0, talismans: 0 };
}

/** A dream starts with the real hero's craft skill, and the path's own craft is never below its starting level. */
export function startingCrafts(hero: Hero, path: PathKey): Crafts {
  const crafts = { ...hero.crafts };
  const own = PATH_CRAFT[path];
  if (own) crafts[own] = Math.max(crafts[own], PATH_CRAFT_START);
  return crafts;
}

/** What a bundle of the local herbs is worth: the measure every recipe is written in. */
export function materialUnit(level: number): number {
  return zoneFor(level).herbValue * (1 + 0.1 * level);
}

function priceMult(life: Life): number {
  return PATHS[life.path].pillPriceMult * startPlace(life.start).pillPriceMult;
}

export function healingPillPrice(life: Life): number {
  return Math.round((HEALING_PILL.basePrice + HEALING_PILL.pricePerLevel * life.level) * priceMult(life));
}

export function gatheringPillPrice(life: Life): number {
  return Math.round(GATHERING_PILL.price * materialUnit(life.level) * priceMult(life));
}

export function nextShopPrice(life: Life): number {
  return Math.round(SHOP.price * materialUnit(life.level) * 2 ** life.shop.level);
}

/** The bolt of a thunder talisman: a share of what an ordinary foe of that level can take. */
export function thunderDamage(level: number): number {
  return (40 + (5 + 0.6 * level) * 6 + 10 * level) * THUNDER_DAMAGE;
}

/** The next realm gate above the hero's level. */
function nextGate(level: number): number {
  return realmOf(level) * STAGES_PER_REALM + 1;
}

type Cost = Partial<Materials> & { stones?: number };

function affordable(life: Life, cost: Cost): boolean {
  return (
    life.mats.herbs >= (cost.herbs ?? 0) &&
    life.mats.cores >= (cost.cores ?? 0) &&
    life.mats.ore >= (cost.ore ?? 0) &&
    life.stones >= (cost.stones ?? 0)
  );
}

function pay(life: Life, cost: Cost): void {
  life.mats.herbs -= cost.herbs ?? 0;
  life.mats.cores -= cost.cores ?? 0;
  life.mats.ore -= cost.ore ?? 0;
  life.stones -= Math.round(cost.stones ?? 0);
}

/** Practice makes the craftsman; the path's own craft comes twice as fast. */
function practise(life: Life, craft: CraftKey): void {
  const gain = CRAFT_XP * (PATH_CRAFT[life.path] === craft ? 2 : 1);
  life.crafts[craft] = Math.min(MAX_CRAFT, life.crafts[craft] + gain);
}

/**
 * A visit to the workshop: healing pills first, then a pill for the coming realm gate, the talismans the instinct
 * cares for, gathering pills, and a piece of gear if there is ore. Each attempt can fail and eat its materials.
 * Whatever the hero has no use for is sold.
 */
export interface WorkshopResult {
  batches: WorkshopBatch[];
  item?: Item;
  forgeFailed?: boolean;
  /** Stones from the materials the hero had no use for. */
  sold: number;
}

export function visitWorkshop(s: GameState, rng: Rng): WorkshopResult {
  const { life } = s;
  const ins = temperament(life);
  const mind = effectiveStats(life).mind;
  const unit = materialUnit(life.level);
  const odds = (craft: CraftKey, penalty = 0) => craftChance(Math.floor(life.crafts[craft]), mind) - penalty;
  const willing = (craft: CraftKey, penalty = 0) => odds(craft, penalty) >= ins.craftNerve;
  const batches: WorkshopBatch[] = [];

  /** Tries up to `tries` times to make `want` of a product, while materials last. */
  const attempt = (craft: CraftKey, product: Product, want: number, cost: Cost, penalty: number, give: () => void, tries = want) => {
    if (want <= 0 || !willing(craft, penalty)) return;
    const batch: WorkshopBatch = { craft, product, made: 0, tried: 0 };
    while (batch.made < want && batch.tried < tries && affordable(life, cost)) {
      pay(life, cost);
      batch.tried += 1;
      practise(life, craft);
      if (chance(rng, odds(craft, penalty))) {
        batch.made += 1;
        give();
      }
    }
    if (batch.tried > 0) batches.push(batch);
  };

  attempt('alchemy', 'healingPill', HEALING_PILL.carryMax - life.pills.healing, { herbs: HEALING_HERBS * healingPillPrice(life) }, 0, () => {
    life.pills.healing += 1;
  });

  // A pill for the next realm gate, brewed in good time; it needs real skill, more for every realm.
  const gate = nextGate(life.level);
  const gatePill = BREAKTHROUGH_PILLS[gate];
  const gateRealm = realmOf(gate);
  if (
    gatePill &&
    !life.pills.breakthrough &&
    (life.level === 0 || stageOf(life.level) >= 6) &&
    Math.floor(life.crafts.alchemy) >= GATE_PILL.skillPerRealm * gateRealm
  ) {
    attempt(
      'alchemy',
      'gatePill',
      1,
      { cores: GATE_PILL.cores * gatePill.price, herbs: GATE_PILL.herbs * gatePill.price },
      GATE_PILL.penaltyPerRealm * gateRealm,
      () => (life.pills.breakthrough = gatePill.key),
      GATE_PILL.tries,
    );
  }

  for (const kind of ins.talismans) {
    const t = TALISMANS[kind];
    attempt(
      'talismans',
      kind === 'escape' ? 'escapeTalisman' : 'thunderTalisman',
      t.carryMax - life.talismans[kind],
      { herbs: t.herbs * unit, cores: t.cores * unit, stones: t.stones * unit },
      0,
      () => (life.talismans[kind] += 1),
    );
  }

  // Gathering pills are a luxury: while the purse cannot cover the coming realm pill and a full set of healing
  // pills, the cores are sold instead.
  const g = GATHERING_PILL;
  if (life.stones >= essentials(life)) attempt('alchemy', 'gatheringPill', g.carryMax - life.pills.gathering, { cores: g.cores * g.price * unit, herbs: g.herbs * g.price * unit }, 0, () => {
    life.pills.gathering += 1;
  });

  const forged = forge(life, rng, unit, willing, odds);

  const keepHerbs = willing('alchemy') || willing('talismans');
  const keepCores = keepHerbs || willing('forging', FORGE.penalty);
  const keepOre = willing('forging', FORGE.penalty);
  const sold = sellMaterials(life, unit, { herbs: keepHerbs, cores: keepCores, ore: keepOre });
  return {
    batches,
    ...(forged && forged !== 'failed' ? { item: forged } : {}),
    ...(forged === 'failed' ? { forgeFailed: true } : {}),
    sold,
  };
}

/** One try at the forge, for the slot that would gain the most. Returns the item put on, 'failed', or null. */
function forge(
  life: Life,
  rng: Rng,
  unit: number,
  willing: (craft: CraftKey, penalty?: number) => boolean,
  odds: (craft: CraftKey, penalty?: number) => number,
): Item | 'failed' | null {
  const cost = { ore: FORGE.ore * unit, cores: FORGE.cores * unit };
  if (!willing('forging', FORGE.penalty) || !affordable(life, cost)) return null;
  pay(life, cost);
  practise(life, 'forging');
  if (!chance(rng, odds('forging', FORGE.penalty))) return 'failed';
  const slot = weakestSlot(life);
  const luck = effectiveStats(life).luck + FORGE.skillLuck * Math.floor(life.crafts.forging);
  const item = makeItem(rng, life.level, rollRank(rng, luck, 1), life.path, slot);
  return takeItem(life, item, life.path) ? item : 'failed';
}

function weakestSlot(life: Life): Slot {
  let worst: Slot = 'weapon';
  let lowest = Infinity;
  for (const slot of ALL_SLOTS) {
    const item = life.equipment[slot];
    const power = item ? itemPower(item, life.path) : 0;
    if (power < lowest) {
      lowest = power;
      worst = slot;
    }
  }
  return worst;
}

/** Sells what the hero keeps no use for; a crafter stores a little of what they work with. */
function sellMaterials(life: Life, unit: number, keep: Record<keyof Materials, boolean>): number {
  let sold = 0;
  for (const key of ['herbs', 'cores', 'ore'] as const) {
    const cap = keep[key] ? (key === 'ore' ? FORGE.ore : STORE_UNITS) * unit : 0;
    if (life.mats[key] > cap) {
      sold += life.mats[key] - cap;
      life.mats[key] = cap;
    }
  }
  return Math.round(sold);
}

// --- Business -----------------------------------------------------------------

/** Every month the shop earns, and while the owner is away, thieves may empty the till. */
export function shopMonth(s: GameState, rng: Rng, emit: Emit): void {
  const { life } = s;
  const shop = life.shop;
  if (shop.level === 0) return;
  shop.till += SHOP.income * shop.level * materialUnit(life.level) * between(rng, 0.6, 1.4) * monthsPerTick(life.level);
  const away = life.activity === 'hunt' || life.activity === 'travel' || life.activity === 'returning';
  if (away && shop.till >= 1 && chance(rng, SHOP.robbery)) {
    emit({ kind: 'shop', ageMonths: life.ageMonths, action: 'robbed', level: shop.level, amount: Math.round(shop.till) }, 2);
    shop.till = 0;
  }
}

/** Empties the till into the purse. */
export function collectTill(life: Life): number {
  const income = Math.round(life.shop.till);
  life.stones += income;
  life.shop.till = 0;
  return income;
}

/** A born merchant buys a shop, then a bigger one, whenever the purse allows after the essentials. */
export function investInShop(s: GameState, emit: Emit): void {
  const { life } = s;
  if (!temperament(life).investor || life.shop.level >= SHOP.maxLevel) return;
  const price = nextShopPrice(life);
  if (life.stones < price + essentials(life)) return;
  life.stones -= price;
  life.shop.level += 1;
  const action = life.shop.level === 1 ? 'opened' : 'expanded';
  emit({ kind: 'shop', ageMonths: life.ageMonths, action, level: life.shop.level }, action === 'opened' ? 3 : 2);
}

/** Stones needed for what keeps a cultivator alive and moving: the coming realm pill and a full set of healing pills. */
function essentials(life: Life): number {
  const gate = BREAKTHROUGH_PILLS[nextGate(life.level)];
  const gatePrice = gate && !life.pills.breakthrough && stageOf(life.level) >= 6 ? Math.round(gate.price * priceMult(life)) : 0;
  return gatePrice + Math.max(0, HEALING_PILL.carryMax - life.pills.healing) * healingPillPrice(life);
}

/**
 * Spare stones buy gathering pills in the pill hall. Money for the coming realm-gate pill is kept back, and a
 * merchant keeps back what the next shop costs.
 */
export function buyGatheringPills(life: Life): void {
  const ins = temperament(life);
  let reserve = essentials(life);
  if (ins.investor && life.shop.level < SHOP.maxLevel) reserve += nextShopPrice(life);
  const price = gatheringPillPrice(life);
  while (life.pills.gathering < GATHERING_PILL.carryMax && life.stones - price >= reserve) {
    life.stones -= price;
    life.pills.gathering += 1;
  }
}

