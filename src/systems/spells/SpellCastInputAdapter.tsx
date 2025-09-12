"use client";
import { useEffect, useRef } from "react";
import { useActionEvents } from "@/3d/input/hooks";
import { useSettings } from "@/stores/settings";
import { useCastTransient } from "@/stores/cast";

export interface SpellCastInputAdapterProps {
  /** Called when we should perform the primary spell cast (spawn, network, etc.) */
  onPerformCast: () => void;
  /** Optional: called to play cast animation/lock movement on the player */
  onPerformCastAnim?: () => void;
}

export function SpellCastInputAdapter({ onPerformCast, onPerformCastAnim }: SpellCastInputAdapterProps) {
  const mode = useSettings((s) => s.castMode);
  const { phase, setPhase, previewVisible, showPreview, hidePreview, cancelled, markCancelled, reset } = useCastTransient();
  const aimingRef = useRef(false);

  // Helper to fully cleanup any transient state
  const cleanup = () => {
    aimingRef.current = false;
    hidePreview();
    setPhase("idle");
    markCancelled(false);
  };

  // If mode changes while in preview/aiming, cleanup
  useEffect(() => {
    if (phase !== "idle" || previewVisible) cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Global blur/pause safety: always cleanup any transient state
  useEffect(() => {
    const onBlur = () => {
      if (phase !== "idle" || previewVisible || aimingRef.current) cleanup();
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [phase, previewVisible]);

  // Escape cancels armed/preview states
  useActionEvents("ui.toggleMenu", (ev) => {
    if (ev.type !== "digital" || ev.phase !== "pressed") return;
    if (phase !== "idle" || aimingRef.current || previewVisible) {
      cleanup();
    }
  });

  // Primary spell key events
  useActionEvents("game.spell.1", (ev) => {
    if (ev.type !== "digital") return;
    if (mode === "quick") {
      if (ev.phase === "pressed") {
        try { onPerformCastAnim?.(); } catch {}
        try { onPerformCast(); } catch {}
      }
      return;
    }
    if (mode === "semi-quick") {
      if (ev.phase === "pressed") {
        showPreview();
        setPhase("preview");
        markCancelled(false);
      } else if (ev.phase === "released") {
        const wasCancelled = cancelled;
        cleanup();
        if (!wasCancelled) {
          try { onPerformCastAnim?.(); } catch {}
          try { onPerformCast(); } catch {}
        }
      }
      return;
    }
    // classic
    if (ev.phase === "pressed") {
      aimingRef.current = true;
      showPreview();
      setPhase("armed");
    }
  });

  // In classic mode, LMB confirms, RMB cancels while aiming
  useActionEvents("game.attack", (ev) => {
    if (mode !== "classic") return;
    if (ev.type !== "digital" || ev.phase !== "pressed") return;
    if (!aimingRef.current) return;
    cleanup();
    try { onPerformCastAnim?.(); } catch {}
    try { onPerformCast(); } catch {}
  });

  // Capture RMB at the window level to cancel during aiming (and prevent move orders)
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (mode !== "classic") return;
      if (!aimingRef.current) return;
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true } as any);
    return () => window.removeEventListener("pointerdown", onPointerDown, { capture: true } as any);
  }, [mode]);

  // In semi-quick, right-click or losing focus should cancel while holding
  useEffect(() => {
    if (mode !== "semi-quick") return;
    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2 && phase === "preview") {
        e.preventDefault();
        e.stopPropagation();
        markCancelled(true);
        hidePreview();
        setPhase("idle");
      }
    };
    const onBlur = () => {
      if (phase === "preview") {
        markCancelled(true);
        hidePreview();
        setPhase("idle");
      }
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true } as any);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true } as any);
      window.removeEventListener("blur", onBlur);
    };
  }, [mode, phase, hidePreview, setPhase, markCancelled]);

  return null;
}

export default SpellCastInputAdapter;
