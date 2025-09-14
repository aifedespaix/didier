"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, useRapier } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Color } from "three";
import { useEffect, useRef, useState, useMemo } from "react";
import type { AnimStateId } from "@/types/animation";
import type { MoveTarget } from "@/types/game";
import { Ground, Obstacles, Player, TargetMarker, CameraController, Minimap, RemotePlayer, ViewPanel, NetworkPanel } from "@/components/3d";
import { PlayerLightCone } from "@/components/3d/effects/PlayerLightCone";
import { SpellBar } from "@/components/3d/hud/SpellBar";
import { HealthBar } from "@/components/3d/hud/HealthBar";
import { PingHUD } from "@/components/3d/hud/PingHUD";
import { MenuManager } from "@/components/3d/hud/MenuModals";
import { useCharacterUI } from "@/stores/character-ui";
import { useP2PNetwork } from "@/systems/p2p/peer.client";
import ProjectileManager, { type ProjectileManagerRef } from "@/components/3d/world/ProjectileManager";
import type { P2PMessage } from "@/types/p2p";
import { useObstacles } from "@/stores/obstacles";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { LoaderOverlay } from "@/components/ui/loader-overlay";
import SpellCastInputAdapter from "@/systems/spells/SpellCastInputAdapter";
import { FireballSpell } from "@/systems/spells/FireballSpell";
import { useCastTransient } from "@/stores/cast";
import { useAim } from "@/stores/aim";
import { AimVisualRoot } from "@/components/3d/aim/AimVisuals";
import { buildDefaultCharacter } from "@/systems/character/defaults";

export function Game() {
  // Cible de déplacement persistante vs. marqueur visuel (1s)
  const [moveTarget, setMoveTarget] = useState<MoveTarget>(null);
  const [markerTarget, setMarkerTarget] = useState<MoveTarget>(null);
  const markerTimer = useRef<number | null>(null);
  const playerRef = useRef<RigidBodyApi | null>(null);
  const animOverrideRef = useRef<AnimStateId | null>(null);
  const [camFollow, setCamFollow] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const aimRef = useRef<[number, number, number] | null>(null);
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
      getLightYaw: () => {
        const b = playerRef.current;
        if (!b) return null;
        try {
          const tr = b.translation();
          const a = aimRef.current;
          if (a) {
            const dx = a[0] - tr.x;
            const dz = a[2] - tr.z;
            if (dx * dx + dz * dz > 1e-8) return Math.atan2(dx, dz);
          }
          const lv = b.linvel();
          const v2 = lv.x * lv.x + lv.z * lv.z;
          if (v2 > 1e-6) return Math.atan2(lv.x, lv.z);
        } catch {}
        return null;
      },
    },
  );
  const projRef = useRef<ProjectileManagerRef | null>(null);
  const performCastRef = useRef<(() => void) | null>(null);
  const performDashRef = useRef<(() => void) | null>(null);
  const previewVisible = useCastTransient((s) => s.previewVisible);
  const armedAction = useCastTransient((s) => s.armedAction);
  const [worldReady, setWorldReady] = useState(false);
  const aimPoint = useAim((s) => s.point);
  useEffect(() => { aimRef.current = aimPoint; }, [aimPoint]);
  const character = useMemo(() => buildDefaultCharacter(), []);
  const dashRange = (character.dashDurationMs / 1000) * character.dashSpeed;
  const fireballSpell = useMemo(() => new FireballSpell(), []);
  

  // Wire custom P2P messages for spells/projectiles
  useEffect(() => {
    return onMessage((sender, msg: P2PMessage) => {
      if (msg.t === "spell-cast") {
        projRef.current?.spawn({ id: msg.id, from: msg.from ?? sender, kind: msg.kind, p: msg.p, d: msg.d, speed: msg.speed, range: msg.range, radius: msg.radius, damage: msg.damage });
      } else if (msg.t === "proj-despawn") {
        projRef.current?.despawn(msg.id, msg.reason, msg.pos as any);
      } else if (msg.t === "damage") {
        if (peerId && msg.to === peerId) {
          const st = useCharacterUI.getState();
          const next = Math.max(0, st.hpCurrent - Math.max(0, msg.amount));
          st.setHp(next, st.hpMax);
        }
      } else if (msg.t === "ob-hp") {
        // Apply authoritative obstacle hp update
        useObstacles.getState().setHp(msg.id, msg.hp);
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
        {/* Darker global lighting to emphasize the player torch */}
        <ambientLight intensity={0.08} />
        <directionalLight position={[5, 8, 5]} intensity={0.2} color={0x6f7a88} castShadow />

        <Physics gravity={[0, -9.81, 0]} maxCcdSubsteps={2} predictionDistance={0.01}>
          <Ground onRightClick={(x, z) => {
            setMoveTarget({ x, z });
            setMarkerTarget({ x, z });
            if (markerTimer.current) window.clearTimeout(markerTimer.current);
            markerTimer.current = window.setTimeout(() => setMarkerTarget(null), 1000);
          }} />
          <Obstacles />
          {/* Player forward light cone (torch-like) */}
          <PlayerLightCone playerRef={playerRef} />
          <Player
            target={moveTarget}
            bodyRef={playerRef}
            animOverrideRef={animOverrideRef}
            performCastRef={performCastRef as any}
            performDashRef={performDashRef as any}
            onCancelMove={() => setMoveTarget(null)}
            onCastMagic={() => {
              performPrimaryCast(
                playerRef.current,
                projRef.current,
                peerId,
                send,
                aimPoint ?? null,
                fireballSpell,
                character,
              );
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
          <WorldReadySensor playerRef={playerRef} onReady={() => setWorldReady(true)} />
        </Physics>

        <TargetMarker target={markerTarget} />
        <AimVisualRoot
          playerRef={playerRef}
          visible={previewVisible}
          range={armedAction === "game.dash" ? dashRange : 20}
          type="arrow"
          color={armedAction === "game.dash" ? "#22d3ee" : "#22d3ee"}
        />

        <CameraController
          targetRef={playerRef}
          follow={camFollow}
          setFollow={setCamFollow}
          zoomIndex={zoomLevel}
          setZoomIndex={setZoomLevel}
        />
        {/* No fog-of-war overlay; lighting handled by PlayerLightCone */}
      </Canvas>

      {/* Fog settings removed */}

      <SpellCastInputAdapter
        onPerformCast={() =>
          performPrimaryCast(
            playerRef.current,
            projRef.current,
            peerId,
            send,
            aimPoint ?? null,
            fireballSpell,
            character,
          )
        }
        onPerformCastAnim={() => performCastRef.current?.()}
        onPerformDash={() => performDashRef.current?.()}
        onPerformDashAnim={undefined}
      />

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
        width={160}
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
        onReconnect={() => {
          // Combine reconnect + ping to nudge liveness quickly
          try { reconnectMissing(); } catch {}
          try { pingAll(); } catch {}
        }}
        onPing={pingAll}
      />
      <PingHUD peers={peersInfo as any} />
      {/* Loading overlay (global) - waits for physics + first frame */}
      <LoaderOverlay
        extraTotal={1}
        extraDone={worldReady ? 1 : 0}
        extraLabel={worldReady ? undefined : "Initialisation de la scène…"}
      />
    </>
  );
}

function performPrimaryCast(
  body: RigidBodyApi | null,
  projMgr: ProjectileManagerRef | null,
  peerId: string | null,
  send: (m: any) => void,
  aimPoint: [number, number, number] | null,
  spell: { cast: (ctx: any, character: any) => any; getConfig: () => { speed: number; range: number; radius: number; damage: number } },
  character?: ReturnType<typeof buildDefaultCharacter>,
) {
  if (!body) {
    console.warn("performPrimaryCast: missing body; aborting cast");
    return;
  }
  if (!spell || typeof (spell as any).cast !== "function") {
    console.warn("performPrimaryCast: invalid spell provided; aborting cast");
    return;
  }
  const char = character ?? buildDefaultCharacter();
  const HALF_Y = (char.skin.fitHeight * char.skin.scale) / 2;
  const ctx = {
    body,
    visualQuaternion: null,
    setAnimOverride: (_st: any, _dur?: number) => {},
    spawnProjectile: (params: { kind: string; speed: number; range: number; radius: number; damage: number }) => {
      const tr = body.translation();
      // Direction from aim if available, otherwise from velocity
      let dirX = 0;
      let dirZ = 1;
      if (aimPoint) {
        const dx = aimPoint[0] - tr.x;
        const dz = aimPoint[2] - tr.z;
        const len = Math.hypot(dx, dz);
        if (len > 1e-4) {
          dirX = dx / len;
          dirZ = dz / len;
        }
      } else {
        const lv = body.linvel();
        const v2 = lv.x * lv.x + lv.z * lv.z;
        if (v2 > 1e-6) {
          const l = Math.sqrt(v2);
          dirX = lv.x / l;
          dirZ = lv.z / l;
        }
      }
      const origin: [number, number, number] = [tr.x + dirX * 0.8, HALF_Y, tr.z + dirZ * 0.8];
      const dir: [number, number, number] = [dirX, 0, dirZ];
      const id = `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const proj = { id, from: peerId ?? null, kind: params.kind, p: origin, d: dir, speed: params.speed, range: params.range, radius: params.radius, damage: params.damage };
      try {
        if (projMgr && typeof projMgr.spawn === "function") {
          projMgr.spawn(proj as any);
        } else {
          console.warn("performPrimaryCast: projMgr not ready; local spawn skipped");
        }
      } catch (e) {
        console.error("performPrimaryCast: error spawning projectile", e);
      }
      try {
        send({ t: "spell-cast", ...(proj as any) } as any);
      } catch (e) {
        console.error("performPrimaryCast: error sending spell-cast message", e);
      }
    },
  };
  try {
    (spell as any).cast(ctx, char as any);
  } catch (e) {
    console.error("performPrimaryCast: spell.cast threw", e);
  }
}

function WorldReadySensor({ playerRef, onReady }: { playerRef: React.MutableRefObject<RigidBodyApi | null>; onReady: () => void }) {
  const { world } = useRapier();
  const frameCount = useRef(0);
  const done = useRef(false);
  useEffect(() => {
    done.current = false;
    frameCount.current = 0;
  }, [world]);
  useFrame(() => {
    if (done.current) return;
    if (!world) return;
    if (!playerRef.current) return;
    frameCount.current += 1;
    if (frameCount.current >= 2) {
      done.current = true;
      try { onReady(); } catch {}
    }
  });
  return null;
}


// (old performPrimaryCast removed; replaced by version above that uses aim when present)


