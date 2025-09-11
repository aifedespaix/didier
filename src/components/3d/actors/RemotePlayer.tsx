"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { Euler, Quaternion, Vector3 } from "three";
import type { RemotePlayerState } from "@/types/p2p";
import { CharacterModel } from "@/components/3d/actors/CharacterModel";
import { CHARACTER_CLIP_HINTS } from "@/config/animations";

export function RemotePlayer({ state }: { state: RemotePlayerState }) {
  const visual = useRef<Group | null>(null);
  // Local smoothing buffers
  const pos = useRef(new Vector3(0, 0, 0));
  const targetPos = useRef(new Vector3(...state.p));
  const rot = useRef(new Quaternion());
  const targetRot = useRef(new Quaternion().setFromEuler(new Euler(0, state.y, 0)));
  const lastPos = useRef(new Vector3(...state.p));
  const speedRef = useRef(0);

  useFrame((_s, dt) => {
    // Update targets from latest state
    const [x, y, z] = state.p;
    targetPos.current.set(x, y, z);
    targetRot.current.setFromEuler(new Euler(0, state.y, 0));

    // Smooth follow
    const alphaPos = 1 - Math.exp(-10 * dt); // ~smooth
    const alphaRot = 1 - Math.exp(-10 * dt);
    pos.current.lerp(targetPos.current, alphaPos);
    rot.current.slerp(targetRot.current, alphaRot);

    // Estimate horizontal speed from last position (for locomotion)
    const dx = pos.current.x - lastPos.current.x;
    const dz = pos.current.z - lastPos.current.z;
    const dist = Math.hypot(dx, dz);
    const s = dt > 0 ? dist / dt : 0;
    // mild smoothing
    speedRef.current = speedRef.current * 0.85 + s * 0.15;
    lastPos.current.copy(pos.current);

    if (visual.current) {
      visual.current.position.copy(pos.current);
      visual.current.quaternion.copy(rot.current);
    }
  });

  return (
    <group ref={visual}>
      {/* UX: red translucent ground ring (annulus) under remote players */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]} receiveShadow>
        <ringGeometry args={[0.55, 0.85, 32]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.45} />
      </mesh>
      {/* Character visual with animations (remote) */}
      <CharacterModel
        getSpeed={() => speedRef.current}
        overrideState={state.a ?? null}
        clipHints={CHARACTER_CLIP_HINTS}
        fitHeight={1.8}
      />
    </group>
  );
}
