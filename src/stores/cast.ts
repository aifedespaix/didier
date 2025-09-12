import { create } from "zustand";

type Phase = "idle" | "preview" | "armed";

interface CastTransientState {
  phase: Phase;
  // Whether preview should be visible (semi-quick during key hold, classic while aiming)
  previewVisible: boolean;
  // Internal flag to track if current input is cancelled (semi-quick)
  cancelled: boolean;
  setPhase: (p: Phase) => void;
  showPreview: () => void;
  hidePreview: () => void;
  markCancelled: (v: boolean) => void;
  reset: () => void;
}

export const useCastTransient = create<CastTransientState>((set) => ({
  phase: "idle",
  previewVisible: false,
  cancelled: false,
  setPhase: (p) => set({ phase: p }),
  showPreview: () => set({ previewVisible: true }),
  hidePreview: () => set({ previewVisible: false }),
  markCancelled: (v) => set({ cancelled: v }),
  reset: () => set({ phase: "idle", previewVisible: false, cancelled: false }),
}));

