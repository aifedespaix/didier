"use client";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useCallback, useEffect, useRef } from "react";
import type { Mesh } from "three";
import { HALF, WORLD } from "@/config/world";
import { useAim } from "@/stores/aim";

export function Ground({
	onRightClick,
}: {
	onRightClick?: (x: number, z: number) => void;
}) {
	// Dimensions du terrain et des murs (m)
	const SIZE_X = WORLD.sizeX; // X (largeur)
	const SIZE_Z = WORLD.sizeZ; // Z (profondeur)
	const HALF_X = HALF.x;
	const HALF_Z = HALF.z;
	const WALL_THICKNESS = WORLD.wallThickness; // épaisseur murs
	const WALL_HEIGHT = WORLD.wallHeight; // hauteur des murs visibles (m)

	// Couleurs
	const GROUND_COLOR = "#7c3aed"; // violet
	const WALL_COLOR = "#4c1d95"; // violet foncé

	const meshRef = useRef<Mesh | null>(null);
	const hovering = useRef(false);
	const rmbDown = useRef(false);
	const lastUpdate = useRef(0);
	const lastAimUpdate = useRef(0);
	const setAim = useAim((s) => s.setPoint);

	const updateFromPoint = useCallback(
		(p: { x: number; y: number; z: number }) => {
			if (!onRightClick) return;
			onRightClick(p.x, p.z);
		},
		[onRightClick],
	);

	const handlePointerDown = useCallback(
		(e: ThreeEvent<PointerEvent>) => {
			if (e.button !== 2 || !onRightClick) return; // Right click disabled if handler absent
			rmbDown.current = true;
			// Capture pointer to keep receiving move events reliably while held
			const native = e.nativeEvent;
			const target = native.target as Element | null;
			try {
				if (target && typeof target.setPointerCapture === "function") {
					target.setPointerCapture(native.pointerId);
				}
			} catch {}
			e.stopPropagation();
			native.preventDefault();
			const p = e.point;
			if (p) updateFromPoint(p);
		},
		[updateFromPoint],
	);

	const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
		if (e.button === 2) {
			rmbDown.current = false;
			const native = e.nativeEvent;
			const target = native.target as Element | null;
			try {
				if (target && typeof target.releasePointerCapture === "function") {
					target.releasePointerCapture(native.pointerId);
				}
			} catch {}
		}
	}, []);

	const handlePointerMove = useCallback(
		(e: ThreeEvent<PointerEvent>) => {
			// Always update aim point on hover (throttled)
			const now = performance.now();
			if (now - lastAimUpdate.current > 16) {
				lastAimUpdate.current = now;
				const p = e.point;
				if (p) setAim([p.x, p.y, p.z]);
			}

			if (!onRightClick) return;

			// If RMB held, also update move target (throttled ~30 Hz)
			const buttons: number | undefined = e.buttons ?? e?.nativeEvent?.buttons;
			const rmbHeld =
				rmbDown.current || (typeof buttons === "number" && (buttons & 2) === 2);
			if (!rmbHeld) return;
			if (now - lastUpdate.current < 33) return;
			lastUpdate.current = now;
			const p = e.point;
			if (p) updateFromPoint(p);
		},
		[setAim, updateFromPoint],
	);

	useEffect(() => {
		const onGlobalPointerUp = (ev: PointerEvent) => {
			if (ev.button === 2) rmbDown.current = false;
		};
		window.addEventListener("pointerup", onGlobalPointerUp);
		return () => window.removeEventListener("pointerup", onGlobalPointerUp);
	}, []);

	useFrame(({ raycaster, camera, pointer }) => {
		if (!hovering.current) return;
		const mesh = meshRef.current;
		if (!mesh) return;
		raycaster.setFromCamera(pointer, camera);
		const hit = raycaster.intersectObject(mesh, false)[0];
		if (!hit) return;
		const { point } = hit;
		const now = performance.now();
		if (now - lastAimUpdate.current > 16) {
			lastAimUpdate.current = now;
			setAim([point.x, point.y, point.z]);
		}
		if (onRightClick && rmbDown.current && now - lastUpdate.current > 33) {
			lastUpdate.current = now;
			updateFromPoint(point);
		}
	});

	return (
		<RigidBody type="fixed" colliders={false}>
			{/* Sol (violet) */}
			<mesh
				ref={meshRef}
				receiveShadow
				rotation={[-Math.PI / 2, 0, 0]}
				onPointerOver={(e: ThreeEvent<PointerEvent>) => {
					hovering.current = true;
					const p = e.point;
					if (p) setAim([p.x, p.y, p.z]);
				}}
				onPointerOut={() => {
					hovering.current = false;
					setAim(null);
				}}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				onPointerMove={handlePointerMove}
				onPointerLeave={() => {
					rmbDown.current = false;
					hovering.current = false;
					setAim(null);
				}}
			>
				<planeGeometry args={[SIZE_X, SIZE_Z]} />
				<meshStandardMaterial color={GROUND_COLOR} />
			</mesh>

			{/* Collider physique du sol */}
			<CuboidCollider
				args={[HALF_X, 0.1, HALF_Z]}
				position={[0, -0.05, 0]}
				friction={0.1}
				restitution={0}
			/>

			{/* Murs (violet foncé) */}
			{/* Nord */}
			<mesh castShadow receiveShadow position={[0, WALL_HEIGHT / 2, HALF_Z]}>
				<boxGeometry args={[SIZE_X, WALL_HEIGHT, WALL_THICKNESS]} />
				<meshStandardMaterial color={WALL_COLOR} />
			</mesh>
			<CuboidCollider
				args={[HALF_X, WALL_HEIGHT / 2, WALL_THICKNESS / 2]}
				position={[0, WALL_HEIGHT / 2, HALF_Z]}
				friction={0.1}
				restitution={0}
			/>

			{/* Sud */}
			<mesh castShadow receiveShadow position={[0, WALL_HEIGHT / 2, -HALF_Z]}>
				<boxGeometry args={[SIZE_X, WALL_HEIGHT, WALL_THICKNESS]} />
				<meshStandardMaterial color={WALL_COLOR} />
			</mesh>
			<CuboidCollider
				args={[HALF_X, WALL_HEIGHT / 2, WALL_THICKNESS / 2]}
				position={[0, WALL_HEIGHT / 2, -HALF_Z]}
				friction={0.1}
				restitution={0}
			/>

			{/* Est */}
			<mesh castShadow receiveShadow position={[HALF_X, WALL_HEIGHT / 2, 0]}>
				<boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, SIZE_Z]} />
				<meshStandardMaterial color={WALL_COLOR} />
			</mesh>
			<CuboidCollider
				args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF_Z]}
				position={[HALF_X, WALL_HEIGHT / 2, 0]}
				friction={0.1}
				restitution={0}
			/>

			{/* Ouest */}
			<mesh castShadow receiveShadow position={[-HALF_X, WALL_HEIGHT / 2, 0]}>
				<boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, SIZE_Z]} />
				<meshStandardMaterial color={WALL_COLOR} />
			</mesh>
			<CuboidCollider
				args={[WALL_THICKNESS / 2, WALL_HEIGHT / 2, HALF_Z]}
				position={[-HALF_X, WALL_HEIGHT / 2, 0]}
				friction={0.1}
				restitution={0}
			/>
		</RigidBody>
	);
}
