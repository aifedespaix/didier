export interface SimulationSnapshot<State> {
  readonly tick: number;
  readonly rngState: number;
  readonly state: State;
}

export function serializeSnapshot<State>(snapshot: SimulationSnapshot<State>): string {
  return JSON.stringify(snapshot);
}

export function deserializeSnapshot<State>(json: string): SimulationSnapshot<State> {
  return JSON.parse(json) as SimulationSnapshot<State>;
}
