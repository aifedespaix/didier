import { create } from "zustand";

type AimState = {
  point: [number, number, number] | null;
  setPoint: (p: [number, number, number] | null) => void;
};

export const useAim = create<AimState>()((set) => ({
  point: null,
  setPoint: (p) => set({ point: p }),
}));

