import type { ActionId, InputContextId } from "./actions";

// Namespace KeyCodes
// Keyboard: Key:<KeyboardEvent.code>
// Mouse: Mouse:<Left|Right|Middle|WheelUp|WheelDown|Move>
// Gamepad (plus tard): Pad:BtnSouth, Pad:AxisLX, ...
export type KeyCode = string;

export type BindingProfile = Record<KeyCode, ActionId>;

export type ContextBindings = Record<InputContextId, BindingProfile>;

export type KeyboardLayout = "qwerty" | "azerty";

// Defaults (Many->One OK, One->One inverse validé au runtime)
export function buildDefaultBindings(layout: KeyboardLayout): ContextBindings {
	const gameplay: BindingProfile = {
		"Key:ArrowUp": "game.move.forward",
		"Key:ArrowDown": "game.move.back",
		"Key:ArrowLeft": "game.move.left",
		"Key:ArrowRight": "game.move.right",
		"Key:Space": "game.jump",
		"Key:ShiftLeft": "game.sprint",
		"Key:ShiftRight": "game.sprint",
		"Mouse:Left": "game.fire",
		"Mouse:Right": "game.toggleTorch",
		"Key:KeyE": "game.dash",
		// Pause/Menu
		"Key:Escape": "ui.toggleMenu",
		// Camera controls
		"Key:KeyL": "camera.follow.toggle",
		"Mouse:WheelUp": "camera.zoom.in",
		"Mouse:WheelDown": "camera.zoom.out",
	};

	if (layout === "azerty") {
		gameplay["Key:KeyZ"] = "game.move.forward";
		gameplay["Key:KeyS"] = "game.move.back";
		gameplay["Key:KeyQ"] = "game.move.left";
		gameplay["Key:KeyD"] = "game.move.right";
		gameplay["Key:KeyA"] = "game.spell.1";
	} else {
		gameplay["Key:KeyW"] = "game.move.forward";
		gameplay["Key:KeyS"] = "game.move.back";
		gameplay["Key:KeyA"] = "game.move.left";
		gameplay["Key:KeyD"] = "game.move.right";
		gameplay["Key:KeyQ"] = "game.spell.1";
	}

	const menu: BindingProfile = {
		// Navigation UI
		"Key:Enter": "ui.confirm",
		"Key:NumpadEnter": "ui.confirm",
		"Mouse:Left": "ui.confirm",
		"Key:Escape": "ui.cancel",
		"Mouse:Right": "ui.cancel",
		"Key:ArrowUp": "ui.up",
		"Key:ArrowDown": "ui.down",
		"Key:ArrowLeft": "ui.left",
		"Key:ArrowRight": "ui.right",
		"Mouse:WheelUp": "ui.up",
		"Mouse:WheelDown": "ui.down",
		// Allow toggling follow camera from menu too (handy)
		"Key:KeyL": "camera.follow.toggle",
	};

	return { gameplay, menu };
}

export const DEFAULT_BINDINGS = buildDefaultBindings("qwerty");

export interface ValidationIssue {
	key: KeyCode;
	actions: ActionId[]; // >1 si conflit
}

export function validateOneToOne(profile: BindingProfile): ValidationIssue[] {
	const map = new Map<KeyCode, Set<ActionId>>();
	for (const [key, action] of Object.entries(profile)) {
		if (!map.has(key)) map.set(key, new Set());
		map.get(key)?.add(action);
	}
	const issues: ValidationIssue[] = [];
	for (const [key, set] of map) {
		if (set.size > 1) {
			issues.push({ key, actions: Array.from(set) });
		}
	}
	return issues;
}

export function mergeBindings(
	base: ContextBindings,
	overrides?: Partial<ContextBindings>,
): ContextBindings {
	const out: ContextBindings = { gameplay: {}, menu: {} } as ContextBindings;
	for (const ctx of Object.keys(out) as InputContextId[]) {
		out[ctx] = { ...(base[ctx] || {}), ...(overrides?.[ctx] || {}) };
	}
	return out;
}
