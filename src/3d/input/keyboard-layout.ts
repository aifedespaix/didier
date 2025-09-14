import type { KeyboardLayout } from "./bindings";

/** Storage key used to persist the detected layout across sessions. */
const STORAGE_KEY = "didier.keyboardLayout";

/**
 * Synchronously detects the user's keyboard layout.
 *
 * The function first attempts to read a previously resolved layout from
 * `localStorage`. If none is found, a heuristic based on the browser's
 * language is applied. The detection intentionally avoids async APIs so it
 * can run during React's initial render phase.
 */
export function detectKeyboardLayout(): KeyboardLayout {
	if (typeof window !== "undefined") {
		try {
			const stored = window.localStorage.getItem(STORAGE_KEY);
			if (stored === "azerty" || stored === "qwerty") {
				return stored;
			}
		} catch {
			// ignore storage errors (e.g., private mode)
		}

		const lang = window.navigator.language.toLowerCase();
		if (lang.startsWith("fr")) {
			return "azerty";
		}
	}

	return "qwerty";
}

/**
 * Resolves the keyboard layout using the Keyboard Layout Map API when
 * available. The resolved layout is persisted in `localStorage` so subsequent
 * synchronous calls to {@link detectKeyboardLayout} can reuse it.
 */
export async function resolveLayoutAsync(): Promise<KeyboardLayout> {
	let layout: KeyboardLayout = "qwerty";

	try {
		const nav = window.navigator as Navigator & {
			keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> };
		};
		const map = await nav.keyboard?.getLayoutMap?.();

		const keyQ = map?.get("KeyQ")?.toLowerCase();
		const keyW = map?.get("KeyW")?.toLowerCase();

		// On azerty keyboards, physical KeyQ produces "a" and KeyW produces "z".
		if (keyQ === "a" || keyW === "z") {
			layout = "azerty";
		}
	} catch {
		// Swallow errors and fall back to heuristic detection.
		layout = detectKeyboardLayout();
	}

	try {
		window.localStorage.setItem(STORAGE_KEY, layout);
	} catch {
		// ignore persistence errors
	}

	return layout;
}
