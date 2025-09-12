"use client";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Color } from "three";
import { useEffect, useRef, useState } from "react";
import type { AnimStateId } from "@/types/animation";
import type { MoveTarget } from "@/types/game";
import { Ground, Obstacles, Player, TargetMarker, CameraController, Minimap, RemotePlayer, ViewPanel, NetworkPanel } from "@/components/3d";
import { SpellBar } from "@/components/3d/hud/SpellBar";
import { HealthBar } from "@/components/3d/hud/HealthBar";
import { PingHUD } from "@/components/3d/hud/PingHUD";
import { MenuManager } from "@/components/3d/hud/MenuModals";
import { useCharacterUI } from "@/stores/character-ui";
import { useP2PNetwork } from "@/systems/p2p/peer.client";
import ProjectileManager, { type ProjectileManagerRef } from "@/components/3d/world/ProjectileManager";
import type { P2PMessage } from "@/types/p2p";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export function Game() {
  // Cible de déplacement persistante vs. marqueur visuel (1s)
  const [moveTarget, setMoveTarget] = useState<MoveTarget>(null);
  const [markerTarget, setMarkerTarget] = useState<MoveTarget>(null);
  const markerTimer = useRef<number | null>(null);
  const playerRef = useRef<RigidBodyApi | null>(null);
  const animOverrideRef = useRef<AnimStateId | null>(null);
  const [camFollow, setCamFollow] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const { peerId, ready, error, remotes, peers, room, isHost, hostId, peersInfo, reconnectMissing, pingAll, send, onMessage } = useP2PNetwork(
    playerRef as any,
    {
      autoConnectFromQuery: true,
      sendHz: 20,
      room: "default",
      readRoomFromQuery: true,
      getAnimOverride: () => animOverrideRef.current ?? null,
      getHp: () => {
        const s = useCharacterUI.getState();
        return { cur: s.hpCurrent, max: s.hpMax };
      },
    },
  );
  const projRef = useRef<ProjectileManagerRef | null>(null);

  // Wire custom P2P messages for spells/projectiles
  useEffect(() => {
    return onMessage((sender, msg: P2PMessage) => {
      if (msg.t === "spell-cast") {
        projRef.current?.spawn({ id: msg.id, from: msg.from ?? sender, kind: msg.kind, p: msg.p, d: msg.d, speed: msg.speed, range: msg.range, radius: msg.radius, damage: msg.damage });
      } else if (msg.t === "proj-despawn") {
        projRef.current?.despawn(msg.id);
      } else if (msg.t === "damage") {
        if (peerId && msg.to === peerId) {
          const st = useCharacterUI.getState();
          const next = Math.max(0, st.hpCurrent - Math.max(0, msg.amount));
          st.setHp(next, st.hpMax);
        }
      }
    });
  }, [onMessage, peerId]);

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
          <Ground onRightClick={(x, z) => {
            setMoveTarget({ x, z });
            setMarkerTarget({ x, z });
            if (markerTimer.current) window.clearTimeout(markerTimer.current);
            markerTimer.current = window.setTimeout(() => setMarkerTarget(null), 1000);
          }} />
          <Obstacles />
          <Player
            target={moveTarget}
            bodyRef={playerRef}
            animOverrideRef={animOverrideRef}
            onCancelMove={() => setMoveTarget(null)}
            onCastMagic={() => {
              const b = playerRef.current;
              if (!b) return;
              const tr = b.translation();
              const lv = b.linvel();
              const v2 = lv.x * lv.x + lv.z * lv.z;
              const dirX = v2 > 1e-6 ? lv.x / Math.sqrt(v2) : 0;
              const dirZ = v2 > 1e-6 ? lv.z / Math.sqrt(v2) : 1;
              const origin: [number, number, number] = [tr.x + dirX * 0.8, Math.max(1.0, tr.y + 1.0), tr.z + dirZ * 0.8];
              const dir: [number, number, number] = [dirX, 0, dirZ];
              const id = `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
              projRef.current?.spawn({ id, from: peerId ?? null, kind: "magic-bolt", p: origin, d: dir, speed: 24, range: 20, radius: 0.35, damage: 20 });
              send({ t: "spell-cast", id, from: peerId ?? null, kind: "magic-bolt", p: origin, d: dir, speed: 24, range: 20, radius: 0.35, damage: 20 } as any);
            }}
          />
          <ProjectileManager
            ref={projRef as any}
            isHost={isHost}
            localId={peerId}
            getLocalPos={() => playerRef.current?.translation() ?? null}
            remotes={remotes as any}
            onNetSend={(msg) => send(msg)}
          />
          {/* Remote players (red) */}
          {remotes.map((r) => (
            <RemotePlayer key={r.id} state={r} />
          ))}
        </Physics>

        <TargetMarker target={markerTarget} />

        <CameraController
          targetRef={playerRef}
          follow={camFollow}
          setFollow={setCamFollow}
          zoomIndex={zoomLevel}
          setZoomIndex={setZoomLevel}
        />
      </Canvas>

      <ViewPanel camFollow={camFollow} zoomLevel={zoomLevel} />
      <SpellBar />
      <HealthBar />
      <MenuManager />

      {/* Minimap bottom-right */}
      <Minimap
        playerRef={playerRef}
        target={markerTarget}
        onSetTarget={(x, z) => {
          setMoveTarget({ x, z });
          setMarkerTarget({ x, z });
          if (markerTimer.current) window.clearTimeout(markerTimer.current);
          markerTimer.current = window.setTimeout(() => setMarkerTarget(null), 1000);
        }}
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
      <PingHUD peers={peersInfo as any} />
    </>
  );
}


