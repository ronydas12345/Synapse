/** Mulberry32 — deterministic RNG for testable path selection. */
export type Rng = () => number;

export function createSeededRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDefaultRng(): Rng {
  return Math.random;
}

/** Pick index by relative weights. Returns 0 if weights empty. */
export function pickWeightedIndex(weights: number[], rng: Rng): number {
  if (weights.length === 0) return 0;
  const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) return 0;
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= Math.max(0, weights[i]);
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}
