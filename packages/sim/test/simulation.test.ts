import { describe, expect, it, vi } from 'vitest';
import { Simulation } from '../src';

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
});
