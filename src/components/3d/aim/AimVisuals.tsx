"use client";
import { useEffect, useMemo, useRef } from "react";
import type { RapierRigidBody } from "@react-three/rapier";
import { Color, Group, MeshStandardMaterial, PlaneGeometry, Shape, ShapeGeometry, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { useAim } from "@/stores/aim";

export type AimVisualType = "arrow" | "line" | "cone";

export interface AimVisualProps {
  playerRef: React.MutableRefObject<RapierRigidBody | null>;
  visible: boolean;
  range: number; // meters
  type?: AimVisualType;
  color?: string;
}

export function AimVisualRoot({ playerRef, visible, range, type = "arrow", color = "#22d3ee" }: AimVisualProps) {
  const root = useRef<Group | null>(null);
  const aimRef = useRef<[number, number, number] | null>(null);

  // Keep aim in a ref without re-rendering on every mouse move
  useEffect(() => {
    aimRef.current = useAim.getState().point;
    const unsub = useAim.subscribe((s) => {
      aimRef.current = s.point;
    });
    return () => unsub();
  }, []);

  // Pre-make materials/geometries to avoid allocations per frame
  const colorStyle = useMemo(() => new Color(color).getStyle(), [color]);

  // Shaft is a plane geometry with length set by range (minus head)
  const headLen = useMemo(() => Math.min(0.35 * range, 0.8), [range]);
  const shaftLen = useMemo(() => Math.max(0, range - headLen), [range, headLen]);

  const shaftGeom = useMemo(() => new PlaneGeometry(0.22, Math.max(0.01, shaftLen)), [shaftLen]);
  const shaftMat = useMemo(() => new MeshStandardMaterial({ color: colorStyle, emissive: colorStyle, transparent: true, opacity: 0.35, depthWrite: false }), [colorStyle]);

  // Head: triangle shape (not a rectangle)
  const headGeom = useMemo(() => {
    const w = 0.5; // base width of head
    const h = Math.max(0.12, headLen);
    const shape = new Shape();
    // Base at y=0, tip at y=-h so after -X rotation it points toward +Z
    shape.moveTo(0, -h); // tip forward (+Z after rotation)
    shape.lineTo(w / 2, 0); // right base
    shape.lineTo(-w / 2, 0); // left base
    shape.lineTo(0, -h);
    return new ShapeGeometry(shape);
  }, [headLen]);
  const headMat = useMemo(() => new MeshStandardMaterial({ color: colorStyle, emissive: colorStyle, transparent: true, opacity: 0.5, depthWrite: false }), [colorStyle]);

  // Line and cone variants geometries
  const lineGeom = useMemo(() => new PlaneGeometry(0.08, Math.max(0.01, range)), [range]);
  const lineMat = useMemo(() => new MeshStandardMaterial({ color: colorStyle, emissive: colorStyle, transparent: true, opacity: 0.45, depthWrite: false }), [colorStyle]);
  const coneGeom = useMemo(() => new PlaneGeometry(Math.min(range * 0.8, 3), Math.max(0.01, range)), [range]);
  const coneMat = useMemo(() => new MeshStandardMaterial({ color: colorStyle, emissive: colorStyle, transparent: true, opacity: 0.25, depthWrite: false }), [colorStyle]);

  // Update position and yaw every frame based on body + aim
  useFrame(() => {
    if (!visible) return;
    const g = root.current;
    const b = playerRef.current;
    if (!g || !b) return;
    const tr = b.translation();
    g.position.set(tr.x, 0.02, tr.z);
    const aim = aimRef.current;
    if (aim) {
      const dx = aim[0] - tr.x;
      const dz = aim[2] - tr.z;
      const len = Math.hypot(dx, dz);
      if (len > 1e-4) {
        const yaw = Math.atan2(dx / len, dz / len);
        g.rotation.set(0, yaw, 0);
      }
    }
  });

  if (!visible) return null;

  return (
    <group ref={root} renderOrder={3}>
      {type === "arrow" && (
        <>
          {/* Shaft */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, shaftLen / 2]} geometry={shaftGeom} material={shaftMat} />
          {/* Head as triangle (base flush with shaft end) */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, shaftLen]} geometry={headGeom} material={headMat} />
        </>
      )}
      {type === "line" && <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, range / 2]} geometry={lineGeom} material={lineMat} />}
      {type === "cone" && <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, range / 2]} geometry={coneGeom} material={coneMat} />}
    </group>
  );
}

export default AimVisualRoot;
