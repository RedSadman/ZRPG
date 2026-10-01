// Mulberry32: small, fast, and its whole state is one uint32, so a dream can be saved and replayed exactly.
// The engine never touches Math.random() — every roll goes through one of these.

export interface Rng {
  state: number;
}

export function createRng(seed: number): Rng {
  return { state: seed >>> 0 };
}

/** Uniform float in [0, 1). Advances the generator. */
export function nextFloat(rng: Rng): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Uniform integer in [min, max], both inclusive. */
export function nextInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(nextFloat(rng) * (max - min + 1));
}

/** Uniform float in [min, max). */
export function between(rng: Rng, min: number, max: number): number {
  return min + nextFloat(rng) * (max - min);
}

export function chance(rng: Rng, p: number): boolean {
  return nextFloat(rng) < p;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(nextFloat(rng) * items.length)]!;
}

export function pickWeighted<T extends { weight: number }>(rng: Rng, items: readonly T[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = nextFloat(rng) * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return items.at(-1)!;
}
