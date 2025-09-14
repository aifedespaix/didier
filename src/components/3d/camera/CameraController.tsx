"use client";
import { useFrame, useThree } from "@react-three/fiber";
import type { RigidBodyApi } from "@react-three/rapier";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import { useActionEvents } from "~/3d/input/hooks";

interface CameraPreset {
	/** Vertical distance from the target in world units. */
	radius: number;
	/** Camera pitch in degrees. 90° yields a top-down view. */
	pitchDeg: number;
	/** Camera yaw in degrees. */
	yawDeg: number;
}

export interface CameraControllerProps {
	targetRef: React.MutableRefObject<RigidBodyApi | null>;
	follow: boolean;
	setFollow: (v: boolean) => void;
}

export function CameraController({
	targetRef,
	follow,
	setFollow,
}: CameraControllerProps) {
	const { camera } = useThree();

	const preset: CameraPreset = useMemo(
		() => ({ radius: 20, pitchDeg: 90, yawDeg: 0 }),
		[],
	);

	useActionEvents("camera.follow.toggle", (ev) => {
		if (ev.type === "digital" && ev.phase === "pressed") setFollow((f) => !f);
	});

	const smoothedPos = useRef(
		new Vector3(camera.position.x, camera.position.y, camera.position.z),
	);
	const smoothedLook = useRef(new Vector3(0, 0, 0));
	const targetPos = useRef(new Vector3());
	const desiredPos = useRef(new Vector3());
	const initialized = useRef(false);

	useFrame((_state, dt) => {
		const body = targetRef.current;
		const smoothing = 8;
		const alpha = 1 - Math.exp(-smoothing * dt);

		const t = body ? body.translation() : { x: 0, y: 0, z: 0 };
		const target = targetPos.current.set(t.x, t.y, t.z);

		const desired = desiredPos.current.set(
			target.x,
			target.y + preset.radius,
			target.z,
		);

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
