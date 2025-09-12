"use client";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, CuboidCollider, RigidBody, useRapier } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Quaternion, Vector3 } from "three";
import type { Group } from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MoveTarget } from "@/types/game";
import { CharacterModel } from "@/components/3d/actors/CharacterModel";
import { OverheadHealth } from "@/components/3d/hud/OverheadHealth";
import { CHARACTER_CLIP_HINTS } from "@/config/animations";
import { useActionEvents } from "@/3d/input/hooks";
import type { AnimStateId } from "@/types/animation";
import { buildDefaultCharacter } from "@/systems/character/defaults";
import { DashSpell } from "@/systems/spells/DashSpell";
import { useCharacterUI } from "@/stores/character-ui";

export function Player({
  target,
  bodyRef,
  animOverrideRef,
  onCancelMove,
  onCastMagic,
}: {
  target: MoveTarget;
  bodyRef?: React.MutableRefObject<RigidBodyApi | null>;
  animOverrideRef?: React.MutableRefObject<AnimStateId | null>;
  onCancelMove?: () => void;
  onCastMagic?: () => void;
}) {
  const body = bodyRef ?? useRef<RigidBodyApi | null>(null);
  const visual = useRef<Group | null>(null);
  // Character configuration (speed/skin/dash)
  const character = useMemo(() => buildDefaultCharacter(), []);
  const speed = character.speed; // m/s en XZ (course normale)
  const DASH_SPEED = character.dashSpeed; // m/s en XZ (doit être > speed)
  const DASH_DURATION_MS = character.dashDurationMs; // durée de l'effet dash
  const arriveRadius = 0.05; // m
  const { world, rapier } = useRapier();
  const [overrideAnim, setOverrideAnim] = useState<AnimStateId | null>(null);
  const overrideTimer = useRef<number | null>(null);
  // État transient du dash: direction figée et fenêtre temporelle
  const dashUntil = useRef<number>(0);
  const dashDir = useRef<{ x: number; z: number }>({ x: 0, z: 1 });
  const dashSpell = useMemo(() => new DashSpell(), []);
  // Fenêtre "chant incantation" (empêche le déplacement tant qu'un sort non-mobilité est en cours)
  const castingUntil = useRef<number>(0);
  // Anti-stuck: timers pour détecter l'immobilité et limiter les nudges
  const lastGoodMoveAt = useRef<number>(performance.now());
  const lastNudgeAt = useRef<number>(0);
  const setHp = useCharacterUI((s) => s.setHp);
  const setCooldownUntil = useCharacterUI((s) => s.setCooldownUntil);
  useEffect(() => {
    setHp(character.hp.current, character.hp.max);
  }, [character, setHp]);

  // Visual scale only (keep collider and ground ring like before)
  const VISUAL_SCALE = character.skin.scale; // visuel
  const VISUAL_FIT_HEIGHT = character.skin.fitHeight; // meters
  const EFFECTIVE_HEIGHT = VISUAL_FIT_HEIGHT * VISUAL_SCALE;
  const HALF_Y = EFFECTIVE_HEIGHT / 2;
  const BASE_HALF_Y = 1.0; // baseline for 2.0m collider
  const RING_SCALE = HALF_Y / BASE_HALF_Y;
  const HEAD_Y = -1 + EFFECTIVE_HEIGHT + 0.08; // au-dessus de la tête

  // Keep external ref in sync (for P2P announcer)
  useEffect(() => {
    if (animOverrideRef) animOverrideRef.current = overrideAnim;
  }, [overrideAnim, animOverrideRef]);

  // Dash: force un mouvement rapide vers l'avant (plus vite que course) + anim override
  useActionEvents("game.dash", (ev) => {
    if (ev.type !== "digital" || ev.phase !== "pressed") return;
    const b = body.current;
    if (!b) return;
    // Cancel any pending move order when dash is triggered
    try { onCancelMove?.(); } catch {}
    const res = dashSpell.cast(
      {
        body: b,
        visualQuaternion: visual.current?.quaternion ?? null,
        setAnimOverride: (st, duration) => {
          setOverrideAnim(st);
          if (overrideTimer.current) window.clearTimeout(overrideTimer.current);
          if (duration && st) {
            overrideTimer.current = window.setTimeout(() => setOverrideAnim(null), duration);
          }
        },
      },
      character,
    );
    if (res.ok && res.dash) {
      dashDir.current.x = res.dash.dir.x;
      dashDir.current.z = res.dash.dir.z;
      dashUntil.current = res.dash.until;
      setCooldownUntil("dash", performance.now() + 700);
    }
  });

  // Sort non-mobilité (Spell #1): stop current move and cast on the spot
  useActionEvents("game.spell.1", (ev) => {
    if (ev.type !== "digital" || ev.phase !== "pressed") return;
    castingUntil.current = performance.now() + 600; // fenêtre d'incantation
    // Play the specific attack clip (mapped to standing_1h_magic_attack_01)
    setOverrideAnim("attack");
    if (overrideTimer.current) window.clearTimeout(overrideTimer.current);
    overrideTimer.current = window.setTimeout(() => setOverrideAnim(null), 500);
    // Annuler la cible de déplacement tant qu'on n'a pas redéfini une position
    try { onCancelMove?.(); } catch {}
    try { onCastMagic?.(); } catch {}
    // UI cooldown for primary
    setCooldownUntil("primary", performance.now() + 800);
  });

  useFrame((_state, dt) => {
    const b = body.current;
    if (!b) return;
    const t = b.translation();
    const lv = b.linvel();
    const now = performance.now();
    // Dash override: s'applique même si aucune cible n'est définie
    if (now < dashUntil.current) {
      b.setLinvel(
        { x: dashDir.current.x * DASH_SPEED, y: lv.y, z: dashDir.current.z * DASH_SPEED },
        true,
      );
    } else {
      // Si on est en train d'incanter (sort immobile): stopper mouvement horizontal
      if (now < castingUntil.current) {
        if (Math.abs(lv.x) > 0.001 || Math.abs(lv.z) > 0.001) {
          b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
        }
        // Orientation smoothing still happens below
      } else if (!target) {
        // Pas de cible: rester à l'arrêt
        if (Math.abs(lv.x) > 0.001 || Math.abs(lv.z) > 0.001) {
          b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
        }
      } else {
      const dx = target.x - t.x;
      const dz = target.z - t.z;
      const dist = Math.hypot(dx, dz);
      if (dist < arriveRadius) {
        b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
        return;
      }
      const nx = dx / dist;
      const nz = dz / dist;

      // Steering simple via raycasts
      let dirX = nx;
      let dirZ = nz;
      if (world && rapier) {
        const originY = 0.5;
        const maxLook = Math.min(dist, 6);
        const ray = new rapier.Ray(
          { x: t.x, y: originY, z: t.z },
          { x: nx, y: 0, z: nz }
        );
        const hit = world.castRay(ray, maxLook, true);
        const needsAvoid = !!hit && hit.toi < maxLook * 0.9;
        if (needsAvoid) {
          const deg = [20, -20, 35, -35, 50, -50, 65, -65];
          let found = false;
          for (let i = 0; i < deg.length; i++) {
            const a = (deg[i] * Math.PI) / 180;
            const rx = nx * Math.cos(a) - nz * Math.sin(a);
            const rz = nx * Math.sin(a) + nz * Math.cos(a);
            const rRay = new rapier.Ray(
              { x: t.x, y: originY, z: t.z },
              { x: rx, y: 0, z: rz }
            );
            const rHit = world.castRay(rRay, maxLook, true);
            if (!rHit) {
              dirX = rx;
              dirZ = rz;
              found = true;
              break;
            }
          }
          if (!found) {
            let bestRx = nx,
              bestRz = nz,
              bestToi = 0;
            const wide = [80, -80, 100, -100, 120, -120];
            for (let i = 0; i < wide.length; i++) {
              const a = (wide[i] * Math.PI) / 180;
              const rx = nx * Math.cos(a) - nz * Math.sin(a);
              const rz = nx * Math.sin(a) + nz * Math.cos(a);
              const rRay = new rapier.Ray(
                { x: t.x, y: originY, z: t.z },
                { x: rx, y: 0, z: rz }
              );
              const rHit = world.castRay(rRay, maxLook, true);
              const toi = rHit ? rHit.toi : maxLook;
              if (toi > bestToi) {
                bestToi = toi;
                bestRx = rx;
                bestRz = rz;
              }
            }
            dirX = bestRx;
            dirZ = bestRz;
          }
        }
      }
      const len = Math.hypot(dirX, dirZ) || 1;
      b.setLinvel({ x: (dirX / len) * speed, y: lv.y, z: (dirZ / len) * speed }, true);
      }
    }

    // Orientation visuelle vers la direction de déplacement (lissée)
    const v2 = lv.x * lv.x + lv.z * lv.z;
    if (visual.current && v2 > 1e-6) {
      const targetYaw = Math.atan2(lv.x, lv.z);
      const targetQ = new Quaternion().setFromAxisAngle(
        new Vector3(0, 1, 0),
        targetYaw
      );
      const rotSmoothing = 12;
      const alpha = 1 - Math.exp(-rotSmoothing * dt);
      visual.current.quaternion.slerp(targetQ, alpha);
    }

    // Anti-stuck: si on est quasi immobile en XZ pendant > 200 ms, pousser légèrement vers une direction libre
    const speedXZ = Math.sqrt(v2);
    if (speedXZ > 0.2) {
      lastGoodMoveAt.current = now;
    }
    const seemsStuck = speedXZ < 0.02 && now - lastGoodMoveAt.current > 220;
    if (seemsStuck && world && rapier && now - lastNudgeAt.current > 120) {
      const originY = Math.max(0.5, HALF_Y * 0.6);
      const probe = 0.8; // distance de recherche d'une issue
      let bestDirX = 0, bestDirZ = 0, bestToi = -1;
      // Scanner 16 directions autour pour trouver la plus dégagée
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rx = Math.sin(a);
        const rz = Math.cos(a);
        const ray = new rapier.Ray({ x: t.x, y: originY, z: t.z }, { x: rx, y: 0, z: rz });
        const hit = world.castRay(ray, probe, true);
        const toi = hit ? hit.toi : probe; // plus grand = plus libre
        if (toi > bestToi) {
          bestToi = toi;
          bestDirX = rx;
          bestDirZ = rz;
        }
      }
      // Calculer un petit pas vers la zone libre (éviter les grands téléports)
      const step = Math.min(0.35, Math.max(0.12, (bestToi / probe) * 0.25));
      // Appliquer translation sans modifier Y, et annuler brièvement la vitesse horizontale
      b.setTranslation({ x: t.x + bestDirX * step, y: t.y, z: t.z + bestDirZ * step }, true);
      b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
      lastNudgeAt.current = now;
      // Reset du timer de mouvement: laisser 150 ms avant une nouvelle tentative
      lastGoodMoveAt.current = now + 150;
    }
  });

  return (
    <RigidBody
      ref={body as any}
      position={[0, 3, 0]}
      ccd
      canSleep={false}
      enabledRotations={[false, false, false]}
    >
      {/* Collider joueur: capsule (meilleure glisse le long des murs) */}
      {(() => {
        // Capsule verticale: demi-hauteur (sans les calottes) et rayon
        const radius = 0.35 * RING_SCALE;
        const halfHeight = Math.max(0.2, HALF_Y - radius);
        return (
          <CapsuleCollider args={[halfHeight, radius]} friction={0} restitution={0} />
        );
      })()}
      {/* Visuel */}
      <group ref={visual}>
        {/* UX: blue translucent ground ring (annulus) under local player */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -(HALF_Y + 0.02), 0]} receiveShadow>
          <ringGeometry args={[0.55 * RING_SCALE, 0.85 * RING_SCALE, 32]} />
          <meshStandardMaterial color="#22d3ee" transparent opacity={0.45} />
        </mesh>
        {/* Character visual with animations */}
        <CharacterModel
          // horizontal speed magnitude used to pick locomotion anim
          getSpeed={() => {
            const b = body.current;
            if (!b) return 0;
            const lv = b.linvel();
            return Math.hypot(lv.x, lv.z);
          }}
          clipHints={CHARACTER_CLIP_HINTS}
          overrideState={overrideAnim}
          // Visual size from Character skin, et offset pieds->sol dynamique
          fitHeight={VISUAL_FIT_HEIGHT}
          scale={VISUAL_SCALE}
          yOffset={-HALF_Y}
        />
        {/* 3D overhead health bar */}
        <OverheadHealth position={[0, HEAD_Y, 0]} width={0.9} height={0.08} />
      </group>
    </RigidBody>
  );
}
