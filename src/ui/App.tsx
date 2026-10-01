import { useEffect, useRef, useState } from 'preact/hooks';
import { catchUp, newGame, step } from '../engine/sim';
import type { GameState } from '../engine/types';
import { startTicker, ticksSince } from '../clock/clock';
import { clearSave, loadSave, writeSave } from '../save/save';
import { LOCALES, loadLocale, messages, plural, saveLocale, type Locale } from '../i18n';
import { narrate } from '../narrator/narrator';

const AUTOSAVE_MS = 30_000;
const SPEEDS = [1, 10, 100];

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

function boot(): { state: GameState; lastTickAt: number } {
  const now = Date.now();
  const save = loadSave(localStorage);
  if (!save) return { state: newGame(randomSeed()), lastTickAt: now };
  return { state: catchUp(save.state, ticksSince(save.lastTickAt, now)), lastTickAt: now };
}

export function App() {
  const [initial] = useState(boot);
  const [game, setGame] = useState(initial.state);
  const [locale, setLocale] = useState<Locale>(() => loadLocale(localStorage));
  const [speed, setSpeed] = useState(1);
  const lastTickAt = useRef(initial.lastTickAt);
  const gameRef = useRef(game);
  gameRef.current = game;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (speed === 0) return;
    return startTicker(() => {
      lastTickAt.current = Date.now();
      setGame((s) => step(s));
    }, speed);
  }, [speed]);

  useEffect(() => {
    // While paused, time spent away should not count as offline progress.
    const persist = () =>
      writeSave(localStorage, gameRef.current, speedRef.current === 0 ? Date.now() : lastTickAt.current, Date.now());
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    const id = setInterval(persist, AUTOSAVE_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', persist);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', persist);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = messages(locale).gameTitle;
  }, [locale]);

  const m = messages(locale);
  const { dream } = game;

  const changeLocale = (next: Locale) => {
    setLocale(next);
    saveLocale(localStorage, next);
  };

  const restart = () => {
    if (!confirm(m.ui.newGameConfirm)) return;
    clearSave(localStorage);
    lastTickAt.current = Date.now();
    setGame(newGame(randomSeed()));
  };

  return (
    <div class="page">
      <header class="masthead">
        <h1>{m.gameTitle}</h1>
        <p class="subtitle">{m.gameSubtitle}</p>
      </header>

      <div class="layout">
        <aside class="panel hero">
          <h2>{m.heroNames[game.hero.nameKey] ?? game.hero.nameKey}</h2>
          <dl>
            <dt>{m.ui.dream(dream.n)}</dt>
            <dd>{dream.awake ? m.ui.awake : '…'}</dd>
            <dt>{m.ui.age}</dt>
            <dd>{plural(locale, Math.floor(dream.ageMonths / 12), m.ageYears)}</dd>
            <dt>{m.ui.spiritStones}</dt>
            <dd>{dream.spiritStones}</dd>
          </dl>

          <div class="controls">
            <span class="label">{m.ui.speed}</span>
            <div class="segmented">
              <button aria-pressed={speed === 0} onClick={() => setSpeed(0)}>
                {m.ui.pause}
              </button>
              {SPEEDS.map((s) => (
                <button key={s} aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                  ×{s}
                </button>
              ))}
            </div>
            <span class="label">{m.ui.language}</span>
            <div class="segmented">
              {LOCALES.map((l) => (
                <button key={l} aria-pressed={locale === l} onClick={() => changeLocale(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button class="quiet" onClick={restart}>
              {m.ui.newGame}
            </button>
          </div>
        </aside>

        <main class="panel journal">
          <h2>{m.ui.journal}</h2>
          <ol>
            {game.journal
              .slice()
              .reverse()
              .map((entry) => (
                <li key={entry.id} class={`entry entry-${entry.event.kind}`}>
                  {narrate(entry.event, game, locale)}
                </li>
              ))}
          </ol>
        </main>
      </div>
    </div>
  );
}
