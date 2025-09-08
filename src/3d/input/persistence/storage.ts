import type { ContextBindings } from "../bindings";
import type { PersistedBindings, PersistedBindingsV1 } from "./schema";
import { isPersistedBindingsV1 } from "./schema";

const KEY = "didier.bindings";

export function loadBindings(): Partial<ContextBindings> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const data = JSON.parse(raw) as PersistedBindings;
    if (isPersistedBindingsV1(data)) {
      return data.contexts;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function saveBindings(contexts: Partial<ContextBindings>) {
  if (typeof window === "undefined") return;
  const data: PersistedBindingsV1 = { version: 1, contexts };
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

