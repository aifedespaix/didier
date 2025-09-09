export const WORLD = {
  sizeX: 150,
  sizeZ: 200,
  wallHeight: 3,
  wallThickness: 0.5,
} as const;

export const HALF = {
  x: WORLD.sizeX / 2,
  z: WORLD.sizeZ / 2,
} as const;

