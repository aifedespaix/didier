import type { ContextBindings } from "../bindings";

export interface PersistedBindingsV1 {
  version: 1;
  contexts: Partial<ContextBindings>;
}

export type PersistedBindings = PersistedBindingsV1;

export function isPersistedBindingsV1(x: any): x is PersistedBindingsV1 {
  return x && typeof x === "object" && x.version === 1 && x.contexts && typeof x.contexts === "object";
}

