"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Color, Vector3 } from "three";
import { useCallback, useMemo, useRef, useState } from "react";
import { useActionEvents } from "@/3d/input/hooks";

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

function Player({ target, bodyRef }: { target: MoveTarget; bodyRef?: React.MutableRefObject<RigidBodyApi | null> }) {
  const body = bodyRef ?? useRef<RigidBodyApi | null>(null);
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
    <RigidBody ref={body as any} position={[0, 3, 0]}>
      {/* Collider du joueur pour rester au sol */}
      <CuboidCollider args={[0.5, 0.5, 0.5]} />
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#67e8f9" />
      </mesh>
    </RigidBody>
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
        <Player target={target} bodyRef={playerRef} />
      </Physics>

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
