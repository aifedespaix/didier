/**
 * Pseudorandom number generator producing deterministic sequences from a seed.
 *
 * This generator uses the Mulberry32 algorithm, which is fast and has a
 * sufficiently long period for simulation purposes. The generated numbers are
 * floating point values in the range [0, 1).
 */
export interface Rng {
  /**
   * Returns the next pseudo-random number in the range [0, 1).
   */
  next(): number;
}

/**
 * Creates a new {@link Rng} seeded with the provided value.
 *
 * @param seed - Unsigned 32-bit integer used to seed the generator.
 * @returns A deterministic random number generator.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next: (): number => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
