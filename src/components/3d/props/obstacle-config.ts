export const OBSTACLE_ITEMS = [
  {
    id: "ob_0",
    pos: [-8, -5] as [number, number],
    size: [2, 1.5, 2] as [number, number, number],
    color: "#6d28d9",
  },
  {
    id: "ob_1",
    pos: [6, -6] as [number, number],
    size: [3, 1.5, 1.5] as [number, number, number],
    color: "#7e22ce",
  },
  {
    id: "ob_2",
    pos: [10, 4] as [number, number],
    size: [1.5, 1.5, 1.5] as [number, number, number],
    color: "#9333ea",
  },
  {
    id: "ob_3",
    pos: [-12, 8] as [number, number],
    size: [4, 1.5, 1] as [number, number, number],
    color: "#5b21b6",
  },
  {
    id: "ob_4",
    pos: [3, 9] as [number, number],
    size: [1, 1.5, 3] as [number, number, number],
    color: "#7c3aed",
  },
  {
    id: "ob_5",
    pos: [-5, 12] as [number, number],
    size: [2, 1.5, 3] as [number, number, number],
    color: "#6d28d9",
  },
] as const;

export type ObstacleConfig = (typeof OBSTACLE_ITEMS)[number];

