"use client";
import { useMemo } from "react";
import { useCharacterUI } from "@/stores/character-ui";

export function HealthBar() {
  const cur = useCharacterUI((s) => s.hpCurrent);
  const max = useCharacterUI((s) => s.hpMax);
  const pct = useMemo(() => Math.max(0, Math.min(1, cur / Math.max(1, max))), [cur, max]);
  return (
    <div className="fixed left-4 bottom-4 w-64 select-none">
      <div className="text-xs font-medium opacity-80 mb-1">HP</div>
      <div className="w-full h-3 rounded bg-white/10 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="text-xs mt-1 opacity-80">
        {cur} / {max}
      </div>
    </div>
  );
}

export default HealthBar;

