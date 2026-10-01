// Real time lives here, never in the engine: the engine only counts ticks.

export const TICK_MS = 3000;
/** Offline catch-up is capped at 24 hours of ticks. */
export const MAX_OFFLINE_TICKS = (24 * 60 * 60 * 1000) / TICK_MS;

export function ticksSince(lastTickAt: number, now: number): number {
  const ticks = Math.floor((now - lastTickAt) / TICK_MS);
  return Math.min(Math.max(ticks, 0), MAX_OFFLINE_TICKS);
}

/** Calls `onTick` every TICK_MS / speed milliseconds. Returns a stop function. */
export function startTicker(onTick: () => void, speed: number): () => void {
  const id = setInterval(onTick, TICK_MS / speed);
  return () => clearInterval(id);
}
