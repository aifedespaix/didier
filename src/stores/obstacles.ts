import { create } from "zustand";
import { OBSTACLE_ITEMS } from "@/components/3d/props/obstacle-config";

export type ObstacleState = {
  id: string;
  hp: number;
};

interface ObstaclesStore {
  obstacles: ObstacleState[];
  setHp: (id: string, hp: number) => void;
  applyDamage: (id: string, amount: number) => number; // returns new hp
  reset: () => void;
}

export const useObstacles = create<ObstaclesStore>((set, get) => ({
  obstacles: OBSTACLE_ITEMS.map((o) => ({ id: o.id, hp: 100 })),
  setHp: (id, hp) =>
    set((s) => ({ obstacles: s.obstacles.map((o) => (o.id === id ? { ...o, hp: Math.max(0, Math.floor(hp)) } : o)) })),
  applyDamage: (id, amount) => {
    const s = get();
    const cur = s.obstacles.find((o) => o.id === id)?.hp ?? 0;
    const next = Math.max(0, cur - Math.max(0, Math.floor(amount)));
    s.setHp(id, next);
    return next;
  },
  reset: () => set({ obstacles: OBSTACLE_ITEMS.map((o) => ({ id: o.id, hp: 100 })) }),
}));

