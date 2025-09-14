"use client";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier } from "@react-three/rapier";
import type { RigidBodyApi } from "@react-three/rapier";
import { Quaternion, Vector3 } from "three";
import type { Group } from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MoveTarget } from "@/types/game";
import { CharacterModel } from "@/components/3d/actors/CharacterModel";
import { OverheadHealth } from "@/components/3d/hud/OverheadHealth";
import { CHARACTER_CLIP_HINTS } from "@/config/animations";
import { useActionPressed } from "@/3d/input/hooks";
import type { AnimStateId } from "@/types/animation";
import { buildDefaultCharacter } from "@/systems/character/defaults";
import { DashSpell } from "@/systems/spells/DashSpell";
import { useCharacterUI } from "@/stores/character-ui";
import { useAim } from "@/stores/aim";

export function Player({
	target,
	bodyRef,
	animOverrideRef,
	onCancelMove,
	onCastMagic,
	performCastRef,
	performDashRef,
}: {
	target: MoveTarget;
	bodyRef?: React.MutableRefObject<RigidBodyApi | null>;
	animOverrideRef?: React.MutableRefObject<AnimStateId | null>;
	onCancelMove?: () => void;
	onCastMagic?: () => void;
	/**
	 * Optional ref to expose a method that performs the non-mobility cast animation/lock and UI cooldown.
	 */
	performCastRef?: React.MutableRefObject<(() => void) | null>;
	/**
	 * Optional ref to expose dash trigger compliant with cast mode adapter.
	 */
	performDashRef?: React.MutableRefObject<(() => void) | null>;
}) {
	const internalBodyRef = useRef<RigidBodyApi | null>(null);
	const body = bodyRef ?? internalBodyRef;
	const visual = useRef<Group | null>(null);
	// Character configuration (speed/skin/dash)
	const character = useMemo(() => buildDefaultCharacter(), []);
	const speed = character.speed; // m/s en XZ (course normale)
	const DASH_SPEED = character.dashSpeed; // m/s en XZ (doit être > speed)
	const _DASH_DURATION_MS = character.dashDurationMs; // durée de l'effet dash
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
	const aimPoint = useAim((s) => s.point);
	const moveForward = useActionPressed("game.move.forward");
	const moveBack = useActionPressed("game.move.back");
	const moveLeft = useActionPressed("game.move.left");
	const moveRight = useActionPressed("game.move.right");
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
	// Géométrie du collider capsule (réutilisée pour les prédictions de collision)
	const capsuleRadius = 0.35 * RING_SCALE;
	const capsuleHalfHeight = Math.max(0.2, HALF_Y - capsuleRadius);

	// Keep external ref in sync (for P2P announcer)
	useEffect(() => {
		if (animOverrideRef) animOverrideRef.current = overrideAnim;
	}, [overrideAnim, animOverrideRef]);

	// Expose dash via ref for external input adapter (quick/semi/classic)
	useEffect(() => {
		if (!performDashRef) return;
		performDashRef.current = () => {
			const b = body.current;
			if (!b) return;
			try {
				onCancelMove?.();
			} catch {}
			// Face aim point if available before dash
			if (aimPoint && visual.current) {
				const t = b.translation();
				const dx = aimPoint[0] - t.x;
				const dz = aimPoint[2] - t.z;
				const len = Math.hypot(dx, dz);
				if (len > 1e-4) {
					const yaw = Math.atan2(dx / len, dz / len);
					const targetQ = new Quaternion().setFromAxisAngle(
						new Vector3(0, 1, 0),
						yaw,
					);
					visual.current.quaternion.copy(targetQ);
				}
			}
			const res = dashSpell.cast(
				{
					body: b,
					visualQuaternion: visual.current?.quaternion ?? null,
					setAnimOverride: (st, duration) => {
						setOverrideAnim(st);
						if (overrideTimer.current)
							window.clearTimeout(overrideTimer.current);
						if (duration && st) {
							overrideTimer.current = window.setTimeout(
								() => setOverrideAnim(null),
								duration,
							);
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
		};
		return () => {
			performDashRef.current = null;
		};
	}, [performDashRef, onCancelMove, character, setCooldownUntil, aimPoint]);

	// Expose performCast via ref for external input adapters (quick/semi/classic)
	useEffect(() => {
		if (!performCastRef) return;
		performCastRef.current = () => {
			// Face aim point if available before casting
			const b = body.current;
			if (b && aimPoint && visual.current) {
				const t = b.translation();
				const dx = aimPoint[0] - t.x;
				const dz = aimPoint[2] - t.z;
				const len = Math.hypot(dx, dz);
				if (len > 1e-4) {
					const yaw = Math.atan2(dx / len, dz / len);
					const targetQ = new Quaternion().setFromAxisAngle(
						new Vector3(0, 1, 0),
						yaw,
					);
					visual.current.quaternion.copy(targetQ);
				}
			}
			castingUntil.current = performance.now() + 600;
			setOverrideAnim("attack");
			if (overrideTimer.current) window.clearTimeout(overrideTimer.current);
			overrideTimer.current = window.setTimeout(
				() => setOverrideAnim(null),
				500,
			);
			try {
				onCancelMove?.();
			} catch {}
			try {
				onCastMagic?.();
			} catch {}
			setCooldownUntil("primary", performance.now() + 800);
		};
		return () => {
			performCastRef.current = null;
		};
	}, [performCastRef, onCancelMove, onCastMagic, setCooldownUntil]);

	useFrame((_state, dt) => {
		const b = body.current;
		if (!b) return;
		const t = b.translation();
		const lv = b.linvel();
		const now = performance.now();
		const inputX = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
		const inputZ = (moveBack ? 1 : 0) - (moveForward ? 1 : 0);
		const hasMoveInput = Math.abs(inputX) > 0 || Math.abs(inputZ) > 0;
		// Dash override: s'applique même si aucune cible n'est définie
		if (now < dashUntil.current) {
			// Vitesse désirée du dash (horizontale)
			let vx = dashDir.current.x * DASH_SPEED;
			let vz = dashDir.current.z * DASH_SPEED;

			// Prédire une collision imminente et glisser le long des obstacles
			if (world && rapier) {
				try {
					const shape = new rapier.Capsule(capsuleHalfHeight, capsuleRadius);
					const shapePos = { x: t.x, y: t.y, z: t.z } as const;
					const shapeRot = new rapier.Quaternion(0, 0, 0, 1);
					const shapeVel = new rapier.Vector3(vx, 0, vz);
					const targetDistance = 0.01;
					const lookAhead = Math.min(0.12, dt * 2 + 0.02);
					const hit = world.castShape(
						shapePos,
						shapeRot,
						shapeVel,
						shape,
						targetDistance,
						lookAhead,
						true,
						undefined,
						undefined,
						undefined,
						undefined,
						(col) => {
							const parent = (col as { parent?: () => unknown }).parent?.();
							return parent ? parent !== (b as unknown) : true;
						},
					);
					if (hit) {
						const n = hit.normal1;
						const dot = vx * n.x + vz * n.z;
						let sx = vx - dot * n.x;
						let sz = vz - dot * n.z;
						const sLen = Math.hypot(sx, sz);
						if (sLen > 1e-4) {
							const k = Math.min(DASH_SPEED, sLen) / sLen;
							vx = sx * k;
							vz = sz * k;
						} else {
							vx = 0;
							vz = 0;
						}
					}
				} catch {}
			}

			b.setLinvel({ x: vx, y: lv.y, z: vz }, true);
		} else {
			// Si on est en train d'incanter (sort immobile): stopper mouvement horizontal
			if (now < castingUntil.current) {
				if (Math.abs(lv.x) > 0.001 || Math.abs(lv.z) > 0.001) {
					b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
				}
				// Orientation smoothing still happens below
			} else if (hasMoveInput) {
				try {
					onCancelMove?.();
				} catch {}
				const len = Math.hypot(inputX, inputZ);
				if (len > 0) {
					const yaw = visual.current?.rotation.y ?? 0;
					const cos = Math.cos(yaw);
					const sin = Math.sin(yaw);
					const worldX = (inputX / len) * cos + (inputZ / len) * sin;
					const worldZ = (inputZ / len) * cos - (inputX / len) * sin;
					b.setLinvel({ x: worldX * speed, y: lv.y, z: worldZ * speed }, true);
				} else if (Math.abs(lv.x) > 0.001 || Math.abs(lv.z) > 0.001) {
					b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
				}
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
						{ x: nx, y: 0, z: nz },
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
								{ x: rx, y: 0, z: rz },
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
									{ x: rx, y: 0, z: rz },
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
				b.setLinvel(
					{ x: (dirX / len) * speed, y: lv.y, z: (dirZ / len) * speed },
					true,
				);
			}
		}

		// Orientation visuelle: priorité au pointeur, sinon direction de déplacement
		const v2 = lv.x * lv.x + lv.z * lv.z;
		if (visual.current) {
			let targetYaw: number | null = null;
			if (aimPoint) {
				const ax = aimPoint[0] - t.x;
				const az = aimPoint[2] - t.z;
				if (ax * ax + az * az > 1e-6) {
					targetYaw = Math.atan2(ax, az);
				}
			}
			if (targetYaw === null && v2 > 1e-6) {
				targetYaw = Math.atan2(lv.x, lv.z);
			}
			if (targetYaw !== null) {
				const targetQ = new Quaternion().setFromAxisAngle(
					new Vector3(0, 1, 0),
					targetYaw,
				);
				const rotSmoothing = 12;
				const alpha = 1 - Math.exp(-rotSmoothing * dt);
				visual.current.quaternion.slerp(targetQ, alpha);
			}
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
			let bestDirX = 0,
				bestDirZ = 0,
				bestToi = -1;
			// Scanner 16 directions autour pour trouver la plus dégagée
			for (let i = 0; i < 16; i++) {
				const a = (i / 16) * Math.PI * 2;
				const rx = Math.sin(a);
				const rz = Math.cos(a);
				const ray = new rapier.Ray(
					{ x: t.x, y: originY, z: t.z },
					{ x: rx, y: 0, z: rz },
				);
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
			b.setTranslation(
				{ x: t.x + bestDirX * step, y: t.y, z: t.z + bestDirZ * step },
				true,
			);
			b.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
			lastNudgeAt.current = now;
			// Reset du timer de mouvement: laisser 150 ms avant une nouvelle tentative
			lastGoodMoveAt.current = now + 150;
		}
	});

	return (
		<RigidBody
			// biome-ignore lint/suspicious/noExplicitAny: R3F ref typing
			ref={body as any}
			position={[0, 3, 0]}
			ccd
			softCcdPrediction={0.5}
			canSleep={false}
			enabledRotations={[false, false, false]}
		>
			{/* Collider joueur: capsule (meilleure glisse le long des murs) */}
			{(() => (
				// Capsule verticale: demi-hauteur (sans les calottes) et rayon
				<CapsuleCollider
					args={[capsuleHalfHeight, capsuleRadius]}
					friction={0}
					restitution={0}
					contactSkin={0.02}
				/>
			))()}
			{/* Visuel */}
			<group ref={visual}>
				{/* UX: blue translucent ground ring (annulus) under local player */}
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					position={[0, -(HALF_Y + 0.02), 0]}
					receiveShadow
				>
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
