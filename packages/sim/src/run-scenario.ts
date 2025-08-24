import type { SimulationSnapshot } from './snapshot';
import { Simulation } from './simulation';

interface ScenarioState {
  position: number;
  random: number;
}

/**
 * Runs a deterministic scenario used in tests. Each input value represents a
 * positional delta applied on the corresponding tick.
 *
 * @param seed - Seed for the pseudo-random number generator.
 * @param inputs - List of positional deltas applied sequentially.
 * @returns Snapshots after each processed tick.
 */
export function runScenario(
  seed: number,
  inputs: readonly number[],
): SimulationSnapshot<ScenarioState>[] {
  let currentInput = 0;
  const sim = new Simulation<ScenarioState>({
    timestepMs: 50,
    seed,
    initialState: { position: 0, random: 0 },
    update: (state, rng) => {
      state.position += currentInput;
      state.random += rng.next();
    },
  });

  const snapshots: SimulationSnapshot<ScenarioState>[] = [];
  for (const input of inputs) {
    currentInput = input;
    sim.advance();
    snapshots.push(sim.snapshot());
  }
  return snapshots;
}
