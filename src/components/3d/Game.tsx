"use client";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Color } from "three";
import { useRef, useState } from "react";
import type { MoveTarget } from "@/types/game";
import { Ground, Obstacles, Player, TargetMarker, CameraController, Minimap } from "@/components/3d";

export function Game() {
  const [target, setTarget] = useState<MoveTarget>(null);
  const playerRef = useRef<RigidBodyApi | null>(null);
  const [camFollow, setCamFollow] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(0);

  return (
    <>
      <Canvas
        className="w-full h-full"
        camera={{ position: [4, 4, 6], fov: 50 }}
        shadows
        onCreated={({ scene, gl }) => {
          scene.background = new Color("#0e0f13");
          gl.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />

        <Physics gravity={[0, -9.81, 0]}>
          <Ground onRightClick={(x, z) => setTarget({ x, z })} />
          <Obstacles />
          <Player target={target} bodyRef={playerRef} />
        </Physics>

        <TargetMarker target={target} />

        <CameraController
          targetRef={playerRef}
          follow={camFollow}
          setFollow={setCamFollow}
          zoomIndex={zoomLevel}
          setZoomIndex={setZoomLevel}
        />
      </Canvas>

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
        <div style={{ opacity: 0.8 }}>Toggle: L • Zoom: Wheel</div>
      </div>

      {/* Minimap bottom-right */}
      <Minimap
        playerRef={playerRef}
        target={target}
        onSetTarget={(x, z) => setTarget({ x, z })}
        width={220}
      />
    </>
  );
}
