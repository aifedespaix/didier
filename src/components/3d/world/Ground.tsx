"use client";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useCallback, useEffect, useRef } from "react";
import { WORLD, HALF } from "@/config/world";
import { useAim } from "@/stores/aim";

export function Ground({ onRightClick }: { onRightClick: (x: number, z: number) => void }) {
  // Dimensions du terrain et des murs (m)
  const SIZE_X = WORLD.sizeX; // X (largeur)
  const SIZE_Z = WORLD.sizeZ; // Z (profondeur)
  const HALF_X = HALF.x;
  const HALF_Z = HALF.z;
  const WALL_THICKNESS = WORLD.wallThickness; // épaisseur murs
  const WALL_HEIGHT = WORLD.wallHeight; // hauteur des murs visibles (m)

  // Couleurs
  const GROUND_COLOR = "#7c3aed"; // violet
  const WALL_COLOR = "#4c1d95"; // violet foncé

  const rmbDown = useRef(false);
  const lastUpdate = useRef(0);
  const lastAimUpdate = useRef(0);
  const setAim = useAim((s) => s.setPoint);

  const updateFromEvent = useCallback(
    (e: any) => {
      const p = e.point;
      if (p) onRightClick(p.x, p.z);
    },
    [onRightClick],
  );

  const handlePointerDown = useCallback(
    (e: any) => {
      if (e.button !== 2) return; // Right click only
      rmbDown.current = true;
      // Capture pointer to keep receiving move events reliably while held
      try {
        if (e?.target?.setPointerCapture && typeof e.pointerId !== "undefined") {
          e.target.setPointerCapture(e.pointerId);
        }
      } catch {}
      e.stopPropagation();
      e.preventDefault?.();
      updateFromEvent(e);
    },
    [updateFromEvent],
  );

  const handlePointerUp = useCallback((e: any) => {
    if (e.button === 2) {
      rmbDown.current = false;
      try {
        if (e?.target?.releasePointerCapture && typeof e.pointerId !== "undefined") {
          e.target.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      // Always update aim point on hover (throttled)
      const now = performance.now();
      if (now - lastAimUpdate.current > 16) {
        lastAimUpdate.current = now;
        const p = e.point;
        if (p) setAim([p.x, p.y, p.z]);
      }

      // If RMB held, also update move target (throttled ~30 Hz)
      const buttons: number | undefined = e.buttons ?? e?.nativeEvent?.buttons;
      const rmbHeld = rmbDown.current || (typeof buttons === "number" && (buttons & 2) === 2);
      if (!rmbHeld) return;
      if (now - lastUpdate.current < 33) return;
      lastUpdate.current = now;
      updateFromEvent(e);
    },
    [setAim, updateFromEvent],
  );

  useEffect(() => {
    const onGlobalPointerUp = (ev: PointerEvent) => {
      if (ev.button === 2) rmbDown.current = false;
    };
    window.addEventListener("pointerup", onGlobalPointerUp);
    return () => window.removeEventListener("pointerup", onGlobalPointerUp);
  }, []);

  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Sol (violet) */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={(e: any) => {
          const p = e.point;
          if (p) setAim([p.x, p.y, p.z]);
        }}
        onPointerOut={() => setAim(null)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          rmbDown.current = false;
          setAim(null);
        }}
      >
        <planeGeometry args={[SIZE_X, SIZE_Z]} />
        <meshStandardMaterial color={GROUND_COLOR} />
      </mesh>

      {/* Collider physique du sol */}
      <CuboidCollider args={[HALF_X, 0.1, HALF_Z]} position={[0, -0.05, 0]} friction={0.1} restitution={0} />

      {/* Murs (violet foncé) */}
      {/* Nord */}
      <mesh castShadow receiveShadow position={[0, WALL_HEIGHT / 2, HALF_Z]}>
        <boxGeometry args={[SIZE_X, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <CuboidCollider args={[HALF_X, WALL_HEIGHT / 2, WALL_THICKNESS / 2]} position={[0, WALL_HEIGHT / 2, HALF_Z]} friction={0.1} restitution={0} />

      {/* Sud */}
      <mesh castShadow receiveShadow position={[0, WALL_HEIGHT / 2, -HALF_Z]}>
        <boxGeometry args={[SIZE_X, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <CuboidCollider args={[HALF_X, WALL_HEIGHT / 2, WALL_THICKNESS / 2]} position={[0, WALL_HEIGHT / 2, -HALF_Z]} friction={0.1} restitution={0} />

      {/* Est */}
      <mesh castShadow receiveShadow position={[HALF_X, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, SIZE_Z]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <CuboidCollider args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF_Z]} position={[HALF_X, WALL_HEIGHT / 2, 0]} friction={0.1} restitution={0} />

      {/* Ouest */}
      <mesh castShadow receiveShadow position={[-HALF_X, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, SIZE_Z]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <CuboidCollider args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF_Z]} position={[-HALF_X, WALL_HEIGHT / 2, 0]} friction={0.1} restitution={0} />
    </RigidBody>
  );
}
