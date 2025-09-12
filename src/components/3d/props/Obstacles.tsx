"use client";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { OBSTACLE_ITEMS } from "@/components/3d/props/obstacle-config";
import { useObstacles } from "@/stores/obstacles";

export function Obstacles() {
  const { obstacles } = useObstacles();
  const byId = useMemo(() => Object.fromEntries(OBSTACLE_ITEMS.map((o) => [o.id, o])), []);

  return (
    <>
      {obstacles.filter((o) => o.hp > 0).map((state) => {
        const cfg = byId[state.id];
        if (!cfg) return null;
        const [sx, sy, sz] = cfg.size;
        const half = [sx / 2, sy / 2, sz / 2] as const;
        return (
          <RigidBody
            key={cfg.id}
            type="fixed"
            colliders={false}
            position={[cfg.pos[0], 0, cfg.pos[1]]}
          >
            <CuboidCollider
              args={[half[0], half[1], half[2]]}
              position={[0, half[1], 0]}
              friction={0.1}
              restitution={0}
            />
            <mesh castShadow receiveShadow position={[0, half[1], 0]}>
              <boxGeometry args={[sx, sy, sz]} />
              <meshStandardMaterial color={cfg.color} />
            </mesh>
          </RigidBody>
        );
      })}
    </>
  );
}
