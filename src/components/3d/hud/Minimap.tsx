"use client";
import { useCallback, useEffect, useRef } from "react";
import type { RigidBodyApi } from "@react-three/rapier";
import { HALF, WORLD } from "@/config/world";
import type { MoveTarget } from "@/types/game";
import { OBSTACLE_ITEMS } from "@/components/3d/props/obstacle-config";
import { useObstacles } from "@/stores/obstacles";

type MinimapProps = {
  playerRef: React.MutableRefObject<RigidBodyApi | null>;
  target: MoveTarget;
  onSetTarget: (x: number, z: number) => void;
  width?: number; // px
};

export function Minimap({
  playerRef,
  target,
  onSetTarget,
  width = 220,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const height = Math.round((width / WORLD.sizeX) * WORLD.sizeZ); // keep aspect 150:200
  const obs = useObstacles((s) => s.obstacles);
  const aliveById = useRef<Record<string, number>>({});
  aliveById.current = Object.fromEntries(obs.map((o) => [o.id, o.hp]));

  // Map world XZ -> inner minimap pixels (0..innerW, 0..innerH)
  const worldToMini = useCallback(
    (x: number, z: number, innerW: number, innerH: number) => {
      const nx = (x + HALF.x) / WORLD.sizeX; // 0..1 (left->right)
      const nz = (z + HALF.z) / WORLD.sizeZ; // 0..1 (top is -Z, forward moves up)
      return { px: nx * innerW, py: nz * innerH };
    },
    []
  );

  // Map inner minimap pixels (0..innerW, 0..innerH) -> world XZ
  const miniToWorld = useCallback((px: number, py: number, innerW: number, innerH: number) => {
    const nx = Math.min(1, Math.max(0, px / innerW));
    const ny = Math.min(1, Math.max(0, py / innerH));
    const x = nx * WORLD.sizeX - HALF.x;
    const z = ny * WORLD.sizeZ - HALF.z;
    return { x, z };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Background panel
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(10,12,16,0.85)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      roundRect(ctx, 0, 0, width, height, 10);
      ctx.fill();
      ctx.stroke();

      // Playfield outline
      ctx.save();
      ctx.translate(8, 8);
      const innerW = width - 16;
      const innerH = height - 16;
      ctx.fillStyle = "#1f1640"; // dark purple
      ctx.strokeStyle = "#5b21b6";
      roundRect(ctx, 0, 0, innerW, innerH, 6);
      ctx.fill();
      ctx.stroke();

      // Fit world area to inner rect
      const sx = innerW / WORLD.sizeX;
      const sz = innerH / WORLD.sizeZ;

      // Walls/bounds
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, innerW, innerH);

      // Obstacles (only alive)
      ctx.fillStyle = "#6d28d9";
      for (const o of OBSTACLE_ITEMS) {
        if (!aliveById.current[o.id] || aliveById.current[o.id] <= 0) continue;
        const x = (o.pos[0] + HALF.x) * sx;
        const z = (o.pos[1] + HALF.z) * sz; // match world->mini orientation (top = -Z)
        const w = o.size[0] * sx;
        const h = o.size[2] * sz;
        ctx.fillRect(x - w / 2, z - h / 2, w, h);
      }

      // Target marker
      if (target) {
        const { px, py } = worldToMini(target.x, target.z, innerW, innerH);
        const mx = px;
        const my = py;
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Player
      const body = playerRef.current;
      if (body) {
        const t = body.translation();
        const { px, py } = worldToMini(t.x, t.z, innerW, innerH);
        const mx = px;
        const my = py;
        ctx.fillStyle = "#67e8f9";
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [height, width, playerRef, target, worldToMini]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      // Constrain to inner area (8px padding)
      const innerW = width - 16;
      const innerH = height - 16;
      const px = Math.min(Math.max(localX - 8, 0), innerW);
      const py = Math.min(Math.max(localY - 8, 0), innerH);
      const world = miniToWorld(px, py, innerW, innerH);
      onSetTarget(world.x, world.z);
    },
    [height, width, miniToWorld, onSetTarget]
  );

  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        pointerEvents: "auto",
        userSelect: "none",
      }}
      title="Minimap (Right-click to move)"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onContextMenu={handleContextMenu}
        style={{ cursor: "crosshair", borderRadius: 12 }}
      />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
