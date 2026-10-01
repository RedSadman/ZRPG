import type { Messages } from './types';

export const en: Messages = {
  gameTitle: 'Yellow Millet Dream',
  gameSubtitle: 'While the millet cooks, you live a whole life',
  heroNames: { xiaoLin: 'Xiao Lin' },
  ui: {
    dream: (n) => `Dream #${n}`,
    age: 'Age',
    spiritStones: 'Spirit stones',
    awake: 'Awake',
    journal: 'Dream journal',
    speed: 'Speed',
    pause: 'Pause',
    language: 'Language',
    newGame: 'New game',
    newGameConfirm: 'Start over? The current save will be erased.',
  },
  ageYears: { one: '{n}', other: '{n}' },
  events: {
    dreamStart: (e, c) =>
      `Dream #${e.dream}. ${c.heroName} lays his head on the Jade Pillow. The millet in the pot has only just begun to boil.`,
    meditate: (e, c) => `You are ${c.age(e.ageMonths)}. You meditated beneath the old pine. Your qi stirred, barely.`,
    wander: (e, c) =>
      `You are ${c.age(e.ageMonths)}. You wandered the foothills of Azure Cloud Mountain and found nothing but blisters.`,
    findStones: (e, c) =>
      `You are ${c.age(e.ageMonths)}. Beneath the roots of a pine you found ${c.plural(e.amount, {
        one: 'a spirit stone',
        other: '{n} spirit stones',
      })}.`,
    wake: (e, c) =>
      `You are ${c.age(e.ageMonths)}. You died. You wake up in the inn — the millet is not done yet. Dream #${e.dream} is over.`,
    away: (e, c) =>
      `While you were away, ${c.plural(e.months, { one: 'a month', other: '{n} months' })} passed in dreams; dreams finished: ${e.dreamsEnded}.`,
  },
};
