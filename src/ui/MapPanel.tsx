import { SECRETS } from '../data/knowledge.ts';
import { ZONES, zoneFor } from '../data/zones.ts';
import type { GameState } from '../engine/types.ts';
import { messages, type Locale } from '../i18n/index.ts';
import { Icon } from './Icon.tsx';

/** Where each region sits on the scroll, from the village at the bottom left to the Heavenly Stairs at the top right. */
const SPOTS: Record<string, { x: number; y: number }> = {
  villageWoods: { x: 70, y: 250 },
  azureFoothills: { x: 170, y: 185 },
  thousandBeastForest: { x: 290, y: 235 },
  poisonMistSwamps: { x: 390, y: 160 },
  burningSands: { x: 510, y: 220 },
  northernIsles: { x: 560, y: 110 },
  heavenlyStairs: { x: 470, y: 50 },
};

/** Places remembered from dreams, pinned next to the region they belong to. */
const PLACES: Record<string, { zone: string; dx: number; dy: number }> = {
  oldZhangCave: { zone: 'azureFoothills', dx: -38, dy: -30 },
  hiddenSpring: { zone: 'thousandBeastForest', dx: 40, dy: 22 },
  thousandPillValley: { zone: 'villageWoods', dx: 50, dy: -40 },
  ironFistClan: { zone: 'azureFoothills', dx: 48, dy: 18 },
};

export function MapPanel({ game, locale }: { game: GameState; locale: Locale }) {
  const m = messages(locale);
  const deaths = new Map<string, number>();
  for (const s of game.chronicle) if (s.zone) deaths.set(s.zone, (deaths.get(s.zone) ?? 0) + 1);
  const here = game.phase === 'dreaming' ? zoneFor(game.life.level).key : null;
  const route = ZONES.map((z) => SPOTS[z.key]!).map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const known = new Set(game.hero.knowledge);

  return (
    <section class="panel map">
      <h2>{m.ui.map}</h2>
      <svg viewBox="0 0 640 300" role="img" aria-label={m.ui.map}>
        <path d={route} class="map-route" />
        {ZONES.map((z) => {
          const p = SPOTS[z.key]!;
          const died = deaths.get(z.key) ?? 0;
          const secret = SECRETS.find((x) => x.boss === z.boss);
          return (
            <g key={z.key} class={here === z.key ? 'map-zone here' : 'map-zone'}>
              <ellipse cx={p.x} cy={p.y} rx="46" ry="22" />
              <text x={p.x} y={p.y + 4} text-anchor="middle" class="map-label">
                {m.zones[z.key]?.nom}
              </text>
              {died > 0 && (
                <g class="map-deaths" transform={`translate(${p.x + 30} ${p.y - 34})`}>
                  <title>{m.ui.mapDeaths(died)}</title>
                  <Icon name="death" size={14} />
                  <text x="16" y="11">
                    {died}
                  </text>
                </g>
              )}
              {secret && known.has(secret.key) && (
                <g class="map-secret" transform={`translate(${p.x - 44} ${p.y - 34})`}>
                  <title>{m.knowledge[secret.key]?.name}</title>
                  <Icon name="secret" size={14} />
                </g>
              )}
              {here === z.key && (
                <text x={p.x} y={p.y + 38} text-anchor="middle" class="map-here">
                  {m.ui.mapHere}
                </text>
              )}
            </g>
          );
        })}
        {Object.entries(PLACES)
          .filter(([key]) => known.has(key))
          .map(([key, place]) => {
            const p = SPOTS[place.zone]!;
            return (
              <g key={key} class="map-place" transform={`translate(${p.x + place.dx} ${p.y + place.dy})`}>
                <title>{m.knowledge[key]?.name}</title>
                <Icon name="place" size={14} />
              </g>
            );
          })}
      </svg>
    </section>
  );
}
