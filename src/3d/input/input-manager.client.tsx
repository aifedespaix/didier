"use client";
import { createContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import type { ActionId, InputContextId } from "./actions";
import {
	buildDefaultBindings,
	mergeBindings,
	validateOneToOne,
	type ContextBindings,
	type KeyboardLayout,
} from "./bindings";
import { detectKeyboardLayout, resolveLayoutAsync } from "./keyboard-layout";
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

export function InputProvider({
	initialContext = "menu",
	overrides,
	children,
}: InputProviderProps) {
	// Build runtime (bus + state)
	const busRef = useRef<InputBus | null>(null);
	if (!busRef.current) busRef.current = createInputBus();
	const stateRef = useRef<InputStateStore | null>(null);
	if (!stateRef.current) stateRef.current = createInputState(busRef.current);

	// Merge bindings: defaults <- persisted <- overrides
	const persisted = useMemo(() => loadBindings(), []);
	const [layout, setLayout] = useState<KeyboardLayout>(() =>
		detectKeyboardLayout(),
	);
	useEffect(() => {
		resolveLayoutAsync()
			.then(setLayout)
			.catch(() => {});
	}, []);
	const bindings = useMemo(() => {
		const defaults = buildDefaultBindings(layout);
		const withPersisted = mergeBindings(defaults, persisted);
		const merged = mergeBindings(withPersisted, overrides);
		// Enforce essential bindings regardless of user overrides
		const b = {
			...merged,
			gameplay: { ...(merged.gameplay || {}) },
		} as ContextBindings;
		b.gameplay["Key:Escape"] = "ui.toggleMenu" as ActionId;
		// Ensure primary fire always remains on left mouse button in gameplay context
		b.gameplay["Mouse:Left"] = "game.fire" as ActionId;
		return b;
	}, [persisted, overrides, layout]);

	// Validate one->one (inverse) per context
	useEffect(() => {
		for (const ctx of INPUT_CONTEXTS) {
			const issues = validateOneToOne(bindings[ctx]);
			if (issues.length) {
				const details = issues
					.map((i) => `${i.key} -> ${i.actions.join(", ")}`)
					.join("; ");
				// Fail fast to respect the contract
				console.error(`[Input] Conflit bindings (${ctx}): ${details}`);
				throw new Error(`Bindings invalides pour ${ctx}: ${details}`);
			}
		}
	}, [bindings]);

	const [activeContext, setActiveContext] =
		useState<InputContextId>(initialContext);
	const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

	// Device mounting
	useEffect(() => {
		const bus = busRef.current;
		if (!bus) return;
		const keyboardDetach = attachKeyboard({
			resolveAction: (code) => bindings[activeContext]?.[code],
			bus,
		});

		const mouseDetach = attachMouse({
			resolveAction: (code) =>
				code === "Mouse:Move"
					? activeContext === "gameplay"
						? ("game.look" as ActionId)
						: undefined
					: bindings[activeContext]?.[code],
			bus,
			analogLookEnabled: () => activeContext === "gameplay",
		});

		const onPLChange = () =>
			setIsPointerLocked(Boolean(document.pointerLockElement));
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
		const bus = busRef.current;
		if (!bus) return;
		const unsub = bus.subscribe((ev) => {
			if (
				ev.type === "digital" &&
				ev.phase === "pressed" &&
				ev.action === ("ui.toggleMenu" as ActionId)
			) {
				setActiveContext((c) => {
					const next =
						c === "gameplay"
							? ("menu" as InputContextId)
							: ("gameplay" as InputContextId);
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

	const runtimeBus = busRef.current;
	const runtimeState = stateRef.current;
	if (!runtimeBus || !runtimeState) {
		throw new Error("Input runtime not initialised");
	}
	const value: InputRuntime = useMemo(
		() => ({
			bus: runtimeBus,
			state: runtimeState,
			activeContext,
			setContext: setActiveContext,
			requestPointerLock,
			exitPointerLock,
			isPointerLocked,
			bindings,
		}),
		[runtimeBus, runtimeState, activeContext, isPointerLocked, bindings],
	);

	return (
		<InputRuntimeContext.Provider value={value}>
			{children}
		</InputRuntimeContext.Provider>
	);
}
