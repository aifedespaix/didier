"use client";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Color } from "three";
import { useRef, useState } from "react";
import type { MoveTarget } from "@/types/game";
import { Ground, Obstacles, Player, TargetMarker, CameraController, Minimap, RemotePlayer, ViewPanel, NetworkPanel } from "@/components/3d";
import { useP2PNetwork } from "@/systems/p2p/peer.client";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export function Game() {
  const [target, setTarget] = useState<MoveTarget>(null);
  const playerRef = useRef<RigidBodyApi | null>(null);
  const [camFollow, setCamFollow] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const { peerId, ready, error, remotes, peers, room, isHost, hostId, peersInfo, reconnectMissing, pingAll } = useP2PNetwork(
    playerRef as any,
    {
      autoConnectFromQuery: true,
      sendHz: 20,
      room: "default",
      readRoomFromQuery: true,
    },
  );

  return (
    <>
      <Canvas
        className="w-full h-full"
        camera={{ position: [4, 4, 6], fov: 50 }}
        shadows
        onCreated={({ scene, gl }) => {
          scene.background = new Color("#0e0f13");
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
          {/* Remote players (red) */}
          {remotes.map((r) => (
            <RemotePlayer key={r.id} state={r} />
          ))}
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

      <ViewPanel camFollow={camFollow} zoomLevel={zoomLevel} />

      {/* Minimap bottom-right */}
      <Minimap
        playerRef={playerRef}
        target={target}
        onSetTarget={(x, z) => setTarget({ x, z })}
        width={220}
      />
      {/* P2P status small badge bottom-left */}
      <NetworkPanel
        room={room}
        isHost={isHost}
        peerId={peerId}
        ready={ready}
        error={error}
        peers={peers}
        hostId={hostId}
        peersInfo={peersInfo as any}
        onReconnect={reconnectMissing}
        onPing={pingAll}
      />
    </>
  );
}


