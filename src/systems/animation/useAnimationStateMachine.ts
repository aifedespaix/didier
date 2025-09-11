"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AnimationAction, AnimationClip } from "three";
import type { AnimClipHints, AnimClipMap, AnimStateId, AnimationTransitionConfig, OneShotConfig } from "@/types/animation";

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function deriveClipMapFromClips(
  clips: AnimationClip[],
  hints?: AnimClipHints,
): AnimClipMap {
  const map: AnimClipMap = {};
  const names = clips.map((c) => c.name);
  const norm = names.map(normalizeName);

  const defaultHints: AnimClipHints = {
    idle: ["idle", "stand"],
    walk: ["walk"],
    run: ["run", "sprint"],
    jump: ["jump"],
    dash: ["dash"],
    cast: ["cast", "spell"],
    attack: ["attack", "slash", "shoot", "punch", "kick"],
    hit: ["hit", "hurt", "impact"],
    death: ["death", "die"],
  };

  const H = { ...defaultHints, ...(hints ?? {}) };

  // Soft exclusions to avoid common mis-matches
  // e.g., prevent picking "dash" for run, or "cast attack" for idle
  const EXCLUDE: Partial<Record<AnimStateId, string[]>> = {
    idle: ["cast", "attack", "dash", "jump", "hit", "death"],
    run: ["dash", "cast"],
  };

  (Object.keys(H) as AnimStateId[]).forEach((state) => {
    const patterns = H[state];
    if (!patterns) return;
    const exclude = EXCLUDE[state] ?? [];

    // First pass: respect exclusions
    for (let i = 0; i < norm.length; i++) {
      if (exclude.length && exclude.some((e) => norm[i].includes(e))) continue;
      if (patterns.some((p) => norm[i].includes(p))) {
        map[state] = names[i];
        return;
      }
    }

    // Second pass: if nothing found, fallback without exclusions
    for (let i = 0; i < norm.length; i++) {
      if (patterns.some((p) => norm[i].includes(p))) {
        map[state] = names[i];
        return;
      }
    }
  });
  return map;
}

export interface AnimationStateMachineOptions {
  clips: AnimationClip[];
  actions: Record<string, AnimationAction | undefined>;
  hints?: AnimClipHints;
  transitions?: Partial<Record<AnimStateId, AnimationTransitionConfig>>;
  oneShots?: OneShotConfig;
}

export function useAnimationStateMachine({
  clips,
  actions,
  hints,
  transitions,
  oneShots,
}: AnimationStateMachineOptions) {
  const clipMap = useMemo(() => deriveClipMapFromClips(clips, hints), [clips, hints]);
  const [state, setState] = useState<AnimStateId | null>(null);
  const prevState = useRef<AnimStateId | null>(null);
  const oneshotTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (oneshotTimer.current !== null) {
        window.clearTimeout(oneshotTimer.current);
      }
    };
  }, []);

  const play = (next: AnimStateId) => {
    const current = state;
    if (current === next) {
      const cfg = transitions?.[next];
      if (!cfg || cfg.reenterSameState !== true) return; // no re-trigger
    }

    const nextClipName = clipMap[next];
    if (!nextClipName) {
      // No clip mapped; stop current if any
      if (current) {
        const a = current ? actions[clipMap[current] ?? ""] : undefined;
        a?.fadeOut(0.15);
        a?.stop();
      }
      prevState.current = state;
      setState(next);
      return;
    }

    const nextAction = actions[nextClipName];
    if (!nextAction) return;

    const fade = transitions?.[next]?.fade ?? 0.2;

    // fade out previous
    if (current) {
      const prevClipName = clipMap[current];
      const prevAction = prevClipName ? actions[prevClipName] : undefined;
      prevAction?.crossFadeTo(nextAction, fade, false);
    }

    nextAction.reset().fadeIn(fade).play();

    // handle one-shots
    const one = oneShots?.[next];
    if (one) {
      const length = nextAction.getClip().duration;
      const nextFade = one.fade ?? 0.15;
      if (oneshotTimer.current !== null) window.clearTimeout(oneshotTimer.current);
      oneshotTimer.current = window.setTimeout(() => {
        const backTo = one.next;
        const backClipName = clipMap[backTo];
        if (backClipName) {
          const backAction = actions[backClipName];
          if (backAction) {
            nextAction.crossFadeTo(backAction, nextFade, false);
            backAction.reset().fadeIn(nextFade).play();
            prevState.current = next;
            setState(backTo);
            return;
          }
        }
        // if fallback missing, just fade out
        nextAction.fadeOut(nextFade);
        prevState.current = next;
        setState(backTo);
      }, Math.max(0, (length - nextFade) * 1000));
    }

    prevState.current = state;
    setState(next);
  };

  return {
    state,
    clipMap,
    play,
  } as const;
}

export function locomotionFromSpeed(speed: number) {
  if (speed < 0.1) return "idle" as const;
  if (speed < 2.2) return "walk" as const; // low speeds -> walk
  return "run" as const;
}
