"use client";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";

export const OBSTACLE_ITEMS = [
  {
    pos: [-8, -5] as [number, number],
    size: [2, 1.5, 2] as [number, number, number],
    color: "#6d28d9",
  },
  {
    pos: [6, -6] as [number, number],
    size: [3, 1.5, 1.5] as [number, number, number],
    color: "#7e22ce",
  },
  {
    pos: [10, 4] as [number, number],
    size: [1.5, 1.5, 1.5] as [number, number, number],
    color: "#9333ea",
  },
  {
    pos: [-12, 8] as [number, number],
    size: [4, 1.5, 1] as [number, number, number],
    color: "#5b21b6",
  },
  {
    pos: [3, 9] as [number, number],
    size: [1, 1.5, 3] as [number, number, number],
    color: "#7c3aed",
  },
  {
    pos: [-5, 12] as [number, number],
    size: [2, 1.5, 3] as [number, number, number],
    color: "#6d28d9",
  },
] as const;

export function Obstacles() {
  // Quelques obstacles fixes (positions en XZ, tailles en XYZ)
  const items = useMemo(() => OBSTACLE_ITEMS, []);

  return (
    <>
      {items.map((o, i) => {
        const [sx, sy, sz] = o.size;
        const half = [sx / 2, sy / 2, sz / 2] as const;
        return (
          <RigidBody
            key={i}
            type="fixed"
            colliders={false}
            position={[o.pos[0], 0, o.pos[1]]}
          >
            <CuboidCollider
              args={[half[0], half[1], half[2]]}
              position={[0, half[1], 0]}
            />
            <mesh castShadow receiveShadow position={[0, half[1], 0]}>
              <boxGeometry args={[sx, sy, sz]} />
              <meshStandardMaterial color={o.color} />
            </mesh>
          </RigidBody>
        );
      })}
    </>
  );
}
