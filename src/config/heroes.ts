import { Character } from "@/systems/character/Character";
import type { CharacterProps } from "@/systems/character/types";

export type HeroId = "mage" | "warrior" | "archer";

export const HERO_DEFS: Record<HeroId, CharacterProps> = {
  mage: {
    speed: 4,
    dash: { speed: 10, durationMs: 520 },
    skin: { modelPath: "/character.glb", fitHeight: 1.8, scale: 1.05 },
  },
  warrior: {
    speed: 3.6,
    dash: { speed: 9, durationMs: 480 },
    skin: { modelPath: "/character.glb", fitHeight: 1.9, scale: 1.0 },
  },
  archer: {
    speed: 4.2,
    dash: { speed: 10.5, durationMs: 520 },
    skin: { modelPath: "/character.glb", fitHeight: 1.75, scale: 1.0 },
  },
};

export function buildCharacterFromHero(id: HeroId): Character {
  return new Character(HERO_DEFS[id]);
}

