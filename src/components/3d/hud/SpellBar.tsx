"use client";
import { useEffect, useMemo, useState } from "react";
import { ZapIcon } from "lucide-react";
import { useCharacterUI } from "@/stores/character-ui";
import { useInputRuntime } from "@/3d/input/hooks";

function formatKeyLabel(code: string | undefined): string | null {
  if (!code) return null;
  // Code examples: "Key:KeyE", "Mouse:Left"
  const parts = code.split(":");
  if (parts[0] === "Key" && parts[1]?.startsWith("Key")) return parts[1].slice(3);
  if (parts[0] === "Mouse") return parts[1] || "Mouse";
  return parts[1] || parts[0] || code;
}

function useFirstKeyForAction(action: string): string | null {
  const { bindings, activeContext } = useInputRuntime();
  return useMemo(() => {
    const profile = bindings[activeContext] || {};
    // Find first key that maps to this action
    for (const [code, act] of Object.entries(profile)) {
      if (act === action) return formatKeyLabel(code);
    }
    return null;
  }, [bindings, activeContext, action]);
}

function CooldownOverlay({ readyAt }: { readyAt?: number }) {
  const [now, setNow] = useState<number>(() => performance.now());
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(id);
  }, []);
  if (!readyAt) return null;
  const remain = Math.max(0, readyAt - now);
  if (remain <= 0) return null;
  const seconds = Math.ceil(remain / 100) / 10; // tenths
  return (
    <div className="absolute inset-0 rounded-lg bg-black/60 grid place-items-center">
      <span className="text-white text-sm font-medium">{seconds.toFixed(1)}s</span>
    </div>
  );
}

export function SpellBar() {
  const keyPrimary = useFirstKeyForAction("game.spell.1");
  const keyE = useFirstKeyForAction("game.dash");
  const cooldowns = useCharacterUI((s) => s.cooldownReadyAt);
  const readyAtPrimary = cooldowns["primary"];
  const readyAtDash = cooldowns["dash"];

  const Slot = ({ label, readyAt, title, icon, tooltip }: { label: string | null; readyAt?: number; title: string; icon?: React.ReactNode; tooltip?: string }) => (
    <div className="relative w-12 h-12 rounded-lg bg-white/10 border border-white/15 shadow-inner overflow-hidden" title={tooltip ?? title}>
      <CooldownOverlay readyAt={readyAt} />
      <div className="absolute top-1 left-1 text-[10px] px-1 py-0.5 rounded bg-black/60 text-white">
        {label ?? "-"}
      </div>
      {icon && (
        <div className="absolute inset-0 grid place-items-center opacity-90">
          {icon}
        </div>
      )}
      {!icon && (
        <div className="absolute bottom-1 left-1 right-1 text-center text-[11px] opacity-80 truncate">
          {title}
        </div>
      )}
    </div>
  );

  return (
    <div className="pointer-events-none fixed left-1/2 bottom-4 -translate-x-1/2 flex items-center gap-2">
      <Slot label={keyPrimary} title="Magic" readyAt={readyAtPrimary} tooltip={`Spell #1 (${keyPrimary ?? "A/Q"})`} />
      <Slot label={null} title="W" tooltip="Secondary (W)" />
      <Slot label={keyE} title="Dash" readyAt={readyAtDash} tooltip={`Dash (${keyE ?? "E"})`} icon={<ZapIcon className="text-amber-300" />} />
      <Slot label={null} title="R" tooltip="Ultimate (R)" />
    </div>
  );
}

export default SpellBar;
