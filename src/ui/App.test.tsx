// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORKS } from '../data/forks.ts';
import { newLife } from '../engine/dream.ts';
import { newGame } from '../engine/sim.ts';
import { writeSave } from '../save/save.ts';
import { App } from './App.tsx';

/** The app seeds new games from crypto; pin it so the run is the same every time. */
function pinSeed(seed: number) {
  vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
    if (array instanceof Uint32Array) array[0] = seed;
    return array;
  });
}

async function beats(n: number) {
  await act(() => {
    vi.advanceTimersByTime(3000 * n);
  });
}

async function mount() {
  const root = document.createElement('div');
  document.body.append(root);
  await act(() => render(<App />, root));
  return root;
}

describe('App', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders the hero, the journal and keeps ticking', async () => {
    pinSeed(5);
    const root = await mount();
    expect(root.querySelector('h1')?.textContent).toBe('Сон Жовтого Проса');
    expect(root.querySelectorAll('.journal li').length).toBe(2);

    await beats(120);
    expect(root.querySelectorAll('.journal li').length).toBeGreaterThan(8);
    expect(root.textContent).not.toMatch(/undefined|NaN/);

    const en = [...root.querySelectorAll('button')].find((b) => b.textContent === 'EN')!;
    await act(() => en.click());
    expect(root.querySelector('h1')?.textContent).toBe('Yellow Millet Dream');
    expect(root.textContent).not.toMatch(/undefined|NaN/);
    render(null, root);
  });

  it('offers rewards when a dream ends and takes the one clicked', async () => {
    pinSeed(4);
    const root = await mount();
    for (let i = 0; i < 600 && !root.querySelector('.choose:not(.fork)'); i++) await beats(5);
    const offers = root.querySelectorAll<HTMLButtonElement>('.choose:not(.fork) .offer');
    expect(offers).toHaveLength(3);
    expect(root.textContent).not.toMatch(/undefined|NaN/);

    await act(() => offers[0]!.click());
    expect(root.querySelector('.choose:not(.fork)')).toBeNull();
    expect(root.querySelector('.entry-reward')).not.toBeNull();
    render(null, root);
  });

  it('shows a waiting fork and resolves the option clicked', async () => {
    const s = newGame(8);
    const def = FORKS.find((f) => f.key === 'injuredStranger')!;
    const life = { ...newLife(s.hero, 1), fork: { key: def.key, options: def.options.map((o) => o.key), deadline: 1000, cost: 0, enemyLevel: 2 } };
    writeSave(localStorage, { ...s, life }, Date.now(), Date.now());

    const root = await mount();
    const buttons = root.querySelectorAll<HTMLButtonElement>('.fork .offer');
    expect(buttons).toHaveLength(3);
    expect(root.querySelector('.fork .question')?.textContent).toContain('поранений культиватор');

    await act(() => buttons[2]!.click());
    expect(root.querySelector('.fork')).toBeNull();
    expect(root.querySelector('.entry-forkResult')?.textContent).toContain('повз');
    render(null, root);
  });
});
