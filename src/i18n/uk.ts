import { REALMS } from '../data/realms.ts';
import { CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { realmOf, stageOf } from '../engine/levels.ts';
import { questReason } from './index.ts';
import type { Messages, Noun, PluralForms } from './types.ts';
import { ukForks } from './uk-forks.ts';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "a, b і c" */
const joinList = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} і ${xs.at(-1)}`);

const MONTHS: PluralForms = { one: '{n} місяць', few: '{n} місяці', many: '{n} місяців', other: '{n} місяця' };
const MONTHS_GEN: PluralForms = { one: '{n} місяця', few: '{n} місяців', many: '{n} місяців', other: '{n} місяця' };
const STONES: PluralForms = {
  one: '{n} духовний камінь',
  few: '{n} духовні камені',
  many: '{n} духовних каменів',
  other: '{n} духовного каменя',
};
const POINTS: PluralForms = { one: '{n} очко внеску', few: '{n} очки внеску', many: '{n} очок внеску', other: '{n} очка внеску' };
const FOES: PluralForms = {
  one: '{n} переможений ворог',
  few: '{n} переможені вороги',
  many: '{n} переможених ворогів',
  other: '{n} переможеного ворога',
};
const HERBS: PluralForms = {
  one: '{n} пучок духовних трав',
  few: '{n} пучки духовних трав',
  many: '{n} пучків духовних трав',
  other: '{n} пучка духовних трав',
};
/** After "від": "від 54 духовних каменів". */
const STONES_GEN: PluralForms = {
  one: '{n} духовного каменя',
  few: '{n} духовних каменів',
  many: '{n} духовних каменів',
  other: '{n} духовного каменя',
};
const ORE: PluralForms = {
  one: '{n} шматок духовної руди',
  few: '{n} шматки духовної руди',
  many: '{n} шматків духовної руди',
  other: '{n} шматка духовної руди',
};
/** After "від": "від 3 сутичок". */
const CLASHES: PluralForms = { one: '{n} сутички', few: '{n} сутичок', many: '{n} сутичок', other: '{n} сутички' };
const BOLTS: PluralForms = { one: '{n} блискавка', few: '{n} блискавки', many: '{n} блискавок', other: '{n} блискавки' };

/** "простий меч", "проста шабля", "прості чоботи" — the adjective agrees with the base noun. */
const PLAIN: Record<NonNullable<Noun['gender']>, { nom: string; acc: string }> = {
  m: { nom: 'простий', acc: 'простий' },
  f: { nom: 'проста', acc: 'просту' },
  n: { nom: 'просте', acc: 'просте' },
  pl: { nom: 'прості', acc: 'прості' },
};

const isCultivation = (key: string) => CULTIVATION_TECHNIQUES.some((t) => t.key === key);

export const uk: Messages = {
  gameTitle: 'Сон Жовтого Проса',
  gameSubtitle: 'Поки вариться просо, ти проживаєш ціле життя',
  heroNames: {
    xiaoLin: 'Сяо Лін',
    liMo: 'Лі Мо',
    wangFeng: 'Ван Фен',
    luoChen: 'Ло Чень',
    zhouYun: 'Чжоу Юнь',
    chenXue: 'Чень Сюе',
    suQing: 'Су Цін',
    baiLan: 'Бай Лань',
  },
  realms: {
    mortal: { nom: 'Смертний', gen: 'Смертного' },
    qiCondensation: { nom: 'Конденсація Ці', gen: 'Конденсації Ці' },
    foundation: { nom: 'Закладання Основи', gen: 'Закладання Основи' },
    goldenCore: { nom: 'Золоте Ядро', gen: 'Золотого Ядра' },
    nascentSoul: { nom: 'Зародкова Душа', gen: 'Зародкової Душі' },
    spiritTransformation: { nom: 'Перетворення Духа', gen: 'Перетворення Духа' },
    daoUnion: { nom: 'Злиття з Дао', gen: 'Злиття з Дао' },
  },
  stage: (n) => `${n}-й етап`,
  stageGen: (n) => `${n}-го етапу`,
  roots: { trash: 'сміттєвий', common: 'звичайний', rare: 'рідкісний', heavenly: 'небесний' },
  paths: { sword: 'Шлях Меча', body: 'Загартування Тіла', alchemy: 'Шлях Алхіміка', demonic: 'Демонічний шлях' },
  zones: {
    villageWoods: { nom: 'Ліс біля села', in: 'у лісі біля села' },
    azureFoothills: { nom: 'Околиці гори Лазурової Хмари', in: 'на околицях гори Лазурової Хмари' },
    thousandBeastForest: { nom: 'Ліс Тисячі Звірів', in: 'у Лісі Тисячі Звірів' },
    poisonMistSwamps: { nom: 'Болота Отруйного Туману', in: 'на Болотах Отруйного Туману' },
    burningSands: { nom: 'Пустеля Палаючих Пісків', in: 'у Пустелі Палаючих Пісків' },
    northernIsles: { nom: 'Острови Північного Моря', in: 'на Островах Північного Моря' },
    heavenlyStairs: { nom: 'Небесні Сходи', in: 'на Небесних Сходах' },
  },
  enemies: {
    spiritBoar: { nom: 'духовний кабан', gen: 'духовного кабана', acc: 'духовного кабана', ins: 'духовним кабаном', gender: 'm' },
    greyWolf: {
      nom: 'сірий духовний вовк',
      gen: 'сірого духовного вовка',
      acc: 'сірого духовного вовка',
      ins: 'сірим духовним вовком',
      gender: 'm',
    },
    banditCultivator: {
      nom: 'розбійник-культиватор',
      gen: 'розбійника-культиватора',
      acc: 'розбійника-культиватора',
      ins: 'розбійником-культиватором',
      gender: 'm',
    },
    bullyDisciple: {
      nom: 'задерикуватий учень',
      gen: 'задерикуватого учня',
      acc: 'задерикуватого учня',
      ins: 'задерикуватим учнем',
      gender: 'm',
    },
    blackRavineChief: {
      nom: 'Ватажок Чорної Ущелини',
      gen: 'Ватажка Чорної Ущелини',
      acc: 'Ватажка Чорної Ущелини',
      ins: 'Ватажком Чорної Ущелини',
      gender: 'm',
    },
    shadowWolf: { nom: 'вовк-тінь', gen: 'вовка-тіні', acc: 'вовка-тінь', ins: 'вовком-тінню', gender: 'm' },
    spiritSerpent: { nom: 'духовна змія', gen: 'духовної змії', acc: 'духовну змію', ins: 'духовною змією', gender: 'f' },
    ironbackBear: {
      nom: 'залізноспинний ведмідь',
      gen: 'залізноспинного ведмедя',
      acc: 'залізноспинного ведмедя',
      ins: 'залізноспинним ведмедем',
      gender: 'm',
    },
    youngMaster: { nom: 'молодий майстер', gen: 'молодого майстра', acc: 'молодого майстра', ins: 'молодим майстром', gender: 'm' },
    bloodMoonCultist: {
      nom: 'культист Кривавого Місяця',
      gen: 'культиста Кривавого Місяця',
      acc: 'культиста Кривавого Місяця',
      ins: 'культистом Кривавого Місяця',
      gender: 'm',
    },
    venomToad: { nom: 'отруйна жаба-велетень', gen: 'отруйної жаби-велетня', acc: 'отруйну жабу-велетня', ins: 'отруйною жабою-велетнем', gender: 'f' },
    mireCrocodile: {
      nom: 'болотяний крокодил',
      gen: 'болотяного крокодила',
      acc: 'болотяного крокодила',
      ins: 'болотяним крокодилом',
      gender: 'm',
    },
    cultAdept: {
      nom: 'адепт Кривавого Місяця',
      gen: 'адепта Кривавого Місяця',
      acc: 'адепта Кривавого Місяця',
      ins: 'адептом Кривавого Місяця',
      gender: 'm',
    },
    cultElder: {
      nom: 'Старійшина Культу Кривавого Місяця',
      gen: 'Старійшини Культу Кривавого Місяця',
      acc: 'Старійшину Культу Кривавого Місяця',
      ins: 'Старійшиною Культу Кривавого Місяця',
      gender: 'm',
    },
    flameScorpion: { nom: 'вогняний скорпіон', gen: 'вогняного скорпіона', acc: 'вогняного скорпіона', ins: 'вогняним скорпіоном', gender: 'm' },
    sandWyrm: { nom: 'піщаний змій', gen: 'піщаного змія', acc: 'піщаного змія', ins: 'піщаним змієм', gender: 'm' },
    ruinSpirit: { nom: 'дух руїн', gen: 'духа руїн', acc: 'духа руїн', ins: 'духом руїн', gender: 'm' },
    fireDragonScorpion: {
      nom: 'Вогняний Дракон-Скорпіон',
      gen: 'Вогняного Дракона-Скорпіона',
      acc: 'Вогняного Дракона-Скорпіона',
      ins: 'Вогняним Драконом-Скорпіоном',
      gender: 'm',
    },
    seaSerpent: { nom: 'морський змій', gen: 'морського змія', acc: 'морського змія', ins: 'морським змієм', gender: 'm' },
    stormHawk: { nom: 'штормовий яструб', gen: 'штормового яструба', acc: 'штормового яструба', ins: 'штормовим яструбом', gender: 'm' },
    pirateCultivator: {
      nom: 'пірат-культиватор',
      gen: 'пірата-культиватора',
      acc: 'пірата-культиватора',
      ins: 'піратом-культиватором',
      gender: 'm',
    },
    islandTurtle: {
      nom: 'Стара Черепаха-Острів',
      gen: 'Старої Черепахи-Острова',
      acc: 'Стару Черепаху-Острів',
      ins: 'Старою Черепахою-Островом',
      gender: 'f',
    },
    heavenGuard: { nom: 'небесний вартовий', gen: 'небесного вартового', acc: 'небесного вартового', ins: 'небесним вартовим', gender: 'm' },
    heartIllusion: { nom: 'ілюзія серця', gen: 'ілюзії серця', acc: 'ілюзію серця', ins: 'ілюзією серця', gender: 'f' },
    bloodMoonPatriarch: {
      nom: 'Патріарх Кривавого Місяця',
      gen: 'Патріарха Кривавого Місяця',
      acc: 'Патріарха Кривавого Місяця',
      ins: 'Патріархом Кривавого Місяця',
      gender: 'm',
    },
    hermit: {
      nom: 'старець-відлюдник',
      gen: 'старця-відлюдника',
      acc: 'старця-відлюдника',
      ins: 'старцем-відлюдником',
      gender: 'm',
    },
    shadowWolfKing: {
      nom: 'Король вовків-тіней',
      gen: 'Короля вовків-тіней',
      acc: 'Короля вовків-тіней',
      ins: 'Королем вовків-тіней',
      gender: 'm',
    },
  },
  surnames: {
    ma: 'Ма',
    liu: 'Лю',
    gao: 'Гао',
    zhao: 'Чжао',
    sun: 'Сунь',
    hu: 'Ху',
    he: 'Хе',
    song: 'Сун',
    tang: 'Тан',
    qian: 'Цянь',
    feng: 'Фен',
    du: 'Ду',
  },
  // Chinese surnames do not decline in Ukrainian, so the name simply follows every case form.
  namedEnemy: (n, s) => ({
    ...n,
    nom: `${n.nom} ${s}`,
    gen: n.gen && `${n.gen} ${s}`,
    acc: n.acc && `${n.acc} ${s}`,
    ins: n.ins && `${n.ins} ${s}`,
  }),
  itemBases: {
    sword: { nom: 'меч', acc: 'меч', gender: 'm' },
    sabre: { nom: 'шабля', acc: 'шаблю', gender: 'f' },
    spear: { nom: 'спис', acc: 'спис', gender: 'm' },
    fan: { nom: 'бойове віяло', acc: 'бойове віяло', gender: 'n' },
    gauntlets: { nom: 'кастети', acc: 'кастети', gender: 'pl' },
    robe: { nom: 'мантія', acc: 'мантію', gender: 'f' },
    bracers: { nom: 'наручі', acc: 'наручі', gender: 'pl' },
    boots: { nom: 'чоботи', acc: 'чоботи', gender: 'pl' },
    pendant: { nom: 'нефритовий кулон', acc: 'нефритовий кулон', gender: 'm' },
    ring: { nom: 'персень', acc: 'персень', gender: 'm' },
  },
  affixes: {
    thousandTears: 'Тисячі Сліз',
    forgottenDisciple: 'Забутого Учня',
    azureCloud: 'Лазурової Хмари',
    ironMountain: 'Залізної Гори',
    drunkenImmortal: "П'яного Безсмертного",
    silentPine: 'Тихої Сосни',
    crimsonDawn: 'Багряного Світанку',
    turtleShell: 'Черепашого Панцира',
  },
  ranks: ['Смертний', 'Духовний', 'Земний', 'Небесний'],
  rankOf: ['смертного рангу', 'духовного рангу', 'земного рангу', 'небесного рангу'],
  techniques: {
    threeCloudsSword: 'Три Хмари Лазурового Меча',
    ironFistPalm: 'Долоня Залізного Кулака',
    poisonMistNeedle: 'Голка Отруйного Туману',
    bloodMoonClaw: 'Пазур Кривавого Місяця',
    shadowCraneStep: 'Крок Тіньового Журавля',
    mountainSplitPalm: 'Долоня, що Розколює Гори',
    thousandSwordRain: 'Дощ Тисячі Мечів',
    azureCloudSutra: 'Сутра Лазурової Хмари',
    nineTurnsBreath: "Дихання Дев'яти Обертів",
    heavenEarthMethod: 'Метод Єднання Неба і Землі',
    nineHeavensScripture: "Писання Дев'яти Небес",
    starfallPalm: 'Долоня Падучої Зірки',
    voidSeveringBlade: 'Клинок, що Розтинає Порожнечу',
  },
  crafts: { alchemy: 'Алхімія', forging: 'Ковальство', talismans: 'Талісмани' },
  products: {
    healingPill: { one: '{n} пілюлю відновлення', few: '{n} пілюлі відновлення', many: '{n} пілюль відновлення', other: '{n} пілюлі відновлення' },
    gatheringPill: { one: '{n} пілюлю збирання духу', few: '{n} пілюлі збирання духу', many: '{n} пілюль збирання духу', other: '{n} пілюлі збирання духу' },
    gatePill: { one: 'пілюлю прориву', few: '{n} пілюлі прориву', many: '{n} пілюль прориву', other: '{n} пілюлі прориву' },
    escapeTalisman: { one: '{n} талісман Тисячі Лі', few: '{n} талісмани Тисячі Лі', many: '{n} талісманів Тисячі Лі', other: '{n} талісмана Тисячі Лі' },
    thunderTalisman: { one: '{n} громовий талісман', few: '{n} громові талісмани', many: '{n} громових талісманів', other: '{n} громового талісмана' },
  },
  talents: {
    ironSkin: { name: 'Залізна шкіра', desc: "+10% до здоров'я в кожному сні" },
    quickStep: { name: 'Легкий крок', desc: 'Втеча вдається частіше' },
    goldenTouch: { name: 'Золоті пальці', desc: 'Трофеї та духовні камені на 20% цінніші' },
    luckyStar: { name: 'Щаслива зірка', desc: '+3 до Удачі' },
    steadyHeart: { name: 'Загартоване серце', desc: '+10% до шансу прориву уві сні й наяву' },
    qiSponge: { name: 'Губка для ці', desc: '+10% до швидкості культивації' },
    rootRefine: { name: 'Очищення кореня', desc: 'Духовний корінь стає кращим на ступінь' },
    deathMemory: { name: "Пам'ять смерті", desc: '+25% урону проти того, хто тебе вбив' },
    thunderScar: { name: 'Загартований блискавкою', desc: 'Небесна кара б’є на чверть слабше' },
  },
  rewardTitle: (r, c) => {
    switch (r.kind) {
      case 'qi':
        return 'Відлуння ці';
      case 'technique':
        return `Техніка «${c.m.techniques[r.key]}»`;
      case 'cultivation':
        return `Метод «${c.m.techniques[r.key]}»`;
      case 'item':
        return cap(c.item(r.item, 'nom'));
      case 'talent': {
        const name = c.m.talents[r.talent.key]!.name;
        return r.talent.enemy ? `${name}: ${c.enemy(r.talent.enemy).nom}` : name;
      }
      case 'stats':
        return 'Загартування';
      case 'knowledge':
        return `Знання: ${c.m.knowledge[r.key]!.name}`;
      case 'craft':
        return `Ремесло: ${c.m.crafts[r.craft]}, рівень ${r.level}`;
    }
  },
  rewardDesc: (r, c) => {
    switch (r.kind) {
      case 'qi':
        return `+${r.amount} ці наяву`;
      case 'technique':
        return 'Знатимеш її з першого дня кожного сну';
      case 'cultivation':
        return 'Швидша культивація уві сні й наяву';
      case 'item':
        return `${c.m.ranks[r.item.rank]} ранг, рівень ${r.item.level}. На тобі на початку кожного сну`;
      case 'talent':
        return c.m.talents[r.talent.key]!.desc;
      case 'stats':
        return Object.entries(r.stats)
          .map(([k, v]) => `+${v} ${c.m.stats[k as keyof typeof c.m.stats]}`)
          .join(', ');
      case 'knowledge':
        return c.m.knowledge[r.key]!.desc;
      case 'craft':
        return 'Руки пам’ятають: кожен сон починаєш із цією майстерністю';
    }
  },
  stats: { body: 'Тіло', qi: 'Ці', agi: 'Спритність', mind: 'Свідомість', luck: 'Удача' },
  slots: { weapon: 'Зброя', robe: 'Мантія', bracers: 'Наручі', boots: 'Чоботи', pendant: 'Кулон', ring: 'Персень' },
  itemName: (item, form, m) => {
    const base = m.itemBases[item.base]!;
    const word = form === 'acc' ? (base.acc ?? base.nom) : base.nom;
    const affix = item.affixes[0];
    if (affix) return `${cap(word)} ${m.affixes[affix]}`;
    return `${PLAIN[base.gender ?? 'm'][form]} ${word}`;
  },
  ui: {
    dream: (n) => `Сон №${n}`,
    realm: 'Царство',
    qi: 'Ці до прориву',
    hp: "Здоров'я",
    spiritStones: 'Духовні камені',
    contribution: 'Очки внеску',
    pills: 'Пілюлі відновлення',
    root: 'Духовний корінь',
    path: 'Шлях',
    stats: 'Характеристики',
    equipment: 'Спорядження',
    techniques: 'Техніки',
    cultivation: 'Метод культивації',
    activity: {
      sect: 'У секті',
      travel: 'У дорозі',
      hunt: 'Полює',
      returning: 'Повертається до секти',
      meditate: 'Медитує',
      retired: 'Старійшина секти',
      duty: 'На чергуванні в секті',
    },
    awake: 'Прокинувся',
    journal: 'Журнал сну',
    chronicle: 'Хроніка Життів',
    lastDream: 'Останній сон',
    noDreamsYet: 'Жоден сон ще не скінчився.',
    speed: 'Швидкість',
    pause: 'Пауза',
    language: 'Мова',
    newGame: 'Нова гра',
    newGameConfirm: 'Почати все спочатку? Поточне збереження буде стерто.',
    reality: 'Наяву',
    inDream: 'Уві сні',
    charges: 'Сни в запасі',
    nextCharge: (t) => `наступний за ${t}`,
    chooseTitle: 'Сон скінчився. Що забрати з собою?',
    autopilot: 'Автопілот',
    autopilotHint: 'Сам обирає нагороду за пріоритетом і засинає знову',
    priority: 'Пріоритет нагород',
    rewardKinds: {
      qi: 'Ці',
      talent: 'Таланти',
      item: 'Предмети',
      technique: 'Техніки',
      cultivation: 'Методи культивації',
      stats: 'Загартування',
      knowledge: 'Знання',
      craft: 'Ремесла',
    },
    moveUp: 'Вище',
    moveDown: 'Нижче',
    breakthrough: (realm) => `Спробувати прорив до ${realm}`,
    breakthroughChance: (p) => `шанс ${p}%`,
    injured: (t) => `Меридіани загоюються: ${t}`,
    talents: 'Таланти',
    noTalents: 'Ще жодного',
    resting: 'Подушка відпочиває',
    nextDream: 'Наступний сон',
    fate: 'Очки долі',
    instinct: 'Інстинкт',
    start: 'Місце старту',
    blessing: 'Благословення долі',
    blessingHint: '+5 Удачі на все життя',
    cost: (n) => `${n} оч.`,
    knowledge: 'Знання з минулих снів',
    forkWaiting: (t) => `Сон чекає твого рішення: ${t}`,
    forkInstinct: (name) => `Потім вирішить інстинкт: ${name}`,
    waitForMe: 'Завжди чекати на мій вибір',
    waitForMeHint: 'Розвилки не вирішуються самі',
    karma: 'Карма',
    reputation: 'Репутація',
    quest: 'Завдання',
    map: 'Карта Піднебесної',
    mapHere: 'ти тут',
    mapDeaths: (n) => `тут скінчилося снів: ${n}`,
    secrets: (k, t) => `Таємниці: ${k} з ${t}`,
    finalBattle: 'Кинути виклик Патріарху наяву',
    finalHint: 'Усі шість Таємниць відомі. Патріарх уже йде до корчми.',
    endingTitle: 'Вознесіння',
    endingText:
      'Ти розплющуєш очі. Патріарх Кривавого Місяця лежить біля порога корчми, а даос неквапно знімає казан з вогню. «Просо доварилось», — каже він. Тисяча снів скінчилася. Попереду — безсмертя.',
    crafts: 'Ремесла',
    materials: 'Матеріали, у каменях',
    mats: { herbs: 'трави', cores: 'ядра звірів', ore: 'руда' },
    gatheringPills: 'Пілюлі збирання духу',
    talismans: 'Талісмани',
    talismanKinds: { escape: 'Тисячі Лі', thunder: 'громові' },
    shop: (n) => `Лавка в містечку, рівень ${n}`,
  },
  instincts: {
    cautious: {
      name: 'Обережний',
      desc: 'Не лізе в бій, у перемозі якого не певен. Живе довше, але багато чого не бачить',
    },
    bold: {
      name: 'Зухвалий',
      desc: 'Переоцінює себе й хапається за кожну нагоду стати сильнішим. Часто гине молодим',
    },
    greedy: { name: 'Жадібний', desc: 'Береться лише за вигідне, полює до повної сумки й не любить витрачатися' },
    righteous: {
      name: 'Праведний',
      desc: 'Допомагає людям і секті, ненавидить демонів, іноді відмовляється від незаслуженої плати',
    },
  },
  questDesc: (q, c) => {
    switch (q.kind) {
      case 'hunt':
        return `полювання на ${c.enemy(q.enemy ?? 'spiritBoar').acc}`;
      case 'herbs':
        return 'збір духовних трав';
      case 'delivery':
        return 'доставка листа до сусідньої секти';
      case 'mining':
        return 'видобуток духовної руди';
      case 'sectDuty':
        return 'чергування в секті';
      case 'eliteBeast':
        return 'вистежити звіра-ватажка';
      case 'escort':
        return 'супровід торгового каравану';
      case 'defendVillage':
        return 'захист села від звірів';
      case 'demonHunt':
        return 'полювання на культистів Кривавого Місяця';
    }
  },
  questReason: {
    cautious: 'найбезпечніше',
    bold: 'те, що загартує найбільше',
    greedy: 'найвигідніше',
    righteous: 'те, що допоможе людям',
  },
  questReasonPlain: 'те, що було під силу',
  startPlaces: {
    azureCloudSect: { name: 'Секта Лазурової Хмари', desc: 'Рідна секта', elder: 'Старійшина секти Лазурової Хмари' },
    thousandPillValley: {
      name: 'Долина Тисячі Пілюль',
      desc: 'Пілюлі вдвічі дешевші, на старті три пілюлі, більше трав',
      elder: 'Старійшина Долини Тисячі Пілюль',
    },
    ironFistClan: {
      name: 'Клан Залізного Кулака',
      desc: 'Духовні наручі на старті й дешевий арсенал',
      elder: 'Старійшина Клану Залізного Кулака',
    },
  },
  knowledge: {
    oldZhangCave: { name: 'Печера Старого Чжана', desc: 'У кожному сні можна забрати з неї техніку' },
    hiddenSpring: { name: 'Приховане джерело ці', desc: '+25% до культивації на Закладанні Основи' },
    thousandPillValley: { name: 'Долина Тисячі Пілюль', desc: 'Нове місце старту: дешеві пілюлі' },
    ironFistClan: { name: 'Клан Залізного Кулака', desc: 'Нове місце старту: власні наручі й дешевий арсенал' },
    secretRavine: {
      name: 'Таємниця Чорної Ущелини',
      desc: 'У Ватажка знайшли червоний жетон із місяцем: Культ Кривавого Місяця платить розбійникам, щоб стежили за сектою Лазурової Хмари.',
    },
    secretWolves: {
      name: 'Таємниця вовків-тіней',
      desc: 'Вовків-тіней звели з розуму ритуали культу в глибині лісу. Хтось у секті відчиняє культистам дорогу.',
    },
    secretElder: {
      name: 'Таємниця Старійшини культу',
      desc: "Помираючи, Старійшина культу назвав ім'я: старійшина Ван — той, що колись оглядав твій духовний корінь, — шпигун Кривавого Місяця.",
    },
    secretRuins: {
      name: 'Таємниця палаючих руїн',
      desc: 'У руїнах давньої секти написано: культ шукає Нефритову Подушку. Хто нею володіє, може прожити життя знову — і переграти свою поразку.',
    },
    secretTurtle: {
      name: 'Таємниця Старої Черепахи',
      desc: "Черепаха пам'ятає даоса з корчми: колись він був побратимом Патріарха, викрав у нього Подушку й сховав там, де ніхто не шукатиме, — у звичайній корчмі.",
    },
    secretPatriarch: {
      name: 'Таємниця Патріарха',
      desc: 'Уві сні ти переміг Патріарха й побачив його слабкість. Тепер ти знаєш: він уже йде до корчми. Просо от-от закипить.',
    },
  },
  forks: ukForks,
  ageYears: { one: '{n} рік', few: '{n} роки', many: '{n} років', other: '{n} року' },
  events: {
    dreamStart: (e, c) =>
      e.dream === 1
        ? `Сон №1. ${c.heroName} кладе голову на Нефритову Подушку. Просо в казані тільки-но закипає.`
        : c.vary(
            `Сон №${e.dream}. Ти знову заплющуєш очі на Нефритовій Подушці.`,
            `Сон №${e.dream}. Просо ледь булькає, а ти вже засинаєш знову.`,
            `Сон №${e.dream}. Корчма розпливається, і ти знову стоїш біля воріт секти.`,
          ),
    joinSect: (e, c) => {
      const root = c.m.roots[e.root];
      const reaction = {
        trash: `довго роздивлявся твій ${root} духовний корінь, зітхнув і відправив тебе на кухню`,
        common: `оглянув твій ${root} духовний корінь і байдуже кивнув`,
        rare: `побачив твій ${root} духовний корінь і вперше за день усміхнувся`,
        heavenly: `побачив твій ${root} духовний корінь і впустив люльку`,
      }[e.root];
      const elder = c.m.startPlaces[e.start ?? 'azureCloudSect']!.elder;
      const instinct = e.instinct ? ` Інстинкт — ${c.m.instincts[e.instinct].name.toLowerCase()}.` : '';
      return `Тобі ${c.age(e.ageMonths)}. ${elder} ${reaction}. Твій шлях — ${c.m.paths[e.path]}.${instinct}`;
    },
    fight: (e, c) => {
      const foe = c.enemy(e.enemy, e.name);
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      switch (e.note) {
        case 'boss':
          return c.vary(
            `${age} Ти ${c.g('вистежив', 'вистежила')} ${foe.acc} і після довгого бою ${c.g('переміг', 'перемогла')}. Про це говоритиме вся секта.`,
            `${age} ${cap(foe.nom)} ${c.eg(e.enemy, 'впав', 'впала')} до твоїх ніг. Ти й ${c.g('сам', 'сама')} не віриш, що це сталося.`,
          );
        case 'rival':
          return c.vary(
            `${age} ${cap(foe.nom)} ${c.eg(e.enemy, 'спитав', 'спитала')}, чи смієш ти дихати ${c.eg(e.enemy, 'його', 'її')} повітрям. Ти ${c.g('смів', 'сміла')}. Тепер ${c.eg(e.enemy, 'він', 'вона')} дихає обережно.`,
            `${age} ${cap(foe.nom)} ${c.eg(e.enemy, 'вимагав', 'вимагала')}, щоб ти ${c.g('вклонився', 'вклонилася')}. Ти ${c.g('вклонився', 'вклонилася')} — і ${c.g('вдарив', 'вдарила')} знизу.`,
          );
        case 'closeCall':
          return `${age} Бій із ${foe.ins} ледь не став для тебе останнім, але ти ${c.g('вистояв', 'вистояла')}.`;
        case 'stronger':
          return `${age} Ти ${c.g('здолав', 'здолала')} ${foe.acc} — ворога, сильнішого за тебе (${c.level(e.enemyLevel)}).`;
        case 'fled':
          return c.vary(
            `${age} Побачивши, на що ${c.eg(e.enemy, 'здатен', 'здатна')} ${foe.nom}, ти ${c.g('здійснив', 'здійснила')} тактичний відступ такої швидкості, що мало не ${c.g('осягнув', 'осягнула')} нову техніку руху.`,
            `${age} Ти й ${foe.nom} довго дивилися одне на одного. Першим ${c.g('моргнув', 'моргнула')} ти — і вже за мить ${c.g('був', 'була')} за пагорбом.`,
          );
        case 'rescued':
          return `${age} ${cap(foe.nom)} ${c.eg(e.enemy, 'залишив', 'залишила')} тебе помирати в канаві, але ти якимось дивом ${c.g('вижив', 'вижила')}.`;
        case 'sensed':
          return `${age} Ти ${c.g('відчув', 'відчула')} тиск чужої ці — ${foe.nom} (${c.level(e.enemyLevel)}) — і вчасно ${c.g('сховався', 'сховалася')}.`;
        case 'ambushed':
          return `${age} Ти ${c.g('намагався', 'намагалася')} обійти ${foe.acc}, але ${c.eg(e.enemy, 'він', 'вона')} тебе ${c.eg(e.enemy, 'наздогнав', 'наздогнала')}. Якимось дивом ти ${c.g('переміг', 'перемогла')}.`;
        case 'escaped':
          return c.vary(
            `${age} ${cap(foe.nom)} уже ${c.eg(e.enemy, 'заносив', 'заносила')} останній удар, коли ти ${c.g('розірвав', 'розірвала')} талісман Тисячі Лі — і ${c.g('опинився', 'опинилася')} за сто лі звідти, ледь ${c.g('живий', 'жива')}.`,
            `${age} Бій із ${foe.ins} ти ${c.g('програв', 'програла')}, але талісман Тисячі Лі спрацював раніше за ${c.eg(e.enemy, 'його', 'її')} останній удар. ${c.g('Отямився', 'Отямилася')} ти вже в канаві за три гори звідти.`,
          );
      }
    },
    loot: (e, c) => {
      const name = c.item(e.item, 'acc');
      const rank = c.m.rankOf[e.item.rank];
      const wear =
        e.item.slot === 'weapon'
          ? 'тепер не випускаєш з рук'
          : e.item.slot === 'ring' || e.item.slot === 'pendant'
            ? `одразу ${c.g('надів', 'наділа')}`
            : `одразу ${c.g('вдягнув', 'вдягнула')}`;
      return `Тобі ${c.age(e.ageMonths)}. Ти ${c.g('здобув', 'здобула')} ${name} ${rank} і ${wear}.`;
    },
    hunt: (e, c) => {
      const parts = [
        e.kills > 0 ? c.plural(e.kills, FOES) : '',
        e.herbs > 0 ? c.plural(e.herbs, HERBS) : '',
        e.ore ? c.plural(e.ore, ORE) : '',
      ].filter(Boolean);
      const dodged = e.avoided ? `від ${c.plural(e.avoided, CLASHES)} ти ${c.g('ухилився', 'ухилилася')}` : '';
      const what = parts.length && dodged ? `${joinList(parts)}, а ${dodged}` : joinList(parts) || dodged;
      return `Тобі ${c.age(e.ageMonths)}. Ти ${c.g('провів', 'провела')} ${c.plural(e.months, MONTHS)} ${c.m.zones[e.zone]!.in}: ${what}.`;
    },
    questTaken: (e, c) =>
      `Тобі ${c.age(e.ageMonths)}. З дошки завдань ти ${c.g('обрав', 'обрала')} ${questReason(e, c.m)}: ${c.m.questDesc(e.quest, c)} (${c.plural(e.quest.stones, STONES)}, ${c.plural(e.quest.contribution, POINTS)}).`,
    questDone: (e, c) => {
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      const desc = c.m.questDesc(e.quest, c);
      const bonus = e.item ? ` На додачу — ${c.item(e.item, 'acc')} ${c.m.rankOf[e.item.rank]}.` : '';
      if (e.declined) {
        return `${age} Завдання виконано: ${desc}. Від ${c.plural(e.quest.stones, STONES_GEN)} ти ${c.g('відмовився', 'відмовилася')}: «Я цього не ${c.g('заслужив', 'заслужила')}». Секта записала тобі ${c.plural(e.quest.contribution, POINTS)}.${bonus}`;
      }
      return `${age} Завдання виконано: ${desc}. Секта заплатила ${c.plural(e.quest.stones, STONES)} і ${c.plural(e.quest.contribution, POINTS)}.${bonus}`;
    },
    questFailed: (e, c) =>
      `Тобі ${c.age(e.ageMonths)}. Завдання провалено: ${c.m.questDesc(e.quest, c)}. Репутація в секті трохи похитнулася.`,
    pillWait: (e, c) =>
      `Тобі ${c.age(e.ageMonths)}. Ти ${c.g('готовий', 'готова')} до прориву до ${c.m.realms[realmKey(e.level)]!.gen}, але без пілюлі ризикувати не ${c.g('став', 'стала')}.`,
    sect: (e, c) => {
      const deeds: string[] = [];
      if (e.sold > 0) deeds.push(`${c.g('продав', 'продала')} трофеї й матеріали за ${c.plural(e.sold, STONES)}`);
      if (e.income) deeds.push(`${c.g('забрав', 'забрала')} з лавки ${c.plural(e.income, STONES)}`);
      const made = (craft: string) =>
        (e.batches ?? [])
          .filter((b) => b.craft === craft && b.made > 0)
          // "зварила пілюлю", not "зварила 1 пілюлю".
          .map((b) => c.plural(b.made, c.m.products[b.product]).replace(/^1 /, ''));
      const pills = made('alchemy');
      const talismans = made('talismans');
      if (pills.length) deeds.push(`${c.g('зварив', 'зварила')} ${joinList(pills)}`);
      if (talismans.length) deeds.push(`${c.g('накреслив', 'накреслила')} ${joinList(talismans)}`);
      if (e.item) deeds.push(`${c.g('викував', 'викувала')} ${c.item(e.item, 'acc')} ${c.m.rankOf[e.item.rank]}`);
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      const tried = (e.batches ?? []).reduce((n, b) => n + b.tried, 0) + (e.forgeFailed ? 1 : 0);
      const spoiled = (e.batches ?? []).reduce((n, b) => n + b.tried - b.made, 0) + (e.forgeFailed ? 1 : 0);
      if (!deeds.length) {
        return c.vary(
          `${age} У майстерні секти все пішло в брак: казан вибухнув, і брови відростали ще місяць.`,
          `${age} У майстерні секти нічого не вдалося. Старший майстер мовчки забрав у тебе ключ.`,
        );
      }
      const loss =
        spoiled === 0 || tried === 0
          ? ''
          : e.forgeFailed && spoiled === 1
            ? ' Руда з ковальні вийшла шлаком.'
            : c.vary(' Дещо пішло в брак.', ' Один казан, щоправда, вибухнув.');
      return `${age} У секті ти ${joinList(deeds)}.${loss}`;
    },
    shop: (e, c) => {
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      switch (e.action) {
        case 'opened':
          return `${age} Ти ${c.g('відкрив', 'відкрила')} лавку пілюль і трав у містечку під горою. Прикажчик краде, але в міру.`;
        case 'expanded':
          return c.vary(
            `${age} Ти ${c.g('викупив', 'викупила')} сусідню крамницю: лавка розрослася (рівень ${e.level}).`,
            `${age} Лавка розрослася (рівень ${e.level}). Тепер у тебе двоє прикажчиків, і вони крадуть одне в одного.`,
          );
        case 'robbed':
          return `${age} Поки ти ${c.g('був', 'була')} в мандрах, лавку пограбували: зникло ${c.plural(e.amount ?? 0, STONES)}.`;
      }
    },
    technique: (e, c) =>
      isCultivation(e.technique)
        ? `Тобі ${c.age(e.ageMonths)}. Бібліотека секти відкрила тобі метод культивації «${c.m.techniques[e.technique]}».`
        : `Тобі ${c.age(e.ageMonths)}. У бібліотеці секти ти ${c.g('осягнув', 'осягнула')} техніку «${c.m.techniques[e.technique]}».`,
    stageUp: (e, c) => {
      const realm = c.m.realms[realmKey(e.level)]!.gen;
      const stage = c.m.stageGen(stageOf(e.level));
      return c.vary(
        `Тобі ${c.age(e.ageMonths)}. Після ${c.plural(e.months, MONTHS_GEN)} медитації ти ${c.g('досяг', 'досягла')} ${stage} ${realm}.`,
        `Тобі ${c.age(e.ageMonths)}. ${cap(c.plural(e.months, MONTHS))} нерухомо під сосною — і ти ${c.g('досяг', 'досягла')} ${stage} ${realm}.`,
      );
    },
    realmUp: (e, c) => {
      const pill = e.pill ? ' Пілюля таки допомогла.' : '';
      if (e.level === 1) {
        return `Тобі ${c.age(e.ageMonths)}. Ці вперше ринула меридіанами — ти більше не ${c.g('смертний', 'смертна')}. Ти ${c.g('досяг', 'досягла')} Конденсації Ці!${pill}`;
      }
      const realm = c.m.realms[realmKey(e.level)]!.gen;
      return `Тобі ${c.age(e.ageMonths)}. Небо над печерою потемніло, ці ринула в меридіани — ти ${c.g('прорвався', 'прорвалася')} до ${realm}!${pill}`;
    },
    breakthroughFail: (e, c) =>
      `Тобі ${c.age(e.ageMonths)}. Прорив до ${c.m.realms[realmKey(e.level)]!.gen} провалився: ці вдарила в меридіани, і ще рік ти ${c.g('харкав', 'харкала')} кров'ю.`,
    wall: (e, c) =>
      `Тобі ${c.age(e.ageMonths)}. Ти ${c.g('досяг', 'досягла')} піку Злиття з Дао. Вище — лише Вознесіння, але у сні його не досягти. Ти стаєш старійшиною секти й навчаєш молодших.`,
    tribulation: (e, c) => {
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      if (e.survived) {
        return `${age} Небо розкололося: ${c.plural(e.bolts, BOLTS)}, одна за одною. Ти ${c.g('вистояв', 'вистояла')} — Небесну кару пройдено.`;
      }
      const held = e.bolts - 1;
      return held > 0
        ? `${age} Небесна кара: ти ${c.g('витримав', 'витримала')} ${c.plural(held, BOLTS)}, але наступна стала останньою.`
        : `${age} Небесна кара: перша ж блискавка стала останньою.`;
    },
    secret: (e, c) => `Тобі ${c.age(e.ageMonths)}. ${c.m.knowledge[e.secret]!.name}. ${c.m.knowledge[e.secret]!.desc}`,
    finalBattle: (e, c) =>
      e.won
        ? `Наяву ти ${c.g('зустрів', 'зустріла')} Патріарха Кривавого Місяця на порозі корчми — і ${c.g('переміг', 'перемогла')}.`
        : `Наяву Патріарх Кривавого Місяця виявився сильнішим. Подушка висмикнула тебе зі смерті, але меридіани ще довго палатимуть.`,
    death: (e, c) => {
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      switch (e.death.cause) {
        case 'killed': {
          const key = e.death.enemy!;
          const foe = c.enemy(key, e.death.enemyName);
          if (e.death.misjudged) {
            return `${age} Ти ${c.g('був певен', 'була певна')}, що впораєшся з ${foe.ins}. Ти ${c.g('помилився', 'помилилася')}.`;
          }
          return c.vary(
            `${age} ${cap(foe.nom)} ${c.eg(key, 'виявився сильнішим', 'виявилася сильнішою')}. Ти ${c.g('загинув', 'загинула')}.`,
            `${age} Останнє, що ти ${c.g('побачив', 'побачила')}, — ${foe.nom}. Ти ${c.g('загинув', 'загинула')}.`,
          );
        }
        case 'oldAge':
          return `${age} Ти тихо ${c.g('помер', 'померла')} від старості у своїй келії.`;
        case 'deviation':
          return `${age} Ці вийшла з-під контролю. Від тебе лишилася тільки обвуглена циновка.`;
        case 'tribulation':
          return `${age} Від тебе лишився тільки обвуглений слід на скелі. Небо не пустило тебе вище.`;
      }
    },
    wake: (e) => `Ти прокидаєшся в корчмі. Просо ще не доварилось. Сон №${e.dream} завершено, оцінка життя — ${e.score}.`,
    away: (e, c) =>
      `Поки тебе не було, у снах минуло ${c.plural(e.months, MONTHS)}; завершено снів: ${e.dreamsEnded}.`,
    reward: (e, c) =>
      `Прокинувшись, ти ${c.g('забрав', 'забрала')} із собою: ${c.m.rewardTitle(e.reward, c)}${e.auto ? ' (автопілот)' : ''}.`,
    realStageUp: (e, c) =>
      `Наяву ти ${c.g('досяг', 'досягла')} ${c.m.stageGen(stageOf(e.level))} ${c.m.realms[realmKey(e.level)]!.gen}. Відтепер кожен сон починається звідси.`,
    realBreakthrough: (e, c) =>
      e.success
        ? `Наяву небо над корчмою потемніло — ти ${c.g('прорвався', 'прорвалася')} до ${c.m.realms[realmKey(e.level)]!.gen}! Відтепер кожен сон починається звідси.`
        : `Наяву прорив до ${c.m.realms[realmKey(e.level)]!.gen} провалився. Меридіани палають, і Подушка мовчатиме, доки вони не загояться.`,
    fork: (e, c) => c.m.forks[e.fork]!.question(e, c),
    forkResult: (e, c) => {
      const line = c.m.forks[e.fork]!.results[`${e.option}/${e.outcome}`]!(e, c);
      return e.auto ? `${line} (інстинкт)` : line;
    },
    remembered: (e, c) => {
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      if (e.knowledge === 'hiddenSpring') {
        return `${age} Ти медитуєш біля джерела, яке пам'ятаєш з минулого сну. Ці тече швидше.`;
      }
      return e.technique
        ? `${age} Ти ${c.g('згадав', 'згадала')} печеру Старого Чжана з минулого сну. Рукопис лежав на тому самому місці — техніка «${c.m.techniques[e.technique]}» тепер твоя.`
        : `${age} Ти ${c.g('згадав', 'згадала')} печеру Старого Чжана. У старих печатях ще лишилося ${e.amount ?? 0} ці.`;
    },
  },
  summary: (s, c) => {
    const cause =
      s.death.cause === 'killed'
        ? `${c.g('Загинув', 'Загинула')} від ${c.enemy(s.death.enemy!, s.death.enemyName).gen}.`
        : s.death.cause === 'oldAge'
          ? `${c.g('Помер', 'Померла')} від старості.`
          : s.death.cause === 'tribulation'
            ? 'Небесна кара.'
            : 'Відхилення ці.';
    return `Сон №${s.n}: ${c.age(s.ageMonths)}, ${c.level(s.level)}. ${cause} Оцінка: ${s.score}.`;
  },
};

function realmKey(level: number): string {
  return REALMS[realmOf(level)]!.key;
}
