import { CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { REALMS } from '../data/realms.ts';
import { realmOf, stageOf } from '../engine/levels.ts';
import type { Messages, Noun, PluralForms } from './types.ts';
import { enForks } from './en-forks.ts';

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
    villageWoods: { nom: 'Village woods', in: 'in the woods by the village' },
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
    hermit: { nom: 'hermit', article: 'a' },
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
  talents: {
    ironSkin: { name: 'Iron Skin', desc: '+10% health in every dream' },
    quickStep: { name: 'Quick Step', desc: 'Retreats succeed more often' },
    goldenTouch: { name: 'Golden Fingers', desc: 'Trophies and spirit stones are worth 20% more' },
    luckyStar: { name: 'Lucky Star', desc: '+3 Luck' },
    steadyHeart: { name: 'Tempered Heart', desc: '+10% breakthrough chance, in dreams and awake' },
    qiSponge: { name: 'Qi Sponge', desc: '+10% cultivation speed' },
    rootRefine: { name: 'Root Refinement', desc: 'Your spirit root improves by one grade' },
    deathMemory: { name: 'Memory of Death', desc: '+25% damage against whoever killed you' },
  },
  rewardTitle: (r, c) => {
    switch (r.kind) {
      case 'qi':
        return 'Echo of Qi';
      case 'technique':
        return `Technique “${c.m.techniques[r.key]}”`;
      case 'cultivation':
        return `Method “${c.m.techniques[r.key]}”`;
      case 'item':
        return cap(c.item(r.item, 'nom'));
      case 'talent': {
        const name = c.m.talents[r.talent.key]!.name;
        return r.talent.enemy ? `${name}: ${c.enemy(r.talent.enemy).nom}` : name;
      }
      case 'stats':
        return 'Tempering';
      case 'knowledge':
        return `Knowledge: ${c.m.knowledge[r.key]!.name}`;
    }
  },
  rewardDesc: (r, c) => {
    switch (r.kind) {
      case 'qi':
        return `+${r.amount} qi while awake`;
      case 'technique':
        return 'Known from the first day of every dream';
      case 'cultivation':
        return 'Faster cultivation, in dreams and awake';
      case 'item':
        return `${c.m.ranks[r.item.rank]} rank, level ${r.item.level}. Worn at the start of every dream`;
      case 'talent':
        return c.m.talents[r.talent.key]!.desc;
      case 'stats':
        return Object.entries(r.stats)
          .map(([k, v]) => `+${v} ${c.m.stats[k as keyof typeof c.m.stats]}`)
          .join(', ');
      case 'knowledge':
        return c.m.knowledge[r.key]!.desc;
    }
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
    reality: 'Awake',
    inDream: 'In the dream',
    charges: 'Dreams in store',
    nextCharge: (t) => `next in ${t}`,
    chooseTitle: 'The dream is over. What will you take with you?',
    autopilot: 'Autopilot',
    autopilotHint: 'Picks a reward by priority and falls asleep again',
    priority: 'Reward priority',
    rewardKinds: {
      qi: 'Qi',
      talent: 'Talents',
      item: 'Items',
      technique: 'Techniques',
      cultivation: 'Cultivation methods',
      stats: 'Tempering',
      knowledge: 'Knowledge',
    },
    moveUp: 'Up',
    moveDown: 'Down',
    breakthrough: (realm) => `Attempt the breakthrough to ${realm}`,
    breakthroughChance: (p) => `${p}% chance`,
    injured: (t) => `Meridians healing: ${t}`,
    talents: 'Talents',
    noTalents: 'None yet',
    resting: 'The Pillow is resting',
    nextDream: 'Next dream',
    fate: 'Fate points',
    instinct: 'Instinct',
    start: 'Starting place',
    blessing: 'Blessing of Fate',
    blessingHint: '+5 Luck for the whole life',
    cost: (n) => `${n} pts`,
    knowledge: 'Knowledge from past dreams',
    forkWaiting: (t) => `The dream awaits your decision: ${t}`,
    forkInstinct: (name) => `Then the instinct decides: ${name}`,
    waitForMe: 'Always wait for my choice',
    waitForMeHint: 'Forks never decide themselves',
  },
  instincts: {
    cautious: { name: 'Cautious', desc: 'Runs in time, lives long, grows slowly' },
    bold: { name: 'Bold', desc: 'Picks fights with stronger foes and grows on danger' },
    greedy: { name: 'Greedy', desc: 'Earns more stones and hates to spend them' },
    righteous: { name: 'Righteous', desc: 'Helps the weak, and the sect values it more' },
  },
  startPlaces: {
    azureCloudSect: { name: 'Azure Cloud Sect', desc: 'Your home sect', elder: 'An elder of the Azure Cloud Sect' },
    thousandPillValley: {
      name: 'Valley of a Thousand Pills',
      desc: 'Pills at half price, three pills to start, more herbs',
      elder: 'An elder of the Valley of a Thousand Pills',
    },
    ironFistClan: {
      name: 'Iron Fist Clan',
      desc: 'Spirit-rank bracers to start and a cheap armory',
      elder: 'An elder of the Iron Fist Clan',
    },
  },
  knowledge: {
    oldZhangCave: { name: "Old Zhang's Cave", desc: 'In every dream you can take a technique from it' },
    hiddenSpring: { name: 'Hidden Qi Spring', desc: '+25% cultivation during Foundation Establishment' },
    thousandPillValley: { name: 'Valley of a Thousand Pills', desc: 'New starting place: cheap pills' },
    ironFistClan: { name: 'Iron Fist Clan', desc: 'New starting place: clan bracers and a cheap armory' },
  },
  forks: enForks,
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
      const elder = c.m.startPlaces[e.start ?? 'azureCloudSect']!.elder;
      const instinct = e.instinct ? ` Your instinct: ${c.m.instincts[e.instinct].name.toLowerCase()}.` : '';
      return `You are ${c.age(e.ageMonths)}. ${elder} ${reaction}. You follow ${c.m.paths[e.path]}.${instinct}`;
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
        case 'sensed':
          return `${age} You felt the pressure of a stranger's qi — ${a(foe)} (${c.level(e.enemyLevel)}) — and hid in time.`;
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
    reward: (e, c) => `On waking, you took with you: ${c.m.rewardTitle(e.reward, c)}${e.auto ? ' (autopilot)' : ''}.`,
    realStageUp: (e, c) =>
      `Awake, you reached ${realmName(c.m, e.level)}, ${c.m.stage(stageOf(e.level))}. Every dream now begins from here.`,
    realBreakthrough: (e, c) =>
      e.success
        ? `Awake, the sky above the inn darkened — you broke through to ${realmName(c.m, e.level)}! Every dream now begins from here.`
        : `Awake, the breakthrough to ${realmName(c.m, e.level)} failed. Your meridians burn, and the Pillow will stay silent until they heal.`,
    fork: (e, c) => c.m.forks[e.fork]!.question(e, c),
    forkResult: (e, c) => {
      const line = c.m.forks[e.fork]!.results[`${e.option}/${e.outcome}`]!(e, c);
      return e.auto ? `${line} (instinct)` : line;
    },
    remembered: (e, c) => {
      const age = `You are ${c.age(e.ageMonths)}.`;
      if (e.knowledge === 'hiddenSpring') return `${age} You meditate by the spring you remember from a past dream. Qi flows faster.`;
      return e.technique
        ? `${age} You remembered Old Zhang's cave from a past dream. The manual lay right where you left it — “${c.m.techniques[e.technique]}” is yours.`
        : `${age} You remembered Old Zhang's cave. Its old seals still held ${e.amount ?? 0} qi.`;
    },
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
