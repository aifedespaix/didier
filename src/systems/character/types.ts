export interface CharacterSkin {
  /** Path to the GLB/GLTF file for the character visual. */
  modelPath: string;
  /** Target visual height in meters before applying `scale`. */
  fitHeight: number;
  /** Additional multiplier on top of `fitHeight`-based scaling. */
  scale: number;
}

export interface DashConfig {
  /** Dash maximum horizontal speed in m/s. */
  speed: number;
  /** Dash duration in milliseconds. */
  durationMs: number;
}

export interface CharacterProps {
  /** Walking/running speed in m/s. */
  speed: number;
  /** Dash configuration. */
  dash: DashConfig;
  /** Visual/skin configuration. */
  skin: CharacterSkin;
}

export interface ForwardDir { x: number; z: number }

