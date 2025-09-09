"use client";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody, useRapier } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Quaternion, Vector3 } from "three";
import type { Group } from "three";
import { useRef } from "react";
import type { MoveTarget } from "@/types/game";

export function Player({
  target,
  bodyRef,
}: {
  target: MoveTarget;
  bodyRef?: React.MutableRefObject<RigidBodyApi | null>;
}) {
  const body = bodyRef ?? useRef<RigidBodyApi | null>(null);
  const visual = useRef<Group | null>(null);
  const speed = 4; // m/s en XZ
  const arriveRadius = 0.05; // m
  const { world, rapier } = useRapier();

  useFrame((_state, dt) => {
    const b = body.current;
    if (!b) return;
    const t = b.translation();
    const lv = b.linvel();

    if (!target) {
      if (Math.abs(lv.x) > 0.001 || Math.abs(lv.z) > 0.001) {
        b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
      }
      return;
    }

    const dx = target.x - t.x;
    const dz = target.z - t.z;
    const dist = Math.hypot(dx, dz);
    if (dist < arriveRadius) {
      b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
      return;
    }
    const nx = dx / dist;
    const nz = dz / dist;

    // Steering simple via raycasts
    let dirX = nx;
    let dirZ = nz;
    if (world && rapier) {
      const originY = 0.5;
      const maxLook = Math.min(dist, 6);
      const ray = new rapier.Ray(
        { x: t.x, y: originY, z: t.z },
        { x: nx, y: 0, z: nz }
      );
      const hit = world.castRay(ray, maxLook, true);
      const needsAvoid = !!hit && hit.toi < maxLook * 0.9;
      if (needsAvoid) {
        const deg = [20, -20, 35, -35, 50, -50, 65, -65];
        let found = false;
        for (let i = 0; i < deg.length; i++) {
          const a = (deg[i] * Math.PI) / 180;
          const rx = nx * Math.cos(a) - nz * Math.sin(a);
          const rz = nx * Math.sin(a) + nz * Math.cos(a);
          const rRay = new rapier.Ray(
            { x: t.x, y: originY, z: t.z },
            { x: rx, y: 0, z: rz }
          );
          const rHit = world.castRay(rRay, maxLook, true);
          if (!rHit) {
            dirX = rx;
            dirZ = rz;
            found = true;
            break;
          }
        }
        if (!found) {
          let bestRx = nx,
            bestRz = nz,
            bestToi = 0;
          const wide = [80, -80, 100, -100, 120, -120];
          for (let i = 0; i < wide.length; i++) {
            const a = (wide[i] * Math.PI) / 180;
            const rx = nx * Math.cos(a) - nz * Math.sin(a);
            const rz = nx * Math.sin(a) + nz * Math.cos(a);
            const rRay = new rapier.Ray(
              { x: t.x, y: originY, z: t.z },
              { x: rx, y: 0, z: rz }
            );
            const rHit = world.castRay(rRay, maxLook, true);
            const toi = rHit ? rHit.toi : maxLook;
            if (toi > bestToi) {
              bestToi = toi;
              bestRx = rx;
              bestRz = rz;
            }
          }
          dirX = bestRx;
          dirZ = bestRz;
        }
      }
    }

    const len = Math.hypot(dirX, dirZ) || 1;
    b.setLinvel(
      { x: (dirX / len) * speed, y: lv.y, z: (dirZ / len) * speed },
      true
    );

    // Orientation visuelle vers la direction de déplacement (lissée)
    const v2 = lv.x * lv.x + lv.z * lv.z;
    if (visual.current && v2 > 1e-4) {
      const targetYaw = Math.atan2(lv.x, lv.z);
      const targetQ = new Quaternion().setFromAxisAngle(
        new Vector3(0, 1, 0),
        targetYaw
      );
      const rotSmoothing = 12;
      const alpha = 1 - Math.exp(-rotSmoothing * dt);
      visual.current.quaternion.slerp(targetQ, alpha);
    }
  });

  return (
    <RigidBody
      ref={body as any}
      position={[0, 3, 0]}
      enabledRotations={[false, false, false]}
    >
      {/* Collider du joueur (1.0 x 2.0 x 0.4 m) */}
      <CuboidCollider args={[0.5, 1.0, 0.2]} />
      {/* Visuel: box + flèche frontale */}
      <group ref={visual}>
        {/* UX: blue translucent ground ring (annulus) under local player */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]} receiveShadow>
          <ringGeometry args={[0.55, 0.85, 32]} />
          <meshStandardMaterial color="#22d3ee" transparent opacity={0.45} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[1.0, 2.0, 0.4]} />
          <meshStandardMaterial color="#67e8f9" />
        </mesh>
        <mesh castShadow position={[0, 1.2, 0.35]}>
          <coneGeometry args={[0.18, 0.36, 12]} />
          <meshStandardMaterial color="#22d3ee" />
        </mesh>
      </group>
    </RigidBody>
  );
}
