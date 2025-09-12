import { Character } from "@/systems/character/Character";
import type { CharacterProps } from "@/systems/character/types";

export function buildDefaultCharacter(): Character {
  const baseSpeed = 4.8; // m/s run speed (increased by +20%)
  const props: CharacterProps = {
    speed: baseSpeed,
    dash: {
      // Dash is 2.5x run speed by design
      speed: baseSpeed * 2.5,
      durationMs: 520,
    },
    skin: {
      modelPath: "/character.glb",
      fitHeight: 1.8,
      scale: 1.15, // +15% visuel (demande)
    },
  };
  return new Character(props);
}
