import { FORKS, FORK_CHANCE, FORK_WAIT_BEATS, type ForkDef } from '../data/forks.ts';
import { zoneFor } from '../data/zones.ts';
import { addTechnique, encounter, nextLibraryTechnique, type Emit } from './dream.ts';
import { maxHp } from './hero.ts';
import { qiToReach } from './levels.ts';
import { makeItem, rollRank, takeItem } from './loot.ts';
import { chance, nextFloat, nextInt, pickWeighted, type Rng } from './rng.ts';
import type { GameEvent, GameState, Item, Life } from './types.ts';

type ForkResult = Extract<GameEvent, { kind: 'forkResult' }>;
type Extra = Partial<Pick<ForkResult, 'amount' | 'item' | 'technique' | 'knowledge'>>;

/** Maybe a fork appears this month. Returns true if the dream now waits for an answer. */
export function maybeFork(s: GameState, rng: Rng, emit: Emit): boolean {
  if (!chance(rng, FORK_CHANCE)) return false;
  const { hero, life } = s;
  const zone = zoneFor(life.level).key;
  const eligible = FORKS.filter(
    (f) =>
      life.level >= f.minLevel &&
      life.level <= f.maxLevel &&
      (!f.zone || f.zone === zone) &&
      !(f.unlessKnown && (hero.knowledge.includes(f.unlessKnown) || life.discoveries.includes(f.unlessKnown))),
  );
  if (eligible.length === 0) return false;
  const def = pickWeighted(rng, eligible);
  const cost = forkCost(def, life);
  const options = def.options.map((o) => o.key).filter((o) => optionAvailable(def.key, o, life, cost));
  life.fork = { key: def.key, options, deadline: s.beat + FORK_WAIT_BEATS, cost, enemyLevel: life.level + 2 };
  emit({ kind: 'fork', ageMonths: life.ageMonths, fork: def.key, cost }, 4);
  return true;
}

function forkCost(def: ForkDef, life: Life): number {
  if (def.key === 'oldManManual') return life.stones;
  if (def.key === 'duelChallenge') return 15 + 5 * life.level;
  return 0;
}

function optionAvailable(fork: string, option: string, life: Life, cost: number): boolean {
  if (fork === 'oldManManual' && option === 'buy') return cost >= 10;
  if (fork === 'duelChallenge' && option === 'bribe') return life.stones >= cost;
  return true;
}

/** What the dreamer's instinct would choose. */
export function instinctChoice(s: GameState): string {
  const { life } = s;
  const fork = life.fork!;
  const def = FORKS.find((f) => f.key === fork.key)!;
  const preferred = def.options.find((o) => o.instincts.includes(life.instinct) && fork.options.includes(o.key));
  const cautious = def.options.find((o) => o.instincts.includes('cautious') && fork.options.includes(o.key));
  return (preferred ?? cautious ?? def.options.find((o) => fork.options.includes(o.key)))!.key;
}

/** Plays out the chosen option. The dream may end here (a fight lost in a secret realm, say). */
export function resolveFork(s: GameState, rng: Rng, emit: Emit, option: string, auto: boolean): void {
  const { life } = s;
  const fork = life.fork;
  if (!fork || !fork.options.includes(option)) return;
  life.fork = null;
  const result = (outcome: string, extra: Extra = {}, priority = 5) =>
    emit({ kind: 'forkResult', ageMonths: life.ageMonths, fork: fork.key, option, outcome, auto, ...extra }, priority);
  const L = life.level;

  switch (fork.key) {
    case 'oldManManual':
      switch (option) {
        case 'buy':
          life.stones -= fork.cost;
          if (chance(rng, 0.6)) return result('real', manual(life), 6);
          return result('fake');
        case 'refuse':
          return result('none', {}, 2);
        case 'rob': {
          const r = encounter(s, rng, emit, 'hermit', L + 4, { avoidable: false, quiet: true });
          if (r === 'lost') return;
          if (r === 'won') return result('won', manual(life), 6);
          return result('fled');
        }
        case 'bow':
          if (chance(rng, 0.35)) return result('taught', manual(life), 6);
          return result('laughed', {}, 3);
      }
      return;

    case 'injuredStranger':
      switch (option) {
        case 'help': {
          if (life.pills.healing > 0) life.pills.healing -= 1;
          const roll = nextFloat(rng);
          if (roll < 0.2) return result('elder', { item: gift(s, rng, 1) }, 6);
          if (roll < 0.4 && discover(s, 'thousandPillValley')) return result('valley', { knowledge: 'thousandPillValley' }, 6);
          life.luckBonus += 2;
          return result('grateful', {}, 3);
        }
        case 'rob': {
          life.luckBonus -= 2;
          if (chance(rng, 0.15)) {
            const r = encounter(s, rng, emit, 'banditCultivator', L + 2, { avoidable: false, quiet: true });
            if (r === 'lost') return;
            return result('woke', {}, 4);
          }
          const amount = 20 + 10 * L;
          life.stones += amount;
          return result('loot', { amount }, 3);
        }
        case 'pass':
          return result('none', {}, 2);
      }
      return;

    case 'duelChallenge':
      switch (option) {
        case 'accept': {
          const r = encounter(s, rng, emit, 'youngMaster', fork.enemyLevel, { avoidable: false, lethal: false, quiet: true });
          if (r === 'won') {
            const amount = 30 + 5 * L;
            life.contribution += amount;
            const clan = chance(rng, 0.25) && discover(s, 'ironFistClan');
            return result('won', clan ? { amount, knowledge: 'ironFistClan' } : { amount }, 6);
          }
          if (r === 'beaten') return result('lost', {}, 4);
          return result('fled', {}, 3);
        }
        case 'refuse':
          life.contribution = Math.max(0, life.contribution - 10);
          return result('face', {}, 2);
        case 'bribe':
          life.stones -= fork.cost;
          return result('paid', { amount: fork.cost }, 2);
      }
      return;

    case 'secretRealm':
      switch (option) {
        case 'enter': {
          for (let i = 1; i <= 3; i++) {
            const r = encounter(s, rng, emit, pickGuardian(s, rng), L + i, { avoidable: false, quiet: true });
            if (r === 'lost') return;
            if (r !== 'won') return result('fled', {}, 4);
          }
          const amount = Math.round(qiToReach(L + 1) * 0.5);
          life.qi = Math.min(qiToReach(L + 1), life.qi + amount);
          return result('treasure', { item: gift(s, rng, 2), amount }, 7);
        }
        case 'lurk': {
          const r = encounter(s, rng, emit, 'banditCultivator', L + 1, { avoidable: false, foeHp: 0.4, quiet: true });
          if (r === 'lost') return;
          if (r !== 'won') return result('none', {}, 2);
          const amount = 30 + 10 * L;
          life.stones += amount;
          return result('loot', { amount }, 4);
        }
        case 'skip':
          return result('none', {}, 2);
      }
      return;

    case 'hiddenCave':
      discover(s, 'oldZhangCave');
      if (option === 'remember') return result('none', { knowledge: 'oldZhangCave' }, 5);
      {
        const roll = nextFloat(rng);
        if (roll < 0.2) {
          life.hp = Math.max(1, Math.round(life.hp - maxHp(life) * 0.4));
          return result('trap', { knowledge: 'oldZhangCave' }, 5);
        }
        if (roll < 0.7) return result('treasure', { item: gift(s, rng, 1), knowledge: 'oldZhangCave' }, 6);
        return result('empty', { knowledge: 'oldZhangCave' }, 5);
      }

    case 'qiSpring':
      discover(s, 'hiddenSpring');
      if (option === 'mark') return result('none', { knowledge: 'hiddenSpring' }, 5);
      {
        const amount = Math.round(qiToReach(L + 1) * 0.4);
        life.qi = Math.min(qiToReach(L + 1), life.qi + amount);
        return result('qi', { amount, knowledge: 'hiddenSpring' }, 6);
      }
  }
}

/** A real manual teaches the next library technique, or gives qi if there is nothing left to learn. */
function manual(life: Life): Extra {
  const technique = nextLibraryTechnique(life);
  if (technique) {
    addTechnique(life, technique);
    return { technique };
  }
  const amount = Math.round(qiToReach(life.level + 1) * 0.3);
  life.qi = Math.min(qiToReach(life.level + 1), life.qi + amount);
  return { amount };
}

function gift(s: GameState, rng: Rng, minRank: number): Item {
  const { life } = s;
  const item = makeItem(rng, life.level, rollRank(rng, 5, minRank), life.path);
  takeItem(life, item, life.path);
  return item;
}

/** Returns true if this is news: the hero did not know it and has not found it yet in this dream. */
function discover(s: GameState, key: string): boolean {
  if (s.hero.knowledge.includes(key) || s.life.discoveries.includes(key)) return false;
  s.life.discoveries.push(key);
  return true;
}

function pickGuardian(s: GameState, rng: Rng): string {
  const enemies = zoneFor(s.life.level).enemies.filter((e) => e.key !== 'youngMaster');
  return enemies[nextInt(rng, 0, enemies.length - 1)]!.key;
}
