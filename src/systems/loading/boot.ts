// Simple boot helpers to preload heavy subsystems (e.g., Rapier WASM)
let rapierPromise: Promise<void> | null = null;
let rapierReady = false;

export function ensureRapierReady() {
  if (rapierReady) return Promise.resolve();
  if (!rapierPromise) {
    rapierPromise = import("@dimforge/rapier3d-compat").then(async (RAPIER: any) => {
      if (RAPIER && typeof RAPIER.init === "function") {
        await RAPIER.init();
      }
      rapierReady = true;
    });
  }
  return rapierPromise;
}

export function isRapierReady() {
  return rapierReady;
}

