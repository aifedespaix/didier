"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, MeshStandardMaterial } from "three";
import type { MoveTarget } from "@/types/game";

export function TargetMarker({ target }: { target: MoveTarget }) {
  const group = useRef<Group | null>(null);
  const ringMat = useRef<MeshStandardMaterial | null>(null);
  const fillMat = useRef<MeshStandardMaterial | null>(null);
  const spin = useRef(0);

  useFrame((_s, dt) => {
    if (!group.current) return;
    spin.current += dt;
    const s = 1 + 0.08 * Math.sin(spin.current * 6);
    group.current.scale.set(s, 1, s);
    if (ringMat.current) ringMat.current.opacity = 0.55 + 0.25 * Math.sin(spin.current * 7);
    if (fillMat.current) fillMat.current.opacity = 0.25 + 0.2 * Math.sin(spin.current * 5 + 1.2);
  });

  if (!target) return null;
  return (
    <group ref={group} position={[target.x, 0.02, target.z]}>
      <mesh rotation-x={-Math.PI / 2} castShadow={false} receiveShadow={false} renderOrder={2}>
        <ringGeometry args={[0.45, 0.6, 48]} />
        <meshStandardMaterial ref={ringMat as any} color="#22d3ee" emissive="#0ea5b7" transparent depthWrite={false} opacity={0.65} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} castShadow={false} receiveShadow={false} renderOrder={2}>
        <circleGeometry args={[0.12, 24]} />
        <meshStandardMaterial ref={fillMat as any} color="#22d3ee" emissive="#0891b2" transparent depthWrite={false} opacity={0.35} />
      </mesh>
    </group>
  );
}

