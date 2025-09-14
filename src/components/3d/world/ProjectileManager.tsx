"use client";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Group, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import MagicBoltVisual from "@/components/3d/effects/MagicBolt";
import FireballVisual from "@/components/3d/effects/Fireball";
import ExplosionVisual from "@/components/3d/effects/Explosion";
import type { PeerId, P2PMessage, RemotePlayerState } from "@/types/p2p";
import { useObstacles } from "@/stores/obstacles";
import { OBSTACLE_ITEMS } from "@/components/3d/props/obstacle-config";
import { WORLD } from "@/config/world";

export type SpawnProjectileInput = {
  id?: string;
  from: PeerId | null;
  kind: "magic-bolt" | "fireball" | string;
  p: [number, number, number];
  d: [number, number, number];
  speed: number;
  range: number; // meters
  radius: number; // meters
  damage?: number;
};

type Projectile = SpawnProjectileInput & {
  id: string;
  dist: number; // traveled distance
  alive: boolean;
};

export type ProjectileManagerRef = {
  spawn: (proj: SpawnProjectileInput) => void;
  despawn: (id: string, reason?: string | null, pos?: [number, number, number]) => void;
};

export const ProjectileManager = forwardRef<ProjectileManagerRef, {
  isHost: boolean;
  localId: PeerId | null;
  getLocalPos: () => { x: number; y: number; z: number } | null;
  remotes: RemotePlayerState[];
  onNetSend: (msg: P2PMessage) => void;
}>(({ isHost, localId, getLocalPos, remotes, onNetSend }, ref) => {
  const bolts = useRef<Map<string, { node: Group; p: Projectile }>>(new Map());
  const tmpV = useMemo(() => new Vector3(), []);
  const [version, setVersion] = useState(0); // trigger React re-render on spawn/despawn
  // Precompute static wall AABBs matching Ground walls
  const walls = useMemo(() => {
    const t = WORLD.wallThickness;
    const h = WORLD.wallHeight;
    const half = { x: WORLD.sizeX / 2, y: h / 2, z: WORLD.sizeZ / 2 };
    return [
      // North wall (z = +half.z)
      { center: { x: 0, y: half.y, z: half.z }, half: { x: half.x, y: half.y, z: t / 2 } },
      // South wall (z = -half.z)
      { center: { x: 0, y: half.y, z: -half.z }, half: { x: half.x, y: half.y, z: t / 2 } },
      // East wall (x = +half.x)
      { center: { x: half.x, y: half.y, z: 0 }, half: { x: t / 2, y: half.y, z: half.z } },
      // West wall (x = -half.x)
      { center: { x: -half.x, y: half.y, z: 0 }, half: { x: t / 2, y: half.y, z: half.z } },
    ];
  }, []);

  function spawn(proj: SpawnProjectileInput) {
    const id = proj.id ?? `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const p: Projectile = { ...proj, id, damage: proj.damage ?? 20, dist: 0, alive: true };
    const node = new Group();
    node.position.set(proj.p[0], proj.p[1], proj.p[2]);
    const child = new Group();
    node.add(child);
    bolts.current.set(id, { node, p });
    setVersion((v) => v + 1);
  }

  function despawn(id: string, reason?: string | null, pos?: [number, number, number]) {
    const ent = bolts.current.get(id);
    if (!ent) return;
    // If despawn due to hit and we have/no pos, spawn explosion at last known position
    if (reason === "hit") {
      const p = pos ?? [ent.node.position.x, ent.node.position.y, ent.node.position.z];
      spawnExplosion(p);
    }
    ent.p.alive = false;
    bolts.current.delete(id);
    setVersion((v) => v + 1);
  }

  useImperativeHandle(ref, () => ({ spawn, despawn }), []);

  // Simple explosion registry managed by this component
  const explosions = useRef<Array<{ id: string; pos: [number, number, number]; startMs: number; durationMs: number }>>([]);
  function spawnExplosion(pos: [number, number, number]) {
    explosions.current.push({ id: `exp_${Math.random().toString(36).slice(2, 8)}`, pos, startMs: performance.now(), durationMs: 520 });
    setVersion((v) => v + 1);
  }

  useFrame((_s, dt) => {
    const toRemove: string[] = [];
    const explodeAt: Array<[number, number, number]> = [];
    // Move and check
    bolts.current.forEach((ent, id) => {
      const pr = ent.p;
      if (!pr.alive) {
        toRemove.push(id);
        return;
      }
      const dir = tmpV.set(pr.d[0], pr.d[1], pr.d[2]);
      const step = Math.max(0, dt) * pr.speed;
      ent.node.position.addScaledVector(dir, step);
      pr.dist += step;
      // range expire
      if (pr.dist >= pr.range) {
        toRemove.push(id);
        // Broadcast despawn so others remove promptly
        onNetSend({ t: "proj-despawn", id, reason: "end" } as any);
        return;
      }
      // Host hit detection: simple sphere vs players and static obstacles
      if (isHost) {
        const hitRadius = Math.max(0.35, pr.radius);
        // Check local player if not fired by local
        const loc = getLocalPos();
        if (loc && pr.from !== localId) {
          const dx = ent.node.position.x - loc.x;
          const dz = ent.node.position.z - loc.z;
          if (dx * dx + dz * dz <= hitRadius * hitRadius) {
            // Apply damage to local (authoritative host)
            onNetSend({ t: "damage", to: localId as any, amount: pr.damage ?? 20, by: pr.from ?? undefined, proj: id } as any);
            explodeAt.push([ent.node.position.x, ent.node.position.y, ent.node.position.z]);
            toRemove.push(id);
            onNetSend({ t: "proj-despawn", id, reason: "hit", pos: [ent.node.position.x, ent.node.position.y, ent.node.position.z] } as any);
            return;
          }
        }
        // Check remotes
        for (const r of remotes) {
          if (!r || r.id === pr.from) continue;
          const dx = ent.node.position.x - r.p[0];
          const dz = ent.node.position.z - r.p[2];
          if (dx * dx + dz * dz <= hitRadius * hitRadius) {
            onNetSend({ t: "damage", to: r.id, amount: pr.damage ?? 20, by: pr.from ?? undefined, proj: id } as any);
            explodeAt.push([ent.node.position.x, ent.node.position.y, ent.node.position.z]);
            toRemove.push(id);
            onNetSend({ t: "proj-despawn", id, reason: "hit", pos: [ent.node.position.x, ent.node.position.y, ent.node.position.z] } as any);
            return;
          }
        }

        // Check obstacles (static AABBs from config, alive per store)
        const obsState = useObstacles.getState();
        for (const cfg of OBSTACLE_ITEMS) {
          const st = obsState.obstacles.find((o) => o.id === cfg.id);
          if (!st || st.hp <= 0) continue;
          // AABB centered at [cfg.pos.x, halfY, cfg.pos.z], extents half-size
          const half = { x: cfg.size[0] / 2, y: cfg.size[1] / 2, z: cfg.size[2] / 2 };
          const center = { x: cfg.pos[0], y: half.y, z: cfg.pos[1] };
          // sphere vs AABB
          const sx = ent.node.position.x;
          const sy = ent.node.position.y;
          const sz = ent.node.position.z;
          const cx = Math.max(center.x - half.x, Math.min(sx, center.x + half.x));
          const cy = Math.max(center.y - half.y, Math.min(sy, center.y + half.y));
          const cz = Math.max(center.z - half.z, Math.min(sz, center.z + half.z));
          const dx = sx - cx, dy = sy - cy, dz = sz - cz;
          if (dx * dx + dy * dy + dz * dz <= hitRadius * hitRadius) {
            // Apply obstacle damage: use projectile's configured damage
            const newHp = obsState.applyDamage(cfg.id, pr.damage ?? 20);
            // Broadcast authoritative hp to clients
            onNetSend({ t: "ob-hp", id: cfg.id, hp: newHp } as any);
            // Despawn projectile on hit and broadcast
            explodeAt.push([ent.node.position.x, ent.node.position.y, ent.node.position.z]);
            toRemove.push(id);
            onNetSend({ t: "proj-despawn", id, reason: "hit", pos: [ent.node.position.x, ent.node.position.y, ent.node.position.z] } as any);
            return;
          }
        }

        // Check arena walls (treat walls as static AABBs, explode without damage)
        for (const w of walls) {
          const sx = ent.node.position.x;
          const sy = ent.node.position.y;
          const sz = ent.node.position.z;
          const cx = Math.max(w.center.x - w.half.x, Math.min(sx, w.center.x + w.half.x));
          const cy = Math.max(w.center.y - w.half.y, Math.min(sy, w.center.y + w.half.y));
          const cz = Math.max(w.center.z - w.half.z, Math.min(sz, w.center.z + w.half.z));
          const dx = sx - cx, dy = sy - cy, dz = sz - cz;
          if (dx * dx + dy * dy + dz * dz <= hitRadius * hitRadius) {
            explodeAt.push([ent.node.position.x, ent.node.position.y, ent.node.position.z]);
            toRemove.push(id);
            onNetSend({ t: "proj-despawn", id, reason: "hit", pos: [ent.node.position.x, ent.node.position.y, ent.node.position.z] } as any);
            return;
          }
        }
      }
    });
    // Cleanup removals
    for (let i = 0; i < toRemove.length; i++) {
      const id = toRemove[i];
      const p = explodeAt[i];
      despawn(id, p ? "hit" : undefined, p as any);
    }

    // Update explosions lifetime
    const now = performance.now();
    explosions.current = explosions.current.filter((e) => now - e.startMs < e.durationMs);
    if (explosions.current.length > 0) setVersion((v) => v + 1);
  });

  

  return (
    <group>
      {/* Render visuals attached to the underlying Three.Group nodes */}
      {Array.from(bolts.current.values()).map(({ node, p }) => (
        <primitive key={p.id} object={node}>
          {p.kind === "magic-bolt" ? <MagicBoltVisual radius={p.radius} /> : null}
          {p.kind === "fireball" ? <FireballVisual radius={p.radius} /> : null}
        </primitive>
      ))}
      {explosions.current.map((e) => (
        <group key={e.id} position={e.pos}>
          <ExplosionVisual radius={0.9} duration={0.5} color="#ffae00" />
        </group>
      ))}
    </group>
  );
});

export default ProjectileManager;
