import { Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CRAFT_KEYS } from '../data/crafts.ts';
import { MAX_LEVEL, REALMS } from '../data/realms.ts';
import { SLOTS } from '../data/items.ts';
import { INSTINCT_KEYS, type Instinct } from '../data/instincts.ts';
import { BLESSING_COST, START_PLACES } from '../data/knowledge.ts';
import { PATH_KEYS, type PathKey } from '../data/paths.ts';
import {
  attemptRealBreakthrough,
  catchUp,
  faceThePatriarch,
  chooseFork,
  chooseReward,
  movePriority,
  newGame,
  setAutopilot,
  setSetup,
  setWaitForMe,
  setupCost,
  step,
} from '../engine/sim.ts';
import { SECT_RANKS } from '../engine/dream.ts';
import { instinctChoice } from '../engine/forks.ts';
import { STAT_KEYS, effectiveStats, maxHp } from '../engine/hero.ts';
import { qiToReach, realmOf } from '../engine/levels.ts';
import {
  BEATS_PER_CHARGE,
  CHARGE_MAX,
  canAttemptRealBreakthrough,
  canFaceThePatriarch,
  realBreakthroughChance,
} from '../engine/reality.ts';
import { SECRETS } from '../data/knowledge.ts';
import { Icon } from './Icon.tsx';
import { ChroniclePanel, StatsPanel } from './Chronicle.tsx';
import { MapPanel } from './MapPanel.tsx';
import type { Crafts, GameState } from '../engine/types.ts';
import { TICK_MS, startTicker, ticksSince } from '../clock/clock.ts';
import { clearSave, loadSave, writeSave } from '../save/save.ts';
import { LOCALES, loadLocale, messages, saveLocale, type Locale } from '../i18n/index.ts';
import type { Messages } from '../i18n/types.ts';
import { levelLabel, narrate, narrateEntry, narrateSummary, narrationContext } from '../narrator/narrator.ts';

const AUTOSAVE_MS = 30_000;
const SPEEDS = [1, 3, 10];
const TABS = ['journal', 'chronicle', 'stats'] as const;
type Tab = (typeof TABS)[number];
const TAB_KEY = 'zrpg.tab';

function loadTab(): Tab {
  try {
    const saved = localStorage.getItem(TAB_KEY);
    return (TABS as readonly string[]).includes(saved ?? '') ? (saved as Tab) : 'journal';
  } catch {
    return 'journal';
  }
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

function boot(): { state: GameState; lastTickAt: number } {
  const now = Date.now();
  const save = loadSave(localStorage);
  if (!save) return { state: newGame(randomSeed()), lastTickAt: now };
  return { state: catchUp(save.state, ticksSince(save.lastTickAt, now)), lastTickAt: now };
}

/** "4:05" for a number of beats at the current speed. */
function beatsToClock(beats: number, speed: number): string {
  const seconds = Math.ceil((beats * TICK_MS) / 1000 / Math.max(1, speed));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function App() {
  const [initial] = useState(boot);
  const [game, setGame] = useState(initial.state);
  const [locale, setLocale] = useState<Locale>(() => loadLocale(localStorage));
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<Tab>(loadTab);
  const chooseTab = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      // A remembered tab is a convenience; without storage it simply resets.
    }
  };
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
          <RealityPanel
            game={game}
            locale={locale}
            speed={speed}
            onBreakthrough={() => setGame(attemptRealBreakthrough)}
            onFinal={() => setGame(faceThePatriarch)}
          />
          {game.phase === 'dreaming' && <DreamPanel game={game} locale={locale} />}
          <SetupPanel game={game} locale={locale} update={setGame} />

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

            <label class="toggle">
              <input
                type="checkbox"
                checked={game.autopilot.enabled}
                onChange={(e) => {
                  const enabled = (e.currentTarget as HTMLInputElement).checked;
                  setGame((s) => setAutopilot(s, enabled));
                }}
              />
              <span>
                {m.ui.autopilot}
                <small class="muted">{m.ui.autopilotHint}</small>
              </span>
            </label>
            {game.autopilot.enabled && (
              <div class="priority">
                <span class="label">{m.ui.priority}</span>
                <ol>
                  {game.autopilot.priority.map((kind, i, all) => (
                    <li key={kind}>
                      <span>{m.ui.rewardKinds[kind]}</span>
                      <span class="arrows">
                        <button aria-label={m.ui.moveUp} disabled={i === 0} onClick={() => setGame((s) => movePriority(s, kind, -1))}>
                          ↑
                        </button>
                        <button
                          aria-label={m.ui.moveDown}
                          disabled={i === all.length - 1}
                          onClick={() => setGame((s) => movePriority(s, kind, 1))}
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <label class="toggle">
              <input
                type="checkbox"
                checked={game.waitForMe}
                onChange={(e) => {
                  const wait = (e.currentTarget as HTMLInputElement).checked;
                  setGame((s) => setWaitForMe(s, wait));
                }}
              />
              <span>
                {m.ui.waitForMe}
                <small class="muted">{m.ui.waitForMeHint}</small>
              </span>
            </label>

            <button class="quiet" onClick={restart}>
              {m.ui.newGame}
            </button>
          </section>
        </aside>

        <main class="main">
          {game.ascended && (
            <section class="panel ending">
              <h2>{m.ui.endingTitle}</h2>
              <p>{m.ui.endingText}</p>
            </section>
          )}

          {game.phase === 'dreaming' && game.life.fork && (
            <ForkCard game={game} locale={locale} speed={speed} onChoose={(option) => setGame((s) => chooseFork(s, option))} />
          )}

          {game.phase === 'choosing' && game.offer && (
            <section class="panel choose" aria-live="polite">
              <h2>{m.ui.chooseTitle}</h2>
              <div class="offers">
                {game.offer.map((reward, i) => {
                  const ctx = narrationContext(game, locale);
                  return (
                    <button key={i} class={`offer offer-${reward.kind}`} onClick={() => setGame((s) => chooseReward(s, i))}>
                      <strong>
                        <Icon name={reward.kind === 'item' ? reward.item.slot : reward.kind} /> {m.rewardTitle(reward, ctx)}
                      </strong>
                      <span>{m.rewardDesc(reward, ctx)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <MapPanel game={game} locale={locale} />

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

          <div class="tabs segmented" role="tablist">
            {TABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} aria-pressed={tab === t} onClick={() => chooseTab(t)}>
                {t === 'journal' ? m.ui.journal : t === 'chronicle' ? m.ui.chronicle : m.ui.statistics}
              </button>
            ))}
          </div>

          {tab === 'chronicle' && <ChroniclePanel game={game} locale={locale} />}
          {tab === 'stats' && <StatsPanel game={game} locale={locale} />}
          {tab === 'journal' && (
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
          )}
        </main>
      </div>
    </div>
  );
}

function ForkCard({
  game,
  locale,
  speed,
  onChoose,
}: {
  game: GameState;
  locale: Locale;
  speed: number;
  onChoose: (option: string) => void;
}) {
  const m = messages(locale);
  const ctx = narrationContext(game, locale);
  const fork = game.life.fork!;
  const texts = m.forks[fork.key]!;
  const instinct = m.instincts[game.life.instinct].name + (game.life.secondary ? ` + ${m.instincts[game.life.secondary].name}` : '');
  const fallback = instinctChoice(game);
  return (
    <section class="panel choose fork" aria-live="polite">
      <p class="question">{texts.question({ kind: 'fork', ageMonths: game.life.ageMonths, fork: fork.key, cost: fork.cost }, ctx)}</p>
      <div class="offers">
        {fork.options.map((option) => (
          <button key={option} class={option === fallback ? 'offer instinct-pick' : 'offer'} onClick={() => onChoose(option)}>
            <strong>{texts.options[option]!(fork, ctx)}</strong>
          </button>
        ))}
      </div>
      {!game.waitForMe && (
        <p class="muted small">
          {m.ui.forkWaiting(beatsToClock(Math.max(0, fork.deadline - game.beat), speed))} · {m.ui.forkInstinct(instinct)}
        </p>
      )}
    </section>
  );
}

function SetupPanel({ game, locale, update }: { game: GameState; locale: Locale; update: (fn: (s: GameState) => GameState) => void }) {
  const m = messages(locale);
  const { hero, setup } = game;
  const places = START_PLACES.filter((p) => !p.knowledge || hero.knowledge.includes(p.knowledge));
  const cost = setupCost(game);
  return (
    <section class="panel setup">
      <h2>{m.ui.nextDream}</h2>
      <dl class="facts">
        <dt>{m.ui.fate}</dt>
        <dd class={cost > hero.fate ? 'warning' : ''}>
          {hero.fate}
          {cost > 0 && ` − ${cost}`}
        </dd>
      </dl>

      <span class="label">{m.ui.instinct}</span>
      <div class="segmented wrap">
        {INSTINCT_KEYS.map((key) => (
          <button
            key={key}
            title={m.instincts[key].desc}
            aria-pressed={setup.instinct === key}
            onClick={() => update((s) => setSetup(s, { instinct: key, ...(s.setup.secondary === key ? { secondary: null } : {}) }))}
          >
            {m.instincts[key].name}
          </button>
        ))}
      </div>
      <p class="muted small">{m.instincts[setup.instinct].desc}</p>

      <label class="field">
        <span class="label">{m.ui.secondary}</span>
        <select
          value={setup.secondary ?? ''}
          onChange={(e) => {
            const value = (e.currentTarget as HTMLSelectElement).value;
            update((s) => setSetup(s, { secondary: value ? (value as Instinct) : null }));
          }}
        >
          <option value="">{m.ui.noSecondary}</option>
          {INSTINCT_KEYS.filter((key) => key !== setup.instinct).map((key) => (
            <option key={key} value={key}>
              {m.instincts[key].name}
            </option>
          ))}
        </select>
      </label>

      <label class="field">
        <span class="label">{m.ui.path}</span>
        <select
          value={setup.path}
          onChange={(e) => {
            const path = (e.currentTarget as HTMLSelectElement).value as PathKey;
            update((s) => setSetup(s, { path }));
          }}
        >
          {PATH_KEYS.map((key) => (
            <option key={key} value={key}>
              {m.paths[key]}
            </option>
          ))}
        </select>
      </label>

      {places.length > 1 && (
        <label class="field">
          <span class="label">{m.ui.start}</span>
          <select
            value={setup.start}
            onChange={(e) => {
              const start = (e.currentTarget as HTMLSelectElement).value;
              update((s) => setSetup(s, { start }));
            }}
          >
            {places.map((p) => (
              <option key={p.key} value={p.key}>
                {m.startPlaces[p.key]!.name}
                {p.cost > 0 ? ` (${m.ui.cost(p.cost)})` : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      <label class="toggle">
        <input
          type="checkbox"
          checked={setup.blessing}
          onChange={(e) => {
            const blessing = (e.currentTarget as HTMLInputElement).checked;
            update((s) => setSetup(s, { blessing }));
          }}
        />
        <span>
          {m.ui.blessing} ({m.ui.cost(BLESSING_COST)})<small class="muted">{m.ui.blessingHint}</small>
        </span>
      </label>

      {hero.knowledge.length > 0 && (
        <>
          <h3>{m.ui.knowledge}</h3>
          <ul class="plain">
            {hero.knowledge.map((k) => (
              <li key={k} title={m.knowledge[k]?.desc}>
                {m.knowledge[k]?.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function RealityPanel({
  game,
  locale,
  speed,
  onBreakthrough,
  onFinal,
}: {
  game: GameState;
  locale: Locale;
  speed: number;
  onBreakthrough: () => void;
  onFinal: () => void;
}) {
  const m = messages(locale);
  const ctx = narrationContext(game, locale);
  const { hero } = game;
  const atCeiling = hero.level >= MAX_LEVEL;
  const nextRealm = m.realms[REALMS[realmOf(hero.level + 1)]!.key]!.gen;

  return (
    <section class="panel reality">
      <h2>{ctx.heroName}</h2>
      <p class="muted">
        {m.ui.reality} · {levelLabel(m, hero.level)}
      </p>
      <dl class="facts">
        <dt>{m.ui.root}</dt>
        <dd>{m.roots[hero.root]}</dd>
        <dt>{m.ui.path}</dt>
        <dd>{m.paths[hero.path]}</dd>
        {CRAFT_KEYS.some((k) => hero.crafts[k] >= 1) && (
          <>
            <dt>{m.ui.crafts}</dt>
            <dd>{craftList(hero.crafts, m)}</dd>
          </>
        )}
      </dl>

      {!atCeiling && <Meter label={m.ui.qi} value={hero.qi} max={qiToReach(hero.level + 1)} kind="qi" />}
      {canAttemptRealBreakthrough(hero) && (
        <button class="action" onClick={onBreakthrough}>
          {m.ui.breakthrough(nextRealm)}
          <small>{m.ui.breakthroughChance(Math.round(realBreakthroughChance(hero) * 100))}</small>
        </button>
      )}
      {hero.injuryBeats > 0 && <p class="warning">{m.ui.injured(beatsToClock(hero.injuryBeats, speed))}</p>}

      <p class="small">
        <Icon name="secret" /> {m.ui.secrets(SECRETS.filter((x) => hero.knowledge.includes(x.key)).length, SECRETS.length)}
      </p>
      {canFaceThePatriarch(game) && (
        <button class="action final" onClick={onFinal}>
          {m.ui.finalBattle}
          <small>{m.ui.finalHint}</small>
        </button>
      )}

      <div class="charges">
        <span class="label">{m.ui.charges}</span>
        <span class="dots" aria-label={`${game.charges} / ${CHARGE_MAX}`}>
          {Array.from({ length: CHARGE_MAX }, (_, i) => (
            <span key={i} class={i < game.charges ? 'dot full' : 'dot'} />
          ))}
        </span>
        {game.charges < CHARGE_MAX && (
          <small class="muted">{m.ui.nextCharge(beatsToClock(BEATS_PER_CHARGE - game.chargeBeats, speed))}</small>
        )}
      </div>
      {game.phase === 'resting' && <p class="muted">{m.ui.resting}</p>}

      <h3>{m.ui.talents}</h3>
      {hero.talents.length === 0 ? (
        <p class="muted small">{m.ui.noTalents}</p>
      ) : (
        <ul class="plain">
          {hero.talents.map((t, i) => (
            <li key={i} title={m.talents[t.key]?.desc}>
              {m.rewardTitle({ kind: 'talent', talent: t }, ctx)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DreamPanel({ game, locale }: { game: GameState; locale: Locale }) {
  const m = messages(locale);
  const ctx = narrationContext(game, locale);
  const { life } = game;
  const stats = effectiveStats(life);
  const hpMax = maxHp(life);
  const atCeiling = life.level >= MAX_LEVEL;

  return (
    <section class="panel hero">
      <h2>{m.ui.inDream}</h2>
      <p class="muted">
        {m.ui.dream(life.n)} · {m.ui.activity[life.activity]} · {ctx.age(life.ageMonths)}
      </p>

      <dl class="facts">
        <dt>{m.ui.realm}</dt>
        <dd>{levelLabel(m, life.level)}</dd>
      </dl>

      <Meter label={m.ui.hp} value={life.hp} max={hpMax} kind="hp" />
      {!atCeiling && <Meter label={m.ui.qi} value={life.qi} max={qiToReach(life.level + 1)} kind="qi" />}

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
        <dt>{m.ui.karma}</dt>
        <dd>{life.karma}</dd>
        <dt>{m.ui.reputation}</dt>
        <dd>{life.reputation}</dd>
        <dt>{m.ui.sectRank}</dt>
        <dd>{cap(m.sectRank(life.sectRank, ctx))}</dd>
        {life.grudge && (
          <>
            <dt>{m.ui.grudge}</dt>
            <dd>{cap(ctx.enemy(life.grudge.enemy, life.grudge.name).nom)}</dd>
          </>
        )}
      </dl>
      <dl class="facts">
        <dt>{m.ui.gatheringPills}</dt>
        <dd>{life.pills.gathering}</dd>
        {life.talismans.escape + life.talismans.thunder > 0 && (
          <>
            <dt>{m.ui.talismans}</dt>
            <dd>
              {(['escape', 'thunder'] as const)
                .filter((k) => life.talismans[k] > 0)
                .map((k) => `${m.ui.talismanKinds[k]} ${life.talismans[k]}`)
                .join(' · ')}
            </dd>
          </>
        )}
        <dt>{m.ui.crafts}</dt>
        <dd>{craftList(life.crafts, m) || '—'}</dd>
        <dt>{m.ui.materials}</dt>
        <dd>
          {(['herbs', 'cores', 'ore'] as const).map((k) => `${m.ui.mats[k]} ${Math.round(life.mats[k])}`).join(' · ')}
        </dd>
      </dl>
      {SECT_RANKS[life.sectRank] && (
        <p class="muted small">
          {m.ui.nextRank(
            m.sectRank(life.sectRank + 1, ctx),
            m.realms[REALMS[realmOf(SECT_RANKS[life.sectRank]!.level)]!.key]!.nom,
            SECT_RANKS[life.sectRank]!.reputation,
          )}
        </p>
      )}
      {life.shop.level > 0 && <p class="small">{m.ui.shop(life.shop.level)}</p>}
      {life.quest && (
        <p class="small">
          <span class="muted">{m.ui.quest}: </span>
          {m.questDesc(life.quest, ctx)}
        </p>
      )}

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
              <span class="muted">
                <Icon name={slot} /> {m.slots[slot]}
              </span>
              {item ? <span class={`rank-${item.rank}`}>{ctx.item(item, 'nom')}</span> : <span class="muted">—</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Алхімія 3 · Талісмани 1": crafts at level 1 or above. */
function craftList(crafts: Crafts, m: Messages): string {
  return CRAFT_KEYS.filter((k) => crafts[k] >= 1)
    .map((k) => `${m.crafts[k]} ${Math.floor(crafts[k])}`)
    .join(' · ');
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
