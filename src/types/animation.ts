export type AnimStateId =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "dash"
  | "cast"
  | "attack"
  | "hit"
  | "death";

export interface AnimClipHints {
  // Map canonical state -> list of substrings to match in clip names
  [state: string]: string[];
}

export type AnimClipMap = Partial<Record<AnimStateId, string>>;

export interface AnimationTransitionConfig {
  fade: number; // seconds for crossfade
  reenterSameState?: boolean; // allow restarting same state
}

export interface OneShotConfig {
  // states that should return to a fallback (e.g., idle) when finished
  [state: string]: { next: AnimStateId; fade?: number };
}

