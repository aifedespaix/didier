"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { Progress } from "@/components/ui/progress";
import { ensureRapierReady, isRapierReady } from "@/systems/loading/boot";

function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function LoaderOverlay({ extraTotal = 0, extraDone = 0, extraLabel }: { extraTotal?: number; extraDone?: number; extraLabel?: string }) {
  const { active, progress, loaded, total, item } = useProgress();
  const [visible, setVisible] = useState<boolean>(false);
  const startRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const [rapierDone, setRapierDone] = useState<boolean>(isRapierReady());
  const [completed, setCompleted] = useState<boolean>(false);

  // Kick Rapier initialization as part of boot and track it as a task
  useEffect(() => {
    if (!rapierDone) {
      ensureRapierReady().finally(() => setRapierDone(true));
    }
  }, [rapierDone]);

  // Track elapsed time while loading is active (combined)
  useEffect(() => {
    const rapierTotal = 1;
    const rapierLoaded = rapierDone ? 1 : 0;
    const combinedTotal = Math.max(1, total + rapierTotal + extraTotal);
    const combinedLoaded = Math.min(combinedTotal, loaded + rapierLoaded + Math.min(extraDone, extraTotal));
    const combinedPct = (combinedLoaded / combinedTotal) * 100;
    const shouldRun = active || combinedPct < 100;
    if (shouldRun) {
      if (startRef.current == null) startRef.current = performance.now();
      const loop = () => {
        if (!startRef.current) return;
        setElapsed((performance.now() - startRef.current) / 1000);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    }
    return undefined;
  }, [rapierDone, active, progress, total, extraTotal, extraDone]);

  // Estimate remaining time based on progress
  const eta = useMemo(() => {
    // Combine three.js items with our boot task(s)
    const rapierTotal = 1; // always count Rapier as one item in total
    const rapierLoaded = rapierDone ? 1 : 0;
    const combinedTotal = Math.max(1, total + rapierTotal + extraTotal);
    const combinedLoaded = Math.min(combinedTotal, loaded + rapierLoaded + Math.min(extraDone, extraTotal));
    const combinedProgress = (combinedLoaded / combinedTotal) * 100;

    const p = Math.min(99.9, Math.max(0.1, combinedProgress));
    const frac = p / 100;
    if (!isFinite(frac) || frac <= 0) return 0;
    const totalSec = elapsed / frac;
    const remain = Math.max(0, totalSec - elapsed);
    return remain;
  }, [elapsed, loaded, total, rapierDone]);

  // Control visibility (mount/unmount) with small delay, considering combined loading
  useEffect(() => {
    const rapierTotal = 1;
    const rapierLoaded = rapierDone ? 1 : 0;
    const combinedTotal = Math.max(1, total + rapierTotal + extraTotal);
    const combinedLoaded = Math.min(combinedTotal, loaded + rapierLoaded + Math.min(extraDone, extraTotal));
    const combinedPct = (combinedLoaded / combinedTotal) * 100;
    const loadingActive = active || combinedPct < 100;
    if (loadingActive) {
      if (!completed) setVisible(true);
      return;
    }
    // mark as completed and fade out then hide
    setCompleted(true);
    const t = setTimeout(() => setVisible(false), 350);
    startRef.current = null;
    setElapsed(0);
    return () => clearTimeout(t);
  }, [rapierDone, active, progress, total, extraTotal, extraDone, completed]);

  // Render nothing when not visible at all
  // Compute combined progress and visibility
  const rapierTotal = 1;
  const rapierLoaded = rapierDone ? 1 : 0;
  const combinedTotal = Math.max(1, total + rapierTotal + extraTotal);
  const combinedLoaded = Math.min(combinedTotal, loaded + rapierLoaded + Math.min(extraDone, extraTotal));
  const combinedPct = (combinedLoaded / combinedTotal) * 100;
  const bootPending = !rapierDone;
  const loadingActive = bootPending || active || combinedPct < 100;
  const show = visible || (!completed && loadingActive);
  if (!show) return null;

  const pct = Math.max(0, Math.min(100, combinedPct));

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 transition-opacity duration-300 ${
        loadingActive && !completed ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="pointer-events-auto mx-4 w-full max-w-[440px] rounded-xl border border-white/10 bg-neutral-900/70 p-5 shadow-2xl backdrop-blur">
        <div className="mb-3 text-center text-sm font-medium tracking-wide text-white/80">
          Chargement…
        </div>
        <Progress value={pct} className="h-3" />
        <div className="mt-3 flex items-center justify-between text-[12px] text-white/70">
          <span>{pct.toFixed(0)}%</span>
          <span>
            {combinedLoaded}/{combinedTotal} fichiers
            {eta > 0 ? ` • reste ${formatTime(eta)}` : ""}
          </span>
        </div>
        <div className="mt-1 truncate text-[11px] text-white/40">
          {(!rapierDone && combinedLoaded <= 1 && !item) ? "Initialisation du moteur physique…" : (extraLabel || item || "")}
        </div>
        <div className="mt-4 text-center text-[11px] text-white/40">
          écoulé {formatTime(elapsed)}
        </div>
      </div>
    </div>
  );
}
