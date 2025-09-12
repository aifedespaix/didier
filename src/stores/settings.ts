import { create } from "zustand";

export type CastMode = "quick" | "semi-quick" | "classic";

interface SettingsState {
  castMode: CastMode;
  setCastMode: (m: CastMode) => void;
}

const KEY = "didier.settings";

function loadCastMode(): CastMode {
  if (typeof window === "undefined") return "classic";
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return "classic";
    const data = JSON.parse(raw) as Partial<SettingsState> & { version?: number };
    const v = (data as any)?.castMode;
    if (v === "quick" || v === "semi-quick" || v === "classic") return v;
    return "classic";
  } catch {
    return "classic";
  }
}

function saveCastMode(mode: CastMode) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const next = { ...prev, version: 1, castMode: mode };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export const useSettings = create<SettingsState>((set) => ({
  castMode: loadCastMode(),
  setCastMode: (m) => {
    saveCastMode(m);
    set({ castMode: m });
  },
}));

