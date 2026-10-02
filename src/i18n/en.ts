import { CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { REALMS } from '../data/realms.ts';
import { realmOf, stageOf } from '../engine/levels.ts';
import { questReason } from './index.ts';
import type { Messages, Noun, PluralForms } from './types.ts';
import { enForks } from './en-forks.ts';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "a, b and c" */
const joinList = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
/** "a spirit boar", or just the name for proper nouns. */
const a = (n: Noun) => (n.article ? `${n.article} ${n.nom}` : n.nom);
/** "the spirit boar", or just the name for proper nouns. */
const the = (n: Noun) => (n.article ? `the ${n.nom}` : n.nom);

const MONTHS: PluralForms = { one: 'a month', other: '{n} months' };
const STONES: PluralForms = { one: 'a spirit stone', other: '{n} spirit stones' };
const POINTS: PluralForms = { one: 'a contribution point', other: '{n} contribution points' };
const FOES: PluralForms = { one: 'one foe defeated', other: '{n} foes defeated' };
const HERBS: PluralForms = { one: 'a bundle of spirit herbs', other: '{n} bundles of spirit herbs' };
const ORE: PluralForms = { one: 'a chunk of spirit ore', other: '{n} chunks of spirit ore' };
const CLASHES: PluralForms = { one: 'one clash', other: '{n} clashes' };
const BOLTS: PluralForms = { one: 'a bolt', other: '{n} bolts' };
const YEARS: PluralForms = { one: 'a year', other: '{n} years' };
/** "an elder", "a senior sister". */
const withArticle = (noun: string) => `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`;
/** "grey spirit wolf" → "grey spirit wolves", good enough for the beasts in this world. */
const pluralNoun = (noun: string) =>
  noun.endsWith('wolf') ? `${noun.slice(0, -1)}ves` : noun.endsWith('s') ? noun : `${noun}s`;

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
    poisonMistSwamps: { nom: 'Poison Mist Swamps', in: 'in the Poison Mist Swamps' },
    burningSands: { nom: 'Burning Sands', in: 'in the Burning Sands' },
    northernIsles: { nom: 'Northern Isles', in: 'on the Northern Isles' },
    heavenlyStairs: { nom: 'Heavenly Stairs', in: 'on the Heavenly Stairs' },
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
    bloodMoonCultist: { nom: 'Blood Moon cultist', article: 'a' },
    venomToad: { nom: 'giant venom toad', article: 'a' },
    mireCrocodile: { nom: 'mire crocodile', article: 'a' },
    cultAdept: { nom: 'Blood Moon adept', article: 'a' },
    cultElder: { nom: 'the Blood Moon Elder', article: '' },
    flameScorpion: { nom: 'flame scorpion', article: 'a' },
    sandWyrm: { nom: 'sand wyrm', article: 'a' },
    ruinSpirit: { nom: 'ruin spirit', article: 'a' },
    fireDragonScorpion: { nom: 'the Fire Dragon-Scorpion', article: '' },
    seaSerpent: { nom: 'sea serpent', article: 'a' },
    stormHawk: { nom: 'storm hawk', article: 'a' },
    pirateCultivator: { nom: 'pirate cultivator', article: 'a' },
    islandTurtle: { nom: 'the Old Island Turtle', article: '' },
    heavenGuard: { nom: 'heavenly guardian', article: 'a' },
    heartIllusion: { nom: 'heart illusion', article: 'a' },
    bloodMoonPatriarch: { nom: 'the Blood Moon Patriarch', article: '' },
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
    nineHeavensScripture: 'Scripture of the Nine Heavens',
    starfallPalm: 'Starfall Palm',
    voidSeveringBlade: 'Void-Severing Blade',
  },
  crafts: { alchemy: 'Alchemy', forging: 'Forging', talismans: 'Talismans' },
  products: {
    healingPill: { one: 'a healing pill', other: '{n} healing pills' },
    gatheringPill: { one: 'a Spirit Gathering pill', other: '{n} Spirit Gathering pills' },
    gatePill: { one: 'a breakthrough pill', other: '{n} breakthrough pills' },
    escapeTalisman: { one: 'a Thousand-Li talisman', other: '{n} Thousand-Li talismans' },
    thunderTalisman: { one: 'a thunder talisman', other: '{n} thunder talismans' },
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
    thunderScar: { name: 'Lightning-Scarred', desc: 'The Heavenly Tribulation strikes a quarter softer' },
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
      case 'craft':
        return `Craft: ${c.m.crafts[r.craft]}, level ${r.level}`;
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
      case 'craft':
        return 'Your hands remember: every dream starts with this much skill';
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
      duty: 'On sect duty',
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
      craft: 'Crafts',
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
    karma: 'Karma',
    reputation: 'Reputation',
    quest: 'Task',
    map: 'Map of the Realm Under Heaven',
    mapHere: 'you are here',
    mapDeaths: (n) => `dreams ended here: ${n}`,
    secrets: (k, t) => `Secrets: ${k} of ${t}`,
    finalBattle: 'Challenge the Patriarch, awake',
    finalHint: 'All six Secrets are known. The Patriarch is already on his way to the inn.',
    endingTitle: 'Ascension',
    endingText:
      'You open your eyes. The Blood Moon Patriarch lies at the threshold of the inn, and the Taoist unhurriedly lifts the pot from the fire. “The millet is done,” he says. A thousand dreams are over. Ahead lies immortality.',
    crafts: 'Crafts',
    materials: 'Materials, in stones',
    mats: { herbs: 'herbs', cores: 'beast cores', ore: 'ore' },
    gatheringPills: 'Spirit Gathering pills',
    talismans: 'Talismans',
    talismanKinds: { escape: 'Thousand-Li', thunder: 'thunder' },
    shop: (n) => `Shop in town, level ${n}`,
    statistics: 'Statistics',
    statDreams: 'Dreams lived',
    statYears: 'Years dreamed',
    statKills: 'Foes defeated',
    statBosses: 'Bosses slain',
    wakings: 'How the dreams ended',
    deathCauses: { killed: 'killed in battle', oldAge: 'old age', deviation: 'qi deviation', tribulation: 'Heavenly Tribulation' },
    nemeses: 'Who killed you most',
    records: 'Records',
    recordLevel: (level, n) => `Highest realm: ${level} (dream #${n})`,
    recordAge: (age, n) => `Longest life: ${age} (dream #${n})`,
    recordScore: (score, n) => `Best score: ${score} (dream #${n})`,
    byInstinct: 'By instinct',
    instinctRow: (dreams, avg) => `${dreams} dreams, average score ${avg}`,
    chronicleHint: (n) => `The last ${n} dreams. Click a dream to recall the details.`,
    carriedOut: (title) => `Carried out of the dream: ${title}`,
    secondary: 'Secondary instinct',
    noSecondary: 'None',
    sectRank: 'Rank in the sect',
    grudge: 'Debt to settle',
    nextRank: (rank, realm, rep) => `Next: ${rank} — needs ${realm} and reputation ${rep}`,
  },
  sectRank: (rank, c) =>
    ['outer disciple', 'inner disciple', c.g('senior brother', 'senior sister'), 'elder'][rank] ?? 'elder',
  instincts: {
    cautious: { name: 'Cautious', desc: 'Avoids any fight it is not sure to win. Lives longer, but misses a lot' },
    bold: { name: 'Bold', desc: 'Overrates itself and grabs every chance to grow stronger. Often dies young' },
    greedy: { name: 'Greedy', desc: 'Takes only profitable work, hunts until the bag is full, hates to spend' },
    righteous: { name: 'Righteous', desc: 'Helps people and the sect, hates demons, sometimes refuses unearned pay' },
    curious: { name: 'Curious', desc: 'Strays off the path, stumbles on more secrets, and sometimes wanders where it is too early to go' },
    vengeful: { name: 'Vengeful', desc: 'Remembers everyone it ran from, and sooner or later comes back to settle the debt' },
    lazy: { name: 'Lazy', desc: 'Short trips, long meditations, the easiest work. Running from a fight is too much effort too' },
    ambitious: { name: 'Ambitious', desc: 'Chases glory and rank in the sect: duels, elite tasks, bosses' },
  },
  questDesc: (q, c) => {
    switch (q.kind) {
      case 'hunt':
        return `hunting ${pluralNoun(c.enemy(q.enemy ?? 'spiritBoar').nom)}`;
      case 'herbs':
        return 'gathering spirit herbs';
      case 'delivery':
        return 'delivering a letter to a neighbouring sect';
      case 'mining':
        return 'mining spirit ore';
      case 'sectDuty':
        return 'duty at the sect';
      case 'eliteBeast':
        return 'tracking down a pack leader';
      case 'escort':
        return 'guarding a merchant caravan';
      case 'defendVillage':
        return 'defending a village from beasts';
      case 'demonHunt':
        return 'hunting Blood Moon cultists';
    }
  },
  questReason: {
    cautious: 'the safest',
    bold: 'the one that would temper you most',
    greedy: 'the best paid',
    righteous: 'the one that helps people',
    curious: 'what leads somewhere new',
    vengeful: 'what settles scores',
    lazy: 'the easiest',
    ambitious: 'what brings glory',
  },
  questReasonPlain: 'what was within reach',
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
    secretRavine: {
      name: 'Secret of the Black Ravine',
      desc: 'The Chief carried a blood-red token marked with a moon: the Blood Moon Cult pays bandits to watch the Azure Cloud Sect.',
    },
    secretWolves: {
      name: 'Secret of the Shadow Wolves',
      desc: 'The shadow wolves were driven mad by cult rites deep in the forest. Someone in the sect is opening the way for the cultists.',
    },
    secretElder: {
      name: 'Secret of the Cult Elder',
      desc: 'Dying, the cult elder named a name: Elder Wang — the one who once judged your spirit root — is the Blood Moon spy.',
    },
    secretRuins: {
      name: 'Secret of the Burning Ruins',
      desc: 'The ruins of an ancient sect say it plainly: the cult seeks the Jade Pillow. Whoever holds it can live a life again — and undo a defeat.',
    },
    secretTurtle: {
      name: 'Secret of the Old Turtle',
      desc: 'The turtle remembers the Taoist from the inn: once the Patriarch’s sworn brother, he stole the Pillow and hid it where no one would look — in an ordinary inn.',
    },
    secretPatriarch: {
      name: 'Secret of the Patriarch',
      desc: 'In a dream you defeated the Patriarch and saw his weakness. Now you know: he is already on his way to the inn. The millet is about to boil.',
    },
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
      const streak = e.secondary ? `, with a ${c.m.instincts[e.secondary].name.toLowerCase()} streak` : '';
      const instinct = e.instinct ? ` Your instinct: ${c.m.instincts[e.instinct].name.toLowerCase()}${streak}.` : '';
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
          return c.vary(
            `${age} The fight with ${the(foe)} nearly became your last, but you held on.`,
            `${age} After the fight with ${the(foe)} you spent a long time counting your ribs. All present. Mostly.`,
          );
        case 'stronger':
          return c.vary(
            `${age} You defeated ${a(foe)} stronger than yourself (${c.level(e.enemyLevel)}).`,
            `${age} ${cap(the(foe))} (${c.level(e.enemyLevel)}) took you for easy prey. It was a fatal mistake.`,
          );
        case 'fled':
          return c.vary(
            `${age} Seeing what ${the(foe)} could do, you made a tactical retreat so fast you nearly invented a new movement technique.`,
            `${age} You and ${the(foe)} stared at each other for a long time. You blinked first — and were over the hill a moment later.`,
          );
        case 'rescued':
          return `${age} ${cap(the(foe))} left you to die in a ditch, but somehow you survived.`;
        case 'sensed':
          return c.vary(
            `${age} You felt the pressure of a stranger's qi — ${a(foe)} (${c.level(e.enemyLevel)}) — and hid in time.`,
            `${age} The ground trembled: ${a(foe)} (${c.level(e.enemyLevel)}) was walking nearby. You took another path.`,
          );
        case 'ambushed':
          return `${age} You tried to slip past ${the(foe)}, but it caught up with you. Somehow, you won.`;
        case 'revenge':
          return (e.years ?? 0) > 0
            ? `${age} ${cap(c.plural(e.years ?? 0, YEARS))} later you found ${the(foe)} again — and paid back the debt.`
            : `${age} You caught up with ${the(foe)} that same year — and paid back the debt.`;
        case 'escaped':
          return c.vary(
            `${age} ${cap(the(foe))} was already raising the final blow when you tore your Thousand-Li talisman — and found yourself a hundred li away, barely alive.`,
            `${age} You lost to ${the(foe)}, but the Thousand-Li talisman was faster than the last blow. You came to in a ditch three mountains away.`,
          );
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
      const parts = [
        e.kills > 0 ? c.plural(e.kills, FOES) : '',
        e.herbs > 0 ? c.plural(e.herbs, HERBS) : '',
        e.ore ? c.plural(e.ore, ORE) : '',
      ].filter(Boolean);
      const dodged = e.avoided ? `${c.plural(e.avoided, CLASHES)} avoided` : '';
      const what = [joinList(parts), dodged].filter(Boolean).join('; ');
      return `You are ${c.age(e.ageMonths)}. You spent ${c.plural(e.months, MONTHS)} ${c.m.zones[e.zone]!.in}: ${what}.`;
    },
    questTaken: (e, c) =>
      `You are ${c.age(e.ageMonths)}. From the task board you took ${questReason(e, c.m)}: ${c.m.questDesc(e.quest, c)} (${c.plural(e.quest.stones, STONES)}, ${c.plural(e.quest.contribution, POINTS)}).`,
    questDone: (e, c) => {
      const age = `You are ${c.age(e.ageMonths)}.`;
      const desc = c.m.questDesc(e.quest, c);
      const bonus = e.item ? ` And on top of that: ${c.item(e.item, 'acc')}.` : '';
      if (e.declined) {
        return `${age} Task done: ${desc}. You refused the ${c.plural(e.quest.stones, STONES)} — “I have not earned it.” The sect still recorded ${c.plural(e.quest.contribution, POINTS)}.${bonus}`;
      }
      return c.vary(
        `${age} Task done: ${desc}. The sect paid ${c.plural(e.quest.stones, STONES)} and ${c.plural(e.quest.contribution, POINTS)}.${bonus}`,
        `${age} ${cap(desc)}: done. The treasurer counted out ${c.plural(e.quest.stones, STONES)} and wrote down ${c.plural(e.quest.contribution, POINTS)}.${bonus}`,
      );
    },
    questFailed: (e, c) =>
      c.vary(
        `You are ${c.age(e.ageMonths)}. Task failed: ${c.m.questDesc(e.quest, c)}. Your standing in the sect slipped a little.`,
        `You are ${c.age(e.ageMonths)}. Task failed: ${c.m.questDesc(e.quest, c)}. The senior brother at the task board did not even look up.`,
      ),
    pillWait: (e, c) =>
      c.vary(
        `You are ${c.age(e.ageMonths)}. You are ready to break through to ${realmName(c.m, e.level)}, but you will not risk it without a pill.`,
        `You are ${c.age(e.ageMonths)}. Your meridians hum with qi, but without a pill you dare not knock on the gate of ${realmName(c.m, e.level)}. A little more meditation never hurt.`,
      ),
    sect: (e, c) => {
      const deeds: string[] = [];
      if (e.sold > 0) deeds.push(`sold trophies and materials for ${c.plural(e.sold, STONES)}`);
      if (e.income) deeds.push(`took ${c.plural(e.income, STONES)} from your shop`);
      const made = (craft: string) =>
        (e.batches ?? []).filter((b) => b.craft === craft && b.made > 0).map((b) => c.plural(b.made, c.m.products[b.product]));
      const pills = made('alchemy');
      const talismans = made('talismans');
      if (pills.length) deeds.push(`brewed ${joinList(pills)}`);
      if (talismans.length) deeds.push(`drew ${joinList(talismans)}`);
      if (e.item) deeds.push(`forged ${e.item.rank === 0 ? c.item(e.item, 'acc') : `a ${c.m.rankOf[e.item.rank]} ${c.item(e.item, 'acc')}`}`);
      const age = `You are ${c.age(e.ageMonths)}.`;
      const tried = (e.batches ?? []).reduce((n, b) => n + b.tried, 0) + (e.forgeFailed ? 1 : 0);
      const spoiled = (e.batches ?? []).reduce((n, b) => n + b.tried - b.made, 0) + (e.forgeFailed ? 1 : 0);
      if (!deeds.length) {
        return c.vary(
          `${age} Everything in the sect workshop went wrong: the cauldron exploded, and your eyebrows took a month to grow back.`,
          `${age} Nothing in the sect workshop worked. The master craftsman silently took back your key.`,
        );
      }
      const loss =
        spoiled === 0 || tried === 0
          ? ''
          : e.forgeFailed && spoiled === 1
            ? ' The ore came out of the forge as slag.'
            : c.vary(' Some of it was spoiled.', ' One cauldron did explode, though.');
      return `${age} At the sect you ${joinList(deeds)}.${loss}`;
    },
    explore: (e, c) =>
      c.vary(
        `You are ${c.age(e.ageMonths)}. Curiosity got the better of you: now you hunt ${c.m.zones[e.zone]!.in}, where it is still too early for you to be.`,
        `You are ${c.age(e.ageMonths)}. “Just a look over that hill,” you thought, and found yourself ${c.m.zones[e.zone]!.in}.`,
      ),
    grudge: (e, c) => `You are ${c.age(e.ageMonths)}. You will remember ${the(c.enemy(e.enemy, e.name))}. You will meet again.`,
    promotion: (e, c) =>
      e.rank >= 3
        ? `You are ${c.age(e.ageMonths)}. The sect named you an elder. Now the young bow to you — and gossip behind your back.`
        : c.vary(
            `You are ${c.age(e.ageMonths)}. The sect recognised both your strength and your deeds: you are now ${withArticle(c.m.sectRank(e.rank, c))}.`,
            `You are ${c.age(e.ageMonths)}. The elders argued for a long time, but strength and deeds won: you are now ${withArticle(c.m.sectRank(e.rank, c))}.`,
          ),
    shop: (e, c) => {
      const age = `You are ${c.age(e.ageMonths)}.`;
      switch (e.action) {
        case 'opened':
          return `${age} You opened a shop of pills and herbs in the town below the mountain. The clerk steals, but in moderation.`;
        case 'expanded':
          return c.vary(
            `${age} You bought out the shop next door: your business grew (level ${e.level}).`,
            `${age} Your shop grew (level ${e.level}). Now you have two clerks, and they steal from each other.`,
          );
        case 'robbed':
          return `${age} While you were on the road, your shop was robbed: ${c.plural(e.amount ?? 0, STONES)} gone.`;
      }
    },
    technique: (e, c) =>
      isCultivation(e.technique)
        ? `You are ${c.age(e.ageMonths)}. The sect library opened the cultivation method “${c.m.techniques[e.technique]}” to you.`
        : c.vary(
            `You are ${c.age(e.ageMonths)}. In the sect library you mastered the technique “${c.m.techniques[e.technique]}”.`,
            `You are ${c.age(e.ageMonths)}. Three sleepless nights in the library, and you walked out knowing “${c.m.techniques[e.technique]}”.`,
          ),
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
      c.vary(
        `You are ${c.age(e.ageMonths)}. The breakthrough to ${realmName(c.m, e.level)} failed: qi lashed your meridians, and you coughed blood for a year.`,
        `You are ${c.age(e.ageMonths)}. The breakthrough to ${realmName(c.m, e.level)} slipped away at the last moment. You spent a year flat on your back, studying the ceiling of your cell.`,
      ),
    wall: (e, c) =>
      `You are ${c.age(e.ageMonths)}. You stand at the peak of Dao Union. Beyond it lies only Ascension, and no dream can grant that. You become a sect elder and teach the young.`,
    tribulation: (e, c) => {
      const age = `You are ${c.age(e.ageMonths)}.`;
      if (e.survived) return `${age} The sky split open: ${c.plural(e.bolts, BOLTS)}, one after another. You stood — the Heavenly Tribulation is passed.`;
      const held = e.bolts - 1;
      return held > 0
        ? `${age} The Heavenly Tribulation: you withstood ${c.plural(held, BOLTS)}, but the next was the last.`
        : `${age} The Heavenly Tribulation: the very first bolt was the last.`;
    },
    secret: (e, c) => `You are ${c.age(e.ageMonths)}. ${c.m.knowledge[e.secret]!.name}. ${c.m.knowledge[e.secret]!.desc}`,
    finalBattle: (e) =>
      e.won
        ? 'Awake, you met the Blood Moon Patriarch on the threshold of the inn — and won.'
        : 'Awake, the Blood Moon Patriarch proved stronger. The Pillow pulled you back from death, but your meridians will burn for a long time.',
    death: (e, c) => {
      const age = `You are ${c.age(e.ageMonths)}.`;
      switch (e.death.cause) {
        case 'killed': {
          const foe = c.enemy(e.death.enemy!, e.death.enemyName);
          if (e.death.misjudged) return `${age} You were sure you could take ${the(foe)}. You were wrong.`;
          return c.vary(`${age} ${cap(the(foe))} proved stronger. You died.`, `${age} The last thing you saw was ${the(foe)}. You died.`);
        }
        case 'oldAge':
          return c.vary(
            `${age} You died quietly of old age in your cell.`,
            `${age} You fell asleep over a cup of tea and did not wake. Your disciples say the tea was still warm.`,
            `${age} Your heart stopped at dawn, in the middle of meditation. The calmest death you remember.`,
          );
        case 'deviation':
          return c.vary(
            `${age} Your qi spun out of control. All that was left of you was a scorched mat.`,
            `${age} Your qi rushed down the wrong meridians, and you burned out from within like an untended stove.`,
          );
        case 'tribulation':
          return c.vary(
            `${age} All that was left of you was a scorched mark on the rock. Heaven would not let you rise.`,
            `${age} Heaven took one look at you and decided it was too early.`,
          );
      }
    },
    wake: (e, c) =>
      c.vary(
        `You wake up in the inn. The millet is not done yet. Dream #${e.dream} is over; life score ${e.score}.`,
        `You open your eyes. The Taoist is still stirring the millet. Dream #${e.dream} is behind you; life score ${e.score}.`,
        `The inn, the smell of millet, a creaking bench. Dream #${e.dream} is over; life score ${e.score}.`,
      ),
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
          : s.death.cause === 'tribulation'
            ? 'Heavenly Tribulation.'
            : 'Qi deviation.';
    return `Dream #${s.n}: age ${c.age(s.ageMonths)}, ${c.level(s.level)}. ${cause} Score: ${s.score}.`;
  },
};
