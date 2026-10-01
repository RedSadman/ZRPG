// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('App', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders the hero, the journal and keeps ticking', async () => {
    pinSeed(5);
    const root = document.createElement('div');
    document.body.append(root);
    await act(() => render(<App />, root));

    expect(root.querySelector('h1')?.textContent).toBe('Сон Жовтого Проса');
    expect(root.querySelectorAll('.journal li').length).toBe(2);

    await beats(50);
    expect(root.querySelectorAll('.journal li').length).toBeGreaterThan(10);
    expect(root.textContent).not.toMatch(/undefined|NaN/);

    const en = [...root.querySelectorAll('button')].find((b) => b.textContent === 'EN')!;
    await act(() => en.click());
    expect(root.querySelector('h1')?.textContent).toBe('Yellow Millet Dream');
    render(null, root);
  });

  it('offers rewards when a dream ends and takes the one clicked', async () => {
    pinSeed(4);
    const root = document.createElement('div');
    document.body.append(root);
    await act(() => render(<App />, root));

    for (let i = 0; i < 400 && !root.querySelector('.choose'); i++) await beats(5);
    const offers = root.querySelectorAll<HTMLButtonElement>('.choose .offer');
    expect(offers).toHaveLength(3);
    expect(root.textContent).not.toMatch(/undefined|NaN/);

    await act(() => offers[0]!.click());
    expect(root.querySelector('.choose')).toBeNull();
    expect(root.querySelector('.entry-reward')).not.toBeNull();
    render(null, root);
  });
});
