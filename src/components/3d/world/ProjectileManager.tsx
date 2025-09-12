"use client";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Group, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import MagicBoltVisual from "@/components/3d/effects/MagicBolt";
import type { PeerId, P2PMessage, RemotePlayerState } from "@/types/p2p";
import { useCharacterUI } from "@/stores/character-ui";

export type SpawnProjectileInput = {
  id?: string;
  from: PeerId | null;
  kind: "magic-bolt" | string;
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
  despawn: (id: string) => void;
};

export const ProjectileManager = forwardRef<ProjectileManagerRef, {
  isHost: boolean;
  localId: PeerId | null;
  getLocalPos: () => { x: number; y: number; z: number } | null;
  remotes: RemotePlayerState[];
  onNetSend: (msg: P2PMessage) => void;
}>(({ isHost, localId, getLocalPos, remotes, onNetSend }, ref) => {
  const group = useRef<Group | null>(null);
  const bolts = useRef<Map<string, { node: Group; p: Projectile }>>(new Map());
  const tmpV = useMemo(() => new Vector3(), []);
  const setHp = useCharacterUI((s) => s.setHp);

  function spawn(proj: SpawnProjectileInput) {
    const id = proj.id ?? `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const p: Projectile = { ...proj, id, damage: proj.damage ?? 20, dist: 0, alive: true };
    const node = new Group();
    node.position.set(proj.p[0], proj.p[1], proj.p[2]);
    const child = new Group();
    node.add(child);
    bolts.current.set(id, { node, p });
    if (group.current) group.current.add(node);
  }

  function despawn(id: string) {
    const ent = bolts.current.get(id);
    if (!ent) return;
    ent.p.alive = false;
    bolts.current.delete(id);
    if (group.current) group.current.remove(ent.node);
  }

  useImperativeHandle(ref, () => ({ spawn, despawn }), []);

  useFrame((_s, dt) => {
    const toRemove: string[] = [];
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
      // Host hit detection: simple sphere vs player positions
      if (isHost) {
        const hitRadius = Math.max(0.35, pr.radius);
        // Check local player if not fired by local
        const loc = getLocalPos();
        if (loc && pr.from !== localId) {
          const dx = ent.node.position.x - loc.x;
          const dy = ent.node.position.y - loc.y;
          const dz = ent.node.position.z - loc.z;
          if (dx * dx + dy * dy + dz * dz <= hitRadius * hitRadius) {
            // Apply damage to local (authoritative host)
            onNetSend({ t: "damage", to: localId as any, amount: pr.damage ?? 20, by: pr.from ?? undefined, proj: id } as any);
            toRemove.push(id);
            onNetSend({ t: "proj-despawn", id, reason: "hit" } as any);
            return;
          }
        }
        // Check remotes
        for (const r of remotes) {
          if (!r || r.id === pr.from) continue;
          const dx = ent.node.position.x - r.p[0];
          const dy = ent.node.position.y - r.p[1];
          const dz = ent.node.position.z - r.p[2];
          if (dx * dx + dy * dy + dz * dz <= hitRadius * hitRadius) {
            onNetSend({ t: "damage", to: r.id, amount: pr.damage ?? 20, by: pr.from ?? undefined, proj: id } as any);
            toRemove.push(id);
            onNetSend({ t: "proj-despawn", id, reason: "hit" } as any);
            return;
          }
        }
      }
    });
    // Cleanup removals
    for (const id of toRemove) despawn(id);
  });

  return (
    <group ref={group}>
      {/* Render visuals under each node */}
      {Array.from(bolts.current.values()).map(({ node, p }) => (
        <group key={p.id} position={node.position}>
          {p.kind === "magic-bolt" ? <MagicBoltVisual radius={p.radius} /> : null}
        </group>
      ))}
    </group>
  );
});

export default ProjectileManager;

