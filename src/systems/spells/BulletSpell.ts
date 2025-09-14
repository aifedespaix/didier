import {
	SpellBase,
	type SpellContext,
	type SpellResult,
} from "@/systems/spells/types";
import type { Character } from "@/systems/character/Character";

export interface BulletParams {
	speed: number;
	range: number;
	radius: number;
	damage: number;
}

export class BulletSpell extends SpellBase {
	constructor(
		private readonly params: BulletParams = {
			speed: 50,
			range: 30,
			radius: 0.2,
			damage: 10,
		},
	) {
		super({ id: "primary", cooldownMs: 200, name: "Bullet" });
	}

	getConfig(): BulletParams {
		return this.params;
	}

	protected execute(
		ctx: SpellContext,
		_self: Character,
		_now: number,
	): SpellResult {
		if (ctx.spawnProjectile) {
			ctx.spawnProjectile({
				kind: "bullet",
				speed: this.params.speed,
				range: this.params.range,
				radius: this.params.radius,
				damage: this.params.damage,
			});
		}
		return { ok: true, cooldownMs: this.cooldownMs };
	}
}

export default BulletSpell;
