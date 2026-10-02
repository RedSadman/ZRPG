import { INSTINCT_KEYS } from '../data/instincts.ts';
import type { DeathCause, GameState } from '../engine/types.ts';
import { messages, type Locale } from '../i18n/index.ts';
import { levelLabel, narrate, narrateSummary, narrationContext } from '../narrator/narrator.ts';
import { Icon } from './Icon.tsx';

const CAUSES: DeathCause[] = ['killed', 'oldAge', 'deviation', 'tribulation'];
const NEMESES_SHOWN = 5;

/** Every dream the Chronicle still keeps, newest first; each one opens to its key moments and what was carried out. */
export function ChroniclePanel({ game, locale }: { game: GameState; locale: Locale }) {
  const m = messages(locale);
  const ctx = narrationContext(game, locale);
  if (game.chronicle.length === 0) {
    return (
      <section class="panel chronicle">
        <h2>{m.ui.chronicle}</h2>
        <p class="muted">{m.ui.noDreamsYet}</p>
      </section>
    );
  }
  return (
    <section class="panel chronicle">
      <h2>{m.ui.chronicle}</h2>
      <p class="muted small">{m.ui.chronicleHint(game.chronicle.length)}</p>
      <ol>
        {game.chronicle
          .slice()
          .reverse()
          .map((s) => (
            <li key={s.n}>
              <details>
                <summary>{narrateSummary(s, game, locale)}</summary>
                {s.instinct && s.path && (
                  <p class="muted small">
                    {m.instincts[s.instinct].name} · {m.paths[s.path]}
                  </p>
                )}
                <ol class="highlights">
                  {s.highlights.map((event, i) => (
                    <li key={i}>{narrate(event, game, locale, s.n + i)}</li>
                  ))}
                </ol>
                {s.reward && (
                  <p class="small">
                    <Icon name={s.reward.kind === 'item' ? s.reward.item.slot : s.reward.kind} />{' '}
                    {m.ui.carriedOut(m.rewardTitle(s.reward, ctx))}
                  </p>
                )}
              </details>
            </li>
          ))}
      </ol>
    </section>
  );
}

/** Counts over every dream ever dreamed: how they ended, who ended them, the records. */
export function StatsPanel({ game, locale }: { game: GameState; locale: Locale }) {
  const m = messages(locale);
  const ctx = narrationContext(game, locale);
  const st = game.stats;
  if (st.dreams === 0) {
    return (
      <section class="panel stats-panel">
        <h2>{m.ui.statistics}</h2>
        <p class="muted">{m.ui.noDreamsYet}</p>
      </section>
    );
  }
  const nemeses = Object.entries(st.killers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, NEMESES_SHOWN);
  const maxCause = Math.max(1, ...CAUSES.map((c) => st.deaths[c] ?? 0));

  return (
    <section class="panel stats-panel">
      <h2>{m.ui.statistics}</h2>
      <dl class="tiles">
        <div>
          <dt>{m.ui.statDreams}</dt>
          <dd>{st.dreams}</dd>
        </div>
        <div>
          <dt>{m.ui.statYears}</dt>
          <dd>{Math.floor(st.months / 12).toLocaleString(locale)}</dd>
        </div>
        <div>
          <dt>{m.ui.statKills}</dt>
          <dd>{st.kills.toLocaleString(locale)}</dd>
        </div>
        <div>
          <dt>{m.ui.statBosses}</dt>
          <dd>{st.bosses}</dd>
        </div>
      </dl>

      <h3>{m.ui.wakings}</h3>
      <ul class="plain bars">
        {CAUSES.map((cause) => {
          const n = st.deaths[cause] ?? 0;
          return (
            <li key={cause}>
              <span class="bar-label">{m.ui.deathCauses[cause]}</span>
              <span class="bar" style={{ width: `${(100 * n) / maxCause}%` }} />
              <span class="bar-value">{n}</span>
            </li>
          );
        })}
      </ul>

      {nemeses.length > 0 && (
        <>
          <h3>{m.ui.nemeses}</h3>
          <ol class="nemeses">
            {nemeses.map(([key, n]) => (
              <li key={key}>
                <span>{ctx.enemy(key).nom}</span>
                <span class="muted">{n}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <h3>{m.ui.records}</h3>
      <ul class="plain">
        <li>{m.ui.recordLevel(levelLabel(m, st.best.level.value), st.best.level.dream)}</li>
        <li>{m.ui.recordAge(ctx.age(st.best.age.value), st.best.age.dream)}</li>
        <li>{m.ui.recordScore(st.best.score.value, st.best.score.dream)}</li>
      </ul>

      <h3>{m.ui.byInstinct}</h3>
      <ul class="plain">
        {INSTINCT_KEYS.filter((k) => st.byInstinct[k]).map((k) => {
          const row = st.byInstinct[k]!;
          return (
            <li key={k}>
              <strong>{m.instincts[k].name}</strong>: {m.ui.instinctRow(row.dreams, Math.round(row.score / row.dreams))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
