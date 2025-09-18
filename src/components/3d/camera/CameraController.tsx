"use client";
import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Vector3 } from "three";
import { useActionEvents } from "~/3d/input/hooks";

const MIN_RADIUS = 10;
const MAX_RADIUS = 40;
const ZOOM_STEP = 2;

export interface CameraControllerProps {
	targetRef: React.MutableRefObject<RapierRigidBody | null>;
	follow: boolean;
	setFollow: Dispatch<SetStateAction<boolean>>;
}

export function CameraController({
	targetRef,
	follow,
	setFollow,
}: CameraControllerProps) {
	const { camera } = useThree();

	// Camera vertical distance from the target in world units.
	const radius = useRef(20);

	useActionEvents("camera.zoom.in", (ev) => {
		if (ev.type === "digital" && ev.phase === "pressed") {
			radius.current = Math.max(MIN_RADIUS, radius.current - ZOOM_STEP);
		}
	});

	useActionEvents("camera.zoom.out", (ev) => {
		if (ev.type === "digital" && ev.phase === "pressed") {
			radius.current = Math.min(MAX_RADIUS, radius.current + ZOOM_STEP);
		}
	});

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
			target.y + radius.current,
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
