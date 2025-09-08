"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import type { RigidBodyApi } from "@react-three/rapier";
import { useActionEvents } from "@/3d/input/hooks";

type ZoomPreset = { radius: number; pitchDeg: number; yawDeg: number };

export interface CameraControllerProps {
  targetRef: React.MutableRefObject<RigidBodyApi | null>;
  follow: boolean;
  setFollow: (v: boolean) => void;
  zoomIndex: number;
  setZoomIndex: (i: number) => void;
}

export function CameraController({ targetRef, follow, setFollow, zoomIndex, setZoomIndex }: CameraControllerProps) {
  const { camera } = useThree();

  const presets: ZoomPreset[] = useMemo(
    () => [
      { radius: 24, pitchDeg: 62, yawDeg: 45 },
      { radius: 20, pitchDeg: 60, yawDeg: 45 },
      { radius: 16, pitchDeg: 58, yawDeg: 45 },
      { radius: 12, pitchDeg: 56, yawDeg: 45 },
      { radius: 9, pitchDeg: 54, yawDeg: 45 },
    ],
    [],
  );

  useActionEvents("camera.follow.toggle", (ev) => {
    if (ev.type === "digital" && ev.phase === "pressed") setFollow((f) => !f);
  });
  useActionEvents("camera.zoom.in", (ev) => {
    if (ev.type === "digital" && ev.phase === "pressed") setZoomIndex((i) => Math.min(i + 1, presets.length - 1));
  });
  useActionEvents("camera.zoom.out", (ev) => {
    if (ev.type === "digital" && ev.phase === "pressed") setZoomIndex((i) => Math.max(i - 1, 0));
  });

  const smoothedPos = useRef(new Vector3(camera.position.x, camera.position.y, camera.position.z));
  const smoothedLook = useRef(new Vector3(0, 0, 0));
  const targetPos = useRef(new Vector3());
  const desiredPos = useRef(new Vector3());
  const initialized = useRef(false);

  const deg2rad = (d: number) => (d * Math.PI) / 180;

  useFrame((_state, dt) => {
    const body = targetRef.current;
    const smoothing = 8;
    const alpha = 1 - Math.exp(-smoothing * dt);

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

    smoothedPos.current.lerp(desired, alpha);
    smoothedLook.current.lerp(target, alpha);

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

