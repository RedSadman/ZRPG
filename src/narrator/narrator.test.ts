import { describe, expect, it } from 'vitest';
import { newGame } from '../engine/sim';
import { plural } from '../i18n';
import { uk } from '../i18n/uk';
import { narrate } from './narrator';

describe('narrator', () => {
  it('declines Ukrainian ages correctly', () => {
    const cases: Array<[number, string]> = [
      [1, '1 рік'],
      [2, '2 роки'],
      [5, '5 років'],
      [11, '11 років'],
      [21, '21 рік'],
      [22, '22 роки'],
      [25, '25 років'],
    ];
    for (const [n, text] of cases) expect(plural('uk', n, uk.ageYears)).toBe(text);
  });

  it('narrates the same event in both languages', () => {
    const state = newGame(1);
    const event = { kind: 'findStones', ageMonths: 22 * 12, amount: 3 } as const;
    expect(narrate(event, state, 'uk')).toBe('Тобі 22 роки. Під корінням сосни ти знайшов 3 духовні камені.');
    expect(narrate(event, state, 'en')).toBe('You are 22. Beneath the roots of a pine you found 3 spirit stones.');
  });

  it('uses the hero name for the current language', () => {
    const state = newGame(1);
    const event = state.journal[0]!.event;
    expect(narrate(event, state, 'uk')).toContain('Сяо Лін');
    expect(narrate(event, state, 'en')).toContain('Xiao Lin');
  });
});
