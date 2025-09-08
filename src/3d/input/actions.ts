// Catalogue d'actions et métadonnées
// Action-based; ne référence jamais des touches directement

export type ActionKind = "digital" | "analog";

export type ActionId =
  | "ui.confirm"
  | "ui.cancel"
  | "ui.up"
  | "ui.down"
  | "ui.left"
  | "ui.right"
  | "ui.toggleMenu"
  | "game.move.forward"
  | "game.move.back"
  | "game.move.left"
  | "game.move.right"
  | "game.jump"
  | "game.sprint"
  | "game.primary"
  | "game.secondary"
  | "game.look" // analog delta (dx, dy)
  | "game.pause"
  // Camera controls
  | "camera.follow.toggle"
  | "camera.zoom.in"
  | "camera.zoom.out";

export type ActionDomain = "ui" | "game";

export type InputContextId = "gameplay" | "menu";

export interface ActionDef {
  id: ActionId;
  kind: ActionKind;
  domain: ActionDomain;
  contexts?: InputContextId[]; // où cette action est active
  tags?: string[];
}

export const ACTIONS: Record<ActionId, ActionDef> = {
  "ui.confirm": {
    id: "ui.confirm",
    kind: "digital",
    domain: "ui",
    contexts: ["menu"],
    tags: ["accept"],
  },
  "ui.cancel": {
    id: "ui.cancel",
    kind: "digital",
    domain: "ui",
    contexts: ["menu"],
    tags: ["back"],
  },
  "ui.up": { id: "ui.up", kind: "digital", domain: "ui", contexts: ["menu"] },
  "ui.down": { id: "ui.down", kind: "digital", domain: "ui", contexts: ["menu"] },
  "ui.left": { id: "ui.left", kind: "digital", domain: "ui", contexts: ["menu"] },
  "ui.right": { id: "ui.right", kind: "digital", domain: "ui", contexts: ["menu"] },
  "ui.toggleMenu": {
    id: "ui.toggleMenu",
    kind: "digital",
    domain: "ui",
    contexts: ["gameplay", "menu"],
  },
  "game.move.forward": {
    id: "game.move.forward",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
    tags: ["movement"],
  },
  "game.move.back": {
    id: "game.move.back",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
  },
  "game.move.left": {
    id: "game.move.left",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
  },
  "game.move.right": {
    id: "game.move.right",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
  },
  "game.jump": {
    id: "game.jump",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
  },
  "game.sprint": {
    id: "game.sprint",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
  },
  "game.primary": {
    id: "game.primary",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
  },
  "game.secondary": {
    id: "game.secondary",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
  },
  "game.look": {
    id: "game.look",
    kind: "analog",
    domain: "game",
    contexts: ["gameplay"],
    tags: ["camera"],
  },
  "game.pause": {
    id: "game.pause",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
  },
  // Camera controls
  "camera.follow.toggle": {
    id: "camera.follow.toggle",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
    tags: ["camera"],
  },
  "camera.zoom.in": {
    id: "camera.zoom.in",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
    tags: ["camera"],
  },
  "camera.zoom.out": {
    id: "camera.zoom.out",
    kind: "digital",
    domain: "game",
    contexts: ["gameplay"],
    tags: ["camera"],
  },
};

export const ALL_ACTION_IDS = Object.keys(ACTIONS) as ActionId[];
