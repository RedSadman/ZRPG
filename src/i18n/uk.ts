import { REALMS } from '../data/realms.ts';
import { CULTIVATION_TECHNIQUES } from '../data/techniques.ts';
import { realmOf, stageOf } from '../engine/levels.ts';
import type { Messages, Noun, PluralForms } from './types.ts';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
    azureFoothills: { nom: 'Околиці гори Лазурової Хмари', in: 'на околицях гори Лазурової Хмари' },
    thousandBeastForest: { nom: 'Ліс Тисячі Звірів', in: 'у Лісі Тисячі Звірів' },
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
    },
    moveUp: 'Вище',
    moveDown: 'Нижче',
    breakthrough: (realm) => `Спробувати прорив до ${realm}`,
    breakthroughChance: (p) => `шанс ${p}%`,
    injured: (t) => `Меридіани загоюються: ${t}`,
    talents: 'Таланти',
    noTalents: 'Ще жодного',
    resting: 'Подушка відпочиває',
  },
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
      return `Тобі ${c.age(e.ageMonths)}. Старійшина секти Лазурової Хмари ${reaction}. Твій шлях — ${c.m.paths[e.path]}.`;
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
      const parts = [e.kills > 0 ? c.plural(e.kills, FOES) : '', e.herbs > 0 ? c.plural(e.herbs, HERBS) : ''].filter(Boolean);
      return `Тобі ${c.age(e.ageMonths)}. Ти ${c.g('провів', 'провела')} ${c.plural(e.months, MONTHS)} ${c.m.zones[e.zone]!.in}: ${parts.join(' і ')}.`;
    },
    sect: (e, c) => {
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      const reward = `${c.g('отримав', 'отримала')} ${c.plural(e.contribution, POINTS)} за виконане завдання`;
      if (e.sold === 0) return `${age} У секті ти ${reward}.`;
      const sold = `У секті ти ${c.g('продав', 'продала')} трофеї за ${c.plural(e.sold, STONES)}`;
      return e.contribution > 0 ? `${age} ${sold} і ${reward}.` : `${age} ${sold}.`;
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
      `Тобі ${c.age(e.ageMonths)}. Ти ${c.g('досяг', 'досягла')} межі Закладання Основи й ${c.g('відчув', 'відчула')} стіну, за якою починається Золоте Ядро. Подушка поки не пускає далі. Ти стаєш старійшиною секти й навчаєш молодших.`,
    death: (e, c) => {
      const age = `Тобі ${c.age(e.ageMonths)}.`;
      switch (e.death.cause) {
        case 'killed': {
          const key = e.death.enemy!;
          const foe = c.enemy(key, e.death.enemyName);
          return c.vary(
            `${age} ${cap(foe.nom)} ${c.eg(key, 'виявився сильнішим', 'виявилася сильнішою')}. Ти ${c.g('загинув', 'загинула')}.`,
            `${age} Останнє, що ти ${c.g('побачив', 'побачила')}, — ${foe.nom}. Ти ${c.g('загинув', 'загинула')}.`,
          );
        }
        case 'oldAge':
          return `${age} Ти тихо ${c.g('помер', 'померла')} від старості у своїй келії.`;
        case 'deviation':
          return `${age} Ці вийшла з-під контролю. Від тебе лишилася тільки обвуглена циновка.`;
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
  },
  summary: (s, c) => {
    const cause =
      s.death.cause === 'killed'
        ? `${c.g('Загинув', 'Загинула')} від ${c.enemy(s.death.enemy!, s.death.enemyName).gen}.`
        : s.death.cause === 'oldAge'
          ? `${c.g('Помер', 'Померла')} від старості.`
          : 'Відхилення ці.';
    return `Сон №${s.n}: ${c.age(s.ageMonths)}, ${c.level(s.level)}. ${cause} Оцінка: ${s.score}.`;
  },
};

function realmKey(level: number): string {
  return REALMS[realmOf(level)]!.key;
}
