"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Color } from "three";
import { useCallback, useRef, useState } from "react";

type MoveTarget = { x: number; z: number } | null;

function Ground({
  onRightClick,
}: {
  onRightClick: (x: number, z: number) => void;
}) {
  const handlePointerDown = useCallback(
    (e: any) => {
      // Right click only
      if (e.button !== 2) return;
      e.stopPropagation();
      e.preventDefault?.();
      const p = e.point; // intersection point (Vector3)
      onRightClick(p.x, p.z);
    },
    [onRightClick]
  );

  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Visuel du sol */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#2a2d34" />
      </mesh>
      {/* Collider physique correspondant au plan */}
      <CuboidCollider args={[20, 0.1, 20]} position={[0, -0.05, 0]} />
    </RigidBody>
  );
}

function Player({ target }: { target: MoveTarget }) {
  const body = useRef<any>(null);
  const speed = 4; // m/s en XZ
  const arriveRadius = 0.05; // m

  useFrame(() => {
    const b = body.current;
    if (!b) return;
    const t = b.translation();
    const lv = b.linvel();

    if (!target) {
      // Pas de cible → stopper XZ progressivement (ici snap 0)
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
    b.setLinvel({ x: nx * speed, y: lv.y, z: nz * speed }, true);
  });

  return (
    <RigidBody ref={body} position={[0, 3, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#67e8f9" />
      </mesh>
    </RigidBody>
  );
}

export function Game() {
  const [target, setTarget] = useState<MoveTarget>(null);

  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [4, 4, 6], fov: 50 }}
      shadows
      onCreated={({ scene, gl }) => {
        scene.background = new Color("#0e0f13");
        // Désactive le menu contextuel natif sur le canvas (right-click)
        gl.domElement.addEventListener("contextmenu", (e) =>
          e.preventDefault()
        );
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />

      <Physics gravity={[0, -9.81, 0]}>
        <Ground onRightClick={(x, z) => setTarget({ x, z })} />
        <Player target={target} />
      </Physics>
    </Canvas>
  );
}
