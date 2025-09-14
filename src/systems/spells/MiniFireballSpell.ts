import type { Character } from "@/systems/character/Character";
import {
	SpellBase,
	type SpellContext,
	type SpellResult,
} from "@/systems/spells/types";

/**
 * Parameters controlling the small fireball projectile fired on left click.
 * All values are expressed using world units.
 */
export interface MiniFireballParams {
	speed: number;
	range: number;
	radius: number;
	damage: number;
}

/**
 * Spell used for the default left-click attack.
 * It launches a mini fireball towards the aimed direction.
 */
export class MiniFireballSpell extends SpellBase {
	constructor(
		private readonly params: MiniFireballParams = {
			speed: 50,
			range: 30,
			radius: 0.25,
			damage: 10,
		},
	) {
		super({ id: "primary", cooldownMs: 200, name: "Mini Fireball" });
	}

	getConfig(): MiniFireballParams {
		return this.params;
	}

	protected execute(
		ctx: SpellContext,
		_self: Character,
		_now: number,
	): SpellResult {
		if (ctx.spawnProjectile) {
			ctx.spawnProjectile({
				kind: "fireball",
				speed: this.params.speed,
				range: this.params.range,
				radius: this.params.radius,
				damage: this.params.damage,
			});
		}
		return { ok: true, cooldownMs: this.cooldownMs };
	}
}

export default MiniFireballSpell;
