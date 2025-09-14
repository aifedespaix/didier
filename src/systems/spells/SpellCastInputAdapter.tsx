"use client";
import { useEffect, useRef } from "react";
import { useActionEvents } from "@/3d/input/hooks";
import type { ActionEvent } from "@/3d/input/input-bus";
import { useSettings } from "@/stores/settings";
import { useCastTransient } from "@/stores/cast";
import type { ActionId } from "@/3d/input/actions";

export interface SpellCastInputAdapterProps {
	// Primary spell (e.g., Magic)
	onPerformCast: () => void;
	onPerformCastAnim?: () => void;
	// Dash ability should follow the same cast mode semantics
	onPerformDash: () => void;
	onPerformDashAnim?: () => void;
}

export function SpellCastInputAdapter({
	onPerformCast,
	onPerformCastAnim,
	onPerformDash,
	onPerformDashAnim,
}: SpellCastInputAdapterProps) {
	const mode = useSettings((s) => s.castMode);
	const {
		phase,
		setPhase,
		previewVisible,
		showPreview,
		hidePreview,
		cancelled,
		markCancelled,
		setArmedAction,
	} = useCastTransient();
	const aimingRef = useRef(false);
	const armedActionRef = useRef<ActionId | null>(null);

	// Helper to fully cleanup any transient state
	const cleanup = () => {
		aimingRef.current = false;
		armedActionRef.current = null;
		hidePreview();
		setPhase("idle");
		markCancelled(false);
		setArmedAction(null);
	};

	// If mode changes while in preview/aiming, cleanup
	useEffect(() => {
		if (phase !== "idle" || previewVisible) cleanup();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, phase, previewVisible, cleanup]);

	// Global blur/pause safety: always cleanup any transient state
	useEffect(() => {
		const onBlur = () => {
			if (phase !== "idle" || previewVisible || aimingRef.current) cleanup();
		};
		window.addEventListener("blur", onBlur);
		return () => window.removeEventListener("blur", onBlur);
	}, [phase, previewVisible, cleanup]);

	// Escape cancels armed/preview states
	useActionEvents("ui.toggleMenu", (ev) => {
		if (ev.type !== "digital" || ev.phase !== "pressed") return;
		if (phase !== "idle" || aimingRef.current || previewVisible) {
			cleanup();
		}
	});

	// Generic handler factory for ability actions
	function handleAbility(
		actionId: ActionId,
		onAnim: (() => void) | undefined,
		onPerform: () => void,
	) {
		return (ev: ActionEvent) => {
			if (ev.type !== "digital") return;
			if (mode === "quick") {
				if (ev.phase === "pressed") {
					setArmedAction(actionId);
					try {
						onAnim?.();
					} catch {}
					try {
						onPerform();
					} catch {}
				}
				return;
			}
			if (mode === "semi-quick") {
				if (ev.phase === "pressed") {
					setArmedAction(actionId);
					showPreview();
					setPhase("preview");
					markCancelled(false);
				} else if (ev.phase === "released") {
					const wasCancelled = cancelled;
					cleanup();
					if (!wasCancelled) {
						try {
							onAnim?.();
						} catch {}
						try {
							onPerform();
						} catch {}
					}
				}
				return;
			}
			// classic
			if (ev.phase === "pressed") {
				aimingRef.current = true;
				armedActionRef.current = actionId;
				setArmedAction(actionId);
				showPreview();
				setPhase("armed");
			}
		};
	}

	// Primary spell key events
	useActionEvents(
		"game.spell.1",
		handleAbility("game.spell.1", onPerformCastAnim, onPerformCast),
	);

	// Dash ability should be handled under the same cast semantics
	useActionEvents(
		"game.dash",
		handleAbility("game.dash", onPerformDashAnim, onPerformDash),
	);

	// In classic mode, LMB confirms, RMB cancels while aiming
	useActionEvents("game.fire", (ev) => {
		if (mode !== "classic") return;
		if (ev.type !== "digital" || ev.phase !== "pressed") return;
		if (!aimingRef.current) return;
		const armed = armedActionRef.current;
		cleanup();
		if (armed === "game.spell.1") {
			try {
				onPerformCastAnim?.();
			} catch {}
			try {
				onPerformCast();
			} catch {}
		} else if (armed === "game.dash") {
			try {
				onPerformDashAnim?.();
			} catch {}
			try {
				onPerformDash();
			} catch {}
		}
	});

	// Capture RMB at the window level to cancel during aiming (and prevent move orders)
	useEffect(() => {
		const onPointerDown = (e: PointerEvent) => {
			if (mode !== "classic") return;
			if (!aimingRef.current) return;
			if (e.button === 2) {
				e.preventDefault();
				e.stopPropagation();
				cleanup();
			}
		};
		window.addEventListener("pointerdown", onPointerDown, { capture: true });
		return () =>
			window.removeEventListener("pointerdown", onPointerDown, {
				capture: true,
			});
	}, [mode, cleanup]);

	// In semi-quick, right-click or losing focus should cancel while holding
	useEffect(() => {
		if (mode !== "semi-quick") return;
		const onPointerDown = (e: PointerEvent) => {
			if (e.button === 2 && phase === "preview") {
				e.preventDefault();
				e.stopPropagation();
				markCancelled(true);
				hidePreview();
				setPhase("idle");
			}
		};
		const onBlur = () => {
			if (phase === "preview") {
				markCancelled(true);
				hidePreview();
				setPhase("idle");
			}
		};
		window.addEventListener("pointerdown", onPointerDown, { capture: true });
		window.addEventListener("blur", onBlur);
		return () => {
			window.removeEventListener("pointerdown", onPointerDown, {
				capture: true,
			});
			window.removeEventListener("blur", onBlur);
		};
	}, [mode, phase, hidePreview, setPhase, markCancelled]);

	return null;
}

export default SpellCastInputAdapter;
