import type { Rng } from './rng';
import { createRng } from './rng';

/**
 * Options for constructing a {@link Simulation} instance.
 *
 * @typeParam State - Shape of the mutable simulation state object.
 */
export interface SimulationOptions<State> {
  /**
   * Fixed duration of a single simulation tick in milliseconds.
   */
  readonly timestepMs: number;
  /**
   * Seed used to initialize the internal random number generator.
   */
  readonly seed: number;
  /**
   * Initial state of the simulation. It will be mutated in place by the
   * {@link update} function during each tick.
   */
  readonly initialState: State;
  /**
   * Function invoked on every tick of the simulation. It receives the current
   * state, a deterministic random number generator and the fixed timestep in
   * milliseconds.
   */
  readonly update: (state: State, rng: Rng, deltaMs: number) => void;
}

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
  private tickCount = 0;

  constructor(options: SimulationOptions<State>) {
    this.timestepMs = options.timestepMs;
    this.update = options.update;
    this.rng = createRng(options.seed);
    this.state = options.initialState;
  }

  /**
   * Begins automatically advancing the simulation at the configured timestep.
   * Subsequent calls have no effect until {@link stop} is invoked.
   */
  start(): void {
    if (this.timer !== null) {
      return;
    }
    this.timer = setInterval(() => this.advance(), this.timestepMs);
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
  advance(steps = 1): void {
    for (let i = 0; i < steps; i++) {
      this.update(this.state, this.rng, this.timestepMs);
      this.tickCount += 1;
    }
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
}
