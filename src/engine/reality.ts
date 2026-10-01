import { MAX_LEVEL } from '../data/realms.ts';
import { ROOTS } from '../data/roots.ts';
import { DEATH_MEMORY, TALENTS, TALENT_EFFECTS } from '../data/talents.ts';
import { COMBAT_TECHNIQUES, CULTIVATION_TECHNIQUES, MAX_COMBAT_TECHNIQUES } from '../data/techniques.ts';
import type { Emit } from './dream.ts';
import { cultivationRate, growStats, hasTalent, STAT_KEYS } from './hero.ts';
import { isRealmGate, qiToReach, totalProgress } from './levels.ts';
import { itemPower } from './loot.ts';
import { chance, nextFloat, pickWeighted, type Rng } from './rng.ts';
import type { GameState, Hero, Life, Reward, RewardKind, Stats } from './types.ts';

/** The Pillow holds this many dreams at most. */
export const CHARGE_MAX = 4;
/** Beats (~3 s each at ×1) to recover one charge: about five minutes. */
export const BEATS_PER_CHARGE = 100;
/** A failed real breakthrough silences the Pillow for this many beats (about half an hour). */
export const INJURY_BEATS = 600;
/** Waking meditation: one beat is worth this many dreamed months of meditation. */
const REAL_MONTHS_PER_BEAT = 1 / 200;

export const DEFAULT_PRIORITY: RewardKind[] = ['knowledge', 'qi', 'talent', 'item', 'technique', 'cultivation', 'stats'];

/** Fate points earned by a finished dream. */
export function fateFor(score: number): number {
  return 1 + Math.floor(score / 80);
}

/** Quality tier of a dream's rewards from its life score. */
export function rewardQuality(score: number): number {
  return score < 60 ? 0 : score < 160 ? 1 : 2;
}

const QI_SHARE = [0.3, 0.45, 0.6];
const MASTERY_KEPT = [0.3, 0.5, 0.7];
const STAT_POINTS = [2, 3, 4];

// --- Real time --------------------------------------------------------------

/** One beat of waking life: the Pillow recovers, the hero meditates, injuries heal. */
export function realityBeat(s: GameState, rng: Rng, emit: Emit): void {
  const hero = s.hero;
  if (s.charges < CHARGE_MAX) {
    s.chargeBeats += 1;
    if (s.chargeBeats >= BEATS_PER_CHARGE) {
      s.charges += 1;
      s.chargeBeats = 0;
    }
  } else s.chargeBeats = 0;

  if (hero.injuryBeats > 0) hero.injuryBeats -= 1;
  if (hero.level >= MAX_LEVEL) return;
  hero.qi += cultivationRate(hero.root, hero.path, hero.level, hero.cultivation, hero.talents) * REAL_MONTHS_PER_BEAT;
  settleRealQi(s, rng, emit);
}

/** Stage-ups inside a realm happen on their own; a realm gate waits for the player. */
function settleRealQi(s: GameState, rng: Rng, emit: Emit): void {
  const hero = s.hero;
  while (hero.level < MAX_LEVEL) {
    const next = hero.level + 1;
    const need = qiToReach(next);
    if (hero.qi < need) return;
    if (isRealmGate(next)) {
      hero.qi = need;
      return;
    }
    hero.qi -= need;
    hero.level = next;
    growStats(hero.path, hero.stats, 2, rng);
    emit({ kind: 'realStageUp', level: next });
  }
  hero.qi = 0;
}

export function canAttemptRealBreakthrough(hero: Hero): boolean {
  const next = hero.level + 1;
  return next <= MAX_LEVEL && isRealmGate(next) && hero.qi >= qiToReach(next) && hero.injuryBeats === 0;
}

export function realBreakthroughChance(hero: Hero): number {
  const heart = hasTalent(hero.talents, 'steadyHeart') ? TALENT_EFFECTS.steadyHeartBreakthrough : 0;
  return Math.min(0.95, 0.5 + 0.01 * hero.stats.mind + heart);
}

export function realBreakthrough(s: GameState, rng: Rng, emit: Emit): void {
  const hero = s.hero;
  if (!canAttemptRealBreakthrough(hero)) return;
  const next = hero.level + 1;
  if (chance(rng, realBreakthroughChance(hero))) {
    hero.level = next;
    hero.qi = 0;
    growStats(hero.path, hero.stats, 4, rng);
    emit({ kind: 'realBreakthrough', level: next, success: true });
  } else {
    hero.qi *= 0.7;
    hero.injuryBeats = INJURY_BEATS;
    emit({ kind: 'realBreakthrough', level: next, success: false });
  }
}

// --- Rewards ----------------------------------------------------------------

/** Three things the hero could carry out of the dream that just ended. */
export function makeOffer(hero: Hero, life: Life, score: number, rng: Rng): Reward[] {
  const q = rewardQuality(score);
  const candidates: Reward[] = [];

  const gained = totalProgress(life.level, life.qi) - life.startProgress;
  const qi = Math.round(gained * QI_SHARE[q]!);
  // At the current ceiling qi has nowhere to go.
  if (qi > 0 && hero.level < MAX_LEVEL) candidates.push({ kind: 'qi', amount: qi });

  const known = new Set(hero.techniques.map((t) => t.key));
  const newTech = life.techniques
    .filter((t) => !known.has(t.key))
    .sort((a, b) => COMBAT_TECHNIQUES[b.key]!.k - COMBAT_TECHNIQUES[a.key]!.k)[0];
  if (newTech) candidates.push({ kind: 'technique', key: newTech.key, uses: Math.floor(newTech.uses * MASTERY_KEPT[q]!) });

  const cultIdx = (key: string) => CULTIVATION_TECHNIQUES.findIndex((t) => t.key === key);
  if (cultIdx(life.cultivation) > cultIdx(hero.cultivation)) candidates.push({ kind: 'cultivation', key: life.cultivation });

  const item = bestItemUpgrade(hero, life);
  if (item) candidates.push({ kind: 'item', item });

  const talents = talentOffers(hero, life, q, rng);
  if (talents[0]) candidates.push({ kind: 'talent', talent: talents[0] });

  // Something found in this dream and never known before is always on the table.
  const offer: Reward[] = [];
  const found = life.discoveries.find((k) => !hero.knowledge.includes(k));
  if (found) offer.push({ kind: 'knowledge', key: found });
  const pool = [...candidates];
  while (offer.length < 3 && pool.length > 0) offer.push(pool.splice(Math.floor(nextFloat(rng) * pool.length), 1)[0]!);
  // Not enough real choices: fill with another talent and stat tempering.
  for (const talent of talents.slice(1)) if (offer.length < 3) offer.push({ kind: 'talent', talent });
  if (offer.length < 3) offer.push({ kind: 'stats', stats: temperStats(hero, STAT_POINTS[q]!, rng) });
  if (offer.length < 3) offer.push({ kind: 'stats', stats: temperStats(hero, STAT_POINTS[q]!, rng) });
  return offer;
}

function bestItemUpgrade(hero: Hero, life: Life) {
  let best: { item: (typeof life.equipment)[keyof typeof life.equipment]; gain: number } | null = null;
  for (const item of Object.values(life.equipment)) {
    // Plain Mortal-rank gear comes with every dream anyway; only ranked items are worth carrying out.
    if (item.rank === 0) continue;
    const current = hero.equipment[item.slot];
    const gain = itemPower(item, hero.path) - (current ? itemPower(current, hero.path) : 0);
    if (gain > 0 && (!best || gain > best.gain)) best = { item, gain };
  }
  return best?.item ? structuredClone(best.item) : null;
}

function talentOffers(hero: Hero, life: Life, q: number, rng: Rng) {
  const out = [];
  const enemy = life.death?.cause === 'killed' ? life.death.enemy : undefined;
  if (enemy && !hasTalent(hero.talents, DEATH_MEMORY, enemy)) out.push({ key: DEATH_MEMORY, enemy });
  const pool = TALENTS.filter(
    (t) =>
      t.minQuality <= q &&
      !hasTalent(hero.talents, t.key) &&
      !(t.key === 'rootRefine' && hero.root === 'heavenly'),
  );
  const first = pool.length ? pickWeighted(rng, pool) : null;
  if (first) out.push({ key: first.key });
  const rest = pool.filter((t) => t !== first);
  if (rest.length) out.push({ key: pickWeighted(rng, rest).key });
  return out;
}

function temperStats(hero: Hero, points: number, rng: Rng): Partial<Stats> {
  const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats;
  growStats(hero.path, stats, points, rng);
  return Object.fromEntries(Object.entries(stats).filter(([, v]) => v > 0));
}

/** Gives the reward to the real hero. */
export function applyReward(s: GameState, reward: Reward, rng: Rng, emit: Emit): void {
  const hero = s.hero;
  switch (reward.kind) {
    case 'qi':
      hero.qi += reward.amount;
      settleRealQi(s, rng, emit);
      return;
    case 'technique': {
      if (hero.techniques.length >= MAX_COMBAT_TECHNIQUES) {
        const weakest = hero.techniques.reduce((a, b) => (COMBAT_TECHNIQUES[a.key]!.k <= COMBAT_TECHNIQUES[b.key]!.k ? a : b));
        hero.techniques = hero.techniques.filter((t) => t !== weakest);
      }
      hero.techniques.push({ key: reward.key, uses: reward.uses });
      return;
    }
    case 'cultivation':
      hero.cultivation = reward.key;
      return;
    case 'item':
      hero.equipment[reward.item.slot] = structuredClone(reward.item);
      return;
    case 'talent':
      if (reward.talent.key === 'rootRefine') {
        const idx = ROOTS.findIndex((r) => r.key === hero.root);
        hero.root = ROOTS[Math.min(ROOTS.length - 1, idx + 1)]!.key;
      } else hero.talents.push({ ...reward.talent });
      return;
    case 'stats':
      for (const key of STAT_KEYS) hero.stats[key] += reward.stats[key] ?? 0;
      return;
    case 'knowledge':
      if (!hero.knowledge.includes(reward.key)) hero.knowledge.push(reward.key);
      return;
  }
}

/** The autopilot takes the first reward kind on the player's priority list. */
export function autoPick(offer: Reward[], priority: RewardKind[]): number {
  for (const kind of priority) {
    const idx = offer.findIndex((r) => r.kind === kind);
    if (idx >= 0) return idx;
  }
  return 0;
}
