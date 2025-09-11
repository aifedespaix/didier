import type { AnimClipHints } from "@/types/animation";

// Customize these if your GLB uses specific names
// E.g., { run: ["locomotion_run", "fast_run"], idle: ["idle_01"] }
export const CHARACTER_CLIP_HINTS: AnimClipHints = {
  // Provide explicit synonyms to improve auto-mapping
  idle: ["idle", "stand", "breath", "breathe", "relax", "wait"],
  walk: ["walk", "slow"],
  run: ["run", "sprint", "jog"],
  jump: ["jump"],
  dash: ["dash"],
  cast: ["cast", "spell"],
  attack: ["attack", "slash", "shoot", "punch", "kick"],
  hit: ["hit", "hurt", "impact"],
  death: ["death", "die"],
};
