"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, Plane, Ray, Vector3 } from "three";

/**
 * Minimal spell preview: a translucent rectangle projected onto the ground (y=0)
 * Follows current mouse pointer ray from camera.
 */
export function SpellPreview({ visible }: { visible: boolean }) {
  const group = useRef<Group | null>(null);
  const { camera, raycaster, pointer } = useThree();
  const plane = useRef(new Plane(new Vector3(0, 1, 0), 0));
  const [pulse, setPulse] = useState(0);
  const tmpPoint = useRef(new Vector3());

  useFrame((_s, dt) => {
    if (!group.current) return;
    setPulse((p) => (p + dt * 4) % (Math.PI * 2));
    // Compute intersection of current pointer ray with ground plane y=0
    try {
      raycaster.setFromCamera(pointer as any, camera);
      const ray: Ray = raycaster.ray as any;
      if (ray.intersectPlane(plane.current, tmpPoint.current)) {
        group.current.position.set(tmpPoint.current.x, 0.02, tmpPoint.current.z);
      }
    } catch {}
    const s = 0.95 + 0.08 * Math.sin(pulse);
    group.current.scale.set(s, 1, s);
  });

  if (!visible) return null;
  return (
    <group ref={group}>
      {/* ground-aligned rectangle */}
      <mesh rotation-x={-Math.PI / 2} castShadow={false} receiveShadow={false} renderOrder={3}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color="#22d3ee" emissive="#0ea5b7" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {/* outline */}
      <mesh rotation-x={-Math.PI / 2} castShadow={false} receiveShadow={false} renderOrder={3}>
        <ringGeometry args={[0.45, 0.48, 32]} />
        <meshStandardMaterial color="#22d3ee" emissive="#0891b2" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default SpellPreview;

