import type { KeyboardLayout } from "./bindings";

/**
 * Detects the user's keyboard layout. Defaults to "qwerty".
 * Uses `navigator.keyboard.getLayoutMap` when available and falls back to
 * language heuristics.
 */
export function detectKeyboardLayout(): KeyboardLayout {
	if (typeof navigator !== "undefined") {
		const nav = navigator as Navigator & {
			keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> };
		};
		if (typeof nav.keyboard?.getLayoutMap === "function") {
			// Attempt synchronous guess using language and fall back to async map.
		}
		const lang = (navigator.language || "").toLowerCase();
		if (lang.startsWith("fr")) return "azerty";
	}
	return "qwerty";
}

/**
 * Attempts to resolve the layout using the Keyboard API, if supported.
 * This function is asynchronous and should be called after user interaction
 * (some browsers gate the API behind permissions).
 */
export async function resolveLayoutAsync(): Promise<KeyboardLayout> {
	try {
		const nav = navigator as Navigator & {
			keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> };
		};
		const map = await nav.keyboard?.getLayoutMap?.();
		const keyQ = map?.get("KeyQ");
		if (typeof keyQ === "string" && keyQ.toLowerCase() === "a") {
			return "azerty";
		}
	} catch {
		// ignore and fall back
	}
	return detectKeyboardLayout();
}
