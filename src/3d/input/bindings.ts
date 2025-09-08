import type { ActionId, InputContextId } from "./actions";

// Namespace KeyCodes
// Keyboard: Key:<KeyboardEvent.code>
// Mouse: Mouse:<Left|Right|Middle|WheelUp|WheelDown|Move>
// Gamepad (plus tard): Pad:BtnSouth, Pad:AxisLX, ...
export type KeyCode = string;

export type BindingProfile = Record<KeyCode, ActionId>;

export type ContextBindings = Record<InputContextId, BindingProfile>;

// Defaults (Many->One OK, One->One inverse validé au runtime)
export const DEFAULT_BINDINGS: ContextBindings = {
  gameplay: {
    // Mouvement (AZERTY+QWERTY amicaux)
    "Key:KeyW": "game.move.forward",
    "Key:KeyZ": "game.move.forward",
    "Key:ArrowUp": "game.move.forward",
    "Key:KeyS": "game.move.back",
    "Key:ArrowDown": "game.move.back",
    "Key:KeyA": "game.move.left", // QWERTY
    "Key:KeyQ": "game.move.left", // AZERTY
    "Key:ArrowLeft": "game.move.left",
    "Key:KeyD": "game.move.right",
    "Key:ArrowRight": "game.move.right",
    "Key:Space": "game.jump",
    "Key:ShiftLeft": "game.sprint",
    "Key:ShiftRight": "game.sprint",

    // Actions
    "Mouse:Left": "game.primary",
    "Mouse:Right": "game.secondary",

    // Mouselook analog -> action game.look (résolu via Mouse:Move côté device)
    // Note: l'entrée analogique n'a pas besoin d'une entrée explicite ici,
    // elle est routée par le device en fonction du contexte actif.

    // Pause/Menu
    "Key:Escape": "ui.toggleMenu",
  },
  menu: {
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
  },
};

export interface ValidationIssue {
  key: KeyCode;
  actions: ActionId[]; // >1 si conflit
}

export function validateOneToOne(profile: BindingProfile): ValidationIssue[] {
  const map = new Map<KeyCode, Set<ActionId>>();
  for (const [key, action] of Object.entries(profile)) {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(action);
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

