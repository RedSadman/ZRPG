import { ENEMIES } from '../data/enemies.ts';
import { INSTINCTS } from '../data/instincts.ts';
import { BOARD_SIZE, QUESTS, REPUTATION_PAY, baseContribution, baseStones, type QuestDef } from '../data/quests.ts';
import { zoneFor } from '../data/zones.ts';
import { enemyCombatant, heroCombatant } from './combat.ts';
import { willingToForge } from './crafts.ts';
import { perceivedWin } from './judgement.ts';
import { nextFloat, nextInt, pickWeighted, type Rng } from './rng.ts';
import type { Life, Quest, QuestNote } from './types.ts';

/** Elite beasts are this much tougher than their kin. */
export const ELITE_HP = 1.8;
export const ELITE_ATK = 1.2;

/** A few tasks of different kinds that the sect posts this visit. */
export function postBoard(life: Life, rng: Rng): Quest[] {
  const pool = QUESTS.filter((q) => life.level >= q.minLevel);
  const board: Quest[] = [];
  const left = [...pool];
  while (board.length < BOARD_SIZE && left.length > 0) {
    const def = pickWeighted(rng, left);
    left.splice(left.indexOf(def), 1);
    board.push(makeQuest(def, life, rng));
  }
  return board;
}

export function makeQuest(def: QuestDef, life: Life, rng: Rng): Quest {
  const L = life.level;
  const pay = Math.min(2, 1 + REPUTATION_PAY * Math.max(0, life.reputation));
  const zone = zoneFor(L);
  const targets = zone.enemies.filter((e) => !ENEMIES[e.key]!.rival && !ENEMIES[e.key]!.demonic);
  const fights = nextInt(rng, def.fights[0], def.fights[1]);
  return {
    kind: def.kind,
    ...(def.foes === 'target' ? { enemy: pickWeighted(rng, targets).key } : {}),
    fights,
    fightsLeft: fights,
    monthsLeft: nextInt(rng, def.months[0], def.months[1]),
    offset: def.levelOffset,
    foes: def.foes,
    elite: def.elite ?? false,
    peaceful: def.peaceful ?? false,
    inSect: def.inSect ?? false,
    ore: def.ore ?? false,
    stones: Math.round(baseStones(L) * def.stones * pay),
    contribution: Math.round(baseContribution(L) * def.contribution * pay),
    karma: def.karma,
    itemChance: def.itemChance,
    started: false,
    failed: false,
  };
}

/** Who the task's fights are against. */
export function questFoe(quest: Quest, life: Life, rng: Rng): string {
  switch (quest.foes) {
    case 'target':
      return quest.enemy!;
    case 'bandits':
      return 'banditCultivator';
    case 'demons':
      // From Golden Core on, the cult sends its adepts.
      return life.level >= 19 ? 'cultAdept' : 'bloodMoonCultist';
    case 'beasts': {
      const beasts = zoneFor(life.level).enemies.filter((e) => ENEMIES[e.key]!.kind === 'beast');
      return beasts.length ? pickWeighted(rng, beasts).key : 'spiritBoar';
    }
  }
}

/**
 * Picks the task this temperament wants most: what each gain is worth to it, times how likely it thinks it is to
 * pull it off, minus how much it fears dying on the way.
 */
export function chooseQuest(board: Quest[], life: Life, rng: Rng): Quest {
  const ins = INSTINCTS[life.instinct];
  let options = board;
  if (ins.wantsPay) {
    const avg = board.reduce((sum, q) => sum + q.stones, 0) / board.length;
    const paid = board.filter((q) => q.stones >= avg);
    if (paid.length) options = paid;
  }
  // Work whose hardest fight looks unwinnable is not taken at all, if anything else is on the board.
  const odds = new Map(options.map((q) => [q, fightOdds(q, life, rng)]));
  const bar = ins.engageAt * (ins.plansFor === 'worst' ? 1 : 0.9);
  const doable = options.filter((q) => odds.get(q)! >= bar);
  if (doable.length) options = doable;
  let best = options[0]!;
  let bestUtility = -Infinity;
  for (const quest of options) {
    const utility = questUtility(quest, life, odds.get(quest)!, rng);
    if (utility > bestUtility) {
      best = quest;
      bestUtility = utility;
    }
  }
  return best;
}

/** How the hero rates one of the task's fights: against the worst, an average or the easiest foe it could send. */
function fightOdds(quest: Quest, life: Life, rng: Rng): number {
  if (quest.fights === 0) return 1;
  const ins = INSTINCTS[life.instinct];
  const L = life.level;
  const [low, high] = quest.offset;
  const offset = ins.plansFor === 'worst' ? high : ins.plansFor === 'best' ? low : Math.round((low + high) / 2);
  const level = zoneFor(L).levels ? 0 : Math.max(0, L + offset);
  const key = quest.enemy ?? questFoe(quest, life, rng);
  const foe = enemyCombatant(ENEMIES[key]!, level);
  if (quest.elite) {
    foe.hp = foe.maxHp = Math.round(foe.maxHp * ELITE_HP);
    foe.weapon *= ELITE_ATK;
  }
  return perceivedWin(life, heroCombatant(life, key), foe, rng);
}

function questUtility(quest: Quest, life: Life, odds: number, rng: Rng): number {
  const ins = INSTINCTS[life.instinct];
  const L = life.level;
  const success = odds ** quest.fights;
  const danger = (1 - success) * 0.5;
  const offsetMid = (quest.offset[0] + quest.offset[1]) / 2;
  const gain =
    ins.values.stones * (quest.stones / baseStones(L)) +
    ins.values.contribution * (quest.contribution / baseContribution(L)) +
    ins.values.karma * (quest.karma / 3) +
    ins.values.power * (quest.itemChance * 2 + Math.max(0, offsetMid) * 0.15 + (quest.ore && willingToForge(life) ? 1 : 0));
  // A pinch of randomness so equal options do not always resolve the same way.
  const fights = ins.fightTaste * quest.fights;
  return success * gain + fights - ins.riskAversion * danger + nextFloat(rng) * 0.01;
}

export function questNote(quest: Quest): QuestNote {
  return {
    kind: quest.kind,
    ...(quest.enemy ? { enemy: quest.enemy } : {}),
    stones: quest.stones,
    contribution: quest.contribution,
  };
}
