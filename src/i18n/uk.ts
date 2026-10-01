import type { Messages } from './types';

export const uk: Messages = {
  gameTitle: 'Сон Жовтого Проса',
  gameSubtitle: 'Поки вариться просо, ти проживаєш ціле життя',
  heroNames: { xiaoLin: 'Сяо Лін' },
  ui: {
    dream: (n) => `Сон №${n}`,
    age: 'Вік',
    spiritStones: 'Духовні камені',
    awake: 'Прокинувся',
    journal: 'Журнал сну',
    speed: 'Швидкість',
    pause: 'Пауза',
    language: 'Мова',
    newGame: 'Нова гра',
    newGameConfirm: 'Почати все спочатку? Поточне збереження буде стерто.',
  },
  ageYears: { one: '{n} рік', few: '{n} роки', many: '{n} років', other: '{n} року' },
  events: {
    dreamStart: (e, c) =>
      `Сон №${e.dream}. ${c.heroName} кладе голову на Нефритову Подушку. Просо в казані тільки-но закипає.`,
    meditate: (e, c) => `Тобі ${c.age(e.ageMonths)}. Ти медитував під старою сосною. Ці ледь помітно заворушилась.`,
    wander: (e, c) =>
      `Тобі ${c.age(e.ageMonths)}. Ти блукав околицями гори Лазурової Хмари й нічого не знайшов, окрім мозолів.`,
    findStones: (e, c) =>
      `Тобі ${c.age(e.ageMonths)}. Під корінням сосни ти знайшов ${c.plural(e.amount, {
        one: '{n} духовний камінь',
        few: '{n} духовні камені',
        many: '{n} духовних каменів',
        other: '{n} духовного каменя',
      })}.`,
    wake: (e, c) =>
      `Тобі ${c.age(e.ageMonths)}. Ти загинув. Ти прокидаєшся в корчмі — просо ще не доварилось. Сон №${e.dream} завершено.`,
    away: (e, c) =>
      `Поки тебе не було, у снах минуло ${c.plural(e.months, {
        one: '{n} місяць',
        few: '{n} місяці',
        many: '{n} місяців',
        other: '{n} місяця',
      })}; завершено снів: ${e.dreamsEnded}.`,
  },
};
