"use client";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useAim } from "@/stores/aim";

type Props = {
  playerRef: React.MutableRefObject<RapierRigidBody | null>;
  height?: number; // light origin height above ground
  distance?: number; // meters
  angleDeg?: number; // cone aperture
  intensity?: number;
  color?: THREE.ColorRepresentation;
};

export function PlayerLightCone({
  playerRef,
  height = 1.6,
  distance = 60,
  angleDeg = 55,
  intensity = 8.0,
  color = "#ffdca8",
}: Props) {
  const lightRef = useRef<THREE.SpotLight | null>(null);
  const targetRef = useRef<THREE.Object3D | null>(null);
  const aim = useAim((s) => s.point);

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
      try {
        lightRef.current.shadow.mapSize.set(2048, 2048);
        lightRef.current.shadow.bias = -0.0002;
        // Reduce acne on skinned meshes (even though we disable their shadows)
        (lightRef.current.shadow as any).normalBias = 0.5;
      } catch {}
    }
  }, []);

  useFrame(() => {
    const body = playerRef.current;
    if (!body || !lightRef.current || !targetRef.current) return;
    const t = body.translation();
    lightRef.current.position.set(t.x, height, t.z);

    // Aim toward cursor if available; else along velocity; else +Z
    let tx = t.x;
    let tz = t.z + 1;
    if (aim) {
      tx = aim[0];
      tz = aim[2];
    } else {
      const v = body.linvel();
      const v2 = v.x * v.x + v.z * v.z;
      if (v2 > 1e-4) {
        const l = Math.sqrt(v2);
        tx = t.x + (v.x / l);
        tz = t.z + (v.z / l);
      }
    }
    targetRef.current.position.set(tx, height, tz);
    // Three updates target's matrix lazily; force update world matrices
    targetRef.current.updateMatrixWorld();
    lightRef.current.target.updateMatrixWorld();
  });

  return (
    <>
      <spotLight
        ref={lightRef as any}
        color={color}
        intensity={intensity}
        distance={distance}
        angle={(angleDeg * Math.PI) / 180}
        penumbra={0.5}
        decay={1.0}
        castShadow
      />
      <object3D ref={targetRef as any} />
    </>
  );
}
