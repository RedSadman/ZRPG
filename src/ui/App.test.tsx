// @vitest-environment happy-dom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';

describe('App', () => {
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('renders the hero, the journal and keeps ticking', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.append(root);
    await act(() => render(<App />, root));

    expect(root.querySelector('h1')?.textContent).toBe('Сон Жовтого Проса');
    expect(root.querySelectorAll('.journal li').length).toBe(2);

    await act(() => {
      vi.advanceTimersByTime(3000 * 50);
    });
    expect(root.querySelectorAll('.journal li').length).toBeGreaterThan(10);
    expect(root.textContent).not.toMatch(/undefined|NaN/);

    const en = [...root.querySelectorAll('button')].find((b) => b.textContent === 'EN')!;
    await act(() => en.click());
    expect(root.querySelector('h1')?.textContent).toBe('Yellow Millet Dream');
    render(null, root);
  });
});
