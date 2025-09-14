import type { RigidBodyApi } from "@react-three/rapier";
import type { Quaternion } from "three";
import type { Character } from "@/systems/character/Character";
import type { AnimStateId } from "@/types/animation";

export type SpellId = "dash" | "primary" | "secondary" | "ultimate";

export interface SpellContext {
	body: RigidBodyApi;
	visualQuaternion: Quaternion | null | undefined;
	setAnimOverride: (state: AnimStateId | null, durationMs?: number) => void;
	nowMs?: number;
	spawnProjectile?: (params: {
		kind: "magic-bolt" | "fireball" | string;
		speed: number;
		range: number;
		radius: number;
		damage: number;
	}) => void;
}

export interface SpellResult {
	ok: boolean;
	cooldownMs?: number;
	dash?: { dir: { x: number; z: number }; until: number };
}

export interface SpellDefInit {
	id: SpellId;
	cooldownMs: number;
	name?: string;
}

export abstract class SpellBase {
	readonly id: SpellId;
	readonly cooldownMs: number;
	readonly name?: string;
	protected lastCastAt = 0;

	constructor(init: SpellDefInit) {
		this.id = init.id;
		this.cooldownMs = init.cooldownMs;
		this.name = init.name;
	}

	canCast(now: number): boolean {
		return now - this.lastCastAt >= this.cooldownMs;
	}

	cast(ctx: SpellContext, self: Character): SpellResult {
		const now = ctx.nowMs ?? performance.now();
		if (!this.canCast(now)) {
			return {
				ok: false,
				cooldownMs: Math.max(0, this.cooldownMs - (now - this.lastCastAt)),
			};
		}
		const res = this.execute(ctx, self, now);
		if (res.ok) this.lastCastAt = now;
		return res;
	}

	protected abstract execute(
		ctx: SpellContext,
		self: Character,
		now: number,
	): SpellResult;
}

export default SpellBase;
