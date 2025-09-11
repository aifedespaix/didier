import { Character } from "@/systems/character/Character";
import type { CharacterProps } from "@/systems/character/types";

export function buildDefaultCharacter(): Character {
  const props: CharacterProps = {
    speed: 4, // m/s
    dash: {
      speed: 10, // m/s (faster than run)
      durationMs: 520,
    },
    skin: {
      modelPath: "/character.glb",
      fitHeight: 1.8,
      scale: 1.05, // subtle +5% visual only
    },
  };
  return new Character(props);
}

