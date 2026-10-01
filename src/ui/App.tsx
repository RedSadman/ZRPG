import { Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { MAX_LEVEL } from '../data/realms.ts';
import { SLOTS } from '../data/items.ts';
import { catchUp, newGame, step } from '../engine/sim.ts';
import { STAT_KEYS, effectiveStats, maxHp } from '../engine/hero.ts';
import { qiToReach } from '../engine/levels.ts';
import type { GameState } from '../engine/types.ts';
import { startTicker, ticksSince } from '../clock/clock.ts';
import { clearSave, loadSave, writeSave } from '../save/save.ts';
import { LOCALES, loadLocale, messages, saveLocale, type Locale } from '../i18n/index.ts';
import { levelLabel, narrate, narrateEntry, narrateSummary, narrationContext } from '../narrator/narrator.ts';

const AUTOSAVE_MS = 30_000;
const SPEEDS = [1, 3, 10];
const CHRONICLE_SHOWN = 10;

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

  const lastDream = game.chronicle.at(-1);

  return (
    <div class="page">
      <header class="masthead">
        <h1>{m.gameTitle}</h1>
        <p class="subtitle">{m.gameSubtitle}</p>
      </header>

      <div class="layout">
        <aside class="side">
          <HeroPanel game={game} locale={locale} />

          <section class="panel controls">
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
          </section>
        </aside>

        <main class="main">
          {lastDream && (
            <section class="panel last-dream">
              <h2>{m.ui.lastDream}</h2>
              <p class="summary">{narrateSummary(lastDream, game, locale)}</p>
              <ol class="highlights">
                {lastDream.highlights.map((event, i) => (
                  <li key={i}>{narrate(event, game, locale, lastDream.n + i)}</li>
                ))}
              </ol>
            </section>
          )}

          <section class="panel journal">
            <h2>{m.ui.journal}</h2>
            <ol>
              {game.journal
                .slice()
                .reverse()
                .map((entry) => (
                  <li key={entry.id} class={`entry entry-${entry.event.kind}`}>
                    {narrateEntry(entry, game, locale)}
                  </li>
                ))}
            </ol>
          </section>

          <section class="panel chronicle">
            <h2>{m.ui.chronicle}</h2>
            {game.chronicle.length === 0 ? (
              <p class="muted">{m.ui.noDreamsYet}</p>
            ) : (
              <ol>
                {game.chronicle
                  .slice(-CHRONICLE_SHOWN)
                  .reverse()
                  .map((s) => (
                    <li key={s.n}>{narrateSummary(s, game, locale)}</li>
                  ))}
              </ol>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function HeroPanel({ game, locale }: { game: GameState; locale: Locale }) {
  const m = messages(locale);
  const ctx = narrationContext(game, locale);
  const { hero, life } = game;
  const stats = effectiveStats(life);
  const hpMax = maxHp(life);
  const atCeiling = life.level >= MAX_LEVEL;
  const qiNeed = qiToReach(life.level + 1);
  const status = game.awake ? m.ui.awake : m.ui.activity[life.activity];

  return (
    <section class="panel hero">
      <h2>{ctx.heroName}</h2>
      <p class="muted">
        {m.ui.dream(life.n)} · {status} · {ctx.age(life.ageMonths)}
      </p>

      <dl class="facts">
        <dt>{m.ui.realm}</dt>
        <dd>{levelLabel(m, life.level)}</dd>
        <dt>{m.ui.root}</dt>
        <dd>{m.roots[hero.root]}</dd>
        <dt>{m.ui.path}</dt>
        <dd>{m.paths[hero.path]}</dd>
      </dl>

      <Meter label={m.ui.hp} value={life.hp} max={hpMax} kind="hp" />
      {!atCeiling && <Meter label={m.ui.qi} value={life.qi} max={qiNeed} kind="qi" />}

      <h3>{m.ui.stats}</h3>
      <dl class="stats">
        {STAT_KEYS.map((key) => (
          <Fragment key={key}>
            <dt>{m.stats[key]}</dt>
            <dd>{Math.round(stats[key])}</dd>
          </Fragment>
        ))}
      </dl>

      <dl class="facts">
        <dt>{m.ui.spiritStones}</dt>
        <dd>{life.stones}</dd>
        <dt>{m.ui.contribution}</dt>
        <dd>{life.contribution}</dd>
        <dt>{m.ui.pills}</dt>
        <dd>{life.pills.healing}</dd>
      </dl>

      <h3>{m.ui.techniques}</h3>
      <ul class="plain">
        {life.techniques.map((t) => (
          <li key={t.key}>«{m.techniques[t.key]}»</li>
        ))}
        <li class="muted">
          {m.ui.cultivation}: «{m.techniques[life.cultivation]}»
        </li>
      </ul>

      <h3>{m.ui.equipment}</h3>
      <ul class="plain equipment">
        {SLOTS.map((slot) => {
          const item = life.equipment[slot];
          return (
            <li key={slot}>
              <span class="muted">{m.slots[slot]}</span>
              {item ? <span class={`rank-${item.rank}`}>{ctx.item(item, 'nom')}</span> : <span class="muted">—</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Meter({ label, value, max, kind }: { label: string; value: number; max: number; kind: string }) {
  const pct = Math.max(0, Math.min(100, (100 * value) / max));
  return (
    <div class={`meter meter-${kind}`}>
      <div class="meter-label">
        <span>{label}</span>
        <span>
          {Math.floor(value)} / {Math.round(max)}
        </span>
      </div>
      <div class="meter-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div class="meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
