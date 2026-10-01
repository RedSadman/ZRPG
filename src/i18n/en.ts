import { CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { REALMS } from '../data/realms.ts';
import { realmOf, stageOf } from '../engine/levels.ts';
import type { Messages, Noun, PluralForms } from './types.ts';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "a spirit boar", or just the name for proper nouns. */
const a = (n: Noun) => (n.article ? `${n.article} ${n.nom}` : n.nom);
/** "the spirit boar", or just the name for proper nouns. */
const the = (n: Noun) => (n.article ? `the ${n.nom}` : n.nom);

const MONTHS: PluralForms = { one: 'a month', other: '{n} months' };
const STONES: PluralForms = { one: 'a spirit stone', other: '{n} spirit stones' };
const POINTS: PluralForms = { one: 'a contribution point', other: '{n} contribution points' };
const FOES: PluralForms = { one: 'one foe defeated', other: '{n} foes defeated' };
const HERBS: PluralForms = { one: 'a bundle of spirit herbs', other: '{n} bundles of spirit herbs' };

const isCultivation = (key: string) => CULTIVATION_TECHNIQUES.some((t) => t.key === key);
const realmName = (m: Messages, level: number) => m.realms[REALMS[realmOf(level)]!.key]!.nom;

export const en: Messages = {
  gameTitle: 'Yellow Millet Dream',
  gameSubtitle: 'While the millet cooks, you live a whole life',
  heroNames: {
    xiaoLin: 'Xiao Lin',
    liMo: 'Li Mo',
    wangFeng: 'Wang Feng',
    luoChen: 'Luo Chen',
    zhouYun: 'Zhou Yun',
    chenXue: 'Chen Xue',
    suQing: 'Su Qing',
    baiLan: 'Bai Lan',
  },
  realms: {
    mortal: { nom: 'Mortal', gen: 'Mortal' },
    qiCondensation: { nom: 'Qi Condensation', gen: 'Qi Condensation' },
    foundation: { nom: 'Foundation Establishment', gen: 'Foundation Establishment' },
    goldenCore: { nom: 'Golden Core', gen: 'Golden Core' },
    nascentSoul: { nom: 'Nascent Soul', gen: 'Nascent Soul' },
    spiritTransformation: { nom: 'Spirit Transformation', gen: 'Spirit Transformation' },
    daoUnion: { nom: 'Dao Union', gen: 'Dao Union' },
  },
  stage: (n) => `stage ${n}`,
  stageGen: (n) => `stage ${n}`,
  roots: { trash: 'trash', common: 'common', rare: 'rare', heavenly: 'heavenly' },
  paths: { sword: 'the Way of the Sword', body: 'Body Tempering', alchemy: 'the Way of the Alchemist', demonic: 'the Demonic Path' },
  zones: {
    azureFoothills: { nom: 'Azure Cloud Foothills', in: 'in the foothills of Azure Cloud Mountain' },
    thousandBeastForest: { nom: 'Forest of a Thousand Beasts', in: 'in the Forest of a Thousand Beasts' },
  },
  enemies: {
    spiritBoar: { nom: 'spirit boar', article: 'a' },
    greyWolf: { nom: 'grey spirit wolf', article: 'a' },
    banditCultivator: { nom: 'bandit cultivator', article: 'a' },
    bullyDisciple: { nom: 'bully disciple', article: 'a' },
    blackRavineChief: { nom: 'the Black Ravine Chief', article: '' },
    shadowWolf: { nom: 'shadow wolf', article: 'a' },
    spiritSerpent: { nom: 'spirit serpent', article: 'a' },
    ironbackBear: { nom: 'ironback bear', article: 'an' },
    youngMaster: { nom: 'young master', article: 'a' },
    shadowWolfKing: { nom: 'the Shadow Wolf King', article: '' },
  },
  surnames: {
    ma: 'Ma',
    liu: 'Liu',
    gao: 'Gao',
    zhao: 'Zhao',
    sun: 'Sun',
    hu: 'Hu',
    he: 'He',
    song: 'Song',
    tang: 'Tang',
    qian: 'Qian',
    feng: 'Feng',
    du: 'Du',
  },
  // A named rival becomes a proper noun: "Young Master Liu", no article.
  namedEnemy: (n, s) => ({ ...n, nom: `${n.nom.split(' ').map(cap).join(' ')} ${s}`, article: '' }),
  itemBases: {
    sword: { nom: 'sword', article: 'a' },
    sabre: { nom: 'sabre', article: 'a' },
    spear: { nom: 'spear', article: 'a' },
    fan: { nom: 'war fan', article: 'a' },
    gauntlets: { nom: 'gauntlets', article: '' },
    robe: { nom: 'robe', article: 'a' },
    bracers: { nom: 'bracers', article: '' },
    boots: { nom: 'boots', article: '' },
    pendant: { nom: 'jade pendant', article: 'a' },
    ring: { nom: 'ring', article: 'a' },
  },
  affixes: {
    thousandTears: 'Thousand Tears',
    forgottenDisciple: 'the Forgotten Disciple',
    azureCloud: 'the Azure Cloud',
    ironMountain: 'the Iron Mountain',
    drunkenImmortal: 'the Drunken Immortal',
    silentPine: 'the Silent Pine',
    crimsonDawn: 'the Crimson Dawn',
    turtleShell: 'the Turtle Shell',
  },
  ranks: ['Mortal', 'Spirit', 'Earth', 'Heaven'],
  rankOf: ['Mortal-rank', 'Spirit-rank', 'Earth-rank', 'Heaven-rank'],
  techniques: {
    threeCloudsSword: 'Three Clouds of the Azure Sword',
    ironFistPalm: 'Iron Fist Palm',
    poisonMistNeedle: 'Poison Mist Needle',
    bloodMoonClaw: 'Blood Moon Claw',
    shadowCraneStep: 'Shadow Crane Step',
    mountainSplitPalm: 'Mountain-Splitting Palm',
    thousandSwordRain: 'Rain of a Thousand Swords',
    azureCloudSutra: 'Azure Cloud Sutra',
    nineTurnsBreath: 'Breath of Nine Turns',
    heavenEarthMethod: 'Method of Heaven and Earth United',
  },
  stats: { body: 'Body', qi: 'Qi', agi: 'Agility', mind: 'Mind', luck: 'Luck' },
  slots: { weapon: 'Weapon', robe: 'Robe', bracers: 'Bracers', boots: 'Boots', pendant: 'Pendant', ring: 'Ring' },
  itemName: (item, _form, m) => {
    const base = m.itemBases[item.base]!;
    const affix = item.affixes[0];
    if (affix) return `${base.nom.split(' ').map(cap).join(' ')} of ${m.affixes[affix]}`;
    return base.article ? `a plain ${base.nom}` : `plain ${base.nom}`;
  },
  ui: {
    dream: (n) => `Dream #${n}`,
    realm: 'Realm',
    qi: 'Qi to breakthrough',
    hp: 'Health',
    spiritStones: 'Spirit stones',
    contribution: 'Contribution',
    pills: 'Healing pills',
    root: 'Spirit root',
    path: 'Path',
    stats: 'Attributes',
    equipment: 'Equipment',
    techniques: 'Techniques',
    cultivation: 'Cultivation method',
    activity: {
      sect: 'At the sect',
      travel: 'On the road',
      hunt: 'Hunting',
      returning: 'Heading back to the sect',
      meditate: 'Meditating',
      retired: 'Sect elder',
    },
    awake: 'Awake',
    journal: 'Dream journal',
    chronicle: 'Chronicle of Lives',
    lastDream: 'Last dream',
    noDreamsYet: 'No dream has ended yet.',
    speed: 'Speed',
    pause: 'Pause',
    language: 'Language',
    newGame: 'New game',
    newGameConfirm: 'Start over? The current save will be erased.',
  },
  ageYears: { one: '{n}', other: '{n}' },
  events: {
    dreamStart: (e, c) =>
      e.dream === 1
        ? `Dream #1. ${c.heroName} lays ${c.g('his', 'her')} head on the Jade Pillow. The millet in the pot has only just begun to boil.`
        : c.vary(
            `Dream #${e.dream}. You close your eyes on the Jade Pillow once more.`,
            `Dream #${e.dream}. The millet barely simmers, and you are already asleep again.`,
            `Dream #${e.dream}. The inn blurs away, and you are standing at the sect gates again.`,
          ),
    joinSect: (e, c) => {
      const reaction = {
        trash: 'studied your trash spirit root for a long time, sighed, and sent you to the kitchens',
        common: 'glanced at your common spirit root and nodded without interest',
        rare: 'saw your rare spirit root and smiled for the first time that day',
        heavenly: 'saw your heavenly spirit root and dropped his pipe',
      }[e.root];
      return `You are ${c.age(e.ageMonths)}. An elder of the Azure Cloud Sect ${reaction}. You follow ${c.m.paths[e.path]}.`;
    },
    fight: (e, c) => {
      const foe = c.enemy(e.enemy, e.name);
      const age = `You are ${c.age(e.ageMonths)}.`;
      switch (e.note) {
        case 'boss':
          return c.vary(
            `${age} You tracked down ${the(foe)} and won after a long fight. The whole sect will talk about it.`,
            `${age} ${cap(the(foe))} fell at your feet. You can hardly believe it yourself.`,
          );
        case 'rival':
          return c.vary(
            `${age} ${cap(the(foe))} asked whether you dared to breathe the same air. You dared. Now ${c.eg(e.enemy, 'he', 'she')} breathes carefully.`,
            `${age} ${cap(the(foe))} demanded that you bow. You bowed — and struck from below.`,
          );
        case 'closeCall':
          return `${age} The fight with ${the(foe)} nearly became your last, but you held on.`;
        case 'stronger':
          return `${age} You defeated ${a(foe)} stronger than yourself (${c.level(e.enemyLevel)}).`;
        case 'fled':
          return c.vary(
            `${age} Seeing what ${the(foe)} could do, you made a tactical retreat so fast you nearly invented a new movement technique.`,
            `${age} You and ${the(foe)} stared at each other for a long time. You blinked first — and were over the hill a moment later.`,
          );
        case 'rescued':
          return `${age} ${cap(the(foe))} left you to die in a ditch, but somehow you survived.`;
      }
    },
    loot: (e, c) => {
      const base = c.m.itemBases[e.item.base]!;
      const it = base.article ? 'it' : 'them';
      const verb = e.item.slot === 'weapon' ? `have not let go of ${it} since` : `put ${it} on at once`;
      // Plain items already carry "a plain …"; ranked ones read "a Spirit-rank Sabre of …".
      const what =
        e.item.rank === 0
          ? c.item(e.item, 'acc')
          : `${base.article ? 'a ' : ''}${c.m.rankOf[e.item.rank]} ${c.item(e.item, 'acc')}`;
      return `You are ${c.age(e.ageMonths)}. You won ${what} and ${verb}.`;
    },
    hunt: (e, c) => {
      const parts = [e.kills > 0 ? c.plural(e.kills, FOES) : '', e.herbs > 0 ? c.plural(e.herbs, HERBS) : ''].filter(Boolean);
      return `You are ${c.age(e.ageMonths)}. You spent ${c.plural(e.months, MONTHS)} ${c.m.zones[e.zone]!.in}: ${parts.join(' and ')}.`;
    },
    sect: (e, c) => {
      const age = `You are ${c.age(e.ageMonths)}.`;
      const reward = `earned ${c.plural(e.contribution, POINTS)} for a finished task`;
      if (e.sold === 0) return `${age} At the sect you ${reward}.`;
      const sold = `At the sect you sold your trophies for ${c.plural(e.sold, STONES)}`;
      return e.contribution > 0 ? `${age} ${sold} and ${reward}.` : `${age} ${sold}.`;
    },
    technique: (e, c) =>
      isCultivation(e.technique)
        ? `You are ${c.age(e.ageMonths)}. The sect library opened the cultivation method “${c.m.techniques[e.technique]}” to you.`
        : `You are ${c.age(e.ageMonths)}. In the sect library you mastered the technique “${c.m.techniques[e.technique]}”.`,
    stageUp: (e, c) => {
      const where = `${realmName(c.m, e.level)}, ${c.m.stage(stageOf(e.level))}`;
      return c.vary(
        `You are ${c.age(e.ageMonths)}. After ${c.plural(e.months, MONTHS)} of meditation you reached ${where}.`,
        `You are ${c.age(e.ageMonths)}. ${cap(c.plural(e.months, MONTHS))} motionless beneath the pine — and you reached ${where}.`,
      );
    },
    realmUp: (e, c) => {
      const pill = e.pill ? ' The pill did help after all.' : '';
      if (e.level === 1) {
        return `You are ${c.age(e.ageMonths)}. Qi flooded your meridians for the first time — you are no longer mortal. Qi Condensation!${pill}`;
      }
      return `You are ${c.age(e.ageMonths)}. The sky above the cave darkened, qi surged through your meridians — you broke through to ${realmName(c.m, e.level)}!${pill}`;
    },
    breakthroughFail: (e, c) =>
      `You are ${c.age(e.ageMonths)}. The breakthrough to ${realmName(c.m, e.level)} failed: qi lashed your meridians, and you coughed blood for a year.`,
    wall: (e, c) =>
      `You are ${c.age(e.ageMonths)}. At the peak of Foundation Establishment you felt the wall beyond which the Golden Core begins. The Pillow will not let you further yet. You become a sect elder and teach the young.`,
    death: (e, c) => {
      const age = `You are ${c.age(e.ageMonths)}.`;
      switch (e.death.cause) {
        case 'killed': {
          const foe = c.enemy(e.death.enemy!, e.death.enemyName);
          return c.vary(`${age} ${cap(the(foe))} proved stronger. You died.`, `${age} The last thing you saw was ${the(foe)}. You died.`);
        }
        case 'oldAge':
          return `${age} You died quietly of old age in your cell.`;
        case 'deviation':
          return `${age} Your qi spun out of control. All that was left of you was a scorched mat.`;
      }
    },
    wake: (e) => `You wake up in the inn. The millet is not done yet. Dream #${e.dream} is over; life score ${e.score}.`,
    away: (e, c) => `While you were away, ${c.plural(e.months, MONTHS)} passed in dreams; dreams finished: ${e.dreamsEnded}.`,
  },
  summary: (s, c) => {
    const cause =
      s.death.cause === 'killed'
        ? `Killed by ${a(c.enemy(s.death.enemy!, s.death.enemyName))}.`
        : s.death.cause === 'oldAge'
          ? 'Died of old age.'
          : 'Qi deviation.';
    return `Dream #${s.n}: age ${c.age(s.ageMonths)}, ${c.level(s.level)}. ${cause} Score: ${s.score}.`;
  },
};
