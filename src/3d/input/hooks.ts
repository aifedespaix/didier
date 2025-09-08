"use client";
import { useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { ActionId } from "./actions";
import type { ActionEvent } from "./input-bus";
import { InputRuntimeContext } from "./input-manager.client";

export function useInputRuntime() {
  const ctx = useContext(InputRuntimeContext);
  if (!ctx) throw new Error("InputProvider manquant");
  return ctx;
}

export function useActionPressed(action: ActionId): boolean {
  const { state } = useInputRuntime();
  const subscribe = useCallback((cb: () => void) => state.subscribe(cb), [state]);
  const getSnapshot = useCallback(() => state.getSnapshot().digital[action]?.pressed ?? false, [state, action]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useAnalogDelta(action: ActionId): { dx: number; dy: number; flush: () => void } {
  const { state } = useInputRuntime();
  const subscribe = useCallback((cb: () => void) => state.subscribe(cb), [state]);
  const getSnapshot = useCallback(() => state.getSnapshot().analog[action] ?? { dx: 0, dy: 0 }, [state, action]);
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const flush = useCallback(() => state.flushAnalog(action), [state, action]);
  return { dx: snap.dx, dy: snap.dy, flush };
}

export function useActionEvents(action: ActionId, handler: (ev: ActionEvent) => void) {
  const { bus } = useInputRuntime();
  const memoHandler = useMemo(() => handler, [handler]);
  useEffect(() => {
    return bus.subscribe((ev) => {
      if ((ev as any).action === action) memoHandler(ev);
    });
  }, [bus, memoHandler, action]);
}

export function useInputContext() {
  const ctx = useInputRuntime();
  return { context: ctx.activeContext, setContext: ctx.setContext };
}

