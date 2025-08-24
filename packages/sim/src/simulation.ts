import type { Rng } from './rng';
import { createRng, createRngFromState } from './rng';
import { deserializeSnapshot, type SimulationSnapshot } from './snapshot';

/**
 * Options for constructing a {@link Simulation} instance.
 *
 * @typeParam State - Shape of the mutable simulation state object.
 */
export interface SeededSimulationOptions<State> {
  readonly timestepMs: number;
  readonly seed: number;
  readonly initialState: State;
  readonly update: (state: State, rng: Rng, deltaMs: number) => void;
}

export interface SnapshotSimulationOptions<State> {
  readonly timestepMs: number;
  readonly snapshot: SimulationSnapshot<State>;
  readonly update: (state: State, rng: Rng, deltaMs: number) => void;
}

export type SimulationOptions<State> =
  | SeededSimulationOptions<State>
  | SnapshotSimulationOptions<State>;

/**
 * Runs a simulation loop with a fixed timestep and deterministic random number
 * generator. The loop can be advanced manually or via {@link start} which
 * schedules ticks using `setInterval`.
 *
 * @typeParam State - Shape of the mutable simulation state object.
 */
export class Simulation<State> {
  private readonly timestepMs: number;
  private readonly update: (state: State, rng: Rng, deltaMs: number) => void;
  private readonly rng: Rng;
  private readonly state: State;
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickCount: number;
  private accumulator = 0;

  constructor(options: SimulationOptions<State>) {
    this.timestepMs = options.timestepMs;
    this.update = options.update;
    if ('snapshot' in options) {
      this.rng = createRngFromState(options.snapshot.rngState);
      this.state = options.snapshot.state;
      this.tickCount = options.snapshot.tick;
    } else {
      this.rng = createRng(options.seed);
      this.state = options.initialState;
      this.tickCount = 0;
    }
  }

  /**
   * Begins automatically advancing the simulation at the configured timestep.
   * Subsequent calls have no effect until {@link stop} is invoked.
   */
  start(): void {
    if (this.timer !== null) {
      return;
    }
    let last = Date.now();
    this.timer = setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      this.frame(delta);
    }, this.timestepMs / 2);
  }

  /**
   * Stops automatic advancement started by {@link start}.
   */
  stop(): void {
    if (this.timer === null) {
      return;
    }
    clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * Advances the simulation by a given number of ticks. Defaults to a single
   * tick when no parameter is provided.
   *
   * @param steps - Number of fixed ticks to process.
   */
  frame(elapsedMs: number): void {
    this.accumulator += elapsedMs;
    while (this.accumulator >= this.timestepMs) {
      this.update(this.state, this.rng, this.timestepMs);
      this.accumulator -= this.timestepMs;
      this.tickCount += 1;
    }
  }

  advance(steps = 1): void {
    this.frame(this.timestepMs * steps);
  }

  /**
   * Current mutable simulation state.
   */
  get currentState(): State {
    return this.state;
  }

  /**
   * Number of ticks processed since the simulation was created.
   */
  get tick(): number {
    return this.tickCount;
  }

  snapshot(): SimulationSnapshot<State> {
    return {
      tick: this.tickCount,
      rngState: this.rng.getState(),
      state: structuredClone(this.state),
    };
  }
}

export function deserializeSimulation<State>(
  json: string,
  options: Omit<SnapshotSimulationOptions<State>, 'snapshot'>,
): Simulation<State> {
  const snapshot = deserializeSnapshot<State>(json);
  return new Simulation<State>({ ...options, snapshot });
}
