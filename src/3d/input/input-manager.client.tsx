"use client";
import { createContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { ACTIONS, type ActionId, type InputContextId } from "./actions";
import { DEFAULT_BINDINGS, mergeBindings, validateOneToOne, type ContextBindings } from "./bindings";
import { createInputBus, type InputBus } from "./input-bus";
import { createInputState, type InputStateStore } from "./input-state";
import { attachKeyboard } from "./devices/keyboard";
import { attachMouse } from "./devices/mouse";
import { INPUT_CONTEXTS } from "./contexts";
import { loadBindings } from "./persistence/storage";

export interface InputRuntime {
  bus: InputBus;
  state: InputStateStore;
  activeContext: InputContextId;
  setContext: (ctx: InputContextId) => void;
  requestPointerLock: (el?: Element | null) => void;
  exitPointerLock: () => void;
  isPointerLocked: boolean;
  bindings: ContextBindings;
}

export const InputRuntimeContext = createContext<InputRuntime | null>(null);

export interface InputProviderProps extends PropsWithChildren {
  initialContext?: InputContextId;
  overrides?: Partial<ContextBindings>;
}

export function InputProvider({ initialContext = "menu", overrides, children }: InputProviderProps) {
  // Build runtime (bus + state)
  const busRef = useRef<InputBus>();
  if (!busRef.current) busRef.current = createInputBus();
  const stateRef = useRef<InputStateStore>();
  if (!stateRef.current) stateRef.current = createInputState(busRef.current);

  // Merge bindings: defaults <- persisted <- overrides
  const persisted = useMemo(() => loadBindings(), []);
  const bindings = useMemo(
    () => mergeBindings(DEFAULT_BINDINGS, mergeBindings(persisted || ({} as any), overrides)),
    [persisted, overrides],
  );

  // Validate one->one (inverse) per context
  useEffect(() => {
    for (const ctx of INPUT_CONTEXTS) {
      const issues = validateOneToOne(bindings[ctx]);
      if (issues.length) {
        const details = issues.map((i) => `${i.key} -> ${i.actions.join(", ")}`).join("; ");
        // Fail fast to respect the contract
        console.error(`[Input] Conflit bindings (${ctx}): ${details}`);
        throw new Error(`Bindings invalides pour ${ctx}: ${details}`);
      }
    }
  }, [bindings]);

  const [activeContext, setActiveContext] = useState<InputContextId>(initialContext);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  // Device mounting
  useEffect(() => {
    const bus = busRef.current!;
    const keyboardDetach = attachKeyboard({
      resolveAction: (code) => bindings[activeContext]?.[code],
      bus,
    });

    const mouseDetach = attachMouse({
      resolveAction: (code) =>
        code === "Mouse:Move" ? (activeContext === "gameplay" ? ("game.look" as ActionId) : undefined) : bindings[activeContext]?.[code],
      bus,
      analogLookEnabled: () => activeContext === "gameplay",
    });

    const onPLChange = () => setIsPointerLocked(Boolean(document.pointerLockElement));
    document.addEventListener("pointerlockchange", onPLChange);

    const onBlur = () => stateRef.current?.clearAll();
    window.addEventListener("blur", onBlur);

    return () => {
      keyboardDetach?.();
      mouseDetach?.();
      document.removeEventListener("pointerlockchange", onPLChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [activeContext, bindings]);

  // Gestion context via action ui.toggleMenu
  useEffect(() => {
    const unsub = busRef.current!.subscribe((ev) => {
      if (ev.type === "digital" && ev.phase === "pressed" && ev.action === ("ui.toggleMenu" as ActionId)) {
        setActiveContext((c) => {
          const next = c === "gameplay" ? ("menu" as InputContextId) : ("gameplay" as InputContextId);
          if (next === "menu") document.exitPointerLock?.();
          return next;
        });
      }
    });
    return () => unsub();
  }, []);

  const requestPointerLock = (el?: Element | null) => {
    const target = el ?? document.body;
    target?.requestPointerLock?.();
  };
  const exitPointerLock = () => document.exitPointerLock?.();

  const value: InputRuntime = useMemo(
    () => ({
      bus: busRef.current!,
      state: stateRef.current!,
      activeContext,
      setContext: setActiveContext,
      requestPointerLock,
      exitPointerLock,
      isPointerLocked,
      bindings,
    }),
    [activeContext, isPointerLocked, bindings],
  );

  return <InputRuntimeContext.Provider value={value}>{children}</InputRuntimeContext.Provider>;
}
