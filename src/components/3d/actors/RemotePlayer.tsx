"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Object3D, SpotLight } from "three";
import { Euler, Quaternion, Vector3 } from "three";
import { CharacterModel } from "@/components/3d/actors/CharacterModel";
import { OverheadHealth } from "@/components/3d/hud/OverheadHealth";
import { CHARACTER_CLIP_HINTS } from "@/config/animations";
import { buildDefaultCharacter } from "@/systems/character/defaults";
import type { RemotePlayerState } from "@/types/p2p";

export function RemotePlayer({ state }: { state: RemotePlayerState }) {
	const visual = useRef<Group | null>(null);
	// Local smoothing buffers
	const pos = useRef(new Vector3(0, 0, 0));
	const targetPos = useRef(new Vector3(...state.p));
	const rot = useRef(new Quaternion());
	const targetRot = useRef(
		new Quaternion().setFromEuler(new Euler(0, state.y, 0)),
	);
	const lastPos = useRef(new Vector3(...state.p));
	const speedRef = useRef(0);

	// Character visual config (mirror local)
	const character = useMemo(() => buildDefaultCharacter(), []);
	const VISUAL_SCALE = character.skin.scale;
	const VISUAL_FIT_HEIGHT = character.skin.fitHeight;
	const EFFECTIVE_HEIGHT = VISUAL_FIT_HEIGHT * VISUAL_SCALE;
	const HALF_Y = EFFECTIVE_HEIGHT / 2;
	const BASE_HALF_Y = 1.0;
	const RING_SCALE = HALF_Y / BASE_HALF_Y;
	const HEAD_Y = -1 + EFFECTIVE_HEIGHT + 0.08;
	// Light cone settings (mirror local player)
	const LIGHT_Y = 1.6;
	const LIGHT_DISTANCE = 42;
	const LIGHT_INTENSITY = 4.2;
	const LIGHT_ANGLE = (48 * Math.PI) / 180;
	const lightRef = useRef<SpotLight | null>(null);
	const lightTargetRef = useRef<Object3D | null>(null);

	useEffect(() => {
		if (lightRef.current && lightTargetRef.current) {
			lightRef.current.target = lightTargetRef.current as Object3D;
			try {
				lightRef.current.shadow.mapSize.set(1024, 1024);
				lightRef.current.shadow.bias = -0.0005;
			} catch {}
		}
	}, []);

	useFrame((_s, dt) => {
		// Update targets from latest state
		const [x, y, z] = state.p;
		targetPos.current.set(x, y, z);
		targetRot.current.setFromEuler(new Euler(0, state.y, 0));

		// Smooth follow
		const alphaPos = 1 - Math.exp(-10 * dt); // ~smooth
		const alphaRot = 1 - Math.exp(-10 * dt);
		pos.current.lerp(targetPos.current, alphaPos);
		rot.current.slerp(targetRot.current, alphaRot);

		// Estimate horizontal speed from last position (for locomotion)
		const dx = pos.current.x - lastPos.current.x;
		const dz = pos.current.z - lastPos.current.z;
		const dist = Math.hypot(dx, dz);
		const s = dt > 0 ? dist / dt : 0;
		// mild smoothing
		speedRef.current = speedRef.current * 0.85 + s * 0.15;
		lastPos.current.copy(pos.current);

		if (visual.current) {
			visual.current.position.copy(pos.current);
			visual.current.quaternion.copy(rot.current);
		}

		// Update remote light cone position and direction
		if (lightRef.current && lightTargetRef.current) {
			lightRef.current.position.set(pos.current.x, LIGHT_Y, pos.current.z);
			const yaw = typeof state.aim === "number" ? state.aim : state.y;
			const dirX = Math.sin(yaw);
			const dirZ = Math.cos(yaw);
			lightTargetRef.current.position.set(
				pos.current.x + dirX,
				LIGHT_Y,
				pos.current.z + dirZ,
			);
			lightTargetRef.current.updateMatrixWorld();
			lightRef.current.target.updateMatrixWorld();
		}
	});

	return (
		<group ref={visual}>
			{/* Remote light cone to match peer's aim/direction */}
			<spotLight
				ref={lightRef}
				color="#ffdca8"
				intensity={LIGHT_INTENSITY}
				distance={LIGHT_DISTANCE}
				angle={LIGHT_ANGLE}
				penumbra={0.5}
				decay={1.0}
				castShadow
			/>
			<object3D ref={lightTargetRef} />
			{/* UX: red translucent ground ring (annulus) under remote players */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, -(HALF_Y + 0.02), 0]}
				receiveShadow
			>
				<ringGeometry args={[0.55 * RING_SCALE, 0.85 * RING_SCALE, 32]} />
				<meshStandardMaterial color="#ef4444" transparent opacity={0.45} />
			</mesh>
			{/* Character visual with animations (remote) */}
			<CharacterModel
				getSpeed={() => speedRef.current}
				overrideState={state.a ?? null}
				clipHints={CHARACTER_CLIP_HINTS}
				fitHeight={VISUAL_FIT_HEIGHT}
				scale={VISUAL_SCALE}
				yOffset={-HALF_Y}
			/>
			{/* 3D overhead health bar for remote if provided */}
			{state.h && (
				<OverheadHealth
					position={[0, HEAD_Y, 0]}
					width={0.9}
					height={0.08}
					value={state.h[0]}
					max={state.h[1]}
				/>
			)}
		</group>
	);
}
