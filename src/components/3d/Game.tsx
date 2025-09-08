"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Color, Quaternion, Vector3 } from "three";
import type { Group } from "three";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActionEvents } from "@/3d/input/hooks";

type MoveTarget = { x: number; z: number } | null;

function Ground({
  onRightClick,
}: {
  onRightClick: (x: number, z: number) => void;
}) {
  // Dimensions du terrain et des murs
  const SIZE = 40; // taille du plane (X et Z)
  const HALF = SIZE / 2;
  const WALL_THICKNESS = 0.5; // largeur des murs
  const WALL_HEIGHT = 2; // hauteur des murs visibles

  // Couleurs
  const GROUND_COLOR = "#7c3aed"; // violet
  const WALL_COLOR = "#4c1d95"; // violet foncé
  const rmbDown = useRef(false);
  const lastUpdate = useRef(0);

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
      e.stopPropagation();
      e.preventDefault?.();
      updateFromEvent(e);
    },
    [updateFromEvent],
  );

  const handlePointerUp = useCallback((e: any) => {
    if (e.button === 2) rmbDown.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      // Update only if RMB held, also confirm with native buttons bitmask when available
      const buttons: number | undefined = e.buttons ?? e?.nativeEvent?.buttons;
      const rmbHeld = rmbDown.current || (typeof buttons === "number" && (buttons & 2) === 2);
      if (!rmbHeld) return;

      // Throttle to ~30 Hz for perf
      const now = performance.now();
      if (now - lastUpdate.current < 33) return;
      lastUpdate.current = now;
      updateFromEvent(e);
    },
    [updateFromEvent],
  );

  // Safety: release RMB if pointerup happens off-mesh
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
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          // Stop drag if cursor leaves the plane
          rmbDown.current = false;
        }}
      >
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial color={GROUND_COLOR} />
      </mesh>

      {/* Collider physique du sol */}
      <CuboidCollider args={[HALF, 0.1, HALF]} position={[0, -0.05, 0]} />

      {/* MURS (violet foncé) */}
      {/* Nord (le long de +Z) */}
      <mesh castShadow receiveShadow position={[0, WALL_HEIGHT / 2, HALF]}>
        <boxGeometry args={[SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <CuboidCollider args={[HALF, WALL_HEIGHT / 2, WALL_THICKNESS / 2]} position={[0, WALL_HEIGHT / 2, HALF]} />

      {/* Sud (le long de -Z) */}
      <mesh castShadow receiveShadow position={[0, WALL_HEIGHT / 2, -HALF]}>
        <boxGeometry args={[SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <CuboidCollider args={[HALF, WALL_HEIGHT / 2, WALL_THICKNESS / 2]} position={[0, WALL_HEIGHT / 2, -HALF]} />

      {/* Est (le long de +X) */}
      <mesh castShadow receiveShadow position={[HALF, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <CuboidCollider args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF]} position={[HALF, WALL_HEIGHT / 2, 0]} />

      {/* Ouest (le long de -X) */}
      <mesh castShadow receiveShadow position={[-HALF, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, SIZE]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      <CuboidCollider args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF]} position={[-HALF, WALL_HEIGHT / 2, 0]} />
    </RigidBody>
  );
}

function Player({ target, bodyRef }: { target: MoveTarget; bodyRef?: React.MutableRefObject<RigidBodyApi | null> }) {
  const body = bodyRef ?? useRef<RigidBodyApi | null>(null);
  const visual = useRef<Group | null>(null);
  const speed = 4; // m/s en XZ
  const arriveRadius = 0.05; // m

  useFrame((_state, dt) => {
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

    // Orientation visuelle vers la direction de déplacement (lissée)
    const v2 = lv.x * lv.x + lv.z * lv.z;
    if (visual.current && v2 > 1e-4) {
      const targetYaw = Math.atan2(lv.x, lv.z); // 0 = +Z
      const targetQ = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), targetYaw);
      const rotSmoothing = 12; // plus haut = plus réactif
      const alpha = 1 - Math.exp(-rotSmoothing * dt);
      visual.current.quaternion.slerp(targetQ, alpha);
    }
  });

  return (
    <RigidBody ref={body as any} position={[0, 3, 0]} enabledRotations={[false, false, false]}>
      {/* Collider du joueur pour rester au sol */}
      <CuboidCollider args={[0.5, 0.5, 0.5]} />
      {/* Visuel: cube + flèche frontale pour indiquer l'orientation */}
      <group ref={visual}>
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#67e8f9" />
        </mesh>
        {/* Flèche en façade (+Z) */}
        <mesh castShadow position={[0, 0.6, 0.7]}>
          <coneGeometry args={[0.2, 0.4, 12]} />
          <meshStandardMaterial color="#22d3ee" />
        </mesh>
      </group>
    </RigidBody>
  );
}

function Obstacles() {
  // Quelques obstacles fixes (positions en XZ, tailles en XYZ)
  const items = useMemo(
    () => [
      { pos: [-8, -5] as [number, number], size: [2, 1, 2] as [number, number, number], color: "#6d28d9" },
      { pos: [6, -6] as [number, number], size: [3, 1, 1.5] as [number, number, number], color: "#7e22ce" },
      { pos: [10, 4] as [number, number], size: [1.5, 1.5, 1.5] as [number, number, number], color: "#9333ea" },
      { pos: [-12, 8] as [number, number], size: [4, 1, 1] as [number, number, number], color: "#5b21b6" },
      { pos: [3, 9] as [number, number], size: [1, 2, 3] as [number, number, number], color: "#7c3aed" },
      { pos: [-5, 12] as [number, number], size: [2, 1, 3] as [number, number, number], color: "#6d28d9" },
    ],
    [],
  );

  return (
    <>
      {items.map((o, i) => {
        const [sx, sy, sz] = o.size;
        const half = [sx / 2, sy / 2, sz / 2] as const;
        return (
          <RigidBody key={i} type="fixed" colliders={false} position={[o.pos[0], 0, o.pos[1]]}>
            <CuboidCollider args={[half[0], half[1], half[2]]} position={[0, half[1], 0]} />
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

type ZoomPreset = {
  radius: number; // distance from target (spherical)
  pitchDeg: number; // elevation from ground plane
  yawDeg: number; // around Y axis
};

interface CameraControllerProps {
  targetRef: React.MutableRefObject<RigidBodyApi | null>;
  follow: boolean;
  setFollow: (v: boolean) => void;
  zoomIndex: number;
  setZoomIndex: (i: number) => void;
}

function CameraController({ targetRef, follow, setFollow, zoomIndex, setZoomIndex }: CameraControllerProps) {
  const { camera } = useThree();

  // Five zoom levels: 0 = far (default), 4 = close
  const presets: ZoomPreset[] = useMemo(
    () => [
      { radius: 24, pitchDeg: 62, yawDeg: 45 }, // far (default game view)
      { radius: 20, pitchDeg: 60, yawDeg: 45 },
      { radius: 16, pitchDeg: 58, yawDeg: 45 },
      { radius: 12, pitchDeg: 56, yawDeg: 45 },
      { radius: 9, pitchDeg: 54, yawDeg: 45 }, // close (see character well)
    ],
    [],
  );

  // Input bindings
  useActionEvents("camera.follow.toggle", (ev) => {
    if (ev.type === "digital" && ev.phase === "pressed") setFollow((f) => !f);
  });
  useActionEvents("camera.zoom.in", (ev) => {
    if (ev.type === "digital" && ev.phase === "pressed")
      setZoomIndex((i) => Math.min(i + 1, presets.length - 1));
  });
  useActionEvents("camera.zoom.out", (ev) => {
    if (ev.type === "digital" && ev.phase === "pressed") setZoomIndex((i) => Math.max(i - 1, 0));
  });

  // Smooth state
  const smoothedPos = useRef(new Vector3(camera.position.x, camera.position.y, camera.position.z));
  const smoothedLook = useRef(new Vector3(0, 0, 0));
  const targetPos = useRef(new Vector3());
  const desiredPos = useRef(new Vector3());
  const initialized = useRef(false);

  const deg2rad = (d: number) => (d * Math.PI) / 180;

  useFrame((_state, dt) => {
    const body = targetRef.current;
    const smoothing = 8; // higher = snappier
    const alpha = 1 - Math.exp(-smoothing * dt);

    // Target position (fallback 0,0,0)
    const t = body ? body.translation() : { x: 0, y: 0, z: 0 };
    const target = targetPos.current.set(t.x, t.y, t.z);

    const preset = presets[zoomIndex];
    const pitch = deg2rad(preset.pitchDeg);
    const yaw = deg2rad(preset.yawDeg);
    const horiz = Math.cos(pitch) * preset.radius;
    const offX = Math.sin(yaw) * horiz;
    const offZ = Math.cos(yaw) * horiz;
    const offY = Math.sin(pitch) * preset.radius;
    const desired = desiredPos.current.set(target.x + offX, target.y + offY, target.z + offZ);

    // Smooth towards desired
    smoothedPos.current.lerp(desired, alpha);
    smoothedLook.current.lerp(target, alpha);

    // First frame: snap without smoothing so camera aligns immediately
    if (!initialized.current) {
      smoothedPos.current.copy(desired);
      smoothedLook.current.copy(target);
      initialized.current = true;
    }

    if (follow) {
      camera.position.copy(smoothedPos.current);
      camera.lookAt(smoothedLook.current);
    }
  });

  return null;
}

export function Game() {
  const [target, setTarget] = useState<MoveTarget>(null);
  const playerRef = useRef<RigidBodyApi | null>(null);
  const [camFollow, setCamFollow] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(0);

  return (<>
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
        <Obstacles />
        <Player target={target} bodyRef={playerRef} />
      </Physics>

      {/* Marqueur de destination (UX) */}
      <TargetMarker target={target} />

      {/* MOBA-like camera controller */}
      <CameraController
        targetRef={playerRef}
        follow={camFollow}
        setFollow={setCamFollow}
        zoomIndex={zoomLevel}
        setZoomIndex={setZoomLevel}
      />
    </Canvas>

    {/* HUD: état caméra */}
    <div
      style={{
        position: "absolute",
        left: 12,
        top: 12,
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        padding: "6px 8px",
        borderRadius: 6,
        fontSize: 12,
        pointerEvents: "none",
      }}
    >
      <div>Camera follow: {camFollow ? "ON" : "OFF"}</div>
      <div>Zoom: {zoomLevel + 1} / 5</div>
      <div style={{ opacity: 0.8 }}>Toggle: L · Zoom: Wheel</div>
    </div>
  </>);
}

function TargetMarker({ target }: { target: MoveTarget }) {
  const group = useRef<Group | null>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial | null>(null);
  const fillMat = useRef<THREE.MeshStandardMaterial | null>(null);
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
      {/* Anneau principal */}
      <mesh rotation-x={-Math.PI / 2} castShadow={false} receiveShadow={false} renderOrder={2}>
        <ringGeometry args={[0.45, 0.6, 48]} />
        <meshStandardMaterial
          ref={ringMat as any}
          color="#22d3ee"
          emissive="#0ea5b7"
          transparent
          depthWrite={false}
          opacity={0.65}
        />
      </mesh>
      {/* Disque central léger */}
      <mesh rotation-x={-Math.PI / 2} castShadow={false} receiveShadow={false} renderOrder={2}>
        <circleGeometry args={[0.12, 24]} />
        <meshStandardMaterial
          ref={fillMat as any}
          color="#22d3ee"
          emissive="#0891b2"
          transparent
          depthWrite={false}
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}
