import { describe, expect, it, vi } from 'vitest';
import { Simulation, deserializeSimulation, runScenario, serializeSnapshot } from '../src';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

describe('Simulation', () => {
  it('produces identical state for identical seeds', () => {
    const createSim = () =>
      new Simulation<{ values: number[] }>({
        timestepMs: 16,
        seed: 123,
        initialState: { values: [] },
        update: (state, rng) => {
          state.values.push(rng.next());
        },
      });

    const simA = createSim();
    const simB = createSim();

    simA.advance(5);
    simB.advance(5);

    expect(simA.currentState).toEqual(simB.currentState);
    expect(simA.tick).toBe(simB.tick);
  });

  it('stops advancing once stop is called', () => {
    vi.useFakeTimers();

    const sim = new Simulation<{ tick: number }>({
      timestepMs: 10,
      seed: 1,
      initialState: { tick: 0 },
      update: (state) => {
        state.tick += 1;
      },
    });

    sim.start();
    vi.advanceTimersByTime(35); // advance ~3 ticks
    sim.stop();

    const ticksAfterStop = sim.tick;
    vi.advanceTimersByTime(50);

    expect(sim.tick).toBe(ticksAfterStop);
  });

  it('serializes and restores snapshot', () => {
    const update = (state: { value: number }, rng: { next: () => number }): void => {
      state.value += rng.next();
    };
    const sim = new Simulation<{ value: number }>({
      timestepMs: 50,
      seed: 1,
      initialState: { value: 0 },
      update,
    });
    sim.advance(3);
    const json = serializeSnapshot(sim.snapshot());
    const restored = deserializeSimulation<{ value: number }>(json, {
      timestepMs: 50,
      update,
    });
    restored.advance(2);
    sim.advance(2);
    expect(restored.currentState).toEqual(sim.currentState);
    expect(restored.tick).toBe(sim.tick);
  });

  it('runScenario matches golden snapshots', () => {
    const snapshots = runScenario(123, [1, 0, -1, 2]);
    const dir = dirname(fileURLToPath(import.meta.url));
    const golden = JSON.parse(
      readFileSync(join(dir, 'data', 'scenario.golden.json'), 'utf8'),
    );
    expect(snapshots).toEqual(golden);
  });
});
