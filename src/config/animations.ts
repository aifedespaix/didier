import type { AnimClipHints } from "@/types/animation";

// Customize these if your GLB uses specific names
// E.g., { run: ["locomotion_run", "fast_run"], idle: ["idle_01"] }
export const CHARACTER_CLIP_HINTS: AnimClipHints = {
  // Provide explicit synonyms to improve auto-mapping
  // User-provided set: prefer "idle" for neutral, and "fast_run" for locomotion
  idle: ["idle"],
  walk: ["walk", "slow"],
  // Force selection of the specific running clip
  run: ["fast_run"],
  jump: ["jump"],
  // Map dash to the provided running slide clip
  dash: ["running_slide"],
  // Helpful mappings for provided set (optional):
  //   standing_2h_cast_spell_01 -> cast
  //   standing_1h_magic_attack_01 -> attack
  cast: ["standing_2h_cast_spell_01", "cast", "spell"],
  attack: ["standing_1h_magic_attack_01", "attack", "slash", "shoot", "punch", "kick"],
  hit: ["hit", "hurt", "impact"],
  death: ["death", "die"],
};
