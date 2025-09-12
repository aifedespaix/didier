import { create } from "zustand";
import type { ActionId } from "@/3d/input/actions";

type Phase = "idle" | "preview" | "armed";

interface CastTransientState {
  phase: Phase;
  // Whether preview should be visible (semi-quick during key hold, classic while aiming)
  previewVisible: boolean;
  // Internal flag to track if current input is cancelled (semi-quick)
  cancelled: boolean;
  // Which action is currently previewed/armed (e.g., "game.spell.1" or "game.dash")
  armedAction: ActionId | null;
  setPhase: (p: Phase) => void;
  showPreview: () => void;
  hidePreview: () => void;
  markCancelled: (v: boolean) => void;
  setArmedAction: (a: ActionId | null) => void;
  reset: () => void;
}

export const useCastTransient = create<CastTransientState>((set) => ({
  phase: "idle",
  previewVisible: false,
  cancelled: false,
  armedAction: null,
  setPhase: (p) => set({ phase: p }),
  showPreview: () => set({ previewVisible: true }),
  hidePreview: () => set({ previewVisible: false }),
  markCancelled: (v) => set({ cancelled: v }),
  setArmedAction: (a) => set({ armedAction: a }),
  reset: () => set({ phase: "idle", previewVisible: false, cancelled: false, armedAction: null }),
}));
