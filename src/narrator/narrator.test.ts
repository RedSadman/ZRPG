import { describe, expect, it } from 'vitest';
import { advanceSteps, newGame } from '../engine/sim.ts';
import type { GameEvent, GameState } from '../engine/types.ts';
import { LOCALES, plural } from '../i18n/index.ts';
import { uk } from '../i18n/uk.ts';
import { narrate, narrateEntry, narrateSummary } from './narrator.ts';

function withGender(s: GameState, gender: 'm' | 'f'): GameState {
  return { ...s, hero: { ...s.hero, gender } };
}

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

  it('agrees verbs with the hero and enemy gender in Ukrainian', () => {
    const state = newGame(1);
    const event: GameEvent = { kind: 'death', ageMonths: 30 * 12, death: { cause: 'killed', enemy: 'spiritSerpent', enemyLevel: 12 } };
    const female = narrate(event, withGender(state, 'f'), 'uk', 0);
    expect(female).toBe('Тобі 30 років. Духовна змія виявилася сильнішою. Ти загинула.');
    const male = narrate(event, withGender(state, 'm'), 'uk', 0);
    expect(male).toBe('Тобі 30 років. Духовна змія виявилася сильнішою. Ти загинув.');
  });

  it('gives rivals surnames, so a beaten bully and a later killer read as different people', () => {
    const state = withGender(newGame(1), 'm');
    const beaten: GameEvent = { kind: 'fight', ageMonths: 20 * 12, enemy: 'bullyDisciple', enemyLevel: 3, note: 'rival', name: 'liu' };
    const killer: GameEvent = {
      kind: 'death',
      ageMonths: 29 * 12,
      death: { cause: 'killed', enemy: 'bullyDisciple', enemyLevel: 5, enemyName: 'tang' },
    };
    expect(narrate(beaten, state, 'uk', 0)).toBe(
      'Тобі 20 років. Задерикуватий учень Лю спитав, чи смієш ти дихати його повітрям. Ти смів. Тепер він дихає обережно.',
    );
    expect(narrate(killer, state, 'uk', 1)).toBe('Тобі 29 років. Останнє, що ти побачив, — задерикуватий учень Тан. Ти загинув.');
    expect(narrate(beaten, state, 'en', 0)).toBe(
      'You are 20. Bully Disciple Liu asked whether you dared to breathe the same air. You dared. Now he breathes carefully.',
    );
    expect(narrate({ ...beaten, enemy: 'youngMaster' }, state, 'uk', 0)).toContain('Молодий майстер Лю');
  });

  it('names items in the right case', () => {
    const state = withGender(newGame(1), 'm');
    const item = { slot: 'weapon' as const, base: 'sabre', affixes: ['forgottenDisciple'], rank: 1, level: 3, weapon: 9, armor: 0, bonus: {} };
    const line = narrate({ kind: 'loot', ageMonths: 20 * 12, item }, state, 'uk');
    expect(line).toBe('Тобі 20 років. Ти здобув Шаблю Забутого Учня духовного рангу і тепер не випускаєш з рук.');
    expect(narrate({ kind: 'loot', ageMonths: 20 * 12, item }, state, 'en')).toBe(
      'You are 20. You won a Spirit-rank Sabre of the Forgotten Disciple and have not let go of it since.',
    );
  });

  it('narrates every event of a long run in both languages without gaps', () => {
    const s = advanceSteps(newGame(2024), 4000);
    const kinds = new Set(s.journal.map((e) => e.event.kind));
    expect(kinds.size).toBeGreaterThan(6);
    for (const locale of LOCALES) {
      for (const entry of s.journal) {
        const line = narrateEntry(entry, s, locale);
        expect(line, `${locale} ${entry.event.kind}`).not.toMatch(/undefined|NaN|\{n\}/);
        expect(line.length).toBeGreaterThan(10);
      }
      for (const summary of s.chronicle) expect(narrateSummary(summary, s, locale)).not.toMatch(/undefined|NaN/);
    }
  });
});
