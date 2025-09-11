import { create } from "zustand";

export type SpellIdUI = "dash" | "q" | "w" | "e" | "r";

interface CharacterUIState {
  hpCurrent: number;
  hpMax: number;
  cooldownReadyAt: Partial<Record<SpellIdUI | string, number>>; // ms epoch
  setHp: (current: number, max?: number) => void;
  setCooldownUntil: (id: SpellIdUI | string, readyAtMs: number) => void;
}

export const useCharacterUI = create<CharacterUIState>((set) => ({
  hpCurrent: 100,
  hpMax: 100,
  cooldownReadyAt: {},
  setHp: (current, max) => set((s) => ({ hpCurrent: Math.max(0, Math.floor(current)), hpMax: Math.max(1, Math.floor(max ?? s.hpMax)) })),
  setCooldownUntil: (id, readyAtMs) => set((s) => ({ cooldownReadyAt: { ...s.cooldownReadyAt, [id]: readyAtMs } })),
}));

