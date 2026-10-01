import type { ForkResultEvent, ForkTexts, NarrationContext, PluralForms } from './types.ts';

const STONES: PluralForms = { one: 'a spirit stone', other: '{n} spirit stones' };
const POINTS: PluralForms = { one: 'a contribution point', other: '{n} contribution points' };

const age = (e: { ageMonths: number }, c: NarrationContext) => `You are ${c.age(e.ageMonths)}.`;

const manual = (e: ForkResultEvent, c: NarrationContext) =>
  e.technique ? `You mastered “${c.m.techniques[e.technique]}”.` : `${e.amount ?? 0} qi flowed into your meridians.`;

const found = (e: ForkResultEvent, c: NarrationContext) => {
  if (!e.item) return '';
  const base = c.m.itemBases[e.item.base]!;
  return e.item.rank === 0
    ? c.item(e.item, 'acc')
    : `${base.article ? 'a ' : ''}${c.m.rankOf[e.item.rank]} ${c.item(e.item, 'acc')}`;
};

export const enForks: Record<string, ForkTexts> = {
  oldManManual: {
    question: (e, c) =>
      `${age(e, c)} An old man in a cave offers you a manual “of the immortals' secrets” — for all your spirit stones (${e.cost}).`,
    options: {
      buy: () => 'Buy it',
      refuse: () => 'Refuse',
      rob: () => 'Try to take it',
      bow: () => 'Bow and ask for guidance',
    },
    results: {
      'buy/real': (e, c) => `${age(e, c)} The manual is real! ${manual(e, c)}`,
      'buy/fake': (e, c) => `${age(e, c)} The manual turned out to be a cookbook. Now you know seven ways to cook millet.`,
      'refuse/none': (e, c) => `${age(e, c)} You refused. The old man shrugged and faded into the dark of the cave.`,
      'rob/won': (e, c) => `${age(e, c)} The old man fought like a tiger, but the manual is yours. ${manual(e, c)}`,
      'rob/fled': (e, c) => `${age(e, c)} The old man was anything but frail. You barely got away.`,
      'bow/taught': (e, c) => `${age(e, c)} The old man looked at you for a long time, then laughed and began to teach. ${manual(e, c)}`,
      'bow/laughed': (e, c) => `${age(e, c)} The old man laughed, called you “a little fool” and left.`,
    },
  },
  injuredStranger: {
    question: (e, c) => `${age(e, c)} A wounded cultivator lies by the road, barely breathing.`,
    options: {
      help: () => 'Help',
      rob: () => 'Rob him',
      pass: () => 'Walk on',
    },
    results: {
      'help/grateful': (e, c) =>
        `${age(e, c)} You gave him a pill. He whispered his thanks — and somehow your luck has been better since.`,
      'help/elder': (e, c) => `${age(e, c)} The stranger was an elder of another sect. In parting he gave you ${found(e, c)}.`,
      'help/valley': (e, c) =>
        `${age(e, c)} The stranger was an alchemist from the Valley of a Thousand Pills, and told you how to find it.`,
      'rob/loot': (e, c) => `${age(e, c)} You took ${c.plural(e.amount ?? 0, STONES)}. Heaven, it seems, took note.`,
      'rob/woke': (e, c) => `${age(e, c)} The stranger woke at the worst possible moment. The fight was short and unpleasant.`,
      'pass/none': (e, c) => `${age(e, c)} You walked on. The world of cultivation has no room for pity.`,
    },
  },
  duelChallenge: {
    question: (e, c) => `${age(e, c)} A young master challenges you to a duel in front of everyone. Refusing means losing face.`,
    options: {
      accept: () => 'Accept',
      refuse: () => 'Refuse',
      bribe: (f, c) => `Pay him off (${c.plural(f.cost, STONES)})`,
    },
    results: {
      'accept/won': (e, c) =>
        `${age(e, c)} You won the duel, and the sect rewarded you with ${c.plural(e.amount ?? 0, POINTS)}.` +
        (e.knowledge ? ' An elder of the Iron Fist Clan invited you to visit.' : ''),
      'accept/lost': (e, c) => `${age(e, c)} You lost the duel. Your body took half a year to heal, your pride longer.`,
      'accept/fled': (e, c) => `${age(e, c)} Halfway through the duel you decided your life was worth more than your face.`,
      'refuse/face': (e, c) => `${age(e, c)} You refused. The sect whispers, and your contribution shrank.`,
      'bribe/paid': (e, c) => `${age(e, c)} You paid him off: ${c.plural(e.amount ?? 0, STONES)} found their way into the young master's pocket.`,
    },
  },
  secretRealm: {
    question: (e, c) => `${age(e, c)} A secret realm has opened nearby. They say there is treasure inside — and death.`,
    options: {
      enter: () => 'Go in',
      lurk: () => 'Wait by the entrance',
      skip: () => 'Stay away',
    },
    results: {
      'enter/treasure': (e, c) =>
        `${age(e, c)} You got past three guardians and came out with ${found(e, c)} and ${e.amount ?? 0} qi.`,
      'enter/fled': (e, c) => `${age(e, c)} Inside was worse than they said. You crawled out empty-handed.`,
      'lurk/loot': (e, c) =>
        `${age(e, c)} By the entrance you ambushed an exhausted cultivator and took ${c.plural(e.amount ?? 0, STONES)}.`,
      'lurk/none': (e, c) => `${age(e, c)} You waited by the entrance for a long time, but fortune smiled on someone else.`,
      'skip/none': (e, c) => `${age(e, c)} You chose not to risk it. Not everyone came back from that realm.`,
    },
  },
  hiddenCave: {
    question: (e, c) => `${age(e, c)} Behind a waterfall you noticed the mouth of a cave.`,
    options: {
      enter: () => 'Go in',
      remember: () => 'Remember it and leave',
    },
    results: {
      'enter/treasure': (e, c) =>
        `${age(e, c)} Among bones and dust you found ${found(e, c)}. Scratched on the wall: “Old Zhang”.`,
      'enter/trap': (e, c) => `${age(e, c)} The cave greeted you with a trap. You got out, but it cost you. Scratched on the wall: “Old Zhang”.`,
      'enter/empty': (e, c) => `${age(e, c)} The cave was empty except for the words scratched on the wall: “Old Zhang”.`,
      'remember/none': (e, c) => `${age(e, c)} You fixed the place in your memory. You will come back someday.`,
    },
  },
  qiSpring: {
    question: (e, c) => `${age(e, c)} A thin stream of pure qi seeps from under a rock.`,
    options: {
      meditate: () => 'Meditate here',
      mark: () => 'Mark it and leave',
    },
    results: {
      'meditate/qi': (e, c) => `${age(e, c)} By the spring you drew in ${e.amount ?? 0} qi.`,
      'mark/none': (e, c) => `${age(e, c)} You fixed the place in your memory. You will come back someday.`,
    },
  },
};
